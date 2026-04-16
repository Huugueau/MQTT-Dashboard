import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../hooks/useDevices';
import SensorCard from '../components/SensorCard';
import SensorModal from '../components/SensorModal';
import { LogOut, RefreshCw, Activity, Thermometer, Sun } from 'lucide-react';

export default function DashboardPage() {
  const { logout } = useAuth();
  const { devices, loading, error, reload } = useDevices();

  // On stocke uniquement l'ID — pas un snapshot de l'objet.
  // selectedDevice est recalculé à chaque render depuis le state live.
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const selectedDevice = devices.find(d => d.id === selectedDeviceId) || null;

  // Auto-close modal if the device goes offline and disappears from the list
  useEffect(() => {
    if (selectedDeviceId && !selectedDevice) {
      setSelectedDeviceId(null);
    }
  }, [selectedDeviceId, selectedDevice]);

  const onlineDevices = devices.filter(d => d.isOnline);
  const lsDevices = onlineDevices.filter(d => d.sensorType === 'LS');
  const htDevices = onlineDevices.filter(d => d.sensorType === 'HT');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 border-b border-gray-700 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-8 h-8 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-white">Sensor Dashboard</h1>
                <p className="text-sm text-gray-400">Monitoring Light, Sound, Temperature & Humidity</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4 px-4 py-2 bg-gray-700/50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-gray-300">{lsDevices.length} LS</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-gray-300">{htDevices.length} HT</span>
                </div>
                <div className="w-px h-4 bg-gray-600"></div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    {onlineDevices.length} / {devices.length} en ligne
                  </span>
                </div>
              </div>

              <button
                onClick={reload}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
                title="Actualiser"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <button
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {loading && devices.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Chargement des sensors...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500 text-red-400 px-6 py-4 rounded-lg">
            <p className="font-medium">Erreur de chargement</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        ) : devices.length === 0 ? (
          <div className="text-center py-16">
            <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              Aucun sensor connecté
            </h3>
            <p className="text-gray-500">
              Attendez que les sensors envoient leurs données sur device/LS et device/HT
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {lsDevices.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <Sun className="w-6 h-6 text-yellow-400" />
                  <span>Sensors Light & Sound ({lsDevices.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lsDevices.filter(device => device.isOnline).map(device => (
                    <SensorCard
                      key={device.id}
                      device={device}
                      onSelect={d => setSelectedDeviceId(d.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {htDevices.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center space-x-2">
                  <Thermometer className="w-6 h-6 text-red-400" />
                  <span>Sensors Humidity & Temperature ({htDevices.length})</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {htDevices.map(device => (
                    <SensorCard
                      key={device.id}
                      device={device}
                      onSelect={d => setSelectedDeviceId(d.id)}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Modal — reçoit toujours la version live du device */}
      {selectedDevice && (
        <SensorModal
          device={selectedDevice}
          onClose={() => setSelectedDeviceId(null)}
        />
      )}
    </div>
  );
}
