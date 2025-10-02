'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Activity, AlertCircle, CheckCircle, Info, Clock, Database } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import io, { Socket } from 'socket.io-client';

const diagnosticSchema = z.object({
  imei: z.string().min(1, 'IMEI é obrigatório'),
  channel: z.string().min(1, 'Canal é obrigatório'),
});

type DiagnosticForm = z.infer<typeof diagnosticSchema>;

interface DiagnosticLog {
  message: string;
  status: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

export default function DiagnosticsPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<DiagnosticLog[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [socketId, setSocketId] = useState<string>('');

  const diagnosticForm = useForm<DiagnosticForm>({
    resolver: zodResolver(diagnosticSchema),
    defaultValues: {
      imei: '860112070135860',
      channel: '1',
    },
  });

  useEffect(() => {
    // Conectar ao Socket.IO
    const newSocket = io('http://localhost:3002');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      const id = newSocket.id;
      if (id) {
        setSocketId(id);
        console.log('Conectado ao servidor de diagnóstico:', id);
      }
    });

    newSocket.on('diagnostic_status', (log: DiagnosticLog) => {
      setDiagnosticLogs(prev => [...prev, log]);
    });

    newSocket.on('disconnect', () => {
      console.log('Desconectado do servidor de diagnóstico');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const onDiagnosticSubmit = async (data: DiagnosticForm) => {
    if (!socket || !socketId) {
      toast.error('Conexão com servidor não estabelecida');
      return;
    }

    setIsTesting(true);
    setDiagnosticLogs([]);

    try {
      const response = await fetch('http://localhost:3002/api/diagnostics/streaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          socketId
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        toast.error('Erro ao iniciar diagnóstico: ' + result.error);
        setIsTesting(false);
      } else {
        toast.success('Diagnóstico iniciado com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-700 bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center text-white font-bold text-xl">
              🔍
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Diagnóstico de Streaming
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Monitore o ciclo de vida completo de uma sessão de streaming em tempo real
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/">
              <Button variant="outline" className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Voltar ao Streaming
              </Button>
            </Link>
            <Link href="/logs">
              <Button variant="outline" className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Visualizar Logs
              </Button>
            </Link>
            <Link href="/device-data">
              <Button variant="outline" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Dados do Dispositivo
              </Button>
            </Link>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5 text-primary" />
                  Iniciar Diagnóstico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={diagnosticForm.handleSubmit(onDiagnosticSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="imei">IMEI do Dispositivo</Label>
                    <Input
                      id="imei"
                      {...diagnosticForm.register('imei')}
                      placeholder="Digite o IMEI"
                      disabled={isTesting}
                    />
                    {diagnosticForm.formState.errors.imei && (
                      <p className="text-sm text-red-500">{diagnosticForm.formState.errors.imei.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="channel">Canal</Label>
                    <Input
                      id="channel"
                      {...diagnosticForm.register('channel')}
                      placeholder="Número do canal"
                      disabled={isTesting}
                    />
                    {diagnosticForm.formState.errors.channel && (
                      <p className="text-sm text-red-500">{diagnosticForm.formState.errors.channel.message}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Timeout: 45 segundos</span>
                  </div>
                  <Button type="submit" className="w-full" disabled={isTesting || !socket}>
                    {isTesting ? 'Teste em Andamento...' : 'Iniciar Teste de Streaming'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Log de Eventos em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {diagnosticLogs.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Aguardando início do teste...</p>
                    </div>
                  ) : (
                    diagnosticLogs.map((log, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-3 rounded-lg border ${getStatusColor(log.status)}`}
                      >
                        <div className="flex items-start gap-2">
                          {getStatusIcon(log.status)}
                          <div className="flex-1">
                            <p className="text-sm font-medium">{log.message}</p>
                            <p className="text-xs opacity-70 mt-1">
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <Card>
            <CardHeader>
              <CardTitle>Como Funciona o Diagnóstico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <p className="font-medium">Envio do Comando</p>
                  <p className="text-muted-foreground">Envia comando JT/T para iniciar streaming</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <p className="font-medium">Monitoramento</p>
                  <p className="text-muted-foreground">Monitora logs do iothub-media em tempo real</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <p className="font-medium">Análise</p>
                  <p className="text-muted-foreground">Detecta sucesso, timeout ou falha na transmissão</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}