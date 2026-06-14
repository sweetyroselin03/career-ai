import os
from flask import Flask, jsonify
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from app.models import db

def create_app(config_class='config.Config'):
    app = Flask(__name__)
    @app.after_request
    def after_request(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        return response
    app.config.from_object(config_class)
    
    # Configure CORS
    CORS(
    app,
    resources={r"/*": {"origins": "*"}},
    supports_credentials=True,
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)
    
    # Ensure upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Initialize DB
    db.init_app(app)
    migrate = Migrate(app, db)
    
    # Verify Database Connection, Run Migrations, and Auto-Create Tables
    with app.app_context():
        try:
            # 1. Verify Connection
            db.session.execute(db.text('SELECT 1'))
            print("[INFO] PostgreSQL Connection Verification Succeeded!")
            
            # 2. Ensure SQLAlchemy models are imported before db.create_all()
            import app.models as models
            
            # 3. Run migrations automatically during development
            try:
                from flask_migrate import upgrade as flask_migrate_upgrade
                flask_migrate_upgrade()
                print("[INFO] Database migrations checked and applied successfully!")
            except Exception as migration_error:
                print(f"[WARNING] Automatic migration upgrade encountered issues: {migration_error}. Attempting db.create_all().")
                db.create_all()
                
            # 4. Create all database tables automatically on startup if they do not exist
            db.create_all()
            
            # 5. Add startup logging showing which tables were created/loaded
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            print(f"[INFO] Database tables loaded: {', '.join(tables)}")
            
        except Exception as e:
            print(f"[ERROR] Database initialization failed on startup: {e}")
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Handle JWT validation success and log it
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        identity = jwt_data["sub"]
        print(f"[JWT] Token validated successfully. User identity (sub): {identity}")
        # Return User model so it is available via current_user
        from app.models import User
        return User.query.get(int(identity))

    # Handle JWT error messaging nicely
    @jwt.expired_token_loader
    def my_expired_token_callback(jwt_header, jwt_payload):
        print(f"[JWT] Authentication failed: Token has expired. Payload: {jwt_payload}")
        return jsonify({"msg": "Token has expired", "error": "token_expired"}), 401
        
    @jwt.invalid_token_loader
    def my_invalid_token_callback(error):
        print(f"[JWT] Authentication failed: Invalid token. Error: {error}")
        return jsonify({"msg": f"Invalid token: {error}", "error": "invalid_token"}), 401

    @jwt.unauthorized_loader
    def my_unauthorized_callback(error):
        print(f"[JWT] Authentication failed: Missing authorization header. Error: {error}")
        return jsonify({"msg": "Missing authorization header", "error": "unauthorized"}), 401
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.profile import profile_bp
    from app.routes.recommendations import rec_bp
    from app.routes.resume import resume_bp
    from app.routes.chatbot import chatbot_bp
    from app.routes.admin import admin_bp
    from app.routes.ai import ai_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(profile_bp, url_prefix='/api/profile')
    app.register_blueprint(rec_bp, url_prefix='/api/recommendations')
    app.register_blueprint(resume_bp, url_prefix='/api/resume')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    
    @app.route("/")
    def home():
        return {
            "status":"ok",
            "message":"CareerAI Backend Running"
        }

    @app.route("/api/health")
    def health():
        return {
            "status":"healthy",
            "message":"CareerAI Navigator API is online"
        }

    @app.route("/debug-render")
    def debug_render():
        return {
            "message":"NEW CODE DEPLOYED",
            "version":"2026-06-12"
        }

    return app

