'use client';

import { useState, useEffect } from 'react';
import LogFilters from '@/components/LogFilters';
import LogTable from '@/components/LogTable';
import LogViewer from '@/components/LogViewer';
import Pagination from '@/components/Pagination';

interface Log {
  _id: string;
  timestamp: string;
  imei: string;
  endpoint: string;
  payload: any;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function LogsPage() {
  const [filters, setFilters] = useState({ imei: '', endpoint: 'Todos', startTime: '', endTime: '' });
  const [logs, setLogs] = useState<Log[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({ total: 0, page: 1, limit: 50, totalPages: 0 });
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      }).toString();
      const response = await fetch(`/api/logs?${queryParams}`);
      const data = await response.json();
      setLogs(data.data);
      setPagination(data.pagination);
      setIsLoading(false);
    };
    fetchLogs();
  }, [filters, pagination.page]);

  const handleFiltersSubmit = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Visualizador de Logs</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <LogFilters onSubmit={handleFiltersSubmit} />
        </div>
        <div className="md:col-span-2">
          <LogTable logs={logs} onSelectLog={setSelectedLog} isLoading={isLoading} />
          <Pagination pagination={pagination} onPageChange={handlePageChange} />
        </div>
      </div>
      <div className="mt-4">
        <LogViewer selectedLog={selectedLog} />
      </div>
    </div>
  );
}
