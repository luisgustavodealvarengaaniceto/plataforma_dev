'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Database,
  Search,
  Download,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Heart,
  LogIn,
  LogOut,
  Activity,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface DeviceLog {
  id: string;
  timestamp: string;
  endpoint: string;
  payload: any;
  payloadSize: number;
}

interface DeviceStats {
  imei: string;
  totalLogs: number;
  endpoints: Array<{
    endpoint: string;
    count: number;
    lastSeen: string;
    firstSeen: string;
  }>;
  lastActivity: string;
  lastEndpoint: string;
}

export default function DeviceDataViewer() {
  const [imei, setImei] = useState('864993060259554');
  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [stats, setStats] = useState<DeviceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('all');
  const [limit, setLimit] = useState(100);

  const fetchDeviceStats = async () => {
    if (!imei) return;

    setStatsLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/api/device/${imei}/stats`);
      const data = await response.json();

      if (data.code === 0) {
        setStats(data.data);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      toast.error('Erro de conexão');
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchDeviceLogs = async () => {
    if (!imei) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });

      if (selectedEndpoint !== 'all') {
        params.append('endpoint', selectedEndpoint);
      }

      const response = await fetch(`http://localhost:3002/api/device/${imei}/logs?${params}`);
      const data = await response.json();

      if (data.code === 0) {
        setLogs(data.data.logs);
        toast.success(`Encontrados ${data.data.logs.length} registros`);
      } else {
        toast.error('Erro ao carregar dados');
      }
    } catch (error) {
      toast.error('Erro de conexão');
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `device_${imei}_logs.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getEndpointIcon = (endpoint: string) => {
    switch (endpoint) {
      case '/pushgps': return <MapPin className="w-4 h-4" />;
      case '/pushalarm': return <AlertTriangle className="w-4 h-4" />;
      case '/pushhb': return <Heart className="w-4 h-4" />;
      case '/pushlogin': return <LogIn className="w-4 h-4" />;
      case '/pushlogout': return <LogOut className="w-4 h-4" />;
      case '/pushevent': return <Activity className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getEndpointColor = (endpoint: string) => {
    switch (endpoint) {
      case '/pushgps': return 'bg-blue-500';
      case '/pushalarm': return 'bg-red-500';
      case '/pushhb': return 'bg-green-500';
      case '/pushlogin': return 'bg-purple-500';
      case '/pushlogout': return 'bg-gray-500';
      case '/pushevent': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  useEffect(() => {
    if (imei) {
      fetchDeviceStats();
    }
  }, [imei]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto p-6 space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Database className="w-6 h-6" />
            Visualizador de Dados Brutos do Dispositivo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imei">IMEI do Equipamento</Label>
              <Input
                id="imei"
                value={imei}
                onChange={(e) => setImei(e.target.value)}
                placeholder="Digite o IMEI"
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">Filtrar por Endpoint</Label>
              <select
                id="endpoint"
                value={selectedEndpoint}
                onChange={(e) => setSelectedEndpoint(e.target.value)}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value="all">Todos os endpoints</option>
                <option value="/pushgps">GPS</option>
                <option value="/pushalarm">Alarmes</option>
                <option value="/pushhb">Heartbeat</option>
                <option value="/pushevent">Eventos</option>
                <option value="/pushlogin">Login</option>
                <option value="/pushlogout">Logout</option>
                <option value="/pushTerminalTransInfo">Info Terminal</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit">Limite de Registros</Label>
              <select
                id="limit"
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
              >
                <option value={50}>50 registros</option>
                <option value={100}>100 registros</option>
                <option value={500}>500 registros</option>
                <option value={1000}>1000 registros</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={fetchDeviceLogs}
              disabled={loading || !imei}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Buscar Dados
            </Button>

            <Button
              onClick={fetchDeviceStats}
              disabled={statsLoading || !imei}
              variant="outline"
            >
              {statsLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Atualizar Estatísticas
            </Button>

            {logs.length > 0 && (
              <Button
                onClick={exportData}
                variant="outline"
                className="ml-auto"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar JSON
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Activity className="w-5 h-5" />
              Estatísticas do Dispositivo - {stats.imei}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-gray-800 rounded p-3">
                <div className="text-sm text-gray-400">Total de Registros</div>
                <div className="text-2xl font-bold text-white">{stats.totalLogs}</div>
              </div>

              <div className="bg-gray-800 rounded p-3">
                <div className="text-sm text-gray-400">Última Atividade</div>
                <div className="text-white font-medium">
                  {new Date(stats.lastActivity).toLocaleString()}
                </div>
              </div>

              <div className="bg-gray-800 rounded p-3">
                <div className="text-sm text-gray-400">Último Endpoint</div>
                <div className="text-white font-medium flex items-center gap-2">
                  {getEndpointIcon(stats.lastEndpoint)}
                  {stats.lastEndpoint}
                </div>
              </div>

              <div className="bg-gray-800 rounded p-3">
                <div className="text-sm text-gray-400">Endpoints Ativos</div>
                <div className="text-2xl font-bold text-white">{stats.endpoints.length}</div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-medium text-gray-300">Detalhes por Endpoint</h4>
              {stats.endpoints.map((endpoint) => (
                <div key={endpoint.endpoint} className="flex items-center justify-between bg-gray-800 rounded p-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${getEndpointColor(endpoint.endpoint)}`}>
                      {getEndpointIcon(endpoint.endpoint)}
                    </div>
                    <div>
                      <div className="font-medium text-white">{endpoint.endpoint}</div>
                      <div className="text-sm text-gray-400">
                        Primeiro: {new Date(endpoint.firstSeen).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400">
                      Último: {new Date(endpoint.lastSeen).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Database className="w-5 h-5" />
            Dados Brutos ({logs.length} registros)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhum dado encontrado. Clique em "Buscar Dados" para carregar.
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded ${getEndpointColor(log.endpoint)}`}>
                        {getEndpointIcon(log.endpoint)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {log.payloadSize} bytes
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <pre className="bg-gray-900 p-3 rounded text-xs text-green-400 overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(log.payload, null, 2)}
                  </pre>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}