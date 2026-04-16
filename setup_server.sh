#!/bin/bash

# Device Dashboard - Installation VPS automatique
# Pour Ubuntu/Debian

set -e

echo "╔══════════════════════════════════════╗"
echo "║   Device Dashboard - Setup VPS       ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Vérifier si root
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Ce script doit être exécuté en tant que root (sudo)"
  exit 1
fi

echo "📦 Mise à jour du système..."
apt update && apt upgrade

echo ""
echo "🔧 Installation de Mosquitto MQTT Broker..."
apt install -y mosquitto mosquitto-clients

# Configuration Mosquitto
sudo cat >/etc/mosquitto/mosquitto.conf <<EOF
listener 4444
allow_anonymous true
EOF

systemctl restart mosquitto
systemctl enable mosquitto

echo "✅ Mosquitto configuré!"

cd backend/

# Générer un secret JWT aléatoire
JWT_SECRET=$(openssl rand -base64 32)

echo ""
read -p "Mot de passe du dashboard [admin123]: " DASHBOARD_PASS
DASHBOARD_PASS=${DASHBOARD_PASS:-admin123}

# Créer le fichier .env
cat >.env <<EOF
PORT=3001
NODE_ENV=production

MQTT_BROKER=mqtt://localhost:4444

JWT_SECRET=$JWT_SECRET

DASHBOARD_USER=admin
DASHBOARD_PASSWORD=$DASHBOARD_PASS
EOF

echo "✅ Backend configuré!"
