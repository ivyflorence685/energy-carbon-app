from flask import Blueprint, render_template, jsonify, current_app, request
import json, statistics

main_routes = Blueprint("main_routes",__name__,template_folder='../templates', static_folder='../static')


# =========================================
# MAIN DASHBOARD
# =========================================
@main_routes.route("/")
def dashboard():
    return render_template("index.html")


# =========================================
# ROOM DASHBOARD
# =========================================
@main_routes.route("/room")
def room_dashboard():

    room_name = request.args.get("room")
    return render_template("room-dashboard.html",room_name=room_name)

# =========================================
# DATA API
# ========================================= 
@main_routes.route("/data")
def get_data():
    data_path = current_app.config["DATA_PATH"]
    
    with open(data_path, "r") as f:
        data = json.load(f)
    
    return jsonify(data)





    
