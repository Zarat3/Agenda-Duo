import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import {
  ChevronLeft, ChevronRight, X,
  Phone, MessageCircle, FileText, AlertTriangle,
} from 'lucide-react';
import { startOfWeek, addDays, addWeeks, subWeeks, isToday, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TURNOS = [
  { label: 'Manhã',  slots: ['08:00', '09:00', '10:00', '11:00'], bg: 'bg-blue-50'   },
  { label: 'Tarde',  slots: ['13:00', '14:00', '15:00', '16:00'], bg: 'bg-orange-50' },
  { label: 'Noite',  slots: ['16:20', '17:00', '17:20', '18:20'], bg: 'bg-indigo-50' },
];

const STATUS_CARD = {
  'Confirmado': 'border-green-400  bg-green-50  text-green-800',
  'Pendente':   'border-yellow-400 bg-yellow-50 text-yellow-800',
  'Cancelado':  'border-red-400    bg-red-50    text-red-700 opacity-60',
  'Realizado':  'border-gray-400   bg-gray-50   text-gray-600',
};

const STATUS_BADGE = {
  'Confirmado': 'bg-green-100  text-green-700',
  'Pendente':   'bg-yellow-100 text-yellow-700',
  'Cancelado':  'bg-red-100    text-red-700',
  'Realizado':  'bg-gray-100   text-gray-600',
};

const DOT = { 'Estudante A': 'bg-blue-500', 'Estudante B': 'bg-purple-500' };
const DIAS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const Dashboard = () => {
  const { consultas, pacientes, nomes, updateConsultaStatus } = useAppData();
  const navigate = useNavigate();

  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [filtro, setFiltro] = useState({ 'Estudante A': true, 'Estudante B': true });
  const [popup, setPopup] = useState(null); // { consulta, paciente }

  const days = DIAS.map((label, i) => {
    const date = addDays(weekStart, i);
    return { label, date, dateStr: format(date, 'yyyy-MM-dd') };
  });

  const weekLabel = `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} — ${format(addDays(weekStart, 5), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}`;

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
    const text = `Olá ${pac.nome}, confirmamos sua consulta na clínica da Univassouras para o dia ${dataFmt} às ${c.horario}. Podemos confirmar?`;
    const num = pac.telefone.replace(/\D/g, '');
    window.open(`https://wa.me/55${num}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const estudantes = [
    { key: 'Estudante A', nome: nomes.estudanteA, dot: 'bg-blue-500'   },
    { key: 'Estudante B', nome: nomes.estudanteB, dot: 'bg-purple-500' },
  ];

  return (
    <div className="flex gap-5 max-w-[1400px] mx-auto">

      {/* ── Sidebar ─────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-4 w-48 shrink-0">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Estudantes</p>
          <div className="space-y-1.5">
            {estudantes.map(({ key, nome, dot }) => (
              <button key={key} onClick={() => toggleFiltro(key)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  filtro[key] ? 'bg-gray-100 text-gray-800' : 'text-gray-400 opacity-50'
                }`}>
                <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${filtro[key] ? dot : 'bg-gray-300'}`} />
                {nome}
              </button>
            ))}
          </div>

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

      {/* ── Main ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">

        {/* Header */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex lg:hidden gap-2">
            {estudantes.map(({ key, nome, dot }) => (
              <button key={key} onClick={() => toggleFiltro(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  filtro[key] ? 'border-gray-400 bg-white text-gray-700' : 'border-gray-200 text-gray-400 opacity-50'
                }`}>
                <span className={`w-2 h-2 rounded-sm ${filtro[key] ? dot : 'bg-gray-300'}`} />
                {nome}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-gray-700 whitespace-nowrap select-none">
              {weekLabel}
            </span>
            <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
              className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-600">
              <ChevronRight size={18} />
            </button>
            <button onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="ml-1 px-3 py-1.5 text-xs font-semibold bg-[#800000] text-white rounded-lg hover:bg-[#660000] transition-colors">
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
                {days.map(({ label, date, dateStr }) => (
                  <div key={dateStr}
                    className={`py-2.5 text-center border-r border-gray-100 last:border-r-0 ${isToday(date) ? 'bg-[#fff5f5]' : ''}`}>
                    <p className="text-[11px] font-medium text-gray-400 uppercase">{label}</p>
                    <p className={`text-sm font-bold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full mx-auto ${
                      isToday(date) ? 'bg-[#800000] text-white' : 'text-gray-800'
                    }`}>
                      {format(date, 'd')}
                    </p>
                  </div>
                ))}
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
                    <div key={horario} className="grid border-b border-gray-100 last:border-b-0"
                      style={{ gridTemplateColumns: '64px repeat(6, 1fr)' }}>
                      <div className="px-2 py-2 border-r border-gray-100 flex items-start justify-center pt-2.5">
                        <span className="text-[11px] font-semibold text-gray-400">{horario}</span>
                      </div>
                      {days.map(({ date, dateStr }) => {
                        const items = getCell(dateStr, horario);
                        return (
                          <div key={dateStr}
                            className={`p-1 border-r border-gray-100 last:border-r-0 min-h-[48px] ${isToday(date) ? 'bg-[#fff9f9]' : ''}`}>
                            {items.map(c => {
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

      {/* ── Popup consulta ───────────────────────────── */}
      {popup && (() => {
        const { consulta: c, paciente: pac } = popup;
        const nomeDupla = c.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
        const dotColor = DOT[c.dupla] || 'bg-gray-400';
        let dataFmt = c.data;
        try { dataFmt = format(parseISO(c.data), "EEE, dd 'de' MMMM", { locale: ptBR }); } catch {}
        const iniciais = pac.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
        const alertas = pac.alertas ? pac.alertas.split(',').map(s => s.trim()).filter(Boolean) : [];

        return (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
            onClick={() => setPopup(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm"
              onClick={e => e.stopPropagation()}>

              {/* Header do paciente */}
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
                <button onClick={() => setPopup(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors mt-0.5 shrink-0">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Alertas */}
                {alertas.length > 0 && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                    <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-800">{alertas.join(' · ')}</p>
                  </div>
                )}

                {/* Info da consulta */}
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

                {/* Status */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Status da consulta</p>
                  <select
                    value={c.status}
                    onChange={e => {
                      updateConsultaStatus(c.id, e.target.value).catch(console.error);
                      setPopup(prev => prev ? { ...prev, consulta: { ...prev.consulta, status: e.target.value } } : null);
                    }}
                    className={`w-full text-sm font-semibold px-3 py-2 rounded-xl border outline-none cursor-pointer ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-600'}`}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Confirmado">Confirmado</option>
                    <option value="Cancelado">Cancelado</option>
                    <option value="Realizado">Realizado</option>
                  </select>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleWhatsApp(pac, c)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                  <button
                    onClick={() => { setPopup(null); navigate(`/pacientes/${pac.id}`, { state: { from: 'agenda' } }); }}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-[#800000] hover:bg-[#660000] text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                    <FileText size={15} /> Prontuário
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
