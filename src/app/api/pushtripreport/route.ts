import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para relatórios de viagem
const TripReportSchema = z.object({
  imei: z.string(),
  deviceImei: z.string().optional(),
  tripId: z.string().optional(),
  startTime: z.union([z.string(), z.number()]),
  endTime: z.union([z.string(), z.number()]),
  duration: z.number().optional(), // em segundos
  distance: z.number().optional(), // em metros ou km
  maxSpeed: z.number().optional(),
  avgSpeed: z.number().optional(),
  startLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  endLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
  driverName: z.string().optional(),
  driverId: z.string().optional(),
  fuelConsumption: z.number().optional(),
  idleTime: z.number().optional(),
  harshBraking: z.number().optional(),
  harshAcceleration: z.number().optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await request.json();
    
    console.log(`[${timestamp}] 🚗 TRIP REPORT RECEIVED`);
    console.log('═══════════════════════════════════════');
    
    // Validar payload
    const validatedData = TripReportSchema.parse(body);
    
    const imei = validatedData.imei || validatedData.deviceImei;
    console.log(`📱 IMEI: ${imei}`);
    console.log(`🆔 Trip ID: ${validatedData.tripId || 'N/A'}`);
    console.log(`⏱️  Início: ${new Date(validatedData.startTime).toLocaleString('pt-BR')}`);
    console.log(`⏱️  Fim: ${new Date(validatedData.endTime).toLocaleString('pt-BR')}`);
    
    if (validatedData.duration) {
      const hours = Math.floor(validatedData.duration / 3600);
      const minutes = Math.floor((validatedData.duration % 3600) / 60);
      console.log(`⏳ Duração: ${hours}h ${minutes}min`);
    }
    
    if (validatedData.distance) {
      console.log(`📏 Distância: ${(validatedData.distance / 1000).toFixed(2)} km`);
    }
    
    if (validatedData.maxSpeed) {
      console.log(`🏎️  Velocidade Máxima: ${validatedData.maxSpeed} km/h`);
    }
    
    if (validatedData.avgSpeed) {
      console.log(`📊 Velocidade Média: ${validatedData.avgSpeed} km/h`);
    }
    
    if (validatedData.driverName) {
      console.log(`👤 Motorista: ${validatedData.driverName}`);
    }
    
    if (validatedData.fuelConsumption) {
      console.log(`⛽ Consumo de Combustível: ${validatedData.fuelConsumption} L`);
    }
    
    if (validatedData.idleTime) {
      console.log(`⏸️  Tempo Ocioso: ${Math.round(validatedData.idleTime / 60)} min`);
    }
    
    if (validatedData.harshBraking) {
      console.log(`⚠️  Frenagens Bruscas: ${validatedData.harshBraking}`);
    }
    
    if (validatedData.harshAcceleration) {
      console.log(`⚠️  Acelerações Bruscas: ${validatedData.harshAcceleration}`);
    }
    
    console.log('📦 Payload completo:', JSON.stringify(validatedData, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    // TODO: Salvar dados no banco de dados PostgreSQL
    // await saveTripReport(validatedData);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Trip report received and processed',
      timestamp 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERROR processing trip report:`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        status: 'error',
        message: 'Invalid payload format',
        errors: error.issues 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      status: 'error',
      message: 'Internal server error' 
    }, { status: 500 });
  }
}
