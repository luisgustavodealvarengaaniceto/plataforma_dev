'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Route, Gauge, User, AlertTriangle, TrendingUp, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TripReport {
  tripId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  distance: number;
  maxSpeed: number;
  avgSpeed: number;
  startLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  endLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  driverName?: string;
  fuelConsumption?: number;
  idleTime?: number;
  harshBraking?: number;
  harshAcceleration?: number;
}

interface TripReportModuleProps {
  imei: string;
}

export default function TripReportModule({ imei }: TripReportModuleProps) {
  const [trips, setTrips] = useState<TripReport[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripReport | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // TODO: Conectar com API real
    // Simulando dados para demonstração
    const mockTrips: TripReport[] = [
      {
        tripId: 'trip_001',
        startTime: new Date('2025-10-01T08:30:00'),
        endTime: new Date('2025-10-01T10:45:00'),
        duration: 8100, // 2h 15min em segundos
        distance: 125000, // 125 km em metros
        maxSpeed: 110,
        avgSpeed: 65,
        driverName: 'João Silva',
        fuelConsumption: 12.5,
        idleTime: 600, // 10 min
        harshBraking: 3,
        harshAcceleration: 5,
        startLocation: {
          lat: -23.5505,
          lng: -46.6333,
          address: 'São Paulo, SP'
        },
        endLocation: {
          lat: -23.2237,
          lng: -45.9009,
          address: 'São José dos Campos, SP'
        }
      },
      {
        tripId: 'trip_002',
        startTime: new Date('2025-10-01T14:00:00'),
        endTime: new Date('2025-10-01T15:30:00'),
        duration: 5400, // 1h 30min
        distance: 85000, // 85 km
        maxSpeed: 95,
        avgSpeed: 57,
        driverName: 'Maria Santos',
        fuelConsumption: 8.2,
        idleTime: 300,
        harshBraking: 1,
        harshAcceleration: 2,
      }
    ];
    
    setTrips(mockTrips);
    setLoading(false);
  }, [imei]);
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}min`;
  };
  
  const formatDistance = (meters: number) => {
    return `${(meters / 1000).toFixed(2)} km`;
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
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
        className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Route className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Relatórios de Viagem</h2>
            <p className="text-green-100">IMEI: {imei}</p>
          </div>
        </div>
      </motion.div>
      
      {/* Trips List */}
      <div className="grid grid-cols-1 gap-4">
        {trips.map((trip) => (
          <motion.div
            key={trip.tripId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="cursor-pointer"
            onClick={() => setSelectedTrip(trip)}
          >
            <Card className={selectedTrip?.tripId === trip.tripId ? 'ring-2 ring-green-500' : ''}>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Data e Hora */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Data
                    </div>
                    <div className="font-semibold">
                      {trip.startTime.toLocaleDateString('pt-BR')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trip.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {trip.endTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {/* Duração e Distância */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      Duração / Distância
                    </div>
                    <div className="font-semibold">{formatDuration(trip.duration)}</div>
                    <div className="text-sm text-green-600 font-medium">{formatDistance(trip.distance)}</div>
                  </div>
                  
                  {/* Velocidades */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Gauge className="w-4 h-4" />
                      Velocidade
                    </div>
                    <div className="font-semibold">Máx: {trip.maxSpeed} km/h</div>
                    <div className="text-sm text-muted-foreground">Média: {trip.avgSpeed} km/h</div>
                  </div>
                  
                  {/* Motorista */}
                  {trip.driverName && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        Motorista
                      </div>
                      <div className="font-semibold">{trip.driverName}</div>
                    </div>
                  )}
                </div>
                
                {/* Alertas de Comportamento */}
                {(trip.harshBraking! > 0 || trip.harshAcceleration! > 0) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm">
                      {trip.harshBraking! > 0 && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <AlertTriangle className="w-4 h-4" />
                          {trip.harshBraking} frenagens bruscas
                        </div>
                      )}
                      {trip.harshAcceleration! > 0 && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <TrendingUp className="w-4 h-4" />
                          {trip.harshAcceleration} acelerações bruscas
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Detalhes da Viagem Selecionada */}
      {selectedTrip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Detalhes da Viagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Localização Inicial */}
                {selectedTrip.startLocation && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <MapPin className="w-4 h-4 text-green-600" />
                      Origem
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedTrip.startLocation.address || 'Endereço não disponível'}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {selectedTrip.startLocation.lat.toFixed(6)}, {selectedTrip.startLocation.lng.toFixed(6)}
                    </div>
                  </div>
                )}
                
                {/* Localização Final */}
                {selectedTrip.endLocation && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <MapPin className="w-4 h-4 text-red-600" />
                      Destino
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {selectedTrip.endLocation.address || 'Endereço não disponível'}
                    </div>
                    <div className="text-xs font-mono text-muted-foreground">
                      {selectedTrip.endLocation.lat.toFixed(6)}, {selectedTrip.endLocation.lng.toFixed(6)}
                    </div>
                  </div>
                )}
                
                {/* Consumo de Combustível */}
                {selectedTrip.fuelConsumption && (
                  <div className="space-y-2">
                    <div className="font-semibold">Consumo de Combustível</div>
                    <div className="text-2xl font-bold text-blue-600">{selectedTrip.fuelConsumption} L</div>
                    <div className="text-sm text-muted-foreground">
                      {((selectedTrip.fuelConsumption / (selectedTrip.distance / 1000)) * 100).toFixed(2)} L/100km
                    </div>
                  </div>
                )}
                
                {/* Tempo Ocioso */}
                {selectedTrip.idleTime && (
                  <div className="space-y-2">
                    <div className="font-semibold">Tempo Ocioso</div>
                    <div className="text-2xl font-bold text-yellow-600">{Math.round(selectedTrip.idleTime / 60)} min</div>
                  </div>
                )}
              </div>
              
              {/* TODO: Adicionar mapa com trajeto */}
              <div className="mt-6 p-8 bg-gray-100 rounded-lg text-center text-muted-foreground">
                Mapa do Trajeto (Em Desenvolvimento)
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
