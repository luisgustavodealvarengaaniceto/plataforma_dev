import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Schema para logs de alarmes
const alarmLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  imei: { type: String, required: true, index: true },
  alarmType: { type: String, required: true, index: true },
  alarmCode: { type: String, index: true },
  msgClass: { type: Number, default: 0 }, // Para JC400 sempre será 0
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  description: { type: String },
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  payload: { type: Object },
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date },
  acknowledgedBy: { type: String },
  processed: { type: Boolean, default: false },
});

const AlarmLog = mongoose.models.iothub_alarm_logs || mongoose.model('iothub_alarm_logs', alarmLogSchema);

// Mapeamento de códigos de alarme para descrições
const ALARM_TYPES = {
  '0x9999': { type: 'SOS', severity: 'critical', description: 'Botão SOS pressionado' },
  '0x0410': { type: 'hibernation', severity: 'low', description: 'Dispositivo entrou em hibernação' },
  '0x0411': { type: 'wake_up', severity: 'low', description: 'Dispositivo acordou da hibernação' },
  '0x0420': { type: 'power_off', severity: 'high', description: 'Dispositivo foi desligado' },
  '0x0421': { type: 'power_on', severity: 'low', description: 'Dispositivo foi ligado' },
  '0x0430': { type: 'low_battery', severity: 'high', description: 'Bateria baixa' },
  '0x0440': { type: 'overspeed', severity: 'medium', description: 'Excesso de velocidade' },
  '0x0450': { type: 'geofence_enter', severity: 'low', description: 'Entrada em zona geográfica' },
  '0x0451': { type: 'geofence_exit', severity: 'medium', description: 'Saída de zona geográfica' },
  '0x0460': { type: 'vibration', severity: 'medium', description: 'Detecção de vibração' },
  '0x0470': { type: 'collision', severity: 'high', description: 'Detecção de colisão' },
  '0x0480': { type: 'fatigue_driving', severity: 'medium', description: 'Detecção de fadiga' },
  '0x0490': { type: 'sharp_turn', severity: 'medium', description: 'Curva brusca detectada' },
  '0x0500': { type: 'tamper', severity: 'critical', description: 'Violação/tamper detectado' },
};

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('🚨 [PUSH ALARM] Alarme recebido:', payload);

    // Conectar ao MongoDB
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [PUSH ALARM] MongoDB não conectado');
      return NextResponse.json({ code: 1, message: 'Database connection failed' }, { status: 500 });
    }

    const {
      imei,
      alarmCode,
      msgClass,
      latitude,
      longitude,
      ...otherData
    } = payload;

    if (!imei || !alarmCode) {
      console.error('❌ [PUSH ALARM] IMEI ou alarmCode não fornecidos');
      return NextResponse.json({ code: 1, message: 'IMEI and alarmCode are required' }, { status: 400 });
    }

    // Obter informações do tipo de alarme
    const alarmInfo = ALARM_TYPES[alarmCode as keyof typeof ALARM_TYPES] || {
      type: 'unknown',
      severity: 'medium',
      description: `Alarme desconhecido: ${alarmCode}`
    };

    // Preparar dados de localização se disponíveis
    let locationData = null;
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        locationData = {
          latitude: lat,
          longitude: lng,
          coordinates: [lng, lat] // [longitude, latitude] para MongoDB
        };
      }
    }

    // Salvar log do alarme
    const alarmLog = new AlarmLog({
      imei,
      alarmType: alarmInfo.type,
      alarmCode,
      msgClass: msgClass || 0, // JC400 sempre usa msgClass 0
      severity: alarmInfo.severity,
      description: alarmInfo.description,
      location: locationData,
      payload: otherData,
    });
    await alarmLog.save();

    console.log(`✅ [PUSH ALARM] Alarme salvo: ${alarmInfo.type} (${alarmCode}) para IMEI: ${imei}`);

    // TODO: Implementar notificações em tempo real (WebSocket/SSE)
    // TODO: Implementar regras de automação baseadas em alarmes

    // Responder com sucesso para confirmar recebimento
    return NextResponse.json({ code: 0 });

  } catch (error) {
    console.error('❌ [PUSH ALARM] Erro:', error);
    return NextResponse.json({ code: 1, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get('imei');
  const alarmType = searchParams.get('type');
  const acknowledged = searchParams.get('acknowledged');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ data: [] });
    }

    const filter: any = {};
    if (imei) filter.imei = imei;
    if (alarmType && alarmType !== 'all') filter.alarmType = alarmType;
    if (acknowledged !== null) filter.acknowledged = acknowledged === 'true';

    const alarms = await AlarmLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: alarms,
      message: 'Lista de alarmes'
    });

  } catch (error) {
    console.error('❌ [PUSH ALARM] Erro na consulta:', error);
    return NextResponse.json({ data: [], error: 'Database query failed' }, { status: 500 });
  }
}

// Endpoint para reconhecer alarme
export async function PATCH(request: NextRequest) {
  try {
    const { alarmId, acknowledgedBy } = await request.json();

    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    const alarm = await AlarmLog.findByIdAndUpdate(
      alarmId,
      {
        acknowledged: true,
        acknowledgedAt: new Date(),
        acknowledgedBy: acknowledgedBy || 'system'
      },
      { new: true }
    );

    if (!alarm) {
      return NextResponse.json({ code: 1, message: 'Alarm not found' }, { status: 404 });
    }

    return NextResponse.json({ code: 0, alarm });

  } catch (error) {
    console.error('❌ [PUSH ALARM] Erro ao reconhecer alarme:', error);
    return NextResponse.json({ code: 1, message: 'Internal server error' }, { status: 500 });
  }
}