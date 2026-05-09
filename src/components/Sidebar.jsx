import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Users, PlusCircle, Settings, X, LogOut, ShieldCheck, Bell, BellOff, Smartphone, Home, Building2, Clock, Download } from 'lucide-react';
import clsx from 'clsx';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { ExportarSection } from './ExportarSection';

const ALL_TURNOS = [
  { label: 'Manhã', slots: ['08:00', '09:00', '10:00', '11:00'] },
  { label: 'Tarde', slots: ['13:00', '14:00', '15:00', '16:00'] },
  { label: 'Noite', slots: ['16:20', '17:20', '18:20'] },
];

const DIAS_SEMANA = [
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
];

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] text-sm';
const sectionTitle = 'text-xs font-bold text-[#666666] uppercase tracking-widest mb-3 flex items-center gap-2';

export const Sidebar = ({ isAdmin }) => {
  const { nomes, configuracoes, updateConfiguracoes } = useAppData();
  const { signOut, session } = useAuth();
  const duoId = session?.user?.user_metadata?.duo_id;
  const { subscribed, loading: loadingPush, supported: pushSupported, subscribe, unsubscribe } = usePushNotifications(duoId);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const abrirModal = () => {
    setForm({
      estudanteA: nomes.estudanteA,
      estudanteB: nomes.estudanteB,
      nomeClinica: configuracoes.nomeClinica,
      turma: configuracoes.turma,
      horariosAtivos: [...configuracoes.horariosAtivos],
      diasAtivos: [...configuracoes.diasAtivos],
    });
    setErro('');
    setModalAberto(true);
  };

  const toggleHorario = (slot) => {
    setForm(f => ({
      ...f,
      horariosAtivos: f.horariosAtivos.includes(slot)
        ? f.horariosAtivos.filter(h => h !== slot)
        : [...f.horariosAtivos, slot],
    }));
  };

  const toggleDia = (val) => {
    setForm(f => ({
      ...f,
      diasAtivos: f.diasAtivos.includes(val)
        ? f.diasAtivos.filter(d => d !== val)
        : [...f.diasAtivos, val],
    }));
  };

  const handleSalvar = async () => {
    if (!form.estudanteA?.trim() || !form.estudanteB?.trim()) {
      setErro('Preencha os dois nomes da dupla.');
      return;
    }
    if (!form.nomeClinica?.trim()) {
      setErro('Preencha o nome da clínica.');
      return;
    }
    if (form.horariosAtivos.length === 0) {
      setErro('Selecione pelo menos um horário disponível.');
      return;
    }
    if (form.diasAtivos.length === 0) {
      setErro('Selecione pelo menos um dia de atendimento.');
      return;
    }
    setSalvando(true);
    setErro('');
    try {
      await updateConfiguracoes({
        estudanteA: form.estudanteA.trim(),
        estudanteB: form.estudanteB.trim(),
        nomeClinica: form.nomeClinica.trim(),
        turma: form.turma?.trim() || '',
        horariosAtivos: form.horariosAtivos,
        diasAtivos: form.diasAtivos,
      });
      setModalAberto(false);
    } catch (err) {
      setErro(err.message);
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
            type="button"
            onClick={() => setModalExportarAberto(true)}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-[#666666] hover:bg-[#F9F9F9] hover:text-[#800000] transition-colors"
          >
            <Download size={18} />
            Exportar
          </button>
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
            © {new Date().getFullYear()} Zarat3
          </p>
        </div>
      </aside>

      {modalExportarAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADADA] w-full max-w-md mx-4 flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#DADADA] shrink-0">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Download size={18} className="text-[#800000]" />
                Exportar
              </h2>
              <button onClick={() => setModalExportarAberto(false)} className="text-[#666666] hover:text-[#1A1A1A]">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              <ExportarSection />
            </div>
          </div>
        </div>
      )}

      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADADA] w-full max-w-md mx-4 flex flex-col max-h-[92vh]">

            {/* Header fixo */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#DADADA] shrink-0">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Settings size={18} className="text-[#800000]" />
                Configurações
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-[#666666] hover:text-[#1A1A1A]">
                <X size={20} />
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

              {/* Nomes da dupla */}
              <div>
                <p className={sectionTitle}>
                  <Users size={13} /> Nomes da Dupla
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Estudante A</label>
                    <input type="text" value={form.estudanteA || ''} placeholder="Nome completo"
                      onChange={e => setForm(f => ({ ...f, estudanteA: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Estudante B</label>
                    <input type="text" value={form.estudanteB || ''} placeholder="Nome completo"
                      onChange={e => setForm(f => ({ ...f, estudanteB: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Dados da clínica */}
              <div>
                <p className={sectionTitle}>
                  <Building2 size={13} /> Dados da Clínica
                </p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Nome da clínica</label>
                    <input type="text" value={form.nomeClinica || ''} placeholder="Ex: Clínica Odontológica Universitária"
                      onChange={e => setForm(f => ({ ...f, nomeClinica: e.target.value }))}
                      className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">
                      Turma / Semestre <span className="font-normal text-[#666666]">(opcional)</span>
                    </label>
                    <input type="text" value={form.turma || ''} placeholder="Ex: Turma 5A · 2025.1"
                      onChange={e => setForm(f => ({ ...f, turma: e.target.value }))}
                      className={inputCls} />
                  </div>
                </div>
              </div>

              {/* Horários disponíveis */}
              <div>
                <p className={sectionTitle}>
                  <Clock size={13} /> Horários Disponíveis
                </p>
                <div className="space-y-3">
                  {ALL_TURNOS.map(turno => (
                    <div key={turno.label}>
                      <p className="text-[11px] text-[#999999] font-semibold mb-1.5">{turno.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {turno.slots.map(slot => {
                          const ativo = form.horariosAtivos?.includes(slot);
                          return (
                            <button key={slot} type="button" onClick={() => toggleHorario(slot)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                                ativo
                                  ? 'bg-[#800000] border-[#800000] text-white'
                                  : 'bg-white border-[#DADADA] text-[#999999]'
                              }`}>
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dias de atendimento */}
              <div>
                <p className={sectionTitle}>
                  <Calendar size={13} /> Dias de Atendimento
                </p>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_SEMANA.map(dia => {
                    const ativo = form.diasAtivos?.includes(dia.value);
                    return (
                      <button key={dia.value} type="button" onClick={() => toggleDia(dia.value)}
                        className={`w-12 py-2 rounded-xl text-xs font-bold border transition-all ${
                          ativo
                            ? 'bg-[#800000] border-[#800000] text-white'
                            : 'bg-white border-[#DADADA] text-[#999999]'
                        }`}>
                        {dia.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notificações */}
              {pushSupported && (
                <div>
                  <p className={sectionTitle}>
                    <Smartphone size={13} /> Notificações
                  </p>
                  <button type="button"
                    onClick={subscribed ? unsubscribe : subscribe}
                    disabled={loadingPush}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors border',
                      subscribed
                        ? 'text-[#2D6A4F] bg-[#D8F3DC] border-[#2D6A4F]/20 hover:bg-[#c5eacc]'
                        : 'text-[#666666] border-[#DADADA] hover:bg-[#F9F9F9] hover:text-[#800000]'
                    )}>
                    {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
                    {loadingPush ? 'Aguarde...' : subscribed ? 'Ativas — toque para desativar' : 'Ativar notificações push'}
                  </button>
                  {!subscribed && (
                    <p className="text-xs text-[#666666] mt-1.5">Receba alertas quando um paciente confirmar.</p>
                  )}
                </div>
              )}

            </div>

            {/* Footer fixo */}
            <div className="px-6 py-4 border-t border-[#DADADA] shrink-0">
              {erro && <p className="mb-3 text-sm text-[#C94C4C] font-medium">{erro}</p>}
              <div className="flex gap-3">
                <button onClick={() => setModalAberto(false)}
                  className="flex-1 border border-[#DADADA] text-[#666666] py-3 rounded-xl hover:bg-[#F9F9F9] transition-colors font-semibold text-sm">
                  Cancelar
                </button>
                <button onClick={handleSalvar} disabled={salvando}
                  className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white py-3 rounded-xl transition-colors font-semibold text-sm">
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
