import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TURNOS_BASE = [
  { label: 'Manhã', slots: ['08:00', '09:00', '10:00', '11:00'] },
  { label: 'Tarde', slots: ['13:00', '14:00', '15:00', '16:00'] },
  { label: 'Noite', slots: ['16:20', '17:20', '18:20'] },
];

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] bg-white transition-shadow';
const labelCls = 'block text-sm font-semibold text-[#1A1A1A] mb-1.5';

const getDataBloqueio = (dia) => {
  const data = dia?.data || dia?.date;
  return typeof data === 'string' ? data.slice(0, 10) : '';
};

const HorarioPicker = ({ inicio, fim, onConfirm, onClose, horariosAtivos }) => {
  const TURNOS_HORARIOS = TURNOS_BASE.map(t => ({
    ...t, slots: t.slots.filter(s => !horariosAtivos || horariosAtivos.includes(s)),
  })).filter(t => t.slots.length > 0);

  const getTurnoIdx = (slot) => TURNOS_HORARIOS.findIndex(t => t.slots.includes(slot));

  const [tempStart, setTempStart] = useState(inicio || '');
  const [tempEnd, setTempEnd]     = useState(fim || '');

  const handleSlot = (slot) => {
    if (!tempStart) {
      setTempStart(slot); setTempEnd(''); return;
    }
    if (slot === tempStart && !tempEnd) {
      setTempStart(''); return;
    }
    const turnoStart = getTurnoIdx(tempStart);
    const turnoSlot  = getTurnoIdx(slot);
    if (turnoSlot !== turnoStart) {
      setTempStart(slot); setTempEnd(''); return;
    }
    const turno   = TURNOS_HORARIOS[turnoStart];
    const idxS    = turno.slots.indexOf(tempStart);
    const idxSlot = turno.slots.indexOf(slot);
    if (idxSlot > idxS) { setTempEnd(slot); }
    else { setTempStart(slot); setTempEnd(''); }
  };

  const isInRange = (slot) => {
    if (!tempStart) return false;
    if (!tempEnd)   return slot === tempStart;
    const turno = TURNOS_HORARIOS[getTurnoIdx(tempStart)];
    if (!turno) return false;
    const idxS   = turno.slots.indexOf(tempStart);
    const idxE   = turno.slots.indexOf(tempEnd);
    const idxCur = turno.slots.indexOf(slot);
    return idxCur >= idxS && idxCur <= idxE;
  };

  const label = tempStart
    ? (tempEnd ? `${tempStart} – ${tempEnd}` : tempStart)
    : '';

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-[#DADADA] p-5 w-full max-w-sm"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-[#1A1A1A]">Selecione o horário</h3>
          <button type="button" onClick={onClose} className="text-[#666666] hover:text-[#1A1A1A]">
            <X size={18} />
          </button>
        </div>
        <p className="text-xs text-[#666666] mb-4">
          Toque em um slot para início. Toque em outro do mesmo turno para definir o fim do bloco.
        </p>

        {TURNOS_HORARIOS.map(turno => (
          <div key={turno.label} className="mb-4">
            <p className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-2">{turno.label}</p>
            <div className="flex flex-wrap gap-2">
              {turno.slots.map(slot => {
                const inRange  = isInRange(slot);
                const isStart  = slot === tempStart;
                const isEnd    = slot === tempEnd;
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleSlot(slot)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                      isStart || isEnd
                        ? 'bg-[#800000] border-[#800000] text-white'
                        : inRange
                          ? 'bg-[#800000]/15 border-[#800000]/30 text-[#800000]'
                          : 'bg-white border-[#DADADA] text-[#666666] hover:border-[#800000] hover:text-[#800000]'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {label && (
          <div className="bg-[#800000]/5 border border-[#800000]/20 rounded-xl px-4 py-2.5 mb-4 text-center">
            <p className="text-sm font-bold text-[#800000]">{label}</p>
          </div>
        )}

        <button
          type="button"
          disabled={!tempStart}
          onClick={() => { onConfirm(tempStart, tempEnd || ''); onClose(); }}
          className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
};

export const Agendamento = () => {
  const { pacientes, addConsulta, nomes, configuracoes, diasBloqueados, feriadosNacionais } = useAppData();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    pacienteId: '',
    data: '',
    horario: '',
    horario_fim: '',
    dupla: 'Estudante A',
    status: 'Pendente',
    clinica: '',
    descricao: '',
  });

  const [pickerAberto, setPickerAberto] = useState(false);
  const [erro, setErro]     = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const horarioLabel = form.horario
    ? (form.horario_fim ? `${form.horario} – ${form.horario_fim}` : form.horario)
    : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro(''); setSucesso(false);

    if (!form.pacienteId || !form.data || !form.horario) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    if (diasBloqueados.some(d => getDataBloqueio(d) === form.data)) {
      setErro('Este dia está bloqueado para agendamentos. Escolha outra data.');
      return;
    }
    if (feriadosNacionais.some(f => f.date === form.data)) {
      setErro('Esta data é um feriado nacional. Escolha outra data.');
      return;
    }
    if (form.data) {
      try {
        const jsDay = new Date(form.data + 'T12:00:00').getDay();
        const day = jsDay === 0 ? 7 : jsDay;
        if (!configuracoes.diasAtivos.includes(day)) {
          setErro('A dupla não atende neste dia da semana. Escolha outra data.');
          return;
        }
      } catch {}
    }

    setSalvando(true);
    try {
      await addConsulta(form);
      setSucesso(true);
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-card border border-[#DADADA]">
        <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-6 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#800000]/10 flex items-center justify-center">
            <CalendarIcon size={18} className="text-[#800000]" />
          </span>
          Novo Agendamento
        </h2>

        {erro && (
          <div className="mb-5 p-4 bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C] rounded-xl flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-semibold">{erro}</p>
          </div>
        )}
        {sucesso && (
          <div className="mb-5 p-4 bg-[#D8F3DC] border border-[#2D6A4F]/30 text-[#2D6A4F] rounded-xl flex items-start gap-3">
            <CheckCircle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-semibold">Agendamento realizado com sucesso! Redirecionando...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Paciente *</label>
            <select
              required
              value={form.pacienteId}
              onChange={e => {
                if (e.target.value === '__novo__') navigate('/pacientes/novo');
                else setForm({ ...form, pacienteId: e.target.value });
              }}
              className={inputCls}
            >
              <option value="">Selecione um paciente</option>
              <option value="__novo__">+ Cadastrar novo paciente</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Data *</label>
              <input
                type="date"
                required
                value={form.data}
                onChange={e => setForm({ ...form, data: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Horário *</label>
              <button
                type="button"
                onClick={() => setPickerAberto(true)}
                className={`${inputCls} flex items-center justify-between text-left ${!horarioLabel ? 'text-[#AAAAAA]' : ''}`}
              >
                <span>{horarioLabel || 'Selecione'}</span>
                <Clock size={16} className="text-[#800000] shrink-0" />
              </button>
            </div>
          </div>

          {configuracoes.clinicasAtivas?.length > 0 && (
            <div>
              <label className={labelCls}>Clínica</label>
              <select
                value={form.clinica}
                onChange={e => setForm({ ...form, clinica: e.target.value })}
                className={inputCls}
              >
                <option value="">Selecione (opcional)</option>
                {configuracoes.clinicasAtivas.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Responsável (Dupla) *</label>
              <select
                value={form.dupla}
                onChange={e => setForm({ ...form, dupla: e.target.value })}
                className={inputCls}
              >
                <option value="Estudante A">{nomes.estudanteA}</option>
                <option value="Estudante B">{nomes.estudanteB}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Status Inicial</label>
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className={inputCls}
              >
                <option value="Pendente">Pendente</option>
                <option value="Confirmado">Confirmado</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>Observações do Agendamento <span className="text-[#666666] font-normal">(opcional)</span></label>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              placeholder="Ex: Paciente solicitou horário matutino, confirmação por WhatsApp..."
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="pt-4 border-t border-[#DADADA]">
            <button
              type="submit"
              disabled={pacientes.length === 0 || salvando}
              className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-card"
            >
              <CheckCircle size={18} />
              {salvando ? 'Salvando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>

      {pickerAberto && (
        <HorarioPicker
          inicio={form.horario}
          fim={form.horario_fim}
          horariosAtivos={configuracoes.horariosAtivos}
          onConfirm={(h, hf) => setForm(f => ({ ...f, horario: h, horario_fim: hf }))}
          onClose={() => setPickerAberto(false)}
        />
      )}
    </div>
  );
};
