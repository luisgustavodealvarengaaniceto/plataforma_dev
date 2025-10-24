'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Play, Image as ImageIcon, Calendar, MapPin, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MediaFile {
  id: string;
  alertId: string;
  filename: string;
  type: 'image' | 'video';
  url: string;
  localPath?: string;
  size?: number;
  timestamp: Date;
  imei: string;
  alertType: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

interface AlarmMediaGalleryProps {
  alertId?: string;
  imei?: string;
}

export default function AlarmMediaGallery({ alertId, imei }: AlarmMediaGalleryProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMediaFiles();
  }, [alertId, imei]);
  
  const fetchMediaFiles = async () => {
    setLoading(true);
    try {
      let url = 'http://localhost:3002/api/media/list';
      const params = new URLSearchParams();
      
      if (alertId) params.append('alertId', alertId);
      if (imei) params.append('imei', imei);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setMediaFiles(data);
    } catch (error) {
      console.error('Error fetching media files:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredMedia = filter === 'all' 
    ? mediaFiles 
    : mediaFiles.filter(m => m.type === filter);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Galeria de Mídia de Alarmes
            </span>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                Todos ({mediaFiles.length})
              </Button>
              <Button
                variant={filter === 'image' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('image')}
              >
                Fotos ({mediaFiles.filter(m => m.type === 'image').length})
              </Button>
              <Button
                variant={filter === 'video' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('video')}
              >
                Vídeos ({mediaFiles.filter(m => m.type === 'video').length})
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMedia.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              Nenhuma mídia encontrada
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredMedia.map((media) => (
                <motion.div
                  key={media.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedMedia(media)}
                >
                  <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {media.type === 'image' ? (
                      <img
                        src={media.url}
                        alt={media.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                    
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <div className="text-white text-xs">
                        {media.timestamp.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de Visualização */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">{selectedMedia.filename}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMedia(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-4">
                {selectedMedia.type === 'image' ? (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.filename}
                    className="w-full h-auto rounded-lg"
                  />
                ) : (
                  <video
                    src={selectedMedia.url}
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                )}
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedMedia.timestamp.toLocaleString('pt-BR')}
                  </div>
                  
                  {selectedMedia.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedMedia.location.address || `${selectedMedia.location.lat}, ${selectedMedia.location.lng}`}
                    </div>
                  )}
                  
                  {selectedMedia.size && (
                    <div>Tamanho: {(selectedMedia.size / 1024).toFixed(2)} KB</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
