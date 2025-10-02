'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Send, Terminal, Code, Clock, FileText, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface LogEntry {
  id: string;
  imei: string;
  timestamp: string;
  type: 'gps' | 'alarm' | 'command' | 'other';
  data: any;
}

interface CommandTemplate {
  name: string;
  command: string;
  proNo: string;
  description: string;
}

interface CommandHistory {
  id: string;
  imei: string;
  command: string;
  proNo: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
  response?: any;
  sentBy?: string;
}

interface WebhookData {
  id: string;
  timestamp: string;
  endpoint: string;
  imei: string;
  payload: any;
  payloadSize: number;
  status: 'ativo' | 'filtrado';
}

const commandTemplates: CommandTemplate[] = [
  { name: 'VERSION', command: 'VERSION#', proNo: '128', description: 'Obter versão do dispositivo' },
  { name: 'STATUS', command: 'STATUS#', proNo: '128', description: 'Obter status do dispositivo' },
  { name: 'RTMP ON', command: 'RTMP,ON', proNo: '37121', description: 'Iniciar streaming RTMP' },
  { name: 'RTMP OFF', command: 'RTMP,OFF', proNo: '37122', description: 'Parar streaming RTMP' },
  { name: 'PICTURE', command: 'PICTURE,in', proNo: '34817', description: 'Capturar imagem' },
  { name: 'WAKEUP', command: 'WAKEUP_QUERY', proNo: '128', description: 'Acordar dispositivo' },
];

