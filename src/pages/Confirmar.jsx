import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';

export const Confirmar = () => {
  const { id } = useParams();
  const [consulta, setConsulta] = useState(null);
  const [paciente, setPaciente] = useState(null);
  const [clinicaInfo, setClinicaInfo] = useState({ nomeClinica: 'Clínica Odontológica Universitária', turma: '' });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [acao, setAcao] = useState(null);
  const [erroAcao, setErroAcao] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const { data: c, error } = await supabase
        .from('consultas')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !c) { setNotFound(true); setLoading(false); return; }

      setConsulta(c);

      const { data: p } = await supabase
        .from('pacientes')
        .select('nome')
        .eq('id', c.paciente_id)
        .single();

      setPaciente(p);

      const { data: cfg } = await supabase
        .from('configuracoes')
        .select('nome_clinica, turma')
        .eq('duo_id', c.duo_id)
        .single();

      if (cfg) setClinicaInfo({ nomeClinica: cfg.nome_clinica || 'Clínica Odontológica Universitária', turma: cfg.turma || '' });

      setLoading(false);
    };

    fetchData();
  }, [id]);

  const atualizar = async (novoStatus) => {
    setAcao(novoStatus);
    setErroAcao('');
    const { error } = await supabase
      .from('consultas')
      .update({ status: novoStatus })
      .eq('id', id);

    if (error) {
      setErroAcao('Erro ao processar. Tente novamente.');
      setAcao(null);
      return;
    }

    setConsulta(prev => ({ ...prev, status: novoStatus }));
    setAcao(null);

    if (novoStatus === 'Confirmado') {
      fetch('/api/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consulta_id: id }),
      }).catch(() => {});
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F9]">
        <div className="w-8 h-8 border-4 border-[#800000] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F9F9F9] p-4 font-[Manrope,Inter,sans-serif]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">
          <XCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Agendamento não encontrado.</p>
          <p className="text-sm text-gray-400 mt-1">O link pode estar incorreto ou expirado.</p>
        </div>
      </div>
    );
  }

  let dataFmt = consulta.data;
  try {
    dataFmt = format(parseISO(consulta.data), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    dataFmt = dataFmt.charAt(0).toUpperCase() + dataFmt.slice(1);
  } catch {}

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center p-4 font-[Manrope,Inter,sans-serif]">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 max-w-sm w-full text-center">

        <img src="/logo-stacked.svg" alt="Duo" className="h-14 mx-auto mb-6" />

        <p className="text-lg font-bold text-gray-800 mb-0.5">
          Olá, {paciente?.nome?.split(' ')[0] || 'paciente'}!
        </p>
        <p className="text-sm text-gray-400 mb-6">Sua consulta odontológica</p>

        <div className="bg-[#800000]/5 border border-[#800000]/20 rounded-xl p-5 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-[#800000] shrink-0" />
            <span className="text-sm font-semibold text-gray-700">{dataFmt}</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-[#800000] shrink-0" />
            <span className="text-sm font-semibold text-gray-700">{consulta.horario}</span>
          </div>
        </div>

        {consulta.status === 'Confirmado' && (
          <div className="flex flex-col items-center gap-2 text-[#2D6A4F]">
            <CheckCircle size={40} />
            <p className="font-bold text-base">Consulta confirmada!</p>
            <p className="text-sm text-gray-400">Te esperamos. Até logo!</p>
          </div>
        )}

        {consulta.status === 'Cancelado' && (
          <div className="flex flex-col items-center gap-2 text-[#C94C4C]">
            <XCircle size={40} />
            <p className="font-bold text-base">Consulta cancelada.</p>
            <p className="text-sm text-gray-400">Entre em contato para reagendar.</p>
          </div>
        )}

        {(consulta.status === 'Pendente' || consulta.status === 'Realizado') && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 mb-1">Você vai comparecer?</p>
            <button
              onClick={() => atualizar('Confirmado')}
              disabled={!!acao}
              className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {acao === 'Confirmado' ? 'Confirmando...' : 'Sim, confirmar consulta'}
            </button>
            <button
              onClick={() => atualizar('Cancelado')}
              disabled={!!acao}
              className="w-full border border-gray-200 text-gray-500 hover:bg-gray-50 font-medium py-3 rounded-xl transition-colors text-sm"
            >
              {acao === 'Cancelado' ? 'Cancelando...' : 'Não vou poder comparecer'}
            </button>
          </div>
        )}

        {erroAcao && <p className="mt-3 text-xs text-red-500">{erroAcao}</p>}

        <p className="text-[11px] text-gray-300 mt-6">
          {clinicaInfo.nomeClinica}{clinicaInfo.turma ? ` · ${clinicaInfo.turma}` : ''}
        </p>
      </div>
    </div>
  );
};
