import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  X, Check, Loader2, AlertCircle, Download
} from 'lucide-react';
import { GpcService } from '../services/gpcService';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
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

const INPUT = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300';
const LABEL = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
const BTN_PRIMARY_GREEN = BTN_PRIMARY.replace('bg-blue-600', 'bg-green-600').replace('hover:bg-blue-700', 'hover:bg-green-700');
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm';

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="bg-slate-50/95 rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white rounded-t-2xl">
        <h3 className="text-base font-bold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

// ─── posição badge (mesma paleta/formato usado em GpcProcessos_v2.tsx) ────────

const POS_CFG: Record<number, { bg: string; text: string; dot: string; border: string }> = {
  1:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    border: 'border-blue-200' },
  2:  { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500',  border: 'border-orange-200' },
  3:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500',  border: 'border-yellow-200' },
  4:  { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  border: 'border-purple-200' },
  5:  { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400',   border: 'border-slate-200' },
  6:  { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500',   border: 'border-green-200' },
  7:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' },
  8:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500',  border: 'border-indigo-200' },
  9:  { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500',     border: 'border-red-200' },
  10: { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-500',    border: 'border-teal-200' },
  11: { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500',    border: 'border-cyan-200' },
  12: { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: 'bg-pink-500',    border: 'border-pink-200' },
};
const POS_DEF = { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200' };

const PosicaoBadge = ({ id, label }: { id: number | null; label: string | null }) => {
  if (!id || !label) return <span className="text-slate-300 text-xs">-</span>;
  const c = POS_CFG[id] ?? POS_DEF;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {label}
    </span>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GpcRecebidos = () => {
  const { toast } = useToast();
  const { confirmAction } = useConfirm();
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
    if (!(await confirmAction('Excluir este registro?', { danger: true }))) return;
    try { await GpcService.deleteRecebido(codigo); await load(); }
    catch (ex: any) { toast('error', ex.message); }
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
            className={BTN_PRIMARY_GREEN}
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
          className={INPUT + ' pl-10'}
          placeholder="Buscar por processo, entidade, convênio ou responsável..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Filter badges for posição */}
      {posicoes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {posicoes.map(p => {
            const c = POS_CFG[p.codigo] ?? POS_DEF;
            return (
              <button
                key={p.codigo}
                className={`px-2.5 py-1 text-xs font-semibold rounded-full border transition-colors ${c.bg} ${c.text} ${c.border} hover:opacity-80`}
                onClick={() => { setSearch(p.posicao ?? ''); setPage(1); }}
                title={`Filtrar por: ${p.posicao}`}
              >
                {p.posicao}
              </button>
            );
          })}
          {search && (
            <button className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border border-transparent bg-red-50 text-red-600 hover:bg-red-100" onClick={() => setSearch('')}>
              <X size={11} />Limpar filtro
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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
                    <td className="px-3 py-3 text-sm text-slate-600 max-w-[160px] truncate" title={r.responsavel ?? ''}>{r.responsavel ?? '-'}</td>
                    <td className="px-3 py-3">
                      <PosicaoBadge id={r.posicao_id} label={r.posicao ?? null}/>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 max-w-[160px] truncate" title={r.movimento ?? ''}>{r.movimento ?? '-'}</td>
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
