'use client';'use client';import React, { useEffect, useRef, useState } from 'react';import React, { useEffect, useRef, useState } from 'react';import React, { useEffect, useRef, useState } from 'react';



import React, { useRef, useState } from 'react';



interface FlvJsPlayerProps {import React, { useRef, useState } from 'react';

  url: string;

  start: boolean;

  timeout: number;

  duration: number;interface FlvJsPlayerProps {interface FlvJsPlayerProps {

}

  url: string;

const FlvJsPlayer: React.FC<FlvJsPlayerProps> = ({ url, start }) => {

  const videoRef = useRef<HTMLVideoElement>(null);  start: boolean;  url: string;

  const [status] = useState<string>('Player FLV simplificado');

  timeout: number;

  return (

    <div className="mb-4 p-4 border rounded-lg">  duration: number;  start: boolean;interface FlvJsPlayerProps {interface FlvJsPlayerProps {

      <h3 className="text-lg font-semibold mb-2">FLV.js Player</h3>

      <p className="text-sm mb-2 text-gray-600">}

        Status: {status}

      </p>  timeout: number;

      <p className="text-xs text-gray-500 mb-2">

        URL: {url}const FlvJsPlayer: React.FC<FlvJsPlayerProps> = ({ url, start }) => {

      </p>

      <video  const videoRef = useRef<HTMLVideoElement>(null);  duration: number;  url: string;  url: string;

        ref={videoRef}

        controls  const [status, setStatus] = useState<string>('Player FLV simplificado');

        muted

        style={{ width: '100%', height: 'auto', maxHeight: '300px' }}}

        className="bg-black"

      >  return (

        <source src={url} type="video/mp4" />

        Seu navegador não suporta o elemento de vídeo.    <div className="mb-4 p-4 border rounded-lg">  start: boolean;  start: boolean;

      </video>

      <div className="mt-2 text-xs text-gray-500">      <h3 className="text-lg font-semibold mb-2">FLV.js Player</h3>

        <p>Nota: Para streaming FLV real, use um player específico como VLC ou configure flv.js.</p>

        <p>URLs sugeridas baseadas no protocolo JIMI:</p>      <p className={`text-sm mb-2 text-gray-600`}>const FlvJsPlayer: React.FC<FlvJsPlayerProps> = ({ url, start, timeout, duration }) => {

        <p>• HTTP-FLV: http://IP:8881/live/1/IMEI.flv</p>

        <p>• HLS: http://IP:8881/live/1/IMEI/hls.m3u8</p>        Status: {status}

      </div>

    </div>      </p>  const videoRef = useRef<HTMLVideoElement>(null);  timeout: number;  timeout: number;

  );

};      <p className="text-xs text-gray-500 mb-2">



export default FlvJsPlayer;        URL: {url}  const [status, setStatus] = useState<string>('Aguardando início...');

      </p>

      <video  const [isActive, setIsActive] = useState(false);  duration: number;  duration: number;

        ref={videoRef}

        controls  const [flvjs, setFlvjs] = useState<any>(null);

        muted

        style={{ width: '100%', height: 'auto', maxHeight: '300px' }}  const intervalRef = useRef<NodeJS.Timeout | null>(null);}}

        className="bg-black"

      >  const startTimeRef = useRef<number | null>(null);

        <source src={url} type="video/mp4" />

        Seu navegador não suporta o elemento de vídeo.

      </video>

      <div className="mt-2 text-xs text-gray-500">  // Carregar flv.js dinamicamente apenas no cliente

        <p>Nota: Para streaming FLV real, use um player específico como VLC ou configure flv.js.</p>

        <p>URLs sugeridas baseadas no protocolo JIMI:</p>  useEffect(() => {const FlvJsPlayer: React.FC<FlvJsPlayerProps> = ({ url, start, timeout, duration }) => {const FlvJsPlayer: React.FC<FlvJsPlayerProps> = ({ url, start, timeout, duration }) => {

        <p>• HTTP-FLV: http://IP:8881/live/1/IMEI.flv</p>

        <p>• HLS: http://IP:8881/live/1/IMEI/hls.m3u8</p>    if (typeof window !== 'undefined') {

      </div>

    </div>      import('flv.js').then((module) => {  const videoRef = useRef<HTMLVideoElement>(null);  const videoRef = useRef<HTMLVideoElement>(null);

  );

};        setFlvjs(module.default);



export default FlvJsPlayer;      }).catch((error) => {  const [status, setStatus] = useState<string>('Aguardando início...');  const [status, setStatus] = useState<string>('Aguardando início...');

        console.error('Erro ao carregar flv.js:', error);

        setStatus('Erro ao carregar player FLV');  const [isActive, setIsActive] = useState(false);  const [isActive, setIsActive] = useState(false);

      });

    }  const [flvjs, setFlvjs] = useState<any>(null);  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {

    if (!start || !flvjs) {  const startTimeRef = useRef<number | null>(null);

      setStatus(start ? 'Aguardando player...' : 'Parado');

      setIsActive(false);  useEffect(() => {

      if (intervalRef.current) {

        clearInterval(intervalRef.current);  // Carregar flv.js dinamicamente apenas no cliente    if (!start) {

        intervalRef.current = null;

      }  useEffect(() => {      setStatus('Parado');

      return;

    }    import('flv.js').then((module) => {      setIsActive(false);



    setStatus('Iniciando...');      setFlvjs(module.default);      if (intervalRef.current) {

    setIsActive(true);

    startTimeRef.current = Date.now();    }).catch((error) => {        clearInterval(intervalRef.current);



    const connectWithRetry = () => {      console.error('Erro ao carregar flv.js:', error);        intervalRef.current = null;

      if (!flvjs || !flvjs.isSupported()) {

        setStatus('FLV não suportado neste navegador');      setStatus('Erro ao carregar player FLV');      }

        return;

      }    });      return;



      setStatus('Tentando conectar...');  }, []);    }



      let flvPlayer: any = null;

      try {

        if (videoRef.current) {  useEffect(() => {    setStatus('Iniciando...');

          flvPlayer = flvjs.createPlayer({

            type: 'flv',    if (!start || !flvjs) {    setIsActive(true);

            isLive: true,

            url: url,      setStatus('Parado');    startTimeRef.current = Date.now();

          });

                setIsActive(false);

          flvPlayer.attachMediaElement(videoRef.current);

          flvPlayer.load();      if (intervalRef.current) {    const attemptLoad = () => {

          

          try {        clearInterval(intervalRef.current);      if (!isActive || !videoRef.current) return;

            flvPlayer.play();

          } catch (error: any) {        intervalRef.current = null;

            console.log("Autoplay foi bloqueado pelo navegador:", error);

            setStatus('Autoplay bloqueado, clique para tocar');      }      const elapsed = Date.now() - (startTimeRef.current || 0);

          }

      return;      if (elapsed > duration) {

          // Verificar se o stream está funcionando após um tempo

          setTimeout(() => {    }        setStatus('Tempo limite excedido');

            if (videoRef.current && videoRef.current.readyState >= 2) {

              setStatus('Streaming ativo');        setIsActive(false);

            } else {

              setStatus('Aguardando dados...');    setStatus('Iniciando...');        if (intervalRef.current) {

            }

          }, 2000);    setIsActive(true);          clearInterval(intervalRef.current);

        }

      } catch (error) {    startTimeRef.current = Date.now();          intervalRef.current = null;

        console.error('Erro ao criar player flv.js:', error);

        setStatus(`Erro: ${error}`);        }

      }

    const connectWithRetry = () => {        return;

      // Timeout para reconectar

      if (timeout > 0) {      if (!flvjs.isSupported()) {      }

        intervalRef.current = setTimeout(() => {

          if (flvPlayer) {        setStatus('FLV não suportado neste navegador');

            try {

              flvPlayer.destroy();        return;      setStatus('Tentando conectar...');

            } catch (e) {

              console.warn('Erro ao destruir player:', e);      }

            }

            flvPlayer = null;      let flvPlayer: any = null;

          }

                if (intervalRef.current) {      try {

          const elapsedTime = Date.now() - (startTimeRef.current || 0);

          if (elapsedTime < duration) {        clearInterval(intervalRef.current);        // Importação dinâmica do flv.js para evitar problemas de SSR

            connectWithRetry();

          } else {        intervalRef.current = null;        const flvjs = await import('flv.js');

            setStatus('Tempo limite atingido');

            setIsActive(false);      }        

          }

        }, timeout);        if (flvjs.default.isSupported() && videoRef.current) {

      }

    };      setStatus('Tentando conectar...');          flvPlayer = flvjs.default.createPlayer({



    connectWithRetry();            type: 'flv',



    return () => {      let flvPlayer: any = null;            isLive: true,

      if (intervalRef.current) {

        clearInterval(intervalRef.current);      try {            url: url,

        intervalRef.current = null;

      }        if (videoRef.current) {          });

    };

  }, [start, timeout, duration, url, flvjs]);          flvPlayer = flvjs.createPlayer({          flvPlayer.attachMediaElement(videoRef.current);



  return (            type: 'flv',          flvPlayer.load();

    <div className="mb-4 p-4 border rounded-lg">

      <h3 className="text-lg font-semibold mb-2">FLV.js Player</h3>            isLive: true,          try {

      <p className={`text-sm mb-2 ${isActive ? 'text-green-600' : 'text-gray-600'}`}>

        Status: {status}            url: url,            flvPlayer.play();

      </p>

      <video          });          } catch (error: any) {

        ref={videoRef}

        controls          flvPlayer.attachMediaElement(videoRef.current);            console.log("Autoplay foi bloqueado pelo navegador:", error);

        muted

        style={{ width: '100%', height: 'auto', maxHeight: '300px' }}          flvPlayer.load();            setStatus('Autoplay bloqueado, clique para tocar');

        className="bg-black"

        onClick={() => {                    }

          if (videoRef.current && videoRef.current.paused) {

            videoRef.current.play().catch(console.error);          try {

          }

        }}            flvPlayer.play();          flvPlayer.on(flvjs.Events.ERROR, (error: any) => {

      >

        Seu navegador não suporta o elemento de vídeo.          } catch (error: any) {            console.error('Erro no flv.js:', error);

      </video>

    </div>            console.log("Autoplay foi bloqueado pelo navegador:", error);            setStatus(`Erro: ${error.type}`);

  );

};            setStatus('Autoplay bloqueado, clique para tocar');            if (flvPlayer) {



export default FlvJsPlayer;          }              flvPlayer.destroy();

              flvPlayer = null;

          // Eventos simplificados para evitar problemas            }

          flvPlayer.on('error', (error: any) => {          });

            console.error('Erro no flv.js:', error);

            setStatus(`Erro: ${error.type || 'Desconhecido'}`);          flvPlayer.on(flvjs.Events.LOADING_COMPLETE, () => {

            if (flvPlayer) {            setStatus('Carregamento completo');

              flvPlayer.destroy();          });

              flvPlayer = null;

            }          flvPlayer.on(flvjs.Events.STATISTICS_INFO, () => {

          });            setStatus('Streaming ativo');

            if (intervalRef.current) {

          // Verificar se o stream está funcionando após um tempo              clearInterval(intervalRef.current);

          setTimeout(() => {              intervalRef.current = null;

            if (videoRef.current && videoRef.current.readyState >= 2) {            }

              setStatus('Streaming ativo');          });

            } else {        }

              setStatus('Aguardando dados...');      } catch (error) {

            }        console.error('Erro ao criar player flv.js:', error);

          }, 2000);        setStatus('Erro ao inicializar');

        }      }

      } catch (error) {    };

        console.error('Erro ao criar player flv.js:', error);

        setStatus(`Erro: ${error}`);    attemptLoad();

      }    intervalRef.current = setInterval(attemptLoad, timeout);



      // Timeout para reconectar    return () => {

      if (timeout > 0) {      setIsActive(false);

        intervalRef.current = setTimeout(() => {      if (intervalRef.current) {

          if (flvPlayer) {        clearInterval(intervalRef.current);

            flvPlayer.destroy();        intervalRef.current = null;

            flvPlayer = null;      }

          }    };

            }, [start, url, timeout, duration]);

          const elapsedTime = Date.now() - (startTimeRef.current || 0);

          if (elapsedTime < duration) {  return (

            connectWithRetry();    <div>

          } else {      <p className="text-sm mb-2">Status: {status}</p>

            setStatus('Tempo limite atingido');      <video ref={videoRef} style={{ width: '100%' }} controls muted />

            setIsActive(false);    </div>

          }  );

        }, timeout);};

      }

    };export default FlvJsPlayer;

    connectWithRetry();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [start, timeout, duration, url, flvjs]);

  return (
    <div className="mb-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">FLV.js Player</h3>
      <p className={`text-sm mb-2 ${isActive ? 'text-green-600' : 'text-gray-600'}`}>
        Status: {status}
      </p>
      <video
        ref={videoRef}
        controls
        muted
        style={{ width: '100%', height: 'auto', maxHeight: '300px' }}
        className="bg-black"
        onClick={() => {
          if (videoRef.current && videoRef.current.paused) {
            videoRef.current.play().catch(console.error);
          }
        }}
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>
    </div>
  );
};

export default FlvJsPlayer;