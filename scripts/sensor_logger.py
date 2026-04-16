import time
import grovepi
import json
import socket
import math
import paho.mqtt.client as mqtt
from datetime import datetime
from uuid import getnode as get_mac
 
BROKER = "87.106.23.178"
PORT = 1883
DEVICE_ID = socket.gethostname()

MAC = get_mac()
MAC = ':'.join(['{:02x}'.format((MAC >> ele) & 0xff) 
                         for ele in range(0, 8*6, 8)][::-1])
 
client = mqtt.Client(
    mqtt.CallbackAPIVersion.VERSION2,
    client_id=f"subscriber-{DEVICE_ID}"
)
client.connect(BROKER, PORT)
print(f"Connecté au broker {BROKER}:{PORT}")
 
NB_LECTURES = 5
INTERVALLE   = 20 // NB_LECTURES

LIGHT_SENSOR = 0
SOUND_SENSOR = 1

LIGHT_MULTIPLIER = 0.969664
SOUND_MULTIPLIER = 0.374699
 
try:
    while True:
        lightList = []
        soundList  = []
 
        print(f"\n--- Nouvelle collecte ({NB_LECTURES} lectures x {INTERVALLE}s) ---")
 
        for i in range(NB_LECTURES):
            try:
                rawLight = grovepi.analogRead(LIGHT_SENSOR)
                rawSound = grovepi.analogRead(SOUND_SENSOR)
                 
                light = rawLight * LIGHT_MULTIPLIER
                sound = rawSound * SOUND_MULTIPLIER
                 
                lightList.append(light)
                soundList.append(sound)
 
                print(f"  Lecture {i+1}/{NB_LECTURES} : {light:.1f}Lux  {sound:.1f}dB")
            except RuntimeError as e:
                print(f"  Lecture {i+1}/{NB_LECTURES} : erreur ({e}), ignorée")
 
            if i < NB_LECTURES - 1:
                time.sleep(INTERVALLE)
 
        # Envoi seulement si on a au moins une lecture valide
        if lightList:
            avgLight = sum(lightList) / len(lightList)
            avgSound = sum(soundList) / len(soundList)
            heure    = datetime.now().isoformat()
 
            metrics = {
                "MAC_ADDRESS": MAC,
                "TIMESTAMP":   heure,
                "METRICS": {
                    "LIGHT": round(avgLight, 2),
                    "SOUND": round(avgSound, 2)
                }
            }
 
            client.publish("device/LS", json.dumps(metrics))
            print(f"\n→ Envoyé  {heure}  {avgLight:.1f}Lux  {avgSound:.1f}dB  ({len(lightList)}/{NB_LECTURES} lectures valides)")
        else:
            print("\n→ Aucune lecture valide, rien envoyé.")
 
except KeyboardInterrupt:
    print("\nEnd")
