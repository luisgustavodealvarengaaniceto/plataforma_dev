import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Schema para logs de heartbeat
const heartbeatLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  imei: { type: String, required: true, index: true },
  accStatus: { type: Boolean },
  gpsValid: { type: Boolean },
  voltage: { type: Number },
  gsmSignal: { type: Number },
  temperature: { type: Number },
  payload: { type: Object },
  processed: { type: Boolean, default: false },
});

const HeartbeatLog = mongoose.models.iothub_heartbeat_logs || mongoose.model('iothub_heartbeat_logs', heartbeatLogSchema);

// Schema para dispositivos (reutilizar do pushevent)
const deviceSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  firstSeen: { type: Date, default: Date.now },
  totalSessions: { type: Number, default: 0 },
  currentSessionStart: { type: Date },
  metadata: { type: Object },
  lastHeartbeat: { type: Object },
});

const Device = mongoose.models.iothub_devices || mongoose.model('iothub_devices', deviceSchema);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('💓 [PUSH HB] Heartbeat recebido:', payload);

    // Conectar ao MongoDB
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [PUSH HB] MongoDB não conectado');
      return NextResponse.json({ code: 1, message: 'Database connection failed' }, { status: 500 });
    }

    const { imei, accStatus, gpsValid, voltage, gsmSignal, temperature, ...otherData } = payload;

    if (!imei) {
      console.error('❌ [PUSH HB] IMEI não fornecido');
      return NextResponse.json({ code: 1, message: 'IMEI is required' }, { status: 400 });
    }

    // Salvar log do heartbeat
    const heartbeatLog = new HeartbeatLog({
      imei,
      accStatus: accStatus === '1' || accStatus === true,
      gpsValid: gpsValid === '1' || gpsValid === true,
      voltage: voltage ? parseFloat(voltage) : null,
      gsmSignal: gsmSignal ? parseInt(gsmSignal) : null,
      temperature: temperature ? parseFloat(temperature) : null,
      payload: otherData,
    });
    await heartbeatLog.save();

    // Atualizar dispositivo com dados do heartbeat
    const now = new Date();
    const device = await Device.findOneAndUpdate(
      { imei },
      {
        lastSeen: now,
        status: 'online', // Heartbeat indica que está online
        lastHeartbeat: {
          timestamp: now,
          accStatus: accStatus === '1' || accStatus === true,
          gpsValid: gpsValid === '1' || gpsValid === true,
          voltage: voltage ? parseFloat(voltage) : null,
          gsmSignal: gsmSignal ? parseInt(gsmSignal) : null,
          temperature: temperature ? parseFloat(temperature) : null,
        },
        metadata: {
          ...otherData,
          lastHeartbeatAt: now,
        }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ [PUSH HB] Heartbeat processado para IMEI: ${imei} | ACC: ${accStatus} | GPS: ${gpsValid}`);

    // Responder com sucesso para confirmar recebimento
    return NextResponse.json({ code: 0 });

  } catch (error) {
    console.error('❌ [PUSH HB] Erro:', error);
    return NextResponse.json({ code: 1, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Jimi IoT Hub - Push Heartbeat Webhook',
    endpoints: ['POST /api/pushhb'],
    description: 'Recebe dados de heartbeat dos dispositivos JC400AD (status ACC, GPS, tensão, etc.)'
  });
}