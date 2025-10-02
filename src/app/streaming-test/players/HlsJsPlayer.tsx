import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface HlsJsPlayerProps {
  url: string;
  start: boolean;
  timeout: number;
  duration: number;
}

const HlsJsPlayer: React.FC<HlsJsPlayerProps> = ({ url, start, timeout, duration }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<string>('Aguardando início...');
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!start) {
      setStatus('Parado');
      setIsActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
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

      setStatus('Tentando conectar...');

      const videoElement = videoRef.current;
      if (videoElement) {
        try {
          if (Hls.isSupported()) {
            if (hlsRef.current) {
              hlsRef.current.destroy();
            }
            hlsRef.current = new Hls();
            hlsRef.current.loadSource(url);
            hlsRef.current.attachMedia(videoElement);

            hlsRef.current.on(Hls.Events.MANIFEST_PARSED, () => {
              setStatus('Manifest parsed, tentando tocar...');
              try {
                videoElement.play();
              } catch (error: any) {
                console.log("Autoplay foi bloqueado:", error);
                setStatus('Autoplay bloqueado, clique para tocar');
              }
            });

            hlsRef.current.on(Hls.Events.ERROR, (event, data) => {
              console.error('Erro no hls.js:', data);
              setStatus(`Erro HLS: ${data.type}`);
            });

            hlsRef.current.on(Hls.Events.FRAG_LOADED, () => {
              setStatus('Streaming ativo');
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            });

          } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = url;
            setStatus('Usando suporte nativo HLS');
            try {
              videoElement.play();
            } catch (error: any) {
              console.log("Autoplay foi bloqueado:", error);
              setStatus('Autoplay bloqueado, clique para tocar');
            }
          }
        } catch (error) {
          console.error('Erro ao inicializar HLS:', error);
          setStatus('Erro ao inicializar');
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
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [start, url, timeout, duration]);

  return (
    <div>
      <p className="text-sm mb-2">Status: {status}</p>
      <video ref={videoRef} style={{ width: '100%' }} controls muted />
    </div>
  );
};

export default HlsJsPlayer;