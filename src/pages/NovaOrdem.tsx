import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Send, ArrowLeft, X, Users, Music2, PenTool as Tool, DollarSign, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { capitalize } from '../utils/formatters';
import { Autocomplete } from '../components/Autocomplete';
import { ClienteModal } from '../components/ClienteModal';
import { InstrumentoModal } from '../components/InstrumentoModal';
import { MarcaModal } from '../components/MarcaModal';
import { ProblemaModal } from '../components/ProblemaModal';
import { ServicoModal } from '../components/ServicoModal';
import { toast } from '../components/ToastCustom';
import { formatCurrency } from '../utils/formatters';
import type { Cliente, Instrumento, Marca, Problema, Servico } from '../types/database';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { MultiSelect } from '../components/MultiSelect';

export function NovaOrdem() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Estados para dados relacionados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [problemas, setProblemas] = useState<Problema[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [ordensExistentes, setOrdensExistentes] = useState<any[]>([]);

  // Estados do formulário
  const [clienteId, setClienteId] = useState('');
  const [instrumentoId, setInstrumentoId] = useState('');
  const [marcaId, setMarcaId] = useState('');
  const [modelo, setModelo] = useState('');
  const [acessorios, setAcessorios] = useState('');
  const [problemasIds, setProblemasIds] = useState<string[]>([]);
  const [problemasDescricoes, setProblemasDescricoes] = useState<Record<string, string>>({});
  const [servicosIds, setServicosIds] = useState<string[]>([]);
  const [servicosDescricoes, setServicosDescricoes] = useState<Record<string, string>>({});
  const [valorServicos, setValorServicos] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState<'credito' | 'debito' | 'pix'>('pix');
  const [observacoes, setObservacoes] = useState('Pagamento Antecipado!');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para modais de cadastro rápido
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [showInstrumentoModal, setShowInstrumentoModal] = useState(false);
  const [showMarcaModal, setShowMarcaModal] = useState(false);
  const [showProblemaModal, setShowProblemaModal] = useState(false);
  const [showServicoModal, setShowServicoModal] = useState(false);

  useEffect(() => {
    carregarDados();
    if (id) {
      carregarOrdem(id);
    }
  }, []);

  async function carregarOrdem(orderId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Ordem não encontrada');

      // Preencher os campos com os dados da ordem
      setClienteId(data.cliente_id);
      setInstrumentoId(data.instrumento_id);
      setMarcaId(data.marca_id);
      setModelo(data.modelo || '');
      setAcessorios(data.acessorios || '');
      setProblemasIds(data.problemas_ids || []);
      setProblemasDescricoes(data.problemas_descricoes || {});
      setServicosIds(data.servicos_ids || []);
      setServicosDescricoes(data.servicos_descricoes || {});
      setValorServicos(data.valor_servicos);
      setDesconto(data.desconto);
      setFormaPagamento(data.forma_pagamento);
      setObservacoes(data.observacoes);
      setDataPrevisao(data.data_previsao);

    } catch (error) {
      console.error('Erro ao carregar ordem:', error);
      toast.error('Erro ao carregar ordem de serviço');
      navigate('/ordens');
    }
  }

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
        .eq('user_id', user.id)
        .eq('status', 'pendente');
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

      // Format problems and services as comma-separated text
      const problemasText = problemasIds
        .map(id => {
          const problema = problemas.find(p => p.id === id);
          return problema ? `${problema.nome}: ${problemasDescricoes[id] || problema.descricao || ''}` : '';
        })
        .filter(Boolean)
        .join(', ');

      const servicosText = servicosIds
        .map(id => {
          const servico = servicos.find(s => s.id === id);
          return servico ? `${servico.nome}: ${servicosDescricoes[id] || servico.descricao || ''}` : '';
        })
        .filter(Boolean)
        .join(', ');

      const formattedObservations = `Problemas:
${problemasText || 'Nenhum problema registrado.'}

Serviços:
${servicosText || 'Nenhum serviço registrado.'}

Horário de retirada entre 10h as 18h.
Obs: Os serviços executados na loja Vibratho instrumentos são de total responsabilidade do Samuel Silva.

ATENÇÃO!
Ao levar um equipamento para consertar, os consumidores devem ficar atentos ao prazo estabelecido para buscar o produto. Lei nº 2.560/2021.

SIGA NOSSO INSTAGRAM: https://www.instagram.com/luthieriabrasilia/`;

      const ordemData = {
        ...(id && { id }), // Inclui o ID apenas se estiver editando
        status: 'pendente' as 'pendente' | 'em_andamento' | 'concluido' | 'cancelado',
        cliente_id: clienteId,
        instrumento_id: instrumentoId,
        marca_id: marcaId,
        modelo,
        acessorios,
        valor_servicos: valorServicos,
        desconto,
        forma_pagamento: formaPagamento,
        observacoes: formattedObservations,
        data_previsao: dataPrevisao,
        user_id: user.id,
      };

      let error;
      if (id) {
        // Atualizar ordem existente
        const { error: updateError } = await supabase
          .from('ordens_servico')
          .update(ordemData)
          .eq('id', id)
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Criar nova ordem
        const { error: insertError } = await supabase
          .from('ordens_servico')
          .insert([ordemData]);
        error = insertError;
      }

      if (error) throw error;
      
      toast.success(`Ordem de serviço ${id ? 'atualizada' : 'criada'} com sucesso! 🛠️`);
      navigate('/ordens');
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
    setObservacoes('');
    setDataPrevisao('');
  }

  function handleServicosChange(ids: string[]) {
    setServicosIds(ids);
    // Calcular valor total dos serviços selecionados
    const total = ids.reduce((acc, id) => {
      const servico = servicos.find(s => s.id === id);
      return acc + (servico?.valor || 0);
    }, 0);
    setValorServicos(total);
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/ordens')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            </h1>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              {id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Preencha os dados abaixo para {id ? 'atualizar a' : 'criar uma nova'} ordem de serviço
            </p>
          </div>

          {/* Form */}
          <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção: Informações do Cliente */}
            <div className="bg-gray-50/50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Informações do Cliente
              </h3>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Autocomplete
                    value={clienteId}
                    onChange={setClienteId}
                    options={clientes.map(c => ({ id: c.id, nome: c.nome }))}
                    placeholder="Selecione um cliente"
                    onCreateNew={() => setShowClienteModal(true)}
                    className="w-full"
                    label="Cliente"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Informações do Instrumento */}
            <div className="bg-gray-50/50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Music2 className="w-4 h-4 mr-2" />
                Informações do Instrumento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Autocomplete
                    value={instrumentoId}
                    onChange={setInstrumentoId}
                    options={instrumentos.map(i => ({ id: i.id, nome: i.nome }))}
                    placeholder="Selecione um instrumento"
                    onCreateNew={() => setShowInstrumentoModal(true)}
                    className="w-full"
                    label="Instrumento"
                  />
                </div>

                <div>
                  <Autocomplete
                    value={marcaId}
                    onChange={setMarcaId}
                    options={marcas.map(m => ({ id: m.id, nome: m.nome }))}
                    placeholder="Selecione uma marca"
                    onCreateNew={() => setShowMarcaModal(true)}
                    className="w-full"
                    label="Marca"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={modelo}
                    onChange={(e) => setModelo(capitalize(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ex: Stratocaster"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Acessórios
                  </label>
                  <input
                    type="text"
                    value={acessorios}
                    onChange={(e) => setAcessorios(capitalize(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ex: Capa, cabo, palhetas"
                  />
                </div>
              </div>
            </div>

            {/* Seção: Problemas e Serviços */}
            <div className="bg-gray-50/50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Tool className="w-4 h-4 mr-2" />
                Problemas e Serviços
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <MultiSelect
                    options={problemas}
                    selectedIds={problemasIds}
                    onChange={setProblemasIds}
                    onDescriptionChange={(id, desc) => setProblemasDescricoes(prev => ({ ...prev, [id]: desc }))}
                    getInitialDescription={(id) => {
                      const problema = problemas.find(p => p.id === id);
                      return problema?.descricao || '';
                    }}
                    onCreateNew={() => setShowProblemaModal(true)}
                    placeholder="Selecione os problemas"
                    label="Problemas"
                    descriptions={problemasDescricoes}
                  />
                </div>

                <div>
                  <MultiSelect
                    options={servicos}
                    selectedIds={servicosIds}
                    onChange={handleServicosChange}
                    onDescriptionChange={(id, desc) => setServicosDescricoes(prev => ({ ...prev, [id]: desc }))}
                    getInitialDescription={(id) => {
                      const servico = servicos.find(s => s.id === id);
                      return servico?.descricao || '';
                    }}
                    onCreateNew={() => setShowServicoModal(true)}
                    placeholder="Selecione os serviços a serem realizados"
                    label="Serviços"
                    descriptions={servicosDescricoes}
                  />
                </div>
              </div>
            </div>

            {/* Seção: Valores e Pagamento */}
            <div className="bg-gray-50/50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Valores e Pagamento
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Valor dos Serviços</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <input
                          type="number"
                          value={valorServicos}
                          onChange={(e) => setValorServicos(Number(e.target.value))}
                          className="w-32 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Desconto</span>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                        <input
                          type="number"
                          value={desconto}
                          onChange={(e) => setDesconto(Number(e.target.value))}
                          className="w-32 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                  
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg font-medium">
                      <span className="text-purple-700">Total</span>
                      <span className="text-purple-700">{formatCurrency(valorServicos - desconto)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('pix')}
                      className={`p-4 rounded-lg border ${
                        formaPagamento === 'pix'
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      } transition-colors text-center`}
                    >
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('credito')}
                      className={`p-4 rounded-lg border ${
                        formaPagamento === 'credito'
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      } transition-colors text-center`}
                    >
                      Crédito
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('debito')}
                      className={`p-4 rounded-lg border ${
                        formaPagamento === 'debito'
                          ? 'bg-purple-50 border-purple-200 text-purple-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      } transition-colors text-center`}
                    >
                      Débito
                    </button>
                  </div>

                  {formaPagamento === 'pix' && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-green-700 text-sm">
                        Pagamento via PIX - CNPJ: 30.057.854/0001-75
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Seção: Data de Previsão */}
            <div className="bg-gray-50/50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Data de Previsão
              </h3>
              
              <div className="relative">
                <input
                  type="text"
                  value={dataPrevisao ? new Date(dataPrevisao).toLocaleDateString('pt-BR') : ''}
                  readOnly
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-gray-50 cursor-pointer"
                  placeholder="Clique para selecionar a data de previsão"
                  onClick={() => setShowCalendar(!showCalendar)}
                  required
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            {/* Seção: Observações */}
            <div className="bg-gray-50/50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Observações
              </h3>
              
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                required
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/ordens')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{loading ? 'Salvando...' : 'Criar Ordem'}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          </div>
        </div>

        {/* Modais de Cadastro Rápido */}
        <ClienteModal
          isOpen={showClienteModal}
          onClose={() => setShowClienteModal(false)}
          onSuccess={() => {
            carregarDados();
            setShowClienteModal(false);
          }}
        />

        <InstrumentoModal
          isOpen={showInstrumentoModal}
          onClose={() => setShowInstrumentoModal(false)}
          onSuccess={() => {
            carregarDados();
            setShowInstrumentoModal(false);
          }}
        />

        <MarcaModal
          isOpen={showMarcaModal}
          onClose={() => setShowMarcaModal(false)}
          onSuccess={() => {
            carregarDados();
            setShowMarcaModal(false);
          }}
        />

        <ProblemaModal
          isOpen={showProblemaModal}
          onClose={() => setShowProblemaModal(false)}
          onSuccess={() => {
            carregarDados();
            setShowProblemaModal(false);
          }}
        />

        <ServicoModal
          isOpen={showServicoModal}
          onClose={() => setShowServicoModal(false)}
          onSuccess={() => {
            carregarDados();
            setShowServicoModal(false);
          }}
        />

        {/* Modal do Calendário */}
        {showCalendar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Selecione a Data de Previsão</h3>
                <button
                  type="button"
                  onClick={() => setShowCalendar(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={ptBrLocale}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek'
                }}
                height={500}
                selectable={true}
                select={(info) => {
                  const date = new Date(info.start);
                  date.setHours(10, 0, 0);
                  setDataPrevisao(date.toISOString());
                  setShowCalendar(false);
                }}
                events={ordensExistentes.map(ordem => ({
                  title: `OS #${ordem.numero}`,
                  start: ordem.data_previsao,
                  description: ordem.problema_descricao,
                  backgroundColor: '#8B5CF6',
                  borderColor: '#7C3AED'
                }))}
                eventContent={(eventInfo) => (
                  <div className="p-1">
                    <div className="text-xs font-medium text-white line-clamp-1">
                      {eventInfo.event.title}
                    </div>
                    {eventInfo.event.extendedProps.description && (
                      <div className="text-xs text-white/80 line-clamp-1">
                        {eventInfo.event.extendedProps.description}
                      </div>
                    )}
                  </div>
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}