import React, { useState } from 'react';
import { Download, ChevronLeft, ChevronRight, Calendar, FileText, User } from 'lucide-react';
import { format, parseISO, addDays, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppData } from '../context/AppDataContext';
import {
  exportAgendaCSV, exportAgendaPDF, exportAgendaPNG,
  exportFichaCSV, exportFichaPDF, exportFichaPNG,
  exportProntuarioCSV, exportProntuarioPDF, exportProntuarioPNG,
} from '../lib/exportar';

const TIPOS = [
  { id: 'agenda',     label: 'Agenda',     Icon: Calendar  },
  { id: 'ficha',      label: 'Ficha',      Icon: FileText  },
  { id: 'prontuario', label: 'Prontuário', Icon: User      },
];

const FORMATOS = ['CSV', 'PDF', 'PNG'];

const sectionTitle = 'text-xs font-bold text-[#666666] uppercase tracking-widest mb-3 flex items-center gap-2';

export const ExportarSection = () => {
  const { consultas, pacientes, plano, nomes, configuracoes } = useAppData();

  const [tipo, setTipo]           = useState('agenda');
  const [formato, setFormato]     = useState('CSV');
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [pacienteId, setPacienteId]   = useState('');
  const [consultaId, setConsultaId]   = useState('');
  const [baixando, setBaixando]   = useState(false);
  const [erro, setErro]           = useState('');

  const weekDates = Array.from({ length: 6 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
  const semanaLabel = `${format(weekStart, "dd 'de' MMM", { locale: ptBR })} — ${format(addDays(weekStart, 5), "dd 'de' MMM", { locale: ptBR })}`;
  const consultasSemana = consultas.filter(c => weekDates.includes(c.data)).length;

  const pacienteSelecionado = pacientes.find(p => p.id === pacienteId);
  const consultasPaciente   = consultas
    .filter(c => c.pacienteId === pacienteId)
    .sort((a, b) => b.data.localeCompare(a.data));
  const planoPaciente       = plano.filter(p => p.paciente_id === pacienteId);
  const consultaSelecionada = consultas.find(c => c.id === consultaId);

  const podeExportar = () => {
    if (tipo === 'agenda')     return consultasSemana > 0;
    if (tipo === 'ficha')      return !!pacienteId && !!consultaId;
    if (tipo === 'prontuario') return !!pacienteId;
    return false;
  };

  const handleExportar = async () => {
    setBaixando(true);
    setErro('');
    try {
      const args = { consultas, pacientes, nomes, weekStart, configuracoes };
      if (tipo === 'agenda') {
        if (formato === 'CSV') exportAgendaCSV(args);
        else if (formato === 'PDF') exportAgendaPDF(args);
        else await exportAgendaPNG(args);
      } else if (tipo === 'ficha' && pacienteSelecionado && consultaSelecionada) {
        if (formato === 'CSV') exportFichaCSV(consultaSelecionada, pacienteSelecionado, nomes);
        else if (formato === 'PDF') exportFichaPDF(consultaSelecionada, pacienteSelecionado, nomes, configuracoes);
        else await exportFichaPNG(consultaSelecionada, pacienteSelecionado, nomes, configuracoes);
      } else if (tipo === 'prontuario' && pacienteSelecionado) {
        if (formato === 'CSV') exportProntuarioCSV(pacienteSelecionado, consultasPaciente, planoPaciente, nomes);
        else if (formato === 'PDF') exportProntuarioPDF(pacienteSelecionado, consultasPaciente, planoPaciente, nomes, configuracoes);
        else await exportProntuarioPNG(pacienteSelecionado, consultasPaciente, planoPaciente, nomes, configuracoes);
      }
    } catch (e) {
      setErro('Erro ao gerar arquivo. Tente novamente.');
      console.error(e);
    } finally {
      setBaixando(false);
    }
  };

  return (
    <div>
      <p className={sectionTitle}><Download size={13} /> Exportar Registro</p>

      <div className="bg-[#F9F9F9] border border-[#DADADA] rounded-xl p-4 space-y-4">

        {/* Tipo */}
        <div>
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">O que exportar</p>
          <div className="flex gap-1.5">
            {TIPOS.map(({ id, label }) => (
              <button key={id} onClick={() => { setTipo(id); setPacienteId(''); setConsultaId(''); }}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  tipo === id
                    ? 'bg-[#800000] border-[#800000] text-white'
                    : 'bg-white border-[#DADADA] text-[#666666]'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Semana (Agenda) */}
        {tipo === 'agenda' && (
          <div>
            <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">Semana</p>
            <div className="flex items-center justify-between">
              <button onClick={() => setWeekStart(w => subWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-[#E8E8E8] text-[#666666] transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-semibold text-[#1A1A1A] capitalize">{semanaLabel}</span>
              <button onClick={() => setWeekStart(w => addWeeks(w, 1))}
                className="p-1.5 rounded-lg hover:bg-[#E8E8E8] text-[#666666] transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
            {consultasSemana === 0 && (
              <p className="text-[11px] text-[#999999] text-center mt-1">Nenhuma consulta nessa semana</p>
            )}
            {consultasSemana > 0 && (
              <p className="text-[11px] text-[#666666] text-center mt-1">{consultasSemana} consulta{consultasSemana > 1 ? 's' : ''}</p>
            )}
          </div>
        )}

        {/* Paciente (Ficha ou Prontuário) */}
        {(tipo === 'ficha' || tipo === 'prontuario') && (
          <div>
            <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">Paciente</p>
            <select
              value={pacienteId}
              onChange={e => { setPacienteId(e.target.value); setConsultaId(''); }}
              className="w-full border border-[#DADADA] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#800000] bg-white text-[#1A1A1A]">
              <option value="">Selecione um paciente...</option>
              {[...pacientes].sort((a, b) => a.nome.localeCompare(b.nome)).map(p => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Consulta (Ficha) */}
        {tipo === 'ficha' && pacienteId && (
          <div>
            <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">Consulta</p>
            {consultasPaciente.length === 0 ? (
              <p className="text-xs text-[#999999]">Nenhuma consulta para este paciente.</p>
            ) : (
              <select
                value={consultaId}
                onChange={e => setConsultaId(e.target.value)}
                className="w-full border border-[#DADADA] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#800000] bg-white text-[#1A1A1A]">
                <option value="">Selecione uma consulta...</option>
                {consultasPaciente.map(c => {
                  let dataFmt = c.data;
                  try { dataFmt = format(parseISO(c.data), 'dd/MM/yyyy'); } catch {}
                  const horario = c.horario_fim ? `${c.horario} – ${c.horario_fim}` : c.horario;
                  return (
                    <option key={c.id} value={c.id}>
                      {dataFmt} · {horario} · {c.status}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        )}

        {/* Formato */}
        <div>
          <p className="text-[11px] font-semibold text-[#999999] uppercase tracking-wider mb-2">Formato</p>
          <div className="flex gap-1.5">
            {FORMATOS.map(f => (
              <button key={f} onClick={() => setFormato(f)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  formato === f
                    ? 'bg-[#800000] border-[#800000] text-white'
                    : 'bg-white border-[#DADADA] text-[#666666]'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {erro && <p className="text-xs text-[#C94C4C]">{erro}</p>}

        {/* Botão */}
        <button
          onClick={handleExportar}
          disabled={!podeExportar() || baixando}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold bg-[#800000] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#660000] transition-colors">
          <Download size={15} />
          {baixando ? 'Gerando...' : `Baixar ${formato}`}
        </button>

      </div>
    </div>
  );
};
