import os
from flask import Flask

def create_app():
    app = Flask(__name__, template_folder="frontend/templates", static_folder="frontend/static")

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    app.config["DATA_PATH"] = os.path.join(BASE_DIR, "..", "data", "appliance_usage.json")

    from app.routes.main_routes import main_routes
    app.register_blueprint(main_routes)

    return app