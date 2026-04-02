const fs = require('fs');
const xlsx = require('xlsx');

// Read Excel
const wb = xlsx.readFile('C:/Users/afpereira/Downloads/access/Relação de Processos Recebidos.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });

function esc(v) {
  if (v === null || v === undefined || String(v).trim() === '') return 'NULL';
  return "'" + String(v).replace(/'/g, "''").trim() + "'";
}
function escInt(v) {
  if (v === null || v === undefined || String(v).trim() === '') return 'NULL';
  const n = parseInt(String(v), 10);
  return isNaN(n) ? 'NULL' : String(n);
}
function escDate(v) {
  if (!v) return 'NULL';
  const s = String(v).trim();
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return "'" + m1[0] + "'";
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m2) {
    const y = m2[3].length === 2 ? '20' + m2[3] : m2[3];
    const mo = m2[1].padStart(2, '0');
    const d = m2[2].padStart(2, '0');
    return "'" + y + '-' + mo + '-' + d + "'";
  }
  return 'NULL';
}

const lines = ['-- Dados: cgof_gpc_recebidos  (987 registos)'];
for (let i = 1; i < rows.length; i++) {
  const r = rows[i];
  const seq = i;
  const vals = [
    seq,
    escInt(r[0]),
    esc(r[1]),
    esc(r[2]),
    esc(r[3]),
    esc(r[4]),
    escInt(r[5]),
    escDate(r[6]),
    esc(r[7]),
    escInt(r[8]),
    esc(r[9])
  ].join(', ');
  lines.push(
    'INSERT INTO public.cgof_gpc_recebidos (codigo, processo_codigo, processo, entidade, convenio, exercicio, drs, data, responsavel, posicao_id, movimento) VALUES (' + vals + ') ON CONFLICT (codigo) DO NOTHING;'
  );
}

const out = 'C:/Users/afpereira/Downloads/cgof_controle_Processos-main/sql_parts/parte_10_dados_recebidos.sql';
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log('OK - ' + (lines.length - 1) + ' INSERTs gravados.');
console.log('Amostra:', lines[1].substring(0, 120));
