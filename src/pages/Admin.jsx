import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, Plus, Users, CheckCircle, AlertCircle, Loader, Trash2, X } from 'lucide-react';

const emptyForm = {
  nomeDupla: '',
  emailA: '', senhaA: '',
  emailB: '', senhaB: '',
};

export const Admin = () => {
  const [duplas, setDuplas] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [estado, setEstado] = useState({ tipo: '', msg: '' });
  const [salvando, setSalvando] = useState(false);
  const [confirmandoDelete, setConfirmandoDelete] = useState(null);
  const [deletando, setDeletando] = useState(false);

  useEffect(() => {
    supabase.from('duplas').select('*').order('nome').then(({ data }) => {
      if (data) setDuplas(data);
    });
  }, []);

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
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/criar-dupla', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          nomeDupla: form.nomeDupla,
          emailA: form.emailA, senhaA: form.senhaA,
          emailB: form.emailB, senhaB: form.senhaB,
        }),
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
      const tables = ['consultas', 'pacientes', 'plano_tratamento', 'dias_bloqueados', 'push_subscriptions', 'configuracoes'];
      for (const table of tables) {
        await supabase.from(table).delete().eq('duo_id', id);
      }
      const { error } = await supabase.from('duplas').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setDuplas(prev => prev.filter(d => d.id !== id));
      setConfirmandoDelete(null);
      setEstado({ tipo: 'ok', msg: 'Dupla excluída com sucesso.' });
    } catch (err) {
      setEstado({ tipo: 'erro', msg: `Erro ao excluir: ${err.message}` });
    } finally {
      setDeletando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="text-[#800000]" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Painel Administrativo</h2>
          <p className="text-gray-500 text-sm">Crie duplas e usuários do sistema</p>
        </div>
      </div>

      {/* Formulário nova dupla */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 flex items-center gap-2">
          <Plus size={20} className="text-[#800000]" />
          Nova Dupla
        </h3>

        {estado.msg && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            estado.tipo === 'ok'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {estado.tipo === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {estado.msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Dupla</label>
            <input
              type="text"
              value={form.nomeDupla}
              onChange={set('nomeDupla')}
              placeholder="Ex: Dupla Turma 5A"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Estudante A</p>
              <input
                type="email"
                value={form.emailA}
                onChange={set('emailA')}
                placeholder="E-mail"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
              />
              <input
                type="password"
                value={form.senhaA}
                onChange={set('senhaA')}
                placeholder="Senha (mín. 6 caracteres)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
              />
            </div>

            <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm font-semibold text-gray-700">Estudante B</p>
              <input
                type="email"
                value={form.emailB}
                onChange={set('emailB')}
                placeholder="E-mail"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
              />
              <input
                type="password"
                value={form.senhaB}
                onChange={set('senhaB')}
                placeholder="Senha (mín. 6 caracteres)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000] bg-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {salvando ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
            {salvando ? 'Criando...' : 'Criar Dupla e Usuários'}
          </button>
        </form>
      </div>

      {/* Lista de duplas existentes */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} className="text-[#800000]" />
          Duplas Cadastradas ({duplas.length})
        </h3>
        {duplas.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">Nenhuma dupla cadastrada ainda.</p>
        ) : (
          <div className="space-y-2">
            {duplas.map(d => (
              <div key={d.id}>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <span className="font-medium text-gray-800">{d.nome}</span>
                    <span className="ml-3 text-xs text-gray-400 font-mono">{d.id.slice(0, 8)}…</span>
                  </div>
                  <button
                    onClick={() => setConfirmandoDelete(d.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    title="Excluir dupla"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {confirmandoDelete === d.id && (
                  <div className="mt-1 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-semibold text-red-700">Excluir "{d.nome}"?</p>
                      <button onClick={() => setConfirmandoDelete(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                    </div>
                    <p className="text-xs text-red-600 mb-3">
                      Todos os pacientes, consultas e dados desta dupla serão apagados permanentemente. Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmandoDelete(null)}
                        className="flex-1 text-xs font-medium py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 bg-white">
                        Cancelar
                      </button>
                      <button onClick={() => handleDelete(d.id)} disabled={deletando}
                        className="flex-1 text-xs font-semibold py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex justify-center items-center gap-1.5">
                        {deletando ? <Loader size={12} className="animate-spin" /> : <Trash2 size={12} />}
                        {deletando ? 'Excluindo...' : 'Sim, excluir tudo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
