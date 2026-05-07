import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { UserPlus, AlertTriangle, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';

const CHIPS_ALERTAS = ['Hipertensão', 'Diabetes', 'Alergia a medicamentos', 'Cardiopatia', 'Coagulopatia', 'Gestante'];

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] bg-white transition-shadow';
const labelCls = 'block text-sm font-semibold text-[#1A1A1A] mb-1.5';

export const NovoPaciente = () => {
  const { addPaciente } = useAppData();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nome: '', telefone: '', idade: '', alertas: '' });
  const [chipsAtivos, setChipsAtivos] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const toggleChip = (chip) => {
    setChipsAtivos(prev => {
      const nova = prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip];
      const extras = form.alertas.split(',').map(s => s.trim()).filter(s => !CHIPS_ALERTAS.includes(s) && s);
      setForm(f => ({ ...f, alertas: [...nova, ...extras].join(', ') }));
      return nova;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nome || !form.telefone || !form.idade) return;
    setErro('');
    setSalvando(true);
    try {
      const novo = await addPaciente({ ...form, idade: Number(form.idade) });
      navigate(`/pacientes/${novo.id}`, { replace: true });
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* Voltar */}
      <button
        onClick={() => navigate('/pacientes')}
        className="flex items-center gap-1.5 text-sm font-semibold text-[#666666] hover:text-[#800000] mb-5 transition-colors"
      >
        <ChevronLeft size={16} />
        Voltar para Pacientes
      </button>

      <div className="bg-white rounded-2xl shadow-card border border-[#DADADA] p-6 md:p-8">
        <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-6 flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-[#800000]/10 flex items-center justify-center">
            <UserPlus size={18} className="text-[#800000]" />
          </span>
          Novo Paciente
        </h2>

        {erro && (
          <div className="mb-5 p-4 bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C] rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelCls}>Nome Completo *</label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
              placeholder="Ex: Maria da Silva"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Telefone (WhatsApp) *</label>
              <input
                type="text"
                required
                placeholder="(00) 00000-0000"
                value={form.telefone}
                onChange={e => setForm({ ...form, telefone: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Idade *</label>
              <input
                type="number"
                required
                min="1"
                value={form.idade}
                onChange={e => setForm({ ...form, idade: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              <span className="flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-500" />
                Alertas de Saúde
                <span className="text-[#666666] font-normal">(opcional)</span>
              </span>
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {CHIPS_ALERTAS.map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => toggleChip(chip)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-semibold transition-colors ${
                    chipsAtivos.includes(chip)
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : 'bg-white border-[#DADADA] text-[#666666] hover:border-amber-400'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Outros alertas..."
              value={form.alertas}
              onChange={e => setForm({ ...form, alertas: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="pt-4 border-t border-[#DADADA]">
            <button
              type="submit"
              disabled={salvando}
              className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-card"
            >
              <CheckCircle size={18} />
              {salvando ? 'Salvando...' : 'Cadastrar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
