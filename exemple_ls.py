import time
import json
import socket
import paho.mqtt.client as mqtt
from datetime import datetime
from uuid import getnode as get_mac

BROKER = "127.0.0.1"
PORT = 4444
DEVICE_ID = socket.gethostname()

MAC = "C9:D2:D6:F6:F1:FF"

print(MAC)

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=f"subscriber-{DEVICE_ID}"
)
client.connect(BROKER, PORT)
print(f"Connecté au broker {BROKER}:{PORT}")


def readTen():
    import random

    sounds = [random.randint(45, 55) for _ in range(10)]
    lights  = [random.randint(600, 750) for _ in range(10)]

    return sum(sounds)/10, sum(lights)/10

try:
    while True:
        avgSound, avgLight = readTen()
        heure   = datetime.now().isoformat()

        metrics = {
            "MAC_ADDRESS": MAC,
            "TIMESTAMP":   heure,
            "METRICS": {
                "SOUND": round(avgSound, 2),
                "LIGHT":    round(avgLight, 2)
            }
        }

        client.publish("device/LS", json.dumps(metrics))
        print(f"\n→ Envoyé  {heure}  {avgSound:.1f} dB  {avgLight:.1f} lux")

        time.sleep(10)

except KeyboardInterrupt:
    print("\nEnd")
