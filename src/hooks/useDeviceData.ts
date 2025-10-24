import { useEffect, useState, useCallback } from 'react';
import { useDeviceStore } from '@/store/deviceStore';

interface DeviceData {
  imei: string;
  gps?: any;
  alerts?: any[];
  logs?: any[];
  stats?: any;
}

interface UseDeviceDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // em ms
}

export function useDeviceData(imei: string | null, options: UseDeviceDataOptions = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;
  
  const [data, setData] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const updateDevice = useDeviceStore(state => state.updateDevice);
  
  const fetchDeviceData = useCallback(async () => {
    if (!imei) {
      setData(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Buscar dados do dispositivo
      const [gpsResponse, alertsResponse, statsResponse] = await Promise.allSettled([
        fetch(`http://localhost:3002/api/device/${imei}/last-position`).then(r => r.json()),
        fetch(`http://localhost:3002/api/device/${imei}/alerts?limit=10`).then(r => r.json()),
        fetch(`http://localhost:3002/api/device/${imei}/stats`).then(r => r.json()),
      ]);
      
      const deviceData: DeviceData = { imei };
      
      if (gpsResponse.status === 'fulfilled') {
        deviceData.gps = gpsResponse.value;
      }
      
      if (alertsResponse.status === 'fulfilled') {
        deviceData.alerts = alertsResponse.value;
      }
      
      if (statsResponse.status === 'fulfilled') {
        deviceData.stats = statsResponse.value;
      }
      
      setData(deviceData);
      
      // Atualizar status do dispositivo no store
      if (deviceData.gps) {
        updateDevice(imei, {
          status: 'online',
          lastSeen: new Date(deviceData.gps.timestamp)
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch device data';
      setError(errorMessage);
      console.error('Error fetching device data:', err);
    } finally {
      setLoading(false);
    }
  }, [imei, updateDevice]);
  
  // Auto-refresh
  useEffect(() => {
    fetchDeviceData();
    
    if (autoRefresh && imei) {
      const interval = setInterval(fetchDeviceData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [imei, autoRefresh, refreshInterval, fetchDeviceData]);
  
  return {
    data,
    loading,
    error,
    refresh: fetchDeviceData,
  };
}

// Hook para obter estatísticas do dispositivo
export function useDeviceStats(imei: string | null) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!imei) return;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3002/api/device/${imei}/stats`);
        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching device stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [imei]);
  
  return { stats, loading };
}

// Hook para obter histórico de posições
export function useDeviceHistory(imei: string | null, limit = 50) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (!imei) return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3002/api/device/${imei}/history?limit=${limit}`);
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching device history:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [imei, limit]);
  
  return { history, loading };
}
