import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import {
  ArrowLeft, Plus, Trash2, Pencil, Check, X,
  AlertTriangle, ShieldAlert, FileText, ClipboardList,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_PLANO = ['Planejado', 'Em andamento', 'Concluído', 'Cancelado'];

const STATUS_PLANO_COR = {
  'Planejado':    'bg-blue-100   text-blue-700',
  'Em andamento': 'bg-yellow-100 text-yellow-700',
  'Concluído':    'bg-green-100  text-green-700',
  'Cancelado':    'bg-red-100    text-red-600',
};

const STATUS_CONSULTA_COR = {
  'Confirmado': 'bg-green-100  text-green-700',
  'Pendente':   'bg-yellow-100 text-yellow-700',
  'Cancelado':  'bg-red-100    text-red-700',
  'Realizado':  'bg-gray-100   text-gray-600',
};

const CHIPS_ALERTAS = ['Hipertensão', 'Diabetes', 'Alergia a medicamentos', 'Cardiopatia', 'Coagulopatia', 'Gestante'];

const DenteTag = ({ numero }) =>
  numero ? (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#800000]/10 text-[#800000] font-bold text-xs shrink-0">
      {numero}
    </span>
  ) : (
    <span className="text-gray-300 text-sm">—</span>
  );

export const Prontuario = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromAgenda = location.state?.from === 'agenda';
  const {
    pacientes, consultas, plano, nomes,
    updatePacienteAlertas,
    addPlanoItem, updatePlanoStatus, deletePlanoItem,
    updateConsultaFicha, updateConsultaDescricao,
  } = useAppData();

  const paciente = pacientes.find(p => p.id === id);

  // ── Alertas ───────────────────────────────────────────
  const [editandoAlertas, setEditandoAlertas] = useState(false);
  const [textoAlertas, setTextoAlertas] = useState('');
  const [salvandoAlertas, setSalvandoAlertas] = useState(false);

  const toggleChip = (chip) => {
    const atual = textoAlertas.split(',').map(s => s.trim()).filter(Boolean);
    const idx = atual.indexOf(chip);
    if (idx >= 0) atual.splice(idx, 1); else atual.push(chip);
    setTextoAlertas(atual.join(', '));
  };

  const salvarAlertas = async () => {
    setSalvandoAlertas(true);
    try {
      await updatePacienteAlertas(id, textoAlertas);
      setEditandoAlertas(false);
    } finally {
      setSalvandoAlertas(false);
    }
  };

  // ── Plano de Tratamento ───────────────────────────────
  const [adicionandoPlano, setAdicionandoPlano] = useState(false);
  const [novoItem, setNovoItem] = useState({ dente: '', procedimento: '', observacoes: '' });
  const [salvandoPlano, setSalvandoPlano] = useState(false);

  const handleAddPlano = async (e) => {
    e.preventDefault();
    setSalvandoPlano(true);
    try {
      await addPlanoItem({ pacienteId: id, ...novoItem });
      setNovoItem({ dente: '', procedimento: '', observacoes: '' });
      setAdicionandoPlano(false);
    } finally {
      setSalvandoPlano(false);
    }
  };

  // ── Ficha Clínica ─────────────────────────────────────
  const [editandoFicha, setEditandoFicha] = useState(null);
  const [fichaForm, setFichaForm] = useState({ dente: '', procedimento: '', proxima_sessao: '', descricao: '' });
  const [salvandoFicha, setSalvandoFicha] = useState(false);

  const iniciarFicha = (c) => {
    setEditandoFicha(c.id);
    setFichaForm({
      dente: c.dente || '',
      procedimento: c.procedimento || '',
      proxima_sessao: c.proxima_sessao || '',
      descricao: c.descricao || '',
    });
  };

  const salvarFicha = async () => {
    setSalvandoFicha(true);
    try {
      await updateConsultaFicha(editandoFicha, {
        dente: fichaForm.dente,
        procedimento: fichaForm.procedimento,
        proxima_sessao: fichaForm.proxima_sessao,
      });
      await updateConsultaDescricao(editandoFicha, fichaForm.descricao);
      setEditandoFicha(null);
    } finally {
      setSalvandoFicha(false);
    }
  };

  if (!paciente) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p>Paciente não encontrado.</p>
        <button onClick={() => navigate('/pacientes')} className="mt-4 text-[#800000] underline text-sm">
          Voltar para Pacientes
        </button>
      </div>
    );
  }

  const consultasDoPaciente = consultas
    .filter(c => c.pacienteId === id)
    .sort((a, b) => b.data.localeCompare(a.data));

  const planoDoPaciente = plano
    .filter(p => p.paciente_id === id)
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const totalConcluidos = planoDoPaciente.filter(p => p.status === 'Concluído').length;
  const alertasAtivos = paciente.alertas
    ? paciente.alertas.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Voltar */}
      <button
        onClick={() => navigate(fromAgenda ? '/' : '/pacientes')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#800000] transition-colors"
      >
        <ArrowLeft size={15} />
        {fromAgenda ? 'Voltar para Agenda' : 'Voltar para Pacientes'}
      </button>

      {/* ── Cabeçalho do Paciente ─────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#800000] flex items-center justify-center shrink-0 text-2xl font-bold text-white">
            {paciente.nome.charAt(0).toUpperCase()}
          </div>

          {/* Dados */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{paciente.nome}</h1>
                <p className="text-sm text-gray-500 mt-0.5">{paciente.telefone} · {paciente.idade} anos</p>
              </div>
              {/* Stats */}
              <div className="flex gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xl font-bold text-[#800000]">{consultasDoPaciente.length}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Consultas</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-center">
                  <p className="text-xl font-bold text-[#800000]">{totalConcluidos}/{planoDoPaciente.length}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Plano</p>
                </div>
              </div>
            </div>

            {/* Alertas */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert size={13} className="text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Alertas de Saúde</span>
                {!editandoAlertas && (
                  <button
                    onClick={() => { setTextoAlertas(paciente.alertas || ''); setEditandoAlertas(true); }}
                    className="text-xs text-[#800000] hover:underline flex items-center gap-0.5 ml-1"
                  >
                    <Pencil size={11} />
                    {paciente.alertas ? 'Editar' : 'Adicionar'}
                  </button>
                )}
              </div>

              {editandoAlertas ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {CHIPS_ALERTAS.map(chip => {
                      const ativo = textoAlertas.split(',').map(s => s.trim()).includes(chip);
                      return (
                        <button key={chip} type="button" onClick={() => toggleChip(chip)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${ativo ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300 text-gray-600 hover:border-amber-400'}`}>
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                  <input type="text" placeholder="Outros alertas..."
                    value={textoAlertas}
                    onChange={e => setTextoAlertas(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
                  />
                  <div className="flex gap-2">
                    <button onClick={salvarAlertas} disabled={salvandoAlertas}
                      className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
                      <Check size={12} /> {salvandoAlertas ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditandoAlertas(false)}
                      className="text-xs text-gray-500 px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : alertasAtivos.length > 0 ? (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 max-w-xl">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap gap-1.5">
                    {alertasAtivos.map(a => (
                      <span key={a} className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">{a}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">Nenhum alerta registrado.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Plano de Tratamento ───────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList size={16} className="text-[#800000]" />
            Plano de Tratamento
          </h2>
          {!adicionandoPlano && (
            <button onClick={() => setAdicionandoPlano(true)}
              className="flex items-center gap-1.5 text-sm bg-[#800000] hover:bg-[#660000] text-white px-3 py-1.5 rounded-lg transition-colors">
              <Plus size={14} /> Adicionar
            </button>
          )}
        </div>

        {/* Formulário novo item */}
        {adicionandoPlano && (
          <form onSubmit={handleAddPlano} className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Dente (nº)</label>
                <input type="text" placeholder="Ex: 36"
                  value={novoItem.dente}
                  onChange={e => setNovoItem(p => ({ ...p, dente: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-gray-600 mb-1 block">Procedimento *</label>
                <input type="text" required placeholder="Ex: Extração, Restauração composta..."
                  value={novoItem.procedimento}
                  onChange={e => setNovoItem(p => ({ ...p, procedimento: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Observações</label>
                <input type="text" placeholder="Opcional..."
                  value={novoItem.observacoes}
                  onChange={e => setNovoItem(p => ({ ...p, observacoes: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={salvandoPlano}
                className="flex items-center gap-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white text-xs font-medium px-4 py-2 rounded-lg">
                <Check size={13} /> {salvandoPlano ? 'Salvando...' : 'Salvar'}
              </button>
              <button type="button" onClick={() => setAdicionandoPlano(false)}
                className="text-xs text-gray-500 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Tabela */}
        {planoDoPaciente.length === 0 && !adicionandoPlano ? (
          <p className="text-center text-gray-400 text-sm py-10">Nenhum procedimento no plano de tratamento.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3 text-left w-20">Dente</th>
                  <th className="px-6 py-3 text-left">Procedimento</th>
                  <th className="px-6 py-3 text-left hidden md:table-cell">Observações</th>
                  <th className="px-6 py-3 text-left w-44">Status</th>
                  <th className="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {planoDoPaciente.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5">
                      <DenteTag numero={item.dente} />
                    </td>
                    <td className="px-6 py-3.5 font-medium text-gray-800">{item.procedimento}</td>
                    <td className="px-6 py-3.5 text-gray-500 hidden md:table-cell">{item.observacoes || '—'}</td>
                    <td className="px-6 py-3.5">
                      <select
                        value={item.status}
                        onChange={e => updatePlanoStatus(item.id, e.target.value).catch(console.error)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full border-0 outline-none cursor-pointer appearance-none ${STATUS_PLANO_COR[item.status] || 'bg-gray-100 text-gray-600'}`}
                      >
                        {STATUS_PLANO.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => deletePlanoItem(item.id).catch(console.error)}
                        className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Ficha Clínica ─────────────────────────────── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <FileText size={16} className="text-[#800000]" />
            Ficha Clínica
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">Evolução por consulta · mais recente primeiro</p>
        </div>

        {consultasDoPaciente.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">Nenhuma consulta registrada.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {consultasDoPaciente.map(c => {
              const nomeDupla = c.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
              let dataFmt = c.data;
              try { dataFmt = format(parseISO(c.data), "dd/MM/yyyy"); } catch {}
              const editing = editandoFicha === c.id;

              return (
                <div key={c.id} className="px-6 py-5">
                  {/* Linha de cabeçalho da consulta */}
                  <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-800">{dataFmt}</p>
                        <p className="text-xs text-gray-400">{c.horario} · {nomeDupla}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CONSULTA_COR[c.status] || 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </div>
                    {!editing && (
                      <button onClick={() => iniciarFicha(c)}
                        className="flex items-center gap-1 text-xs text-[#800000] hover:underline">
                        <Pencil size={12} /> Editar ficha
                      </button>
                    )}
                  </div>

                  {/* Queixa principal */}
                  {c.queixa_principal && !editing && (
                    <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide shrink-0">Queixa:</span>
                      <p className="text-sm text-blue-800">{c.queixa_principal}</p>
                    </div>
                  )}

                  {/* Conteúdo da ficha */}
                  {editing ? (
                    <div className="space-y-3 bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Dente (nº)</label>
                          <input type="text" placeholder="Ex: 36"
                            value={fichaForm.dente}
                            onChange={e => setFichaForm(f => ({ ...f, dente: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-600 mb-1 block">Procedimento executado</label>
                          <input type="text" placeholder="Ex: Extração simples, Restauração..."
                            value={fichaForm.procedimento}
                            onChange={e => setFichaForm(f => ({ ...f, procedimento: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">O que fazer na próxima sessão</label>
                        <input type="text" placeholder="Plano para a próxima consulta..."
                          value={fichaForm.proxima_sessao}
                          onChange={e => setFichaForm(f => ({ ...f, proxima_sessao: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Observações / Evolução</label>
                        <textarea rows={3} placeholder="Descreva o que foi realizado..."
                          value={fichaForm.descricao}
                          onChange={e => setFichaForm(f => ({ ...f, descricao: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#800000] resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={salvarFicha} disabled={salvandoFicha}
                          className="flex items-center gap-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white text-xs font-medium px-4 py-2 rounded-lg">
                          <Check size={13} /> {salvandoFicha ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button onClick={() => setEditandoFicha(null)}
                          className="text-xs text-gray-500 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="text-[11px] text-gray-400 mb-1.5">Dente</p>
                          <DenteTag numero={c.dente} />
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">Procedimento executado</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {c.procedimento || <span className="text-gray-400 font-normal italic text-xs">Não registrado</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-gray-400 mb-1">Próxima sessão</p>
                        <p className="text-sm text-gray-700">
                          {c.proxima_sessao || <span className="text-gray-400 italic text-xs">—</span>}
                        </p>
                      </div>
                      {c.descricao && (
                        <div className="sm:col-span-3">
                          <p className="text-[11px] text-gray-400 mb-1">Observações</p>
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 border border-gray-100 leading-snug">
                            {c.descricao}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
