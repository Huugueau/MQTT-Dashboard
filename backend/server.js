import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mqtt from 'mqtt';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {}
});

app.use(cors());
app.use(express.json());

const devices = new Map();
const sensorData = new Map();
const MAX_HISTORY_PER_DEVICE = 100;

// ─── Fonction aggregate (déclarée AVANT son utilisation) ──────────────────────
const computeAggregate = (history, deviceId) => {
  const device = devices.get(deviceId);
  const metrics = device?.currentMetrics || {};
  const result = {};

  if (device?.sensorType === 'LS') {
    const lights = history.map(h => h.metrics.LIGHT).filter(v => v !== undefined);
    const sounds = history.map(h => h.metrics.SOUND).filter(v => v !== undefined);

    result.light = {
      current: metrics.LIGHT,
      avg:     lights.reduce((a, b) => a + b, 0) / lights.length,
      min:     Math.min(...lights),
      max:     Math.max(...lights),
      count:   lights.length
    };
    result.sound = {
      current: metrics.SOUND,
      avg:     sounds.reduce((a, b) => a + b, 0) / sounds.length,
      min:     Math.min(...sounds),
      max:     Math.max(...sounds),
      count:   sounds.length
    };

  } else if (device?.sensorType === 'HT') {
    const temps  = history.map(h => h.metrics.TEMPERATURE).filter(v => v !== undefined);
    const humids = history.map(h => h.metrics.HUMIDITY).filter(v => v !== undefined);

    result.temperature = {
      current: metrics.TEMPERATURE,
      avg:     temps.reduce((a, b) => a + b, 0) / temps.length,
      min:     Math.min(...temps),
      max:     Math.max(...temps),
      count:   temps.length
    };
    result.humidity = {
      current: metrics.HUMIDITY,
      avg:     humids.reduce((a, b) => a + b, 0) / humids.length,
      min:     Math.min(...humids),
      max:     Math.max(...humids),
      count:   humids.length
    };
  }

  return result; // ← BUG CORRIGÉ: return manquant dans la version originale
};

// ─── MQTT ─────────────────────────────────────────────────────────────────────
const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('✓ Connecté au broker MQTT');
  mqttClient.subscribe('device/LS');
  mqttClient.subscribe('device/HT');
});

mqttClient.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    if (!data.MAC_ADDRESS || !data.TIMESTAMP || !data.METRICS) {
      console.error('Payload invalide:', data);
      return;
    }

    const deviceId  = data.MAC_ADDRESS; // string, jamais Number
    const timestamp = data.TIMESTAMP;
    const metrics   = data.METRICS;

    const sensorType = topic === 'device/LS' ? 'LS' : 'HT';
    const deviceType = topic === 'device/LS'
      ? 'Light & Sound Sensor'
      : 'Humidity & Temperature Sensor';

    // Init device si nouveau
    if (!devices.has(deviceId)) {
      devices.set(deviceId, {
        id:             deviceId,
        macAddress:     deviceId,
        type:           deviceType,
        sensorType:     sensorType,
        status:         'online',
        firstSeen:      new Date(),
        lastSeen:       new Date(),
        currentMetrics: {},
        history:        [],
        aggregate:      {}
      });
    }

    // Mettre à jour les métriques courantes AVANT de calculer l'agrégat
    // (computeAggregate lit device.currentMetrics)
    const device = devices.get(deviceId);
    device.currentMetrics = metrics;

    // Historique — clé toujours string (MAC address)
    if (!sensorData.has(deviceId)) {
      sensorData.set(deviceId, []);
    }
    const history = sensorData.get(deviceId);
    history.unshift({ timestamp, metrics, receivedAt: new Date() });
    if (history.length > MAX_HISTORY_PER_DEVICE) history.pop();
    sensorData.set(deviceId, history);

    // Agrégat calculé APRÈS mise à jour de currentMetrics et history
    const agg = computeAggregate(history, deviceId);

    // Finaliser la mise à jour du device
    device.lastSeen  = new Date(timestamp);
    device.status    = 'online';
    device.aggregate = agg;
    device.history   = history;
    devices.set(deviceId, device);

    // Émettre vers tous les clients WebSocket
    io.emit('device:update', {
      deviceId,
      type:      sensorType,
      timestamp,
      metrics,
      device,
      history,
      aggregate: agg
    });

    console.log(`📊 ${sensorType} - ${deviceId}:`, metrics);

  } catch (error) {
    console.error('Erreur parsing MQTT message:', error);
  }
});

