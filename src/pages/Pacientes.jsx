import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { Search, UserPlus, AlertTriangle, ChevronRight } from 'lucide-react';

export const Pacientes = () => {
  const { pacientes } = useAppData();
  const navigate = useNavigate();
  const [busca, setBusca] = useState('');

  const pacientesFiltrados = pacientes.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) || p.telefone.includes(busca)
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-card border border-[#DADADA]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#DADADA]">
          <div>
            <h2 className="text-lg font-extrabold text-[#1A1A1A]">Pacientes</h2>
            <p className="text-sm text-[#666666] mt-0.5">{pacientes.length} cadastrado{pacientes.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" size={15} />
              <input
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#DADADA] rounded-xl outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-sm w-40 md:w-56 text-[#1A1A1A]"
              />
            </div>
            <button
              onClick={() => navigate('/pacientes/novo')}
              className="flex items-center gap-2 bg-[#800000] hover:bg-[#660000] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-card whitespace-nowrap"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Novo Paciente</span>
            </button>
          </div>
        </div>

        {/* Lista */}
        <div className="divide-y divide-[#DADADA]">
          {pacientesFiltrados.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-[#666666] text-sm">
                {busca ? 'Nenhum paciente encontrado.' : 'Nenhum paciente cadastrado ainda.'}
              </p>
              {!busca && (
                <button
                  onClick={() => navigate('/pacientes/novo')}
                  className="mt-3 text-sm font-semibold text-[#800000] hover:underline"
                >
                  Cadastrar primeiro paciente →
                </button>
              )}
            </div>
          ) : (
            pacientesFiltrados.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/pacientes/${p.id}`)}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-[#F9F9F9] transition-colors text-left group"
              >
                <div className="w-10 h-10 rounded-full bg-[#800000]/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-[#800000]">
                    {p.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {p.alertas && <AlertTriangle size={13} className="text-amber-500 shrink-0" />}
                    <span className="font-semibold text-[#1A1A1A] truncate">{p.nome}</span>
                  </div>
                  <p className="text-sm text-[#666666] mt-0.5">{p.telefone} · {p.idade} anos</p>
                </div>
                <ChevronRight size={16} className="text-[#DADADA] group-hover:text-[#800000] transition-colors shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
