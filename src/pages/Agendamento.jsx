import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TURNOS_HORARIOS = [
  { label: 'Manhã (08:00 – 11:20)',  slots: ['08:00', '09:00', '10:00', '11:00'] },
  { label: 'Tarde (13:00 – 16:20)',  slots: ['13:00', '14:00', '15:00', '16:00'] },
  { label: 'Noite (16:20 – 19:40)',  slots: ['16:20', '17:20', '18:20'] },
];

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] bg-white transition-shadow';
const labelCls = 'block text-sm font-semibold text-[#1A1A1A] mb-1.5';

export const Agendamento = () => {
  const { pacientes, addConsulta, nomes, diasBloqueados } = useAppData();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    pacienteId: '',
    data: '',
    horario: '',
    dupla: 'Estudante A',
    status: 'Pendente',
    descricao: '',
  });

  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso(false);

    if (!form.pacienteId || !form.data || !form.horario) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (diasBloqueados.some(d => d.data === form.data)) {
      setErro('Este dia está bloqueado para agendamentos. Escolha outra data.');
      return;
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
                if (e.target.value === '__novo__') {
                  navigate('/pacientes/novo');
                } else {
                  setForm({...form, pacienteId: e.target.value});
                }
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
                onChange={e => setForm({...form, data: e.target.value})}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Horário *</label>
              <select
                required
                value={form.horario}
                onChange={e => setForm({...form, horario: e.target.value})}
                className={inputCls}
              >
                <option value="">Selecione</option>
                {TURNOS_HORARIOS.map(turno => (
                  <optgroup key={turno.label} label={turno.label}>
                    {turno.slots.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Responsável (Dupla) *</label>
              <select
                value={form.dupla}
                onChange={e => setForm({...form, dupla: e.target.value})}
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
                onChange={e => setForm({...form, status: e.target.value})}
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
              onChange={e => setForm({...form, descricao: e.target.value})}
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
    </div>
  );
};
