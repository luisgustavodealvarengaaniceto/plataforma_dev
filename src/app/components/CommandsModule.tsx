import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Zap, 
  Settings, 
  History, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Eye, 
  Copy,
  ChevronDown,
  ChevronUp,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface CommandsModuleProps {
  activeIMEI: string;
}

interface CommandHistory {
  id: string;
  command: string;
  protocol: string;
  timestamp: Date;
  status: 'success' | 'error' | 'pending';
  response?: any;
  responseCode?: number;
  responseMessage?: string;
  executionTime?: number;
}

const CommandsModule: React.FC<CommandsModuleProps> = ({ activeIMEI }) => {
  const [commandForm, setCommandForm] = useState({
    imei: activeIMEI,
    cmdContent: '',
    proNo: '128',
  });
  const [isSending, setIsSending] = useState(false);
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([]);
  const [expandedCommand, setExpandedCommand] = useState<string | null>(null);

  const predefinedCommands = [
    { label: 'VIBRATION', value: 'VIBRATION', description: 'Ativar vibração do dispositivo' },
    { label: 'LOCATION', value: 'LOCATION', description: 'Solicitar localização atual' },
    { label: 'REBOOT', value: 'REBOOT', description: 'Reiniciar dispositivo' },
    { label: 'PHOTO INTERNAL', value: 'PICTURE,in', description: 'Tirar foto da câmera interna', proNo: '128' },
    { label: 'PHOTO EXTERNAL', value: 'PICTURE,out', description: 'Tirar foto da câmera externa', proNo: '128' },
    { label: 'VIDEO INTERNAL', value: 'VIDEO,in', description: 'Gravar vídeo da câmera interna', proNo: '128' },
    { label: 'VIDEO EXTERNAL', value: 'VIDEO,out', description: 'Gravar vídeo da câmera externa', proNo: '128' },
    { label: 'CONFIG UPLOAD', value: 'UPLOAD,http://137.131.170.156:23010/upload', description: 'Configurar URL de upload de mídia', proNo: '128' },
    { label: 'ALARM_ON', value: 'ALARM_ON', description: 'Ativar alarme' },
    { label: 'ALARM_OFF', value: 'ALARM_OFF', description: 'Desativar alarme' },
  ];

  useEffect(() => {
    setCommandForm(prev => ({ ...prev, imei: activeIMEI }));
  }, [activeIMEI]);

  const handleSendCommand = async () => {
    if (!commandForm.cmdContent.trim()) {
      toast.error('Comando não pode estar vazio');
      return;
    }

    setIsSending(true);
    const commandId = Date.now().toString();
    const startTime = Date.now();
    
    // Adicionar comando ao histórico como pendente
    const newCommand: CommandHistory = {
      id: commandId,
      command: commandForm.cmdContent,
      protocol: commandForm.proNo,
      timestamp: new Date(),
      status: 'pending',
    };
    
    setCommandHistory(prev => [newCommand, ...prev.slice(0, 9)]);

    try {
      const response = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commandForm),
      });

      const result = await response.json();
      const executionTime = Date.now() - startTime;
      
      // Atualizar status do comando no histórico
      setCommandHistory(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { 
                ...cmd, 
                status: result.code === 0 ? 'success' : 'error',
                response: result,
                responseCode: result.code,
                responseMessage: result.msg || result.message,
                executionTime
              }
            : cmd
        )
      );

      if (result.code === 0) {
        toast.success('Comando enviado com sucesso!', {
          description: `${commandForm.cmdContent} - Protocolo ${commandForm.proNo} (${executionTime}ms)`,
        });
        setCommandForm(prev => ({ ...prev, cmdContent: '' }));
      } else {
        throw new Error(result.msg || result.message || 'Erro ao enviar comando');
      }
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      // Atualizar status como erro
      setCommandHistory(prev => 
        prev.map(cmd => 
          cmd.id === commandId 
            ? { 
                ...cmd, 
                status: 'error',
                response: { error: error.message },
                responseMessage: error.message,
                executionTime
              }
            : cmd
        )
      );

      console.error('Erro ao enviar comando:', error);
      toast.error('Erro ao enviar comando', {
        description: error.message,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handlePredefinedCommand = (command: string) => {
    // Encontrar o comando predefinido correspondente para obter o proNo
    const predefinedCmd = predefinedCommands.find(cmd => cmd.value === command);
    const proNo = predefinedCmd?.proNo || commandForm.proNo; // Usar o proNo do comando ou manter o atual
    
    setCommandForm(prev => ({ 
      ...prev, 
      cmdContent: command,
      proNo: proNo
    }));
  };

  const handleMediaTest = async (testType: string) => {
    if (!activeIMEI) {
      toast.error('Nenhum IMEI ativo selecionado');
      return;
    }

    setIsSending(true);
    const startTime = Date.now();

    try {
      let response;
      let endpoint = '';

      switch (testType) {
        case 'verify-setup':
          endpoint = '/api/media/verify-setup';
          response = await fetch('http://localhost:3002' + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imei: activeIMEI })
          });
          break;

        case 'capture-test':
          endpoint = '/api/media/capture-test';
          response = await fetch('http://localhost:3002' + endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imei: activeIMEI, type: 'PICTURE', camera: 'in' })
          });
          break;

        case 'list-media':
          endpoint = `/api/media/list/${activeIMEI}`;
          response = await fetch('http://localhost:3002' + endpoint);
          break;

        default:
          throw new Error('Tipo de teste inválido');
      }

      const data = await response.json();
      const executionTime = Date.now() - startTime;

      const newCommand: CommandHistory = {
        id: Date.now().toString(),
        command: `Teste de Mídia: ${testType}`,
        protocol: 'Media API',
        timestamp: new Date(),
        status: data.code === 0 ? 'success' : 'error',
        response: data,
        responseCode: data.code,
        responseMessage: data.message,
        executionTime
      };

      setCommandHistory(prev => [newCommand, ...prev]);

      if (data.code === 0) {
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Erro no teste de mídia');
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorCommand: CommandHistory = {
        id: Date.now().toString(),
        command: `Teste de Mídia: ${testType}`,
        protocol: 'Media API',
        timestamp: new Date(),
        status: 'error',
        response: error,
        responseMessage: error instanceof Error ? error.message : 'Erro desconhecido',
        executionTime
      };

      setCommandHistory(prev => [errorCommand, ...prev]);
      toast.error('Erro ao executar teste de mídia');
    } finally {
      setIsSending(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatResponse = (response: any) => {
    if (!response) return 'Sem resposta';
    if (typeof response === 'string') return response;
    try {
      return JSON.stringify(response, null, 2);
    } catch {
      return String(response);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Send className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Central de Comandos</h2>
            <p className="text-green-100">Envie comandos para os dispositivos</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Envio */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-white/70 backdrop-blur-xl border-blue-100/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Zap className="w-5 h-5 text-green-500" />
                Enviar Comando
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imei" className="text-slate-700 font-medium">IMEI do Dispositivo</Label>
                <Input
                  id="imei"
                  value={commandForm.imei}
                  onChange={(e) => setCommandForm(prev => ({ ...prev, imei: e.target.value }))}
                  className="bg-white/80 border-blue-200 focus:border-blue-400"
                  placeholder="Digite o IMEI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="protocol" className="text-slate-700 font-medium">Protocolo</Label>
                <Select
                  value={commandForm.proNo}
                  onValueChange={(value) => setCommandForm(prev => ({ ...prev, proNo: value }))}
                >
                  <SelectTrigger className="bg-white/80 border-blue-200 focus:border-blue-400">
                    <SelectValue placeholder="Selecione o protocolo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">Protocolo 128</SelectItem>
                    <SelectItem value="37121">Protocolo 37121</SelectItem>
                    <SelectItem value="256">Protocolo 256</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="command" className="text-slate-700 font-medium">Comando</Label>
                <Input
                  id="command"
                  value={commandForm.cmdContent}
                  onChange={(e) => setCommandForm(prev => ({ ...prev, cmdContent: e.target.value }))}
                  className="bg-white/80 border-blue-200 focus:border-blue-400"
                  placeholder="Digite o comando ou selecione um pré-definido"
                />
              </div>

              {/* Comandos Pré-definidos */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-medium">Comandos Rápidos</Label>
                <div className="grid grid-cols-2 gap-2">
                  {predefinedCommands.map((cmd) => (
                    <Button
                      key={cmd.value}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePredefinedCommand(cmd.value)}
                      className="bg-white/80 hover:bg-blue-50 border-blue-200 text-slate-700 hover:border-blue-400 transition-all duration-300"
                      title={cmd.description}
                    >
                      {cmd.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Testes do Sistema de Mídia */}
              <div className="space-y-2 border-t pt-4">
                <Label className="text-slate-700 font-medium">🎥 Testes de Mídia</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMediaTest('verify-setup')}
                    className="bg-white/80 hover:bg-orange-50 border-orange-200 text-slate-700 hover:border-orange-400 transition-all duration-300"
                    title="Verificar configuração do sistema de mídia"
                  >
                    🔍 Verificar Setup
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMediaTest('capture-test')}
                    className="bg-white/80 hover:bg-purple-50 border-purple-200 text-slate-700 hover:border-purple-400 transition-all duration-300"
                    title="Testar captura de foto"
                  >
                    📸 Teste Captura
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMediaTest('list-media')}
                    className="bg-white/80 hover:bg-blue-50 border-blue-200 text-slate-700 hover:border-blue-400 transition-all duration-300"
                    title="Listar mídia disponível"
                  >
                    📁 Listar Mídia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePredefinedCommand('UPLOAD,http://137.131.170.156:23010/upload')}
                    className="bg-white/80 hover:bg-green-50 border-green-200 text-slate-700 hover:border-green-400 transition-all duration-300"
                    title="Configurar URL de upload"
                  >
                    ⚙️ Config Upload
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleSendCommand}
                disabled={isSending || !commandForm.cmdContent.trim()}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 hover:scale-105"
              >
                {isSending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Enviar Comando
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Histórico de Comandos */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/70 backdrop-blur-xl border-blue-100/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <History className="w-5 h-5 text-blue-500" />
                Histórico de Comandos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <AnimatePresence>
                  {commandHistory.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Nenhum comando enviado ainda</p>
                    </div>
                  ) : (
                    commandHistory.map((cmd, index) => (
                      <motion.div
                        key={cmd.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`
                          p-3 rounded-lg border transition-all duration-300 hover:shadow-md
                          ${cmd.status === 'success' 
                            ? 'bg-green-50 border-green-200' 
                            : cmd.status === 'error'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getStatusIcon(cmd.status)}
                              <span className="font-mono text-sm font-semibold text-slate-800">
                                {cmd.command}
                              </span>
                              <span className="text-xs bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                                {cmd.protocol}
                              </span>
                              {cmd.executionTime && (
                                <span className="text-xs text-slate-400">
                                  {cmd.executionTime}ms
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {cmd.timestamp.toLocaleTimeString('pt-BR')}
                            </div>
                            
                            {/* Resposta básica */}
                            {cmd.responseMessage && (
                              <div className="text-xs mt-1 text-slate-600">
                                <span className="text-slate-500">Resposta:</span> {cmd.responseMessage}
                                {cmd.responseCode !== undefined && (
                                  <span className="ml-2 text-xs bg-slate-200 px-1 py-0.5 rounded">
                                    Código: {cmd.responseCode}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Botão para expandir detalhes */}
                          {cmd.response && (
                            <motion.button
                              onClick={() => setExpandedCommand(expandedCommand === cmd.id ? null : cmd.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Ver detalhes da resposta"
                            >
                              {expandedCommand === cmd.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </motion.button>
                          )}
                        </div>
                        
                        {/* Detalhes expandidos */}
                        <AnimatePresence>
                          {expandedCommand === cmd.id && cmd.response && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-3 pt-3 border-t border-slate-200"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-slate-600">Resposta Completa</span>
                                <motion.button
                                  onClick={() => {
                                    navigator.clipboard.writeText(formatResponse(cmd.response));
                                    toast.success('Resposta copiada para a área de transferência');
                                  }}
                                  className="p-1 text-slate-400 hover:text-green-500 transition-colors"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  title="Copiar resposta"
                                >
                                  <Copy className="w-3 h-3" />
                                </motion.button>
                              </div>
                              <pre className="text-xs text-slate-700 bg-slate-100 p-2 rounded border border-slate-200 overflow-x-auto">
                                {formatResponse(cmd.response)}
                              </pre>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default CommandsModule;