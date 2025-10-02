import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Clock, Database } from 'lucide-react';

interface DashboardHeaderProps {
  activeIMEI: string;
  imeiStats: any;
  currentTime: string;
  activeEquipment?: any;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ activeIMEI, imeiStats, currentTime, activeEquipment }) => {
  const getStatusColor = (lastActivity?: string) => {
    if (!lastActivity) return 'text-gray-500';
    
    const timeDiff = Date.now() - new Date(lastActivity).getTime();
    const minutesAgo = timeDiff / (1000 * 60);
    
    if (minutesAgo <= 5) return 'text-green-500';
    if (minutesAgo <= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = (lastActivity?: string) => {
    if (!lastActivity) return 'Sem dados';
    
    const timeDiff = Date.now() - new Date(lastActivity).getTime();
    const minutesAgo = timeDiff / (1000 * 60);
    
    if (minutesAgo <= 5) return 'Online';
    if (minutesAgo <= 60) return 'Recente';
    return 'Offline';
  };

  const stats = [
    {
      label: 'Total de Logs',
      value: imeiStats?.totalLogs || 0,
      icon: Database,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Status Conexão',
      value: getStatusText(imeiStats?.lastActivity),
      icon: Wifi,
      color: getStatusColor(imeiStats?.lastActivity),
      bgColor: 'bg-green-50',
    },
    {
      label: 'Endpoints Ativos',
      value: imeiStats?.endpoints?.length || 0,
      icon: Activity,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Última Transmissão',
      value: imeiStats?.lastActivity ? new Date(imeiStats.lastActivity).toLocaleTimeString('pt-BR') : 'Nunca',
      icon: Clock,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="mb-8">
      {/* Header Principal */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 mb-6 border border-blue-100/50 shadow-lg"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              YUV PLUS
            </h1>
            <p className="text-slate-600 font-medium">
              Plataforma de Telemetria Veicular
            </p>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-slate-500 mb-1">
              {activeEquipment ? 'Equipamento Ativo' : 'IMEI Ativo'}
            </div>
            <div className="text-lg font-bold text-slate-800">
              {activeEquipment ? activeEquipment.name : (activeIMEI || 'Nenhum equipamento ativo')}
            </div>
            {activeIMEI && (
              <div className="text-sm text-slate-600 font-mono">
                {activeIMEI}
              </div>
            )}
            <div className="text-sm text-slate-500">
              {currentTime}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white/60 backdrop-blur-xl rounded-xl p-4 border border-blue-100/30 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-slate-500 mb-1">
                  {stat.label}
                </div>
                <div className="text-xl font-bold text-slate-800">
                  {stat.value}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DashboardHeader;