// ─── Auth JWT ─────────────────────────────────────────────────────────────────
const generateToken = (user) =>
  jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '24h' });

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET).user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// ─── Routes API ───────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.DASHBOARD_USER && password === process.env.DASHBOARD_PASSWORD) {
    res.json({ token: generateToken(username), user: username });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/devices', verifyToken, (req, res) => {
  const now = new Date();
  res.json(Array.from(devices.values())
    .filter(device => (now - device.lastSeen) < 60000)
    .map(device => ({
      ...device,
      isOnline:    true,
      lastSeenAgo: now - device.lastSeen
    }))
  );
});

app.get('/api/devices/:deviceId', verifyToken, (req, res) => {
  const device = devices.get(req.params.deviceId); // string, pas Number
  if (!device) return res.status(404).json({ error: 'Device not found' });
  const timeSinceLastSeen = new Date() - device.lastSeen;
  res.json({ ...device, isOnline: timeSinceLastSeen < 60000, lastSeenAgo: timeSinceLastSeen });
});

app.get('/api/devices/:deviceId/history', verifyToken, (req, res) => {
  const history = sensorData.get(req.params.deviceId) || []; // string, pas Number
  const limit   = parseInt(req.query.limit) || 100;
  res.json(history.slice(0, limit));
});

app.get('/api/devices/:deviceId/aggregate', verifyToken, (req, res) => {
  const history = sensorData.get(req.params.deviceId) || []; // string, pas Number
  if (history.length === 0) return res.json({ error: 'No data available' });
  res.json(computeAggregate(history, req.params.deviceId));
});

app.get('/api/stats', verifyToken, (req, res) => {
  const now = new Date();
  res.json({
    totalDevices:   devices.size,
    lsDevices:      Array.from(devices.values()).filter(d => d.sensorType === 'LS').length,
    htDevices:      Array.from(devices.values()).filter(d => d.sensorType === 'HT').length,
    onlineDevices:  Array.from(devices.values()).filter(d => (now - d.lastSeen) < 60000).length,
    totalDataPoints: Array.from(sensorData.values()).reduce((s, a) => s + a.length, 0),
    lastUpdate:     now
  });
});

// ─── Heartbeat: détecte les devices offline et notifie les clients ────────────
setInterval(() => {
  const now = new Date();
  devices.forEach((device, deviceId) => {
    const isOffline = (now - device.lastSeen) >= 60000;
    const wasOnline = device.status === 'online';

    if (isOffline && wasOnline) {
      device.status = 'offline';
      devices.set(deviceId, device);
      console.log(`📴 Device offline: ${deviceId}`);
      io.emit('device:offline', { deviceId });
    }
  });
}, 10000); // vérifie toutes les 10s

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('✓ Client connecté:', socket.id);
  const now = new Date();
  socket.emit('devices:list', Array.from(devices.values())
    .map(device => ({
      ...device,
      isOnline:    ((now - device.lastSeen) < 60000),
      lastSeenAgo: now - device.lastSeen
    }))
  );
  socket.on('disconnect', () => console.log('✗ Client déconnecté:', socket.id));
});

// ─── Health & Start ───────────────────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok', mqtt: mqttClient.connected, devices: devices.size,
  uptime: process.uptime(), topics: ['device/LS', 'device/HT']
}));

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════╗
║   Sensor Dashboard Backend           ║
║   Port: ${PORT}                        ║
║   Topics: device/LS, device/HT       ║
╚══════════════════════════════════════╝\n`);
});

process.on('SIGTERM', () => {
  mqttClient.end();
  httpServer.close(() => process.exit(0));
});
