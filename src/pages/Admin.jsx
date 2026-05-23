import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  ShieldCheck, Plus, Users, CheckCircle, AlertCircle, Loader,
  Trash2, X, Pencil, AlertTriangle,
} from 'lucide-react';

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] text-sm bg-white';

const emptyForm = {
  nomeDupla: '',
  emailA: '', senhaA: '',
  emailB: '', senhaB: '',
};

export const Admin = () => {
  const [duplas, setDuplas] = useState([]);
  const [contagens, setContagens] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [estado, setEstado] = useState({ tipo: '', msg: '' });
  const [salvando, setSalvando] = useState(false);
  const [confirmandoDelete, setConfirmandoDelete] = useState(null);
  const [deletando, setDeletando] = useState(false);

  const [editando, setEditando] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [salvandoEdit, setSalvandoEdit] = useState(false);
  const [erroEdit, setErroEdit] = useState('');
  const [okEdit, setOkEdit] = useState('');

  useEffect(() => {
    supabase.from('duplas').select('*').order('nome').then(({ data }) => {
      if (data) setDuplas(data);
    });

    // Carrega contagens via API serverless (service role ignora RLS)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch('/api/contagens-duplas', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then(r => r.json())
        .then(({ contagens }) => { if (contagens) setContagens(contagens); })
        .catch(() => {});
    });
  }, []);

  const ativas = duplas;

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session.access_token;
  };

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEstado({ tipo: '', msg: '' });
    if (!form.nomeDupla || !form.emailA || !form.senhaA || !form.emailB || !form.senhaB) {
      setEstado({ tipo: 'erro', msg: 'Preencha todos os campos.' });
      return;
    }
    if (form.senhaA.length < 6 || form.senhaB.length < 6) {
      setEstado({ tipo: 'erro', msg: 'As senhas devem ter pelo menos 6 caracteres.' });
      return;
    }
    setSalvando(true);
    try {
      const res = await fetch('/api/criar-dupla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify({ nomeDupla: form.nomeDupla, emailA: form.emailA, senhaA: form.senhaA, emailB: form.emailB, senhaB: form.senhaB }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido');
      setDuplas(prev => [...prev, json.dupla]);
      setForm(emptyForm);
      setEstado({ tipo: 'ok', msg: `Dupla "${json.dupla.nome}" criada com sucesso!` });
    } catch (err) {
      setEstado({ tipo: 'erro', msg: err.message });
    } finally {
      setSalvando(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletando(true);
    try {
      const res = await fetch('/api/excluir-dupla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify({ duplaId: id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido');
      setDuplas(prev => prev.filter(d => d.id !== id));
      setConfirmandoDelete(null);
      setEstado({ tipo: 'ok', msg: 'Dupla excluída com sucesso.' });
    } catch (err) {
      setEstado({ tipo: 'erro', msg: `Erro ao excluir: ${err.message}` });
    } finally {
      setDeletando(false);
    }
  };

  const abrirEditar = (dupla) => {
    setEditando(dupla);
    setEditForm({
      nomeDupla: dupla.nome,
      emailA: dupla.email_a || '',
      senhaA: '',
      emailB: dupla.email_b || '',
      senhaB: '',
      // guarda valores originais para detectar mudanças
      _original: {
        nomeDupla: dupla.nome,
        emailA: dupla.email_a || '',
        emailB: dupla.email_b || '',
      },
    });
    setErroEdit('');
    setOkEdit('');
  };

  const handleEditar = async () => {
    const orig = editForm._original || {};
    const nomeMudou = editForm.nomeDupla.trim() !== (orig.nomeDupla || '');
    const emailAMudou = editForm.emailA.trim() !== (orig.emailA || '');
    const emailBMudou = editForm.emailB.trim() !== (orig.emailB || '');
    const temSenhaA = editForm.senhaA?.length >= 6;
    const temSenhaB = editForm.senhaB?.length >= 6;

    if (nomeMudou && !editForm.nomeDupla?.trim()) { setErroEdit('O nome não pode ficar vazio.'); return; }
    if (temSenhaA && editForm.senhaA.length < 6) { setErroEdit('Nova senha A: mínimo 6 caracteres.'); return; }
    if (temSenhaB && editForm.senhaB.length < 6) { setErroEdit('Nova senha B: mínimo 6 caracteres.'); return; }

    // Nada foi alterado
    if (!nomeMudou && !emailAMudou && !temSenhaA && !emailBMudou && !temSenhaB) {
      setErroEdit('Nenhuma alteração detectada.');
      return;
    }

    setSalvandoEdit(true);
    setErroEdit('');
    try {
      const body = { duplaId: editando.id };
      if (nomeMudou) body.nomeDupla = editForm.nomeDupla.trim();
      // Só envia campos do estudante se houve alteração
      if (emailAMudou || temSenhaA) {
        body.emailA = emailAMudou ? editForm.emailA.trim() : undefined;
        body.senhaA = temSenhaA ? editForm.senhaA : undefined;
      }
      if (emailBMudou || temSenhaB) {
        body.emailB = emailBMudou ? editForm.emailB.trim() : undefined;
        body.senhaB = temSenhaB ? editForm.senhaB : undefined;
      }

      const res = await fetch('/api/editar-dupla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${await getToken()}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido');

      // Atualiza estado local
      setDuplas(prev => prev.map(d => {
        if (d.id !== editando.id) return d;
        const atualizado = { ...d };
        if (nomeMudou) atualizado.nome = editForm.nomeDupla.trim();
        if (emailAMudou) atualizado.email_a = editForm.emailA.trim();
        if (emailBMudou) atualizado.email_b = editForm.emailB.trim();
        return atualizado;
      }));
      setOkEdit('Alterações salvas!');
      setTimeout(() => setEditando(null), 1200);
    } catch (err) {
      setErroEdit(err.message);
    } finally {
      setSalvandoEdit(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-[#800000]" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-[#1A1A1A]">Painel Administrativo</h2>
          <p className="text-[#666666] text-sm">Gerencie duplas e usuários</p>
        </div>
      </div>

      {estado.msg && (
        <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${
          estado.tipo === 'ok'
            ? 'bg-[#D8F3DC] border border-[#2D6A4F]/30 text-[#2D6A4F]'
            : 'bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C]'
        }`}>
          {estado.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {estado.msg}
        </div>
      )}

      {/* Criar nova dupla */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-[#DADADA]">
        <h3 className="text-base font-bold text-[#1A1A1A] mb-5 flex items-center gap-2">
          <Plus size={18} className="text-[#800000]" />
          Criar Nova Dupla
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Nome da Dupla</label>
            <input type="text" value={form.nomeDupla} onChange={set('nomeDupla')}
              placeholder="Ex: Dupla Turma 5A" className={inputCls} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-bold text-blue-800">Estudante A</p>
              <input type="email" value={form.emailA} onChange={set('emailA')}
                placeholder="E-mail" className={inputCls} />
              <input type="password" value={form.senhaA} onChange={set('senhaA')}
                placeholder="Senha (mín. 6 caracteres)" className={inputCls} />
            </div>
            <div className="space-y-2.5 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-sm font-bold text-purple-800">Estudante B</p>
              <input type="email" value={form.emailB} onChange={set('emailB')}
                placeholder="E-mail" className={inputCls} />
              <input type="password" value={form.senhaB} onChange={set('senhaB')}
                placeholder="Senha (mín. 6 caracteres)" className={inputCls} />
            </div>
          </div>

          <button type="submit" disabled={salvando}
            className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-card">
            {salvando ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
            {salvando ? 'Criando...' : 'Criar Dupla'}
          </button>
        </form>
      </div>

      {/* Duplas ativas */}
      <div className="bg-white p-6 rounded-2xl shadow-card border border-[#DADADA]">
        <h3 className="text-base font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
          <Users size={18} className="text-[#800000]" />
          Duplas Ativas ({ativas.length})
        </h3>
        {ativas.length === 0 ? (
          <p className="text-[#666666] text-sm text-center py-4">Nenhuma dupla ativa ainda.</p>
        ) : (
          <div className="space-y-2">
            {ativas.map(d => {
              const cnt = contagens[d.id] || { pacientes: 0, consultas: 0 };
              const temDados = cnt.pacientes > 0 || cnt.consultas > 0;
              const emailAFaltando = !d.email_a && d.user_a_id;
              const emailBFaltando = !d.email_b && d.user_b_id;
              const semUsuarios = !d.user_a_id && !d.user_b_id;
              const temProblema = emailAFaltando || emailBFaltando;

              return (
              <div key={d.id}>
                <div className={`flex items-center justify-between p-3 rounded-xl border ${temProblema ? 'bg-amber-50 border-amber-200' : 'bg-[#F9F9F9] border-[#DADADA]'}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-[#1A1A1A]">{d.nome}</span>

                      {/* Badge de dados */}
                      {temDados ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#D8F3DC] text-[#2D6A4F]">
                          {cnt.pacientes} pac · {cnt.consultas} cons
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          vazia
                        </span>
                      )}

                      {/* Badge sem usuários vinculados */}
                      {semUsuarios && (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                          sem conta
                        </span>
                      )}

                      {/* Alerta de email faltando */}
                      {temProblema && (
                        <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          <AlertTriangle size={10} />
                          {emailAFaltando && emailBFaltando ? 'emails A e B faltando' : emailAFaltando ? 'email A faltando' : 'email B faltando'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#666666] truncate mt-0.5">
                      {d.email_a
                        ? d.email_a
                        : d.user_a_id
                          ? <span className="text-amber-600 font-semibold">A: sem email cadastrado</span>
                          : <span className="text-gray-400">A: —</span>
                      }
                      {' · '}
                      {d.email_b
                        ? d.email_b
                        : d.user_b_id
                          ? <span className="text-amber-600 font-semibold">B: sem email cadastrado</span>
                          : <span className="text-gray-400">B: —</span>
                      }
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-2">
                    <button onClick={() => abrirEditar(d)}
                      className="p-1.5 text-[#666666] hover:text-[#800000] hover:bg-white rounded-xl transition-colors"
                      title="Editar">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setConfirmandoDelete(d.id)}
                      className="p-1.5 text-[#666666] hover:text-[#C94C4C] hover:bg-[#FDECEA] rounded-xl transition-colors"
                      title="Excluir">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {confirmandoDelete === d.id && (
                  <div className="mt-1 bg-[#FDECEA] border border-[#C94C4C]/30 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-[#C94C4C]">Excluir "{d.nome}"?</p>
                      <button onClick={() => setConfirmandoDelete(null)} className="text-[#666666]"><X size={14} /></button>
                    </div>
                    {temDados ? (
                      <p className="text-xs text-[#C94C4C] mb-3 font-semibold">
                        ⚠️ Esta dupla tem {cnt.pacientes} paciente(s) e {cnt.consultas} consulta(s). Tudo será apagado permanentemente.
                      </p>
                    ) : (
                      <p className="text-xs text-[#C94C4C] mb-3">
                        Esta dupla está vazia. Será removida do sistema.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmandoDelete(null)}
                        className="flex-1 text-xs font-medium py-2 border border-[#DADADA] rounded-xl bg-white text-[#666666]">
                        Cancelar
                      </button>
                      <button onClick={() => handleDelete(d.id)} disabled={deletando}
                        className="flex-1 text-xs font-semibold py-2 bg-[#C94C4C] hover:bg-[#a83838] disabled:bg-gray-300 text-white rounded-xl transition-colors flex justify-center items-center gap-1.5">
                        {deletando ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        {deletando ? 'Excluindo...' : 'Excluir tudo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADADA] w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#DADADA] shrink-0">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Pencil size={16} className="text-[#800000]" />
                Editar — {editando.nome}
              </h2>
              <button onClick={() => setEditando(null)} className="text-[#666666] hover:text-[#1A1A1A]">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Nome da Dupla</label>
                <input type="text" value={editForm.nomeDupla}
                  onChange={e => setEditForm(f => ({ ...f, nomeDupla: e.target.value }))}
                  className={inputCls} />
              </div>

              <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-sm font-bold text-blue-800">Estudante A</p>
                <div>
                  <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">E-mail</label>
                  <input type="email" value={editForm.emailA}
                    onChange={e => setEditForm(f => ({ ...f, emailA: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">
                    Nova Senha <span className="font-normal text-[#666666]">(deixe em branco para não alterar)</span>
                  </label>
                  <input type="password" value={editForm.senhaA}
                    onChange={e => setEditForm(f => ({ ...f, senhaA: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className={inputCls} />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm font-bold text-purple-800">Estudante B</p>
                <div>
                  <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">E-mail</label>
                  <input type="email" value={editForm.emailB}
                    onChange={e => setEditForm(f => ({ ...f, emailB: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">
                    Nova Senha <span className="font-normal text-[#666666]">(deixe em branco para não alterar)</span>
                  </label>
                  <input type="password" value={editForm.senhaB}
                    onChange={e => setEditForm(f => ({ ...f, senhaB: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className={inputCls} />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#DADADA] shrink-0">
              {erroEdit && (
                <p className="mb-3 text-sm text-[#C94C4C] font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} />{erroEdit}
                </p>
              )}
              {okEdit && (
                <p className="mb-3 text-sm text-[#2D6A4F] font-medium flex items-center gap-1.5">
                  <CheckCircle size={14} />{okEdit}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setEditando(null)}
                  className="flex-1 border border-[#DADADA] text-[#666666] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F9F9]">
                  Cancelar
                </button>
                <button onClick={handleEditar} disabled={salvandoEdit}
                  className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex justify-center items-center gap-2">
                  {salvandoEdit ? <Loader size={16} className="animate-spin" /> : null}
                  {salvandoEdit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
