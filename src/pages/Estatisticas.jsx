import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { ArrowLeft, BarChart2, PieChart as PieIcon, TrendingUp, Users } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { format, parseISO, startOfWeek, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const CORES_STATUS = {
  Realizado:  '#4B5563',
  Confirmado: '#2D6A4F',
  Pendente:   '#7A5800',
  Cancelado:  '#C94C4C',
};

const MESES_PT = (date) => format(parseISO(date + '-01'), 'MMM/yy', { locale: ptBR });

export const Estatisticas = () => {
  const { consultas, pacientes, nomes } = useAppData();
  const navigate = useNavigate();

  const [integrante, setIntegrante] = useState('todos'); // 'todos' | 'A' | 'B'
  const [graficoPrincipal, setGraficoPrincipal] = useState('pizza');
  const [periodo, setPeriodo] = useState('tudo'); // 'semana' | 'mes' | 'trimestre' | 'tudo'

  const consultasFiltradas = useMemo(() => {
    let lista = consultas;

    if (integrante === 'A') lista = lista.filter(c => c.dupla === 'Estudante A');
    else if (integrante === 'B') lista = lista.filter(c => c.dupla === 'Estudante B');

    const hoje = new Date();
    if (periodo === 'semana') {
      const inicio = format(startOfWeek(hoje, { weekStartsOn: 1 }), 'yyyy-MM-dd');
      lista = lista.filter(c => c.data >= inicio);
    } else if (periodo === 'mes') {
      const inicio = format(startOfMonth(hoje), 'yyyy-MM-dd');
      lista = lista.filter(c => c.data >= inicio);
    } else if (periodo === 'trimestre') {
      const inicio = format(subMonths(hoje, 3), 'yyyy-MM-dd');
      lista = lista.filter(c => c.data >= inicio);
    }

    return lista;
  }, [consultas, integrante, periodo]);

  // -- Status chart data --
  const statusData = useMemo(() => {
    const contagem = {};
    consultasFiltradas.forEach(c => { contagem[c.status] = (contagem[c.status] || 0) + 1; });
    return Object.entries(contagem).map(([name, value]) => ({ name, value }));
  }, [consultasFiltradas]);

  // -- Por mês (linha/barra) --
  const porMesData = useMemo(() => {
    const map = {};
    consultasFiltradas.forEach(c => {
      const mes = c.data.slice(0, 7); // yyyy-MM
      if (!map[mes]) map[mes] = { mes, Realizado: 0, Confirmado: 0, Pendente: 0, Cancelado: 0, total: 0 };
      map[mes][c.status] = (map[mes][c.status] || 0) + 1;
      map[mes].total += 1;
    });
    return Object.values(map)
      .sort((a, b) => a.mes.localeCompare(b.mes))
      .map(d => ({ ...d, label: MESES_PT(d.mes) }));
  }, [consultasFiltradas]);

  // -- Procedimentos --
  const procedimentosData = useMemo(() => {
    const contagem = {};
    consultasFiltradas.forEach(c => {
      if (c.procedimento) {
        contagem[c.procedimento] = (contagem[c.procedimento] || 0) + 1;
      }
    });
    return Object.entries(contagem)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [consultasFiltradas]);

  // -- Comparativo A vs B --
  const comparativoData = useMemo(() => {
    const statusList = ['Realizado', 'Confirmado', 'Pendente', 'Cancelado'];
    return statusList.map(status => ({
      status,
      [nomes.estudanteA]: consultas.filter(c => c.dupla === 'Estudante A' && c.status === status).length,
      [nomes.estudanteB]: consultas.filter(c => c.dupla === 'Estudante B' && c.status === status).length,
    }));
  }, [consultas, nomes]);

  const total = consultasFiltradas.length;
  const realizados = consultasFiltradas.filter(c => c.status === 'Realizado').length;
  const taxaRealizacao = total > 0 ? Math.round((realizados / total) * 100) : 0;

  const btnFiltro = (val, atual, set, label) => (
    <button
      onClick={() => set(val)}
      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
        atual === val ? 'bg-[#800000] border-[#800000] text-white' : 'bg-white border-[#DADADA] text-[#666666]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/perfil')}
          className="p-2 rounded-xl text-[#666666] hover:text-[#800000] hover:bg-[#F9F9F9] transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A1A] flex items-center gap-2">
            <BarChart2 size={22} className="text-[#800000]" /> Estatísticas
          </h2>
          <p className="text-sm text-[#666666]">Análise de consultas da dupla</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#DADADA] shadow-card p-4 space-y-3">
        <div>
          <p className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-2">Integrante</p>
          <div className="flex gap-2 flex-wrap">
            {btnFiltro('todos', integrante, setIntegrante, 'Todos')}
            {btnFiltro('A', integrante, setIntegrante, nomes.estudanteA || 'Estudante A')}
            {btnFiltro('B', integrante, setIntegrante, nomes.estudanteB || 'Estudante B')}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold text-[#666666] uppercase tracking-widest mb-2">Período</p>
          <div className="flex gap-2 flex-wrap">
            {btnFiltro('semana', periodo, setPeriodo, 'Esta semana')}
            {btnFiltro('mes', periodo, setPeriodo, 'Este mês')}
            {btnFiltro('trimestre', periodo, setPeriodo, 'Últimos 3 meses')}
            {btnFiltro('tudo', periodo, setPeriodo, 'Todo o período')}
          </div>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: total, color: '#800000' },
          { label: 'Realizadas', value: realizados, color: '#4B5563' },
          { label: 'Taxa realização', value: `${taxaRealizacao}%`, color: '#2D6A4F' },
          { label: 'Pacientes', value: pacientes.length, color: '#7A5800' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-[#DADADA] shadow-card p-4 text-center">
            <p className="text-2xl font-extrabold" style={{ color }}>{value}</p>
            <p className="text-xs text-[#666666] mt-1 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Seletor de tipo de gráfico */}
      <div className="bg-white rounded-2xl border border-[#DADADA] shadow-card p-4">
        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { val: 'pizza', icon: <PieIcon size={14} />, label: 'Status' },
            { val: 'barra', icon: <BarChart2 size={14} />, label: 'Por mês' },
            { val: 'linha', icon: <TrendingUp size={14} />, label: 'Evolução' },
            { val: 'comparativo', icon: <Users size={14} />, label: 'Comparativo' },
          ].map(({ val, icon, label }) => (
            <button key={val} onClick={() => setGraficoPrincipal(val)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                graficoPrincipal === val ? 'bg-[#800000] border-[#800000] text-white' : 'bg-white border-[#DADADA] text-[#666666]'
              }`}>
              {icon} {label}
            </button>
          ))}
        </div>

        {total === 0 && (
          <div className="text-center py-12 text-[#666666] text-sm">
            Nenhuma consulta encontrada para os filtros selecionados.
          </div>
        )}

        {total > 0 && graficoPrincipal === 'pizza' && (
          <div>
            <p className="text-sm font-bold text-[#1A1A1A] mb-4">Consultas por status</p>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false}>
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={CORES_STATUS[entry.name] || '#DADADA'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v} consultas`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {total > 0 && graficoPrincipal === 'barra' && (
          <div>
            <p className="text-sm font-bold text-[#1A1A1A] mb-4">Consultas por mês</p>
            {porMesData.length === 0 ? (
              <p className="text-sm text-[#666666] text-center py-8">Sem dados suficientes para este período.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={porMesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {Object.keys(CORES_STATUS).map(status => (
                    <Bar key={status} dataKey={status} stackId="a" fill={CORES_STATUS[status]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {total > 0 && graficoPrincipal === 'linha' && (
          <div>
            <p className="text-sm font-bold text-[#1A1A1A] mb-4">Evolução de consultas realizadas</p>
            {porMesData.length < 2 ? (
              <p className="text-sm text-[#666666] text-center py-8">Dados insuficientes para exibir a evolução (mínimo 2 meses).</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={porMesData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="total" stroke="#800000" strokeWidth={2} dot={{ r: 4 }} name="Total" />
                  <Line type="monotone" dataKey="Realizado" stroke="#4B5563" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {graficoPrincipal === 'comparativo' && (
          <div>
            <p className="text-sm font-bold text-[#1A1A1A] mb-4">
              Comparativo: {nomes.estudanteA} vs {nomes.estudanteB}
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparativoData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={nomes.estudanteA || 'Estudante A'} fill="#60a5fa" />
                <Bar dataKey={nomes.estudanteB || 'Estudante B'} fill="#a78bfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Procedimentos mais realizados */}
      {procedimentosData.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#DADADA] shadow-card p-4">
          <p className="text-sm font-bold text-[#1A1A1A] mb-4">Procedimentos mais registrados</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={procedimentosData} layout="vertical" margin={{ top: 0, right: 10, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={110} />
              <Tooltip formatter={(v) => [`${v} consultas`]} />
              <Bar dataKey="value" fill="#800000" radius={[0, 4, 4, 0]} name="Consultas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
