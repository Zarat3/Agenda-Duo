import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { Calendar as CalendarIcon, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TURNOS_HORARIOS = [
  { label: 'Manhã (08:00 – 11:20)',  slots: ['08:00', '09:00', '10:00', '11:00'] },
  { label: 'Tarde (13:00 – 16:20)',  slots: ['13:00', '14:00', '15:00', '16:00'] },
  { label: 'Noite (16:20 – 19:40)',  slots: ['16:20', '17:20', '18:20'] },
];

export const Agendamento = () => {
  const { pacientes, addConsulta, nomes } = useAppData();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    pacienteId: '',
    data: '',
    horario: '',
    dupla: 'Estudante A',
    status: 'Pendente',
    queixa_principal: '',
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
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <CalendarIcon className="text-[#800000]" />
          Novo Agendamento
        </h2>

        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium">{erro}</p>
          </div>
        )}

        {sucesso && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
            <CheckCircle className="shrink-0 mt-0.5" size={18} />
            <p className="text-sm font-medium">Agendamento realizado com sucesso! Redirecionando...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
            <select 
              required
              value={form.pacienteId}
              onChange={e => setForm({...form, pacienteId: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
            >
              <option value="">Selecione um paciente</option>
              {pacientes.map(p => (
                <option key={p.id} value={p.id}>{p.nome} - {p.telefone}</option>
              ))}
            </select>
            {pacientes.length === 0 && (
              <p className="text-xs text-orange-500 mt-1">Cadastre um paciente primeiro.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input 
                type="date"
                required
                value={form.data}
                onChange={e => setForm({...form, data: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horário *</label>
              <select 
                required
                value={form.horario}
                onChange={e => setForm({...form, horario: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsável (Dupla) *</label>
              <select 
                value={form.dupla}
                onChange={e => setForm({...form, dupla: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
              >
                <option value="Estudante A">{nomes.estudanteA}</option>
                <option value="Estudante B">{nomes.estudanteB}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status Inicial</label>
              <select 
                value={form.status}
                onChange={e => setForm({...form, status: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
              >
                <option value="Pendente">Pendente</option>
                <option value="Confirmado">Confirmado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Queixa Principal <span className="text-gray-400 font-normal">(opcional)</span></label>
            <input
              type="text"
              value={form.queixa_principal}
              onChange={e => setForm({...form, queixa_principal: e.target.value})}
              placeholder="Ex: Dor no dente 36, Avaliação inicial, Restauração..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observações <span className="text-gray-400 font-normal">(opcional)</span></label>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={e => setForm({...form, descricao: e.target.value})}
              placeholder="Ex: Paciente relatou dor no molar direito. Necessário raio-x..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] resize-none"
            />
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={pacientes.length === 0 || salvando}
              className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
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
