import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from './ToastCustom';
import { formatCurrency, generateWhatsAppMessage } from '../utils/formatters';
import type { OrdemServico, Cliente, Instrumento, Marca, Problema, Servico } from '../types/database';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

interface OrdemServicoModalProps {
  isOpen: boolean;
  onClose: () => void;
  ordemParaEditar?: OrdemServico;
  onSuccess: () => void;
}

export function OrdemServicoModal({ isOpen, onClose, ordemParaEditar, onSuccess }: OrdemServicoModalProps) {
  // Estados para dados relacionados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [ordensExistentes, setOrdensExistentes] = useState<OrdemServico[]>([]);

  // Estados do formulário
  const [clienteId, setClienteId] = useState('');
  const [instrumentoId, setInstrumentoId] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [modelo, setModelo] = useState('');
  const [acessorios, setAcessorios] = useState('');
  const [problemaId, setProblemaId] = useState('');
  const [problemaDescricao, setProblemaDescricao] = useState('');
  const [servicoId, setServicoId] = useState('');
  const [servicoDescricao, setServicoDescricao] = useState('');
  const [valorServicos, setValorServicos] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState<'credito' | 'debito' | 'pix'>('pix');
  const [observacoes, setObservacoes] = useState('');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  // Ajusta o layout para scroll vertical
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Carregar dados relacionados
  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen]);

  // Carregar ordem para edição
  useEffect(() => {
    if (ordemParaEditar) {
      setClienteId(ordemParaEditar.cliente_id);
      setInstrumentoId(ordemParaEditar.instrumento_id);
      setMarcaId(ordemParaEditar.marca_id);
      setModelo(ordemParaEditar.modelo || '');
      setAcessorios(ordemParaEditar.acessorios || '');
      setProblemaId(ordemParaEditar.problema_id);
      setProblemaDescricao(ordemParaEditar.problema_descricao);
      setServicoId(ordemParaEditar.servico_id);
      setServicoDescricao(ordemParaEditar.servico_descricao);
      setValorServicos(ordemParaEditar.valor_servicos);
      setDesconto(ordemParaEditar.desconto);
      setFormaPagamento(ordemParaEditar.forma_pagamento);
      setObservacoes(ordemParaEditar.observacoes);
      setDataPrevisao(ordemParaEditar.data_previsao);
    }
  }, [ordemParaEditar]);

  async function carregarDados() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Carregar clientes
      const { data: clientesData } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', user.id);
      setClientes(clientesData || []);

      // Carregar instrumentos
      const { data: instrumentosData } = await supabase
        .from('instrumentos')
        .select('*')
        .eq('user_id', user.id);
      setInstrumentos(instrumentosData || []);

      // Carregar marcas
      const { data: marcasData } = await supabase
        .from('marcas')
        .select('*')
        .eq('user_id', user.id);
      setMarcas(marcasData || []);

      // Carregar problemas
      const { data: problemasData } = await supabase
        .from('problemas')
        .select('*')
        .eq('user_id', user.id);
      setProblemas(problemasData || []);

      // Carregar serviços
      const { data: servicosData } = await supabase
        .from('servicos')
        .select('*')
        .eq('user_id', user.id);
      setServicos(servicosData || []);

      // Carregar ordens existentes
      const { data: ordensData } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('user_id', user.id);
      setOrdensExistentes(ordensData || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados necessários');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const ordemData = {
        cliente_id: clienteId,
        instrumento_id: instrumentoId,
        marca_id: marcaId,
        modelo,
        acessorios,
        problema_id: problemaId,
        problema_descricao: problemaDescricao,
        servico_id: servicoId,
        servico_descricao: servicoDescricao,
        valor_servicos: valorServicos,
        desconto,
        forma_pagamento: formaPagamento,
        observacoes,
        data_previsao: dataPrevisao,
        user_id: user.id,
      };

      if (ordemParaEditar) {
        const { error } = await supabase
          .from('ordens_servico')
          .update(ordemData)
          .eq('id', ordemParaEditar.id)
          .eq('user_id', user.id);

        if (error) throw error;
        toast.success('Ordem de serviço atualizada com sucesso! 🛠️');
      } else {
        const { error } = await supabase
          .from('ordens_servico')
          .insert([ordemData]);

        if (error) throw error;
        toast.success('Ordem de serviço criada com sucesso! 🛠️');
      }

      onSuccess();
      onClose();
      limparFormulario();
    } catch (error) {
      console.error('Erro ao salvar ordem de serviço:', error);
      toast.error('Erro ao salvar ordem de serviço');
    } finally {
      setLoading(false);
    }
  }

  function limparFormulario() {
    setClienteId('');
    setInstrumentoId('');
    setMarcaId('');
    setModelo('');
    setAcessorios('');
    setProblemaId('');
    setProblemaDescricao('');
    setServicoId('');
    setServicoDescricao('');
    setValorServicos(0);
    setDesconto(0);
    setFormaPagamento('pix');
    setObservacoes('');
    setDataPrevisao('');
  }

  function handleWhatsAppShare() {
    const ordem = {
      ...ordemParaEditar,
      cliente: clientes.find(c => c.id === clienteId),
      marca: marcas.find(m => m.id === marcaId),
      modelo,
    };
    
    const message = generateWhatsAppMessage(ordem);
    const cliente = ordem.cliente;
    if (cliente) {
      openWhatsApp(cliente.telefone, message);
    } else {
      window.open(`https://wa.me/?text=${message}`, '_blank');
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl relative overflow-hidden my-8"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  {ordemParaEditar ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cliente
                    </label>
                    <select
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Instrumento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Instrumento
                    </label>
                    <select
                      value={instrumentoId}
                      onChange={(e) => setInstrumentoId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Selecione um instrumento</option>
                      {instrumentos.map((instrumento) => (
                        <option key={instrumento.id} value={instrumento.id}>
                          {instrumento.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Marca */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Marca
                    </label>
                    <select
                      value={marcaId}
                      onChange={(e) => setMarcaId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Selecione uma marca</option>
                      {marcas.map((marca) => (
                        <option key={marca.id} value={marca.id}>
                          {marca.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Modelo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo
                    </label>
                    <input
                      type="text"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ex: Stratocaster"
                      required
                    />
                  </div>

                  {/* Acessórios */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acessórios
                    </label>
                    <input
                      type="text"
                      value={acessorios}
                      onChange={(e) => setAcessorios(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ex: Capa, cabo, palhetas"
                    />
                  </div>

                  {/* Problema */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Problema
                    </label>
                    <div className="space-y-2">
                      <select
                        value={problemaId}
                        onChange={(e) => {
                          setProblemaId(e.target.value);
                          const problema = problemas.find(p => p.id === e.target.value);
                          if (problema) setProblemaDescricao(problema.descricao || '');
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Selecione um problema</option>
                        {problemas.map((problema) => (
                          <option key={problema.id} value={problema.id}>
                            {problema.nome}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={problemaDescricao}
                        onChange={(e) => setProblemaDescricao(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Descreva o problema detalhadamente"
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  {/* Serviço */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Serviço
                    </label>
                    <div className="space-y-2">
                      <select
                        value={servicoId}
                        onChange={(e) => {
                          setServicoId(e.target.value);
                          const servico = servicos.find(s => s.id === e.target.value);
                          if (servico) {
                            setServicoDescricao(servico.descricao || '');
                            setValorServicos(servico.valor);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Selecione um serviço</option>
                        {servicos.map((servico) => (
                          <option key={servico.id} value={servico.id}>
                            {servico.nome} - {formatCurrency(servico.valor)}
                          </option>
                        ))}
                      </select>
                      <textarea
                        value={servicoDescricao}
                        onChange={(e) => setServicoDescricao(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Descreva o serviço detalhadamente"
                        rows={3}
                        required
                      />
                    </div>
                  </div>

                  {/* Valores */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor dos Serviços
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          R$
                        </span>
                        <input
                          type="number"
                          value={valorServicos}
                          onChange={(e) => setValorServicos(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Desconto
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                          R$
                        </span>
                        <input
                          type="number"
                          value={desconto}
                          onChange={(e) => setDesconto(Number(e.target.value))}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Total
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 font-medium">
                        {formatCurrency(valorServicos - desconto)}
                      </div>
                    </div>
                  </div>

                  {/* Forma de Pagamento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Forma de Pagamento
                    </label>
                    <select
                      value={formaPagamento}
                      onChange={(e) => setFormaPagamento(e.target.value as 'credito' | 'debito' | 'pix')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="pix">PIX</option>
                      <option value="credito">Cartão de Crédito</option>
                      <option value="debito">Cartão de Débito</option>
                    </select>
                  </div>
                </div>

                {/* Data de Previsão */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Previsão
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={dataPrevisao}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Clique no calendário para selecionar"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCalendar(!showCalendar)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <Calendar className="w-5 h-5" />
                    </button>
                  </div>

                  {showCalendar && (
                    <div className="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 w-full max-w-2xl">
                      <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale={ptBrLocale}
                        headerToolbar={{
                          left: 'prev,next today',
                          center: 'title',
                          right: 'dayGridMonth,timeGridWeek,timeGridDay'
                        }}
                        selectable={true}
                        select={(info) => {
                          const date = new Date(info.start);
                          date.setHours(10, 0, 0); // Define horário padrão para 10:00
                          setDataPrevisao(date.toISOString());
                          setShowCalendar(false);
                        }}
                        events={ordensExistentes.map(ordem => ({
                          title: `OS #${ordem.numero}`,
                          start: ordem.data_previsao,
                          backgroundColor: '#8B5CF6',
                          borderColor: '#7C3AED'
                        }))}
                      />
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Observações
                  </label>
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={4}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  {ordemParaEditar && (
                    <button
                      type="button"
                      onClick={handleWhatsAppShare}
                      className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar WhatsApp</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Salvando...' : ordemParaEditar ? 'Atualizar' : 'Cadastrar'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}