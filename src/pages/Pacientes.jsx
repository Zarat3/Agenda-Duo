import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Search, UserPlus, AlertTriangle, ChevronRight } from 'lucide-react';

const CHIPS_ALERTAS = ['Hipertensão', 'Diabetes', 'Alergia a medicamentos', 'Cardiopatia', 'Coagulopatia', 'Gestante'];

export const Pacientes = () => {
  const { pacientes, addPaciente } = useAppData();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [novoPaciente, setNovoPaciente] = useState({ nome: '', telefone: '', idade: '', alertas: '' });
  const [chipsAtivos, setChipsAtivos] = useState([]);

  const toggleChip = (chip) => {
    setChipsAtivos(prev => {
      const nova = prev.includes(chip) ? prev.filter(c => c !== chip) : [...prev, chip];
      const extras = novoPaciente.alertas.split(',').map(s => s.trim()).filter(s => !CHIPS_ALERTAS.includes(s) && s);
      setNovoPaciente(p => ({ ...p, alertas: [...nova, ...extras].join(', ') }));
      return nova;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!novoPaciente.nome || !novoPaciente.telefone || !novoPaciente.idade) return;
    setErro('');
    setSalvando(true);
    try {
      await addPaciente({ ...novoPaciente, idade: Number(novoPaciente.idade) });
      setNovoPaciente({ nome: '', telefone: '', idade: '', alertas: '' });
      setChipsAtivos([]);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) || p.telefone.includes(busca)
  );

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

      {/* Formulário de Cadastro */}
      <div className="lg:col-span-1">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <UserPlus className="text-[#800000]" />
            Novo Paciente
          </h2>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{erro}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
              <input type="text" required
                value={novoPaciente.nome}
                onChange={e => setNovoPaciente({ ...novoPaciente, nome: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefone (WhatsApp)</label>
              <input type="text" required placeholder="(00) 00000-0000"
                value={novoPaciente.telefone}
                onChange={e => setNovoPaciente({ ...novoPaciente, telefone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
              <input type="number" required min="1"
                value={novoPaciente.idade}
                onChange={e => setNovoPaciente({ ...novoPaciente, idade: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                <AlertTriangle size={13} className="text-amber-500" />
                Alertas de Saúde <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {CHIPS_ALERTAS.map(chip => (
                  <button key={chip} type="button" onClick={() => toggleChip(chip)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      chipsAtivos.includes(chip)
                        ? 'bg-amber-500 border-amber-500 text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-amber-400'
                    }`}>
                    {chip}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Outros alertas..."
                value={novoPaciente.alertas}
                onChange={e => setNovoPaciente({ ...novoPaciente, alertas: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
              />
            </div>

            <button type="submit" disabled={salvando}
              className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors mt-2">
              {salvando ? 'Salvando...' : 'Cadastrar Paciente'}
            </button>
          </form>
        </div>
      </div>

      {/* Lista de Pacientes */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Lista de Pacientes</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input type="text" placeholder="Buscar paciente..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 text-sm">
                  <th className="pb-3 font-medium">Nome</th>
                  <th className="pb-3 font-medium">Telefone</th>
                  <th className="pb-3 font-medium">Idade</th>
                  <th className="pb-3 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-400 text-sm">
                      Nenhum paciente encontrado.
                    </td>
                  </tr>
                ) : (
                  pacientesFiltrados.map(p => (
                    <tr key={p.id}
                      onClick={() => navigate(`/pacientes/${p.id}`)}
                      className="border-b border-gray-100 hover:bg-[#fff5f5] transition-colors cursor-pointer group"
                    >
                      <td className="py-3 font-medium text-[#800000]">
                        <span className="flex items-center gap-1.5">
                          {p.alertas && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                          {p.nome}
                        </span>
                      </td>
                      <td className="py-3 text-gray-600 text-sm">{p.telefone}</td>
                      <td className="py-3 text-gray-600 text-sm">{p.idade} anos</td>
                      <td className="py-3">
                        <ChevronRight size={15} className="text-gray-300 group-hover:text-[#800000] transition-colors" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
