import os
from app import create_app

print("========== RUN.PY LOADED ==========")

app = create_app()

print("========== APP CREATED ==========")

if __name__ == "__main__":
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=True,
        use_reloader=False
    )