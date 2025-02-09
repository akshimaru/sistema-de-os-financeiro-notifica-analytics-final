import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Music2, Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ToastCustom';
import { InstrumentoModal } from '../components/InstrumentoModal';
import type { Instrumento } from '../types/database';

export function Instrumentos() {
  const [instrumentos, setInstrumentos] = useState<Instrumento[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [instrumentoParaEditar, setInstrumentoParaEditar] = useState<Instrumento>();
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(0);
  const [totalInstrumentos, setTotalInstrumentos] = useState(0);
  const itensPorPagina = 10;

  useEffect(() => {
    buscarInstrumentos();
  }, [pagina, busca]);

  async function buscarInstrumentos() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let query = supabase
        .from('instrumentos')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('nome');

      if (busca) {
        query = query.ilike('nome', `%${busca}%`);
      }

      const { data, count, error } = await query
        .range(pagina * itensPorPagina, (pagina + 1) * itensPorPagina - 1);

      if (error) throw error;

      setInstrumentos(data || []);
      setTotalInstrumentos(count || 0);
    } catch (error) {
      console.error('Erro ao buscar instrumentos:', error);
      toast.error('Erro ao carregar instrumentos');
    } finally {
      setLoading(false);
    }
  }

  async function handleExcluir(instrumento: Instrumento) {
    if (!confirm(`Deseja realmente excluir o instrumento ${instrumento.nome}?`)) return;

    try {
      const { error } = await supabase
        .from('instrumentos')
        .delete()
        .eq('id', instrumento.id);

      if (error) throw error;

      toast.success('Instrumento excluído com sucesso!');
      buscarInstrumentos();
    } catch (error) {
      console.error('Erro ao excluir instrumento:', error);
      toast.error('Erro ao excluir instrumento');
    }
  }

  const totalPaginas = Math.ceil(totalInstrumentos / itensPorPagina);

  return (
    <>
      <div className="min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Music2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Instrumentos
              </h1>
            </div>

            <div className="flex space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar instrumentos..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full sm:w-64 bg-white/50 backdrop-blur-lg transition-all duration-200"
                />
              </div>

              <button
                onClick={() => {
                  setInstrumentoParaEditar(undefined);
                  setModalAberto(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center space-x-2 shadow-lg shadow-purple-200"
              >
                <Plus className="w-5 h-5" />
                <span>Novo Instrumento</span>
              </button>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white/50">
                  {loading ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                        Carregando...
                      </td>
                    </tr>
                  ) : instrumentos.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-6 py-4 text-center text-gray-500">
                        Nenhum instrumento encontrado
                      </td>
                    </tr>
                  ) : (
                    instrumentos.map((instrumento) => (
                      <motion.tr
                        key={instrumento.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-purple-50/50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {instrumento.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-3">
                            <button
                              onClick={() => {
                                setInstrumentoParaEditar(instrumento);
                                setModalAberto(true);
                              }}
                              className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all duration-200"
                            >
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleExcluir(instrumento)}
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
                Mostrando {instrumentos.length} de {totalInstrumentos} resultados
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
      </div>

      <InstrumentoModal
        isOpen={modalAberto}
        onClose={() => {
          setModalAberto(false);
          setInstrumentoParaEditar(undefined);
        }}
        instrumentoParaEditar={instrumentoParaEditar}
        onSuccess={buscarInstrumentos}
      />
    </>
  );
}