import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, PlusCircle, Clock, AlertCircle } from 'lucide-react';

const STATUS_BADGE = {
  'Confirmado': 'bg-[#D8F3DC] text-[#2D6A4F]',
  'Pendente':   'bg-[#FFF3CD] text-[#7A5800]',
  'Cancelado':  'bg-[#FDECEA] text-[#C94C4C]',
  'Realizado':  'bg-gray-100  text-gray-500',
};

const DOT = { 'Estudante A': 'bg-blue-500', 'Estudante B': 'bg-purple-500' };

export const Home = () => {
  const { consultas, pacientes, nomes } = useAppData();
  const navigate = useNavigate();

  const hoje = format(new Date(), 'yyyy-MM-dd');
  const hojeDisplay = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  const hora = new Date().getHours();
  const saudacao = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';

  const consultasHoje = consultas
    .filter(c => c.data === hoje)
    .sort((a, b) => a.horario.localeCompare(b.horario));

  const pendentes = consultas.filter(c => c.status === 'Pendente');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd   = endOfWeek(new Date(), { weekStartsOn: 1 });
  const consultasSemana = consultas.filter(c => {
    try { return isWithinInterval(parseISO(c.data), { start: weekStart, end: weekEnd }); }
    catch { return false; }
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Saudação */}
      <div>
        <p className="text-sm text-[#666666] capitalize">{hojeDisplay}</p>
        <h1 className="text-2xl font-extrabold text-[#1A1A1A] mt-0.5">{saudacao}!</h1>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-[#DADADA] shadow-card p-4 text-center">
          <p className="text-3xl font-extrabold text-[#800000]">{consultasHoje.length}</p>
          <p className="text-xs font-semibold text-[#666666] mt-1">Hoje</p>
        </div>

        <button
          onClick={() => navigate('/agenda')}
          className={`rounded-2xl border shadow-card p-4 text-center transition-all ${
            pendentes.length > 0
              ? 'bg-[#FFF3CD] border-[#FFB703]/50 hover:bg-[#fff0b3]'
              : 'bg-white border-[#DADADA] hover:bg-[#F9F9F9]'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <p className={`text-3xl font-extrabold ${pendentes.length > 0 ? 'text-[#7A5800]' : 'text-[#800000]'}`}>
              {pendentes.length}
            </p>
            {pendentes.length > 0 && <AlertCircle size={14} className="text-[#7A5800] mb-1" />}
          </div>
          <p className={`text-xs font-semibold mt-1 ${pendentes.length > 0 ? 'text-[#7A5800]' : 'text-[#666666]'}`}>
            Pendentes
          </p>
        </button>

        <div className="bg-white rounded-2xl border border-[#DADADA] shadow-card p-4 text-center">
          <p className="text-3xl font-extrabold text-[#800000]">{consultasSemana.length}</p>
          <p className="text-xs font-semibold text-[#666666] mt-1">Na semana</p>
        </div>
      </div>

      {/* Consultas de hoje */}
      <div className="bg-white rounded-2xl border border-[#DADADA] shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DADADA]">
          <h2 className="font-bold text-[#1A1A1A] flex items-center gap-2">
            <Clock size={16} className="text-[#800000]" />
            Consultas de Hoje
          </h2>
          <button onClick={() => navigate('/agenda')}
            className="text-xs text-[#800000] font-semibold hover:underline">
            Ver agenda →
          </button>
        </div>

        {consultasHoje.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-3xl mb-3">🦷</p>
            <p className="text-sm font-semibold text-[#1A1A1A]">Nenhuma consulta hoje</p>
            <p className="text-xs text-[#666666] mt-1">Aproveite para planejar a semana!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F5F5F5]">
            {consultasHoje.map(c => {
              const pac = pacientes.find(p => p.id === c.pacienteId);
              if (!pac) return null;
              const nomeDupla = c.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
              const horarioDisplay = c.horario_fim ? `${c.horario} – ${c.horario_fim}` : c.horario;
              return (
                <button
                  key={c.id}
                  onClick={() => navigate(`/pacientes/${pac.id}`, { state: { from: 'agenda' } })}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-[#F9F9F9] transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-[#800000] flex items-center justify-center shrink-0 text-sm font-bold text-white">
                    {pac.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1A1A1A] truncate">{pac.nome}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${DOT[c.dupla] || 'bg-gray-400'}`} />
                      <p className="text-xs text-[#666666]">{horarioDisplay} · {nomeDupla}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${STATUS_BADGE[c.status] || 'bg-gray-100 text-gray-500'}`}>
                    {c.status}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Atalhos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/agendamento')}
          className="bg-[#800000] hover:bg-[#660000] text-white rounded-2xl p-4 flex items-center gap-3 font-semibold transition-colors shadow-card"
        >
          <PlusCircle size={20} />
          Novo Agendamento
        </button>
        <button
          onClick={() => navigate('/agenda')}
          className="bg-white hover:bg-[#F9F9F9] text-[#1A1A1A] rounded-2xl p-4 flex items-center gap-3 font-semibold border border-[#DADADA] transition-colors shadow-card"
        >
          <Calendar size={20} className="text-[#800000]" />
          Ver Agenda
        </button>
      </div>

    </div>
  );
};
