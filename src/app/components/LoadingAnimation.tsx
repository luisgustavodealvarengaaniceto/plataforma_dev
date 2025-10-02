import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface LoadingAnimationProps {
  onComplete: () => void;
}

// Partículas fixas para evitar problemas de hidratação
const FIXED_PARTICLES = [
  { left: 10, top: 20 },
  { left: 85, top: 15 },
  { left: 25, top: 70 },
  { left: 60, top: 40 },
  { left: 75, top: 80 },
  { left: 40, top: 25 },
  { left: 90, top: 60 },
  { left: 15, top: 85 },
  { left: 55, top: 10 },
  { left: 30, top: 50 },
  { left: 70, top: 30 },
  { left: 45, top: 90 },
  { left: 80, top: 45 },
  { left: 20, top: 65 },
  { left: 65, top: 75 },
  { left: 35, top: 35 },
  { left: 95, top: 25 },
  { left: 5, top: 55 },
  { left: 50, top: 95 },
  { left: 85, top: 5 }
];

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + 2;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500); // Delay pequeno antes de completar
          return 100;
        }
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900"
    >
      {/* Logo e Texto Principal */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-400 to-cyan-400 rounded-xl"></div>
              <div className="absolute inset-1 bg-slate-900 rounded-lg flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11C5.84 5 5.28 5.42 5.08 6.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16C5.67 16 5 15.33 5 14.5S5.67 13 6.5 13 8 13.67 8 14.5 7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5S16.67 13 17.5 13s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/>
                </svg>
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white mb-2">YUV PLUS</h1>
            <p className="text-blue-200 text-lg">Plataforma de Telemetria Veicular</p>
          </div>
        </motion.div>

        {/* Barra de Progresso */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-80 mx-auto"
        >
          <div className="bg-slate-800/50 rounded-full h-2 mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1, ease: "easeOut" }}
            />
          </div>
          <p className="text-blue-200 text-sm">
            Carregando sistema... {progress}%
          </p>
        </motion.div>

        {/* Indicadores de Sistema */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 space-y-2"
        >
          <div className="flex items-center justify-center text-blue-300 text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 20 ? 'bg-green-400' : 'bg-slate-600'}`}></div>
            Conectando ao servidor...
          </div>
          <div className="flex items-center justify-center text-blue-300 text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 50 ? 'bg-green-400' : 'bg-slate-600'}`}></div>
            Carregando interface...
          </div>
          <div className="flex items-center justify-center text-blue-300 text-sm">
            <div className={`w-2 h-2 rounded-full mr-2 ${progress > 80 ? 'bg-green-400' : 'bg-slate-600'}`}></div>
            Inicializando módulos...
          </div>
        </motion.div>
      </div>

      {/* Partículas de Fundo Simplificadas */}
      {mounted && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {FIXED_PARTICLES.map((particle, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default LoadingAnimation;