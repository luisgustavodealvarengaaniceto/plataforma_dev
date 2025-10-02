import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, StopCircle, Camera, Monitor, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import VideoJsPlayer from '../streaming-test/players/VideoJsPlayer';

interface StreamingModuleProps {
  activeIMEI: string;
}

const StreamingModule: React.FC<StreamingModuleProps> = ({ activeIMEI }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamUrl, setStreamUrl] = useState('');
  const [isCheckingStream, setIsCheckingStream] = useState(false);
  const [streamForm, setStreamForm] = useState({
    imei: activeIMEI,
    channel: '0',
    format: 'flv' as 'flv' | 'hls',
  });

  useEffect(() => {
    setStreamForm(prev => ({ ...prev, imei: activeIMEI }));
  }, [activeIMEI]);

  const handleStartStream = async () => {
    try {
      setIsCheckingStream(true);
      
      const response = await fetch('http://localhost:3002/iniciar-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(streamForm),
      });

      const result = await response.json();
      
      if (result.code === 0) {
        const url = streamForm.format === 'hls' 
          ? `http://137.131.170.156:8881/hls/${streamForm.channel}/${streamForm.imei}.m3u8`
          : `http://137.131.170.156:8881/${streamForm.channel}/${streamForm.imei}.flv`;
        
        setStreamUrl(url);
        setIsStreaming(true);
        toast.success('Streaming iniciado com sucesso!', {
          description: `Canal ${streamForm.channel} - Formato ${streamForm.format.toUpperCase()}`,
        });
      } else {
        throw new Error(result.msg || 'Erro ao iniciar streaming');
      }
    } catch (error: any) {
      toast.error('Erro ao iniciar streaming', {
        description: error.message,
      });
    } finally {
      setIsCheckingStream(false);
    }
  };

  const handleStopStream = () => {
    setIsStreaming(false);
    setStreamUrl('');
    toast.info('Streaming finalizado');
  };

  return (
    <div className="space-y-6">
      {/* Header do Módulo */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Camera className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Streaming de Vídeo</h2>
            <p className="text-blue-100">Transmissão em tempo real do veículo</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel de Controle */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-white/70 backdrop-blur-xl border-blue-100/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Monitor className="w-5 h-5 text-blue-500" />
                Configurações de Streaming
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="imei" className="text-slate-700 font-medium">IMEI do Dispositivo</Label>
                <Input
                  id="imei"
                  value={streamForm.imei}
                  onChange={(e) => setStreamForm(prev => ({ ...prev, imei: e.target.value }))}
                  className="bg-white/80 border-blue-200 focus:border-blue-400"
                  placeholder="Digite o IMEI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="channel" className="text-slate-700 font-medium">Canal</Label>
                <Select
                  value={streamForm.channel}
                  onValueChange={(value) => setStreamForm(prev => ({ ...prev, channel: value }))}
                >
                  <SelectTrigger className="bg-white/80 border-blue-200 focus:border-blue-400">
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3].map((channel) => (
                      <SelectItem key={channel} value={channel.toString()}>
                        Canal {channel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="format" className="text-slate-700 font-medium">Formato</Label>
                <Select
                  value={streamForm.format}
                  onValueChange={(value: 'flv' | 'hls') => setStreamForm(prev => ({ ...prev, format: value }))}
                >
                  <SelectTrigger className="bg-white/80 border-blue-200 focus:border-blue-400">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flv">FLV (Flash Video)</SelectItem>
                    <SelectItem value="hls">HLS (HTTP Live Streaming)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleStartStream}
                  disabled={isCheckingStream || isStreaming}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg transition-all duration-300 hover:scale-105"
                >
                  {isCheckingStream ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Iniciando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      Iniciar Stream
                    </div>
                  )}
                </Button>

                <Button
                  onClick={handleStopStream}
                  disabled={!isStreaming}
                  variant="outline"
                  className="bg-white/80 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-300"
                >
                  <StopCircle className="w-4 h-4 mr-2" />
                  Parar
                </Button>
              </div>

              {/* Status do Streaming */}
              <div className="mt-4 p-3 rounded-lg bg-slate-50">
                <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-slate-400" />
                  )}
                  <span className="text-sm font-medium text-slate-700">
                    Status: {isStreaming ? 'Transmitindo' : 'Parado'}
                  </span>
                </div>
                {streamUrl && (
                  <div className="mt-2 text-xs text-slate-500 break-all">
                    URL: {streamUrl}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Player de Vídeo */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="bg-white/70 backdrop-blur-xl border-blue-100/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Camera className="w-5 h-5 text-blue-500" />
                Visualização do Stream
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-video">
                <AnimatePresence>
                  {isStreaming && streamUrl ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.5 }}
                      className="w-full h-full"
                    >
                      <VideoJsPlayer
                        options={{
                          autoplay: true,
                          controls: true,
                          responsive: true,
                          fluid: true,
                          sources: [{
                            src: streamUrl,
                            type: streamForm.format === 'hls' ? 'application/x-mpegURL' : 'video/x-flv'
                          }]
                        }}
                        start={true}
                        timeout={30000}
                        duration={0}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="text-center text-white/60">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-40" />
                        <p className="text-lg font-medium mb-2">Aguardando Stream</p>
                        <p className="text-sm">Configure e inicie o streaming para visualizar</p>
                      </div>
                    </motion.div>
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

export default StreamingModule;