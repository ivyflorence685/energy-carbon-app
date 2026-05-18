import json
from app.utils.alerts import check_high_usage

# Load JSON data
def load_data():
    with open("data/appliance_usage.json") as f:
        return json.load(f)

# Process energy usage per day
def calculate_daily_units(data):
    result = {}

    for entry in data:
        day = entry["day"]

        # Convert string → float
        watts = float(entry["Wattage"])
        hours = float(entry["Utilization Hours"])

        units = (watts * hours) / 1000  # kWh

        if day not in result:
            result[day] = {
                "units": 0,
                "alert": ""
            }

        result[day]["units"] += units

    # Add alerts
    for day in result:
        result[day]["alert"] = check_high_usage(result[day]["units"])

    return result

# Convert to chart-friendly format
def prepare_chart_data(processed_data):
    labels = []
    values = []
    alerts = []

    for day, info in processed_data.items():
        labels.append(day)
        values.append(round(info["units"], 2))
        alerts.append(info["alert"])

    return {
        "labels": labels,
        "values": values,
        "alerts": alerts
    }

# Save output
def save_output(data):
    with open("data/processed_data.json", "w") as f:
        json.dump(data, f, indent=4)

# Main execution
if __name__ == "__main__":
    data = load_data()
    processed = calculate_daily_units(data)
    chart_data = prepare_chart_data(processed)
    save_output(chart_data)

    print("✅ Processed data saved successfully!")