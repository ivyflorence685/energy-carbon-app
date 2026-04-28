from flask import Blueprint, render_template, jsonify, current_app
import json

main_routes = Blueprint('main', __name__)

@main_routes.route("/")
def dashboard():
    return render_template("index.html")

@main_routes.route("/data")
def get_data():
    data_path = current_app.config["DATA_PATH"]
    
    with open(data_path, "r") as f:
        data = json.load(f)
    
    return jsonify(data)
    