import { NextRequest, NextResponse } from 'next/server';

// Configuração do servidor de mídia
const MEDIA_CONFIG = {
  baseUrl: process.env.MEDIA_SERVER_URL || 'http://137.131.170.156:8881',
  rtmpUrl: process.env.RTMP_SERVER_URL || 'rtmp://137.131.170.156:1936',
};

export async function POST(request: NextRequest) {
  try {
    const { imei, action, channel = '1' } = await request.json();

    console.log('🎬 [MEDIA STREAM] Ação solicitada:', { imei, action, channel });

    if (!imei || !action) {
      return NextResponse.json({
        code: 1,
        message: 'IMEI and action are required'
      }, { status: 400 });
    }

    const IOT_HUB_URL = process.env.IOT_HUB_URL || 'http://137.131.170.156:8080';
    const API_KEY = process.env.IOT_HUB_API_KEY || 'jimi_iot_2024';

    let cmdContent = '';
    let description = '';

    switch (action) {
      case 'start_stream':
        cmdContent = 'RTMP,ON,INOUT';
        description = 'Iniciar streaming de vídeo ao vivo';
        break;

      case 'stop_stream':
        cmdContent = 'RTMP,OFF';
        description = 'Parar streaming de vídeo ao vivo';
        break;

      default:
        return NextResponse.json({
          code: 1,
          message: 'Invalid action. Use "start_stream" or "stop_stream"'
        }, { status: 400 });
    }

    // Enviar comando para o IoT Hub
    const response = await fetch(`${IOT_HUB_URL}/api/device/sendInstruct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        imei,
        cmdContent,
        proNo: '128',
        channel
      }),
      signal: AbortSignal.timeout(30000),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [MEDIA STREAM] Falha no IoT Hub:', response.status, responseData);
      return NextResponse.json({
        code: 1,
        message: 'Failed to send stream command',
        details: responseData
      }, { status: response.status });
    }

    // URLs de streaming
    const streamUrls = {
      flv: `${MEDIA_CONFIG.baseUrl}/live/${channel}/${imei}.flv`,
      hls: `${MEDIA_CONFIG.baseUrl}/live/${channel}/${imei}/index.m3u8`,
      rtmp: `${MEDIA_CONFIG.rtmpUrl}/live/${imei}_${channel}`
    };

    console.log(`✅ [MEDIA STREAM] Comando ${action} enviado para IMEI: ${imei}`);

    return NextResponse.json({
      code: 0,
      message: `${description} - Comando enviado com sucesso`,
      data: {
        imei,
        action,
        channel,
        streamUrls,
        command: cmdContent,
        iotHubResponse: responseData
      }
    });

  } catch (error) {
    console.error('❌ [MEDIA STREAM] Erro:', error);
    return NextResponse.json({
      code: 1,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get('imei');
  const channel = searchParams.get('channel') || '1';

  if (!imei) {
    return NextResponse.json({
      code: 1,
      message: 'IMEI parameter is required'
    }, { status: 400 });
  }

  const streamUrls = {
    flv: `${MEDIA_CONFIG.baseUrl}/live/${channel}/${imei}.flv`,
    hls: `${MEDIA_CONFIG.baseUrl}/live/${channel}/${imei}/index.m3u8`,
    rtmp: `${MEDIA_CONFIG.rtmpUrl}/live/${imei}_${channel}`
  };

  return NextResponse.json({
    code: 0,
    message: 'Stream URLs for device',
    data: {
      imei,
      channel,
      streamUrls,
      note: 'Use these URLs in your video player to consume the live stream'
    }
  });
}