export default function CommandTerminal() {
  const [selectedIMEI, setSelectedIMEI] = useState('860112070135860');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [webhookData, setWebhookData] = useState<WebhookData[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CommandTemplate | null>(null);
  const [command, setCommand] = useState('');
  const [imei, setImei] = useState('860112070135860');
  const [proNo, setProNo] = useState('128');
  const [isSending, setIsSending] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'terminal' | 'history'>('terminal');
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);

  // Simular recebimento de logs (em produção, conectar aos webhooks)
  useEffect(() => {
    if (selectedIMEI) {
      const mockLogs: LogEntry[] = [
        {
          id: '1',
          imei: selectedIMEI,
          timestamp: new Date().toISOString(),
          type: 'gps',
          data: { lat: -23.5505, lng: -46.6333, speed: 45 }
        },
        {
          id: '2',
          imei: selectedIMEI,
          timestamp: new Date().toISOString(),
          type: 'alarm',
          data: { alarm: 'SOS', code: '0x9999' }
        }
      ];
      setLogs(mockLogs);
    } else {
      setLogs([]);
    }
  }, [selectedIMEI]);

  // Buscar dados dos webhooks
  const fetchWebhookData = async () => {
    setIsLoadingWebhooks(true);
    try {
      const response = await fetch(`http://localhost:3002/api/device/${selectedIMEI}/logs?limit=20`);
      const data = await response.json();

      if (data.code === 0) {
        const formattedData: WebhookData[] = data.data.logs.map((log: any) => ({
          id: log.id,
          timestamp: log.timestamp,
          endpoint: log.endpoint,
          imei: log.payload.imei || log.payload.deviceImei || 'unknown',
          payload: log.payload,
          payloadSize: log.payloadSize,
          status: 'ativo' // Por enquanto, assumimos ativo
        }));
        setWebhookData(formattedData);
      }
    } catch (error) {
      console.error('Erro ao buscar dados dos webhooks:', error);
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  const sendCommand = async () => {
    if (!command.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'a12341234123', // Adicionar token de autenticação
          imei,
          cmdContent: command,
          proNo
        }),
      });

      const result = await res.json();

      // Adicionar ao histórico
      const newCommand: CommandHistory = {
        id: Date.now().toString(),
        imei: selectedIMEI,
        command: command.trim(),
        proNo: proNo,
        timestamp: new Date().toISOString(),
        status: res.ok ? 'sent' : 'failed',
        response: result,
        sentBy: 'user'
      };

      setCommandHistory(prev => [newCommand, ...prev]);

      if (res.ok) {
        toast.success('Comando enviado com sucesso!');
        // Adicionar ao log
        const newLog: LogEntry = {
          id: Date.now().toString(),
          imei: selectedIMEI,
          timestamp: new Date().toISOString(),
          type: 'command',
          data: { command, proNo, response: result }
        };
        setLogs(prev => [newLog, ...prev]);
        setCommand('');
      } else {
        toast.error('Erro ao enviar comando: ' + result.error);
        // Adicionar erro ao log
        const errorLog: LogEntry = {
          id: Date.now().toString(),
          imei: selectedIMEI,
          timestamp: new Date().toISOString(),
          type: 'command',
          data: { command, proNo, error: result.error }
        };
        setLogs(prev => [errorLog, ...prev]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error('Erro ao enviar comando: ' + errorMessage);
      // Adicionar erro ao log
      const errorLog: LogEntry = {
        id: Date.now().toString(),
        imei: selectedIMEI,
        timestamp: new Date().toISOString(),
        type: 'command',
        data: { command: command.trim(), proNo, error: errorMessage }
      };
      setLogs(prev => [errorLog, ...prev]);
    } finally {
      setIsSending(false);
    }
  };

  const applyTemplate = (template: CommandTemplate) => {
    setCommand(template.command);
    setProNo(template.proNo);
    setSelectedTemplate(template);
  };

  const formatLogData = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  // Atualizar dados dos webhooks quando o IMEI mudar
  useEffect(() => {
    if (selectedIMEI) {
      fetchWebhookData();
    }
  }, [selectedIMEI]);

  // Atualizar dados dos webhooks a cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedIMEI) {
        fetchWebhookData();
      }
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [selectedIMEI]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-gray-900 border-cyan-500/20">
        <CardHeader className="border-b border-cyan-500/20">
          <CardTitle className="flex items-center gap-2 text-cyan-400">
            <Terminal className="w-5 h-5" />
            Terminal de Comando & Logs
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-cyan-400" />
              <Label htmlFor="terminal-imei" className="text-sm text-gray-300">IMEI do Equipamento:</Label>
            </div>
            <Input
              id="terminal-imei"
              value={selectedIMEI}
              onChange={(e) => setSelectedIMEI(e.target.value)}
              placeholder="Digite o IMEI"
              className="w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0 h-full">
          <Tabs defaultValue="logs" className="h-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-b border-cyan-500/20">
              <TabsTrigger value="logs" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <FileText className="w-4 h-4 mr-2" />
                Logs de Dados
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Settings className="w-4 h-4 mr-2" />
                Dados Webhook
              </TabsTrigger>
              <TabsTrigger value="commands" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Send className="w-4 h-4 mr-2" />
                Envio de Comandos
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400">
                <Clock className="w-4 h-4 mr-2" />
                Histórico de Comandos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="p-4 h-full overflow-auto">
              <div className="space-y-3">
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          log.type === 'alarm' ? 'bg-red-500/20 text-red-400' :
                          log.type === 'gps' ? 'bg-green-500/20 text-green-400' :
                          log.type === 'command' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {log.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <pre className="text-sm text-cyan-300 bg-gray-900 p-2 rounded border border-gray-600 overflow-x-auto">
                      <code>{formatLogData(log.data)}</code>
                    </pre>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="webhooks" className="p-4 h-full overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-cyan-300">Dados dos Webhooks</h3>
                <Button
                  onClick={fetchWebhookData}
                  disabled={isLoadingWebhooks}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  {isLoadingWebhooks ? 'Carregando...' : 'Atualizar'}
                </Button>
              </div>

              <div className="space-y-3">
                {webhookData.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    Nenhum dado de webhook encontrado para o IMEI {selectedIMEI}
                  </div>
                ) : (
                  webhookData.map((data) => (
                    <motion.div
                      key={data.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Settings className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium text-cyan-300">{data.endpoint}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            data.status === 'ativo' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {data.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          {new Date(data.timestamp).toLocaleString()}
                          <span className="text-gray-500">({data.payloadSize} bytes)</span>
                        </div>
                      </div>

                      <div className="bg-gray-900 p-3 rounded border border-gray-600">
                        <pre className="text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(data.payload, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="commands" className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-cyan-400">IMEI do Dispositivo</Label>
                  <Input
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Digite o IMEI"
                  />
                </div>
                <div>
                  <Label className="text-cyan-400">Protocolo (proNo)</Label>
                  <Input
                    value={proNo}
                    onChange={(e) => setProNo(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="128 ou JT/T específico"
                  />
                </div>
              </div>

              <div>
                <Label className="text-cyan-400">Conteúdo do Comando</Label>
                <div className="flex gap-2">
                  <Input
                    value={command}
                    onChange={(e) => setCommand(e.target.value)}
                    className="bg-gray-800 border-gray-600 text-white flex-1"
                    placeholder="Digite o comando ou selecione um template"
                  />
                  <Button
                    onClick={sendCommand}
                    disabled={isSending || !command.trim()}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-cyan-400 mb-2 block">Templates de Comando</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {commandTemplates.map((template) => (
                    <motion.button
                      key={template.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => applyTemplate(template)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        selectedTemplate?.name === template.name
                          ? 'border-cyan-500 bg-cyan-500/10'
                          : 'border-gray-600 bg-gray-800 hover:border-cyan-400'
                      }`}
                    >
                      <div className="font-medium text-cyan-300">{template.name}</div>
                      <div className="text-sm text-gray-400">{template.description}</div>
                      <div className="text-xs text-gray-500 mt-1">proNo: {template.proNo}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-4 h-full overflow-auto">
              <div className="space-y-3">
                {commandHistory.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum comando enviado ainda</p>
                  </div>
                ) : (
                  commandHistory.map((cmd) => (
                    <motion.div
                      key={cmd.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">
                            {new Date(cmd.timestamp).toLocaleString()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            cmd.status === 'sent' ? 'bg-green-500/20 text-green-400' :
                            cmd.status === 'delivered' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {cmd.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          IMEI: {cmd.imei}
                        </div>
                      </div>
                      <div className="mb-2">
                        <div className="text-sm text-cyan-300 font-medium">Comando:</div>
                        <code className="text-sm text-gray-300 bg-gray-900 p-2 rounded border border-gray-600 block">
                          {cmd.command}
                        </code>
                      </div>
                      <div className="text-xs text-gray-500">
                        Protocolo: {cmd.proNo}
                      </div>
                      {cmd.response && (
                        <div className="mt-2">
                          <div className="text-sm text-cyan-300 font-medium">Resposta:</div>
                          <pre className="text-sm text-green-300 bg-gray-900 p-2 rounded border border-gray-600 overflow-x-auto">
                            <code>{JSON.stringify(cmd.response, null, 2)}</code>
                          </pre>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}