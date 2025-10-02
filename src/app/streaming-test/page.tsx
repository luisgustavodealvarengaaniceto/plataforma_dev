'use client';

import React, { useState } from 'react';
import NativePlayer from './players/NativePlayer';
// import FlvJsPlayer from './players/FlvJsPlayer';
import HlsJsPlayer from './players/HlsJsPlayer';
import VideoJsPlayer from './players/VideoJsPlayer';
import { toast } from 'sonner';

const StreamingTestPage = () => {
  // Substitua pelo seu IP e IMEI
  const SERVER_IP = "137.131.170.156"; // IP do servidor IoT Hub
  const IMEI = "860112070135860"; // IMEI do dispositivo
  const CHANNEL = "1";

  // URLs de streaming do IoT Hub
  const flvStreamUrl = `http://${SERVER_IP}:8881/${CHANNEL}/${IMEI}.flv`;
  const hlsStreamUrl = `http://${SERVER_IP}:8881/${CHANNEL}/${IMEI}/hls.m3u8`;

  // Estados para controle dos players
  const [nativeStarted, setNativeStarted] = useState(false);
  const [flvStarted, setFlvStarted] = useState(false);
  const [hlsStarted, setHlsStarted] = useState(false);
  const [videoJsStarted, setVideoJsStarted] = useState(false);

  // Configurações globais
  const [timeout, setTimeout] = useState(5000); // 5 segundos
  const [duration, setDuration] = useState(30000); // 30 segundos

  const playerStyle: React.CSSProperties = {
    width: '48%',
    marginBottom: '20px',
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '8px',
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  };

  const sendStreamCommand = async (format: 'flv' | 'hls') => {
    console.log(`📡 Enviando comando de streaming ${format.toUpperCase()} para IMEI: ${IMEI}, Channel: ${CHANNEL}`);
    try {
      const res = await fetch('http://localhost:3002/iniciar-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: IMEI,
          channel: CHANNEL,
          format: format
        }),
      });
      const result = await res.json();
      if (res.ok) {
        console.log(`✅ Comando de streaming ${format.toUpperCase()} enviado com sucesso:`, result);
        return true;
      } else {
        console.error('❌ Erro ao enviar comando de streaming:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao conectar com o servidor:', error);
      return false;
    }
  };

  const startPlayer = async (playerType: string) => {
    console.log(`🎬 Iniciando player: ${playerType}`);
    let format: 'flv' | 'hls' = 'flv';
    
    // Determinar o formato baseado no tipo de player
    switch (playerType) {
      case 'native':
      case 'flv':
        format = 'flv';
        break;
      case 'hls':
      case 'videojs':
        format = 'hls';
        break;
    }

    console.log(`🎯 Formato determinado: ${format.toUpperCase()}`);

    // Enviar comando de streaming primeiro
    const commandSent = await sendStreamCommand(format);
    if (!commandSent) {
      toast.error('Erro ao enviar comando de streaming. Verifique se o dispositivo está online.');
      return;
    }

    toast.success(`Comando de streaming ${format.toUpperCase()} enviado com sucesso!`);

    // Iniciar o player
    console.log(`▶️ Ativando player ${playerType}...`);
    switch (playerType) {
      case 'native':
        setNativeStarted(true);
        break;
      case 'flv':
        setFlvStarted(true);
        break;
      case 'hls':
        console.log('▶️ Ativando player HLS...');
        setHlsStarted(true);
        break;
      case 'videojs':
        console.log('▶️ Ativando player VideoJS...');
        setVideoJsStarted(true);
        break;
    }
  };

  const stopPlayer = (playerType: string) => {
    console.log(`⏹️ Parando player: ${playerType}`);
    switch (playerType) {
      case 'native':
        setNativeStarted(false);
        break;
      case 'flv':
        setFlvStarted(false);
        break;
      case 'hls':
        setHlsStarted(false);
        break;
      case 'videojs':
        setVideoJsStarted(false);
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Painel de Teste de Streaming
          </h1>
          <p className="text-muted-foreground text-lg">
            Configure os parâmetros e inicie o streaming no dispositivo para testar cada player individualmente.<br/>
            <strong>Nota:</strong> Cada botão "Iniciar" envia automaticamente o comando de streaming apropriado para o dispositivo.
          </p>
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>URLs de Teste:</strong><br/>
              FLV: {flvStreamUrl}<br/>
              HLS: {hlsStreamUrl}
            </p>
          </div>

          {/* Controles globais */}
          <div className="mt-6 p-4 bg-card rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Configurações Globais</h3>
            <div className="flex flex-wrap gap-4 justify-center">
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Timeout (ms):</label>
                <input
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md w-24"
                  min="1000"
                  max="30000"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-sm font-medium mb-1">Duração (ms):</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="px-3 py-2 border rounded-md w-24"
                  min="5000"
                  max="300000"
                />
              </div>
            </div>
          </div>
        </div>

        <div style={containerStyle}>
          <div style={playerStyle}>
            <h2 className="text-xl font-semibold mb-2">Player 1: Tag &lt;video&gt; Nativa (Teste com HLS)</h2>
            <p className="text-red-600 text-sm mb-4">
              <strong>Tecnologia:</strong> Nenhuma. Tenta tocar o stream FLV diretamente.<br/>
              <strong>Resultado Esperado:</strong> Falha na maioria dos navegadores (Chrome, Firefox).<br/>
              <strong>Nota:</strong> Envia comando de streaming FLV para o dispositivo.
            </p>
            {!nativeStarted ? (
              <button
                onClick={() => startPlayer('native')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Iniciar Player Nativo
              </button>
            ) : (
              <div>
                <button
                  onClick={() => stopPlayer('native')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-2"
                >
                  Parar Player Nativo
                </button>
                <NativePlayer url={hlsStreamUrl} start={nativeStarted} timeout={timeout} duration={duration} />
              </div>
            )}
          </div>

          <div style={playerStyle}>
            <h2 className="text-xl font-semibold mb-2">Player 2: flv.js (Solução para FLV)</h2>
            <p className="text-green-600 text-sm mb-4">
              <strong>Tecnologia:</strong> Transmuxing via JavaScript. A biblioteca flv.js busca o stream FLV e o converte em tempo real para um formato que o navegador entende (MSE).<br/>
              <strong>Resultado Esperado:</strong> Sucesso.<br/>
              <strong>Nota:</strong> Envia comando de streaming FLV para o dispositivo.
            </p>
            {!flvStarted ? (
              <button
                onClick={() => startPlayer('flv')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Iniciar flv.js
              </button>
            ) : (
              <div>
                <button
                  onClick={() => stopPlayer('flv')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-2"
                >
                  Parar flv.js
                </button>
                {/* <FlvJsPlayer url={flvStreamUrl} start={flvStarted} timeout={timeout} duration={duration} /> */}
                <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
                  <p className="text-sm">Player FLV.js temporariamente desabilitado.</p>
                  <p className="text-xs mt-1">URL: {flvStreamUrl}</p>
                </div>
              </div>
            )}
          </div>

          <div style={playerStyle}>
            <h2 className="text-xl font-semibold mb-2">Player 3: hls.js (Solução para HLS)</h2>
            <p className="text-green-600 text-sm mb-4">
              <strong>Tecnologia:</strong> Player HLS via JavaScript. A biblioteca hls.js gerencia o download dos segmentos de vídeo do HLS e os exibe no navegador.<br/>
              <strong>Resultado Esperado:</strong> Sucesso (e recomendado).<br/>
              <strong>Nota:</strong> Envia comando de streaming HLS para o dispositivo.
            </p>
            {!hlsStarted ? (
              <button
                onClick={() => startPlayer('hls')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Iniciar hls.js
              </button>
            ) : (
              <div>
                <button
                  onClick={() => stopPlayer('hls')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-2"
                >
                  Parar hls.js
                </button>
                <HlsJsPlayer url={hlsStreamUrl} start={hlsStarted} timeout={timeout} duration={duration} />
              </div>
            )}
          </div>

          <div style={playerStyle}>
            <h2 className="text-xl font-semibold mb-2">Player 4: Video.js com HLS</h2>
            <p className="text-green-600 text-sm mb-4">
              <strong>Tecnologia:</strong> Framework de Player. Video.js provê a interface do player e utiliza hls.js (ou o suporte nativo do navegador) por baixo dos panos.<br/>
              <strong>Resultado Esperado:</strong> Sucesso.<br/>
              <strong>Nota:</strong> Envia comando de streaming HLS para o dispositivo.
            </p>
            {!videoJsStarted ? (
              <button
                onClick={() => startPlayer('videojs')}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Iniciar Video.js
              </button>
            ) : (
              <div>
                <button
                  onClick={() => stopPlayer('videojs')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 mb-2"
                >
                  Parar Video.js
                </button>
                <VideoJsPlayer 
                  options={{
                    autoplay: true,
                    controls: true,
                    responsive: true,
                    fluid: true,
                    sources: [{ src: hlsStreamUrl, type: 'application/x-mpegURL' }]
                  }}
                  start={videoJsStarted}
                  timeout={timeout}
                  duration={duration}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingTestPage;