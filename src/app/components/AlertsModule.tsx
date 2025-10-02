import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Clock, MapPin, Image, CreditCard, RefreshCw, Filter, Eye } from 'lucide-react';

interface Alert {
  id: number;
  imei: string;
  equipmentName: string;
  alertType: number;
  alertTypeInfo?: {
    name: string;
    description: string;
    severity: string;
    color: string;
    icon: string;
  };
  alarmTime: string;
  mediaUrl?: string;
  rfidCardNumber?: string;
  latitude?: number;
  longitude?: number;
  speed?: number;
  address?: string;
  hasMedia: boolean;
}

interface AlertsModuleProps {
  activeIMEI: string;
}

const AlertsModule: React.FC<AlertsModuleProps> = ({ activeIMEI }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filters, setFilters] = useState({
    hasMedia: false,
    rfidOnly: false,
    alertType: ''
  });

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeIMEI) params.append('imei', activeIMEI);
      if (filters.hasMedia) params.append('hasMedia', 'true');
      if (filters.rfidOnly) params.append('rfidOnly', 'true');
      if (filters.alertType) params.append('alertType', filters.alertType);

      const response = await fetch(`http://localhost:3002/api/alerts?${params}`);
      if (response.ok) {
        const result = await response.json();
        setAlerts(result.data.alerts);
      }
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, [activeIMEI, filters]);

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const viewAlertDetails = async (alertId: number) => {
    try {
      const response = await fetch(`http://localhost:3002/api/alerts/${alertId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedAlert(result.data);
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do alerta:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 border border-blue-100/50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Histórico de Alertas</h2>
              <p className="text-slate-600">
                {activeIMEI ? `Alertas do equipamento ${activeIMEI}` : 'Todos os alertas'}
              </p>
            </div>
          </div>
          
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
          <Filter className="w-5 h-5 text-slate-600" />
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.hasMedia}
              onChange={(e) => setFilters(prev => ({ ...prev, hasMedia: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-slate-700">Apenas com mídia</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={filters.rfidOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, rfidOnly: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-slate-700">Apenas RFID</span>
          </label>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-blue-100/50 shadow-lg">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p className="text-slate-600">Carregando alertas...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nenhum alerta encontrado</h3>
            <p className="text-gray-500">
              {activeIMEI 
                ? 'Não há alertas registrados para este equipamento.'
                : 'Não há alertas registrados no sistema.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-6 hover:bg-blue-50/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(alert.alertTypeInfo?.severity)}`}>
                        Tipo {alert.alertType}
                      </div>
                      {alert.alertTypeInfo?.name && (
                        <span className="text-sm font-medium text-slate-800">
                          {alert.alertTypeInfo.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(alert.alarmTime)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <span className="font-medium">Equipamento:</span>
                          <span>{alert.equipmentName}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {alert.rfidCardNumber && (
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <CreditCard className="w-4 h-4" />
                            <span className="font-medium">Cartão RFID:</span>
                            <span className="font-mono bg-blue-100 px-2 py-1 rounded">
                              {alert.rfidCardNumber}
                            </span>
                          </div>
                        )}
                        {(alert.latitude && alert.longitude) && (
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <MapPin className="w-4 h-4" />
                            <span>{alert.latitude.toFixed(6)}, {alert.longitude.toFixed(6)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      {alert.hasMedia && (
                        <div className="flex items-center space-x-1 text-green-600">
                          <Image className="w-4 h-4" />
                          <span className="text-sm">Mídia disponível</span>
                        </div>
                      )}
                      {alert.speed && (
                        <span className="text-sm text-slate-600">
                          Velocidade: {alert.speed} km/h
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => viewAlertDetails(alert.id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Detalhes</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">Detalhes do Alerta</h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Tipo de Alerta:</label>
                  <p className="text-slate-800">{selectedAlert.alertType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Data/Hora:</label>
                  <p className="text-slate-800">{formatDateTime(selectedAlert.alarmTime)}</p>
                </div>
              </div>
              
              {selectedAlert.rfidCardNumber && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Número do Cartão RFID:</label>
                  <p className="text-lg font-mono bg-blue-100 p-2 rounded">
                    {selectedAlert.rfidCardNumber}
                  </p>
                </div>
              )}
              
              {selectedAlert.mediaUrl && (
                <div>
                  <label className="text-sm font-medium text-slate-600">Mídia Associada:</label>
                  <div className="mt-2">
                    <img 
                      src={selectedAlert.mediaUrl} 
                      alt="Mídia do alerta"
                      className="max-w-full h-auto rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjE1MCIgeT0iMTAwIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0Q1RDlERiIvPgo8dGV4dCB4PSIyMDAiIHk9IjE1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNkI3Mjg0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5JbWFnZW0gSW5kaXNwb27DrXZlbDwvdGV4dD4KPC9zdmc+';
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default AlertsModule;