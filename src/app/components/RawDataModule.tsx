'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  Clock,
  Smartphone,
  Activity,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import io, { Socket } from 'socket.io-client';

interface LogEntry {
  id: string;
  timestamp: string;
  endpoint: string;
  imei: string;
  payload: any;
  payloadSize: number;
}

interface LogStats {
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

interface RawDataModuleProps {
  activeIMEI?: string;
}

// Simple UUID-like function for generating IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export default function RawDataModule({ activeIMEI }: RawDataModuleProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedIMEI, setSelectedIMEI] = useState(activeIMEI || '864993060259554');
  const [selectedEndpoint, setSelectedEndpoint] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(50);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveMode, setLiveMode] = useState(true);

  // Atualizar IMEI selecionado quando prop mudar
  useEffect(() => {
    if (activeIMEI) {
      console.log(`🆔 activeIMEI prop mudou para: ${activeIMEI}`);
      setSelectedIMEI(activeIMEI);
    }
  }, [activeIMEI]);

  // Conectar ao Socket.IO e receber dados em tempo real
  useEffect(() => {
    const newSocket = io('http://localhost:3002', {
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
    });

    newSocket.on('connect', () => {
      console.log('✅ Conectado ao servidor em tempo real');
      toast.success('Conectado aos dados em tempo real');
    });

    // Escutar eventos de GPS em tempo real
    newSocket.on('pushgps', (data: any) => {
      if (liveMode) {
        const logEntry: LogEntry = {
          id: generateId(),
          timestamp: data.timestamp || new Date().toISOString(),
          endpoint: data.endpoint || '/pushgps',
          imei: data.imei || selectedIMEI,
          payload: data.payload || data,
          payloadSize: JSON.stringify(data.payload || data).length
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 49)]); // Manter apenas os últimos 50
      }
    });

    // Escutar eventos de alarme em tempo real
    newSocket.on('pushalarm_raw', (data: any) => {
      if (liveMode) {
        const logEntry: LogEntry = {
          id: generateId(),
          timestamp: data.timestamp || new Date().toISOString(),
          endpoint: data.endpoint || '/pushalarm',
          imei: data.imei || selectedIMEI,
          payload: data.payload || data,
          payloadSize: JSON.stringify(data.payload || data).length
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 49)]);
      }
    });

    // Escutar eventos de upload de arquivo em tempo real
    newSocket.on('pushfileupload', (data: any) => {
      if (liveMode) {
        const logEntry: LogEntry = {
          id: generateId(),
          timestamp: data.timestamp || new Date().toISOString(),
          endpoint: data.endpoint || '/pushfileupload',
          imei: data.imei || selectedIMEI,
          payload: data.payload || data,
          payloadSize: JSON.stringify(data.payload || data).length
        };
        setLogs(prev => [logEntry, ...prev.slice(0, 49)]);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Desconectado do servidor');
      toast.error('Desconectado do servidor de dados');
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [liveMode, selectedIMEI]);

  // Buscar logs
  const fetchLogs = async () => {
    if (!selectedIMEI) {
      console.warn('❌ selectedIMEI vazio, ignorando fetchLogs');
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: limit.toString()
      });
      
      if (selectedEndpoint) params.append('endpoint', selectedEndpoint);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `http://localhost:3002/api/device/${selectedIMEI}/logs?${params}`;
      console.log(`📥 Fazendo requisição para: ${url}`);
      
      const response = await fetch(url);
      console.log(`📊 Resposta recebida: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Logs carregados: ${result.data?.logs?.length || 0} registros`);
        setLogs(result.data?.logs || []);
      } else {
        const errorText = await response.text();
        console.error(`❌ Erro na resposta: ${response.status} - ${errorText}`);
        throw new Error(`Erro ao carregar logs: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar logs:', error);
      toast.error('Erro ao carregar dados brutos');
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    if (!selectedIMEI) return;

    try {
      const response = await fetch(`http://localhost:3002/api/device/${selectedIMEI}/stats`);
      if (response.ok) {
        const result = await response.json();
        setStats(result.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Carregar dados iniciais quando o componente monta
  useEffect(() => {
    console.log(`🎯 RawDataModule montado com selectedIMEI: ${selectedIMEI}`);
    if (selectedIMEI) {
      fetchLogs();
      fetchStats();
    }
  }, []); // Executar apenas uma vez ao montar

  // Carregar dados quando filtros mudarem OU quando selectedIMEI muda
  useEffect(() => {
    if (selectedIMEI) {
      console.log(`🔄 Carregando logs para IMEI: ${selectedIMEI}`);
      fetchLogs();
      fetchStats();
    }
  }, [selectedIMEI, selectedEndpoint, startDate, endDate, limit]);

  // Limpar filtros
  const clearFilters = () => {
    setSelectedEndpoint('');
    setStartDate('');
    setEndDate('');
    setLimit(50);
  };

  // Exportar dados
  const exportData = () => {
    if (logs.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `raw_data_${selectedIMEI}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  // Formatar payload para exibição
  const formatPayload = (payload: any) => {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  // Obter cor do endpoint
  const getEndpointColor = (endpoint: string) => {
    const colors: { [key: string]: string } = {
      '/pushgps': 'bg-blue-500',
      '/pushalarm': 'bg-red-500',
      '/pushevent': 'bg-yellow-500',
      '/pushhb': 'bg-green-500',
      '/pushlogin': 'bg-purple-500',
      '/pushlogout': 'bg-orange-500',
      '/pushTerminalTransInfo': 'bg-pink-500'
    };
    return colors[endpoint] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Dados Brutos</h2>
          <p className="text-gray-400 mt-1">
            Visualize todos os dados recebidos dos dispositivos
            {liveMode && <span className="ml-2 inline-flex items-center gap-1 text-green-400">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Em Tempo Real
            </span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => setLiveMode(!liveMode)}
            className={`${liveMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-600 hover:bg-gray-700'} text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            title={liveMode ? 'Alternar para modo histórico' : 'Alternar para modo em tempo real'}
          >
            <Activity className="w-4 h-4" />
            {liveMode ? 'Ao Vivo' : 'Histórico'}
          </motion.button>
          <motion.button
            onClick={exportData}
            disabled={logs.length === 0}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            whileHover={{ scale: logs.length > 0 ? 1.02 : 1 }}
            whileTap={{ scale: logs.length > 0 ? 0.98 : 1 }}
          >
            <Download className="w-4 h-4" />
            Exportar
          </motion.button>
          <motion.button
            onClick={fetchLogs}
            disabled={loading || liveMode}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            whileHover={{ scale: !loading && !liveMode ? 1.02 : 1 }}
            whileTap={{ scale: !loading && !liveMode ? 0.98 : 1 }}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </motion.button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-400">Total de Logs</p>
                <p className="text-xl font-bold text-white">{stats.totalLogs}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">Endpoints Ativos</p>
                <p className="text-xl font-bold text-white">{stats.endpoints.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-400">Última Atividade</p>
                <p className="text-sm font-medium text-white">
                  {stats.lastActivity ? new Date(stats.lastActivity).toLocaleString('pt-BR') : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-400">IMEI Ativo</p>
                <p className="text-sm font-medium text-white">{stats.imei}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filtros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              IMEI
            </label>
            <input
              type="text"
              value={selectedIMEI}
              onChange={(e) => setSelectedIMEI(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              placeholder="000000000000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Endpoint
            </label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="/pushgps">GPS</option>
              <option value="/pushalarm">Alarmes</option>
              <option value="/pushevent">Eventos</option>
              <option value="/pushhb">Heartbeat</option>
              <option value="/pushlogin">Login</option>
              <option value="/pushlogout">Logout</option>
              <option value="/pushTerminalTransInfo">Terminal Info</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Data Inicial
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Data Final
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Limite
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value={25}>25 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={200}>200 registros</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <motion.button
            onClick={clearFilters}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X className="w-4 h-4" />
            Limpar Filtros
          </motion.button>
        </div>
      </div>

      {/* Lista de logs */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Logs Recentes ({logs.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Nenhum dado encontrado
            </h3>
            <p className="text-gray-500">
              Não há logs para os filtros selecionados
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            <AnimatePresence>
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 hover:bg-gray-800/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-3 h-3 rounded-full ${getEndpointColor(log.endpoint)}`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <motion.button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="text-white font-medium hover:text-blue-400 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {log.endpoint}
                          </motion.button>
                          <span className="text-sm text-gray-400">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                            {log.payloadSize} bytes
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          IMEI: {log.imei}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => {
                          const dataStr = JSON.stringify(log.payload, null, 2);
                          navigator.clipboard.writeText(dataStr);
                          toast.success('Dados copiados para a área de transferência');
                        }}
                        className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Copiar dados"
                      >
                        <Copy className="w-4 h-4" />
                      </motion.button>
                      
                      <motion.button
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title={expandedLog === log.id ? 'Ocultar detalhes' : 'Mostrar detalhes'}
                      >
                        {expandedLog === log.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedLog === log.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 bg-gray-900/50 rounded-lg overflow-hidden"
                      >
                        <div className="flex items-center justify-between p-3 border-b border-gray-700">
                          <div className="flex items-center gap-2">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-300">Payload Completo</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <motion.button
                              onClick={() => {
                                const dataStr = JSON.stringify(log.payload, null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `payload_${log.imei}_${log.id.substring(0, 8)}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                                toast.success('Arquivo JSON baixado');
                              }}
                              className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Baixar como JSON"
                            >
                              <Download className="w-3 h-3" />
                            </motion.button>
                            
                            <motion.button
                              onClick={() => {
                                const dataStr = JSON.stringify(log.payload, null, 2);
                                navigator.clipboard.writeText(dataStr);
                                toast.success('JSON copiado para a área de transferência');
                              }}
                              className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Copiar JSON"
                            >
                              <Copy className="w-3 h-3" />
                            </motion.button>
                          </div>
                        </div>
                        
                        <div className="p-4">
                          {/* Visualização estruturada dos dados importantes */}
                          {log.payload.msg && (
                            <div className="mb-4 p-3 bg-gray-800/50 rounded-lg">
                              <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-500" />
                                Dados Principais
                              </h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                {log.payload.msg.alertType && (
                                  <div>
                                    <span className="text-gray-400">Tipo de Alerta:</span>
                                    <span className="ml-2 text-white font-medium">{log.payload.msg.alertType}</span>
                                  </div>
                                )}
                                {log.payload.msg.alarmTime && (
                                  <div>
                                    <span className="text-gray-400">Hora do Alerta:</span>
                                    <span className="ml-2 text-white font-medium">
                                      {new Date(log.payload.msg.alarmTime).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                )}
                                {log.payload.msg.voltage && (
                                  <div>
                                    <span className="text-gray-400">Voltagem:</span>
                                    <span className="ml-2 text-white font-medium">{log.payload.msg.voltage}V</span>
                                  </div>
                                )}
                                {log.payload.msg.gpsSpeed !== undefined && (
                                  <div>
                                    <span className="text-gray-400">Velocidade:</span>
                                    <span className="ml-2 text-white font-medium">{log.payload.msg.gpsSpeed} km/h</span>
                                  </div>
                                )}
                                {log.payload.msg.satelliteNum !== undefined && (
                                  <div>
                                    <span className="text-gray-400">Satélites:</span>
                                    <span className="ml-2 text-white font-medium">{log.payload.msg.satelliteNum}</span>
                                  </div>
                                )}
                                {log.payload.msg.file && (
                                  <div className="col-span-full">
                                    <span className="text-gray-400">Arquivo:</span>
                                    <span className="ml-2 text-blue-400 font-medium">{log.payload.msg.file}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* JSON completo */}
                          <div>
                            <h4 className="text-sm font-medium text-gray-300 mb-2">JSON Completo</h4>
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap break-all max-h-96 overflow-y-auto bg-black/30 p-3 rounded border border-gray-700 font-mono">
                              {formatPayload(log.payload)}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Estatísticas por endpoint */}
      {stats && stats.endpoints.length > 0 && (
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Estatísticas por Endpoint
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.endpoints.map((endpoint) => (
              <div key={endpoint.endpoint} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-3 h-3 rounded-full ${getEndpointColor(endpoint.endpoint)}`}></div>
                  <span className="text-white font-medium">{endpoint.endpoint}</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-400">
                    Total: <span className="text-white">{endpoint.count}</span>
                  </p>
                  <p className="text-sm text-gray-400">
                    Último: <span className="text-white">
                      {new Date(endpoint.lastSeen).toLocaleString('pt-BR')}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const X = ({ className }: { className: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);