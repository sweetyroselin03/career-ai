from app import create_app

app = create_app()

print("URL Map on startup:")
print(app.url_map)

if __name__ == "__main__":
    app.run()