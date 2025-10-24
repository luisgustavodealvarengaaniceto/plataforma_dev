import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para dados de combustível
const OilDataSchema = z.object({
  imei: z.string(),
  deviceImei: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  fuelLevel: z.number().optional(), // nível em %
  fuelVolume: z.number().optional(), // volume em litros
  fuelTemperature: z.number().optional(), // temperatura em °C
  fuelConsumption: z.number().optional(), // consumo em L/100km
  fuelType: z.string().optional(), // diesel, gasoline, etc
  tankCapacity: z.number().optional(), // capacidade do tanque em litros
}).passthrough();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await request.json();
    
    console.log(`[${timestamp}] ⛽ FUEL DATA RECEIVED`);
    console.log('═══════════════════════════════════════');
    
    // Validar payload
    const validatedData = OilDataSchema.parse(body);
    
    const imei = validatedData.imei || validatedData.deviceImei;
    console.log(`📱 IMEI: ${imei}`);
    
    if (validatedData.fuelLevel !== undefined) {
      console.log(`📊 Nível de Combustível: ${validatedData.fuelLevel}%`);
    }
    
    if (validatedData.fuelVolume !== undefined) {
      console.log(`💧 Volume: ${validatedData.fuelVolume} L`);
    }
    
    if (validatedData.fuelTemperature !== undefined) {
      console.log(`🌡️  Temperatura: ${validatedData.fuelTemperature}°C`);
    }
    
    if (validatedData.fuelConsumption !== undefined) {
      console.log(`📈 Consumo: ${validatedData.fuelConsumption} L/100km`);
    }
    
    if (validatedData.fuelType) {
      console.log(`⚡ Tipo: ${validatedData.fuelType}`);
    }
    
    if (validatedData.tankCapacity) {
      console.log(`🛢️  Capacidade do Tanque: ${validatedData.tankCapacity} L`);
    }
    
    console.log('📦 Payload completo:', JSON.stringify(validatedData, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    // TODO: Salvar dados no banco de dados PostgreSQL
    // await saveFuelData(validatedData);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Fuel data received and processed',
      timestamp 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERROR processing fuel data:`, error);
    
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
