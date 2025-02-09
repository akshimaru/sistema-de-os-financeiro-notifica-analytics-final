import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music2, LogOut, Bell, User, Users, PenTool as Tool, Home, Settings, Key, UserPlus, ChevronDown, Bookmark, Wrench, AlertTriangle, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlterarSenhaModal } from './AlterarSenhaModal';
import { NovoUsuarioModal } from './NovoUsuarioModal';
import { ConfiguracoesModal } from './ConfiguracoesModal';
import { NotificacoesModal } from './NotificacoesModal';
import { supabase } from '../lib/supabase';
import { toast } from './ToastCustom';
import type { OrdemServico } from '../types/database';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAlterarSenhaModal, setShowAlterarSenhaModal] = useState(false);
  const [showNovoUsuarioModal, setShowNovoUsuarioModal] = useState(false);
  const [showConfiguracoesModal, setShowConfiguracoesModal] = useState(false);
  const [ordensHoje, setOrdensHoje] = useState<OrdemServico[]>([]);
  const [logoUrl, setLogoUrl] = useState('');
  const [siteTitle, setSiteTitle] = useState('Sistema OS');
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarOrdensHoje();
    carregarConfiguracoes();

    // Set up polling interval
    const interval = setInterval(() => {
      buscarOrdensHoje();
    }, 3000); // Poll every 3 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  // Effect to handle notification count changes
  useEffect(() => {
    if (ordensHoje.length > notificationCount && notificationCount !== 0) {
      toast.info(`${ordensHoje.length - notificationCount} nova(s) ordem(ns) para hoje!`);
    }
    setNotificationCount(ordensHoje.length);
  }, [ordensHoje.length]);

  const carregarConfiguracoes = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // If no settings exist yet, use defaults
      if (error && error.code === 'PGRST116') {
        // Create default settings
        const { error: insertError } = await supabase
          .from('system_settings')
          .insert([{
            user_id: user.id,
            logo_url: '',
            site_title: 'Sistema OS'
          }]);

        if (insertError) throw insertError;
        
        setLogoUrl('');
        setSiteTitle('Sistema OS');
      } else if (error) {
        throw error;
      } else if (data) {
        setLogoUrl(data.logo_url || '');
        setSiteTitle(data.site_title || 'Sistema OS');
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      if (error.message && !error.message.includes('Failed to fetch')) {
        toast.error('Erro ao carregar configurações do sistema');
      }
    }
  }, []);

  async function buscarOrdensHoje() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id || !user?.aud) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('ordens_servico')
        .select(`
          *,
          cliente:clientes(*),
          marca:marcas(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pendente')
        .gte('data_previsao', today.toISOString())
        .lt('data_previsao', tomorrow.toISOString());

      if (error) throw error;
      setOrdensHoje(data || []);
    } catch (error) {
      if (!error.message?.includes('Failed to fetch')) {
        console.error('Erro ao buscar ordens:', error);
      }
    } finally {
      setLoading(false);
    }
  }

  const menuItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/clientes', icon: Users, label: 'Clientes' },
    { path: '/marcas', icon: Bookmark, label: 'Marcas' },
    { path: '/instrumentos', icon: Music2, label: 'Instrumentos' },
    { path: '/servicos', icon: Wrench, label: 'Serviços' },
    { path: '/problemas', icon: AlertTriangle, label: 'Problemas' },
    { path: '/ordens', icon: Tool, label: 'Ordens' },
    { path: '/financeiro', icon: DollarSign, label: 'Financeiro' },
  ];

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
    <header className="sticky top-0 z-[90] bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto">
        {/* Barra Superior */}
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
              ) : (
                <Music2 className="w-6 h-6 text-white" />
              )}
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {siteTitle}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notificações */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-5 h-5" />
                {!loading && ordensHoje.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {ordensHoje.length}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-[91]"
                  >
                    <NotificacoesModal
                      ordens={ordensHoje}
                      onClose={() => setShowNotifications(false)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Perfil */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              >
                <User className="w-5 h-5" />
                <ChevronDown className="w-4 h-4" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-[91]"
                  >
                    <button
                      onClick={() => {
                        setShowProfileMenu(false);
                        navigate('/perfil');
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Perfil</span>
                    </button>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Menu de Navegação */}
        <div className="px-4 sm:px-6 lg:px-8 py-2 flex items-center space-x-1 overflow-x-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-purple-100 text-purple-700' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'}
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Modais */}
      <AlterarSenhaModal
        isOpen={showAlterarSenhaModal}
        onClose={() => setShowAlterarSenhaModal(false)}
      />

      <NovoUsuarioModal
        isOpen={showNovoUsuarioModal}
        onClose={() => setShowNovoUsuarioModal(false)}
      />

      <ConfiguracoesModal
        isOpen={showConfiguracoesModal}
        onClose={() => setShowConfiguracoesModal(false)}
      />
    </header>
  );
}