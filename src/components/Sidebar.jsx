import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, PlusCircle, Settings, X, LogOut, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ isAdmin }) => {
  const { nomes, updateNomes } = useAppData();
  const { signOut, session } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ estudanteA: '', estudanteB: '' });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const abrirModal = () => {
    setForm({ estudanteA: nomes.estudanteA, estudanteB: nomes.estudanteB });
    setErro('');
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.estudanteA.trim() || !form.estudanteB.trim()) {
      setErro('Preencha os dois nomes.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await updateNomes(form.estudanteA.trim(), form.estudanteB.trim());
      setModalAberto(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const navItems = [
    { to: '/', icon: Calendar, label: 'Agenda' },
    { to: '/pacientes', icon: Users, label: 'Pacientes' },
    { to: '/agendamento', icon: PlusCircle, label: 'Agendar' },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin' }] : []),
  ];

  return (
    <>
      <aside className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-center">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-univassouras)' }}>
            Univassouras | Agenda Duo
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
                  isActive
                    ? 'bg-[#800000] text-white'
                    : 'text-gray-600 hover:bg-[#F3F4F6] hover:text-[#800000]'
                )
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={abrirModal}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-gray-600 hover:bg-[#F3F4F6] hover:text-[#800000] transition-colors"
          >
            <Settings size={20} />
            Configurações
          </button>
          <div className="mt-2 px-4 py-2 rounded-lg bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2 mt-1 rounded-lg font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors text-sm"
          >
            <LogOut size={16} />
            Sair
          </button>
          <p className="text-xs text-center text-gray-400 mt-2">
            Clínica Odontológica Duo &copy; {new Date().getFullYear()}
          </p>
        </div>
      </aside>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Settings size={20} className="text-[#800000]" />
                Nomes da Dupla
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudante A</label>
                <input
                  type="text"
                  value={form.estudanteA}
                  onChange={e => setForm({ ...form, estudanteA: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
                  placeholder="Nome da estudante A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudante B</label>
                <input
                  type="text"
                  value={form.estudanteB}
                  onChange={e => setForm({ ...form, estudanteB: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
                  placeholder="Nome da estudante B"
                />
              </div>
            </div>

            {erro && (
              <p className="mt-3 text-sm text-red-600">{erro}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white py-2 rounded-lg transition-colors font-medium"
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
