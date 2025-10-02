import { NextRequest, NextResponse } from 'next/server';

// Configuração do servidor
const SERVER_CONFIG = {
  domain: process.env.SERVER_DOMAIN || '137.131.170.156',
  mediaPort: process.env.MEDIA_PORT || '8881',
};

export async function POST(request: NextRequest) {
  try {
    const { imei, action, fileName } = await request.json();

    console.log('📼 [VIDEO PLAYBACK] Ação solicitada:', { imei, action, fileName });

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
      case 'request_list':
        // Primeiro passo: configurar URL de retorno para a lista
        const listWebhookUrl = `http://${SERVER_CONFIG.domain}/api/media/playback/list`;
        cmdContent = `FILELIST,A,${listWebhookUrl}`;
        description = 'Solicitar lista de arquivos de vídeo disponíveis';
        break;

      case 'get_list':
        // Segundo passo: solicitar a lista
        cmdContent = 'FILELIST';
        description = 'Obter lista de arquivos de vídeo do dispositivo';
        break;

      case 'play_file':
        // Terceiro passo: solicitar playback de arquivo específico
        if (!fileName) {
          return NextResponse.json({
            code: 1,
            message: 'fileName is required for play_file action'
          }, { status: 400 });
        }
        cmdContent = `REPLAYLIST,${fileName}`;
        description = `Iniciar playback do arquivo: ${fileName}`;
        break;

      default:
        return NextResponse.json({
          code: 1,
          message: 'Invalid action. Use "request_list", "get_list", or "play_file"'
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
        channel: '1'
      }),
      signal: AbortSignal.timeout(30000),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('❌ [VIDEO PLAYBACK] Falha no IoT Hub:', response.status, responseData);
      return NextResponse.json({
        code: 1,
        message: 'Failed to send playback command',
        details: responseData
      }, { status: response.status });
    }

    let playbackUrl = null;
    if (action === 'play_file') {
      playbackUrl = `http://${SERVER_CONFIG.domain}:${SERVER_CONFIG.mediaPort}/live/${imei}.flv`;
    }

    console.log(`✅ [VIDEO PLAYBACK] Comando ${action} enviado para IMEI: ${imei}`);

    return NextResponse.json({
      code: 0,
      message: `${description} - Comando enviado com sucesso`,
      data: {
        imei,
        action,
        fileName: action === 'play_file' ? fileName : null,
        command: cmdContent,
        playbackUrl,
        iotHubResponse: responseData,
        nextSteps: action === 'request_list'
          ? ['Aguarde a resposta no webhook /api/media/playback/list', 'Depois chame get_list para obter a lista']
          : action === 'get_list'
          ? ['A lista será enviada para o webhook configurado']
          : ['Use a playbackUrl para assistir o vídeo histórico']
      }
    });

  } catch (error) {
    console.error('❌ [VIDEO PLAYBACK] Erro:', error);
    return NextResponse.json({
      code: 1,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Webhook para receber a lista de arquivos
export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('📋 [PLAYBACK LIST] Lista de arquivos recebida:', payload);

    // Aqui você pode salvar a lista em cache ou banco de dados
    // Por enquanto, apenas log e resposta de confirmação

    return NextResponse.json({ code: 0 });

  } catch (error) {
    console.error('❌ [PLAYBACK LIST] Erro:', error);
    return NextResponse.json({ code: 1, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Jimi IoT Hub - Video Playback',
    endpoints: [
      'POST /api/media/playback',
      'PUT /api/media/playback/list (webhook)'
    ],
    workflow: {
      step1: {
        action: 'request_list',
        description: 'Configura URL de retorno para receber a lista'
      },
      step2: {
        action: 'get_list',
        description: 'Solicita a lista de arquivos disponíveis'
      },
      step3: {
        action: 'play_file',
        description: 'Inicia playback de arquivo específico',
        params: { fileName: 'nome_do_arquivo.mp4' }
      }
    },
    description: 'Sistema complexo de playback de vídeo histórico do JC400AD'
  });
}