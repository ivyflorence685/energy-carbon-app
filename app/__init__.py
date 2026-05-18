import os
from flask import Flask

def create_app():
    app = Flask(__name__)

    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    app.config["DATA_PATH"] = os.path.join(BASE_DIR, "..", "public", "data", "appliance_usage.json")

    from app.routes.main_routes import main_routes
    app.register_blueprint(main_routes)

    return app