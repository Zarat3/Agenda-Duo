import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

const CORES_PADRAO = { A: '#800000', B: '#800000' };

export function ThemeProvider({ duoId, children }) {
  const [cores, setCores] = useState(() => {
    try {
      const salvo = localStorage.getItem(`duo_cores_${duoId}`);
      return salvo ? JSON.parse(salvo) : CORES_PADRAO;
    } catch {
      return CORES_PADRAO;
    }
  });

  const [filtroAtivo, setFiltroAtivo] = useState(null); // null | 'A' | 'B'

  const corAtiva = filtroAtivo ? (cores[filtroAtivo] || '#800000') : '#800000';

  useEffect(() => {
    document.documentElement.style.setProperty('--duo-accent', corAtiva);
  }, [corAtiva]);

  const setCor = (student, cor) => {
    const novas = { ...cores, [student]: cor };
    setCores(novas);
    try { localStorage.setItem(`duo_cores_${duoId}`, JSON.stringify(novas)); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ cores, setCor, filtroAtivo, setFiltroAtivo, corAtiva }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
