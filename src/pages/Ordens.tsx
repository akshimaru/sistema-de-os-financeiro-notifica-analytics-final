import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PenTool as Tool, Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Send, Edit, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ToastCustom';
import { alerts } from '../utils/alerts';
import { formatCurrency, formatDate, openWhatsApp, generateWhatsAppMessage } from '../utils/formatters';
import { PrintOrdemModal } from '../components/PrintOrdemModal';
import type { OrdemServico } from '../types/database';

export function Ordens() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const [totalOrdens, setTotalOrdens] = useState(0);
  const [statusFiltro, setStatusFiltro] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [ordemParaImprimir, setOrdemParaImprimir] = useState<OrdemServico | null>(null);
  const itensPorPagina = 10;

  useEffect(() => {
    buscarOrdens();
  }, [pagina, busca, statusFiltro]);

  async function buscarOrdens() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('ordens_servico')
        .select(`
          *,
          cliente:clientes(*),
          instrumento:instrumentos(*),
          marca:marcas(*)
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (busca) {
        query = query.or(`
          cliente.nome.ilike.%${busca}%,
          modelo.ilike.%${busca}%
        `);
      }

      if (statusFiltro) {
        query = query.eq('status', statusFiltro);
      }

      const { data, count, error } = await query
        .range(pagina * itensPorPagina, (pagina + 1) * itensPorPagina - 1);

      if (error) throw error;

      setOrdens(data || []);
      setTotalOrdens(count || 0);
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
      toast.error('Erro ao carregar ordens de serviço');
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir(ordem: OrdemServico) {
    const result = await alerts.confirm({
      title: 'Excluir Ordem',
      text: `Deseja realmente excluir a ordem de serviço #${ordem.numero}?`,
      icon: 'warning'
    });

    if (!result.isConfirmed) return;

    try {
      const { error } = await supabase
        .from('ordens_servico')
        .delete()
        .eq('id', ordem.id);

      if (error) throw error;

      alerts.success('Ordem de serviço excluída com sucesso!');
      buscarOrdens();
    } catch (error) {
      console.error('Erro ao excluir ordem:', error);
      alerts.error('Erro ao excluir ordem de serviço');
    }
  }

  async function handleChangeStatus(ordem: OrdemServico, newStatus: 'pendente' | 'em_andamento' | 'concluido' | 'cancelado') {
    try {
      // If changing to completed status, send WhatsApp message
      if (newStatus === 'concluido' && ordem.cliente?.telefone) {
        const message = `Ola ${ordem.cliente.nome} seu ${ordem.instrumento?.nome} ficou pronto, Retirar entre 10h as 13h 14h as 18h segunda a sabado.`;
        openWhatsApp(ordem.cliente.telefone, message);
      }

      const { error } = await supabase
        .from('ordens_servico')
        .update({ status: newStatus })
        .eq('id', ordem.id);

      if (error) throw error;

      toast.success('Status atualizado com sucesso!');
      buscarOrdens();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  }

  function handleWhatsAppShare(ordem: OrdemServico) {
    const message = generateWhatsAppMessage(ordem);
    if (ordem.cliente) {
      openWhatsApp(ordem.cliente.telefone, message);
    }
  }

  const totalPaginas = Math.ceil(totalOrdens / itensPorPagina);

  const statusColors = {
    pendente: 'bg-yellow-100 text-yellow-800',
    em_andamento: 'bg-blue-100 text-blue-800',
    concluido: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800'
  };

  const statusLabels = {
    pendente: 'Pendente',
    em_andamento: 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado'
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Tool className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Ordens de Serviço
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar ordens..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-64 bg-white/50 backdrop-blur-lg transition-all duration-200"
                />
              </div>

              <select
                value={statusFiltro}
                onChange={(e) => setStatusFiltro(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-lg"
              >
                <option value="">Todos os Status</option>
                <option value="pendente">Pendente</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            <button
              onClick={() => navigate('/ordens/nova')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-purple-200"
            >
              <Plus className="w-5 h-5" />
              <span>Nova Ordem</span>
            </button>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Número
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                    Instrumento/Marca
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Data Prevista
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white/50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Carregando...
                    </td>
                  </tr>
                ) : ordens.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma ordem de serviço encontrada
                    </td>
                  </tr>
                ) : (
                  ordens.map((ordem) => (
                    <motion.tr
                      key={ordem.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-purple-50/50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{ordem.numero}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ordem.cliente?.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex flex-col">
                        <span>{ordem.instrumento?.nome}</span>
                        {ordem.marca?.nome} {ordem.modelo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ordem.data_previsao)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={ordem.status}
                          onChange={(e) => handleChangeStatus(ordem, e.target.value as any)}
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${statusColors[ordem.status]}`}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="em_andamento">Em Andamento</option>
                          <option value="concluido">Concluído</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-3">
                          <button
                            onClick={() => navigate(`/ordens/editar/${ordem.id}`)}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => {
                              setOrdemParaImprimir(ordem);
                              setShowPrintModal(true);
                            }}
                            className="p-2 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-all duration-200"
                          >
                            <Printer className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleWhatsAppShare(ordem)}
                            className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-all duration-200"
                          >
                            <Send className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleExcluir(ordem)}
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
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-blue-50 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Mostrando {ordens.length} de {totalOrdens} resultados
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
        </div>
      </div>
      
      {ordemParaImprimir && (
        <PrintOrdemModal
          isOpen={showPrintModal}
          onClose={() => {
            setShowPrintModal(false);
            setOrdemParaImprimir(null);
          }}
          ordem={ordemParaImprimir}
        />
      )}
    </div>
  );
}