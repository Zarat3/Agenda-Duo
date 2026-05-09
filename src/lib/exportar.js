import { format, parseISO, addDays } from 'date-fns';
import html2canvas from 'html2canvas';

const BOM = '﻿';

const FORMULA_START = new Set(['=', '+', '-', '@', '\t', '\r']);
const esc = (v) => {
  let s = String(v ?? '');
  if (s.length > 0 && FORMULA_START.has(s[0])) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};
const csvRow = (arr) => arr.map(esc).join(',');

const HTML_ESCAPE = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

const htmlEsc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => HTML_ESCAPE[ch]);

function fileSafe(v, fallback = 'arquivo') {
  const safe = String(v ?? '')
    .trim()
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  return safe || fallback;
}

function fmtData(ds) {
  try { return format(parseISO(ds), 'dd/MM/yyyy'); } catch { return ds || ''; }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

const STATUS_BG = { Confirmado: '#D8F3DC', Pendente: '#FFF3CD', Cancelado: '#FDECEA', Realizado: '#f0f0f0' };
const STATUS_COR = { Confirmado: '#2D6A4F', Pendente: '#7A5800', Cancelado: '#C94C4C', Realizado: '#555' };

function openPrint(html, title) {
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
    <meta charset="UTF-8"><title>${htmlEsc(title)}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;margin:0;padding:24px}
      h1{font-size:18px;color:#800000;margin:0 0 4px}
      h2{font-size:13px;color:#800000;margin:18px 0 6px;border-bottom:1px solid #e0e0e0;padding-bottom:4px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}
      th{background:#f5f5f5;text-align:left;padding:5px 8px;font-size:11px;border:1px solid #ddd}
      td{padding:5px 8px;border:1px solid #eee;font-size:11px;vertical-align:top}
      .Confirmado{background:#D8F3DC;color:#2D6A4F;padding:2px 8px;border-radius:10px;font-weight:bold;font-size:10px}
      .Pendente{background:#FFF3CD;color:#7A5800;padding:2px 8px;border-radius:10px;font-weight:bold;font-size:10px}
      .Cancelado{background:#FDECEA;color:#C94C4C;padding:2px 8px;border-radius:10px;font-weight:bold;font-size:10px}
      .Realizado{background:#f0f0f0;color:#555;padding:2px 8px;border-radius:10px;font-weight:bold;font-size:10px}
      @media print{body{padding:0}}
    </style>
  </head><body>${html}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 400);
}

async function captureHTML(html, filename) {
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;left:-9999px;top:0;width:840px;background:#fff;padding:32px;font-family:Arial,sans-serif;font-size:12px;color:#1a1a1a;';
  div.innerHTML = html;
  document.body.appendChild(div);
  try {
    const canvas = await html2canvas(div, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    await new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Falha ao gerar imagem.'));
          return;
        }
        downloadBlob(blob, filename);
        resolve();
      }, 'image/png');
    });
  } finally {
    document.body.removeChild(div);
  }
}

function inlineStyles(html) {
  return html
    .replace(/<h1>/g, '<h1 style="font-size:18px;color:#800000;margin:0 0 4px">')
    .replace(/<h2>/g, '<h2 style="font-size:13px;color:#800000;margin:18px 0 6px;border-bottom:1px solid #e0e0e0;padding-bottom:4px">')
    .replace(/<table>/g, '<table style="width:100%;border-collapse:collapse;margin-bottom:12px">')
    .replace(/<th>/g, '<th style="background:#f5f5f5;padding:5px 8px;border:1px solid #ddd;font-size:11px;text-align:left">')
    .replace(/<td/g, '<td style="padding:5px 8px;border:1px solid #eee;font-size:11px;vertical-align:top"');
}

function badge(status) {
  const bg = STATUS_BG[status] || '#f0f0f0';
  const cor = STATUS_COR[status] || '#555';
  return `<span style="background:${bg};color:${cor};padding:2px 8px;border-radius:10px;font-weight:bold;font-size:10px">${htmlEsc(status)}</span>`;
}

// ─── AGENDA ──────────────────────────────────────────────

function getAgendaRows({ consultas, pacientes, nomes, weekStart }) {
  const dates = Array.from({ length: 6 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
  return consultas
    .filter(c => dates.includes(c.data))
    .sort((a, b) => a.data.localeCompare(b.data) || a.horario.localeCompare(b.horario))
    .map(c => {
      const pac = pacientes.find(p => p.id === c.pacienteId);
      return {
        data: fmtData(c.data),
        horario: c.horario_fim ? `${c.horario} – ${c.horario_fim}` : c.horario,
        paciente: pac?.nome || '',
        telefone: pac?.telefone || '',
        responsavel: c.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB,
        status: c.status,
      };
    });
}

function agendaHTML(rows, weekStart, cfg) {
  const semana = `${format(addDays(weekStart, 0), 'dd/MM')} – ${format(addDays(weekStart, 5), 'dd/MM/yyyy')}`;
  const tableRows = rows.map(r =>
    `<tr><td>${htmlEsc(r.data)}</td><td>${htmlEsc(r.horario)}</td><td>${htmlEsc(r.paciente)}</td><td>${htmlEsc(r.telefone)}</td><td>${htmlEsc(r.responsavel)}</td><td>${badge(r.status)}</td></tr>`
  ).join('');
  return `<h1>${htmlEsc(cfg?.nomeClinica || 'Agenda Duo')}</h1>
    <p style="color:#666;margin:0 0 16px;font-size:11px">Semana de ${htmlEsc(semana)}${cfg?.turma ? ' · ' + htmlEsc(cfg.turma) : ''}</p>
    <h2>Consultas</h2>
    <table>
      <tr><th>Data</th><th>Horário</th><th>Paciente</th><th>Telefone</th><th>Responsável</th><th>Status</th></tr>
      ${tableRows}
    </table>`;
}

export function exportAgendaCSV({ consultas, pacientes, nomes, weekStart }) {
  const rows = getAgendaRows({ consultas, pacientes, nomes, weekStart });
  if (!rows.length) return false;
  const header = csvRow(['Data', 'Horário', 'Paciente', 'Telefone', 'Responsável', 'Status']);
  const body = rows.map(r => csvRow([r.data, r.horario, r.paciente, r.telefone, r.responsavel, r.status]));
  downloadBlob(
    new Blob([BOM + [header, ...body].join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `agenda-${format(weekStart, 'dd-MM-yyyy')}.csv`
  );
  return true;
}

export function exportAgendaPDF({ consultas, pacientes, nomes, weekStart, configuracoes }) {
  const rows = getAgendaRows({ consultas, pacientes, nomes, weekStart });
  if (!rows.length) return false;
  const semana = `${format(addDays(weekStart, 0), 'dd/MM')} – ${format(addDays(weekStart, 5), 'dd/MM/yyyy')}`;
  openPrint(agendaHTML(rows, weekStart, configuracoes), `Agenda ${semana}`);
  return true;
}

export async function exportAgendaPNG({ consultas, pacientes, nomes, weekStart, configuracoes }) {
  const rows = getAgendaRows({ consultas, pacientes, nomes, weekStart });
  if (!rows.length) return false;
  const semana = `${format(addDays(weekStart, 0), 'dd/MM')} – ${format(addDays(weekStart, 5), 'dd/MM/yyyy')}`;
  const tableRows = rows.map(r =>
    `<tr style="border-bottom:1px solid #eee"><td style="padding:6px 8px">${htmlEsc(r.data)}</td><td style="padding:6px 8px">${htmlEsc(r.horario)}</td><td style="padding:6px 8px;font-weight:bold">${htmlEsc(r.paciente)}</td><td style="padding:6px 8px">${htmlEsc(r.telefone)}</td><td style="padding:6px 8px">${htmlEsc(r.responsavel)}</td><td style="padding:6px 8px">${badge(r.status)}</td></tr>`
  ).join('');
  const html = `<h1 style="font-size:18px;color:#800000;margin:0 0 4px">${htmlEsc(configuracoes?.nomeClinica || 'Agenda Duo')}</h1>
    <p style="color:#888;font-size:11px;margin:0 0 16px">Semana de ${htmlEsc(semana)}${configuracoes?.turma ? ' · ' + htmlEsc(configuracoes.turma) : ''}</p>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f5f5f5"><th style="padding:6px 8px;text-align:left;font-size:11px">Data</th><th style="padding:6px 8px;text-align:left;font-size:11px">Horário</th><th style="padding:6px 8px;text-align:left;font-size:11px">Paciente</th><th style="padding:6px 8px;text-align:left;font-size:11px">Telefone</th><th style="padding:6px 8px;text-align:left;font-size:11px">Responsável</th><th style="padding:6px 8px;text-align:left;font-size:11px">Status</th></tr>
      ${tableRows}
    </table>`;
  await captureHTML(html, `agenda-${format(weekStart, 'dd-MM-yyyy')}.png`);
  return true;
}

// ─── FICHA DE CONSULTA ────────────────────────────────────

function buildFichaHTML(consulta, paciente, nomes, cfg) {
  const resp = consulta.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
  return `<h1>${htmlEsc(cfg?.nomeClinica || 'Agenda Duo')}</h1>
    <p style="color:#666;margin:0 0 16px;font-size:11px">${htmlEsc(cfg?.turma || '')}</p>
    <h2>Dados do Paciente</h2>
    <table>
      <tr><th>Nome</th><td>${htmlEsc(paciente.nome)}</td><th>Idade</th><td>${htmlEsc(paciente.idade || '—')}</td></tr>
      <tr><th>Telefone</th><td>${htmlEsc(paciente.telefone || '—')}</td><th>Responsável</th><td>${htmlEsc(resp)}</td></tr>
      ${paciente.alertas ? `<tr><th>Alertas</th><td colspan="3" style="color:#c00;font-weight:bold">${htmlEsc(paciente.alertas)}</td></tr>` : ''}
    </table>
    <h2>Consulta</h2>
    <table>
      <tr><th>Data</th><td>${htmlEsc(fmtData(consulta.data))}</td><th>Horário</th><td>${htmlEsc(consulta.horario_fim ? consulta.horario + ' – ' + consulta.horario_fim : consulta.horario)}</td></tr>
      <tr><th>Status</th><td>${badge(consulta.status)}</td><th>Dente</th><td>${htmlEsc(consulta.dente || '—')}</td></tr>
      <tr><th>Procedimento</th><td colspan="3">${htmlEsc(consulta.procedimento || '—')}</td></tr>
      ${consulta.proxima_sessao ? `<tr><th>Próxima Sessão</th><td colspan="3">${htmlEsc(consulta.proxima_sessao)}</td></tr>` : ''}
    </table>
    ${consulta.descricao ? `<h2>Observações / Evolução</h2><p style="padding:8px;background:#f9f9f9;border-radius:4px;white-space:pre-wrap">${htmlEsc(consulta.descricao)}</p>` : ''}`;
}

function fichaFilename(paciente, consulta) {
  return `ficha-${fileSafe(paciente.nome, 'paciente')}-${fmtData(consulta.data).replace(/\//g, '-')}`;
}

export function exportFichaCSV(consulta, paciente, nomes) {
  const resp = consulta.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
  const rows = [
    ['Campo', 'Valor'],
    ['Paciente', paciente.nome],
    ['Idade', paciente.idade || ''],
    ['Telefone', paciente.telefone || ''],
    ['Responsável', resp],
    ['Alertas', paciente.alertas || ''],
    ['Data', fmtData(consulta.data)],
    ['Horário', consulta.horario_fim ? `${consulta.horario} – ${consulta.horario_fim}` : consulta.horario],
    ['Status', consulta.status],
    ['Dente', consulta.dente || ''],
    ['Procedimento', consulta.procedimento || ''],
    ['Próxima Sessão', consulta.proxima_sessao || ''],
    ['Observações', consulta.descricao || ''],
  ];
  downloadBlob(
    new Blob([BOM + rows.map(r => csvRow(r)).join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `${fichaFilename(paciente, consulta)}.csv`
  );
}

export function exportFichaPDF(consulta, paciente, nomes, cfg) {
  const html = buildFichaHTML(consulta, paciente, nomes, cfg);
  openPrint(html, `Ficha – ${paciente.nome} – ${fmtData(consulta.data)}`);
}

export async function exportFichaPNG(consulta, paciente, nomes, cfg) {
  const html = inlineStyles(buildFichaHTML(consulta, paciente, nomes, cfg))
    .replace(/class="(Confirmado|Pendente|Cancelado|Realizado)"/g, (_, s) =>
      `style="background:${STATUS_BG[s]};color:${STATUS_COR[s]};padding:2px 8px;border-radius:10px;font-weight:bold;font-size:10px"`
    );
  await captureHTML(html, `${fichaFilename(paciente, consulta)}.png`);
}

// ─── PRONTUÁRIO COMPLETO ──────────────────────────────────

function buildProntuarioHTML(paciente, consultasPac, planoPac, nomes, cfg) {
  const ordenadas = [...consultasPac].sort((a, b) => b.data.localeCompare(a.data));

  const consultasHTML = ordenadas.length
    ? `<table>
        <tr><th>Data</th><th>Horário</th><th>Responsável</th><th>Status</th><th>Dente</th><th>Procedimento</th><th>Observações</th></tr>
        ${ordenadas.map(c => {
          const resp = c.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
          return `<tr><td>${htmlEsc(fmtData(c.data))}</td><td>${htmlEsc(c.horario_fim ? c.horario + ' – ' + c.horario_fim : c.horario)}</td><td>${htmlEsc(resp)}</td><td>${badge(c.status)}</td><td>${htmlEsc(c.dente || '—')}</td><td>${htmlEsc(c.procedimento || '—')}</td><td>${htmlEsc(c.descricao || '—')}</td></tr>`;
        }).join('')}
      </table>`
    : '<p style="color:#888">Nenhuma consulta registrada.</p>';

  const planoHTML = planoPac.length
    ? `<table>
        <tr><th>Dente</th><th>Procedimento</th><th>Observações</th><th>Status</th></tr>
        ${planoPac.map(p => `<tr><td>${htmlEsc(p.dente || '—')}</td><td>${htmlEsc(p.procedimento)}</td><td>${htmlEsc(p.observacoes || '—')}</td><td>${badge(p.status)}</td></tr>`).join('')}
      </table>`
    : '<p style="color:#888">Nenhum item no plano.</p>';

  const anamnese = (paciente.queixa_principal || paciente.historico_medico || paciente.medicamentos)
    ? `<h2>Anamnese</h2><table>
        ${paciente.queixa_principal ? `<tr><th>Queixa Principal</th><td>${htmlEsc(paciente.queixa_principal)}</td></tr>` : ''}
        ${paciente.historico_medico ? `<tr><th>Histórico Médico</th><td>${htmlEsc(paciente.historico_medico)}</td></tr>` : ''}
        ${paciente.medicamentos ? `<tr><th>Medicamentos</th><td>${htmlEsc(paciente.medicamentos)}</td></tr>` : ''}
      </table>` : '';

  return `<h1>${htmlEsc(cfg?.nomeClinica || 'Agenda Duo')}</h1>
    <p style="color:#666;margin:0 0 16px;font-size:11px">Prontuário do Paciente${cfg?.turma ? ' · ' + htmlEsc(cfg.turma) : ''}</p>
    <h2>Dados do Paciente</h2>
    <table>
      <tr><th>Nome</th><td>${htmlEsc(paciente.nome)}</td><th>Idade</th><td>${htmlEsc(paciente.idade || '—')}</td></tr>
      <tr><th>Telefone</th><td>${htmlEsc(paciente.telefone || '—')}</td><td colspan="2"></td></tr>
      ${paciente.alertas ? `<tr><th>Alertas</th><td colspan="3" style="color:#c00;font-weight:bold">${htmlEsc(paciente.alertas)}</td></tr>` : ''}
    </table>
    ${anamnese}
    <h2>Plano de Tratamento</h2>${planoHTML}
    <h2>Histórico de Consultas (${ordenadas.length})</h2>${consultasHTML}`;
}

export function exportProntuarioCSV(paciente, consultasPac, planoPac, nomes) {
  const linhas = [
    csvRow(['=== DADOS DO PACIENTE ===']),
    csvRow(['Nome', paciente.nome]),
    csvRow(['Telefone', paciente.telefone || '']),
    csvRow(['Idade', paciente.idade || '']),
    csvRow(['Alertas', paciente.alertas || '']),
    ...(paciente.queixa_principal ? [csvRow(['Queixa Principal', paciente.queixa_principal])] : []),
    ...(paciente.historico_medico ? [csvRow(['Histórico Médico', paciente.historico_medico])] : []),
    ...(paciente.medicamentos ? [csvRow(['Medicamentos', paciente.medicamentos])] : []),
    '',
    csvRow(['=== PLANO DE TRATAMENTO ===']),
    csvRow(['Dente', 'Procedimento', 'Observações', 'Status']),
    ...planoPac.map(p => csvRow([p.dente || '', p.procedimento, p.observacoes || '', p.status])),
    '',
    csvRow(['=== HISTÓRICO DE CONSULTAS ===']),
    csvRow(['Data', 'Horário', 'Responsável', 'Status', 'Dente', 'Procedimento', 'Próxima Sessão', 'Observações']),
    ...[...consultasPac].sort((a, b) => b.data.localeCompare(a.data)).map(c => {
      const resp = c.dupla === 'Estudante A' ? nomes.estudanteA : nomes.estudanteB;
      return csvRow([fmtData(c.data), c.horario_fim ? `${c.horario} – ${c.horario_fim}` : c.horario, resp, c.status, c.dente || '', c.procedimento || '', c.proxima_sessao || '', c.descricao || '']);
    }),
  ];
  downloadBlob(
    new Blob([BOM + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' }),
    `prontuario-${fileSafe(paciente.nome, 'paciente')}.csv`
  );
}

export function exportProntuarioPDF(paciente, consultasPac, planoPac, nomes, cfg) {
  openPrint(buildProntuarioHTML(paciente, consultasPac, planoPac, nomes, cfg), `Prontuário – ${paciente.nome}`);
}

export async function exportProntuarioPNG(paciente, consultasPac, planoPac, nomes, cfg) {
  const html = inlineStyles(buildProntuarioHTML(paciente, consultasPac, planoPac, nomes, cfg))
    .replace(/class="(Confirmado|Pendente|Cancelado|Realizado)"/g, (_, s) =>
      `style="background:${STATUS_BG[s]};color:${STATUS_COR[s]};padding:2px 8px;border-radius:10px;font-weight:bold;font-size:10px"`
    );
  await captureHTML(html, `prontuario-${fileSafe(paciente.nome, 'paciente')}.png`);
}
