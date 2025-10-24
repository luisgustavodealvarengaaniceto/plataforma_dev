import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Schema de validação para resposta de comandos
const InstructResponseSchema = z.object({
  imei: z.string(),
  deviceImei: z.string().optional(),
  requestId: z.string(),
  cmdType: z.string().optional(),
  cmdContent: z.string().optional(),
  status: z.enum(['sent', 'received', 'executed', 'failed']),
  timestamp: z.union([z.string(), z.number()]).optional(),
  response: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  executionTime: z.number().optional(), // tempo de execução em ms
}).passthrough();

export async function POST(request: NextRequest) {
  const timestamp = new Date().toISOString();
  
  try {
    const body = await request.json();
    
    console.log(`[${timestamp}] 📨 COMMAND RESPONSE RECEIVED`);
    console.log('═══════════════════════════════════════');
    
    // Validar payload
    const validatedData = InstructResponseSchema.parse(body);
    
    const imei = validatedData.imei || validatedData.deviceImei;
    console.log(`📱 IMEI: ${imei}`);
    console.log(`🆔 Request ID: ${validatedData.requestId}`);
    
    // Ícones de status
    const statusIcons = {
      sent: '📤',
      received: '📥',
      executed: '✅',
      failed: '❌'
    };
    
    const icon = statusIcons[validatedData.status] || '📋';
    console.log(`${icon} Status: ${validatedData.status.toUpperCase()}`);
    
    if (validatedData.cmdType) {
      console.log(`📝 Tipo de Comando: ${validatedData.cmdType}`);
    }
    
    if (validatedData.cmdContent) {
      console.log(`💬 Conteúdo: ${validatedData.cmdContent}`);
    }
    
    if (validatedData.response) {
      console.log(`📄 Resposta: ${validatedData.response}`);
    }
    
    if (validatedData.status === 'failed') {
      if (validatedData.errorCode) {
        console.log(`⚠️  Código de Erro: ${validatedData.errorCode}`);
      }
      if (validatedData.errorMessage) {
        console.log(`⚠️  Mensagem de Erro: ${validatedData.errorMessage}`);
      }
    }
    
    if (validatedData.executionTime) {
      console.log(`⏱️  Tempo de Execução: ${validatedData.executionTime}ms`);
    }
    
    console.log('📦 Payload completo:', JSON.stringify(validatedData, null, 2));
    console.log('═══════════════════════════════════════\n');
    
    // TODO: Atualizar status do comando no banco de dados
    // TODO: Notificar frontend via WebSocket sobre o status do comando
    // await updateCommandStatus(validatedData);
    
    return NextResponse.json({ 
      status: 'success',
      message: 'Command response received and processed',
      timestamp 
    }, { status: 200 });
    
  } catch (error) {
    console.error(`[${timestamp}] ❌ ERROR processing command response:`, error);
    
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
