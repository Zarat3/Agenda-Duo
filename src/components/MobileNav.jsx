import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, PlusCircle, Settings, LogOut, ShieldCheck, X } from 'lucide-react';
import clsx from 'clsx';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';

export const MobileNav = ({ isAdmin }) => {
  const { nomes, updateNomes } = useAppData();
  const { signOut } = useAuth();
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState({ estudanteA: '', estudanteB: '' });
  const [salvando, setSalvando] = useState(false);

  const abrirModal = () => {
    setForm({ estudanteA: nomes.estudanteA, estudanteB: nomes.estudanteB });
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    if (!form.estudanteA.trim() || !form.estudanteB.trim()) return;
    setSalvando(true);
    try {
      await updateNomes(form.estudanteA.trim(), form.estudanteB.trim());
      setModalAberto(false);
    } catch (err) {
      console.error(err);
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
      {/* Barra superior */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-base font-bold text-[#800000]">Univassouras | Agenda Duo</h1>
        <div className="flex items-center gap-4">
          <button onClick={abrirModal} className="text-gray-500 hover:text-[#800000] transition-colors">
            <Settings size={20} />
          </button>
          <button onClick={signOut} className="text-gray-500 hover:text-red-600 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Barra de navegação inferior */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around z-20 pb-safe">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => clsx(
              'flex flex-col items-center py-2 px-3 text-xs font-medium transition-colors min-w-0',
              isActive ? 'text-[#800000]' : 'text-gray-400'
            )}
          >
            <item.icon size={22} />
            <span className="mt-1 truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Modal de configurações */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl md:rounded-xl shadow-xl p-6 w-full md:max-w-sm">
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estudante B</label>
                <input
                  type="text"
                  value={form.estudanteB}
                  onChange={e => setForm({ ...form, estudanteB: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={salvando} className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white py-2 rounded-lg font-medium">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
