def calculate_daily_energy(data):
    result = {}

    for item in data:
        day = item.get("day", "unknown")

        try:
            wattage = float(item.get("Wattage", 0))
            hours = float(item.get("Utilization Hours", 0))
        except:
            wattage = 0
            hours = 0

        units = (wattage * hours) / 1000

        result[day] = result.get(day, 0) + units

    return result