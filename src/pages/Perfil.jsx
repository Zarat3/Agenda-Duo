import React, { useState, useEffect, useRef } from 'react';
import { User, Pencil, X, CheckCircle, AlertCircle, Camera, Loader } from 'lucide-react';
import { useAppData } from '../context/AppDataContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const inputCls = 'w-full border border-[#DADADA] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] text-[#1A1A1A] text-sm bg-white';

const Avatar = ({ fotoUrl, nome, size = 'lg' }) => {
  const initials = nome ? nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : '?';
  const cls = size === 'lg' ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-lg';
  if (fotoUrl) {
    return <img src={fotoUrl} alt={nome} className={`${cls} rounded-full object-cover border-2 border-[#DADADA]`} />;
  }
  return (
    <div className={`${cls} rounded-full bg-[#800000] flex items-center justify-center text-white font-bold shrink-0`}>
      {initials}
    </div>
  );
};

const PERIODOS = Array.from({ length: 10 }, (_, i) => i + 1);

export const Perfil = () => {
  const { perfis, nomes, upsertPerfil } = useAppData();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const duoId = session?.user?.user_metadata?.duo_id;
  const fileRef = useRef(null);

  const [duplaInfo, setDuplaInfo] = useState(null);
  const [editando, setEditando] = useState(false);
  const [editForm, setEditForm] = useState({ cpf: '', rg: '', periodo: '', foto_url: '' });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [ok, setOk] = useState('');

  useEffect(() => {
    if (!duoId) return;
    supabase.from('duplas').select('user_a_id, user_b_id, nome_a, nome_b').eq('id', duoId).single()
      .then(({ data }) => setDuplaInfo(data));
  }, [duoId]);

  const meuPerfil = perfis.find(p => p.user_id === userId) || null;
  const perfilParceiro = perfis.find(p => p.user_id !== userId) || null;

  const isStudentA = duplaInfo?.user_a_id === userId;
  const meuLabel = isStudentA ? nomes.estudanteA : nomes.estudanteB;
  const parceiroLabel = isStudentA ? nomes.estudanteB : nomes.estudanteA;

  const abrirEditar = () => {
    setEditForm({
      cpf: meuPerfil?.cpf || '',
      rg: meuPerfil?.rg || '',
      periodo: meuPerfil?.periodo || '',
      foto_url: meuPerfil?.foto_url || '',
    });
    setFotoPreview(null);
    setFotoFile(null);
    setErro('');
    setOk('');
    setEditando(true);
  };

  const handleFotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSalvar = async () => {
    setSalvando(true);
    setErro('');
    try {
      let fotoUrl = editForm.foto_url;
      if (fotoFile) {
        const ext = fotoFile.name.split('.').pop().toLowerCase();
        const path = `${duoId}/${userId}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, fotoFile, { upsert: true, contentType: fotoFile.type });
        if (uploadErr) throw new Error(`Erro no upload: ${uploadErr.message}`);
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
        fotoUrl = publicUrl;
      }
      await upsertPerfil({
        user_id: userId,
        cpf: editForm.cpf.trim() || null,
        rg: editForm.rg.trim() || null,
        periodo: editForm.periodo ? Number(editForm.periodo) : null,
        foto_url: fotoUrl || null,
      });
      setOk('Perfil atualizado!');
      setEditando(false);
    } catch (err) {
      setErro(err.message);
    } finally {
      setSalvando(false);
    }
  };

  const PerfilCard = ({ perfil, label, isOwn }) => (
    <div className={`bg-white rounded-2xl border p-6 shadow-card ${isOwn ? 'border-[#800000]/20' : 'border-[#DADADA]'}`}>
      <div className="flex items-start gap-4">
        <Avatar fotoUrl={perfil?.foto_url} nome={label} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-bold text-[#1A1A1A] text-base">{label}</p>
              {isOwn && (
                <span className="text-xs text-[#800000] font-semibold bg-[#800000]/8 px-2 py-0.5 rounded-full">
                  Você
                </span>
              )}
            </div>
            {isOwn && (
              <button onClick={abrirEditar}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#666666] hover:text-[#800000] transition-colors px-3 py-1.5 border border-[#DADADA] rounded-xl hover:border-[#800000]/30">
                <Pencil size={12} /> Editar
              </button>
            )}
          </div>
        </div>
      </div>

      {perfil ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-[#F9F9F9] rounded-xl p-3">
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-0.5">Período</p>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              {perfil.periodo ? `${perfil.periodo}º` : '—'}
            </p>
          </div>
          <div className="bg-[#F9F9F9] rounded-xl p-3">
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-0.5">CPF</p>
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{perfil.cpf || '—'}</p>
          </div>
          <div className="bg-[#F9F9F9] rounded-xl p-3">
            <p className="text-[10px] font-bold text-[#999] uppercase tracking-wide mb-0.5">RG</p>
            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{perfil.rg || '—'}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-3 bg-[#F9F9F9] rounded-xl text-center">
          <p className="text-sm text-[#666666]">
            {isOwn ? 'Nenhuma informação cadastrada. Clique em Editar.' : 'Este estudante ainda não preencheu o perfil.'}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#800000]/10 flex items-center justify-center">
          <User size={20} className="text-[#800000]" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A1A]">Perfis da Dupla</h2>
          <p className="text-sm text-[#666666]">Informações dos estudantes</p>
        </div>
      </div>

      <PerfilCard perfil={meuPerfil} label={meuLabel} isOwn={true} />
      <PerfilCard perfil={perfilParceiro} label={parceiroLabel} isOwn={false} />

      {editando && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-[#DADADA] w-full max-w-sm flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#DADADA] shrink-0">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <Pencil size={16} className="text-[#800000]" />
                Editar Perfil
              </h2>
              <button onClick={() => setEditando(false)} className="text-[#666666] hover:text-[#1A1A1A]">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Foto */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <Avatar
                    fotoUrl={fotoPreview || editForm.foto_url}
                    nome={meuLabel}
                    size="lg"
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#800000] text-white rounded-full flex items-center justify-center shadow-card hover:bg-[#660000] transition-colors"
                  >
                    <Camera size={13} />
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFotoSelect}
                />
                <p className="text-xs text-[#666666]">Toque na câmera para alterar a foto</p>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">Período</label>
                <select value={editForm.periodo}
                  onChange={e => setEditForm(f => ({ ...f, periodo: e.target.value }))}
                  className={inputCls}>
                  <option value="">Selecione o período</option>
                  {PERIODOS.map(p => (
                    <option key={p} value={p}>{p}º Período</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">CPF</label>
                <input
                  type="text"
                  value={editForm.cpf}
                  onChange={e => setEditForm(f => ({ ...f, cpf: e.target.value }))}
                  placeholder="000.000.000-00"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1A1A1A] mb-1 block">RG</label>
                <input
                  type="text"
                  value={editForm.rg}
                  onChange={e => setEditForm(f => ({ ...f, rg: e.target.value }))}
                  placeholder="0000000"
                  className={inputCls}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#DADADA] shrink-0">
              {erro && (
                <p className="mb-3 text-sm text-[#C94C4C] font-medium flex items-center gap-1.5">
                  <AlertCircle size={14} />{erro}
                </p>
              )}
              {ok && (
                <p className="mb-3 text-sm text-[#2D6A4F] font-medium flex items-center gap-1.5">
                  <CheckCircle size={14} />{ok}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setEditando(false)}
                  className="flex-1 border border-[#DADADA] text-[#666666] py-3 rounded-xl font-semibold text-sm hover:bg-[#F9F9F9]">
                  Cancelar
                </button>
                <button onClick={handleSalvar} disabled={salvando}
                  className="flex-1 bg-[#800000] hover:bg-[#660000] disabled:bg-gray-300 text-white py-3 rounded-xl font-semibold text-sm flex justify-center items-center gap-2">
                  {salvando && <Loader size={14} className="animate-spin" />}
                  {salvando ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
