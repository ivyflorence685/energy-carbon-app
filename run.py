from flask import Flask
from app.routes.main_routes import main_routes

app = Flask(__name__,template_folder="app/frontend/templates",static_folder="app/frontend/static")

app.config["DATA_PATH"] = "data/appliance_usage.json"


app.register_blueprint(main_routes)

if __name__ == "__main__":
    app.run(debug=True)