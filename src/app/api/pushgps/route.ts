import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Schema para logs de GPS
const gpsLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  imei: { type: String, required: true, index: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  altitude: { type: Number },
  speed: { type: Number },
  course: { type: Number },
  satellites: { type: Number },
  hdop: { type: Number },
  gpsValid: { type: Boolean, default: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' } // [longitude, latitude]
  },
  payload: { type: Object },
  processed: { type: Boolean, default: false },
});

const GPSLog = mongoose.models.iothub_gps_logs || mongoose.model('iothub_gps_logs', gpsLogSchema);

// Schema para dispositivos (reutilizar)
const deviceSchema = new mongoose.Schema({
  imei: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  firstSeen: { type: Date, default: Date.now },
  totalSessions: { type: Number, default: 0 },
  currentSessionStart: { type: Date },
  metadata: { type: Object },
  lastLocation: { type: Object },
});

const Device = mongoose.models.iothub_devices || mongoose.model('iothub_devices', deviceSchema);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('📍 [PUSH GPS] Dados GPS recebidos:', payload);

    // Conectar ao MongoDB
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [PUSH GPS] MongoDB não conectado');
      return NextResponse.json({ code: 1, message: 'Database connection failed' }, { status: 500 });
    }

    const {
      imei,
      latitude,
      longitude,
      altitude,
      speed,
      course,
      satellites,
      hdop,
      gpsValid,
      ...otherData
    } = payload;

    if (!imei || latitude === undefined || longitude === undefined) {
      console.error('❌ [PUSH GPS] Dados obrigatórios faltando (IMEI, latitude, longitude)');
      return NextResponse.json({ code: 1, message: 'IMEI, latitude and longitude are required' }, { status: 400 });
    }

    // Validar coordenadas
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('❌ [PUSH GPS] Coordenadas inválidas');
      return NextResponse.json({ code: 1, message: 'Invalid coordinates' }, { status: 400 });
    }

    // Salvar log do GPS
    const gpsLog = new GPSLog({
      imei,
      latitude: lat,
      longitude: lng,
      altitude: altitude ? parseFloat(altitude) : null,
      speed: speed ? parseFloat(speed) : null,
      course: course ? parseFloat(course) : null,
      satellites: satellites ? parseInt(satellites) : null,
      hdop: hdop ? parseFloat(hdop) : null,
      gpsValid: gpsValid !== false && gpsValid !== '0',
      location: {
        type: 'Point',
        coordinates: [lng, lat] // MongoDB usa [longitude, latitude]
      },
      payload: otherData,
    });
    await gpsLog.save();

    // Atualizar localização do dispositivo
    const now = new Date();
    await Device.findOneAndUpdate(
      { imei },
      {
        lastSeen: now,
        status: 'online',
        lastLocation: {
          latitude: lat,
          longitude: lng,
          timestamp: now,
          speed: speed ? parseFloat(speed) : null,
          course: course ? parseFloat(course) : null,
        },
        metadata: {
          ...otherData,
          lastLocationAt: now,
        }
      },
      { upsert: true }
    );

    console.log(`✅ [PUSH GPS] Localização salva para IMEI: ${imei} | Lat: ${lat} | Lng: ${lng} | Speed: ${speed || 'N/A'}`);

    // Responder com sucesso para confirmar recebimento
    return NextResponse.json({ code: 0 });

  } catch (error) {
    console.error('❌ [PUSH GPS] Erro:', error);
    return NextResponse.json({ code: 1, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get('imei');
  const limit = parseInt(searchParams.get('limit') || '10');

  try {
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ data: [] });
    }

    const filter: any = {};
    if (imei) filter.imei = imei;

    const gpsData = await GPSLog.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: gpsData,
      message: 'Últimas localizações GPS'
    });

  } catch (error) {
    console.error('❌ [PUSH GPS] Erro na consulta:', error);
    return NextResponse.json({ data: [], error: 'Database query failed' }, { status: 500 });
  }
}