import React, { useEffect, useRef, useState } from 'react';

interface NativePlayerProps {
  url: string;
  start: boolean;
  timeout: number;
  duration: number;
}

const NativePlayer: React.FC<NativePlayerProps> = ({ url, start, timeout, duration }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Aguardando início...');
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!start) {
      setStatus('Parado');
      setIsActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setStatus('Iniciando...');
    setIsActive(true);
    startTimeRef.current = Date.now();

    const attemptLoad = () => {
      if (!isActive || !videoRef.current) return;

      const elapsed = Date.now() - (startTimeRef.current || 0);
      if (elapsed > duration) {
        setStatus('Tempo limite excedido');
        setIsActive(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      setStatus('Tentando carregar...');
      setReloadKey(prev => prev + 1); // Force reload by changing key

      if (videoRef.current) {
        videoRef.current.load();
        try {
          videoRef.current.play();
        } catch (error: any) {
          console.log("Autoplay bloqueado no player nativo:", error);
          setStatus('Autoplay bloqueado, clique para tocar');
        }
      }
    };

    attemptLoad();
    intervalRef.current = setInterval(attemptLoad, timeout);

    return () => {
      setIsActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [start, url, timeout, duration]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedData = () => setStatus('Stream carregado');
      const handlePlaying = () => {
        setStatus('Streaming ativo');
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
      const handleError = () => setStatus('Erro ao carregar stream');

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('error', handleError);
      };
    }
  }, [reloadKey]);

  return (
    <div>
      <p className="text-sm mb-2">Status: {status}</p>
      <video key={reloadKey} ref={videoRef} src={url} style={{ width: '100%' }} controls muted />
    </div>
  );
};

export default NativePlayer;