import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para dados de extensão do terminal
const TerminalTransInfoSchema = z.object({
  imei: z.string(),
  deviceImei: z.string().optional(),
  timestamp: z.union([z.string(), z.number()]).optional(),
  // Dados específicos do JC450 e outros dispositivos
  externalVoltage: z.number().optional(), // voltagem externa em V
  internalVoltage: z.number().optional(), // voltagem interna/bateria em V
  gsmSignal: z.number().optional(), // força do sinal GSM
  gpsSignal: z.number().optional(), // força do sinal GPS
  satelliteCount: z.number().optional(), // número de satélites
  temperature: z.number().optional(), // temperatura do dispositivo em °C
  humidity: z.number().optional(), // umidade em %
  batteryLevel: z.number().optional(), // nível de bateria em %
  firmwareVersion: z.string().optional(),
  hardwareVersion: z.string().optional(),
  // Dados de entrada/saída
  digitalInputs: z.array(z.object({
    port: z.number(),
    state: z.boolean(),
  })).optional(),
  digitalOutputs: z.array(z.object({
    port: z.number(),
    state: z.boolean(),
  })).optional(),
  analogInputs: z.array(z.object({
    port: z.number(),
    value: z.number(),
    unit: z.string().optional(),
  })).optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await request.json();
    
    console.log(`[${timestamp}] 📡 TERMINAL TRANS INFO RECEIVED`);
    console.log('═══════════════════════════════════════');
    
    // Validar payload
    const validatedData = TerminalTransInfoSchema.parse(body);
    
    const imei = validatedData.imei || validatedData.deviceImei;
    console.log(`📱 IMEI: ${imei}`);
    
    // Informações de voltagem
    if (validatedData.externalVoltage !== undefined) {
      console.log(`🔌 Voltagem Externa: ${validatedData.externalVoltage}V`);
    }
    
    if (validatedData.internalVoltage !== undefined) {
      console.log(`🔋 Voltagem Interna: ${validatedData.internalVoltage}V`);
    }
    
    if (validatedData.batteryLevel !== undefined) {
      console.log(`🔋 Nível de Bateria: ${validatedData.batteryLevel}%`);
    }
    
    // Informações de sinal
    if (validatedData.gsmSignal !== undefined) {
      console.log(`📶 Sinal GSM: ${validatedData.gsmSignal}`);
    }
    
    if (validatedData.gpsSignal !== undefined) {
      console.log(`🛰️  Sinal GPS: ${validatedData.gpsSignal}`);
    }
    
    if (validatedData.satelliteCount !== undefined) {
      console.log(`🛰️  Satélites: ${validatedData.satelliteCount}`);
    }
    
    // Informações ambientais
    if (validatedData.temperature !== undefined) {
      console.log(`🌡️  Temperatura do Dispositivo: ${validatedData.temperature}°C`);
    }
    
    if (validatedData.humidity !== undefined) {
      console.log(`💧 Umidade: ${validatedData.humidity}%`);
    }
    
    // Versões de firmware/hardware
    if (validatedData.firmwareVersion) {
      console.log(`💾 Firmware: ${validatedData.firmwareVersion}`);
    }
    
    if (validatedData.hardwareVersion) {
      console.log(`🔧 Hardware: ${validatedData.hardwareVersion}`);
    }
    
    // Entradas/Saídas Digitais
    if (validatedData.digitalInputs && validatedData.digitalInputs.length > 0) {
      console.log(`🔵 Entradas Digitais:`);
      validatedData.digitalInputs.forEach(input => {
        console.log(`   Porta ${input.port}: ${input.state ? 'HIGH' : 'LOW'}`);
      });
    }
    
    if (validatedData.digitalOutputs && validatedData.digitalOutputs.length > 0) {
      console.log(`🟢 Saídas Digitais:`);
      validatedData.digitalOutputs.forEach(output => {
        console.log(`   Porta ${output.port}: ${output.state ? 'HIGH' : 'LOW'}`);
      });
    }
    
    // Entradas Analógicas
    if (validatedData.analogInputs && validatedData.analogInputs.length > 0) {
      console.log(`📊 Entradas Analógicas:`);
      validatedData.analogInputs.forEach(input => {
        const unit = input.unit || '';
        console.log(`   Porta ${input.port}: ${input.value}${unit}`);
      });
    }
    
    console.log('📦 Payload completo:', JSON.stringify(validatedData, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    // TODO: Salvar dados no banco de dados PostgreSQL
    // TODO: Verificar se há alertas de voltagem baixa ou outros problemas
    // await saveTerminalTransInfo(validatedData);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Terminal trans info received and processed',
      timestamp 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERROR processing terminal trans info:`, error);
    
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
