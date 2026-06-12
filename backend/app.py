# WARNING: This file is kept for local execution or fallback commands only.
# In Python, if a package folder 'app/' and a module file 'app.py' share the same name in the same directory,
# importing 'app' will favor the package 'app/'. Running 'gunicorn app:app' will fail.
# Use 'gunicorn run:app' with the Root Directory set to 'backend' for deployment.

from run import app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)