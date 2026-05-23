import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Users, Settings, LogOut, X, Bell, BellOff, Smartphone, Building2, Clock, Download, UserCircle, Stethoscope, KeyRound, Mail, CheckCircle, AlertCircle, Palette, MessageSquarePlus } from 'lucide-react';
import clsx from 'clsx';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { ExportarSection } from './ExportarSection';
import { supabase } from '../lib/supabase';

const CORES_PRESET = ['#800000', '#1e40af', '#065f46', '#7c3aed', '#b45309', '#be185d', '#0f766e', '#1d4ed8'];

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

export const MobileNav = ({ isAdmin }) => {
  const { nomes, configuracoes, updateConfiguracoes } = useAppData();
  const { signOut, session } = useAuth();
  const { cores, setCor } = useTheme() || {};
  const duoId = session?.user?.user_metadata?.duo_id;
  const { subscribed, loading: loadingPush, supported: pushSupported, subscribe, unsubscribe } = usePushNotifications(duoId);

  const [modalAberto, setModalAberto] = useState(false);
  const [modalExportarAberto, setModalExportarAberto] = useState(false);
  const [form, setForm] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const [contaTab, setContaTab] = useState('senha');
  const [contaForm, setContaForm] = useState({ senha: '', confirmarSenha: '', email: '' });
  const [salvandoConta, setSalvandoConta] = useState(false);
  const [erroConta, setErroConta] = useState('');
  const [okConta, setOkConta] = useState('');

  const [sugestaoTexto, setSugestaoTexto] = useState('');
  const [sugestoes, setSugestoes] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`duo_sugestoes_${duoId}`)) || []; } catch { return []; }
  });
  const [sugestaoEnviada, setSugestaoEnviada] = useState(false);

  const handleEnviarSugestao = () => {
    const texto = sugestaoTexto.trim();
    if (!texto) return;
    const nova = { texto, data: new Date().toISOString() };
    const novas = [nova, ...sugestoes];
    setSugestoes(novas);
    try { localStorage.setItem(`duo_sugestoes_${duoId}`, JSON.stringify(novas)); } catch {}
    setSugestaoTexto('');
    setSugestaoEnviada(true);
    setTimeout(() => setSugestaoEnviada(false), 2500);
  };

  const handleSalvarSenha = async () => {
    if (contaForm.senha.length < 6) { setErroConta('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (contaForm.senha !== contaForm.confirmarSenha) { setErroConta('As senhas não coincidem.'); return; }
    setSalvandoConta(true);
    setErroConta('');
    try {
      const { error } = await supabase.auth.updateUser({ password: contaForm.senha });
      if (error) throw new Error(error.message);
      setOkConta('Senha alterada com sucesso!');
      setContaForm(f => ({ ...f, senha: '', confirmarSenha: '' }));
    } catch (err) {
      setErroConta(err.message);
    } finally {
      setSalvandoConta(false);
    }
  };

  const handleSalvarEmail = async () => {
    if (!contaForm.email.trim() || !contaForm.email.includes('@')) { setErroConta('Informe um e-mail válido.'); return; }
    setSalvandoConta(true);
    setErroConta('');
    try {
      const { error } = await supabase.auth.updateUser({ email: contaForm.email.trim() });
      if (error) throw new Error(error.message);
      setOkConta('Confirmação enviada para o novo e-mail. Clique no link para concluir a alteração.');
      setContaForm(f => ({ ...f, email: '' }));
    } catch (err) {
      setErroConta(err.message);
    } finally {
      setSalvandoConta(false);
    }
  };

  const TODAS_CLINICAS = [
    'Clínica Integrada', 'Periodontia', 'Dentística', 'Endodontia',
    'Pediatria', 'Prótese Total', 'Prótese Parcial Removível',
    'Cirurgia', 'Ortodontia', 'Saúde Coletiva', 'Urgência', 'Radiologia',
  ];

  const abrirModal = () => {
    setForm({
      estudanteA: nomes.estudanteA,
      estudanteB: nomes.estudanteB,
      nomeClinica: configuracoes.nomeClinica,
      turma: configuracoes.turma,
      horariosAtivos: [...configuracoes.horariosAtivos],
      diasAtivos: [...configuracoes.diasAtivos],
      clinicasAtivas: [...(configuracoes.clinicasAtivas || [])],
    });
    setErro('');
    setContaForm({ senha: '', confirmarSenha: '', email: '' });
    setErroConta('');
    setOkConta('');
    setContaTab('senha');
    setModalAberto(true);
  };

  const toggleClinica = (c) => {
    setForm(f => ({
      ...f,
      clinicasAtivas: f.clinicasAtivas.includes(c)
        ? f.clinicasAtivas.filter(x => x !== c)
        : [...f.clinicasAtivas, c],
    }));
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
      setErro('Selecione pelo menos um horário.');
      return;
    }
    if (form.diasAtivos.length === 0) {
      setErro('Selecione pelo menos um dia.');
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
        clinicasAtivas: form.clinicasAtivas || [],
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
    { to: '/perfil', icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <>
      {/* Barra superior */}
      <header className="md:hidden bg-white border-b border-[#DADADA] px-4 py-3 flex justify-between items-center sticky top-0 z-20 shadow-card">
        <img src="/logo-horizontal.svg" alt="DUO" className="h-9" />
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setModalExportarAberto(true)}
            aria-label="Exportar registros"
            className="p-2 text-[#666666] hover:text-[#800000] transition-colors rounded-lg hover:bg-[#F9F9F9]"
          >
            <Download size={20} />
          </button>
          <button onClick={abrirModal} className="p-2 text-[#666666] hover:text-[#800000] transition-colors rounded-lg hover:bg-[#F9F9F9]"
            aria-label="Configurações">
            <Settings size={20} />
          </button>
          <button onClick={signOut} className="p-2 text-[#666666] hover:text-[#C94C4C] transition-colors rounded-lg hover:bg-[#FDECEA]"
            aria-label="Sair">
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
              isActive ? '' : 'text-[#666666]'
            )}
            style={({ isActive }) => isActive ? { color: 'var(--duo-accent, #800000)' } : {}}
          >
            <item.icon size={22} />
            <span className="mt-1 truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {modalExportarAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full flex flex-col max-h-[92vh] shadow-xl">
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#DADADA] shrink-0">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Download size={18} className="text-[#800000]" />
                Exportar
              </h2>
              <button onClick={() => setModalExportarAberto(false)} className="text-[#666666] hover:text-[#1A1A1A]">
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-5">
              <ExportarSection />
            </div>
          </div>
        </div>
      )}

      {/* Modal de configurações completo */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/40 flex items-end justify-center z-50">
          <div className="bg-white rounded-t-2xl w-full flex flex-col max-h-[92vh] shadow-xl">

            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-[#DADADA] shrink-0">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Settings size={18} className="text-[#800000]" />
                Configurações
              </h2>
              <button onClick={() => setModalAberto(false)} className="text-[#666666] hover:text-[#1A1A1A]">
                <X size={20} />
              </button>
            </div>

            {/* Corpo rolável */}
            <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">

              {/* Nomes */}
              <div>
                <p className={sectionTitle}><Users size={13} /> Nomes da Dupla</p>
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

              {/* Clínica */}
              <div>
                <p className={sectionTitle}><Building2 size={13} /> Dados da Clínica</p>
                <div className="space-y-2.5">
                  <div>
                    <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Nome da clínica</label>
                    <input type="text" value={form.nomeClinica || ''} placeholder="Ex: Clínica Odontológica"
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

              {/* Horários */}
              <div>
                <p className={sectionTitle}><Clock size={13} /> Horários Disponíveis</p>
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
                                ativo ? 'bg-[#800000] border-[#800000] text-white' : 'bg-white border-[#DADADA] text-[#999999]'
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

              {/* Dias */}
              <div>
                <p className={sectionTitle}><Calendar size={13} /> Dias de Atendimento</p>
                <div className="flex gap-2 flex-wrap">
                  {DIAS_SEMANA.map(dia => {
                    const ativo = form.diasAtivos?.includes(dia.value);
                    return (
                      <button key={dia.value} type="button" onClick={() => toggleDia(dia.value)}
                        className={`w-12 py-2 rounded-xl text-xs font-bold border transition-all ${
                          ativo ? 'bg-[#800000] border-[#800000] text-white' : 'bg-white border-[#DADADA] text-[#999999]'
                        }`}>
                        {dia.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clínicas */}
              <div>
                <p className={sectionTitle}><Stethoscope size={13} /> Clínicas</p>
                <p className="text-xs text-[#666666] mb-2">Selecione as clínicas em que sua dupla atua.</p>
                <div className="flex flex-wrap gap-2">
                  {TODAS_CLINICAS.map(c => {
                    const ativo = form.clinicasAtivas?.includes(c);
                    return (
                      <button key={c} type="button" onClick={() => toggleClinica(c)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          ativo ? 'bg-[#800000] border-[#800000] text-white' : 'bg-white border-[#DADADA] text-[#999999]'
                        }`}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notificações */}
              {pushSupported && (
                <div>
                  <p className={sectionTitle}><Smartphone size={13} /> Notificações</p>
                  <button type="button"
                    onClick={subscribed ? unsubscribe : subscribe}
                    disabled={loadingPush}
                    className={clsx(
                      'w-full flex items-center gap-2.5 px-4 py-3 rounded-xl font-semibold text-sm transition-colors border',
                      subscribed
                        ? 'text-[#2D6A4F] bg-[#D8F3DC] border-[#2D6A4F]/20'
                        : 'text-[#666666] border-[#DADADA]'
                    )}>
                    {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
                    {loadingPush ? 'Aguarde...' : subscribed ? 'Ativas — toque para desativar' : 'Ativar notificações push'}
                  </button>
                </div>
              )}

              {/* Cores dos integrantes */}
              {cores && (
                <div>
                  <p className={sectionTitle}>
                    <Palette size={13} /> Cores dos Integrantes
                  </p>
                  <p className="text-xs text-[#666666] mb-3">Escolha uma cor para cada integrante. Ela será aplicada quando apenas um estiver selecionado na Agenda.</p>
                  {[
                    { key: 'A', label: nomes.estudanteA || 'Estudante A' },
                    { key: 'B', label: nomes.estudanteB || 'Estudante B' },
                  ].map(({ key, label }) => (
                    <div key={key} className="mb-3">
                      <p className="text-xs font-semibold text-[#1A1A1A] mb-1.5">{label}</p>
                      <div className="flex gap-2 flex-wrap">
                        {CORES_PRESET.map(cor => (
                          <button key={cor} type="button" onClick={() => setCor(key, cor)}
                            className={`w-8 h-8 rounded-full transition-all border-2 ${cores[key] === cor ? 'border-[#1A1A1A] scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: cor }}
                            title={cor}
                          />
                        ))}
                        <input type="color" value={cores[key] || '#800000'}
                          onChange={e => setCor(key, e.target.value)}
                          className="w-8 h-8 rounded-full border border-[#DADADA] cursor-pointer p-0 overflow-hidden"
                          title="Cor personalizada"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sugestões */}
              <div>
                <p className={sectionTitle}>
                  <MessageSquarePlus size={13} /> Sugestões
                </p>
                <p className="text-xs text-[#666666] mb-2">Tem uma ideia de melhoria? Registre aqui.</p>
                <textarea
                  value={sugestaoTexto}
                  onChange={e => setSugestaoTexto(e.target.value)}
                  rows={3}
                  placeholder="Descreva sua sugestão..."
                  className={`${inputCls} resize-none mb-2`}
                />
                {sugestaoEnviada && (
                  <p className="text-xs text-[#2D6A4F] font-medium mb-2 flex items-center gap-1">
                    <CheckCircle size={12} /> Sugestão registrada!
                  </p>
                )}
                <button type="button" onClick={handleEnviarSugestao} disabled={!sugestaoTexto.trim()}
                  className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors mb-4">
                  Enviar sugestão
                </button>
                {sugestoes.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#666666] uppercase tracking-widest">Sugestões anteriores</p>
                    {sugestoes.slice(0, 5).map((s, i) => (
                      <div key={i} className="bg-[#F9F9F9] rounded-xl p-3 border border-[#DADADA]">
                        <p className="text-xs text-[#1A1A1A]">{s.texto}</p>
                        <p className="text-[10px] text-[#999] mt-1">{new Date(s.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Conta */}
              <div className="border-t border-[#DADADA] pt-5">
                <p className={sectionTitle}>
                  <KeyRound size={13} /> Conta
                </p>
                <p className="text-xs text-[#666666] mb-3">
                  Logado como <span className="font-semibold text-[#1A1A1A]">{session?.user?.email}</span>
                </p>

                <div className="flex gap-2 mb-4 bg-[#F9F9F9] rounded-xl p-1">
                  <button type="button" onClick={() => { setContaTab('senha'); setErroConta(''); setOkConta(''); }}
                    className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                      contaTab === 'senha' ? 'bg-white text-[#800000] shadow-card' : 'text-[#666666]')}>
                    <KeyRound size={14} /> Senha
                  </button>
                  <button type="button" onClick={() => { setContaTab('email'); setErroConta(''); setOkConta(''); }}
                    className={clsx('flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors',
                      contaTab === 'email' ? 'bg-white text-[#800000] shadow-card' : 'text-[#666666]')}>
                    <Mail size={14} /> E-mail
                  </button>
                </div>

                {erroConta && (
                  <div className="mb-3 p-3 bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C] rounded-xl flex items-center gap-2 text-sm font-medium">
                    <AlertCircle size={14} />{erroConta}
                  </div>
                )}
                {okConta && (
                  <div className="mb-3 p-3 bg-[#D8F3DC] border border-[#2D6A4F]/30 text-[#2D6A4F] rounded-xl flex items-center gap-2 text-sm font-medium">
                    <CheckCircle size={14} />{okConta}
                  </div>
                )}

                {contaTab === 'senha' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Nova Senha</label>
                      <input type="password" value={contaForm.senha}
                        onChange={e => setContaForm(f => ({ ...f, senha: e.target.value }))}
                        placeholder="Mínimo 6 caracteres" className={inputCls} />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Confirmar Nova Senha</label>
                      <input type="password" value={contaForm.confirmarSenha}
                        onChange={e => setContaForm(f => ({ ...f, confirmarSenha: e.target.value }))}
                        placeholder="Repita a nova senha" className={inputCls} />
                    </div>
                    <button type="button" onClick={handleSalvarSenha} disabled={salvandoConta}
                      className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                      {salvandoConta ? 'Salvando...' : 'Alterar Senha'}
                    </button>
                  </div>
                )}

                {contaTab === 'email' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Novo E-mail</label>
                      <input type="email" value={contaForm.email}
                        onChange={e => setContaForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="novo@email.com" className={inputCls} />
                    </div>
                    <p className="text-xs text-[#666666]">
                      Um link de confirmação será enviado para o novo e-mail.
                    </p>
                    <button type="button" onClick={handleSalvarEmail} disabled={salvandoConta}
                      className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm">
                      {salvandoConta ? 'Enviando...' : 'Alterar E-mail'}
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-[#DADADA] shrink-0">
              {erro && <p className="mb-3 text-sm text-[#C94C4C] font-medium">{erro}</p>}
              <div className="flex gap-3">
                <button onClick={() => setModalAberto(false)}
                  className="flex-1 border border-[#DADADA] text-[#666666] py-3 rounded-xl font-semibold text-sm">
                  Cancelar
                </button>
                <button onClick={handleSalvar} disabled={salvando}
                  className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm">
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
