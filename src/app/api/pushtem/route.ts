import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para dados de temperatura
const TemperatureDataSchema = z.object({
  imei: z.string(),
  deviceImei: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  sensors: z.array(z.object({
    sensorId: z.string(),
    temperature: z.number(),
    unit: z.enum(['C', 'F']).optional(),
    threshold: z.object({
      min: z.number().optional(),
      max: z.number().optional(),
    }).optional(),
    alert: z.boolean().optional(),
  })).optional(),
  // Campos alternativos para um único sensor
  temperature: z.number().optional(),
  sensorId: z.string().optional(),
  unit: z.enum(['C', 'F']).optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await request.json();
    
    console.log(`[${timestamp}] 🌡️ TEMPERATURE DATA RECEIVED`);
    console.log('═══════════════════════════════════════');
    
    // Validar payload
    const validatedData = TemperatureDataSchema.parse(body);
    
    const imei = validatedData.imei || validatedData.deviceImei;
    console.log(`📱 IMEI: ${imei}`);
    
    // Processar múltiplos sensores
    if (validatedData.sensors && validatedData.sensors.length > 0) {
      console.log(`📊 Total de Sensores: ${validatedData.sensors.length}`);
      validatedData.sensors.forEach((sensor, index) => {
        const unit = sensor.unit || 'C';
        console.log(`   ${index + 1}. Sensor ${sensor.sensorId}: ${sensor.temperature}°${unit}`);
        
        if (sensor.threshold) {
          if (sensor.threshold.min !== undefined) {
            console.log(`      Min: ${sensor.threshold.min}°${unit}`);
          }
          if (sensor.threshold.max !== undefined) {
            console.log(`      Max: ${sensor.threshold.max}°${unit}`);
          }
        }
        
        if (sensor.alert) {
          console.log(`      ⚠️  ALERTA: Temperatura fora do limite!`);
        }
      });
    }
    // Processar sensor único
    else if (validatedData.temperature !== undefined) {
      const unit = validatedData.unit || 'C';
      console.log(`🌡️  Temperatura: ${validatedData.temperature}°${unit}`);
      if (validatedData.sensorId) {
        console.log(`📟 Sensor ID: ${validatedData.sensorId}`);
      }
    }
    
    console.log('📦 Payload completo:', JSON.stringify(validatedData, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    // TODO: Salvar dados no banco de dados PostgreSQL
    // TODO: Verificar limiares e gerar alertas se necessário
    // await saveTemperatureData(validatedData);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Temperature data received and processed',
      timestamp 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERROR processing temperature data:`, error);
    
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
