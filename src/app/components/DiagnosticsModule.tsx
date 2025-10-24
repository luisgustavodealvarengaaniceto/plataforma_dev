'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gauge, AlertTriangle, ThermometerSun, Fuel, Zap, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OBDData {
  speed: number;
  rpm: number;
  engineTemp: number;
  fuelLevel: number;
  engineLoad: number;
  throttlePosition: number;
  dtcCodes?: string[];
  mileage?: number;
}

interface DiagnosticsModuleProps {
  imei: string;
}

export default function DiagnosticsModule({ imei }: DiagnosticsModuleProps) {
  const [obdData, setObdData] = useState<OBDData | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: Conectar com API real
    // Simulando dados para demonstração
    const mockData: OBDData = {
      speed: 65,
      rpm: 2400,
      engineTemp: 92,
      fuelLevel: 68,
      engineLoad: 45,
      throttlePosition: 32,
      dtcCodes: [],
      mileage: 45678,
    };
    
    setObdData(mockData);
    setLoading(false);
  }, [imei]);
  
  const renderGauge = (value: number, max: number, label: string, icon: React.ReactNode, unit: string, color: string) => {
    const percentage = (value / max) * 100;
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">{value}</span>
              <span className="text-sm text-muted-foreground">{unit}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-2 rounded-full ${color}`}
              />
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{max}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }
  
  if (!obdData) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Nenhum dado OBD disponível para este dispositivo
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Activity className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Diagnóstico do Veículo</h2>
            <p className="text-blue-100">IMEI: {imei}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Gauges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {renderGauge(
          obdData.speed,
          200,
          'Velocidade',
          <Gauge className="w-4 h-4" />,
          'km/h',
          'bg-blue-500'
        )}
        
        {renderGauge(
          obdData.rpm,
          8000,
          'RPM',
          <Activity className="w-4 h-4" />,
          'rpm',
          'bg-purple-500'
        )}
        
        {renderGauge(
          obdData.engineTemp,
          120,
          'Temperatura do Motor',
          <ThermometerSun className="w-4 h-4" />,
          '°C',
          obdData.engineTemp > 100 ? 'bg-red-500' : 'bg-orange-500'
        )}
        
        {renderGauge(
          obdData.fuelLevel,
          100,
          'Nível de Combustível',
          <Fuel className="w-4 h-4" />,
          '%',
          obdData.fuelLevel < 20 ? 'bg-red-500' : 'bg-green-500'
        )}
        
        {renderGauge(
          obdData.engineLoad,
          100,
          'Carga do Motor',
          <Zap className="w-4 h-4" />,
          '%',
          'bg-yellow-500'
        )}
        
        {renderGauge(
          obdData.throttlePosition,
          100,
          'Posição do Acelerador',
          <Gauge className="w-4 h-4" />,
          '%',
          'bg-indigo-500'
        )}
      </div>
      
      {/* Mileage & DTC Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Kilometragem */}
        {obdData.mileage && (
          <Card>
            <CardHeader>
              <CardTitle>Quilometragem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">
                {obdData.mileage.toLocaleString('pt-BR')} km
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Códigos de Falha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Códigos de Falha (DTC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {obdData.dtcCodes && obdData.dtcCodes.length > 0 ? (
              <div className="space-y-2">
                {obdData.dtcCodes.map((code, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-mono font-semibold text-red-900">{code}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                Nenhuma falha detectada
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
