import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imei, type, camera = 'in', duration } = await request.json();

    console.log('📸 [MEDIA CAPTURE] Captura solicitada:', { imei, type, camera, duration });

    if (!imei || !type) {
      return NextResponse.json({
        code: 1,
        message: 'IMEI and type are required'
      }, { status: 400 });
    }

    const IOT_HUB_URL = process.env.IOT_HUB_URL || 'http://137.131.170.156:8080';
    const API_KEY = process.env.IOT_HUB_API_KEY || 'jimi_iot_2024';

    let cmdContent = '';
    let description = '';

    switch (type) {
      case 'photo':
        if (camera === 'inout') {
          cmdContent = 'PICTURE,inout';
          description = 'Capturar foto de ambas as câmeras';
        } else {
          cmdContent = `PICTURE,${camera}`;
          description = `Capturar foto da câmera ${camera === 'in' ? 'interna' : 'externa'}`;
        }
        break;

      case 'video':
        if (!duration) {
          return NextResponse.json({
            code: 1,
            message: 'Duration is required for video capture (e.g., "5s", "10s")'
          }, { status: 400 });
        }
        cmdContent = `VIDEO,${camera},${duration}`;
        description = `Gravar vídeo de ${duration} da câmera ${camera === 'in' ? 'interna' : 'externa'}`;
        break;

      default:
        return NextResponse.json({
          code: 1,
          message: 'Invalid type. Use "photo" or "video"'
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
      console.error('❌ [MEDIA CAPTURE] Falha no IoT Hub:', response.status, responseData);
      return NextResponse.json({
        code: 1,
        message: 'Failed to send capture command',
        details: responseData
      }, { status: response.status });
    }

    console.log(`✅ [MEDIA CAPTURE] Comando ${type} enviado para IMEI: ${imei}`);

    return NextResponse.json({
      code: 0,
      message: `${description} - Comando enviado com sucesso`,
      data: {
        imei,
        type,
        camera,
        duration: type === 'video' ? duration : null,
        command: cmdContent,
        iotHubResponse: responseData,
        note: 'O arquivo será enviado para o servidor de upload e ficará disponível em /iothub/dvr-upload/uploadFile/'
      }
    });

  } catch (error) {
    console.error('❌ [MEDIA CAPTURE] Erro:', error);
    return NextResponse.json({
      code: 1,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Jimi IoT Hub - Media Capture',
    endpoints: ['POST /api/media/capture'],
    supportedTypes: {
      photo: {
        cameras: ['in', 'out', 'inout'],
        examples: ['PICTURE,in', 'PICTURE,out', 'PICTURE,inout']
      },
      video: {
        cameras: ['in', 'out'],
        duration: 'Tempo em segundos (ex: 5s, 10s)',
        examples: ['VIDEO,out,5s', 'VIDEO,in,10s']
      }
    },
    description: 'Captura fotos e vídeos do dispositivo JC400AD'
  });
}