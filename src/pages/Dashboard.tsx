import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, PenTool as Tool, CheckCircle, DollarSign, Music2, LogOut, Calendar } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ToastCustom';
import { alerts } from '../utils/alerts';
import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';

export function Dashboard() {
  const navigate = useNavigate();
  const [showCalendar, setShowCalendar] = React.useState(true);
  const [loading, setLoading] = useState(true);
  const [showRevenue, setShowRevenue] = useState(false);
  const [revenue, setRevenue] = useState(0);
  const [stats, setStats] = useState({
    totalClientes: 0,
    ordensAbertas: 0,
    ordensConcluidas: 0
  });
  const [ordensAgendadas, setOrdensAgendadas] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRevenue();
    fetchOrdensAgendadas();
  }, []);

  async function fetchOrdensAgendadas() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !user?.aud) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          cliente:clientes(*),
          instrumento:instrumentos(*),
          marca:marcas(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pendente');

      if (error) throw error;

      setOrdensAgendadas(data || []);
    } catch (error) {
      console.error('Erro ao buscar ordens agendadas:', error);
      if (!error.message?.includes('Failed to fetch')) {
        toast.error('Erro ao carregar agenda');
      }
    }
  }

  async function fetchStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !user?.aud) {
        navigate('/login');
        return;
      }

      // Buscar total de clientes
      const { count: clientesCount } = await supabase
        .from('clientes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Buscar ordens abertas
      const { count: ordensAbertasCount } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pendente', 'em_andamento']);

      // Buscar ordens concluídas
      const { count: ordensConcluidasCount } = await supabase
        .from('ordens_servico')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'concluido');

      setStats({
        totalClientes: clientesCount || 0,
        ordensAbertas: ordensAbertasCount || 0,
        ordensConcluidas: ordensConcluidasCount || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      if (!error.message?.includes('Failed to fetch')) {
        toast.error('Erro ao carregar estatísticas');
      }
    }
  }

  async function fetchRevenue() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !user?.aud) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('ordens_servico')
        .select('valor_servicos, desconto')
        .eq('status', 'concluido')
        .eq('user_id', user.id);

      const total = data?.reduce((acc, order) => 
        acc + (Number(order.valor_servicos) - Number(order.desconto)), 0) || 0;
      setRevenue(total);
    } catch (error) {
      console.error('Erro ao buscar faturamento:', error);
      if (!error.message?.includes('Failed to fetch')) {
        toast.error('Erro ao carregar faturamento');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate('/login');
      toast.success('Até logo!');
    } catch (error) {
      toast.error('Erro ao sair.');
    }
  }

  return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Clientes</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : stats.totalClientes}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ordens Abertas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : stats.ordensAbertas}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Tool className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-gray-800">
                  {loading ? '...' : stats.ordensConcluidas}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento</p>
                <p className="text-2xl font-bold text-gray-800">
                  {showRevenue 
                    ? formatCurrency(revenue)
                    : 'R$ ****'}
                </p>
              </div>
              <button
                onClick={() => setShowRevenue(!showRevenue)}
                className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center hover:bg-yellow-200 transition-colors"
              >
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {showRevenue ? 'Clique para ocultar' : 'Clique para visualizar'}
            </p>
          </motion.div>
        </div>

        {/* Calendário */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h2 className="text-lg font-bold text-gray-800">Agenda</h2>
              </div>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                {showCalendar ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showCalendar && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="calendar-container"
              >
                <FullCalendar
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale={ptBrLocale}
                  height="auto"
                  headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                  }}
                  selectable={true}
                  editable={false}
                  selectMirror={true}
                  dayMaxEvents={true}
                  weekends={true}
                  nowIndicator={true}
                  eventDisplay="block"
                  eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  }}
                  eventClick={(info) => {
                    const ordem = ordensAgendadas.find(o => o.id === info.event.id);
                    if (ordem) {
                      alerts.orderDetails(ordem);
                    }
                  }}
                  select={({ start, end }) => {
                    alerts.confirm({
                      title: 'Nova Ordem',
                      text: `Deseja criar uma nova ordem para ${start.toLocaleDateString('pt-BR')}?`,
                      icon: 'question'
                    }).then((result) => {
                      if (result.isConfirmed) {
                        navigate('/ordens/nova');
                      }
                    });
                  }}
                  events={ordensAgendadas.map(ordem => ({
                    id: ordem.id,
                    title: `OS #${ordem.numero} - ${ordem.cliente?.nome || 'Sem cliente'}`,
                    start: ordem.data_previsao,
                    classNames: ['ordem-servico-event'],
                    extendedProps: {
                      cliente: ordem.cliente?.nome,
                      problemas: ordem.problemas_descricoes ? Object.values(ordem.problemas_descricoes).join(', ') : '',
                      servicos: ordem.servicos_descricoes ? Object.values(ordem.servicos_descricoes).join(', ') : '',
                      observacoes: ordem.observacoes,
                      instrumento: ordem.instrumento?.nome,
                      marca: ordem.marca?.nome,
                      modelo: ordem.modelo,
                      acessorios: ordem.acessorios
                    },
                    backgroundColor: '#8B5CF6',
                    borderColor: '#7C3AED'
                  }))}
                  eventContent={(eventInfo) => (
                    <div className="p-2 hover:bg-purple-700 transition-colors rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-white">
                          OS #{eventInfo.event.title.split(' - ')[0].replace('OS #', '')}
                        </p>
                        {new Date(eventInfo.event.start!).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <p className="text-xs text-white/90 line-clamp-1">
                        {eventInfo.event.title.split(' - ')[1]}
                      </p>
                    </div>
                  )}
                  eventDidMount={(info) => {
                    const tooltip = document.createElement('div');
                    tooltip.className = 'calendar-tooltip';
                    tooltip.innerHTML = `
                      <div class="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-md space-y-4">
                        <div>
                          <p class="font-semibold text-gray-800 mb-2">Informações do Cliente</p>
                          <p class="text-gray-700 mb-1"><strong>Nome:</strong> ${info.event.extendedProps.cliente || 'N/A'}</p>
                        </div>

                        <div>
                          <p class="text-gray-700 mb-1"><strong>Instrumento:</strong> ${info.event.extendedProps.instrumento || 'N/A'}</p>
                          <p class="text-gray-700 mb-1"><strong>Marca:</strong> ${info.event.extendedProps.marca || 'N/A'}</p>
                          <p class="text-gray-700 mb-1"><strong>Modelo:</strong> ${info.event.extendedProps.modelo || 'N/A'}</p>
                          <p class="text-gray-700 mb-1"><strong>Acessórios:</strong> ${info.event.extendedProps.acessorios || 'N/A'}</p>
                        </div>
                        </div>
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
                  moreLinkContent={(args) => (
                    <div className="text-xs text-purple-600">
                      +{args.num} ordens
                    </div>
                  )}
                  slotMinTime="08:00:00"
                  slotMaxTime="18:00:00"
                  businessHours={{
                    daysOfWeek: [1, 2, 3, 4, 5, 6],
                    startTime: '08:00',
                    endTime: '18:00'
                  }}
                  selectConstraint="businessHours"
                  eventConstraint="businessHours"
                  selectOverlap={false}
                  slotEventOverlap={false}
                  views={{
                    dayGrid: {
                      dayMaxEvents: 4
                    },
                    timeGrid: {
                      dayMaxEvents: true,
                      slotDuration: '01:00:00',
                      slotLabelFormat: {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      }
                    }
                  }}
                  loading={(isLoading) => {
                    if (isLoading) {
                      toast.info('Carregando agenda...');
                    }
                  }}
                />
              </motion.div>
            )}
          </div>
        </motion.div>
      </main>
  );
}