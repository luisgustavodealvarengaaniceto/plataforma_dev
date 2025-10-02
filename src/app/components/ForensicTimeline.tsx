'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, Clock, Download, Play, AlertTriangle, Search } from 'lucide-react';
import { toast } from 'sonner';

interface TimelineEvent {
  id: string;
  imei: string;
  timestamp: string;
  type: 'gps' | 'alarm' | 'video';
  data: any;
  position?: { lat: number; lng: number };
}

export default function ForensicTimeline() {
  const [selectedIMEI, setSelectedIMEI] = useState('860112070135860');
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Mock data - em produção conectar aos webhooks
  useEffect(() => {
    if (selectedIMEI) {
      const mockEvents: TimelineEvent[] = [
        {
          id: '1',
          imei: selectedIMEI,
          timestamp: '2025-09-30T10:00:00Z',
          type: 'gps',
          data: { lat: -23.5505, lng: -46.6333, speed: 45 },
          position: { lat: -23.5505, lng: -46.6333 }
        },
        {
          id: '2',
          imei: selectedIMEI,
          timestamp: '2025-09-30T10:15:00Z',
          type: 'alarm',
          data: { alarm: 'SOS', code: '0x9999' },
          position: { lat: -23.5510, lng: -46.6340 }
        },
        {
          id: '3',
          imei: selectedIMEI,
          timestamp: '2025-09-30T10:30:00Z',
          type: 'video',
          data: { hasVideo: true, duration: 30 },
          position: { lat: -23.5515, lng: -46.6350 }
        }
      ];
      setEvents(mockEvents);
    } else {
      setEvents([]);
    }
  }, [selectedIMEI]);

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
  };

  const downloadVideoSegment = async (event: TimelineEvent) => {
    if (event.type !== 'video') return;

    setIsDownloading(true);
    try {
      // Simular download - em produção implementar lógica real
      toast.success('Download iniciado! Monitorando progresso...');

      // Simular progresso
      setTimeout(() => {
        toast.success('Download concluído!');
        setIsDownloading(false);
      }, 3000);

    } catch (error) {
      toast.error('Erro ao baixar vídeo');
      setIsDownloading(false);
    }
  };

  const playVideoSegment = async (event: TimelineEvent) => {
    if (event.type !== 'video') return;

    try {
      // Em produção, implementar busca de vídeo histórico
      toast.info('Buscando vídeo histórico...');
    } catch (error) {
      toast.error('Erro ao reproduzir vídeo');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-gray-900 border-orange-500/20">
        <CardHeader className="border-b border-orange-500/20">
          <CardTitle className="flex items-center gap-2 text-orange-400">
            <Clock className="w-5 h-5" />
            Linha do Tempo Forense
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-400" />
              <Label htmlFor="forensic-imei" className="text-sm text-gray-300">IMEI do Equipamento:</Label>
            </div>
            <Input
              id="forensic-imei"
              value={selectedIMEI}
              onChange={(e) => setSelectedIMEI(e.target.value)}
              placeholder="Digite o IMEI"
              className="w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 h-full">
          <div className="flex h-full gap-4">
            {/* Timeline */}
            <div className="flex-1 bg-gray-800 rounded-lg p-4 overflow-y-auto">
              <div className="relative">
                {/* Linha vertical da timeline */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-orange-500/30"></div>

                <div className="space-y-6">
                  {events.map((event, index) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative flex items-start gap-4"
                    >
                      {/* Marcador do evento */}
                      <div className={`w-3 h-3 rounded-full border-2 border-gray-600 ${
                        event.type === 'alarm' ? 'bg-red-500' :
                        event.type === 'video' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}></div>

                      {/* Card do evento */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`flex-1 bg-gray-700 border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedEvent?.id === event.id ? 'border-orange-500' : 'border-gray-600'
                        }`}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {event.type === 'alarm' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                            {event.type === 'video' && <Play className="w-4 h-4 text-blue-400" />}
                            {event.type === 'gps' && <Map className="w-4 h-4 text-green-400" />}
                            <span className="text-sm font-medium text-white">
                              {event.type.toUpperCase()}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>

                        <div className="text-sm text-gray-300">
                          {event.type === 'gps' && (
                            <div>Velocidade: {event.data.speed} km/h</div>
                          )}
                          {event.type === 'alarm' && (
                            <div>Alarme: {event.data.alarm} (Código: {event.data.code})</div>
                          )}
                          {event.type === 'video' && (
                            <div>Duração: {event.data.duration}s</div>
                          )}
                        </div>

                        {/* Ações específicas do evento */}
                        {event.type === 'video' && (
                          <div className="flex gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                playVideoSegment(event);
                              }}
                              className="text-xs border-blue-500 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Reproduzir
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadVideoSegment(event);
                              }}
                              disabled={isDownloading}
                              className="text-xs border-orange-500 text-orange-400 hover:bg-orange-500/10"
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Baixar
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Painel de detalhes/Mapa */}
            <div className="w-80 bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium text-orange-400 mb-4">Detalhes do Evento</h3>

              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-1">Tipo</div>
                    <div className="text-white font-medium">{selectedEvent.type.toUpperCase()}</div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-1">Timestamp</div>
                    <div className="text-white font-medium">
                      {new Date(selectedEvent.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="text-sm text-gray-400 mb-1">Dados</div>
                    <pre className="text-xs text-cyan-300 bg-gray-900 p-2 rounded overflow-x-auto">
                      {JSON.stringify(selectedEvent.data, null, 2)}
                    </pre>
                  </div>

                  {selectedEvent.position && (
                    <div className="bg-gray-700 rounded-lg p-3">
                      <div className="text-sm text-gray-400 mb-1">Localização</div>
                      <div className="text-white font-medium">
                        {selectedEvent.position.lat.toFixed(6)}, {selectedEvent.position.lng.toFixed(6)}
                      </div>
                      <div className="mt-2 h-32 bg-gray-600 rounded flex items-center justify-center">
                        <Map className="w-8 h-8 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-400">Mapa (Mock)</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Map className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div>Selecione um evento para ver detalhes</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}