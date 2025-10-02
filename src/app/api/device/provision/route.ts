import { NextRequest, NextResponse } from 'next/server';

// Configuração do servidor
const SERVER_CONFIG = {
  domain: process.env.SERVER_DOMAIN || 'seu.servidor.com',
  gatewayPort: process.env.GATEWAY_PORT || '21100',
  rtmpPort: process.env.RTMP_PORT || '1936',
  uploadPort: process.env.UPLOAD_PORT || '23010',
  mediaPort: process.env.MEDIA_PORT || '8881',
};

// Comandos de provisionamento para JC400AD
const PROVISION_COMMANDS = {
  coreKitSwitch: {
    cmdContent: 'COREKITSW,0',
    description: 'Configura modo de integração direta',
    proNo: '128'
  },
  server: {
    cmdContent: `SERVER,1,${SERVER_CONFIG.domain},${SERVER_CONFIG.gatewayPort}`,
    description: 'Configura servidor de gateway JIMI',
    proNo: '128'
  },
  upload: {
    cmdContent: `UPLOAD,http://${SERVER_CONFIG.domain}:${SERVER_CONFIG.uploadPort}/upload`,
    description: 'Configura endpoint de upload de mídia',
    proNo: '128'
  },
  rtmp: {
    cmdContent: `RSERVICE,rtmp://${SERVER_CONFIG.domain}:${SERVER_CONFIG.rtmpPort}/live`,
    description: 'Configura servidor RTMP para streaming',
    proNo: '128'
  }
};

export async function POST(request: NextRequest) {
  try {
    const { imei, method, phoneNumber } = await request.json();

    console.log('🔧 [PROVISION] Iniciando provisionamento:', { imei, method });

    if (!imei) {
      return NextResponse.json({
        code: 1,
        message: 'IMEI is required'
      }, { status: 400 });
    }

    const commands = [];

    // Método SMS (se phoneNumber fornecido)
    if (method === 'sms' && phoneNumber) {
      console.log('📱 [PROVISION] Enviando comandos via SMS');

      // Para SMS, os comandos são enviados diretamente
      for (const [key, cmd] of Object.entries(PROVISION_COMMANDS)) {
        commands.push({
          type: 'sms',
          command: cmd.cmdContent,
          description: cmd.description,
          status: 'pending'
        });
      }

      // TODO: Implementar integração com serviço de SMS
      // Por enquanto, apenas retorna os comandos que deveriam ser enviados

      return NextResponse.json({
        code: 0,
        message: 'Provision commands prepared for SMS sending',
        data: {
          imei,
          method: 'sms',
          phoneNumber,
          commands,
          note: 'Commands should be sent via SMS to the device'
        }
      });
    }

    // Método API (dispositivo já online)
    if (method === 'api') {
      console.log('🌐 [PROVISION] Enviando comandos via API');

      const IOT_HUB_URL = process.env.IOT_HUB_URL || 'http://137.131.170.156:8080';
      const API_KEY = process.env.IOT_HUB_API_KEY || 'jimi_iot_2024';

      // Enviar comandos sequencialmente
      for (const [key, cmd] of Object.entries(PROVISION_COMMANDS)) {
        try {
          console.log(`📤 [PROVISION] Enviando comando: ${key}`);

          const response = await fetch(`${IOT_HUB_URL}/api/device/sendInstruct`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
              imei,
              cmdContent: cmd.cmdContent,
              proNo: cmd.proNo,
              channel: '1'
            }),
            signal: AbortSignal.timeout(30000),
          });

          const result = await response.json();

          commands.push({
            type: 'api',
            command: cmd.cmdContent,
            description: cmd.description,
            status: response.ok ? 'sent' : 'failed',
            response: result
          });

          // Pequena pausa entre comandos
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          console.error(`❌ [PROVISION] Erro no comando ${key}:`, error);
          commands.push({
            type: 'api',
            command: cmd.cmdContent,
            description: cmd.description,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = commands.filter(cmd => cmd.status === 'sent').length;
      const totalCount = commands.length;

      return NextResponse.json({
        code: 0,
        message: `Provision completed: ${successCount}/${totalCount} commands sent`,
        data: {
          imei,
          method: 'api',
          commands,
          summary: {
            total: totalCount,
            successful: successCount,
            failed: totalCount - successCount
          }
        }
      });
    }

    return NextResponse.json({
      code: 1,
      message: 'Invalid method. Use "sms" or "api"'
    }, { status: 400 });

  } catch (error) {
    console.error('❌ [PROVISION] Erro geral:', error);
    return NextResponse.json({
      code: 1,
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Jimi IoT Hub - Device Provisioning',
    endpoints: ['POST /api/device/provision'],
    serverConfig: SERVER_CONFIG,
    provisionCommands: PROVISION_COMMANDS,
    methods: {
      sms: 'Send commands via SMS (requires phoneNumber)',
      api: 'Send commands via IoT Hub API (device must be online)'
    },
    description: 'Provisiona dispositivo JC400AD com configurações do servidor'
  });
}