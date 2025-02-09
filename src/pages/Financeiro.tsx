import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { DollarSign, Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Upload, Download, Filter, ChevronDown } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ToastCustom';
import { alerts } from '../utils/alerts';
import { formatCurrency, capitalize } from '../utils/formatters';
import { Autocomplete } from '../components/Autocomplete';
import { TransacaoModal } from '../components/TransacaoModal';
import { CategoriaFinanceiraModal } from '../components/CategoriaFinanceiraModal';
import { ImportarCSVModal } from '../components/ImportarCSVModal';
import type { TransacaoFinanceira, CategoriaFinanceira } from '../types/database';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export function Financeiro() {
  const [transacoes, setTransacoes] = useState<TransacaoFinanceira[]>([]);
  const [categorias, setCategorias] = useState<CategoriaFinanceira[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalTransacaoAberto, setModalTransacaoAberto] = useState(false);
  const [modalCategoriaAberto, setModalCategoriaAberto] = useState(false);
  const [modalImportarCSVAberto, setModalImportarCSVAberto] = useState(false);
  const [transacaoParaEditar, setTransacaoParaEditar] = useState<TransacaoFinanceira>();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const [paginaTransacoes, setPaginaTransacoes] = useState(0);
  const [totalTransacoes, setTotalTransacoes] = useState(0);
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [vencimentos, setVencimentos] = useState<TransacaoFinanceira[]>([]);
  const [receitasMes, setReceitasMes] = useState(0);
  const [despesasMes, setDespesasMes] = useState(0);
  const [saldoMes, setSaldoMes] = useState(0);
  const [showTransactions, setShowTransactions] = useState(false);
  const itensPorPagina = 10;

  // Função para obter o primeiro e último dia do mês
  const getMonthRange = (date: Date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return { firstDay, lastDay };
  };
  const [dadosGraficos, setDadosGraficos] = useState({
    receitasPorCategoria: {},
    despesasPorCategoria: {},
    fluxoMensal: [],
  });

  useEffect(() => {
    const { firstDay, lastDay } = getMonthRange(currentDate);
    buscarDados(firstDay, lastDay);
    buscarVencimentos();
    carregarDadosGraficos();
  }, [currentDate, pagina, busca, tipoFiltro, categoriaFiltro]);

  async function buscarVencimentos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { firstDay, lastDay } = getMonthRange(currentDate);

      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `)
        .eq('user_id', user.id)
        .eq('tipo', 'despesa')
        .gte('data', firstDay.toISOString())
        .lte('data', lastDay.toISOString());

      if (error) throw error;
      setVencimentos(data || []);
    } catch (error) {
      console.error('Erro ao buscar vencimentos:', error);
      toast.error('Erro ao carregar vencimentos');
    }
  }

  async function buscarDados(firstDay: Date, lastDay: Date) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Buscar categorias
      const { data: categoriasData } = await supabase
        .from('categorias_financeiras')
        .select('*')
        .eq('user_id', user.id)
        .order('nome');

      setCategorias(categoriasData || []);

      // Buscar totais do mês
      const { data: transacoesMes } = await supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', firstDay.toISOString())
        .lte('data', lastDay.toISOString());

      if (transacoesMes) {
        const receitas = transacoesMes
          .filter(t => t.tipo === 'receita')
          .reduce((acc, t) => acc + t.valor, 0);
        const despesas = transacoesMes
          .filter(t => t.tipo === 'despesa')
          .reduce((acc, t) => acc + t.valor, 0);

        setReceitasMes(receitas);
        setDespesasMes(despesas);
        setSaldoMes(receitas - despesas);
      }

      // Buscar transações
      let query = supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      // Aplicar filtros
      if (busca) {
        query = query.ilike('descricao', `%${busca}%`);
      }

      if (tipoFiltro !== 'todos') {
        query = query.eq('tipo', tipoFiltro);
      }

      if (categoriaFiltro) {
        query = query.eq('categoria_id', categoriaFiltro);
      }
      
      query = query
        .gte('data', firstDay.toISOString())
        .lte('data', lastDay.toISOString());

      const { data, count, error } = await query
        .range(pagina * itensPorPagina, (pagina + 1) * itensPorPagina - 1);

      if (error) throw error;

      setTransacoes(data || []);
      setTotalTransacoes(count || 0);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      toast.error('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir(transacao: TransacaoFinanceira) {
    const result = await alerts.confirm({
      title: 'Excluir Transação',
      text: 'Deseja realmente excluir esta transação?',
      icon: 'warning'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .delete()
        .eq('id', transacao.id);

      if (error) throw error;

      toast.success('Transação excluída com sucesso!');
      buscarDados(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0));
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  }

  const totalPaginas = Math.ceil(totalTransacoes / itensPorPagina);

  async function carregarDadosGraficos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar dados dos últimos 6 meses
      const dataFinal = new Date();
      const dataInicial = new Date();
      dataInicial.setMonth(dataInicial.getMonth() - 5);

      const { data: transacoes, error } = await supabase
        .from('transacoes_financeiras')
        .select(`
          *,
          categoria:categorias_financeiras(*)
        `)
        .eq('user_id', user.id)
        .gte('data', dataInicial.toISOString())
        .lte('data', dataFinal.toISOString());

      if (error) throw error;

      // Processar dados para os gráficos
      const receitasPorCategoria = {};
      const despesasPorCategoria = {};
      const fluxoMensal = Array(6).fill(0).map(() => ({ receitas: 0, despesas: 0 }));

      transacoes.forEach(transacao => {
        const valor = Number(transacao.valor);
        const mes = new Date(transacao.data).getMonth();
        const mesIndex = (mes - dataInicial.getMonth() + 12) % 6;
        const categoriaNome = transacao.categoria?.nome || 'Sem categoria';

        if (transacao.tipo === 'receita') {
          receitasPorCategoria[categoriaNome] = (receitasPorCategoria[categoriaNome] || 0) + valor;
          fluxoMensal[mesIndex].receitas += valor;
        } else {
          despesasPorCategoria[categoriaNome] = (despesasPorCategoria[categoriaNome] || 0) + valor;
          fluxoMensal[mesIndex].despesas += valor;
        }
      });

      setDadosGraficos({
        receitasPorCategoria,
        despesasPorCategoria,
        fluxoMensal
      });
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
      toast.error('Erro ao carregar análises');
    }
  }

  // Configuração dos gráficos
  const fluxoMensalConfig = {
    labels: Array(6).fill(0).map((_, i) => {
      const data = new Date();
      data.setMonth(data.getMonth() - (5 - i));
      return data.toLocaleDateString('pt-BR', { month: 'short' });
    }),
    datasets: [
      {
        label: 'Receitas',
        data: dadosGraficos.fluxoMensal.map(m => m.receitas),
        borderColor: '#10B981',
        backgroundColor: '#10B98120',
        fill: true,
      },
      {
        label: 'Despesas',
        data: dadosGraficos.fluxoMensal.map(m => m.despesas),
        borderColor: '#EF4444',
        backgroundColor: '#EF444420',
        fill: true,
      }
    ]
  };

  const receitasConfig = {
    labels: Object.keys(dadosGraficos.receitasPorCategoria),
    datasets: [{
      data: Object.values(dadosGraficos.receitasPorCategoria),
      backgroundColor: [
        '#10B981',
        '#3B82F6',
        '#6366F1',
        '#8B5CF6',
        '#EC4899'
      ]
    }]
  };

  const despesasConfig = {
    labels: Object.keys(dadosGraficos.despesasPorCategoria),
    datasets: [{
      data: Object.values(dadosGraficos.despesasPorCategoria),
      backgroundColor: [
        '#EF4444',
        '#F59E0B',
        '#F43F5E',
        '#8B5CF6',
        '#64748B'
      ]
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Autocomplete
                options={transacoes.map(t => ({ id: t.id, nome: t.descricao }))}
                value={busca}
                onChange={(value) => setBusca(value)}
                placeholder="Buscar transações..."
                className="w-full sm:w-64"
              />
            </div>

            <div className="flex space-x-2">
              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value as any)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-lg shadow-sm"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>

              <Autocomplete
                value={categoriaFiltro}
                onChange={(value) => setCategoriaFiltro(value)}
                options={categorias.map(c => ({ id: c.id, nome: c.nome }))}
                placeholder="Todas as Categorias"
                className="w-48"
              >
              </Autocomplete>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setModalTransacaoAberto(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-purple-200"
              >
                <Plus className="w-5 h-5" />
                <span>Nova Transação</span>
              </button>

              <button
                onClick={() => setModalCategoriaAberto(true)}
                className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2 border border-gray-200 shadow-sm"
              >
                <Filter className="w-5 h-5" />
                <span>Categorias</span>
              </button>

              <button
                onClick={() => setModalImportarCSVAberto(true)}
                className="px-4 py-2 bg-white text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-300 flex items-center space-x-2 border border-gray-200 shadow-sm"
              >
                <Upload className="w-5 h-5" />
                <span>Importar CSV</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Receitas de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(receitasMes)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Despesas de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(despesasMes)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-100"
            >
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Saldo de {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(saldoMes)}
              </p>
            </motion.div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100">
          <button
            onClick={() => setShowTransactions(!showTransactions)}
            className="w-full px-6 py-4 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <span>Lista de Transações</span>
            <ChevronDown className={`w-5 h-5 transition-transform ${showTransactions ? 'rotate-180' : ''}`} />
          </button>

          <motion.div
            initial={false}
            animate={{ height: showTransactions ? 'auto' : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Descrição
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Carregando...
                      </td>
                    </tr>
                  ) : transacoes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Nenhuma transação encontrada
                      </td>
                    </tr>
                  ) : (
                    transacoes.map((transacao) => (
                      <motion.tr
                        key={transacao.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-purple-50/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(transacao.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transacao.descricao}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${transacao.categoria?.cor}20`,
                              color: transacao.categoria?.cor
                            }}
                          >
                            {transacao.categoria?.nome}
                          </span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
                          transacao.tipo === 'receita' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transacao.tipo === 'despesa' && '-'}
                          {formatCurrency(transacao.valor)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => {
                                setTransacaoParaEditar(transacao);
                                setModalTransacaoAberto(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleExcluir(transacao)}
                              className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all duration-200"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-100 flex items-center justify-between border-t border-gray-100">
              <p className="text-sm text-gray-700">
                Mostrando {transacoes.length} de {totalTransacoes} resultados
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagina(p => Math.max(0, p - 1))}
                  disabled={pagina === 0}
                  className="p-2 rounded-lg hover:bg-white/50 disabled:opacity-50 transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Página {pagina + 1} de {totalPaginas}
                </span>
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas - 1, p + 1))}
                  disabled={pagina >= totalPaginas - 1}
                  className="p-2 rounded-lg hover:bg-white/50 disabled:opacity-50 transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Gráficos Analíticos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Fluxo Mensal */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Fluxo de Caixa - Últimos 6 Meses</h3>
            <div className="h-[300px]">
              <Line data={fluxoMensalConfig} options={chartOptions} />
            </div>
          </div>

          {/* Receitas por Categoria */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Receitas por Categoria</h3>
            <div className="h-[300px]">
              <Doughnut data={receitasConfig} options={chartOptions} />
            </div>
          </div>

          {/* Despesas por Categoria */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Despesas por Categoria</h3>
            <div className="h-[300px]">
              <Doughnut data={despesasConfig} options={chartOptions} />
            </div>
          </div>

          {/* Comparativo Mensal */}
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Comparativo Mensal</h3>
            <div className="h-[300px]">
              <Bar 
                data={{
                  labels: ['Receitas', 'Despesas'],
                  datasets: [{
                    data: [receitasMes, despesasMes],
                    backgroundColor: ['#10B981', '#EF4444']
                  }]
                }}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Calendário de Vencimentos */}
        <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Calendário de Vencimentos
          </h3>
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              locale={ptBrLocale}
              datesSet={({ view }) => {
                const newDate = view.currentStart;
                setCurrentDate(newDate);
              }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              height="auto"
              events={vencimentos.map(vencimento => ({
                title: `Pagar: ${vencimento.descricao}`,
                start: vencimento.data,
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                borderColor: '#DC2626',
                textColor: '#ffffff',
                classNames: [
                  'transition-all duration-200 hover:scale-105',
                  'hover:bg-red-600'
                ],
                extendedProps: {
                  categoria: vencimento.categoria?.nome,
                  valor: vencimento.valor,
                  tipo: 'despesa'
                }
              }))}
              eventContent={(eventInfo) => (
                <div className="p-1">
                  <div className="text-xs font-medium line-clamp-1 text-white mb-0.5">
                    {eventInfo.event.title}
                  </div>
                  <div className="text-xs text-white/90 font-medium">
                    {formatCurrency(eventInfo.event.extendedProps.valor)}
                  </div>
                </div>
              )}
              eventDidMount={(info) => {
                const tooltip = document.createElement('div');
                tooltip.className = 'calendar-tooltip';
                tooltip.innerHTML = `
                  <div class="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p class="font-medium text-gray-800">
                      ${info.event.title}
                    </p>
                    <p class="text-sm ${info.event.extendedProps.tipo === 'despesa' ? 'text-red-600 font-medium' : 'text-green-600 font-medium'} mt-1">
                      ${formatCurrency(info.event.extendedProps.valor)}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      ${capitalize(info.event.extendedProps.categoria)}
                    </p>
                    <p class="text-xs text-gray-400 mt-1">
                      ${new Date(info.event.start!).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </p>
                  </div>
                `;
                
                info.el.addEventListener('mouseover', () => {
                  document.body.appendChild(tooltip);
                  const rect = info.el.getBoundingClientRect();
                  tooltip.style.position = 'fixed';
                  tooltip.style.top = `${rect.bottom + 5}px`;
                  tooltip.style.left = `${rect.left}px`;
                  tooltip.style.zIndex = '1000';
                });
                
                info.el.addEventListener('mouseout', () => {
                  if (document.body.contains(tooltip)) {
                    document.body.removeChild(tooltip);
                  }
                });
              }}
            />
          </div>
        </div>
      </div>

      <TransacaoModal
        isOpen={modalTransacaoAberto}
        onClose={() => {
          setModalTransacaoAberto(false);
          setTransacaoParaEditar(undefined);
        }}
        transacaoParaEditar={transacaoParaEditar}
        categorias={categorias}
        onSuccess={buscarDados}
      />

      <CategoriaFinanceiraModal
        isOpen={modalCategoriaAberto}
        onClose={() => setModalCategoriaAberto(false)}
        onSuccess={buscarDados}
      />

      <ImportarCSVModal
        isOpen={modalImportarCSVAberto}
        onClose={() => setModalImportarCSVAberto(false)}
        categorias={categorias}
        onSuccess={buscarDados}
      />
    </div>
  );
}