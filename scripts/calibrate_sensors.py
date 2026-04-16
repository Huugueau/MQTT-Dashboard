import grovepi
import time
import math
 
LIGHT_SENSOR = 0
SOUND_SENSOR = 1
 
SAMPLE_SOUND = 200
MEASURE_TIME = 30  # seconds
 
 
def measure_light(duration):
    values = []
    start = time.time()
 
    while time.time() - start < duration:
        values.append(grovepi.analogRead(LIGHT_SENSOR))
        time.sleep(0.2)
 
    avg = sum(values) / len(values)
    return avg
 
 
def measure_sound_rms(samples):
    values = []
 
    for _ in range(samples):
        values.append(grovepi.analogRead(SOUND_SENSOR))
        time.sleep(0.001)
 
    mean = sum(values) / len(values)
    variance = sum((x - mean) ** 2 for x in values) / len(values)
    rms = math.sqrt(variance)
 
    return rms
 
 
print("\n=== SENSOR CALIBRATION MODE ===")
print("Measuring environment for", MEASURE_TIME, "seconds...")
print("Stay still and quiet during sound measurement.\n")
 
# Measure light
light_avg = measure_light(MEASURE_TIME)
 
# Measure sound
sound_rms = measure_sound_rms(SAMPLE_SOUND)
 
print("\n--- RAW MEASUREMENTS ---")
print(f"Average Light ADC: {light_avg:.2f}")
print(f"Sound RMS: {sound_rms:.2f}")
 
print("\nNow check your phone apps.")
 
real_lux = float(input("Enter real LUX value from phone app: "))
real_db = float(input("Enter real dB value from phone app: "))
 
# Compute calibration constants
# Light model: lux = A * adc^B (simplified linear for 1 point)
A_light = real_lux / light_avg
 
# Sound model: dB = a * RMS + b
# Since we only have one point, assume b = 0
a_sound = real_db / sound_rms
 
print("\n=== CALIBRATION CONSTANTS ===")
print(f"LIGHT_MULTIPLIER = {A_light:.6f}")
print(f"SOUND_MULTIPLIER = {a_sound:.6f}")
 
print("\nUse these in your main script like this:")
print("lux = LIGHT_MULTIPLIER * raw_light")
print("db = SOUND_MULTIPLIER * rms_sound")

