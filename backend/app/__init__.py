import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from app.models import db

logger = logging.getLogger(__name__)

def create_app(config_class='config.Config'):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # -----------------------------------------------------------
    # CORS: support dev (5173, 5174) + production Vercel frontend
    # -----------------------------------------------------------
    origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "https://career-ai-rho-rouge.vercel.app",
        "https://career-ai-git-main-sweetyroselin03-projects.vercel.app",
        "https://career-ai-git-main-sweetyroselin03s-projects.vercel.app",
        "https://career-6nyu3fe8g-sweetyroselin03-projects.vercel.app"
    ]
    frontend_url = os.environ.get("FRONTEND_URL")
    if frontend_url:
        origins.append(frontend_url)
        if frontend_url.endswith('/'):
            origins.append(frontend_url[:-1])

    CORS(
        app,
        resources={r"/*": {
            "origins": origins,
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }},
        supports_credentials=True
    )

    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    # Initialize DB
    db.init_app(app)
    migrate = Migrate(app, db)

    # -----------------------------------------------------------
    # Startup: verify DB, run migrations, create tables, then
    # DISPOSE all connections so the first real request gets fresh ones.
    # -----------------------------------------------------------
    with app.app_context():
        try:
            db.session.execute(db.text('SELECT 1'))
            db.session.commit()
            print("[STARTUP] Database connection verified.")

            import app.models as models

            try:
                from flask_migrate import upgrade as flask_migrate_upgrade
                flask_migrate_upgrade()
                print("[STARTUP] Migrations applied successfully.")
            except Exception as mig_err:
                print(f"[STARTUP] Migration warning: {mig_err}. Running db.create_all().")
                db.create_all()

            db.create_all()

            # Automatic seeding of skills, careers, courses
            from app.models import Skill
            try:
                if not Skill.query.first():
                    print("[STARTUP] Skill table is empty. Seeding database with default data...")
                    import sys
                    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                    if backend_dir not in sys.path:
                        sys.path.append(backend_dir)
                    from train_model import seed_database, train_and_save_recommendation_models
                    seed_database(app)
                    try:
                        train_and_save_recommendation_models()
                    except Exception as train_err:
                        print(f"[STARTUP WARNING] Model training failed, but database was seeded: {train_err}")
            except Exception as seed_err:
                print(f"[STARTUP ERROR] Database seeding check/action failed: {seed_err}")


            # Dynamic schema check & migrations for UserProfile
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            
            if 'user_profiles' in inspector.get_table_names():
                columns = [col['name'] for col in inspector.get_columns('user_profiles')]
                new_cols = {
                    'github': 'VARCHAR(255)',
                    'linkedin': 'VARCHAR(255)',
                    'portfolio': 'VARCHAR(255)',
                    'certifications_json': 'TEXT',
                    'projects_json': 'TEXT'
                }
                for col_name, col_type in new_cols.items():
                    if col_name not in columns:
                        print(f"[STARTUP] Column '{col_name}' is missing in user_profiles. Adding it.")
                        try:
                            # Use default value of '[]' for json text fields to avoid null issues
                            default_clause = " DEFAULT '[]'" if col_name.endswith('_json') else ""
                            db.session.execute(db.text(f"ALTER TABLE user_profiles ADD COLUMN {col_name} {col_type}{default_clause}"))
                            db.session.commit()
                            print(f"[STARTUP] Added column '{col_name}' successfully.")
                        except Exception as alter_err:
                            db.session.rollback()
                            print(f"[STARTUP ERROR] Failed to add column '{col_name}': {alter_err}")

            tables = inspector.get_table_names()
            print(f"[STARTUP] Tables: {', '.join(tables)}")

            # Diagnostics moved to end of create_app
            pass

        except Exception as e:
            print(f"[STARTUP ERROR] Database init failed: {e}")
        finally:
            # CRITICAL: dispose startup connections so they don't go stale
            # before the first real request arrives (could be minutes later).
            db.session.remove()
            db.engine.dispose()
            print("[STARTUP] Connection pool disposed. First request will get a fresh connection.")

    # -----------------------------------------------------------
    # Before each request: ensure the DB session is alive.
    # If pool_pre_ping detects a dead connection, SQLAlchemy will
    # transparently reconnect. This before_request adds an extra
    # safety layer by catching the error, disposing, and allowing
    # the request to proceed with a fresh connection.
    # -----------------------------------------------------------
    @app.before_request
    def ensure_db_connection():
        try:
            db.session.execute(db.text('SELECT 1'))
            db.session.commit()
        except Exception as e:
            error_msg = str(e).lower()
            if any(phrase in error_msg for phrase in [
                'ssl connection has been closed',
                'connection reset',
                'server closed the connection',
                'could not connect to server',
                'broken pipe',
                'operationalerror',
            ]):
                logger.warning(f"[DB-HEALTH] Stale connection detected, recycling: {e}")
                try:
                    db.session.rollback()
                    db.session.remove()
                    db.engine.dispose()
                except Exception:
                    pass
                # After dispose, SQLAlchemy will create a fresh connection
                # when the route handler makes its first query.
            else:
                logger.error(f"[DB-HEALTH] Unexpected DB error in before_request: {e}")

    # -----------------------------------------------------------
    # After each request: clean up the session to return the
    # connection to the pool. This prevents stale sessions from
    # accumulating across requests.
    # -----------------------------------------------------------
    @app.teardown_appcontext
    def shutdown_session(exception=None):
        if exception:
            try:
                db.session.rollback()
            except Exception:
                pass
        db.session.remove()

    # -----------------------------------------------------------
    # Global error handler: catch DB errors and return clean JSON
    # instead of ugly stack traces. No retry-inside-errorhandler
    # (that causes infinite recursion).
    # -----------------------------------------------------------
    @app.errorhandler(Exception)
    def handle_exception(error):
        from sqlalchemy.exc import OperationalError, DisconnectionError

        if isinstance(error, (OperationalError, DisconnectionError)):
            logger.error(f"[DB-ERROR] {error}")
            # Clean up the broken session
            try:
                db.session.rollback()
                db.session.remove()
                db.engine.dispose()
            except Exception:
                pass
            return jsonify({
                "msg": "Database connection error. Please retry your request.",
                "error": "db_connection_error"
            }), 503

        # Let Flask handle other errors normally
        raise error

    # -----------------------------------------------------------
    # JWT
    # -----------------------------------------------------------
    jwt = JWTManager(app)

    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        logger.debug(f"[JWT] Token validated. User ID: {identity}")
        from app.models import User
        return db.session.get(User, int(identity))

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"msg": "Token has expired", "error": "token_expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"msg": f"Invalid token: {error}", "error": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return jsonify({"msg": "Missing authorization header", "error": "unauthorized"}), 401

    # -----------------------------------------------------------
    # Blueprints
    # -----------------------------------------------------------
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.recommendations import recommendation_bp
    from app.routes.resume import resume_bp
    from app.routes.chatbot import chatbot_bp
    from app.routes.admin import admin_bp
    from app.routes.ai import ai_bp
    from app.routes.health import health_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(recommendation_bp, url_prefix='/api/recommendations')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(health_bp, url_prefix='/api')

    # -----------------------------------------------------------
    # Utility routes
    # -----------------------------------------------------------
    @app.route("/")
    def home():
        return {"status": "ok", "message": "CareerAI Backend Running"}

    @app.route("/debug-render")
    def debug_render():
        return {
            "message": "NEW CODE DEPLOYED",
            "version": "2026-06-14-v2"
        }

    @app.route("/deployment-check")
    def deployment_check():
        routes_count = len(list(app.url_map.iter_rules()))
        return {
            "status": "ok",
            "environment": "render",
            "routes_count": routes_count
        }

    # -----------------------------------------------------------
    # Startup Validation & Diagnostics
    # -----------------------------------------------------------
    print("\n========== STARTUP VALIDATION ==========")
    
    # A. Environment variable validation
    required_vars = [
        "DATABASE_URL",
        "SECRET_KEY",
        "JWT_SECRET_KEY",
        "GROQ_API_KEY"
    ]
    missing_vars = [var for var in required_vars if not os.getenv(var)]
    if missing_vars:
        print(f"[VALIDATION WARNING] Missing environment variables: {', '.join(missing_vars)}")
    else:
        print("[VALIDATION] All required environment variables are set.")

    # B. Blueprint registration test
    required_blueprints = ["auth", "profile", "ai", "admin", "health"]
    registered_blueprints = list(app.blueprints.keys())
    missing_blueprints = [bp for bp in required_blueprints if bp not in registered_blueprints]
    if missing_blueprints:
        print(f"[VALIDATION ERROR] Missing required blueprints: {', '.join(missing_blueprints)}")
    else:
        print("[VALIDATION] All required blueprints are registered.")

    # C. Database connection test
    with app.app_context():
        try:
            db.session.execute(db.text('SELECT 1'))
            db.session.commit()
            print("[VALIDATION] Database connection check: SUCCESS")
        except Exception as db_err:
            print(f"[VALIDATION ERROR] Database connection check: FAILED. Error: {db_err}")
            
    print("========================================\n")

    print("========== REGISTERED URL ROUTES ==========")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint} -> {rule}")
    print("===========================================\n")

    return app
