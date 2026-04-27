# app/models.py

class ApplianceUsage:
    def __init__(self, data: dict):
        self.day = data.get("day", "unknown")

        self.wattage = self._to_float(data.get("Wattage"))
        self.util_hours = self._to_float(data.get("Utilization Hours"))
        self.energy_units = self._to_float(data.get("Energy Consumption in units"))
        self.co2 = self._to_float(data.get("CO2 emissions in kg"))

    def _to_float(self, value):
        try:
            if value is None or value == "":
                return 0.0
            val = float(value)
            return max(0.0, val)  # avoid negatives
        except (ValueError, TypeError):
            return 0.0

    def compute_energy_if_missing(self):
        if self.energy_units == 0:
            self.energy_units = (self.wattage * self.util_hours) / 1000

    def compute_co2_if_missing(self, emission_factor):
        if self.co2 == 0:
            if self.energy_units == 0:
                self.compute_energy_if_missing()
            self.co2 = self.energy_units * emission_factor# app/models.py

class ApplianceUsage:
    def __init__(self, data: dict):
        self.day = data.get("day", "unknown")

        self.wattage = self._to_float(data.get("Wattage"))
        self.util_hours = self._to_float(data.get("Utilization Hours"))
        self.energy_units = self._to_float(data.get("Energy Consumption in units"))
        self.co2 = self._to_float(data.get("CO2 emissions in kg"))

    def _to_float(self, value):
        try:
            if value is None or value == "":
                return 0.0
            val = float(value)
            return max(0.0, val)  # avoid negatives
        except (ValueError, TypeError):
            return 0.0

    def compute_energy_if_missing(self):
        if self.energy_units == 0:
            self.energy_units = (self.wattage * self.util_hours) / 1000

    def compute_co2_if_missing(self, emission_factor):
        if self.co2 == 0:
            if self.energy_units == 0:
                self.compute_energy_if_missing()
            self.co2 = self.energy_units * emission_factor