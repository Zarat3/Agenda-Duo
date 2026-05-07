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
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center font-['Inter',sans-serif]">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm mx-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#800000] rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#800000]">Agenda Duo</h1>
          <p className="text-gray-500 text-sm mt-1">Clínica Odontológica – Univassouras</p>
        </div>

        {erro && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#800000]"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-400 text-white font-medium py-3 rounded-lg transition-colors flex justify-center items-center gap-2 mt-2"
          >
            <LogIn size={18} />
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
