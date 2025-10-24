import { create } from 'zustand';

export interface ErrorNotification {
  id: string;
  title: string;
  message: string;
  type: 'error' | 'warning' | 'info' | 'success';
  timestamp: Date;
  duration?: number; // em ms, undefined = não fecha automaticamente
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ErrorStore {
  errors: ErrorNotification[];
  addError: (error: Omit<ErrorNotification, 'id' | 'timestamp'>) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
}

export const useErrorStore = create<ErrorStore>((set) => ({
  errors: [],
  
  addError: (error) => {
    const id = `error_${Date.now()}_${Math.random()}`;
    const newError: ErrorNotification = {
      ...error,
      id,
      timestamp: new Date(),
    };
    
    set((state) => ({
      errors: [...state.errors, newError],
    }));
    
    // Auto-remover após a duração especificada
    if (error.duration) {
      setTimeout(() => {
        set((state) => ({
          errors: state.errors.filter((e) => e.id !== id),
        }));
      }, error.duration);
    }
  },
  
  removeError: (id) => set((state) => ({
    errors: state.errors.filter((e) => e.id !== id),
  })),
  
  clearErrors: () => set({ errors: [] }),
}));

// Helper functions para criar notificações específicas
export const errorHelpers = {
  apiError: (message: string, details?: any) => {
    useErrorStore.getState().addError({
      title: 'Erro de Comunicação',
      message: `Falha ao comunicar com a API: ${message}`,
      type: 'error',
      duration: 5000,
    });
    console.error('API Error:', message, details);
  },
  
  deviceError: (imei: string, message: string) => {
    useErrorStore.getState().addError({
      title: `Erro no Dispositivo ${imei}`,
      message,
      type: 'error',
      duration: 5000,
    });
  },
  
  commandError: (command: string, message: string) => {
    useErrorStore.getState().addError({
      title: 'Falha ao Enviar Comando',
      message: `Comando "${command}" falhou: ${message}`,
      type: 'error',
      duration: 5000,
    });
  },
  
  success: (message: string) => {
    useErrorStore.getState().addError({
      title: 'Sucesso',
      message,
      type: 'success',
      duration: 3000,
    });
  },
  
  warning: (message: string) => {
    useErrorStore.getState().addError({
      title: 'Atenção',
      message,
      type: 'warning',
      duration: 4000,
    });
  },
  
  info: (message: string) => {
    useErrorStore.getState().addError({
      title: 'Informação',
      message,
      type: 'info',
      duration: 3000,
    });
  },
};

// Hook personalizado para tratamento de erros em requests
export function useErrorHandler() {
  const addError = useErrorStore((state) => state.addError);
  
  const handleError = (error: any, context?: string) => {
    let message = 'Erro desconhecido';
    
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === 'string') {
      message = error;
    } else if (error?.message) {
      message = error.message;
    }
    
    addError({
      title: context || 'Erro',
      message,
      type: 'error',
      duration: 5000,
    });
    
    console.error(`[${context || 'Error'}]`, error);
  };
  
  const wrapAsync = <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ) => {
    return async (...args: T): Promise<R | null> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, context);
        return null;
      }
    };
  };
  
  return {
    handleError,
    wrapAsync,
    success: errorHelpers.success,
    warning: errorHelpers.warning,
    info: errorHelpers.info,
  };
}
