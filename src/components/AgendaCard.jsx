import React from 'react';
import { User, Clock, Phone, MessageCircle, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';
import { useAppData } from '../context/AppDataContext';
import { format, parseISO } from 'date-fns';

const statusColors = {
  'Confirmado': 'border-green-500 bg-green-50 text-green-700',
  'Pendente': 'border-yellow-400 bg-yellow-50 text-yellow-700',
  'Cancelado': 'border-red-500 bg-red-50 text-red-700',
  'Realizado': 'border-gray-400 bg-gray-50 text-gray-700',
};

export const AgendaCard = ({ consulta }) => {
  const { pacientes, updateConsultaStatus, nomes } = useAppData();
  const paciente = pacientes.find(p => p.id === consulta.pacienteId);
  const displayDupla = consulta.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;

  if (!paciente) return null;

  const handleWhatsApp = () => {
    let formattedDate = consulta.data;
    try {
      formattedDate = format(parseISO(consulta.data), 'dd/MM/yyyy');
    } catch(e) {}

    const text = `Olá ${paciente.nome}, confirmamos sua consulta na clínica da Univassouras para o dia ${formattedDate} às ${consulta.horario}. Podemos confirmar?`;
    const phoneNum = paciente.telefone.replace(/\D/g, '');
    const url = `https://wa.me/55${phoneNum}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className={clsx(
      'p-4 rounded-xl border-l-4 shadow-sm bg-white hover:shadow-md transition-shadow flex flex-col gap-3',
      statusColors[consulta.status]?.split(' ')[0] || 'border-gray-200'
    )}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <User size={18} className="text-gray-400" />
            {paciente.nome}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Clock size={14} />
            <span>{consulta.data} às {consulta.horario}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
            <Phone size={14} />
            <span>{paciente.telefone}</span>
          </div>
        </div>
        <div className="text-right">
          <span className={clsx(
            'px-2 py-1 text-xs font-semibold rounded-full',
            statusColors[consulta.status]?.split(' ').slice(1).join(' ') || 'bg-gray-100 text-gray-600'
          )}>
            {consulta.status}
          </span>
          <div className="mt-2 text-sm font-medium text-gray-600">
            {displayDupla}
          </div>
        </div>
      </div>

      {/* Alerta de saúde */}
      {paciente.alertas && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 font-medium">{paciente.alertas}</p>
        </div>
      )}

      {consulta.descricao && (
        <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          <p className="text-xs font-medium text-gray-400 mb-1">Observações</p>
          <p className="leading-snug">{consulta.descricao}</p>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          onClick={handleWhatsApp}
          className="flex items-center gap-2 text-sm bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors"
        >
          <MessageCircle size={16} />
          WhatsApp
        </button>

        <select
          value={consulta.status}
          onChange={(e) => updateConsultaStatus(consulta.id, e.target.value).catch(console.error)}
          className="text-sm border border-gray-200 rounded-lg px-2 py-1 bg-gray-50 outline-none focus:ring-1 focus:ring-[#800000]"
        >
          <option value="Pendente">Pendente</option>
          <option value="Confirmado">Confirmado</option>
          <option value="Cancelado">Cancelado</option>
          <option value="Realizado">Realizado</option>
        </select>
      </div>
    </div>
  );
};
