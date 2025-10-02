'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Activity, Cpu, Users, Battery, Thermometer, Gauge, TrendingUp, Search } from 'lucide-react';

interface OBDData {
  imei: string;
  rpm: number;
  speed: number;
  temperature: number;
  fuelLevel: number;
  timestamp: string;
}

interface RFIDData {
  imei: string;
  driverId: string;
  driverName: string;
  timestamp: string;
  event: 'login' | 'logout';
}

interface BatteryData {
  imei: string;
  level: number;
  voltage: number;
  current: number;
  temperature: number;
  timestamp: string;
}

interface DataFusionProps {
  activeIMEI?: string;
}

export default function DataFusion({ activeIMEI }: DataFusionProps) {
  const [selectedIMEI, setSelectedIMEI] = useState(activeIMEI || '860112070135860');
  const [obdData, setObdData] = useState<OBDData[]>([]);
  const [rfidData, setRfidData] = useState<RFIDData[]>([]);
  const [batteryData, setBatteryData] = useState<BatteryData[]>([]);

  // Atualizar IMEI quando o prop mudar
  useEffect(() => {
    if (activeIMEI) {
      setSelectedIMEI(activeIMEI);
    }
  }, [activeIMEI]);

  // Simular dados em tempo real - em produção conectar aos webhooks
  useEffect(() => {
    // Dados OBD simulados - apenas se houver IMEI selecionado
    if (selectedIMEI) {
      const mockOBD: OBDData[] = [
        { imei: selectedIMEI, rpm: 1800, speed: 45, temperature: 85, fuelLevel: 75, timestamp: new Date().toISOString() }
      ];
      setObdData(mockOBD);

      // Dados RFID simulados
      const mockRFID: RFIDData[] = [
        { imei: selectedIMEI, driverId: 'DRV001', driverName: 'João Silva', timestamp: new Date().toISOString(), event: 'login' }
      ];
      setRfidData(mockRFID);

      // Dados de bateria simulados
      const mockBattery: BatteryData[] = [
        { imei: selectedIMEI, level: 85, voltage: 12.8, current: 2.1, temperature: 42, timestamp: new Date().toISOString() }
      ];
      setBatteryData(mockBattery);
    } else {
      // Limpar dados se nenhum IMEI selecionado
      setObdData([]);
      setRfidData([]);
      setBatteryData([]);
    }
  }, [selectedIMEI]);

  const GaugeWidget = ({
    title,
    value,
    unit,
    min,
    max,
    color,
    icon: Icon,
    trend
  }: {
    title: string;
    value: number;
    unit: string;
    min: number;
    max: number;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
    trend?: 'up' | 'down' | 'stable';
  }) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-800 border border-gray-700 rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm font-medium text-gray-300">{title}</span>
          </div>
          {trend && (
            <TrendingUp className={`w-4 h-4 ${
              trend === 'up' ? 'text-green-400' :
              trend === 'down' ? 'text-red-400' : 'text-gray-400'
            }`} />
          )}
        </div>

        <div className="text-center">
          <div className={`text-2xl font-bold ${color}`}>
            {value.toFixed(1)}{unit}
          </div>
          <div className="mt-2 bg-gray-700 rounded-full h-2">
            <motion.div
              className={`h-2 rounded-full ${color.replace('text-', 'bg-')}`}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {min}{unit} - {max}{unit}
          </div>
        </div>
      </motion.div>
    );
  };

  const latestOBD = obdData[obdData.length - 1];
  const latestBattery = batteryData[batteryData.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-gray-900 border-purple-500/20">
        <CardHeader className="border-b border-purple-500/20">
          <CardTitle className="flex items-center gap-2 text-purple-400">
            <Activity className="w-5 h-5" />
            Fusão de Dados Avançados
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-purple-400" />
              <Label htmlFor="fusion-imei" className="text-sm text-gray-300">IMEI do Equipamento:</Label>
            </div>
            <Input
              id="fusion-imei"
              value={selectedIMEI}
              onChange={(e) => setSelectedIMEI(e.target.value)}
              placeholder="Digite o IMEI"
              className="w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 h-full overflow-y-auto">
          <div className="mb-4">
            <Label htmlFor="imei" className="text-purple-300">
              Seletor de IMEI
            </Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                id="imei"
                value={selectedIMEI}
                onChange={(e) => setSelectedIMEI(e.target.value)}
                placeholder="Digite o IMEI do dispositivo"
                className="bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={() => setSelectedIMEI('')}
                className="px-3 py-2 bg-red-600 rounded-md text-white text-sm font-medium hover:bg-red-500 transition-colors"
              >
                <Search className="w-4 h-4 mr-1" />
                Limpar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {/* Widget OBD */}
            {latestOBD && (
              <>
                <GaugeWidget
                  title="RPM"
                  value={latestOBD.rpm}
                  unit=""
                  min={0}
                  max={4000}
                  color="text-blue-400"
                  icon={Gauge}
                  trend="stable"
                />
                <GaugeWidget
                  title="Velocidade"
                  value={latestOBD.speed}
                  unit=" km/h"
                  min={0}
                  max={120}
                  color="text-green-400"
                  icon={Activity}
                  trend="stable"
                />
                <GaugeWidget
                  title="Temperatura Motor"
                  value={latestOBD.temperature}
                  unit="°C"
                  min={60}
                  max={120}
                  color="text-red-400"
                  icon={Thermometer}
                  trend="stable"
                />
              </>
            )}

            {/* Widget Bateria */}
            {latestBattery && (
              <>
                <GaugeWidget
                  title="Nível Bateria"
                  value={latestBattery.level}
                  unit="%"
                  min={0}
                  max={100}
                  color="text-yellow-400"
                  icon={Battery}
                  trend="stable"
                />
                <GaugeWidget
                  title="Tensão"
                  value={latestBattery.voltage}
                  unit="V"
                  min={10}
                  max={15}
                  color="text-cyan-400"
                  icon={Cpu}
                  trend="stable"
                />
                <GaugeWidget
                  title="Temperatura Bateria"
                  value={latestBattery.temperature}
                  unit="°C"
                  min={20}
                  max={70}
                  color="text-orange-400"
                  icon={Thermometer}
                  trend="stable"
                />
              </>
            )}
          </div>

          {/* Widget RFID */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-medium text-purple-300">Identificação do Motorista</h3>
              </div>

              <div className="space-y-3">
                {rfidData.slice(-3).map((rfid, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-700 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">{rfid.driverName}</span>
                      <span className={`px-2 py-1 rounded text-xs ${
                        rfid.event === 'login' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {rfid.event === 'login' ? 'Login' : 'Logout'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      ID: {rfid.driverId} • {new Date(rfid.timestamp).toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Status Geral do Veículo */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-medium text-purple-300">Status do Veículo</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Estado Geral:</span>
                  <span className="text-green-400 font-medium">Operacional</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Conectividade:</span>
                  <span className="text-green-400 font-medium">Online</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Última Atualização:</span>
                  <span className="text-white font-medium">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Dados OBD:</span>
                  <span className="text-blue-400 font-medium">Ativo</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">RFID:</span>
                  <span className="text-purple-400 font-medium">Detectado</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Gráfico de Tendências (Mock) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-medium text-purple-300">Tendências de Performance</h3>
            </div>

            <div className="h-32 bg-gray-700 rounded flex items-end justify-between p-2">
              {/* Simulação de gráfico de barras */}
              {[65, 78, 82, 75, 88, 92, 85, 90].map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ height: 0 }}
                  animate={{ height: `${value}%` }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="bg-gradient-to-t from-purple-600 to-purple-400 rounded-t w-6"
                  style={{ height: `${value}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>08:00</span>
              <span>10:00</span>
              <span>12:00</span>
              <span>14:00</span>
              <span>16:00</span>
              <span>18:00</span>
              <span>20:00</span>
              <span>22:00</span>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}