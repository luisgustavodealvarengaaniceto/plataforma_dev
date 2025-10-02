import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Power, 
  Wifi, 
  WifiOff, 
  Clock, 
  Car,
  Monitor,
  MapPin,
  Hash,
  FileText
} from 'lucide-react';

interface Equipment {
  _id: string;
  imei: string;
  name: string;
  description?: string;
  vehicleModel?: string;
  licensePlate?: string;
  location?: string;
  isActive: boolean;
  status: 'online' | 'offline' | 'unknown';
  lastSeen?: string;
  channels: Array<{
    number: number;
    name: string;
    description?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface EquipmentManagerProps {
  onEquipmentChange?: (equipment: Equipment | null) => void;
}

const EquipmentManager: React.FC<EquipmentManagerProps> = ({ onEquipmentChange }) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    imei: '',
    name: '',
    description: '',
    vehicleModel: '',
    licensePlate: '',
    location: '',
    channels: [
      { number: 1, name: 'Câmera Frontal', description: 'Visão frontal do veículo' },
      { number: 2, name: 'Câmera Traseira', description: 'Visão traseira do veículo' },
      { number: 3, name: 'Câmera Lateral D', description: 'Visão lateral direita' },
      { number: 4, name: 'Câmera Lateral E', description: 'Visão lateral esquerda' }
    ] as Array<{ number: number; name: string; description: string; }>
  });

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/equipments');
      const result = await response.json();
      
      if (result.code === 0) {
        setEquipments(result.data);
        
        // Notificar sobre o equipamento ativo
        const activeEquipment = result.data.find((eq: Equipment) => eq.isActive);
        if (onEquipmentChange) {
          onEquipmentChange(activeEquipment || null);
        }
      } else {
        toast.error('Erro ao carregar equipamentos');
      }
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imei || !formData.name) {
      toast.error('IMEI e nome são obrigatórios');
      return;
    }

    try {
      const url = editingEquipment 
        ? `http://localhost:3002/api/equipments/${editingEquipment._id}`
        : 'http://localhost:3002/api/equipments';
      
      const method = editingEquipment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      
      if (result.code === 0) {
        toast.success(editingEquipment ? 'Equipamento atualizado!' : 'Equipamento cadastrado!');
        setShowForm(false);
        setEditingEquipment(null);
        resetForm();
        fetchEquipments();
      } else {
        toast.error(result.message || 'Erro ao salvar equipamento');
      }
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const handleActivate = async (equipment: Equipment) => {
    try {
      const response = await fetch(`http://localhost:3002/api/equipments/${equipment._id}/activate`, {
        method: 'POST'
      });

      const result = await response.json();
      
      if (result.code === 0) {
        toast.success(`Equipamento "${equipment.name}" ativado!`);
        fetchEquipments();
        
        // Notificar sobre a mudança de equipamento ativo
        if (onEquipmentChange) {
          onEquipmentChange(result.data);
        }
      } else {
        toast.error(result.message || 'Erro ao ativar equipamento');
      }
    } catch (error) {
      console.error('Erro ao ativar equipamento:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const handleDelete = async (equipment: Equipment) => {
    if (!confirm(`Tem certeza que deseja excluir o equipamento "${equipment.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/api/equipments/${equipment._id}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.code === 0) {
        toast.success('Equipamento removido!');
        fetchEquipments();
      } else {
        toast.error(result.message || 'Erro ao remover equipamento');
      }
    } catch (error) {
      console.error('Erro ao remover equipamento:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setFormData({
      imei: equipment.imei,
      name: equipment.name,
      description: equipment.description || '',
      vehicleModel: equipment.vehicleModel || '',
      licensePlate: equipment.licensePlate || '',
      location: equipment.location || '',
      channels: equipment.channels.map(ch => ({
        number: ch.number,
        name: ch.name,
        description: ch.description || ''
      }))
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      imei: '',
      name: '',
      description: '',
      vehicleModel: '',
      licensePlate: '',
      location: '',
      channels: [
        { number: 1, name: 'Câmera Frontal', description: 'Visão frontal do veículo' },
        { number: 2, name: 'Câmera Traseira', description: 'Visão traseira do veículo' },
        { number: 3, name: 'Câmera Lateral D', description: 'Visão lateral direita' },
        { number: 4, name: 'Câmera Lateral E', description: 'Visão lateral esquerda' }
      ]
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      default:
        return 'Desconhecido';
    }
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Nunca';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

  if (loading) {
    return (
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-blue-100/50 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-8 border border-blue-100/50 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Gerenciar Equipamentos</h2>
          <p className="text-slate-600">Cadastre e controle seus equipamentos de telemetria</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="w-4 h-4" />
          Novo Equipamento
        </motion.button>
      </div>

      {/* Lista de Equipamentos */}
      <div className="space-y-4">
        {equipments.length === 0 ? (
          <div className="text-center py-12">
            <Monitor className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">Nenhum equipamento cadastrado</h3>
            <p className="text-slate-500">Clique em "Novo Equipamento" para começar</p>
          </div>
        ) : (
          equipments.map((equipment) => (
            <motion.div
              key={equipment._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-6 rounded-xl border transition-all duration-300 ${
                equipment.isActive
                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 shadow-lg'
                  : 'bg-white/50 border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-slate-800">{equipment.name}</h3>
                    {equipment.isActive && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        ATIVO
                      </span>
                    )}
                    <div className="flex items-center gap-1">
                      {getStatusIcon(equipment.status)}
                      <span className="text-sm text-slate-600">{getStatusText(equipment.status)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-600">IMEI: {equipment.imei}</span>
                    </div>
                    
                    {equipment.vehicleModel && (
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">{equipment.vehicleModel}</span>
                      </div>
                    )}
                    
                    {equipment.licensePlate && (
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">{equipment.licensePlate}</span>
                      </div>
                    )}
                    
                    {equipment.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-600">{equipment.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Último sinal: {formatLastSeen(equipment.lastSeen)}</span>
                    <span>Canais: {equipment.channels.length}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!equipment.isActive && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleActivate(equipment)}
                      className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                      title="Ativar equipamento"
                    >
                      <Power className="w-4 h-4" />
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(equipment)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Editar equipamento"
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(equipment)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    title="Remover equipamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal do Formulário */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowForm(false);
              setEditingEquipment(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-slate-800 mb-6">
                {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      IMEI *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.imei}
                      onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: 864993060259554"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nome do Equipamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: DVR Principal"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Modelo do Veículo
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Mercedes Sprinter"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Placa do Veículo
                    </label>
                    <input
                      type="text"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: ABC-1234"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Frota São Paulo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descrição adicional do equipamento..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingEquipment(null);
                      resetForm();
                    }}
                    className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    {editingEquipment ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EquipmentManager;