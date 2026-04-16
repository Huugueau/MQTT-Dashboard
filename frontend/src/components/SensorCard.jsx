import { Thermometer, Droplets, Sun, Volume2, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import names from "../data/names.json"

export default function SensorCard({ device, onSelect }) {
  const isOnline = device.isOnline;
  const metrics = device.currentMetrics || {};
  const isLS = device.sensorType === 'LS';
  const isHT = device.sensorType === 'HT';

  console.log(`Device: ${device.id} isLS: `, isLS);
  console.log(`Device: ${device.id} isHT: `, isHT);


  const getStatusColor = () => {
    return isOnline ? 'bg-green-500' : 'bg-red-500';
  };

  const getSensorIcon = () => {
    if (isLS) return '💡🔊';
    if (isHT) return '🌡️💧';
    return '📊';
  };

  return (
    <div 
      onClick={() => onSelect(device)}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-1xl">{getSensorIcon()}</span>
          <div>
            <h3 className="text-base font-semibold text-white flex items-center space-x-2">
              <span>{names[device.macAddress] ?? device.macAddress}</span>
              
            </h3>
            <p className="text-sm text-gray-400">{device.type}</p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOnline 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>
      </div>

      {/* Metrics */}
      {isOnline && (
        <div className="space-y-4">
          {isLS && (
            <>
              {/* Light */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Sun className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-300">Luminosité</span>
                  </div>
                  <span className="text-2xl font-bold text-yellow-400">
                    {metrics.LIGHT?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">Lux</p>
              </div>

              {/* Sound */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Volume2 className="w-5 h-5 text-purple-400" />
                    <span className="text-sm font-medium text-gray-300">Son</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-400">
                    {metrics.SOUND?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">dB</p>
              </div>
            </>
          )}

          {isHT && (
            <>
              {/* Temperature */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Thermometer className="w-5 h-5 text-red-400" />
                    <span className="text-sm font-medium text-gray-300">Température</span>
                  </div>
                  <span className="text-2xl font-bold text-red-400">
                    {metrics.TEMPERATURE?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">°C</p>
              </div>

              {/* Humidity */}
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">Humidité</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-400">
                    {metrics.HUMIDITY?.toFixed(1) || 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">%</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Last Seen */}
      <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>
            {device.lastSeen 
              ? formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true, locale: fr })
              : 'Jamais vu'
            }
          </span>
        </div>
        <span className="font-mono text-gray-500">{device.sensorType}</span>
      </div>
    </div>
  );
}