import { create } from 'zustand';

interface Device {
  imei: string;
  name?: string;
  type?: string;
  status: 'online' | 'offline' | 'unknown';
  lastSeen?: Date;
}

interface Alert {
  id: string;
  imei: string;
  alertType: number;
  alarmTime: Date;
  mediaUrl?: string;
  rfidCardNumber?: string;
  latitude?: number;
  longitude?: number;
  hasMedia?: boolean;
}

interface CommandStatus {
  requestId: string;
  imei: string;
  command: string;
  status: 'sent' | 'received' | 'executed' | 'failed';
  timestamp: Date;
  response?: string;
  error?: string;
}

interface DeviceStore {
  // Estado
  selectedDevice: Device | null;
  devices: Device[];
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  alerts: Alert[];
  commandStatuses: Map<string, CommandStatus>;
  
  // Ações
  setSelectedDevice: (device: Device | null) => void;
  setDevices: (devices: Device[]) => void;
  addDevice: (device: Device) => void;
  updateDevice: (imei: string, updates: Partial<Device>) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  updateCommandStatus: (requestId: string, status: CommandStatus) => void;
  getCommandStatus: (requestId: string) => CommandStatus | undefined;
  clearAlerts: () => void;
}

export const useDeviceStore = create<DeviceStore>((set, get) => ({
  // Estado inicial
  selectedDevice: null,
  devices: [],
  connectionStatus: 'disconnected',
  alerts: [],
  commandStatuses: new Map(),
  
  // Ações
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  
  setDevices: (devices) => set({ devices }),
  
  addDevice: (device) => set((state) => ({
    devices: [...state.devices.filter(d => d.imei !== device.imei), device]
  })),
  
  updateDevice: (imei, updates) => set((state) => ({
    devices: state.devices.map(device =>
      device.imei === imei ? { ...device, ...updates } : device
    ),
    selectedDevice: state.selectedDevice?.imei === imei
      ? { ...state.selectedDevice, ...updates }
      : state.selectedDevice
  })),
  
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts].slice(0, 100) // Manter apenas os últimos 100 alertas
  })),
  
  setAlerts: (alerts) => set({ alerts }),
  
  updateCommandStatus: (requestId, status) => set((state) => {
    const newStatuses = new Map(state.commandStatuses);
    newStatuses.set(requestId, status);
    return { commandStatuses: newStatuses };
  }),
  
  getCommandStatus: (requestId) => {
    return get().commandStatuses.get(requestId);
  },
  
  clearAlerts: () => set({ alerts: [] }),
}));
