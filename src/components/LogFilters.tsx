'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface LogFiltersProps {
  onSubmit: (filters: { imei: string; endpoint: string; startTime: string; endTime: string }) => void;
}

export default function LogFilters({ onSubmit }: LogFiltersProps) {
  const [imei, setImei] = useState('');
  const [endpoint, setEndpoint] = useState('Todos');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ imei, endpoint, startTime, endTime });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="imei">IMEI</Label>
        <Input id="imei" value={imei} onChange={(e) => setImei(e.target.value)} placeholder="Digite o IMEI" />
      </div>
      <div>
        <Label htmlFor="endpoint">Endpoint</Label>
        <Select value={endpoint} onValueChange={setEndpoint}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o endpoint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="/pushgps">/pushgps</SelectItem>
            <SelectItem value="/pushalarm">/pushalarm</SelectItem>
            <SelectItem value="/pushevent">/pushevent</SelectItem>
            <SelectItem value="/pushTerminalTransInfo">/pushTerminalTransInfo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="startTime">Data de Início</Label>
        <Input id="startTime" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="endTime">Data de Fim</Label>
        <Input id="endTime" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
      </div>
      <Button type="submit">Aplicar Filtros</Button>
    </form>
  );
}