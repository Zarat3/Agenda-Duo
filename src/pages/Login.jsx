import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LogIn, KeyRound, CheckCircle, AlertCircle, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] placeholder-[#666666]/50 transition-shadow';

export const Login = () => {
  const { signIn } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const [mostraRecupero, setMostraRecupero] = useState(false);
  const [emailRecupero, setEmailRecupero] = useState('');
  const [enviandoRecupero, setEnviandoRecupero] = useState(false);
  const [recuperoEnviado, setRecuperoEnviado] = useState(false);
  const [erroRecupero, setErroRecupero] = useState('');

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

  const handleRecuperarSenha = async (e) => {
    e.preventDefault();
    setErroRecupero('');
    setEnviandoRecupero(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailRecupero.trim(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw new Error(error.message);
      setRecuperoEnviado(true);
    } catch (err) {
      setErroRecupero(err.message);
    } finally {
      setEnviandoRecupero(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-4 font-[Manrope,Inter,sans-serif]">
      <div className="w-full max-w-sm mb-6 text-center">
        <img src="/logo-stacked.svg" alt="DUO" className="h-36 mx-auto mb-2" />
        <p className="text-[#666666] text-sm font-medium">Clínica Odontológica Universitária</p>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#DADADA] w-full max-w-sm p-8">
        {erro && (
          <div className="mb-5 p-3 bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C] rounded-xl text-sm font-medium flex items-center gap-2">
            <AlertCircle size={15} />
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
              className={inputCls}
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
              className={inputCls}
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

        <div className="mt-5 pt-4 border-t border-[#DADADA] space-y-3">
          <button
            type="button"
            onClick={() => { setMostraRecupero(!mostraRecupero); setRecuperoEnviado(false); setErroRecupero(''); }}
            className="w-full text-sm text-[#666666] hover:text-[#800000] transition-colors flex items-center justify-center gap-1.5"
          >
            <KeyRound size={14} />
            Esqueci minha senha
          </button>

          {mostraRecupero && (
            <div className="pt-1">
              {recuperoEnviado ? (
                <div className="p-3 bg-[#D8F3DC] border border-[#2D6A4F]/30 text-[#2D6A4F] rounded-xl text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={15} />
                  Link de recuperação enviado! Verifique seu e-mail.
                </div>
              ) : (
                <form onSubmit={handleRecuperarSenha} className="space-y-2">
                  {erroRecupero && (
                    <p className="text-xs text-[#C94C4C] font-medium">{erroRecupero}</p>
                  )}
                  <input
                    type="email"
                    required
                    value={emailRecupero}
                    onChange={e => setEmailRecupero(e.target.value)}
                    className="w-full border border-[#DADADA] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#800000] text-[#1A1A1A] text-sm placeholder-[#666666]/50"
                    placeholder="Digite seu e-mail"
                  />
                  <button
                    type="submit"
                    disabled={enviandoRecupero}
                    className="w-full bg-[#F9F9F9] hover:bg-[#F0F0F0] disabled:text-gray-400 border border-[#DADADA] text-[#1A1A1A] font-semibold py-2.5 rounded-xl transition-colors text-sm"
                  >
                    {enviandoRecupero ? 'Enviando...' : 'Enviar link de recuperação'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      <Link
        to="/cadastro"
        className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-[#800000] hover:text-[#660000] transition-colors"
      >
        <UserPlus size={15} />
        Solicitar cadastro para nova dupla
      </Link>

      <p className="mt-4 text-xs text-[#666666]">Zarat3 © {new Date().getFullYear()}</p>
    </div>
  );
};
