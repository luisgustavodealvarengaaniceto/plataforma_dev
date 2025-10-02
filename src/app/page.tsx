'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Novos componentes da interface renovada
import LoadingAnimation from './components/LoadingAnimation';
import DashboardHeader from './components/DashboardHeader';
import NavigationSidebar from './components/NavigationSidebar';
import StreamingModule from './components/StreamingModule';
import CommandsModule from './components/CommandsModule';
import EquipmentsModule from './components/EquipmentsModule';
import AlertsModule from './components/AlertsModule';
import RawDataModule from './components/RawDataModule';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('streaming');
  const [currentTime, setCurrentTime] = useState('');
  const [activeIMEI, setActiveIMEI] = useState('864993060259554');
  const [imeiStats, setImeiStats] = useState<any>(null);
  const [activeEquipment, setActiveEquipment] = useState<any>(null);

  // Atualizar hora a cada segundo
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('pt-BR'));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Buscar equipamento ativo
  useEffect(() => {
    const fetchActiveEquipment = async () => {
      try {
        const response = await fetch('http://localhost:3002/api/equipments/active');
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setActiveEquipment(result.data.equipment);
            setActiveIMEI(result.data.equipment.imei);
            setImeiStats(result.data.stats);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar equipamento ativo:', error);
      }
    };

    fetchActiveEquipment();
    const interval = setInterval(fetchActiveEquipment, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  // Buscar estatísticas do IMEI ativo
  useEffect(() => {
    const fetchStats = async () => {
      if (!activeIMEI) return;
      
      try {
        const response = await fetch(`http://localhost:3002/api/device/${activeIMEI}/stats`);
        if (response.ok) {
          const result = await response.json();
          setImeiStats(result.data);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
      }
    };

    if (activeIMEI && !isLoading) {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Atualizar a cada 30s
      return () => clearInterval(interval);
    }
  }, [activeIMEI, isLoading]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'streaming':
        return <StreamingModule activeIMEI={activeIMEI} />;
      case 'commands':
        return <CommandsModule activeIMEI={activeIMEI} />;
      case 'equipments':
        return (
          <EquipmentsModule 
            onEquipmentActivated={(equipment: any) => {
              setActiveIMEI(equipment.imei);
              setActiveEquipment(equipment);
              toast.success(`Equipamento ${equipment.name} ativado com sucesso!`);
            }}
          />
        );
      case 'alerts':
        return <AlertsModule activeIMEI={activeIMEI} />;
      case 'rawdata':
        return <RawDataModule activeIMEI={activeIMEI} />;
      default:
        return <StreamingModule activeIMEI={activeIMEI} />;
    }
  };

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <LoadingAnimation onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50"
          >
            <div className="container mx-auto px-6 py-6">
              {/* Header Dashboard */}
              <DashboardHeader 
                activeIMEI={activeIMEI}
                imeiStats={imeiStats}
                currentTime={currentTime}
                activeEquipment={activeEquipment}
              />

              {/* Layout Principal */}
              <div className="flex gap-6">
                {/* Sidebar de Navegação */}
                <NavigationSidebar 
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />

                {/* Conteúdo Principal */}
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  className="flex-1"
                >
                  {renderActiveModule()}
                </motion.div>
              </div>
            </div>

            {/* Background Pattern */}
            <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/5 rounded-full blur-3xl"></div>
              <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-400/5 rounded-full blur-3xl"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}