# Backend - Device Dashboard

Backend Node.js avec Express, Socket.io et MQTT.

## Installation

```bash
cd backend

# Installer les dépendances
npm install

# Configurer
cp .env.example .env
nano .env  # Modifier les variables

# Lancer en dev
npm run dev

# Lancer en production
npm start
```

## Configuration

Éditer `.env`:

```env
PORT=3001
MQTT_BROKER=mqtt://localhost:1883
MQTT_USER=device_agent
MQTT_PASSWORD=change_me
JWT_SECRET=your_super_secret_jwt_key_change_this
DASHBOARD_USER=admin
DASHBOARD_PASSWORD=admin123
```

## API Endpoints

### Auth
- `POST /api/auth/login` - Login (retourne JWT token)

### Devices
- `GET /api/devices` - Liste tous les devices
- `GET /api/devices/:deviceId` - Détails d'un device
- `POST /api/devices/:deviceId/command` - Exécuter une commande
- `POST /api/devices/:deviceId/app/launch` - Lancer une app

### Stats
- `GET /api/stats` - Statistiques globales
- `GET /api/history` - Historique des commandes
- `GET /health` - Health check

Toutes les routes sauf `/api/auth/login` et `/health` nécessitent un token JWT:
```
Authorization: Bearer <token>
```

## WebSocket Events (Socket.io)

### Server → Client
- `devices:list` - Liste complète des devices
- `device:status` - Changement de status
- `device:info` - Nouvelles infos device
- `device:metrics` - Nouvelles métriques
- `device:response` - Réponse à une commande

## Architecture

```
Client Browser
    ↕ HTTP + WebSocket
Backend (Express + Socket.io)
    ↕ MQTT
MQTT Broker (Mosquitto)
    ↕ MQTT
Agents (Python sur chaque device)
```