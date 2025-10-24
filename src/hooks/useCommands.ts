import { useState, useCallback } from 'react';
import { useDeviceStore } from '@/store/deviceStore';

interface SendCommandOptions {
  imei: string;
  cmdContent: string;
  proNo?: string | number;
}

interface CommandResponse {
  success: boolean;
  requestId?: string;
  data?: any;
  error?: string;
}

export function useCommands() {
  const [sending, setSending] = useState(false);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  
  const updateCommandStatus = useDeviceStore(state => state.updateCommandStatus);
  const getCommandStatus = useDeviceStore(state => state.getCommandStatus);
  
  const sendCommand = useCallback(async (options: SendCommandOptions): Promise<CommandResponse> => {
    const { imei, cmdContent, proNo = '128' } = options;
    
    setSending(true);
    setLastResponse(null);
    
    const requestId = `cmd_${Date.now()}`;
    
    // Registrar comando como enviado
    updateCommandStatus(requestId, {
      requestId,
      imei,
      command: cmdContent,
      status: 'sent',
      timestamp: new Date(),
    });
    
    try {
      const response = await fetch('http://localhost:3002/enviar-comando', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imei,
          cmdContent,
          proNo: String(proNo),
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send command');
      }
      
      // Atualizar status para recebido
      updateCommandStatus(requestId, {
        requestId,
        imei,
        command: cmdContent,
        status: 'received',
        timestamp: new Date(),
        response: JSON.stringify(data),
      });
      
      const result: CommandResponse = {
        success: true,
        requestId,
        data,
      };
      
      setLastResponse(result);
      return result;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Atualizar status para falha
      updateCommandStatus(requestId, {
        requestId,
        imei,
        command: cmdContent,
        status: 'failed',
        timestamp: new Date(),
        error: errorMessage,
      });
      
      const result: CommandResponse = {
        success: false,
        error: errorMessage,
      };
      
      setLastResponse(result);
      return result;
      
    } finally {
      setSending(false);
    }
  }, [updateCommandStatus]);
  
  const sendMediaCaptureCommand = useCallback(async (
    imei: string,
    type: 'PICTURE' | 'VIDEO',
    camera: 'in' | 'out' | 'inout' = 'in'
  ): Promise<CommandResponse> => {
    return sendCommand({
      imei,
      cmdContent: `${type},${camera}`,
      proNo: '128',
    });
  }, [sendCommand]);
  
  const startStreaming = useCallback(async (
    imei: string,
    camera: 'INOUT' | 'IN' | 'OUT' = 'INOUT'
  ): Promise<CommandResponse> => {
    return sendCommand({
      imei,
      cmdContent: `RTMP,ON,${camera}`,
      proNo: '128',
    });
  }, [sendCommand]);
  
  const stopStreaming = useCallback(async (
    imei: string,
    camera: 'INOUT' | 'IN' | 'OUT' = 'INOUT'
  ): Promise<CommandResponse> => {
    return sendCommand({
      imei,
      cmdContent: `RTMP,OFF,${camera}`,
      proNo: '128',
    });
  }, [sendCommand]);
  
  const requestFileList = useCallback(async (imei: string): Promise<CommandResponse> => {
    return sendCommand({
      imei,
      cmdContent: 'FILELIST',
      proNo: '128',
    });
  }, [sendCommand]);
  
  const configureUpload = useCallback(async (
    imei: string,
    ip: string,
    port: string
  ): Promise<CommandResponse> => {
    return sendCommand({
      imei,
      cmdContent: `UPLOAD,${ip},${port}`,
      proNo: '128',
    });
  }, [sendCommand]);
  
  return {
    sendCommand,
    sendMediaCaptureCommand,
    startStreaming,
    stopStreaming,
    requestFileList,
    configureUpload,
    sending,
    lastResponse,
    getCommandStatus,
  };
}
