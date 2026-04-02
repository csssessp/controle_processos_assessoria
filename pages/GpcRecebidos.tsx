import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  X, Check, Loader2, AlertCircle, Download
} from 'lucide-react';
import { GpcService } from '../services/gpcService';
import { GpcRecebido, GpcPosicao } from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const exportCSV = (rows: GpcRecebido[], posicoes: GpcPosicao[]) => {
  const posMap = Object.fromEntries(posicoes.map(p => [p.codigo, p.posicao]));
  const cols = ['Código','Processo','Entidade','Convênio','Exercício','DRS','Data','Responsável','Posição','Movimento'];
  const body = rows.map(r => [
    r.codigo, r.processo ?? '', r.entidade ?? '', r.convenio ?? '',
    r.exercicio ?? '', r.drs ?? '', fmtDate(r.data), r.responsavel ?? '',
    r.posicao_id ? (posMap[r.posicao_id] ?? r.posicao_id) : '',
    r.movimento ?? ''
  ].map(v => {
    const s = String(v ?? '');
    return s.includes(';') ? `"${s}"` : s;
  }).join(';'));
  const csv = '\uFEFF' + [cols.join(';'), ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'gpc_processos_recebidos.csv';
  a.click(); URL.revokeObjectURL(url);
};

// ─── shared styles ───────────────────────────────────────────────────────────

const INPUT = 'w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL = 'block text-xs font-medium text-slate-600 mb-1';
const BTN_PRIMARY = 'flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50';
const BTN_GHOST = 'flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors';

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18}/></button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
    </div>
  </div>
);

// ─── Form ─────────────────────────────────────────────────────────────────────

const RecebidoForm = ({ initial, posicoes, onSave, onClose }: {
  initial?: Partial<GpcRecebido>;
  posicoes: GpcPosicao[];
  onSave: (r: Partial<GpcRecebido>) => Promise<void>;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcRecebido>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave(form); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Número do Processo</label>
          <input className={INPUT} value={form.processo ?? ''} onChange={e => set('processo', e.target.value)} required/>
        </div>
        <div>
          <label className={LABEL}>Convênio</label>
          <input className={INPUT} value={form.convenio ?? ''} onChange={e => set('convenio', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Entidade</label>
          <input className={INPUT} value={form.entidade ?? ''} onChange={e => set('entidade', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>Exercício (ano)</label>
          <input className={INPUT} value={form.exercicio ?? ''} onChange={e => set('exercicio', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>DRS</label>
          <input className={INPUT} type="number" min={0} max={20} value={form.drs ?? ''} onChange={e => set('drs', e.target.value ? Number(e.target.value) : null)}/>
        </div>
        <div>
          <label className={LABEL}>Data</label>
          <input className={INPUT} type="date" value={form.data ?? ''} onChange={e => set('data', e.target.value || null)}/>
        </div>
        <div>
          <label className={LABEL}>Responsável</label>
          <input className={INPUT} value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>Posição</label>
          <select className={INPUT} value={form.posicao_id ?? ''} onChange={e => set('posicao_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">— selecione —</option>
            {posicoes.map(p => <option key={p.codigo} value={p.codigo}>{p.posicao}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Movimento</label>
          <input className={INPUT} value={form.movimento ?? ''} onChange={e => set('movimento', e.target.value)}/>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>}Salvar
        </button>
      </div>
    </form>
  );
};

// ─── posição badge ────────────────────────────────────────────────────────────

const POSICAO_COLORS: Record<number, string> = {
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-orange-100 text-orange-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-purple-100 text-purple-700',
  5: 'bg-slate-100 text-slate-600',
  6: 'bg-green-100 text-green-700',
  7: 'bg-emerald-100 text-emerald-700',
  8: 'bg-indigo-100 text-indigo-700',
  9: 'bg-red-100 text-red-600',
  10: 'bg-teal-100 text-teal-700',
  11: 'bg-cyan-100 text-cyan-700',
  12: 'bg-pink-100 text-pink-700',
};

const PosicaoBadge = ({ id, label }: { id: number | null; label: string | null }) => {
  if (!id || !label) return <span className="text-slate-400">—</span>;
  const cls = POSICAO_COLORS[id] ?? 'bg-slate-100 text-slate-600';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>{label}</span>;
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GpcRecebidos = () => {
  const [rows, setRows] = useState<GpcRecebido[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [posicoes, setPosicoes] = useState<GpcPosicao[]>([]);
  const [modal, setModal] = useState<null | { data?: GpcRecebido }>(null);
  const PAGE_SIZE = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const result = await GpcService.getRecebidos(search, page, PAGE_SIZE);
    setRows(result.data);
    setCount(result.count);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { GpcService.getPosicoes().then(setPosicoes); }, []);

  const handleDelete = async (codigo: number) => {
    if (!confirm('Excluir este registro?')) return;
    try { await GpcService.deleteRecebido(codigo); await load(); }
    catch (ex: any) { alert(ex.message); }
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Processos Recebidos</h2>
          <p className="text-sm text-slate-500 mt-0.5">{count.toLocaleString('pt-BR')} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={async () => {
              // load all for export
              const all = await GpcService.getRecebidos('', 1, 9999);
              exportCSV(all.data, posicoes);
            }}
          >
            <Download size={14}/>Exportar CSV
          </button>
          <button className={BTN_PRIMARY} onClick={() => setModal({})}>
            <Plus size={16}/>Novo Registro
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
        <input
          className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Buscar por processo, entidade, convênio ou responsável..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Filter badges for posição */}
      {posicoes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {posicoes.map(p => (
            <button
              key={p.codigo}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${POSICAO_COLORS[p.codigo] ?? 'bg-slate-100 text-slate-600'} hover:opacity-80`}
              onClick={() => { setSearch(p.posicao ?? ''); setPage(1); }}
              title={`Filtrar por: ${p.posicao}`}
            >
              {p.posicao}
            </button>
          ))}
          {search && (
            <button className="px-2.5 py-1 text-xs rounded-full border bg-red-50 text-red-600 hover:bg-red-100" onClick={() => setSearch('')}>
              ✕ Limpar filtro
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Processo','Convênio','Entidade','Exercício','DRS','Data','Responsável','Posição','Movimento',''].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.codigo} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-3 text-sm font-medium text-slate-800 max-w-[160px] truncate" title={r.processo ?? ''}>{r.processo ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.convenio ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-700 max-w-[200px] truncate" title={r.entidade ?? ''}>{r.entidade ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-center text-slate-600">{r.exercicio ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-center text-slate-600">{r.drs ?? '-'}</td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600">{fmtDate(r.data)}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.responsavel ?? '-'}</td>
                    <td className="px-3 py-3">
                      <PosicaoBadge id={r.posicao_id} label={r.posicao ?? null}/>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.movimento ?? '-'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="Editar" onClick={() => setModal({ data: r })}><Edit size={15}/></button>
                        <button className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Excluir" onClick={() => handleDelete(r.codigo)}><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={10} className="py-16 text-center text-slate-400">Nenhum registro encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Página {page} de {totalPages} — {count.toLocaleString('pt-BR')} registros</span>
          <div className="flex gap-2">
            <button className={BTN_GHOST} disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/>Anterior</button>
            <button className={BTN_GHOST} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima<ChevronRight size={16}/></button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <Modal title={modal.data ? 'Editar Registro' : 'Novo Registro'} onClose={() => setModal(null)}>
          <RecebidoForm
            initial={modal.data}
            posicoes={posicoes}
            onSave={async (r) => { await GpcService.saveRecebido(r); await load(); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
};
