import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';

export const Login = () => {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      await signIn(form.email, form.password);
    } catch {
      setErro('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-4 font-[Manrope,Inter,sans-serif]">
      {/* Header brand */}
      <div className="w-full max-w-sm mb-6 text-center">
        <div className="w-16 h-16 bg-[#800000] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-card">
          <LogIn size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-[#800000] tracking-tight">Agenda Duo</h1>
        <p className="text-[#666666] text-sm mt-1 font-medium">Clínica Odontológica · Univassouras</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-card border border-[#DADADA] w-full max-w-sm p-8">
        {erro && (
          <div className="mb-5 p-3 bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C] rounded-xl text-sm font-medium">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">E-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] placeholder-[#666666]/50 transition-shadow"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Senha</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] placeholder-[#666666]/50 transition-shadow"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors flex justify-center items-center gap-2 mt-2 shadow-card"
          >
            <LogIn size={18} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-[#666666]">Univassouras © {new Date().getFullYear()}</p>
    </div>
  );
};
