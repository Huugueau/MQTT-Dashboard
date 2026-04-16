import { useState, useEffect, useCallback } from 'react';
import { deviceService } from '../services/api';
import socketService from '../services/socket';

export const useDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const data = await deviceService.getAll();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error loading devices:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Socket setup — runs once only, never re-registers on re-renders
  useEffect(() => {
    socketService.connect();

    socketService.on('devices:list', (devicesList) => {
      setDevices(devicesList);
    });

    socketService.on('device:update', ({ deviceId, timestamp, metrics, device, history, aggregate }) => {
      setDevices(prev => {
        const existingIndex = prev.findIndex(d => d.id === deviceId);

        const updatedDevice = {
          ...device,
          currentMetrics: metrics,
          lastSeen:       new Date(timestamp),
          isOnline:       (new Date() - new Date(timestamp)) < 60000,
          history:        history   || [],
          aggregate:      aggregate || {}
        };

        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = updatedDevice;
          return updated;
        } else {
          return [...prev, updatedDevice];
        }
      });
    });

    socketService.on('device:offline', ({ deviceId }) => {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    });

    return () => {
      socketService.off('devices:list');
      socketService.off('device:update');
      socketService.off('device:offline');
    };
  }, []); // ← empty deps: socket listeners registered once, never duplicated

  return { devices, loading, error, reload: loadDevices };
};