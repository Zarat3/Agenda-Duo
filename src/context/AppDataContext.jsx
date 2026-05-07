import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';

const AppDataContext = createContext();

const mapConsulta = (c) => ({ ...c, pacienteId: c.paciente_id });

export const AppDataProvider = ({ children, duoId }) => {
  const [pacientes, setPacientes] = useState([]);
  const [consultas, setConsultas] = useState([]);
  const [plano, setPlano] = useState([]);
  const [nomes, setNomes] = useState({ estudanteA: 'Estudante A', estudanteB: 'Estudante B' });
  const [diasBloqueados, setDiasBloqueados] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const [
        { data: pacs, error: errPacs },
        { data: cons, error: errCons },
        { data: planos, error: errPlanos },
        { data: config },
        { data: bloqueados },
      ] = await Promise.all([
        supabase.from('pacientes').select('*').eq('duo_id', duoId).order('nome'),
        supabase.from('consultas').select('*').eq('duo_id', duoId).order('data').order('horario'),
        supabase.from('plano_tratamento').select('*').eq('duo_id', duoId).order('created_at'),
        supabase.from('configuracoes').select('*').eq('duo_id', duoId).single(),
        supabase.from('dias_bloqueados').select('*').eq('duo_id', duoId),
      ]);

      if (errPacs) console.error('Erro ao carregar pacientes:', errPacs.message);
      if (errCons) console.error('Erro ao carregar consultas:', errCons.message);
      if (errPlanos) console.error('Erro ao carregar plano:', errPlanos.message);

      if (pacs) setPacientes(pacs);
      if (cons) setConsultas(cons.map(mapConsulta));
      if (planos) setPlano(planos);
      if (config) setNomes({ estudanteA: config.estudante_a, estudanteB: config.estudante_b });
      if (bloqueados) setDiasBloqueados(bloqueados);
      setLoading(false);
    };

    loadData();
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

  const addConsulta = async (consulta) => {
    const conflito = consultas.find(c =>
      c.data === consulta.data &&
      c.horario === consulta.horario &&
      c.dupla === consulta.dupla &&
      c.status !== 'Cancelado'
    );

    if (conflito) {
      const nomeDupla = consulta.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
      throw new Error(`Já existe uma consulta para ${consulta.data} às ${consulta.horario} com ${nomeDupla}.`);
    }

    const { data, error } = await supabase
      .from('consultas')
      .insert([{
        paciente_id: consulta.pacienteId,
        data: consulta.data,
        horario: consulta.horario,
        dupla: consulta.dupla,
        status: consulta.status,
        descricao: consulta.descricao || null,
        queixa_principal: consulta.queixa_principal || null,
        duo_id: duoId,
      }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    const nova = mapConsulta(data);
    setConsultas(prev => [...prev, nova]);
    return nova;
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
      pacientes, consultas, plano, nomes, diasBloqueados, loading,
      addPaciente, updatePacienteAlertas, updateAnamnese,
      addConsulta, updateConsultaStatus, updateConsultaDescricao, updateConsultaFicha,
      updateNomes,
      addPlanoItem, updatePlanoStatus, deletePlanoItem,
      bloquearDia, desbloquearDia,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
