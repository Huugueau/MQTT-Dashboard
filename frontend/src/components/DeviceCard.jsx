import { Monitor, Cpu, HardDrive, Activity, Clock, Terminal, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export default function DeviceCard({ device, onSelect }) {
  const isOnline = device.isOnline || device.status === 'online';
  const metrics = device.metrics || {};
  const info = device.info || {};

  const getPlatformIcon = () => {
    const platform = info.platform?.toLowerCase() || '';
    if (platform.includes('windows')) return '🪟';
    if (platform.includes('linux')) return '🐧';
    if (platform.includes('darwin')) return '🍎';
    return '💻';
  };

  return (
    <div 
      onClick={() => onSelect(device)}
      className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{getPlatformIcon()}</span>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <span>{device.id || 'Unknown Device'}</span>
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </h3>
            <p className="text-sm text-gray-400">
              {info.platform_version || info.platform || 'Unknown OS'}
            </p>
          </div>
        </div>
        
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isOnline 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-red-500/20 text-red-400'
        }`}>
          {isOnline ? 'En ligne' : 'Hors ligne'}
        </div>
      </div>

      {/* Metrics */}
      {isOnline && metrics.cpu && (
        <div className="space-y-3">
          {/* CPU */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>CPU</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    metrics.cpu.percent > 80 ? 'bg-red-500' :
                    metrics.cpu.percent > 60 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${metrics.cpu.percent}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-white w-12 text-right">
                {metrics.cpu.percent?.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* RAM */}
          {metrics.memory && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <Activity className="w-4 h-4 text-purple-400" />
                <span>RAM</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      metrics.memory.percent > 80 ? 'bg-red-500' :
                      metrics.memory.percent > 60 ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`}
                    style={{ width: `${metrics.memory.percent}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-white w-12 text-right">
                  {metrics.memory.percent?.toFixed(1)}%
                </span>
              </div>
            </div>
          )}

          {/* Disk */}
          {metrics.disk && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <HardDrive className="w-4 h-4 text-yellow-400" />
                <span>Disque</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-300 ${
                      metrics.disk.percent > 80 ? 'bg-red-500' :
                      metrics.disk.percent > 60 ? 'bg-yellow-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${metrics.disk.percent}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-white w-12 text-right">
                  {metrics.disk.percent?.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
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
        {info.ip_address && (
          <span>{info.ip_address}</span>
        )}
      </div>
    </div>
  );
}