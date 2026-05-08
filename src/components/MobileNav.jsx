import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, PlusCircle, Settings, LogOut, ShieldCheck, X } from 'lucide-react';
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
    { to: '/', icon: Home, label: 'Início' },
    { to: '/agenda', icon: Calendar, label: 'Agenda' },
    { to: '/pacientes', icon: Users, label: 'Pacientes' },
    { to: '/agendamento', icon: PlusCircle, label: 'Agendar' },
    ...(isAdmin ? [{ to: '/admin', icon: ShieldCheck, label: 'Admin' }] : []),
  ];

  return (
    <>
      {/* Barra superior */}
      <header className="md:hidden bg-white border-b border-[#DADADA] px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-card">
        <img src="/logo-horizontal.svg" alt="DUO" className="h-9" />
        <div className="flex items-center gap-3">
          <button onClick={abrirModal} className="p-2 text-[#666666] hover:text-[#800000] transition-colors rounded-lg hover:bg-[#F9F9F9]">
            <Settings size={20} />
          </button>
          <button onClick={signOut} className="p-2 text-[#666666] hover:text-[#C94C4C] transition-colors rounded-lg hover:bg-[#FDECEA]">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Barra de navegação inferior */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#DADADA] flex justify-around z-20 pb-safe shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => clsx(
              'flex flex-col items-center py-2.5 px-3 text-xs font-semibold transition-colors min-w-0',
              isActive ? 'text-[#800000]' : 'text-[#666666]'
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
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl border border-[#DADADA] p-6 w-full md:max-w-sm">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Settings size={18} className="text-[#800000]" />
                Nomes da Dupla
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-[#666666] hover:text-[#1A1A1A]">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Estudante A</label>
                <input
                  type="text"
                  value={form.estudanteA}
                  onChange={e => setForm({ ...form, estudanteA: e.target.value })}
                  className="w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Estudante B</label>
                <input
                  type="text"
                  value={form.estudanteB}
                  onChange={e => setForm({ ...form, estudanteB: e.target.value })}
                  className="w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A]"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalAberto(false)} className="flex-1 border border-[#DADADA] text-[#666666] py-3 rounded-xl hover:bg-[#F9F9F9] font-semibold text-sm">
                Cancelar
              </button>
              <button onClick={handleSalvar} disabled={salvando} className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm">
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
