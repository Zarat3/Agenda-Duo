import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AppDataContext = createContext();

const mapConsulta = (c) => ({ ...c, pacienteId: c.paciente_id });

export const AppDataProvider = ({ children, duoId }) => {
  const [pacientes, setPacientes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [plano, setPlano] = useState([]);
  const [nomes, setNomes] = useState({ estudanteA: 'Estudante A', estudanteB: 'Estudante B' });
  const [configuracoes, setConfiguracoes] = useState({
    nomeClinica: 'Clínica Odontológica Universitária',
    turma: '',
    horariosAtivos: ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','16:20','17:20','18:20'],
    diasAtivos: [1,2,3,4,5,6],
    clinicasAtivas: [],
  });
  const [perfis, setPerfis] = useState([]);
  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [
        { data: pacs, error: errPacs },
        { data: cons, error: errCons },
        { data: planos, error: errPlanos },
        { data: config },
        { data: bloqueados },
        { data: perfisDuo },
      ] = await Promise.all([
        supabase.from('pacientes').select('*').eq('duo_id', duoId).order('nome'),
        supabase.from('consultas').select('*').eq('duo_id', duoId).order('data').order('horario'),
        supabase.from('plano_tratamento').select('*').eq('duo_id', duoId).order('created_at'),
        supabase.from('configuracoes').select('*').eq('duo_id', duoId).single(),
        supabase.from('dias_bloqueados').select('*').eq('duo_id', duoId),
        supabase.from('perfis').select('*').eq('duo_id', duoId),
      ]);

      if (errPacs) console.error('Erro ao carregar pacientes:', errPacs.message);
      if (errCons) console.error('Erro ao carregar consultas:', errCons.message);
      if (errPlanos) console.error('Erro ao carregar plano:', errPlanos.message);

      if (pacs) setPacientes(pacs);
      if (cons) setConsultas(cons.map(mapConsulta));
      if (planos) setPlano(planos);
      if (config) {
        setNomes({ estudanteA: config.estudante_a, estudanteB: config.estudante_b });
        setConfiguracoes({
          nomeClinica: config.nome_clinica || 'Clínica Odontológica Universitária',
          turma: config.turma || '',
          horariosAtivos: config.horarios_ativos || ALL_SLOTS,
          diasAtivos: config.dias_ativos || [1,2,3,4,5,6],
          clinicasAtivas: config.clinicas_ativas || [],
        });
      }
      if (bloqueados) setDiasBloqueados(bloqueados);
      if (perfisDuo) setPerfis(perfisDuo);
      setLoading(false);
    };

    loadData();

    const ano = new Date().getFullYear();
    fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setFeriadosNacionais(data))
      .catch(() => {});

    const channel = supabase
      .channel(`consultas-rt-${duoId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'consultas', filter: `duo_id=eq.${duoId}` },
        (payload) => setConsultas(prev => prev.map(c => c.id === payload.new.id ? mapConsulta(payload.new) : c))
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [duoId]);

  const addPaciente = async (paciente) => {
    const { data, error } = await supabase
      .from('pacientes')
      .insert([{ nome: paciente.nome, telefone: paciente.telefone, idade: paciente.idade, alertas: paciente.alertas || null, duo_id: duoId }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    setPacientes(prev => [...prev, data]);
    return data;
  };

  const deletePaciente = async (id) => {
    const { error: errPlano } = await supabase.from('plano_tratamento').delete().eq('paciente_id', id).eq('duo_id', duoId);
    if (errPlano) throw new Error(`Erro ao remover plano: ${errPlano.message}`);
    const { error: errCons } = await supabase.from('consultas').delete().eq('paciente_id', id).eq('duo_id', duoId);
    if (errCons) throw new Error(`Erro ao remover consultas: ${errCons.message}`);
    const { error } = await supabase.from('pacientes').delete().eq('id', id).eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setPacientes(prev => prev.filter(p => p.id !== id));
    setConsultas(prev => prev.filter(c => c.pacienteId !== id));
    setPlano(prev => prev.filter(p => p.paciente_id !== id));
  };

  const updatePaciente = async (id, { nome, telefone, idade }) => {
    const { error } = await supabase
      .from('pacientes')
      .update({ nome, telefone, idade: Number(idade) })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setPacientes(prev => prev.map(p => p.id === id ? { ...p, nome, telefone, idade: Number(idade) } : p));
  };

  const updatePacienteAlertas = async (id, alertas) => {
    const { error } = await supabase
      .from('pacientes')
      .update({ alertas: alertas || null })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setPacientes(prev => prev.map(p => p.id === id ? { ...p, alertas: alertas || null } : p));
  };

  const updateAnamnese = async (id, { queixa_principal, historico_medico, medicamentos }) => {
    const { error } = await supabase
      .from('pacientes')
      .update({
        queixa_principal: queixa_principal || null,
        historico_medico: historico_medico || null,
        medicamentos: medicamentos || null,
      })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setPacientes(prev => prev.map(p =>
      p.id === id ? { ...p, queixa_principal, historico_medico, medicamentos } : p
    ));
  };

  const ALL_SLOTS = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','16:20','17:20','18:20'];
  const getSlotsInRange = (horario, horario_fim) => {
    if (!horario_fim || horario === horario_fim) return [horario];
    const start = ALL_SLOTS.indexOf(horario);
    const end = ALL_SLOTS.indexOf(horario_fim);
    if (start === -1 || end === -1 || end < start) return [horario];
    return ALL_SLOTS.slice(start, end + 1);
  };

  const addConsulta = async (consulta) => {

    const { data, error } = await supabase
      .from('consultas')
      .insert([{
        paciente_id: consulta.pacienteId,
        data: consulta.data,
        horario: consulta.horario,
        horario_fim: consulta.horario_fim || null,
        dupla: consulta.dupla,
        status: consulta.status,
        descricao: consulta.descricao || null,
        clinica: consulta.clinica || null,
        duo_id: duoId,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    const nova = mapConsulta(data);
    setConsultas(prev => [...prev, nova]);
    return nova;
  };

  const deleteConsulta = async (id) => {
    const { error } = await supabase
      .from('consultas')
      .delete()
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setConsultas(prev => prev.filter(c => c.id !== id));
  };

  const updateConsulta = async (id, { data, horario, horario_fim, dupla }) => {
    const { error } = await supabase
      .from('consultas')
      .update({ data, horario, horario_fim: horario_fim || null, dupla })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, data, horario, horario_fim: horario_fim || null, dupla } : c));
  };

  const updateConsultaStatus = async (id, newStatus) => {
    const { error } = await supabase
      .from('consultas')
      .update({ status: newStatus })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
  };

  const updateConsultaDescricao = async (id, descricao) => {
    const { error } = await supabase
      .from('consultas')
      .update({ descricao })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, descricao } : c));
  };

  const updateConsultaFicha = async (id, { dente, procedimento, proxima_sessao }) => {
    const { error } = await supabase
      .from('consultas')
      .update({ dente: dente || null, procedimento: procedimento || null, proxima_sessao: proxima_sessao || null })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setConsultas(prev => prev.map(c => c.id === id ? { ...c, dente, procedimento, proxima_sessao } : c));
  };

  const updateConfiguracoes = async ({ estudanteA, estudanteB, nomeClinica, turma, horariosAtivos, diasAtivos, clinicasAtivas }) => {
    const { error } = await supabase
      .from('configuracoes')
      .upsert(
        {
          duo_id: duoId,
          estudante_a: estudanteA,
          estudante_b: estudanteB,
          nome_clinica: nomeClinica,
          turma: turma || null,
          horarios_ativos: horariosAtivos,
          dias_ativos: diasAtivos,
          clinicas_ativas: clinicasAtivas || [],
        },
        { onConflict: 'duo_id' }
      );
    if (error) throw new Error(error.message);
    setNomes({ estudanteA, estudanteB });
    setConfiguracoes({ nomeClinica, turma, horariosAtivos, diasAtivos, clinicasAtivas: clinicasAtivas || [] });
  };

  const upsertPerfil = async (perfilData) => {
    const { data, error } = await supabase
      .from('perfis')
      .upsert({ ...perfilData, duo_id: duoId }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setPerfis(prev => [...prev.filter(p => p.user_id !== perfilData.user_id), data]);
    return data;
  };

  const updateNomes = async (estudanteA, estudanteB) => {
    const { error } = await supabase
      .from('configuracoes')
      .upsert(
        { duo_id: duoId, estudante_a: estudanteA, estudante_b: estudanteB },
        { onConflict: 'duo_id' }
      );
    if (error) throw new Error(error.message);
    setNomes({ estudanteA, estudanteB });
  };

  const addPlanoItem = async ({ pacienteId, dente, procedimento, observacoes }) => {
    const { data, error } = await supabase
      .from('plano_tratamento')
      .insert([{ paciente_id: pacienteId, duo_id: duoId, dente: dente || null, procedimento, observacoes: observacoes || null }])
      .select()
      .single();
    if (error) throw new Error(error.message);
    setPlano(prev => [...prev, data]);
    return data;
  };

  const updatePlanoStatus = async (id, status) => {
    const { error } = await supabase
      .from('plano_tratamento')
      .update({ status })
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setPlano(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  const bloquearDia = async (data, motivo = null) => {
    const { data: novo, error } = await supabase
      .from('dias_bloqueados')
      .upsert([{ duo_id: duoId, data, motivo }], { onConflict: 'duo_id,data' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    setDiasBloqueados(prev => [...prev.filter(d => d.data !== data), novo]);
  };

  const desbloquearDia = async (data) => {
    const { error } = await supabase
      .from('dias_bloqueados')
      .delete()
      .eq('duo_id', duoId)
      .eq('data', data);
    if (error) throw new Error(error.message);
    setDiasBloqueados(prev => prev.filter(d => d.data !== data));
  };

  const deletePlanoItem = async (id) => {
    const { error } = await supabase
      .from('plano_tratamento')
      .delete()
      .eq('id', id)
      .eq('duo_id', duoId);
    if (error) throw new Error(error.message);
    setPlano(prev => prev.filter(p => p.id !== id));
  };

  return (
    <AppDataContext.Provider value={{
      pacientes, consultas, plano, nomes, configuracoes, perfis, diasBloqueados, feriadosNacionais, loading,
      addPaciente, deletePaciente, updatePaciente, updatePacienteAlertas, updateAnamnese,
      addConsulta, updateConsulta, updateConsultaStatus, updateConsultaDescricao, updateConsultaFicha, deleteConsulta,
      updateNomes, updateConfiguracoes, upsertPerfil,
      addPlanoItem, updatePlanoStatus, deletePlanoItem,
      bloquearDia, desbloquearDia,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
