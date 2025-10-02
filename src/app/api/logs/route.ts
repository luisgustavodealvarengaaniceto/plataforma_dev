import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now, index: true },
  imei: { type: String, index: true },
  endpoint: { type: String, index: true },
  payload: { type: Object },
});

const Log = mongoose.models.iothub_raw_logs || mongoose.model('iothub_raw_logs', logSchema);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imei = searchParams.get('imei');
  const endpoint = searchParams.get('endpoint');
  const startTime = searchParams.get('startTime');
  const endTime = searchParams.get('endTime');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    await mongoose.connect('mongodb://root:jimi%40123@137.131.170.156:27017/jimi_iot?authSource=admin');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    return NextResponse.json({ data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } });
  }

  if (mongoose.connection.readyState !== 1) {
    return NextResponse.json({ data: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } });
  }

  const filterQuery: any = {};
  if (imei) filterQuery.imei = imei;
  if (endpoint && endpoint !== 'Todos') filterQuery.endpoint = endpoint;
  if (startTime && endTime) {
    filterQuery.timestamp = { $gte: new Date(startTime), $lte: new Date(endTime) };
  }

  const logs = await Log.find(filterQuery)
    .sort({ timestamp: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  const totalLogs = await Log.countDocuments(filterQuery);

  return NextResponse.json({
    data: logs,
    pagination: {
      total: totalLogs,
      page,
      limit,
      totalPages: Math.ceil(totalLogs / limit),
    },
  });
}