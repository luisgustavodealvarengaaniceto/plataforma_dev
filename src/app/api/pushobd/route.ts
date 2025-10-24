import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para dados OBD
const OBDDataSchema = z.object({
  imei: z.string(),
  deviceImei: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  obd: z.object({
    speed: z.number().optional(),
    rpm: z.number().optional(),
    engineTemp: z.number().optional(),
    fuelLevel: z.number().optional(),
    engineLoad: z.number().optional(),
    throttlePosition: z.number().optional(),
    dtcCodes: z.array(z.string()).optional(),
    vin: z.string().optional(),
    mileage: z.number().optional(),
  }).optional(),
  // Permite campos adicionais
}).passthrough();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await request.json();
    
    console.log(`[${timestamp}] 🔧 OBD DATA RECEIVED`);
    console.log('═══════════════════════════════════════');
    
    // Validar payload
    const validatedData = OBDDataSchema.parse(body);
    
    const imei = validatedData.imei || validatedData.deviceImei;
    console.log(`📱 IMEI: ${imei}`);
    
    if (validatedData.obd) {
      console.log('🚗 Dados OBD:');
      console.log(`   Velocidade: ${validatedData.obd.speed ?? 'N/A'} km/h`);
      console.log(`   RPM: ${validatedData.obd.rpm ?? 'N/A'}`);
      console.log(`   Temperatura do Motor: ${validatedData.obd.engineTemp ?? 'N/A'}°C`);
      console.log(`   Nível de Combustível: ${validatedData.obd.fuelLevel ?? 'N/A'}%`);
      console.log(`   Carga do Motor: ${validatedData.obd.engineLoad ?? 'N/A'}%`);
      console.log(`   Posição do Acelerador: ${validatedData.obd.throttlePosition ?? 'N/A'}%`);
      console.log(`   Quilometragem: ${validatedData.obd.mileage ?? 'N/A'} km`);
      
      if (validatedData.obd.dtcCodes && validatedData.obd.dtcCodes.length > 0) {
        console.log(`   ⚠️  Códigos de Falha (DTC): ${validatedData.obd.dtcCodes.join(', ')}`);
      }
      
      if (validatedData.obd.vin) {
        console.log(`   VIN: ${validatedData.obd.vin}`);
      }
    }
    
    console.log('📦 Payload completo:', JSON.stringify(validatedData, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    // TODO: Salvar dados no banco de dados PostgreSQL
    // await saveOBDData(validatedData);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'OBD data received and processed',
      timestamp 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERROR processing OBD data:`, error);
    
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
