import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from './ToastCustom';
import type { CategoriaFinanceira } from '../types/database';

interface ImportarCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  categorias: CategoriaFinanceira[];
  onSuccess: () => void;
}

interface TransacaoCSV {
  data: string;
  descricao: string;
  valor: string;
  tipo: 'receita' | 'despesa';
  categoria?: string;
}

export function ImportarCSVModal({
  isOpen,
  onClose,
  categorias,
  onSuccess
}: ImportarCSVModalProps) {
  const [loading, setLoading] = useState(false);
  const [transacoes, setTransacoes] = useState<TransacaoCSV[]>([]);
  const [categoriasMap, setCategoriasMap] = useState<Record<string, string>>({});

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const csv = event.target?.result as string;
      const lines = csv.split('\n');
      const header = lines[0].split(',');

      const transacoesImportadas: TransacaoCSV[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = line.split(',');
        const transacao: TransacaoCSV = {
          data: values[0],
          descricao: values[1],
          valor: values[2],
          tipo: values[3] as 'receita' | 'despesa',
          categoria: values[4]
        };

        // Tentar identificar a categoria automaticamente
        if (transacao.categoria) {
          const categoriaEncontrada = categorias.find(c => 
            c.nome.toLowerCase().includes(transacao.categoria!.toLowerCase()) ||
            transacao.categoria!.toLowerCase().includes(c.nome.toLowerCase())
          );

          if (categoriaEncontrada) {
            setCategoriasMap(prev => ({
              ...prev,
              [i]: categoriaEncontrada.id
            }));
          }
        }

        transacoesImportadas.push(transacao);
      }

      setTransacoes(transacoesImportadas);
    };

    reader.readAsText(file);
  }

  async function handleImportar() {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const transacoesParaImportar = transacoes.map((transacao, index) => ({
        descricao: transacao.descricao,
        valor: parseFloat(transacao.valor.replace('R$', '').trim()),
        tipo: transacao.tipo,
        data: new Date(transacao.data).toISOString(),
        categoria_id: categoriasMap[index],
        user_id: user.id
      }));

      const { error } = await supabase
        .from('transacoes_financeiras')
        .insert(transacoesParaImportar);

      if (error) throw error;

      toast.success('Transações importadas com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao importar transações:', error);
      toast.error('Erro ao importar transações');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-4xl relative overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                  Importar Transações
                </h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Área de Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="flex flex-col items-center">
                    <Upload className="w-12 h-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 text-center mb-4">
                      Arraste e solte seu arquivo CSV aqui ou clique para selecionar
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="csv-upload"
                    />
                    <label
                      htmlFor="csv-upload"
                      className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
                    >
                      Selecionar Arquivo
                    </label>
                  </div>
                </div>

                {/* Formato Esperado */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800 mb-1">
                        Formato Esperado do CSV
                      </h3>
                      <p className="text-sm text-blue-600">
                        data,descricao,valor,tipo,categoria
                      </p>
                      <p className="text-sm text-blue-600">
                        Exemplo: 2024-02-08,Compra de cordas,150.00,despesa,Materiais
                      </p>
                    </div>
                  </div>
                </div>

                {/* Transações Importadas */}
                {transacoes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Transações Encontradas
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                              Data
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                              Descrição
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                              Valor
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                              Tipo
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">
                              Categoria
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transacoes.map((transacao, index) => (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {new Date(transacao.data).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {transacao.descricao}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {transacao.valor}
                              </td>
                              <td className="px-4 py-2">
                                <span
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    transacao.tipo === 'receita'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {transacao.tipo}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <select
                                  value={categoriasMap[index] || ''}
                                  onChange={(e) => setCategoriasMap(prev => ({
                                    ...prev,
                                    [index]: e.target.value
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                  required
                                >
                                  <option value="">Selecione...</option>
                                  {categorias
                                    .filter(c => c.tipo === transacao.tipo)
                                    .map((categoria) => (
                                      <option key={categoria.id} value={categoria.id}>
                                        {categoria.nome}
                                      </option>
                                    ))
                                  }
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-800 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleImportar}
                        disabled={loading || Object.keys(categoriasMap).length !== transacoes.length}
                        className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                      >
                        {loading ? (
                          'Importando...'
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            <span>Importar Transações</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}