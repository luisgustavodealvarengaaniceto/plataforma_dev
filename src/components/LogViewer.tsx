'use client';

interface Log {
  _id: string;
  timestamp: string;
  imei: string;
  endpoint: string;
  payload: any;
}

interface LogViewerProps {
  selectedLog: Log | null;
}

export default function LogViewer({ selectedLog }: LogViewerProps) {
  if (!selectedLog) {
    return <p>Selecione um log para visualizar.</p>;
  }

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">Log ID: {selectedLog._id}</h3>
        <p className="text-gray-600">Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</p>
        <p className="text-gray-600">IMEI: {selectedLog.imei}</p>
        <p className="text-gray-600">Endpoint: {selectedLog.endpoint}</p>
      </div>
      
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto">
        <h4 className="font-semibold mb-2 text-white">Payload:</h4>
        <pre className="text-sm whitespace-pre-wrap">{formatJson(selectedLog.payload)}</pre>
      </div>
    </div>
  );
}