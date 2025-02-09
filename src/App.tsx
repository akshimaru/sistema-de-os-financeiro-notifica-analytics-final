import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clientes } from './pages/Clientes';
import { Marcas } from './pages/Marcas';
import { Instrumentos } from './pages/Instrumentos';
import { Problemas } from './pages/Problemas';
import { Servicos } from './pages/Servicos';
import { NovaOrdem } from './pages/NovaOrdem';
import { Ordens } from './pages/Ordens';
import { Perfil } from './pages/Perfil';
import { Financeiro } from './pages/Financeiro';
import { supabase } from './lib/supabase';
import { Header } from './components/Header';
import { toast } from './components/ToastCustom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAuthenticated(false);
        return;
      }
      
      if (!session.access_token || !session.user?.aud) {
        await supabase.auth.signOut();
        setAuthenticated(false);
        return;
      }

      setAuthenticated(!!session);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      if (!error.message?.includes('Failed to fetch')) {
        toast.error('Erro ao verificar autenticação');
      }
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-200 rounded-xl mb-4"></div>
            <div className="h-4 w-24 bg-purple-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <Header />
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/clientes"
          element={
            <ProtectedRoute>
              <Layout>
                <Clientes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/marcas"
          element={
            <ProtectedRoute>
              <Layout>
                <Marcas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/instrumentos"
          element={
            <ProtectedRoute>
              <Layout>
                <Instrumentos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/servicos"
          element={
            <ProtectedRoute>
              <Layout>
                <Servicos />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/problemas"
          element={
            <ProtectedRoute>
              <Layout>
                <Problemas />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordens"
          element={
            <ProtectedRoute>
              <Layout>
                <Ordens />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordens/nova"
          element={
            <ProtectedRoute>
              <Layout>
                <NovaOrdem />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ordens/editar/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <NovaOrdem />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <Layout>
                <Perfil />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/financeiro"
          element={
            <ProtectedRoute>
              <Layout>
                <Financeiro />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;