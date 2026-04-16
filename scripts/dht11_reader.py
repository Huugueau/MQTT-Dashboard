import time
import board
import adafruit_dht
import json
import socket
import paho.mqtt.client as mqtt
from datetime import datetime
from uuid import getnode as get_mac

BROKER = "87.106.23.178"
PORT = 1883
DEVICE_ID = socket.gethostname()

int_mac = get_mac()
MAC = ':'.join(['{:02x}'.format((int_mac >> i) & 0xff) for i in range(0,48,8)][::-1])


print(MAC)

client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=f"subscriber-{DEVICE_ID}"
)
client.connect(BROKER, PORT)
print(f"Connecté au broker {BROKER}:{PORT}")

NB_LECTURES = 5
INTERVALLE = 10 // NB_LECTURES

def lire_capteur():
    """Crée, lit et libère proprement le capteur. Retourne (temp, hum) ou (None, None)."""
    capteur = None
    try:
        capteur = adafruit_dht.DHT11(board.D2)
        time.sleep(0.5)  # petite pause pour laisser le GPIO s'initialiser
        temperature = capteur.temperature
        humidite    = capteur.humidity
        return temperature, humidite
    except Exception as e:
        print(f"    [erreur capteur] {e}")
        return None, None
    finally:
        if capteur is not None:
            try:
                capteur.exit()
            except Exception:
                pass
        time.sleep(0.5)  # pause après libération du GPIO

try:
    while True:
        tempList = []
        humList  = []

        print(f"\n--- Nouvelle collecte ({NB_LECTURES} lectures x {INTERVALLE}s) ---")

        for i in range(NB_LECTURES):
            temperature, humidite = lire_capteur()

            if temperature is not None:
                tempList.append(temperature)
                humList.append(humidite)
                print(f"  Lecture {i+1}/{NB_LECTURES} : {temperature:.1f}°C  {humidite:.1f}%")
            else:
                print(f"  Lecture {i+1}/{NB_LECTURES} : ignorée")

            if i < NB_LECTURES - 1:
                time.sleep(INTERVALLE)

        if tempList:
            avgTemp = sum(tempList) / len(tempList)
            avgHum  = sum(humList)  / len(humList)
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
            print(f"\n→ Envoyé  {heure}  {avgTemp:.1f}°C  {avgHum:.1f}%  ({len(tempList)}/{NB_LECTURES} lectures valides)")
        else:
            print("\n→ Aucune lecture valide, rien envoyé.")

except KeyboardInterrupt:
    print("\nEnd")
