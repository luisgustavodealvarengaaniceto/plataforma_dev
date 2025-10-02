import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

// Schema para armazenar listas de arquivos de vídeo
const videoFileListSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  imei: { type: String, required: true, index: true },
  fileNameList: { type: [String], required: true },
  totalFiles: { type: Number, required: true },
  processed: { type: Boolean, default: false },
});

const VideoFileList = mongoose.models.iothub_video_file_lists || mongoose.model('iothub_video_file_lists', videoFileListSchema);

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('📋 [VIDEO FILE LIST] Lista recebida:', payload);

    // Conectar ao MongoDB
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      console.error('❌ [VIDEO FILE LIST] MongoDB não conectado');
      return NextResponse.json({ code: 1, message: 'Database connection failed' }, { status: 500 });
    }

    const { imei, fileNameList } = payload;

    if (!imei || !fileNameList || !Array.isArray(fileNameList)) {
      console.error('❌ [VIDEO FILE LIST] Dados inválidos');
      return NextResponse.json({ code: 1, message: 'Invalid data: imei and fileNameList array required' }, { status: 400 });
    }

    // Salvar lista de arquivos
    const fileList = new VideoFileList({
      imei,
      fileNameList,
      totalFiles: fileNameList.length,
    });
    await fileList.save();

    console.log(`✅ [VIDEO FILE LIST] ${fileNameList.length} arquivos salvos para IMEI: ${imei}`);

    // Responder com sucesso para confirmar recebimento
    return NextResponse.json({ code: 0 });

  } catch (error) {
    console.error('❌ [VIDEO FILE LIST] Erro:', error);
    return NextResponse.json({ code: 1, message: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get('imei');
  const limit = parseInt(searchParams.get('limit') || '1');

  try {
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');

    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json({ data: [] });
    }

    const filter: any = {};
    if (imei) filter.imei = imei;

    const fileLists = await VideoFileList.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      data: fileLists,
      message: 'Listas de arquivos de vídeo disponíveis'
    });

  } catch (error) {
    console.error('❌ [VIDEO FILE LIST] Erro na consulta:', error);
    return NextResponse.json({ data: [], error: 'Database query failed' }, { status: 500 });
  }
}