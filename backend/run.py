import os
from app import create_app

print("========== RUN.PY LOADED ==========")

app = create_app()

print("========== APP CREATED ==========")
print(app.url_map)

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )