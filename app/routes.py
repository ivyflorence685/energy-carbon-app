from flask import Blueprint, render_template, jsonify, current_app
import json,statistics

main_routes = Blueprint('main', __name__)

@main_routes.route("/")
def dashboard():
    return render_template("index.html")

@main_routes.route("/dashboard")
def dashboard_page():

    with open("public/data/appliance_usage.json") as f:
        data = json.load(f)

    insights = generate_insights(data)

    # Extract values (⚠️ match your JSON keys exactly)
    energy = [float(d["Energy Consumption in units"]) for d in data]
    carbon = [float(d["CO2 emissions in kg"]) for d in data]
    usage = [float(d["Utilization Hours"]) for d in data]

    return render_template(
        "dashboard.html",
        energy=calculate(energy),
        carbon=calculate(carbon),
        usage=calculate(usage),
        insights=insights
    )
    

@main_routes.route("/data")
def get_data():
    data_path = current_app.config["DATA_PATH"]
    
    with open(data_path, "r") as f:
        data = json.load(f)
    
    return jsonify(data)

def calculate(values):
    return {
        "mean": round(statistics.mean(values), 2),
        "std": round(statistics.stdev(values), 2),
        "min": min(values),
        "max": max(values)
    }

def generate_insights(data):

    appliance_energy = {}
    room_energy = {}
    daily_energy = []

    for item in data:
        appliance = item["Appliance"]
        room = item["Room"]
        energy = float(item["Energy Consumption in units"])

        # Appliance aggregation
        appliance_energy[appliance] = appliance_energy.get(appliance, 0) + energy

        # Room aggregation
        room_energy[room] = room_energy.get(room, 0) + energy

        daily_energy.append(energy)

    # 🔹 Insights
    top_appliance = max(appliance_energy, key=appliance_energy.get)
    top_room = max(room_energy, key=room_energy.get)

    avg_energy = round(statistics.mean(daily_energy), 2)
    variability = round(statistics.stdev(daily_energy), 2)

    if variability > 1:
        pattern = "highly variable"
    else:
        pattern = "consistent"

    return {
        "top_appliance": top_appliance,
        "top_room": top_room,
        "avg_energy": avg_energy,
        "pattern": pattern
    }



    
