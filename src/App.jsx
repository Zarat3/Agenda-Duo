import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppDataProvider, useAppData } from './context/AppDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { Agendamento } from './pages/Agendamento';
import { Login } from './pages/Login';
import { Admin } from './pages/Admin';
import { Prontuario } from './pages/Prontuario';
import { NovoPaciente } from './pages/NovoPaciente';
import { Confirmar } from './pages/Confirmar';
import { Perfil } from './pages/Perfil';
import { Cadastro } from './pages/Cadastro';
import { RedefinirSenha } from './pages/RedefinirSenha';
import { Estatisticas } from './pages/Estatisticas';

const LoadingScreen = () => (
  <div className="flex h-screen items-center justify-center bg-[#F9F9F9]">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-[#800000] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-500 font-medium">Carregando...</p>
    </div>
  </div>
);

function AppContent() {
  const { loading } = useAppData();
  const { session } = useAuth();
  const isAdmin = session?.user?.email === import.meta.env.VITE_ADMIN_EMAIL;

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-screen max-w-[100vw] overflow-x-hidden bg-[#F9F9F9] font-[Manrope,Inter,sans-serif]">
      <div className="hidden md:block">
        <Sidebar isAdmin={isAdmin} />
      </div>
      <div className="flex flex-col flex-1 min-h-0 min-w-0">
        <MobileNav isAdmin={isAdmin} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agenda" element={<Dashboard />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/pacientes/novo" element={<NovoPaciente />} />
            <Route path="/pacientes/:id" element={<Prontuario />} />
            <Route path="/agendamento" element={<Agendamento />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/estatisticas" element={<Estatisticas />} />
            {isAdmin && <Route path="/admin" element={<Admin />} />}
          </Routes>
        </main>
      </div>
    </div>
  );
}

function AppInner() {
  const { session, loadingAuth, recoveryMode } = useAuth();

  if (loadingAuth) return <LoadingScreen />;
  if (!session) return <Login />;
  if (recoveryMode) return <RedefinirSenha />;

  const duoId = session.user.user_metadata?.duo_id;

  if (!duoId) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F9] font-[Inter,sans-serif]">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center max-w-sm">
          <p className="text-[#800000] font-semibold text-lg">Conta sem dupla configurada</p>
          <p className="text-gray-500 text-sm mt-2">Contacte o administrador para vincular sua conta a uma dupla.</p>
        </div>
      </div>
    );
  }

  return (
    <AppDataProvider duoId={duoId}>
      <ThemeProvider duoId={duoId}>
        <AppContent />
      </ThemeProvider>
    </AppDataProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/confirmar/:token" element={<Confirmar />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/*" element={<AppInner />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
