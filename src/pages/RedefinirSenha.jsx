import React, { useState } from 'react';
import { KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const RedefinirSenha = () => {
  const { setRecoveryMode } = useAuth();
  const [senha, setSenha] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (senha.length < 6) { setErro('A senha deve ter pelo menos 6 caracteres.'); return; }
    if (senha !== confirmar) { setErro('As senhas não coincidem.'); return; }
    setErro('');
    setSalvando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: senha });
      if (error) throw new Error(error.message);
      setSucesso(true);
      setTimeout(() => setRecoveryMode(false), 2000);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center px-4 font-[Manrope,Inter,sans-serif]">
      <div className="w-full max-w-sm mb-6 text-center">
        <img src="/logo-stacked.svg" alt="DUO" className="h-28 mx-auto mb-2" />
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#DADADA] w-full max-w-sm p-8">
        {sucesso ? (
          <div className="text-center py-4">
            <CheckCircle size={48} className="text-[#2D6A4F] mx-auto mb-3" />
            <p className="font-bold text-[#1A1A1A]">Senha atualizada!</p>
            <p className="text-sm text-[#666666] mt-1">Redirecionando...</p>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-1 flex items-center gap-2">
              <KeyRound size={18} className="text-[#800000]" />
              Redefinir Senha
            </h2>
            <p className="text-sm text-[#666666] mb-5">Digite sua nova senha abaixo.</p>

            {erro && (
              <div className="mb-4 p-3 bg-[#FDECEA] border border-[#C94C4C]/30 text-[#C94C4C] rounded-xl flex items-center gap-2 text-sm font-medium">
                <AlertCircle size={15} />
                {erro}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Nova Senha</label>
                <input type="password" required minLength={6} value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] text-[#1A1A1A]"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#1A1A1A] mb-1.5">Confirmar Nova Senha</label>
                <input type="password" required value={confirmar}
                  onChange={e => setConfirmar(e.target.value)}
                  className="w-full border border-[#DADADA] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#800000] text-[#1A1A1A]"
                  placeholder="Repita a nova senha"
                />
              </div>
              <button type="submit" disabled={salvando}
                className="w-full bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl transition-colors mt-2">
                {salvando ? 'Salvando...' : 'Definir Nova Senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
