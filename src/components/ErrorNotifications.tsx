'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { useErrorStore } from '@/store/errorStore';

export default function ErrorNotifications() {
  const { errors, removeError } = useErrorStore();
  
  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
      default:
        return <Info className="w-5 h-5" />;
    }
  };
  
  const getColors = (type: string) => {
    switch (type) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'success':
        return 'bg-green-500 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-500 text-white';
    }
  };
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      <AnimatePresence>
        {errors.map((error) => (
          <motion.div
            key={error.id}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            className={`${getColors(error.type)} rounded-lg shadow-lg p-4 flex items-start gap-3 min-w-[320px]`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getIcon(error.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm mb-1">{error.title}</h4>
              <p className="text-sm opacity-90 break-words">{error.message}</p>
              
              {error.action && (
                <button
                  onClick={error.action.onClick}
                  className="mt-2 text-sm font-medium underline hover:no-underline"
                >
                  {error.action.label}
                </button>
              )}
            </div>
            
            <button
              onClick={() => removeError(error.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
