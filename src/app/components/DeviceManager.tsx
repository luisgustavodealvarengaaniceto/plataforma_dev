'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Battery, Zap, AlertTriangle, CheckCircle, Clock, Settings, Camera, Video, Play, Square } from 'lucide-react';
import { toast } from 'sonner';

type DeviceStatus = 'online' | 'offline' | 'hibernating' | 'waking_up' | 'unknown';

interface DeviceState {
  imei: string;
  status: DeviceStatus;
  lastSeen: string;
  batteryLevel?: number;
  temperature?: number;
  location?: { lat: number; lng: number };
  alarms: string[];
}

interface CommandLog {
  id: string;
  timestamp: Date;
  command: string;
  status: 'sent' | 'success' | 'error' | 'timeout';
  response?: any;
  error?: string;
}

interface DeviceManagerProps {
  activeIMEI?: string;
}

export default function DeviceManager({ activeIMEI }: DeviceManagerProps) {
  const [selectedIMEI, setSelectedIMEI] = useState(activeIMEI || '860112070135860');
  const [deviceState, setDeviceState] = useState<DeviceState>({
    imei: selectedIMEI,
    status: 'unknown',
    lastSeen: new Date().toISOString(),
    batteryLevel: 85,
    temperature: 42,
    location: { lat: -23.5505, lng: -46.6333 },
    alarms: []
  });
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);

  // Atualizar IMEI quando o prop mudar
  useEffect(() => {
    if (activeIMEI) {
      setSelectedIMEI(activeIMEI);
      setDeviceState(prev => ({ ...prev, imei: activeIMEI }));
    }
  }, [activeIMEI]);

  const addCommandLog = (command: string, status: CommandLog['status'], response?: any, error?: string) => {
    const newLog: CommandLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      command,
      status,
      response,
      error
    };
    setCommandLogs(prev => [newLog, ...prev.slice(0, 49)]); // Manter apenas os últimos 50 logs
  };

  // Simular monitoramento de estado - em produção conectar aos webhooks
  useEffect(() => {
    // Simular mudança de estado baseada em alarmes
    const interval = setInterval(() => {
      // Simular recebimento de alarme 0x0410 (hibernando)
      if (Math.random() < 0.1) { // 10% chance a cada intervalo
        setDeviceState(prev => ({
          ...prev,
          status: 'hibernating',
          alarms: [...prev.alarms, '0x0410 - Dispositivo hibernando']
        }));
        toast.warning('Dispositivo entrou em modo de hibernação');
      }

      // Simular recebimento de alarme 0x0411 (acordado)
      if (Math.random() < 0.05) { // 5% chance
        setDeviceState(prev => ({
          ...prev,
          status: 'online',
          alarms: prev.alarms.filter(alarm => !alarm.includes('0x0410'))
        }));
        toast.success('Dispositivo acordado');
      }
    }, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  const wakeUpDevice = async () => {
    setIsWakingUp(true);
    const command = `WAKEUP_QUERY (proNo: 128)`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'a12341234123', // Adicionar token de autenticação
          imei: '860112070135860',
          cmdContent: 'WAKEUP_QUERY',
          proNo: '128'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeviceState(prev => ({ ...prev, status: 'waking_up' }));
        addCommandLog(command, 'success', data);
        toast.info('Comando de despertar enviado. Aguardando resposta...');

        // Simular resposta após alguns segundos
        setTimeout(() => {
          setDeviceState(prev => ({ ...prev, status: 'online' }));
          toast.success('Dispositivo acordado com sucesso!');
          setIsWakingUp(false);
        }, 3000);
      } else {
        const errorData = await res.text();
        addCommandLog(command, 'error', null, `HTTP ${res.status}: ${errorData}`);
        toast.error('Erro ao enviar comando de despertar');
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    } finally {
      setIsWakingUp(false);
    }
  };

  const acknowledgeSOS = async () => {
    setIsAcknowledging(true);
    const command = `SOS_ACK (proNo: 33283)`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'a12341234123', // Adicionar token de autenticação
          imei: '860112070135860',
          cmdContent: 'SOS_ACK',
          proNo: '33283' // JT/T proNo para silenciar SOS
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDeviceState(prev => ({
          ...prev,
          alarms: prev.alarms.filter(alarm => !alarm.includes('SOS'))
        }));
        addCommandLog(command, 'success', data);
        toast.success('SOS acusado. Alarme silenciado.');
      } else {
        const errorData = await res.text();
        addCommandLog(command, 'error', null, `HTTP ${res.status}: ${errorData}`);
        toast.error('Erro ao acusar SOS');
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const acknowledgeAlarm = async (alarmCode: string) => {
    if (!selectedIMEI) return;

    setIsAcknowledging(true);
    try {
      // Enviar comando de reconhecimento
      const response = await fetch('/api/device/sendInstruct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: selectedIMEI,
          cmdContent: `ACK,${alarmCode}`,
          proNo: '128'
        })
      });

      if (response.ok) {
        toast.success('Alarme reconhecido');
      } else {
        toast.error('Erro ao reconhecer alarme');
      }
    } catch (error) {
      toast.error('Erro de conexão');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const startStreaming = async () => {
    setIsStreaming(true);
    const command = `START_STREAM (proNo: 12345)`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'a12341234123', // Adicionar token de autenticação
          imei: '860112070135860',
          cmdContent: 'START_STREAM',
          proNo: '12345'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStreamUrl(data.streamUrl);
        addCommandLog(command, 'success', data);
        toast.success('Streaming iniciado com sucesso!');
      } else {
        const errorData = await res.text();
        addCommandLog(command, 'error', null, `HTTP ${res.status}: ${errorData}`);
        toast.error('Erro ao iniciar streaming');
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    } finally {
      setIsStreaming(false);
    }
  };

  const stopStreaming = async () => {
    setIsStreaming(true);
    const command = `STOP_STREAM (proNo: 12345)`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'a12341234123', // Adicionar token de autenticação
          imei: '860112070135860',
          cmdContent: 'STOP_STREAM',
          proNo: '12345'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStreamUrl(null);
        addCommandLog(command, 'success', data);
        toast.success('Streaming parado com sucesso!');
      } else {
        const errorData = await res.text();
        addCommandLog(command, 'error', null, `HTTP ${res.status}: ${errorData}`);
        toast.error('Erro ao parar streaming');
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    } finally {
      setIsStreaming(false);
    }
  };

  const startCapture = async () => {
    setIsCapturing(true);
    const command = `START_CAPTURE (proNo: 12345)`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: '860112070135860',
          cmdContent: 'START_CAPTURE',
          proNo: '12345'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addCommandLog(command, 'success', data);
        toast.success('Captura de mídia iniciada com sucesso!');
      } else {
        const errorData = await res.text();
        addCommandLog(command, 'error', null, `HTTP ${res.status}: ${errorData}`);
        toast.error('Erro ao iniciar captura de mídia');
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    } finally {
      setIsCapturing(false);
    }
  };

  const stopCapture = async () => {
    setIsCapturing(true);
    const command = `STOP_CAPTURE (proNo: 12345)`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: '860112070135860',
          cmdContent: 'STOP_CAPTURE',
          proNo: '12345'
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addCommandLog(command, 'success', data);
        toast.success('Captura de mídia parada com sucesso!');
      } else {
        const errorData = await res.text();
        addCommandLog(command, 'error', null, `HTTP ${res.status}: ${errorData}`);
        toast.error('Erro ao parar captura de mídia');
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    } finally {
      setIsCapturing(false);
    }
  };

  const capturePhoto = async (camera: 'in' | 'out' | 'inout' = 'in') => {
    const command = `PICTURE,${camera}`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('/api/media/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: selectedIMEI || '860112070135860',
          type: 'photo',
          camera
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addCommandLog(command, 'success', data);
        toast.success(`Foto capturada da câmera ${camera === 'in' ? 'interna' : camera === 'out' ? 'externa' : 'ambas'}!`);
      } else {
        const error = await res.json();
        addCommandLog(command, 'error', error, error.message);
        toast.error(`Erro ao capturar foto: ${error.message}`);
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    }
  };

  const captureVideo = async (camera: 'in' | 'out' = 'in', duration: string = '10s') => {
    const command = `VIDEO,${camera},${duration}`;
    addCommandLog(command, 'sent');

    try {
      const res = await fetch('/api/media/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: selectedIMEI || '860112070135860',
          type: 'video',
          camera,
          duration
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addCommandLog(command, 'success', data);
        toast.success(`Vídeo de ${duration} gravado da câmera ${camera === 'in' ? 'interna' : 'externa'}!`);
      } else {
        const error = await res.json();
        addCommandLog(command, 'error', error, error.message);
        toast.error(`Erro ao gravar vídeo: ${error.message}`);
      }
    } catch (error) {
      addCommandLog(command, 'error', null, error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro de conexão');
    }
  };

  const getStatusColor = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return 'text-green-400';
      case 'offline': return 'text-red-400';
      case 'hibernating': return 'text-yellow-400';
      case 'waking_up': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return <CheckCircle className="w-5 h-5" />;
      case 'offline': return <AlertTriangle className="w-5 h-5" />;
      case 'hibernating': return <Clock className="w-5 h-5" />;
      case 'waking_up': return <Zap className="w-5 h-5" />;
      default: return <Radio className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: DeviceStatus) => {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      case 'hibernating': return 'Hibernando';
      case 'waking_up': return 'Acordando...';
      default: return 'Desconhecido';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-gray-900 border-green-500/20">
        <CardHeader className="border-b border-green-500/20">
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Radio className="w-5 h-5" />
            Comunicador e Gestão de Dispositivo
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-green-400" />
              <Label htmlFor="device-imei" className="text-sm text-gray-300">IMEI do Equipamento:</Label>
            </div>
            <Input
              id="device-imei"
              value={selectedIMEI}
              onChange={(e) => setSelectedIMEI(e.target.value)}
              placeholder="Digite o IMEI"
              className="w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Status do Dispositivo */}
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-green-300">Status do Dispositivo</h3>
              <div className={`flex items-center gap-2 ${getStatusColor(deviceState.status)}`}>
                {getStatusIcon(deviceState.status)}
                <span className="font-medium">{getStatusText(deviceState.status)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-700 rounded p-3">
                <div className="text-sm text-gray-400 mb-1">Última Comunicação</div>
                <div className="text-white font-medium">
                  {new Date(deviceState.lastSeen).toLocaleString()}
                </div>
              </div>

              {deviceState.batteryLevel && (
                <div className="bg-gray-700 rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-400">Bateria</span>
                    <Battery className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-white font-medium">{deviceState.batteryLevel}%</div>
                </div>
              )}
            </div>

            {deviceState.temperature && (
              <div className="bg-gray-700 rounded p-3 mb-4">
                <div className="text-sm text-gray-400 mb-1">Temperatura</div>
                <div className="text-white font-medium">{deviceState.temperature}°C</div>
              </div>
            )}

            {/* Controles de Ação */}
            <div className="space-y-3">
              <Button
                onClick={wakeUpDevice}
                disabled={deviceState.status === 'online' || deviceState.status === 'waking_up' || isWakingUp}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
              >
                {isWakingUp ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Acordando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Acordar Dispositivo
                  </>
                )}
              </Button>

              {deviceState.alarms.some(alarm => alarm.includes('SOS')) && (
                <Button
                  onClick={acknowledgeSOS}
                  disabled={isAcknowledging}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {isAcknowledging ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Acusando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Acusar Recebimento de SOS
                    </>
                  )}
                </Button>
              )}

              {/* Streaming e Captura de Mídia */}
              <div className="flex gap-4">
                <Button
                  onClick={isStreaming ? stopStreaming : startStreaming}
                  className={`flex-1 ${isStreaming ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-gray-600`}
                  disabled={isWakingUp || isAcknowledging}
                >
                  {isStreaming ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Parar Streaming
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 mr-2" />
                      Iniciar Streaming
                    </>
                  )}
                </Button>

                <Button
                  onClick={isCapturing ? stopCapture : startCapture}
                  className={`flex-1 ${isCapturing ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} disabled:bg-gray-600`}
                  disabled={isWakingUp || isAcknowledging}
                >
                  {isCapturing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Parar Captura
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4 mr-2" />
                      Iniciar Captura
                    </>
                  )}
                </Button>
              </div>

              {/* Captura de Foto e Vídeo */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => capturePhoto('in')}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
                  disabled={isWakingUp || isAcknowledging}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Foto Interna
                </Button>

                <Button
                  onClick={() => capturePhoto('out')}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600"
                  disabled={isWakingUp || isAcknowledging}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Foto Externa
                </Button>

                <Button
                  onClick={() => captureVideo('in', '10s')}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600"
                  disabled={isWakingUp || isAcknowledging}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Vídeo Int. (10s)
                </Button>

                <Button
                  onClick={() => captureVideo('out', '10s')}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600"
                  disabled={isWakingUp || isAcknowledging}
                >
                  <Video className="w-4 h-4 mr-2" />
                  Vídeo Ext. (10s)
                </Button>
              </div>
            </div>
          </div>

          {/* Lista de Alarmes Ativos */}
          {deviceState.alarms.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-red-400 mb-3">Alarmes Ativos</h3>
              <div className="space-y-2">
                {deviceState.alarms.map((alarm, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded p-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <span className="text-red-300 text-sm">{alarm}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Informações Técnicas */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-300 mb-3">Informações Técnicas</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">IMEI:</span>
                <span className="text-white">860112070135860</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Protocolo:</span>
                <span className="text-white">JIMI + JT/T</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Firmware:</span>
                <span className="text-white">v2.1.8</span>
              </div>
              {deviceState.location && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Localização:</span>
                  <span className="text-white">
                    {deviceState.location.lat.toFixed(4)}, {deviceState.location.lng.toFixed(4)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Histórico de Comandos */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-medium text-green-300 mb-3">Histórico de Comandos</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {commandLogs.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-4">
                  Nenhum comando enviado ainda
                </div>
              ) : (
                commandLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-start gap-3 p-3 rounded border ${
                      log.status === 'success'
                        ? 'bg-green-500/10 border-green-500/20'
                        : log.status === 'error'
                        ? 'bg-red-500/10 border-red-500/20'
                        : log.status === 'sent'
                        ? 'bg-blue-500/10 border-blue-500/20'
                        : 'bg-gray-500/10 border-gray-500/20'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      log.status === 'success'
                        ? 'bg-green-400'
                        : log.status === 'error'
                        ? 'bg-red-400'
                        : log.status === 'sent'
                        ? 'bg-blue-400'
                        : 'bg-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white truncate">
                          {log.command}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          log.status === 'success'
                            ? 'bg-green-500/20 text-green-300'
                            : log.status === 'error'
                            ? 'bg-red-500/20 text-red-300'
                            : log.status === 'sent'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {log.status === 'success' ? 'Sucesso' :
                           log.status === 'error' ? 'Erro' :
                           log.status === 'sent' ? 'Enviado' : 'Timeout'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mb-1">
                        {log.timestamp.toLocaleTimeString()}
                      </div>
                      {log.error && (
                        <div className="text-xs text-red-300 bg-red-500/10 p-2 rounded mt-1">
                          {log.error}
                        </div>
                      )}
                      {log.response && (
                        <div className="text-xs text-green-300 bg-green-500/10 p-2 rounded mt-1">
                          {JSON.stringify(log.response, null, 2)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}