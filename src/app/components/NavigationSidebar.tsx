import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, 
  Send, 
  FileText, 
  Map, 
  Settings,
  Camera,
  Terminal,
  Activity,
  Database,
  Layers,
  Search,
  Monitor
} from 'lucide-react';

interface NavigationSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ activeTab, onTabChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    {
      id: 'streaming',
      label: 'Streaming',
      icon: Video,
      description: 'Transmissão em tempo real',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'commands',
      label: 'Comandos',
      icon: Send,
      description: 'Enviar comandos',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      id: 'equipments',
      label: 'Equipamentos',
      icon: Monitor,
      description: 'Gerenciar equipamentos',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      id: 'alerts',
      label: 'Alertas',
      icon: Activity,
      description: 'Histórico de alertas',
      gradient: 'from-red-500 to-orange-500',
    },
    {
      id: 'rawdata',
      label: 'Dados Brutos',
      icon: Database,
      description: 'Logs e dados brutos',
      gradient: 'from-gray-500 to-slate-500',
    },
  ];

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`${
        isCollapsed ? 'w-20' : 'w-72'
      } transition-all duration-300 bg-white/60 backdrop-blur-xl rounded-2xl p-4 border border-blue-100/30 shadow-lg h-fit sticky top-6`}
    >
      {/* Header da Sidebar */}
      <div className="flex items-center justify-between mb-6">
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Navegação</h3>
                <p className="text-xs text-slate-500">Módulos da plataforma</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </motion.div>
        </button>
      </div>

      {/* Itens de Navegação */}
      <div className="space-y-2">
        {navigationItems.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: index * 0.05 }}
            onClick={() => onTabChange(item.id)}
            className={`
              w-full text-left group relative overflow-hidden rounded-xl transition-all duration-300
              ${activeTab === item.id 
                ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105` 
                : 'hover:bg-blue-50/80 text-slate-700 hover:scale-102'
              }
            `}
          >
            <div className={`p-4 ${isCollapsed ? 'text-center' : 'flex items-center gap-4'}`}>
              <div className={`
                p-2 rounded-lg transition-all duration-300
                ${activeTab === item.id 
                  ? 'bg-white/20' 
                  : 'bg-white/80 group-hover:bg-white'
                }
              `}>
                <item.icon className={`
                  w-5 h-5 transition-all duration-300
                  ${activeTab === item.id 
                    ? 'text-white' 
                    : `bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent`
                  }
                `} />
              </div>
              
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex-1"
                  >
                    <div className="font-semibold text-sm">
                      {item.label}
                    </div>
                    <div className={`
                      text-xs opacity-80
                      ${activeTab === item.id ? 'text-white/80' : 'text-slate-500'}
                    `}>
                      {item.description}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Indicador ativo */}
            {activeTab === item.id && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 pointer-events-none"
                transition={{ type: "spring", duration: 0.6 }}
              />
            )}
          </motion.button>
        ))}
      </div>

      {/* Footer da Sidebar */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-100"
          >
            <div className="text-xs text-center text-slate-600">
              <div className="font-semibold mb-1">YUV PLUS v2.0</div>
              <div>Sistema de Telemetria Avançada</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default NavigationSidebar;