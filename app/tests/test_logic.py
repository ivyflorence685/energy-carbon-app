from app.services.energy_cal import calculate_daily_energy
from app.services.carbon_cal import calculate_daily_carbon

# sample input data
sample_data = [
    {"day": "day_1", "Wattage": "100", "Utilization Hours": "5"},
    {"day": "day_1", "Wattage": "60", "Utilization Hours": "3"},
    {"day": "day_2", "Wattage": "120", "Utilization Hours": "2"}
]

print("STARTING TEST...")

energy = calculate_daily_energy(sample_data)
carbon = calculate_daily_carbon(sample_data)

print("Energy Output:", energy)
print("Carbon Output:", carbon)