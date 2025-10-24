import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

interface VideoJsPlayerProps {
  options: any;
  start: boolean;
  timeout: number;
  duration: number;
}

const VideoJsPlayer: React.FC<VideoJsPlayerProps> = ({ options, start, timeout, duration }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);
  const [status, setStatus] = useState<string>('Aguardando início...');
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(false);

  useEffect(() => {
    console.log('🎬 VideoJsPlayer useEffect chamado com:', { start, options, timeout, duration, isActiveRefCurrent: isActiveRef.current });
    if (!start) {
      console.log('⏹️ Player não deve iniciar (start=false)');
      setStatus('Parado');
      setIsActive(false);
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current && !playerRef.current.isDisposed()) {
        console.log('🗑️ Destruindo player existente');
        playerRef.current.dispose();
        playerRef.current = null;
      }
      return;
    }

    console.log('▶️ Iniciando player...');
    setStatus('Iniciando...');
    setIsActive(true);
    isActiveRef.current = true;
    startTimeRef.current = Date.now();

    const attemptLoad = () => {
      console.log('🔄 Tentativa de carregamento do player - isActiveRef:', isActiveRef.current, 'videoRef.current:', !!videoRef.current, 'playerRef.current:', !!playerRef.current);
      if (!isActiveRef.current || !videoRef.current) {
        console.log('⚠️ Tentativa cancelada - isActiveRef:', isActiveRef.current, 'videoRef.current:', !!videoRef.current);
        return;
      }

      const elapsed = Date.now() - (startTimeRef.current || 0);
      if (elapsed > duration) {
        console.log('⏰ Tempo limite excedido após', elapsed, 'ms');
        setStatus('Tempo limite excedido - stream pode não estar disponível');
        setIsActive(false);
        isActiveRef.current = false;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      setStatus('Tentando conectar ao stream...');

      try {
        if (!playerRef.current && videoRef.current) {
          // Verificar se o elemento está realmente no DOM
          const isInDOM = document.contains(videoRef.current);
          console.log('🔍 Verificando se elemento está no DOM:', isInDOM, 'elemento:', videoRef.current);
          if (!isInDOM) {
            console.log('⚠️ Elemento não está no DOM ainda, pulando tentativa');
            return;
          }
          
          console.log('🆕 Criando novo player Video.js com elemento:', videoRef.current);
          const player = videojs(videoRef.current, options, () => {
            console.log('✅ Video.js player inicializado com sucesso - elemento no DOM:', document.contains(videoRef.current));
            setStatus('Player pronto, carregando stream...');
            
            // Configurar eventos após inicialização
            player.on('error', (error: any) => {
              console.error('❌ Erro no Video.js:', error);
              setStatus(`Erro: ${error.message || 'Erro desconhecido'}`);
            });

            player.on('loadeddata', () => {
              console.log('📊 Dados do stream carregados');
              setStatus('Stream carregado - vídeo pronto');
              // Tentar reproduzir automaticamente
              if (playerRef.current) {
                console.log('▶️ Tentando reproduzir automaticamente');
                playerRef.current.play().catch((playError: any) => {
                  console.log('⚠️ Falha na reprodução automática:', playError);
                  setStatus('Stream carregado - clique no play para iniciar');
                });
              }
            });

            player.on('canplay', () => {
              console.log('🎥 Vídeo pode ser reproduzido');
              setStatus('Vídeo pronto - iniciando reprodução');
            });

            player.on('playing', () => {
              console.log('▶️ Vídeo está reproduzindo - parando tentativas');
              setStatus('Reproduzindo vídeo');
              setIsActive(false);
              isActiveRef.current = false;
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
            });

            player.on('waiting', () => {
              console.log('⏳ Aguardando dados do stream');
              setStatus('Aguardando dados do stream...');
            });

            player.on('stalled', () => {
              console.log('🚫 Stream interrompido');
              setStatus('Stream interrompido - tentando reconectar...');
            });

            player.on('loadstart', () => {
              console.log('📡 Iniciando carregamento do stream');
            });

            player.on('progress', () => {
              console.log('📈 Progresso no carregamento');
            });
          });
          playerRef.current = player;
        } else {
          console.log('♻️ Reutilizando player existente - elemento no DOM:', document.contains(videoRef.current));
          const player = playerRef.current;
          if (player) {
            player.src(options.sources);
          }
        }
      } catch (error: any) {
        console.error('❌ Erro ao inicializar Video.js:', error);
        setStatus('Erro ao inicializar player');
      }
    };

    // Aguardar um tick para garantir que o DOM está montado
    const initializePlayer = () => {
      console.log('🔄 Inicializando player após DOM mount...');
      attemptLoad();
      intervalRef.current = setInterval(attemptLoad, timeout);
    };

    // Usar setTimeout para garantir que o componente está completamente montado
    const timeoutId = setTimeout(initializePlayer, 200);

    return () => {
      console.log('🧹 Limpando useEffect do VideoJsPlayer - isActiveRef:', isActiveRef.current);
      setIsActive(false);
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (playerRef.current && !playerRef.current.isDisposed()) {
        try {
          console.log('🗑️ Destruindo player');
          playerRef.current.dispose();
        } catch (error) {
          console.warn('⚠️ Erro ao destruir player:', error);
        }
        playerRef.current = null;
      }
    };
  }, [start, options, timeout, duration]);

  return (
    <div className="w-full h-full relative bg-black rounded">
      <p className="text-sm mb-2 absolute top-2 left-2 z-10 bg-black bg-opacity-75 text-white px-2 py-1 rounded">Status: {status}</p>
      <div data-vjs-player className="w-full h-full">
        <video 
          ref={videoRef} 
          className="video-js w-full h-full object-contain" 
          playsInline
          muted={false}
        />
      </div>
    </div>
  );
};

export default VideoJsPlayer;