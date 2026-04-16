import { useState } from 'react';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import names from "../data/names.json"

export default function SensorModal({ device, onClose }) {
  const [activeTab, setActiveTab] = useState('current');

  const metrics   = device.currentMetrics || {};
  const history   = device.history        || [];
  const aggregate = device.aggregate      || {};
  const isLS = device.sensorType === 'LS';
  const isHT = device.sensorType === 'HT';

  // History est déjà dans device (mis à jour en temps réel par useDevices)
  // Pas besoin de state local ni d'appel API séparé
  const formatChartData = () =>
    [...history].reverse().map(item => ({
      time: format(new Date(item.timestamp), 'HH:mm:ss'),
      ...(isLS
        ? { light: item.metrics.LIGHT,       sound: item.metrics.SOUND }
        : { temperature: item.metrics.TEMPERATURE, humidity: item.metrics.HUMIDITY }
      )
    }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-700">

        {/* Header */}
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{names[device.macAddress] ?? device.macAddress}</h2>
            <p className="text-sm text-gray-400">{device.type}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-900 px-6 border-b border-gray-700">
          <div className="flex space-x-4">
            {['current', 'history', 'stats'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'text-blue-400 border-blue-400'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {tab === 'current' && 'Actuel'}
                {tab === 'history' && `Historique${history.length > 0 ? ` (${history.length})` : ''}`}
                {tab === 'stats'   && 'Statistiques'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">

          {/* ── Actuel ── */}
          {activeTab === 'current' && (
            <div className="grid grid-cols-2 gap-6">
              {isLS && (
                <>
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Luminosité</h3>
                    <div className="flex items-end space-x-2">
                      <span className="text-5xl font-bold text-yellow-400">
                        {metrics.LIGHT?.toFixed(1) ?? 'N/A'}
                      </span>
                      <span className="text-xl text-gray-500 pb-2">lux</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Son</h3>
                    <div className="flex items-end space-x-2">
                      <span className="text-5xl font-bold text-purple-400">
                        {metrics.SOUND?.toFixed(1) ?? 'N/A'}
                      </span>
                      <span className="text-xl text-gray-500 pb-2">dB</span>
                    </div>
                  </div>
                </>
              )}

              {isHT && (
                <>
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Température</h3>
                    <div className="flex items-end space-x-2">
                      <span className="text-5xl font-bold text-red-400">
                        {metrics.TEMPERATURE?.toFixed(1) ?? 'N/A'}
                      </span>
                      <span className="text-xl text-gray-500 pb-2">°C</span>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-sm font-medium text-gray-400 mb-4">Humidité</h3>
                    <div className="flex items-end space-x-2">
                      <span className="text-5xl font-bold text-blue-400">
                        {metrics.HUMIDITY?.toFixed(1) ?? 'N/A'}
                      </span>
                      <span className="text-xl text-gray-500 pb-2">%</span>
                    </div>
                  </div>
                </>
              )}

              <div className="col-span-2 bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-400 mb-4">Informations</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">MAC Address:</span>
                    <span className="text-white ml-2 font-mono">{device.macAddress}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <span className="text-white ml-2">{device.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Première vue:</span>
                    <span className="text-white ml-2">
                      {device.firstSeen ? format(new Date(device.firstSeen), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dernière vue:</span>
                    <span className="text-white ml-2">
                      {device.lastSeen ? format(new Date(device.lastSeen), 'dd/MM/yyyy HH:mm:ss') : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Historique ── */}
          {activeTab === 'history' && (
            history.length > 0 ? (
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-4">
                  {history.length} dernières mesures
                </h3>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      labelStyle={{ color: '#E5E7EB' }}
                    />
                    <Legend />
                    {isLS && (
                      <>
                        <Line type="monotone" dataKey="light" stroke="#FBBF24" name="Lumière (lux)" dot={false} />
                        <Line type="monotone" dataKey="sound" stroke="#A78BFA" name="Son (dB)"       dot={false} />
                      </>
                    )}
                    {isHT && (
                      <>
                        <Line type="monotone" dataKey="temperature" stroke="#F87171" name="Température (°C)" dot={false} />
                        <Line type="monotone" dataKey="humidity"    stroke="#60A5FA" name="Humidité (%)"     dot={false} />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Aucune donnée disponible</div>
            )
          )}

          {/* ── Statistiques ── */}
          {activeTab === 'stats' && (
            Object.keys(aggregate).length > 0 ? (
              <div className="grid grid-cols-2 gap-6">
                {Object.entries(aggregate).map(([key, stats]) => (
                  <div key={key} className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-4 capitalize">{key}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Actuel:</span>
                        <span className="text-white font-semibold">{stats.current?.toFixed(2) ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Moyenne:</span>
                        <span className="text-green-400 font-semibold">{stats.avg?.toFixed(2) ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Minimum:</span>
                        <span className="text-blue-400 font-semibold">{stats.min?.toFixed(2) ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Maximum:</span>
                        <span className="text-red-400 font-semibold">{stats.max?.toFixed(2) ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Mesures:</span>
                        <span className="text-gray-400">{stats.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">Aucune statistique disponible</div>
            )
          )}

        </div>
      </div>
    </div>
  );
}