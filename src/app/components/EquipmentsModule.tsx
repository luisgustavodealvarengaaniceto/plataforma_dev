'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Power, 
  PowerOff, 
  Truck, 
  MapPin, 
  Calendar,
  Activity,
  Wifi,
  WifiOff,
  AlertCircle,
  CheckCircle,
  Eye,
  Save,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Equipment {
  id: number;
  imei: string;
  name: string;
  description?: string;
  vehicleModel?: string;
  licensePlate?: string;
  location?: string;
  status: 'online' | 'offline' | 'unknown';
  isActive: boolean;
  lastSeen?: string;
  channels: Array<{
    number: number;
    name: string;
    description: string;
  }>;
  createdAt: string;
}

interface EquipmentsModuleProps {
  onEquipmentActivated?: (equipment: Equipment) => void;
}

export default function EquipmentsModule({ onEquipmentActivated }: EquipmentsModuleProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState({
    imei: '',
    name: '',
    description: '',
    vehicleModel: '',
    licensePlate: '',
    location: ''
  });

  // Carregar equipamentos
  const fetchEquipments = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/equipments');
      if (response.ok) {
        const result = await response.json();
        setEquipments(result.data || []);
      } else {
        throw new Error('Erro ao carregar equipamentos');
      }
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      toast.error('Erro ao carregar equipamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
    // Atualizar lista a cada 30 segundos
    const interval = setInterval(fetchEquipments, 30000);
    return () => clearInterval(interval);
  }, []);

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      imei: '',
      name: '',
      description: '',
      vehicleModel: '',
      licensePlate: '',
      location: ''
    });
    setShowAddForm(false);
    setEditingEquipment(null);
  };

  // Salvar equipamento (criar ou editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imei || !formData.name) {
      toast.error('IMEI e nome são obrigatórios');
      return;
    }

    try {
      const url = editingEquipment 
        ? `http://localhost:3002/api/equipments/${editingEquipment.id}`
        : 'http://localhost:3002/api/equipments';
      
      const method = editingEquipment ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(editingEquipment ? 'Equipamento atualizado' : 'Equipamento cadastrado');
        resetForm();
        fetchEquipments();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Erro ao salvar equipamento');
      }
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      toast.error('Erro ao salvar equipamento');
    }
  };

  // Ativar equipamento
  const handleActivate = async (equipment: Equipment) => {
    try {
      const response = await fetch(`http://localhost:3002/api/equipments/${equipment.id}/activate`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${equipment.name} ativado com sucesso`);
        fetchEquipments();
        onEquipmentActivated?.(result.data);
      } else {
        throw new Error('Erro ao ativar equipamento');
      }
    } catch (error) {
      console.error('Erro ao ativar equipamento:', error);
      toast.error('Erro ao ativar equipamento');
    }
  };

  // Deletar equipamento
  const handleDelete = async (equipment: Equipment) => {
    if (!confirm(`Tem certeza que deseja remover o equipamento "${equipment.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3002/api/equipments/${equipment.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Equipamento removido');
        fetchEquipments();
      } else {
        throw new Error('Erro ao remover equipamento');
      }
    } catch (error) {
      console.error('Erro ao remover equipamento:', error);
      toast.error('Erro ao remover equipamento');
    }
  };

  // Iniciar edição
  const startEdit = (equipment: Equipment) => {
    setFormData({
      imei: equipment.imei,
      name: equipment.name,
      description: equipment.description || '',
      vehicleModel: equipment.vehicleModel || '',
      licensePlate: equipment.licensePlate || '',
      location: equipment.location || ''
    });
    setEditingEquipment(equipment);
    setShowAddForm(true);
  };

  // Obter ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Wifi className="w-5 h-5 text-gray-400" />;
    }
  };

  // Obter cor de status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Equipamentos</h2>
          <p className="text-gray-400 mt-1">
            Gerencie os equipamentos de monitoramento
          </p>
        </div>
        <motion.button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4" />
          Adicionar Equipamento
        </motion.button>
      </div>

      {/* Lista de equipamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence>
          {equipments.map((equipment, index) => (
            <motion.div
              key={equipment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-6 space-y-4 relative overflow-hidden ${
                equipment.isActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700'
              }`}
            >
              {/* Badge de ativo */}
              {equipment.isActive && (
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  ATIVO
                </div>
              )}

              {/* Status e info básica */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(equipment.status)}`}></div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{equipment.name}</h3>
                    <p className="text-sm text-gray-400">IMEI: {equipment.imei}</p>
                  </div>
                </div>
                {getStatusIcon(equipment.status)}
              </div>

              {/* Informações do veículo */}
              {(equipment.vehicleModel || equipment.licensePlate) && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Truck className="w-4 h-4" />
                  <span>
                    {equipment.vehicleModel}
                    {equipment.licensePlate && ` • ${equipment.licensePlate}`}
                  </span>
                </div>
              )}

              {/* Localização */}
              {equipment.location && (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <MapPin className="w-4 h-4" />
                  <span>{equipment.location}</span>
                </div>
              )}

              {/* Último heartbeat */}
              {equipment.lastSeen && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Activity className="w-4 h-4" />
                  <span>
                    Última atividade: {new Date(equipment.lastSeen).toLocaleString('pt-BR')}
                  </span>
                </div>
              )}

              {/* Descrição */}
              {equipment.description && (
                <p className="text-sm text-gray-400 italic">{equipment.description}</p>
              )}

              {/* Canais */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Canais configurados:</p>
                <div className="grid grid-cols-2 gap-1">
                  {equipment.channels?.slice(0, 4).map((channel) => (
                    <div key={channel.number} className="text-xs text-gray-400 bg-gray-700/50 px-2 py-1 rounded">
                      {channel.number}: {channel.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => startEdit(equipment)}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(equipment)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>

                {!equipment.isActive && (
                  <motion.button
                    onClick={() => handleActivate(equipment)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Power className="w-3 h-3" />
                    Ativar
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Formulário de cadastro/edição */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 w-full max-w-md space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">
                  {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    IMEI *
                  </label>
                  <input
                    type="text"
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="000000000000000"
                    disabled={!!editingEquipment}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Ônibus Linha 001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Modelo do Veículo
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Mercedes Benz O500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Placa
                  </label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="ABC-1234"
                    maxLength={8}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Localização
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="Ex: Terminal Rodoviário"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Informações adicionais..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <motion.button
                    type="submit"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Save className="w-4 h-4" />
                    {editingEquipment ? 'Atualizar' : 'Salvar'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={resetForm}
                    className="px-6 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-lg transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancelar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estado vazio */}
      {!loading && equipments.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Truck className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-300 mb-2">
            Nenhum equipamento cadastrado
          </h3>
          <p className="text-gray-500 mb-6">
            Adicione seu primeiro equipamento para começar o monitoramento
          </p>
          <motion.button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Adicionar Primeiro Equipamento
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}