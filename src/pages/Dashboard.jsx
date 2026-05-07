import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import {
  ChevronLeft, ChevronRight, X,
  Phone, MessageCircle, FileText, AlertTriangle, Lock, LockOpen,
} from 'lucide-react';
import {
  startOfWeek, addDays, addWeeks, subWeeks,
  isToday, isSameDay, format, parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TURNOS = [
  { label: 'Manhã',  slots: ['08:00', '09:00', '10:00', '11:00'], bg: 'bg-blue-50'   },
  { label: 'Tarde',  slots: ['13:00', '14:00', '15:00', '16:00'], bg: 'bg-orange-50' },
  { label: 'Noite',  slots: ['16:20', '17:00', '17:20', '18:20'], bg: 'bg-indigo-50' },
];

const STATUS_CARD = {
  'Confirmado': 'border-[#2D6A4F] bg-[#D8F3DC] text-[#2D6A4F]',
  'Pendente':   'border-[#FFB703] bg-[#FFF3CD] text-[#7A5800]',
  'Cancelado':  'border-[#C94C4C] bg-[#FDECEA] text-[#C94C4C] opacity-60',
  'Realizado':  'border-gray-300  bg-gray-50   text-gray-500',
};

const STATUS_BADGE = {
  'Confirmado': 'bg-[#D8F3DC] text-[#2D6A4F]',
  'Pendente':   'bg-[#FFF3CD] text-[#7A5800]',
  'Cancelado':  'bg-[#FDECEA] text-[#C94C4C]',
  'Realizado':  'bg-gray-100  text-gray-500',
};

const DOT  = { 'Estudante A': 'bg-blue-500', 'Estudante B': 'bg-purple-500' };
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/* ─── Popup ────────────────────────────────────────────── */
const Popup = ({ consulta: c, paciente: pac, nomes, onClose, onProntuario, onWhatsApp, onStatusChange }) => {
  const nomeDupla  = c.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
  const dotColor   = DOT[c.dupla] || 'bg-gray-400';
  let dataFmt = c.data;
  try { dataFmt = format(parseISO(c.data), "EEE, dd 'de' MMMM", { locale: ptBR }); } catch {}
  const iniciais   = pac.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const alertas    = pac.alertas ? pac.alertas.split(',').map(s => s.trim()).filter(Boolean) : [];

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start gap-3 p-5 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-[#800000] flex items-center justify-center shrink-0 text-base font-bold text-white">
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 text-base leading-tight">{pac.nome}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
              <Phone size={12} /> {pac.telefone}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 mt-0.5 shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {alertas.length > 0 && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-800">{alertas.join(' · ')}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
            <p className="text-sm font-semibold text-gray-800 capitalize">{dataFmt} · {c.horario}</p>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
              <p className="text-sm text-gray-600">{nomeDupla}</p>
            </div>
            {c.queixa_principal && (
              <p className="text-sm text-gray-700 border-t border-gray-200 pt-1.5 mt-1.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-0.5">Queixa principal</span>
                {c.queixa_principal}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-gray-500 mb-1.5">Status da consulta</p>
            <select value={c.status} onChange={e => onStatusChange(e.target.value)}
              className={`w-full text-sm font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}>
              <option value="Pendente">Pendente</option>
              <option value="Confirmado">Confirmado</option>
              <option value="Cancelado">Cancelado</option>
              <option value="Realizado">Realizado</option>
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={onWhatsApp}
              className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
              <MessageCircle size={15} /> WhatsApp
            </button>
            <button onClick={onProntuario}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#800000] hover:bg-[#660000] text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
              <FileText size={15} /> Prontuário
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Dashboard ────────────────────────────────────────── */
export const Dashboard = () => {
  const { consultas, pacientes, nomes, diasBloqueados, updateConsultaStatus, bloquearDia, desbloquearDia } = useAppData();
  const navigate = useNavigate();

  // Desktop: semana
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  // Mobile: dia único
  const [diaAtual, setDiaAtual] = useState(new Date());

  const [filtro, setFiltro] = useState({ 'Estudante A': true, 'Estudante B': true });
  const [popup, setPopup]   = useState(null);
  const [modalDia, setModalDia] = useState(null);
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);

  useEffect(() => {
    const ano = new Date().getFullYear();
    fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setFeriadosNacionais(data))
      .catch(() => {});
  }, []);

  const isDiaBloqueado  = (ds) => diasBloqueados.some(d => d.data === ds);
  const isFeriado       = (ds) => feriadosNacionais.some(f => f.date === ds);
  const isDiaIndisponivel = (ds) => isDiaBloqueado(ds) || isFeriado(ds);
  const infoDia = (ds) => {
    const f = feriadosNacionais.find(f => f.date === ds);
    if (f) return { tipo: 'nacional', motivo: f.name };
    const b = diasBloqueados.find(d => d.data === ds);
    if (b) return { tipo: 'custom', motivo: b.motivo };
    return null;
  };

  const days = DIAS.map((label, i) => {
    const date = addDays(weekStart, i);
    return { label, date, dateStr: format(date, 'yyyy-MM-dd') };
  });

  const weekLabel = `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} — ${format(addDays(weekStart, 5), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;
  const diaStr    = format(diaAtual, 'yyyy-MM-dd');

  const toggleFiltro = (key) => {
    const other = key === 'Estudante A' ? 'Estudante B' : 'Estudante A';
    setFiltro(prev => {
      if (prev[key] && !prev[other]) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const getCell = (dateStr, horario) =>
    consultas.filter(c => c.data === dateStr && c.horario === horario && filtro[c.dupla]);

  const abrirPopup = (c) => {
    const pac = pacientes.find(p => p.id === c.pacienteId);
    if (pac) setPopup({ consulta: c, paciente: pac });
  };

  const handleWhatsApp = (pac, c) => {
    let dataFmt = c.data;
    try { dataFmt = format(parseISO(c.data), 'dd/MM/yyyy'); } catch {}
    const link = `${window.location.origin}/confirmar/${c.id}`;
    const text = `Olá, ${pac.nome.split(' ')[0]}! 🦷\nSua consulta odontológica está marcada para *${dataFmt}* às *${c.horario}*.\n\nConfirme sua presença pelo link abaixo:\n${link}`;
    const num  = pac.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleStatusChange = (novoStatus) => {
    if (!popup) return;
    updateConsultaStatus(popup.consulta.id, novoStatus).catch(console.error);
    setPopup(prev => prev ? { ...prev, consulta: { ...prev.consulta, status: novoStatus } } : null);
  };

  const estudantes = [
    { key: 'Estudante A', nome: nomes.estudanteA, dot: 'bg-blue-500'   },
    { key: 'Estudante B', nome: nomes.estudanteB, dot: 'bg-purple-500' },
  ];

  /* ── Filtro sidebar / pills ── */
  const FiltroEstudantes = ({ mobile = false }) => (
    <div className={mobile ? 'flex gap-2' : 'space-y-1.5'}>
      {estudantes.map(({ key, nome, dot }) => (
        <button key={key} onClick={() => toggleFiltro(key)}
          className={mobile
            ? `flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${filtro[key] ? 'border-gray-400 bg-white text-gray-700' : 'border-gray-200 text-gray-400 opacity-50'}`
            : `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${filtro[key] ? 'bg-gray-100 text-gray-800' : 'text-gray-400 opacity-50'}`
          }>
          <span className={`rounded-sm shrink-0 ${mobile ? 'w-2 h-2' : 'w-2.5 h-2.5'} ${filtro[key] ? dot : 'bg-gray-300'}`} />
          {nome}
        </button>
      ))}
    </div>
  );

  /* ── Card de consulta (compartilhado mobile/desktop) ── */
  const ConsultaCard = ({ c }) => {
    const pac = pacientes.find(p => p.id === c.pacienteId);
    if (!pac) return null;
    const cls = STATUS_CARD[c.status] || STATUS_CARD['Realizado'];
    return (
      <button onClick={() => abrirPopup(c)}
        className={`w-full text-left rounded-lg px-3 py-2 mb-1.5 border-l-4 text-sm hover:brightness-95 transition-all ${cls}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[c.dupla] || 'bg-gray-400'}`} />
            <span className="font-semibold truncate">{pac.nome}</span>
          </div>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[c.status]}`}>
            {c.status}
          </span>
        </div>
        {c.queixa_principal && (
          <p className="text-xs text-gray-500 mt-0.5 pl-3.5 truncate">{c.queixa_principal}</p>
        )}
      </button>
    );
  };

  /* ── Modal de bloqueio de dia ── */
  const ModalBloqueio = () => {
    const [motivo, setMotivo] = useState('');
    const [salvando, setSalvando] = useState(false);
    if (!modalDia) return null;
    const { dateStr, label } = modalDia;
    const feriado    = feriadosNacionais.find(f => f.date === dateStr);
    const bloqueado  = diasBloqueados.find(d => d.data === dateStr);

    const handleBloquear = async () => {
      setSalvando(true);
      try { await bloquearDia(dateStr, motivo || null); setModalDia(null); }
      catch (e) { console.error(e); }
      finally { setSalvando(false); }
    };

    const handleDesbloquear = async () => {
      setSalvando(true);
      try { await desbloquearDia(dateStr); setModalDia(null); }
      catch (e) { console.error(e); }
      finally { setSalvando(false); }
    };

    return (
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setModalDia(null)}>
        <div className="bg-white rounded-2xl shadow-xl border border-[#DADADA] p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-[#1A1A1A] capitalize text-sm">{label}</h3>
            <button onClick={() => setModalDia(null)} className="text-[#666666] hover:text-[#1A1A1A]"><X size={18} /></button>
          </div>

          {feriado ? (
            <div className="bg-[#FFF3CD] border border-[#FFB703]/40 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">🎉</p>
              <p className="text-sm font-bold text-[#7A5800]">Feriado Nacional</p>
              <p className="text-sm text-[#7A5800] mt-1">{feriado.name}</p>
              <p className="text-xs text-[#7A5800]/70 mt-2">Dia bloqueado automaticamente.</p>
            </div>
          ) : bloqueado ? (
            <div>
              <div className="bg-[#FDECEA] border border-[#C94C4C]/30 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lock size={14} className="text-[#C94C4C]" />
                  <p className="text-sm font-bold text-[#C94C4C]">Dia bloqueado</p>
                </div>
                {bloqueado.motivo && <p className="text-sm text-[#C94C4C]/80">{bloqueado.motivo}</p>}
              </div>
              <button onClick={handleDesbloquear} disabled={salvando}
                className="w-full bg-[#2D6A4F] hover:bg-[#245c43] disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <LockOpen size={15} />
                {salvando ? 'Desbloqueando...' : 'Desbloquear dia'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#666666] mb-3">Bloquear este dia para agendamentos?</p>
              <input type="text" placeholder="Motivo (ex: Feriado municipal, Semana de provas...)"
                value={motivo} onChange={e => setMotivo(e.target.value)}
                className="w-full border border-[#DADADA] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#800000] mb-4 text-[#1A1A1A]"
              />
              <button onClick={handleBloquear} disabled={salvando}
                className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Lock size={15} />
                {salvando ? 'Bloqueando...' : 'Bloquear dia'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ── Seletor de semana (mobile) ── */
  const [semanaBaseMobile, setSemanaBaseMobile] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDays(semanaBaseMobile, i));

  useEffect(() => {
    const fim = addDays(semanaBaseMobile, 6);
    if (diaAtual < semanaBaseMobile || diaAtual > fim) {
      setSemanaBaseMobile(startOfWeek(diaAtual, { weekStartsOn: 1 }));
    }
  }, [diaAtual]);

  return (
    <>
      {/* ════════════════════════════════════════════════
          MOBILE — Vista de 1 dia
      ════════════════════════════════════════════════ */}
      <div className="md:hidden flex flex-col gap-3">

        {/* Seletor de semana */}
        <div className="bg-white rounded-2xl border border-[#DADADA] shadow-card overflow-hidden">
          {/* Header: navegação semana + filtro */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#DADADA]">
            <div className="flex items-center gap-1">
              <button onClick={() => setSemanaBaseMobile(w => subWeeks(w, 1))}
                className="p-1 rounded-lg text-[#666666] hover:bg-[#F9F9F9] hover:text-[#800000] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-bold text-[#1A1A1A] capitalize px-1">
                {format(semanaBaseMobile, 'MMM yyyy', { locale: ptBR })}
              </span>
              <button onClick={() => setSemanaBaseMobile(w => addWeeks(w, 1))}
                className="p-1 rounded-lg text-[#666666] hover:bg-[#F9F9F9] hover:text-[#800000] transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-1.5">
              {estudantes.map(({ key, nome, dot }) => (
                <button key={key} onClick={() => toggleFiltro(key)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border transition-all ${
                    filtro[key] ? 'border-[#DADADA] bg-white text-[#1A1A1A]' : 'border-transparent text-[#666666] opacity-40'
                  }`}>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${filtro[key] ? dot : 'bg-gray-300'}`} />
                  {nome.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Grade 7 colunas — ocupa 100% da largura do card */}
          <div className="grid grid-cols-7 px-2 py-2 gap-1">
            {diasSemana.map(dia => {
              const key = format(dia, 'yyyy-MM-dd');
              const ativo = isSameDay(dia, diaAtual);
              const hoje = isToday(dia);
              const bloqueado = isDiaIndisponivel(key);
              const temConsulta = consultas.some(c => c.data === key);
              return (
                <button key={key}
                  onClick={() => { setDiaAtual(dia); if (ativo) setModalDia({ dateStr: key, label: format(dia, "EEE, dd 'de' MMM", { locale: ptBR }) }); }}
                  className={`flex flex-col items-center py-2 rounded-xl transition-all relative ${
                    bloqueado
                      ? ativo ? 'bg-gray-400 text-white' : 'text-gray-300'
                      : ativo ? 'bg-[#800000] text-white'
                        : hoje ? 'bg-[#800000]/10 text-[#800000]'
                          : 'text-[#666666] hover:bg-[#F9F9F9]'
                  }`}>
                  <span className="text-[10px] font-semibold uppercase leading-none">
                    {format(dia, 'EEE', { locale: ptBR }).slice(0, 3)}
                  </span>
                  <span className="text-base font-extrabold mt-1 leading-none">
                    {format(dia, 'd')}
                  </span>
                  {bloqueado
                    ? <Lock size={8} className="mt-1.5 opacity-70" />
                    : <span className={`w-1.5 h-1.5 rounded-full mt-1.5 ${temConsulta ? (ativo ? 'bg-white/70' : 'bg-[#800000]') : 'bg-transparent'}`} />
                  }
                </button>
              );
            })}
          </div>
        </div>

        {/* Turnos do dia */}
        {isDiaIndisponivel(diaStr) ? (
          <button onClick={() => setModalDia({ dateStr: diaStr, label: format(diaAtual, "EEE, dd 'de' MMM", { locale: ptBR }) })}
            className="w-full bg-white rounded-2xl border border-[#DADADA] shadow-card p-8 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              {isFeriado(diaStr) ? <span className="text-2xl">🎉</span> : <Lock size={20} className="text-gray-400" />}
            </div>
            <div>
              <p className="font-bold text-[#1A1A1A] text-sm">
                {isFeriado(diaStr) ? infoDia(diaStr)?.motivo : 'Dia bloqueado'}
              </p>
              {!isFeriado(diaStr) && infoDia(diaStr)?.motivo && (
                <p className="text-xs text-[#666666] mt-1">{infoDia(diaStr).motivo}</p>
              )}
              <p className="text-xs text-[#666666] mt-2 underline">Toque para desbloquear</p>
            </div>
          </button>
        ) : (
          <div className="space-y-3">
            {TURNOS.map(turno => (
              <div key={turno.label} className="bg-white rounded-xl border border-[#DADADA] shadow-card overflow-hidden">
                <div className={`px-4 py-2 ${turno.bg}`}>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">{turno.label}</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {turno.slots.map(horario => {
                    const items = getCell(diaStr, horario);
                    return (
                      <div key={horario} className="flex gap-3 px-4 py-2.5 items-start">
                        <span className="text-xs font-semibold text-gray-400 w-12 shrink-0 pt-0.5">{horario}</span>
                        <div className="flex-1 min-w-0">
                          {items.length > 0
                            ? items.map(c => <ConsultaCard key={c.id} c={c} />)
                            : <p className="text-xs text-gray-300 italic">Livre</p>
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          DESKTOP — Grade semanal
      ════════════════════════════════════════════════ */}
      <div className="hidden md:flex gap-5 max-w-[1400px] mx-auto">

        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4 w-48 shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Estudantes</p>
            <FiltroEstudantes />
            <div className="mt-5 border-t border-gray-100 pt-4 space-y-1.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Status</p>
              {Object.entries(STATUS_BADGE).map(([status, cls]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-sm ${cls}`} />
                  <span className="text-xs text-gray-600">{status}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">

          {/* Header semana */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex lg:hidden gap-2">
              <FiltroEstudantes mobile />
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-gray-700 whitespace-nowrap select-none">
                {weekLabel}
              </span>
              <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-600">
                <ChevronRight size={18} />
              </button>
              <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="ml-1 px-3 py-1.5 text-xs font-semibold bg-[#800000] text-white rounded-lg hover:bg-[#660000]">
                Hoje
              </button>
            </div>
          </div>

          {/* Grid */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <div style={{ minWidth: '680px' }}>
                {/* Day headers */}
                <div className="grid border-b-2 border-gray-200" style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}>
                  <div className="border-r border-gray-100" />
                  {days.map(({ label, date, dateStr }) => {
                    const bloqueado = isDiaIndisponivel(dateStr);
                    return (
                      <button key={dateStr}
                        onClick={() => setModalDia({ dateStr, label: format(date, "EEE, dd 'de' MMM", { locale: ptBR }) })}
                        className={`py-2.5 text-center border-r border-gray-100 last:border-r-0 transition-colors group ${
                          bloqueado ? 'bg-gray-50' : isToday(date) ? 'bg-[#fff5f5]' : 'hover:bg-[#F9F9F9]'
                        }`}>
                        <p className={`text-[11px] font-medium uppercase flex items-center justify-center gap-1 ${bloqueado ? 'text-gray-300' : 'text-gray-400'}`}>
                          {label}
                          {bloqueado && <Lock size={8} className="opacity-60" />}
                        </p>
                        <p className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full mx-auto ${
                          bloqueado ? 'text-gray-300' : isToday(date) ? 'bg-[#800000] text-white' : 'text-gray-800'
                        }`}>
                          {format(date, 'd')}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Turnos */}
                {TURNOS.map((turno, ti) => (
                  <React.Fragment key={turno.label}>
                    <div className={`grid border-b border-gray-200 ${turno.bg}`}
                      style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}>
                      <div className="col-span-7 px-3 py-1">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">{turno.label}</span>
                      </div>
                    </div>
                    {turno.slots.map((horario) => (
                      <div key={horario} className="grid border-b border-gray-100"
                        style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}>
                        <div className="px-2 py-2 border-r border-gray-100 flex items-start justify-center pt-2.5">
                          <span className="text-[11px] font-semibold text-gray-400">{horario}</span>
                        </div>
                        {days.map(({ date, dateStr }) => {
                          const items = getCell(dateStr, horario);
                          const bloqueado = isDiaIndisponivel(dateStr);
                          return (
                            <div key={dateStr}
                              className={`p-1 border-r border-gray-100 last:border-r-0 min-h-[48px] ${
                                bloqueado ? 'bg-gray-50' : isToday(date) ? 'bg-[#fff9f9]' : ''
                              }`}>
                              {bloqueado ? null : items.map(c => {
                                const pac = pacientes.find(p => p.id === c.pacienteId);
                                if (!pac) return null;
                                const cls = STATUS_CARD[c.status] || STATUS_CARD['Realizado'];
                                return (
                                  <button key={c.id} onClick={() => abrirPopup(c)}
                                    className={`w-full text-left rounded px-1.5 py-1 mb-1 border-l-2 text-[11px] leading-tight hover:brightness-95 transition-all ${cls}`}>
                                    <div className="flex items-center gap-1 min-w-0">
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT[c.dupla] || 'bg-gray-400'}`} />
                                      <span className="font-semibold truncate">{pac.nome.split(' ')[0]}</span>
                                    </div>
                                    <p className="text-[10px] opacity-70 truncate pl-2.5">{c.status}</p>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    {ti < TURNOS.length - 1 && (
                      <div className="grid border-b-2 border-gray-300"
                        style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popup compartilhado */}
      {popup && (
        <Popup
          consulta={popup.consulta}
          paciente={popup.paciente}
          nomes={nomes}
          onClose={() => setPopup(null)}
          onWhatsApp={() => handleWhatsApp(popup.paciente, popup.consulta)}
          onProntuario={() => { setPopup(null); navigate(`/pacientes/${popup.paciente.id}`, { state: { from: 'agenda' } }); }}
          onStatusChange={handleStatusChange}
        />
      )}

      {/* Modal de bloqueio */}
      <ModalBloqueio />
    </>
  );
};
