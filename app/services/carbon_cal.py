def calculate_daily_carbon(data, emission_factor=0.82):
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
        co2 = units * emission_factor

        if day in result:
            result[day] += co2
        else:
            result[day] = co2

    return result