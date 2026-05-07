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
      <aside className="w-64 bg-white border-r border-[#DADADA] h-screen flex flex-col shadow-card">
        <div className="px-6 py-4 border-b border-[#DADADA] flex items-center">
          <img src="/logo-horizontal.svg" alt="DUO" className="h-10" />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors',
                  isActive
                    ? 'bg-[#800000] text-white shadow-card'
                    : 'text-[#666666] hover:bg-[#F9F9F9] hover:text-[#800000]'
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#DADADA] space-y-1">
          <button
            onClick={abrirModal}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#666666] hover:bg-[#F9F9F9] hover:text-[#800000] transition-colors"
          >
            <Settings size={18} />
            Configurações
          </button>
          <div className="px-4 py-2 rounded-xl bg-[#F9F9F9] border border-[#DADADA]">
            <p className="text-xs text-[#666666] truncate">{session?.user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-2 rounded-xl font-semibold text-sm text-[#666666] hover:bg-[#FDECEA] hover:text-[#C94C4C] transition-colors"
          >
            <LogOut size={16} />
            Sair
          </button>
          <p className="text-xs text-center text-[#666666]/60 pt-1">
            © {new Date().getFullYear()} Univassouras
          </p>
        </div>
      </aside>

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADADA] p-6 w-full max-w-sm mx-4">
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
                  placeholder="Nome da estudante A"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Estudante B</label>
                <input
                  type="text"
                  value={form.estudanteB}
                  onChange={e => setForm({ ...form, estudanteB: e.target.value })}
                  className="w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A]"
                  placeholder="Nome da estudante B"
                />
              </div>
            </div>

            {erro && <p className="mt-3 text-sm text-[#C94C4C] font-medium">{erro}</p>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(false)}
                className="flex-1 border border-[#DADADA] text-[#666666] py-3 rounded-xl hover:bg-[#F9F9F9] transition-colors font-semibold text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={salvando}
                className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white py-3 rounded-xl transition-colors font-semibold text-sm"
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
