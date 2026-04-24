def check_high_usage(units, threshold=10):
    if units > threshold:
        return "⚠️ High usage"
    return "✅ Normal"