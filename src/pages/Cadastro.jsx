import React, { useState } from 'react';
import { UserPlus, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] bg-white';
const labelCls = 'block text-sm font-semibold text-[#1A1A1A] mb-1.5';

export const Cadastro = () => {
  const [form, setForm] = useState({
    nomeDupla: '',
    nomeA: '', emailA: '', senhaA: '',
    nomeB: '', emailB: '', senhaB: '',
  });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.emailA.toLowerCase() === form.emailB.toLowerCase()) {
      setErro('Os e-mails dos estudantes devem ser diferentes.');
      return;
    }
    setErro('');
    setSalvando(true);
    try {
      const res = await fetch('/api/solicitar-cadastro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro desconhecido');
      setSucesso(true);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (sucesso) {
    return (
      <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-4 font-[Manrope,Inter,sans-serif]">
        <div className="bg-white rounded-2xl shadow-card border border-[#DADADA] w-full max-w-sm p-8 text-center">
          <CheckCircle size={48} className="text-[#2D6A4F] mx-auto mb-4" />
          <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-2">Solicitação enviada!</h2>
          <p className="text-sm text-[#666666] leading-relaxed">
            Seu cadastro foi recebido e está aguardando aprovação do administrador.
            Assim que aprovado, vocês poderão fazer login normalmente.
          </p>
          <a href="/" className="mt-6 inline-block text-sm font-semibold text-[#800000] hover:underline">
            Ir para o login →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-start px-4 py-8 font-[Manrope,Inter,sans-serif]">
      <div className="w-full max-w-xl mb-6 text-center">
        <img src="/logo-stacked.svg" alt="DUO" className="h-28 mx-auto mb-2" />
        <p className="text-[#666666] text-sm font-medium">Clínica Odontológica Universitária</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#DADADA] w-full max-w-xl p-8">
        <h2 className="text-xl font-extrabold text-[#1A1A1A] mb-1 flex items-center gap-2">
          <UserPlus size={20} className="text-[#800000]" />
          Solicitar Cadastro
        </h2>
        <p className="text-sm text-[#666666] mb-6">Crie a conta da sua dupla. A aprovação é feita pelo administrador.</p>

        {erro && (
          <div className="mb-5 p-4 bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C] rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm font-semibold">{erro}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={labelCls}>Nome da Dupla *</label>
            <input type="text" required placeholder="Ex: Dupla Turma 5A – 2025.1"
              value={form.nomeDupla} onChange={set('nomeDupla')} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estudante A */}
            <div className="space-y-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-sm font-bold text-blue-800">Estudante A</p>
              <div>
                <label className={labelCls}>Nome completo *</label>
                <input type="text" required placeholder="Nome completo"
                  value={form.nomeA} onChange={set('nomeA')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>E-mail *</label>
                <input type="email" required placeholder="email@exemplo.com"
                  value={form.emailA} onChange={set('emailA')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Senha * <span className="font-normal text-[#666666]">(mín. 6 caracteres)</span></label>
                <input type="password" required minLength={6}
                  value={form.senhaA} onChange={set('senhaA')} className={inputCls} />
              </div>
            </div>

            {/* Estudante B */}
            <div className="space-y-3 p-4 bg-purple-50 rounded-xl border border-purple-100">
              <p className="text-sm font-bold text-purple-800">Estudante B</p>
              <div>
                <label className={labelCls}>Nome completo *</label>
                <input type="text" required placeholder="Nome completo"
                  value={form.nomeB} onChange={set('nomeB')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>E-mail *</label>
                <input type="email" required placeholder="email@exemplo.com"
                  value={form.emailB} onChange={set('emailB')} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Senha * <span className="font-normal text-[#666666]">(mín. 6 caracteres)</span></label>
                <input type="password" required minLength={6}
                  value={form.senhaB} onChange={set('senhaB')} className={inputCls} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={salvando}
            className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 shadow-card">
            <UserPlus size={18} />
            {salvando ? 'Enviando...' : 'Solicitar Cadastro'}
          </button>
        </form>
      </div>

      <a href="/" className="mt-6 flex items-center gap-1.5 text-sm text-[#666666] hover:text-[#800000] transition-colors">
        <ArrowLeft size={14} />
        Voltar para o login
      </a>
    </div>
  );
};
