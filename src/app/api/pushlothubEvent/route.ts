import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para eventos do IotHub
const IotHubEventSchema = z.object({
  imei: z.string(),
  deviceImei: z.string().optional(),
  eventType: z.string(), // 'fileListReady', 'uploadStart', 'uploadComplete', 'uploadFailed'
  timestamp: z.union([z.string(), z.number()]).optional(),
  alarmId: z.string().optional(),
  fileList: z.array(z.object({
    filename: z.string(),
    size: z.number().optional(),
    type: z.string().optional(), // 'image', 'video'
    url: z.string().optional(),
  })).optional(),
  uploadStatus: z.object({
    filename: z.string(),
    progress: z.number().optional(),
    status: z.enum(['started', 'in_progress', 'completed', 'failed']),
    error: z.string().optional(),
  }).optional(),
}).passthrough();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await request.json();
    
    console.log(`[${timestamp}] 📡 IOTHUB EVENT RECEIVED`);
    console.log('═══════════════════════════════════════');
    
    // Validar payload
    const validatedData = IotHubEventSchema.parse(body);
    
    const imei = validatedData.imei || validatedData.deviceImei;
    console.log(`📱 IMEI: ${imei}`);
    console.log(`📋 Tipo de Evento: ${validatedData.eventType}`);
    
    if (validatedData.alarmId) {
      console.log(`🚨 Alarm ID: ${validatedData.alarmId}`);
    }
    
    // Processar diferentes tipos de eventos
    switch (validatedData.eventType) {
      case 'fileListReady':
        console.log('📂 Lista de arquivos de alarme está pronta');
        if (validatedData.fileList) {
          console.log(`📊 Total de arquivos: ${validatedData.fileList.length}`);
          validatedData.fileList.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.filename} (${file.type || 'unknown'}) - ${file.size ? `${(file.size / 1024).toFixed(2)} KB` : 'N/A'}`);
            if (file.url) {
              console.log(`      URL: ${file.url}`);
            }
          });
        }
        break;
        
      case 'uploadStart':
        console.log('📤 Início de upload de multimídia');
        if (validatedData.uploadStatus) {
          console.log(`   Arquivo: ${validatedData.uploadStatus.filename}`);
        }
        break;
        
      case 'uploadComplete':
        console.log('✅ Upload de multimídia concluído');
        if (validatedData.uploadStatus) {
          console.log(`   Arquivo: ${validatedData.uploadStatus.filename}`);
        }
        break;
        
      case 'uploadFailed':
        console.log('❌ Falha no upload de multimídia');
        if (validatedData.uploadStatus) {
          console.log(`   Arquivo: ${validatedData.uploadStatus.filename}`);
          if (validatedData.uploadStatus.error) {
            console.log(`   Erro: ${validatedData.uploadStatus.error}`);
          }
        }
        break;
        
      default:
        console.log(`   Evento: ${validatedData.eventType}`);
    }
    
    console.log('📦 Payload completo:', JSON.stringify(validatedData, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    // TODO: Processar eventos de mídia
    // - Atualizar status de downloads
    // - Notificar frontend via WebSocket
    // - Associar arquivos com alarmes
    // await processIotHubEvent(validatedData);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'IotHub event received and processed',
      timestamp 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERROR processing IotHub event:`, error);
    
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
