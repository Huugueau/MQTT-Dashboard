import time
import json
import socket
import paho.mqtt.client as mqtt
from datetime import datetime
from uuid import getnode as get_mac

BROKER = "localhost"
PORT = 4444
DEVICE_ID = socket.gethostname()

int_mac = get_mac()
MAC = int_mac

print(MAC)

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=f"subscriber-{DEVICE_ID}"
)
client.connect(BROKER, PORT)
print(f"Connecté au broker {BROKER}:{PORT}")


def readTen():
    import random

    temps = [random.randint(20, 30) for _ in range(10)]
    hums  = [random.randint(10, 100) for _ in range(10)]

    return sum(temps)/10, sum(hums)/10

try:
    while True:
        avgTemp, avgHum = readTen()
        heure   = datetime.now().isoformat()

        metrics = {
            "MAC_ADDRESS": MAC,
            "TIMESTAMP":   heure,
            "METRICS": {
                "TEMPERATURE": round(avgTemp, 2),
                "HUMIDITY":    round(avgHum, 2)
            }
        }

        client.publish("device/HT", json.dumps(metrics))
        print(f"\n→ Envoyé  {heure}  {avgTemp:.1f}°C  {avgHum:.1f}%")

        time.sleep(10)

except KeyboardInterrupt:
    print("\nEnd")
