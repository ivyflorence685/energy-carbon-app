def get_float_input(prompt):
    try:
        return float(input(prompt))
    except ValueError:
        print("Invalid input! Please enter numbers only.")
        return 0

electricity = get_float_input("Enter electricity: ")
fuel = get_float_input("Enter fuel: ")
production = get_float_input("Enter production: ")

elec_factor = 0.82
fuel_factor = 2.31
production_factor = 1.5

total = (electricity * elec_factor) + (fuel * fuel_factor) + (production * production_factor)

print("Total emission:", total)