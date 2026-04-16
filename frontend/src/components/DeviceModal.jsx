import { useState } from 'react';
import { X, Terminal, Play, Cpu, HardDrive, Activity, Wifi, Thermometer } from 'lucide-react';
import { deviceService } from '../services/api';

const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const formatUptime = (seconds) => {
  if (!seconds) return 'N/A';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}j ${hours}h ${minutes}m`;
};

export default function DeviceModal({ device, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [command, setCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState([]);
  const [appName, setAppName] = useState('');
  const [loading, setLoading] = useState(false);

  const metrics = device.metrics || {};
  const info = device.info || {};

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    const timestamp = new Date().toLocaleTimeString();
    
    setCommandHistory(prev => [...prev, {
      type: 'input',
      content: command,
      timestamp
    }]);

    try {
      const result = await deviceService.sendCommand(device.id, command);
      
      setCommandHistory(prev => [...prev, {
        type: 'output',
        content: result.stdout || result.stderr || 'Command sent',
        success: result.success,
        timestamp: new Date().toLocaleTimeString()
      }]);
    } catch (error) {
      setCommandHistory(prev => [...prev, {
        type: 'error',
        content: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }

    setCommand('');
    setLoading(false);
  };

  const handleLaunchApp = async (e) => {
    e.preventDefault();
    if (!appName.trim()) return;

    setLoading(true);
    try {
      await deviceService.launchApp(device.id, appName);
      setCommandHistory(prev => [...prev, {
        type: 'output',
        content: `Application "${appName}" lancée`,
        success: true,
        timestamp: new Date().toLocaleTimeString()
      }]);
      setAppName('');
    } catch (error) {
      setCommandHistory(prev => [...prev, {
        type: 'error',
        content: error.message,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{device.id}</h2>
            <p className="text-sm text-gray-400">{info.platform_version || info.platform}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 px-6 border-b border-gray-700">
          <div className="flex space-x-4">
            {['overview', 'terminal', 'apps', 'processes'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-400 border-blue-400'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* System Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Système</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hostname:</span>
                      <span className="text-white font-medium">{info.hostname}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">OS:</span>
                      <span className="text-white font-medium">{info.platform}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Architecture:</span>
                      <span className="text-white font-medium">{info.architecture}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP:</span>
                      <span className="text-white font-medium">{info.ip_address}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Ressources</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">CPU Cores:</span>
                      <span className="text-white font-medium">{metrics.cpu?.count || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RAM Total:</span>
                      <span className="text-white font-medium">{formatBytes(metrics.memory?.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Disque Total:</span>
                      <span className="text-white font-medium">{formatBytes(metrics.disk?.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime:</span>
                      <span className="text-white font-medium">{formatUptime(metrics.uptime)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Usage */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Utilisation Actuelle</h3>
                <div className="space-y-4">
                  {metrics.cpu && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-4 h-4 text-blue-400" />
                          <span className="text-sm text-gray-300">CPU</span>
                        </div>
                        <span className="text-sm font-medium text-white">{metrics.cpu.percent?.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-300"
                          style={{ width: `${metrics.cpu.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {metrics.memory && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Activity className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-300">RAM ({formatBytes(metrics.memory.used)} / {formatBytes(metrics.memory.total)})</span>
                        </div>
                        <span className="text-sm font-medium text-white">{metrics.memory.percent?.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-500 rounded-full transition-all duration-300"
                          style={{ width: `${metrics.memory.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {metrics.disk && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm text-gray-300">Disque ({formatBytes(metrics.disk.used)} / {formatBytes(metrics.disk.total)})</span>
                        </div>
                        <span className="text-sm font-medium text-white">{metrics.disk.percent?.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                          style={{ width: `${metrics.disk.percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="space-y-4">
              {/* Terminal Output */}
              <div className="bg-black rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto border border-gray-700">
                {commandHistory.map((item, i) => (
                  <div key={i} className="mb-2">
                    {item.type === 'input' && (
                      <div className="text-green-400">
                        <span className="text-blue-400">{device.id}</span>
                        <span className="text-white"> $ </span>
                        {item.content}
                      </div>
                    )}
                    {item.type === 'output' && (
                      <pre className={item.success ? 'text-gray-300' : 'text-red-400'}>
                        {item.content}
                      </pre>
                    )}
                    {item.type === 'error' && (
                      <pre className="text-red-400">{item.content}</pre>
                    )}
                  </div>
                ))}
                {commandHistory.length === 0 && (
                  <div className="text-gray-500">
                    Tapez une commande ci-dessous...
                  </div>
                )}
              </div>

              {/* Command Input */}
              <form onSubmit={handleCommand} className="flex space-x-2">
                <input
                  type="text"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Entrez une commande..."
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !command.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  <Terminal className="w-5 h-5" />
                </button>
              </form>

              <div className="text-xs text-gray-500">
                Exemples: <code className="text-gray-400">ls -la</code>, <code className="text-gray-400">df -h</code>, <code className="text-gray-400">top -bn1</code>
              </div>
            </div>
          )}

          {activeTab === 'apps' && (
            <div className="space-y-4">
              <form onSubmit={handleLaunchApp} className="flex space-x-2">
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Nom de l'application (ex: firefox, notepad, code)"
                  className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !appName.trim()}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Lancer</span>
                </button>
              </form>

              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-2">Applications suggérées</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(info.platform === 'Linux' ? [
                    'firefox', 'chrome', 'code', 'terminal', 'nautilus', 'dolphin'
                  ] : [
                    'notepad', 'calc', 'mspaint', 'explorer', 'cmd', 'powershell'
                  ]).map(app => (
                    <button
                      key={app}
                      onClick={() => setAppName(app)}
                      className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm rounded border border-gray-600 transition-colors"
                    >
                      {app}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'processes' && (
            <div className="space-y-4">
              <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">PID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Nom</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">CPU %</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">RAM %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {metrics.top_processes?.map((proc) => (
                      <tr key={proc.pid} className="hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-sm text-gray-300">{proc.pid}</td>
                        <td className="px-4 py-3 text-sm text-white font-medium">{proc.name}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className={`${
                            proc.cpu > 50 ? 'text-red-400' : 
                            proc.cpu > 20 ? 'text-yellow-400' : 
                            'text-green-400'
                          }`}>
                            {proc.cpu}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-300">{proc.memory}%</td>
                      </tr>
                    ))}
                    {(!metrics.top_processes || metrics.top_processes.length === 0) && (
                      <tr>
                        <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                          Aucune donnée disponible
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}