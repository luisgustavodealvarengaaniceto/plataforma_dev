import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Schema para logs de comandos enviados
const commandLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  imei: { type: String, required: true, index: true },
  command: { type: String, required: true },
  proNo: { type: String, required: true },
  status: { type: String, enum: ['sent', 'delivered', 'failed'], default: 'sent' },
  response: { type: Object },
  sentBy: { type: String },
  metadata: { type: Object },
});

const CommandLog = mongoose.models.iothub_command_logs || mongoose.model('iothub_command_logs', commandLogSchema);

// Configuração do IoT Hub
const IOT_HUB_CONFIG = {
  baseUrl: process.env.IOT_HUB_URL || 'http://137.131.170.156:8080',
  apiKey: process.env.IOT_HUB_API_KEY || 'jimi_iot_2024',
  timeout: 30000,
};

export async function POST(request: NextRequest) {
  try {
    const { imei, cmdContent, proNo, channel, sentBy } = await request.json();

    console.log('📤 [SEND COMMAND] Enviando comando:', { imei, cmdContent, proNo, channel });

    if (!imei || !cmdContent) {
      return NextResponse.json({
        code: 1,
        message: 'IMEI and cmdContent are required'
      }, { status: 400 });
    }

    // Conectar ao MongoDB para logging
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    // Preparar payload para o IoT Hub
    const iotHubPayload = {
      imei,
      cmdContent,
      proNo: proNo || '128', // Protocolo padrão para JC400
      channel: channel || '1',
      timestamp: new Date().toISOString(),
    };

    console.log('🌐 [SEND COMMAND] Enviando para IoT Hub:', `${IOT_HUB_CONFIG.baseUrl}/api/device/sendInstruct`);

    // Enviar comando para o IoT Hub
    const response = await fetch(`${IOT_HUB_CONFIG.baseUrl}/api/device/sendInstruct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${IOT_HUB_CONFIG.apiKey}`,
      },
      body: JSON.stringify(iotHubPayload),
      signal: AbortSignal.timeout(IOT_HUB_CONFIG.timeout),
    });

    const responseData = await response.json();
    console.log('📥 [SEND COMMAND] Resposta do IoT Hub:', responseData);

    // Salvar log do comando
    const commandLog = new CommandLog({
      imei,
      command: cmdContent,
      proNo: proNo || '128',
      status: response.ok ? 'sent' : 'failed',
      response: responseData,
      sentBy: sentBy || 'system',
      metadata: {
        channel: channel || '1',
        iotHubResponse: responseData,
        httpStatus: response.status,
      },
    });
    await commandLog.save();

    if (!response.ok) {
      console.error('❌ [SEND COMMAND] Falha no IoT Hub:', response.status, responseData);
      return NextResponse.json({
        code: 1,
        message: 'Failed to send command to IoT Hub',
        details: responseData
      }, { status: response.status });
    }

    console.log(`✅ [SEND COMMAND] Comando enviado com sucesso para IMEI: ${imei}`);

    return NextResponse.json({
      code: 0,
      message: 'Command sent successfully',
      data: {
        commandId: commandLog._id,
        iotHubResponse: responseData,
      }
    });

  } catch (error) {
    console.error('❌ [SEND COMMAND] Erro:', error);

    // Tentar salvar log de erro mesmo se falhar
    try {
      await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');
      const errorLog = new CommandLog({
        imei: 'unknown',
        command: 'error',
        proNo: '128',
        status: 'failed',
        response: { error: error instanceof Error ? error.message : 'Unknown error' },
        metadata: { error: true },
      });
      await errorLog.save();
    } catch (logError) {
      console.error('❌ [SEND COMMAND] Falha ao salvar log de erro:', logError);
    }

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
  const limit = parseInt(searchParams.get('limit') || '20');

  try {
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ data: [] });
    }

    const filter: any = {};
    if (imei) filter.imei = imei;

    const commands = await CommandLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: commands,
      message: 'Histórico de comandos enviados'
    });

  } catch (error) {
    console.error('❌ [SEND COMMAND] Erro na consulta:', error);
    return NextResponse.json({ data: [], error: 'Database query failed' }, { status: 500 });
  }
}