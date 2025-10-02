'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface Log {
  _id: string;
  timestamp: string;
  imei: string;
  endpoint: string;
  payload: any;
}

interface LogTableProps {
  logs: Log[];
  onSelectLog: (log: Log) => void;
  isLoading: boolean;
}

export default function LogTable({ logs, onSelectLog, isLoading }: LogTableProps) {
  if (isLoading) {
    return <p>Carregando...</p>;
  }

  if (logs.length === 0) {
    return <p>Nenhum resultado encontrado</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Timestamp</TableHead>
          <TableHead>IMEI</TableHead>
          <TableHead>Endpoint</TableHead>
          <TableHead>Resumo</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log._id} onClick={() => onSelectLog(log)} className="cursor-pointer">
            <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
            <TableCell>{log.imei}</TableCell>
            <TableCell>{log.endpoint}</TableCell>
            <TableCell>{getSummary(log)}</TableCell>
            <TableCell>
              <button onClick={(e) => { e.stopPropagation(); onSelectLog(log); }}>Ver</button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getSummary(log: Log): string {
  if (log.endpoint === '/pushalarm') return `Alarme: ${log.payload.alertType || 'N/A'}`;
  if (log.endpoint === '/pushgps') return `GPS: ${log.payload.latitude || 'N/A'}, ${log.payload.longitude || 'N/A'}`;
  if (log.endpoint === '/pushevent') return `Evento: ${log.payload.eventType || 'N/A'}`;
  return 'Dados recebidos';
}