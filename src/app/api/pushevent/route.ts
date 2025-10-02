import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Schema para logs de eventos (login/logout)
const eventLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  imei: { type: String, required: true, index: true },
  eventType: { type: String, enum: ['login', 'logout'], required: true },
  payload: { type: Object },
  processed: { type: Boolean, default: false },
});

const EventLog = mongoose.models.iothub_event_logs || mongoose.model('iothub_event_logs', eventLogSchema);

// Schema para dispositivos conectados
const deviceSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  firstSeen: { type: Date, default: Date.now },
  totalSessions: { type: Number, default: 0 },
  currentSessionStart: { type: Date },
  metadata: { type: Object },
});

const Device = mongoose.models.iothub_devices || mongoose.model('iothub_devices', deviceSchema);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('📡 [PUSH EVENT] Recebido:', payload);

    // Conectar ao MongoDB
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [PUSH EVENT] MongoDB não conectado');
      return NextResponse.json({ code: 1, message: 'Database connection failed' }, { status: 500 });
    }

    const { imei, eventType, ...eventData } = payload;

    if (!imei) {
      console.error('❌ [PUSH EVENT] IMEI não fornecido');
      return NextResponse.json({ code: 1, message: 'IMEI is required' }, { status: 400 });
    }

    // Salvar log do evento
    const eventLog = new EventLog({
      imei,
      eventType: eventType || 'unknown',
      payload: eventData,
    });
    await eventLog.save();

    // Atualizar status do dispositivo
    const now = new Date();
    let device = await Device.findOne({ imei });

    if (!device) {
      // Primeiro contato com o dispositivo
      device = new Device({
        imei,
        status: eventType === 'login' ? 'online' : 'offline',
        lastSeen: now,
        firstSeen: now,
        totalSessions: eventType === 'login' ? 1 : 0,
        currentSessionStart: eventType === 'login' ? now : null,
        metadata: eventData,
      });
    } else {
      // Atualizar dispositivo existente
      if (eventType === 'login') {
        device.status = 'online';
        device.totalSessions += 1;
        device.currentSessionStart = now;
      } else if (eventType === 'logout') {
        device.status = 'offline';
        device.currentSessionStart = null;
      }
      device.lastSeen = now;
      device.metadata = { ...device.metadata, ...eventData };
    }

    await device.save();

    console.log(`✅ [PUSH EVENT] ${eventType.toUpperCase()} processado para IMEI: ${imei}`);

    // Responder com sucesso para confirmar recebimento
    return NextResponse.json({ code: 0 });

  } catch (error) {
    console.error('❌ [PUSH EVENT] Erro:', error);
    return NextResponse.json({ code: 1, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Jimi IoT Hub - Push Event Webhook',
    endpoints: ['POST /api/pushevent'],
    description: 'Recebe notificações de login/logout dos dispositivos JC400AD'
  });
}