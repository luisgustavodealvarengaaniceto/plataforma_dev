'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Plus, Trash2, Play, Pause, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface Rule {
  id: string;
  imei: string;
  name: string;
  condition: {
    type: 'alarm' | 'speed' | 'location';
    value: string;
    operator: 'equals' | 'greater' | 'less' | 'contains';
  };
  actions: {
    type: 'start_stream' | 'take_photo' | 'send_command' | 'tts';
    params: Record<string, unknown>;
  }[];
  enabled: boolean;
}

const conditionTypes = [
  { value: 'alarm', label: 'Alarme Recebido' },
  { value: 'speed', label: 'Velocidade' },
  { value: 'location', label: 'Localização' }
];

const actionTypes = [
  { value: 'start_stream', label: 'Iniciar Streaming' },
  { value: 'take_photo', label: 'Tirar Foto' },
  { value: 'send_command', label: 'Enviar Comando' },
  { value: 'tts', label: 'Texto para Voz' }
];

export default function EventDirector() {
  const [selectedIMEI, setSelectedIMEI] = useState('860112070135860');
  const [rules, setRules] = useState<Rule[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<Rule>>({
    imei: selectedIMEI,
    name: '',
    condition: { type: 'alarm', value: '', operator: 'equals' },
    actions: [],
    enabled: true
  });

  // Mock data - em produção conectar ao webhook /pushalarm
  useEffect(() => {
    const mockRules: Rule[] = [
      {
        id: '1',
        imei: '123456789012345',
        name: 'SOS Automático',
        condition: { type: 'alarm', value: '0x9999', operator: 'equals' },
        actions: [
          { type: 'start_stream', params: { format: 'hls' } },
          { type: 'take_photo', params: {} },
          { type: 'tts', params: { text: 'Alerta de emergência detectado' } }
        ],
        enabled: true
      }
    ];
    setRules(mockRules);
  }, []);

  const addAction = () => {
    setNewRule(prev => ({
      ...prev,
      actions: [...(prev.actions || []), { type: 'start_stream', params: {} }]
    }));
  };

  const removeAction = (index: number) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions?.filter((_, i) => i !== index) || []
    }));
  };

  const updateAction = (index: number, action: any) => {
    setNewRule(prev => ({
      ...prev,
      actions: prev.actions?.map((a, i) => i === index ? action : a) || []
    }));
  };

  const createRule = () => {
    if (!newRule.name || !newRule.condition?.value) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const rule: Rule = {
      id: Date.now().toString(),
      imei: '', // Adicionar IMEI aqui se necessário
      name: newRule.name,
      condition: newRule.condition as Rule['condition'],
      actions: newRule.actions || [],
      enabled: newRule.enabled || true
    };

    setRules(prev => [...prev, rule]);
    setNewRule({
      name: '',
      condition: { type: 'alarm', value: '', operator: 'equals' },
      actions: [],
      enabled: true
    });
    setIsCreating(false);
    toast.success('Regra criada com sucesso!');
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast.success('Regra removida');
  };

  const testRule = (rule: Rule) => {
    // Em produção, simular o gatilho da condição
    toast.info(`Testando regra: ${rule.name}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <Card className="h-full bg-gray-900 border-magenta-500/20">
        <CardHeader className="border-b border-magenta-500/20">
          <CardTitle className="flex items-center gap-2 text-magenta-400">
            <Zap className="w-5 h-5" />
            Diretor de Eventos em Tempo Real
          </CardTitle>
          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-magenta-400" />
              <Label htmlFor="event-imei" className="text-sm text-gray-300">IMEI do Equipamento:</Label>
            </div>
            <Input
              id="event-imei"
              value={selectedIMEI}
              onChange={(e) => setSelectedIMEI(e.target.value)}
              placeholder="Digite o IMEI"
              className="w-64 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 h-full overflow-y-auto">
          <div className="space-y-4">
            {/* Botão para criar nova regra */}
            <Button
              onClick={() => setIsCreating(!isCreating)}
              className="w-full bg-magenta-600 hover:bg-magenta-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {isCreating ? 'Cancelar' : 'Criar Nova Regra'}
            </Button>

            {/* Formulário de criação */}
            {isCreating && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-gray-800 border border-magenta-500/30 rounded-lg p-4"
              >
                <h3 className="text-lg font-medium text-magenta-300 mb-4">Nova Regra IF-THEN</h3>

                <div className="space-y-4">
                  <div>
                    <Label className="text-magenta-300">Nome da Regra</Label>
                    <Input
                      value={newRule.name}
                      onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Ex: Alerta de SOS"
                    />
                  </div>

                  {/* Condição */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <Label className="text-magenta-300 mb-2 block">Condição (IF)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={newRule.condition?.type}
                        onValueChange={(value) => setNewRule(prev => ({
                          ...prev,
                          condition: { ...prev.condition!, type: value as any }
                        }))}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionTypes.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={newRule.condition?.operator}
                        onValueChange={(value) => setNewRule(prev => ({
                          ...prev,
                          condition: { ...prev.condition!, operator: value as any }
                        }))}
                      >
                        <SelectTrigger className="bg-gray-600 border-gray-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Igual</SelectItem>
                          <SelectItem value="greater">Maior</SelectItem>
                          <SelectItem value="less">Menor</SelectItem>
                          <SelectItem value="contains">Contém</SelectItem>
                        </SelectContent>
                      </Select>

                      <Input
                        value={newRule.condition?.value}
                        onChange={(e) => setNewRule(prev => ({
                          ...prev,
                          condition: { ...prev.condition!, value: e.target.value }
                        }))}
                        className="bg-gray-600 border-gray-500"
                        placeholder="Valor"
                      />
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-magenta-300">Ações (THEN)</Label>
                      <Button
                        size="sm"
                        onClick={addAction}
                        className="bg-magenta-600 hover:bg-magenta-700"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {newRule.actions?.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 bg-gray-600 rounded p-2">
                          <Select
                            value={action.type}
                            onValueChange={(value) => updateAction(index, { ...action, type: value })}
                          >
                            <SelectTrigger className="w-40 bg-gray-500 border-gray-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {actionTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="flex-1 text-sm text-gray-300">
                            {action.type === 'start_stream' && 'Iniciar streaming HLS'}
                            {action.type === 'take_photo' && 'Capturar imagem'}
                            {action.type === 'send_command' && 'Enviar comando personalizado'}
                            {action.type === 'tts' && 'Texto para voz'}
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeAction(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={createRule}
                    className="w-full bg-magenta-600 hover:bg-magenta-700"
                  >
                    Criar Regra
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Lista de regras existentes */}
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-magenta-300">Regras Ativas</h3>

              {rules.map((rule) => (
                <motion.div
                  key={rule.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`bg-gray-800 border rounded-lg p-4 ${
                    rule.enabled ? 'border-magenta-500/30' : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        rule.enabled ? 'bg-magenta-500' : 'bg-gray-500'
                      }`}></div>
                      <h4 className="font-medium text-white">{rule.name}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => testRule(rule)}
                        className="text-cyan-400 hover:text-cyan-300"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleRule(rule.id)}
                        className={rule.enabled ? 'text-green-400' : 'text-gray-400'}
                      >
                        {rule.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRule(rule.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-sm text-gray-300 mb-2">
                    <strong>IF:</strong> {rule.condition.type} {rule.condition.operator} {rule.condition.value}
                  </div>

                  <div className="text-sm text-gray-300">
                    <strong>THEN:</strong>
                    <div className="ml-4 mt-1 space-y-1">
                      {rule.actions.map((action, index) => (
                        <div key={index} className="text-cyan-300">
                          • {actionTypes.find(t => t.value === action.type)?.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}

              {rules.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <div>Nenhuma regra criada ainda</div>
                  <div className="text-sm">Crie regras para automatizar ações baseadas em eventos</div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}