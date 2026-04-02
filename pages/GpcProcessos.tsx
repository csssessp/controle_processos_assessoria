import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, X, Check, Loader2, AlertCircle,
  FileText, Calendar, Activity, ClipboardList, GitBranch,
  Download, ArrowUp, ArrowDown, ArrowUpDown
} from 'lucide-react';
import { GpcService } from '../services/gpcService';
import {
  GpcProcesso, GpcProcessoFull, GpcExercicio, GpcHistorico,
  GpcObjeto, GpcParcelamento, GpcTa, GpcPosicao, GpcRecebido
} from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
  v == null ? '-' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const sv = (v: unknown) => (v == null ? '' : String(v)).toLowerCase().trim();

function sortByCol<T>(arr: T[], sort: SortState | null): T[] {
  if (!sort) return arr;
  return [...arr].sort((a, b) => {
    const va = sv((a as Record<string, unknown>)[sort.col]);
    const vb = sv((b as Record<string, unknown>)[sort.col]);
    const cmp = va.localeCompare(vb, 'pt-BR', { numeric: true });
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const INPUT = 'w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL = 'block text-xs font-medium text-slate-600 mb-1';
const BTN_PRIMARY = 'flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50';
const BTN_GHOST = 'flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors';

// ─── Sort type ────────────────────────────────────────────────────────────────

interface SortState { col: string; dir: 'asc' | 'desc'; }

// ─── SortTh ───────────────────────────────────────────────────────────────────

const SortTh = ({ label, col, sort, onSort, className = '' }: {
  label: string; col: string; sort: SortState | null;
  onSort: (col: string) => void; className?: string;
}) => {
  const active = sort?.col === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 group ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? sort!.dir === 'asc'
            ? <ArrowUp size={11} className="text-blue-500" />
            : <ArrowDown size={11} className="text-blue-500" />
          : <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-400" />}
      </div>
    </th>
  );
};

// ─── Filter cells ─────────────────────────────────────────────────────────────

const FTh = ({ value, onChange, placeholder = 'filtrar...' }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <th className="px-2 py-1 bg-slate-50">
    <input
      className="w-full text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-300 font-normal"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
    />
  </th>
);

const FThSelect = ({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) => (
  <th className="px-2 py-1 bg-slate-50">
    <select
      className="w-full text-xs border border-slate-200 rounded px-1 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 font-normal"
      value={value}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
    >
      <option value="">Todos</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </th>
);

const FThEmpty = () => <th className="px-2 py-1 bg-slate-50" />;

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = ({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className={`bg-white rounded-xl shadow-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-2xl'} max-h-[90vh] flex flex-col`}>
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100"><X size={18} /></button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-4">{children}</div>
    </div>
  </div>
);

// ─── ProcessoForm ─────────────────────────────────────────────────────────────

const ProcessoForm = ({ initial, onSave, onClose }: {
  initial?: Partial<GpcProcesso>;
  onSave: (p: Partial<GpcProcesso>) => Promise<void>;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcProcesso>>(initial ?? { vistoriado: false, parcelamento: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcProcesso, v: any) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave(form); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={LABEL}>Número do Processo</label><input className={INPUT} value={form.processo ?? ''} onChange={e => set('processo', e.target.value)} /></div>
        <div><label className={LABEL}>Convênio</label><input className={INPUT} value={form.convenio ?? ''} onChange={e => set('convenio', e.target.value)} /></div>
        <div>
          <label className={LABEL}>Tipo</label>
          <select className={INPUT} value={form.tipo ?? ''} onChange={e => set('tipo', e.target.value)}>
            <option value="">— selecione —</option>
            {['SEI', 'SPDOC', 'SEM PAPEL', 'SPDOC/SISRAD', '18', '200'].map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div><label className={LABEL}>Ano de Cadastro</label><input className={INPUT} value={form.ano_cadastro ?? ''} onChange={e => set('ano_cadastro', e.target.value)} maxLength={4} /></div>
        <div className="col-span-2"><label className={LABEL}>Entidade</label><input className={INPUT} value={form.entidade ?? ''} onChange={e => set('entidade', e.target.value)} /></div>
        <div><label className={LABEL}>DRS</label><input className={INPUT} type="number" min={0} max={20} value={form.drs ?? ''} onChange={e => set('drs', e.target.value ? Number(e.target.value) : null)} /></div>
        <div>
          <label className={LABEL}>Acima/Abaixo</label>
          <select className={INPUT} value={form.acima_abaixo ?? ''} onChange={e => set('acima_abaixo', e.target.value || null)}>
            <option value="">—</option>
            <option>Acima</option><option>Abaixo</option><option>PARCELAMENTO</option>
          </select>
        </div>
        <div className="flex items-center gap-6 col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.vistoriado ?? false} onChange={e => set('vistoriado', e.target.checked)} className="w-4 h-4 accent-blue-600" />Vistoriado
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={form.parcelamento ?? false} onChange={e => set('parcelamento', e.target.checked)} className="w-4 h-4 accent-blue-600" />Parcelamento
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Salvar
        </button>
      </div>
    </form>
  );
};

// ─── RecebidoForm ─────────────────────────────────────────────────────────────

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
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={LABEL}>Número do Processo</label><input className={INPUT} value={form.processo ?? ''} onChange={e => set('processo', e.target.value)} required /></div>
        <div><label className={LABEL}>Convênio</label><input className={INPUT} value={form.convenio ?? ''} onChange={e => set('convenio', e.target.value)} /></div>
        <div className="col-span-2"><label className={LABEL}>Entidade</label><input className={INPUT} value={form.entidade ?? ''} onChange={e => set('entidade', e.target.value)} /></div>
        <div><label className={LABEL}>Exercício (ano)</label><input className={INPUT} value={form.exercicio ?? ''} onChange={e => set('exercicio', e.target.value)} /></div>
        <div><label className={LABEL}>DRS</label><input className={INPUT} type="number" min={0} max={20} value={form.drs ?? ''} onChange={e => set('drs', e.target.value ? Number(e.target.value) : null)} /></div>
        <div><label className={LABEL}>Data</label><input className={INPUT} type="date" value={form.data ?? ''} onChange={e => set('data', e.target.value || null)} /></div>
        <div><label className={LABEL}>Responsável</label><input className={INPUT} value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} /></div>
        <div>
          <label className={LABEL}>Posição</label>
          <select className={INPUT} value={form.posicao_id ?? ''} onChange={e => set('posicao_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">— selecione —</option>
            {posicoes.map(p => <option key={p.codigo} value={p.codigo}>{p.posicao}</option>)}
          </select>
        </div>
        <div><label className={LABEL}>Movimento</label><input className={INPUT} value={form.movimento ?? ''} onChange={e => set('movimento', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Salvar
        </button>
      </div>
    </form>
  );
};

// ─── ExercicioForm ────────────────────────────────────────────────────────────

const ExercicioForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcExercicio>;
  onSave: (e: Partial<GpcExercicio>) => Promise<void>; onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcExercicio>>(initial ?? { processo_id: processoId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcExercicio, v: any) => setForm(f => ({ ...f, [k]: v }));
  const num = (v: string) => v === '' ? null : Number(v);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...form, processo_id: processoId }); onClose(); }
    catch (ex: any) { setErr(ex.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={LABEL}>Exercício (ano)</label><input className={INPUT} value={form.exercicio ?? ''} onChange={e => set('exercicio', e.target.value)} required /></div>
        <div><label className={LABEL}>Exercício Anterior (R$)</label><input className={INPUT} type="number" step="0.01" value={form.exercicio_anterior ?? ''} onChange={e => set('exercicio_anterior', num(e.target.value))} /></div>
        <div><label className={LABEL}>Repasse (R$)</label><input className={INPUT} type="number" step="0.01" value={form.repasse ?? ''} onChange={e => set('repasse', num(e.target.value))} /></div>
        <div><label className={LABEL}>Aplicação (R$)</label><input className={INPUT} type="number" step="0.01" value={form.aplicacao ?? ''} onChange={e => set('aplicacao', num(e.target.value))} /></div>
        <div><label className={LABEL}>Gastos (R$)</label><input className={INPUT} type="number" step="0.01" value={form.gastos ?? ''} onChange={e => set('gastos', num(e.target.value))} /></div>
        <div><label className={LABEL}>Devolvido (R$)</label><input className={INPUT} type="number" step="0.01" value={form.devolvido ?? ''} onChange={e => set('devolvido', num(e.target.value))} /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Salvar
        </button>
      </div>
    </form>
  );
};

// ─── HistoricoForm ────────────────────────────────────────────────────────────

const HistoricoForm = ({ exercicioId, posicoes, initial, onSave, onClose }: {
  exercicioId: number; posicoes: GpcPosicao[]; initial?: Partial<GpcHistorico>;
  onSave: (h: Partial<GpcHistorico>) => Promise<void>; onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcHistorico>>(initial ?? { exercicio_id: exercicioId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcHistorico, v: any) => setForm(f => ({ ...f, [k]: v }));
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...form, exercicio_id: exercicioId }); onClose(); }
    catch (ex: any) { setErr(ex.message); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={LABEL}>Movimento</label><input className={INPUT} value={form.movimento ?? ''} onChange={e => set('movimento', e.target.value)} required /></div>
        <div><label className={LABEL}>Data</label><input className={INPUT} type="date" value={form.data ?? ''} onChange={e => set('data', e.target.value || null)} /></div>
        <div><label className={LABEL}>Setor</label><input className={INPUT} value={form.setor ?? ''} onChange={e => set('setor', e.target.value)} /></div>
        <div><label className={LABEL}>Responsável</label><input className={INPUT} value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value)} /></div>
        <div>
          <label className={LABEL}>Posição</label>
          <select className={INPUT} value={form.posicao_id ?? ''} onChange={e => set('posicao_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">— selecione —</option>
            {posicoes.map(p => <option key={p.codigo} value={p.codigo}>{p.posicao}</option>)}
          </select>
        </div>
        <div><label className={LABEL}>Ação</label><input className={INPUT} value={form.acao ?? ''} onChange={e => set('acao', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Salvar
        </button>
      </div>
    </form>
  );
};

// ─── ObjetoForm ───────────────────────────────────────────────────────────────

const ObjetoForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcObjeto>;
  onSave: (o: Partial<GpcObjeto>) => Promise<void>; onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcObjeto>>(initial ?? { processo_id: processoId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...form, processo_id: processoId }); onClose(); }
    catch (ex: any) { setErr(ex.message); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{err}</div>}
      <div><label className={LABEL}>Descrição do Objeto</label><textarea className={INPUT} rows={4} value={form.objeto ?? ''} onChange={e => setForm(f => ({ ...f, objeto: e.target.value }))} required /></div>
      <div><label className={LABEL}>Custo (R$)</label><input className={INPUT} type="number" step="0.01" value={form.custo ?? ''} onChange={e => setForm(f => ({ ...f, custo: e.target.value ? Number(e.target.value) : null }))} /></div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Salvar</button>
      </div>
    </form>
  );
};

// ─── ParcelamentoForm ─────────────────────────────────────────────────────────

const ParcelamentoForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcParcelamento>;
  onSave: (p: Partial<GpcParcelamento>) => Promise<void>; onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcParcelamento>>(initial ?? { processo_id: processoId, em_dia: false, parcelas_concluidas: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcParcelamento, v: any) => setForm(f => ({ ...f, [k]: v }));
  const num = (v: string) => v === '' ? null : Number(v);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...form, processo_id: processoId }); onClose(); }
    catch (ex: any) { setErr(ex.message); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={LABEL}>Proc. Parcela</label><input className={INPUT} value={form.proc_parcela ?? ''} onChange={e => set('proc_parcela', e.target.value)} /></div>
        <div><label className={LABEL}>Tipo</label><input className={INPUT} value={form.tipo ?? ''} onChange={e => set('tipo', e.target.value)} /></div>
        <div><label className={LABEL}>Exercício</label><input className={INPUT} type="number" value={form.exercicio ?? ''} onChange={e => set('exercicio', num(e.target.value))} /></div>
        <div><label className={LABEL}>Nº Parcelas</label><input className={INPUT} type="number" value={form.parcelas ?? ''} onChange={e => set('parcelas', num(e.target.value))} /></div>
        <div><label className={LABEL}>Valor Parcelado (R$)</label><input className={INPUT} type="number" step="0.01" value={form.valor_parcelado ?? ''} onChange={e => set('valor_parcelado', num(e.target.value))} /></div>
        <div><label className={LABEL}>Valor Corrigido (R$)</label><input className={INPUT} type="number" step="0.01" value={form.valor_corrigido ?? ''} onChange={e => set('valor_corrigido', num(e.target.value))} /></div>
        <div className="flex items-center gap-4 col-span-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.em_dia ?? false} onChange={e => set('em_dia', e.target.checked)} className="w-4 h-4 accent-blue-600" />Em Dia</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.parcelas_concluidas ?? false} onChange={e => set('parcelas_concluidas', e.target.checked)} className="w-4 h-4 accent-blue-600" />Concluídas</label>
        </div>
        <div className="col-span-2"><label className={LABEL}>Providências</label><textarea className={INPUT} rows={3} value={form.providencias ?? ''} onChange={e => set('providencias', e.target.value)} /></div>
        <div className="col-span-2"><label className={LABEL}>Observações</label><textarea className={INPUT} rows={2} value={form.obs ?? ''} onChange={e => set('obs', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Salvar</button>
      </div>
    </form>
  );
};

// ─── TaForm ───────────────────────────────────────────────────────────────────

const TaForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcTa>;
  onSave: (t: Partial<GpcTa>) => Promise<void>; onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcTa>>(initial ?? { processo_id: processoId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...form, processo_id: processoId }); onClose(); }
    catch (ex: any) { setErr(ex.message); } finally { setSaving(false); }
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16} />{err}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2"><label className={LABEL}>Número do TA</label><input className={INPUT} value={form.numero ?? ''} onChange={e => setForm(f => ({ ...f, numero: e.target.value }))} required /></div>
        <div><label className={LABEL}>Data</label><input className={INPUT} type="date" value={form.data ?? ''} onChange={e => setForm(f => ({ ...f, data: e.target.value || null }))} /></div>
        <div><label className={LABEL}>Custo (R$)</label><input className={INPUT} type="number" step="0.01" value={form.custo ?? ''} onChange={e => setForm(f => ({ ...f, custo: e.target.value ? Number(e.target.value) : null }))} /></div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>{saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Salvar</button>
      </div>
    </form>
  );
};

// ─── PosicaoBadge ─────────────────────────────────────────────────────────────

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
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${POSICAO_COLORS[id] ?? 'bg-slate-100 text-slate-600'}`}>{label}</span>;
};

// ─── DetailPanel ──────────────────────────────────────────────────────────────

const DetailPanel = ({ processo, posicoes, onRefresh }: {
  processo: GpcProcessoFull; posicoes: GpcPosicao[]; onRefresh: () => void;
}) => {
  const [tab, setTab] = useState<'exercicios' | 'historico' | 'objetos' | 'parcelamentos' | 'tas'>('exercicios');
  const [modal, setModal] = useState<null | { type: string; data?: any }>(null);

  const tabBtn = (id: typeof tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${tab === id ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
    >
      {icon}{label}
    </button>
  );

  const confirmDelete = async (action: () => Promise<void>) => {
    if (!confirm('Confirma a exclusão?')) return;
    try { await action(); onRefresh(); }
    catch (ex: any) { alert(ex.message); }
  };

  return (
    <div className="mt-3 border-t pt-3">
      <div className="flex gap-1 border-b mb-3 overflow-x-auto">
        {tabBtn('exercicios', `Exercícios (${processo.exercicios?.length ?? 0})`, <Calendar size={14} />)}
        {tabBtn('historico', `Histórico (${processo.historicos?.length ?? 0})`, <Activity size={14} />)}
        {tabBtn('objetos', `Objetos (${processo.objetos?.length ?? 0})`, <FileText size={14} />)}
        {tabBtn('parcelamentos', `Parcelamentos (${processo.parcelamentos?.length ?? 0})`, <ClipboardList size={14} />)}
        {tabBtn('tas', `Termos Aditivos (${processo.tas?.length ?? 0})`, <GitBranch size={14} />)}
      </div>

      {tab === 'exercicios' && (
        <div className="space-y-2">
          <button className={BTN_PRIMARY} onClick={() => setModal({ type: 'exercicio' })}><Plus size={14} />Novo Exercício</button>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Ano', 'Ex.Anterior', 'Repasse', 'Aplicação', 'Gastos', 'Devolvido', ''].map(h => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(processo.exercicios ?? []).map(ex => (
                  <tr key={ex.codigo} className="border-t hover:bg-slate-50">
                    <td className="px-2 py-1.5 font-medium">{ex.exercicio}</td>
                    <td className="px-2 py-1.5">{fmt(ex.exercicio_anterior)}</td>
                    <td className="px-2 py-1.5">{fmt(ex.repasse)}</td>
                    <td className="px-2 py-1.5">{fmt(ex.aplicacao)}</td>
                    <td className="px-2 py-1.5">{fmt(ex.gastos)}</td>
                    <td className="px-2 py-1.5">{fmt(ex.devolvido)}</td>
                    <td className="px-2 py-1.5 flex gap-1">
                      <button className="p-1 hover:text-blue-600" onClick={() => setModal({ type: 'exercicio', data: ex })}><Edit size={13} /></button>
                      <button className="p-1 hover:text-red-600" onClick={() => confirmDelete(() => GpcService.deleteExercicio(ex.codigo))}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                {!processo.exercicios?.length && <tr><td colSpan={7} className="px-2 py-4 text-center text-slate-400">Nenhum exercício cadastrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'historico' && (
        <div className="space-y-2">
          {(processo.exercicios ?? []).length > 0 && (
            <button className={BTN_PRIMARY} onClick={() => setModal({ type: 'historico' })}><Plus size={14} />Novo Movimento</button>
          )}
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Data', 'Movimento', 'Ação', 'Setor', 'Responsável', 'Posição', ''].map(h => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(processo.historicos ?? []).map(h => (
                  <tr key={h.codigo} className="border-t hover:bg-slate-50">
                    <td className="px-2 py-1.5 whitespace-nowrap">{fmtDate(h.data)}</td>
                    <td className="px-2 py-1.5 max-w-[200px] truncate">{h.movimento ?? '-'}</td>
                    <td className="px-2 py-1.5">{h.acao ?? '-'}</td>
                    <td className="px-2 py-1.5">{h.setor ?? '-'}</td>
                    <td className="px-2 py-1.5">{h.responsavel ?? '-'}</td>
                    <td className="px-2 py-1.5"><span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">{h.posicao ?? '-'}</span></td>
                    <td className="px-2 py-1.5 flex gap-1">
                      <button className="p-1 hover:text-blue-600" onClick={() => setModal({ type: 'historico', data: h })}><Edit size={13} /></button>
                      <button className="p-1 hover:text-red-600" onClick={() => confirmDelete(() => GpcService.deleteHistorico(h.codigo))}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                {!processo.historicos?.length && <tr><td colSpan={7} className="px-2 py-4 text-center text-slate-400">Nenhum movimento cadastrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'objetos' && (
        <div className="space-y-2">
          <button className={BTN_PRIMARY} onClick={() => setModal({ type: 'objeto' })}><Plus size={14} />Novo Objeto</button>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Descrição do Objeto', 'Custo', ''].map(h => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(processo.objetos ?? []).map(o => (
                  <tr key={o.codigo} className="border-t hover:bg-slate-50">
                    <td className="px-2 py-1.5 max-w-[400px]">{o.objeto ?? '-'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap font-medium text-green-700">{fmt(o.custo)}</td>
                    <td className="px-2 py-1.5 flex gap-1">
                      <button className="p-1 hover:text-blue-600" onClick={() => setModal({ type: 'objeto', data: o })}><Edit size={13} /></button>
                      <button className="p-1 hover:text-red-600" onClick={() => confirmDelete(() => GpcService.deleteObjeto(o.codigo))}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                {!processo.objetos?.length && <tr><td colSpan={3} className="px-2 py-4 text-center text-slate-400">Nenhum objeto cadastrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'parcelamentos' && (
        <div className="space-y-2">
          <button className={BTN_PRIMARY} onClick={() => setModal({ type: 'parcelamento' })}><Plus size={14} />Novo Parcelamento</button>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Proc.Parcela', 'Tipo', 'Exercício', 'Val.Parcelado', 'Val.Corrigido', 'Parcelas', 'Em Dia', 'Concluído', ''].map(h => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(processo.parcelamentos ?? []).map(p => (
                  <tr key={p.codigo} className="border-t hover:bg-slate-50">
                    <td className="px-2 py-1.5 max-w-[120px] truncate">{p.proc_parcela ?? '-'}</td>
                    <td className="px-2 py-1.5">{p.tipo ?? '-'}</td>
                    <td className="px-2 py-1.5">{p.exercicio ?? '-'}</td>
                    <td className="px-2 py-1.5">{fmt(p.valor_parcelado)}</td>
                    <td className="px-2 py-1.5">{fmt(p.valor_corrigido)}</td>
                    <td className="px-2 py-1.5 text-center">{p.parcelas ?? '-'}</td>
                    <td className="px-2 py-1.5 text-center">{p.em_dia ? '✅' : '❌'}</td>
                    <td className="px-2 py-1.5 text-center">{p.parcelas_concluidas ? '✅' : '❌'}</td>
                    <td className="px-2 py-1.5 flex gap-1">
                      <button className="p-1 hover:text-blue-600" onClick={() => setModal({ type: 'parcelamento', data: p })}><Edit size={13} /></button>
                      <button className="p-1 hover:text-red-600" onClick={() => confirmDelete(() => GpcService.deleteParcelamento(p.codigo))}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                {!processo.parcelamentos?.length && <tr><td colSpan={9} className="px-2 py-4 text-center text-slate-400">Nenhum parcelamento cadastrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'tas' && (
        <div className="space-y-2">
          <button className={BTN_PRIMARY} onClick={() => setModal({ type: 'ta' })}><Plus size={14} />Novo Termo Aditivo</button>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>{['Número', 'Data', 'Custo', ''].map(h => <th key={h} className="px-2 py-2 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(processo.tas ?? []).map(t => (
                  <tr key={t.codigo} className="border-t hover:bg-slate-50">
                    <td className="px-2 py-1.5 max-w-[250px] truncate">{t.numero ?? '-'}</td>
                    <td className="px-2 py-1.5 whitespace-nowrap">{fmtDate(t.data)}</td>
                    <td className="px-2 py-1.5 font-medium text-green-700">{fmt(t.custo)}</td>
                    <td className="px-2 py-1.5 flex gap-1">
                      <button className="p-1 hover:text-blue-600" onClick={() => setModal({ type: 'ta', data: t })}><Edit size={13} /></button>
                      <button className="p-1 hover:text-red-600" onClick={() => confirmDelete(() => GpcService.deleteTa(t.codigo))}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                ))}
                {!processo.tas?.length && <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-400">Nenhum termo aditivo cadastrado</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal?.type === 'exercicio' && (
        <Modal title={modal.data ? 'Editar Exercício' : 'Novo Exercício'} onClose={() => setModal(null)}>
          <ExercicioForm processoId={processo.codigo} initial={modal.data}
            onSave={async (e) => { await GpcService.saveExercicio(e); onRefresh(); }}
            onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'historico' && (
        <Modal title={modal.data ? 'Editar Movimento' : 'Novo Movimento'} onClose={() => setModal(null)}>
          <HistoricoForm
            exercicioId={modal.data?.exercicio_id ?? processo.exercicios?.[0]?.codigo ?? 0}
            posicoes={posicoes} initial={modal.data}
            onSave={async (h) => { await GpcService.saveHistorico(h); onRefresh(); }}
            onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'objeto' && (
        <Modal title={modal.data ? 'Editar Objeto' : 'Novo Objeto'} onClose={() => setModal(null)}>
          <ObjetoForm processoId={processo.codigo} initial={modal.data}
            onSave={async (o) => { await GpcService.saveObjeto(o); onRefresh(); }}
            onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'parcelamento' && (
        <Modal title={modal.data ? 'Editar Parcelamento' : 'Novo Parcelamento'} onClose={() => setModal(null)}>
          <ParcelamentoForm processoId={processo.codigo} initial={modal.data}
            onSave={async (p) => { await GpcService.saveParcelamento(p); onRefresh(); }}
            onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.type === 'ta' && (
        <Modal title={modal.data ? 'Editar Termo Aditivo' : 'Novo Termo Aditivo'} onClose={() => setModal(null)}>
          <TaForm processoId={processo.codigo} initial={modal.data}
            onSave={async (t) => { await GpcService.saveTa(t); onRefresh(); }}
            onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
};

// ─── Main Unified Component ───────────────────────────────────────────────────

export const GpcProcessos = () => {
  const [tab, setTab] = useState<'processos' | 'recebidos'>('processos');

  // ── Shared ──────────────────────────────────────────────────────────────────
  const [posicoes, setPosicoes] = useState<GpcPosicao[]>([]);

  // ── Processos ───────────────────────────────────────────────────────────────
  const [processos, setProcessos] = useState<GpcProcesso[]>([]);
  const [loadingProc, setLoadingProc] = useState(false);
  const [pSort, setPSort] = useState<SortState | null>(null);
  const [pFilters, setPFilters] = useState({ processo: '', convenio: '', tipo: '', ano_cadastro: '', entidade: '', drs: '' });
  const [pPage, setPPage] = useState(1);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [fullData, setFullData] = useState<GpcProcessoFull | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [modalProc, setModalProc] = useState<null | { data?: GpcProcesso }>(null);

  // ── Recebidos ────────────────────────────────────────────────────────────────
  const [recebidos, setRecebidos] = useState<GpcRecebido[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);
  const [rSort, setRSort] = useState<SortState | null>(null);
  const [rFilters, setRFilters] = useState({ processo: '', convenio: '', entidade: '', exercicio: '', drs: '', responsavel: '', posicao_id: '', movimento: '' });
  const [rPage, setRPage] = useState(1);
  const [modalRec, setModalRec] = useState<null | { data?: GpcRecebido }>(null);

  const PAGE = 25;

  const loadProc = useCallback(async () => {
    setLoadingProc(true);
    const r = await GpcService.getProcessos('', 1, 5000);
    setProcessos(r.data);
    setLoadingProc(false);
  }, []);

  const loadRec = useCallback(async () => {
    setLoadingRec(true);
    const r = await GpcService.getRecebidos('', 1, 5000);
    setRecebidos(r.data);
    setLoadingRec(false);
  }, []);

  useEffect(() => {
    loadProc();
    loadRec();
    GpcService.getPosicoes().then(setPosicoes);
  }, [loadProc, loadRec]);

  // ── Filtered + sorted processos ─────────────────────────────────────────────
  const filteredProc = useMemo(() => {
    const f = pFilters;
    const out = processos.filter(p =>
      (!f.processo || sv(p.processo).includes(sv(f.processo))) &&
      (!f.convenio || sv(p.convenio).includes(sv(f.convenio))) &&
      (!f.tipo || sv(p.tipo) === sv(f.tipo)) &&
      (!f.ano_cadastro || sv(p.ano_cadastro).includes(sv(f.ano_cadastro))) &&
      (!f.entidade || sv(p.entidade).includes(sv(f.entidade))) &&
      (!f.drs || sv(p.drs).includes(sv(f.drs)))
    );
    return sortByCol(out, pSort);
  }, [processos, pFilters, pSort]);

  useEffect(() => { setPPage(1); }, [pFilters, pSort]);

  const pagedProc = useMemo(() =>
    filteredProc.slice((pPage - 1) * PAGE, pPage * PAGE),
    [filteredProc, pPage]
  );

  // ── Filtered + sorted recebidos ─────────────────────────────────────────────
  const filteredRec = useMemo(() => {
    const f = rFilters;
    const out = recebidos.filter(r =>
      (!f.processo || sv(r.processo).includes(sv(f.processo))) &&
      (!f.convenio || sv(r.convenio).includes(sv(f.convenio))) &&
      (!f.entidade || sv(r.entidade).includes(sv(f.entidade))) &&
      (!f.exercicio || sv(r.exercicio).includes(sv(f.exercicio))) &&
      (!f.drs || sv(r.drs).includes(sv(f.drs))) &&
      (!f.responsavel || sv(r.responsavel).includes(sv(f.responsavel))) &&
      (!f.posicao_id || sv(r.posicao_id) === sv(f.posicao_id)) &&
      (!f.movimento || sv(r.movimento).includes(sv(f.movimento)))
    );
    return sortByCol(out, rSort);
  }, [recebidos, rFilters, rSort]);

  useEffect(() => { setRPage(1); }, [rFilters, rSort]);

  const pagedRec = useMemo(() =>
    filteredRec.slice((rPage - 1) * PAGE, rPage * PAGE),
    [filteredRec, rPage]
  );

  // ── Sort togglers ────────────────────────────────────────────────────────────
  const togglePSort = useCallback((col: string) => {
    setPSort(s => s?.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }, []);

  const toggleRSort = useCallback((col: string) => {
    setRSort(s => s?.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  }, []);

  // ── Filter setters ───────────────────────────────────────────────────────────
  const setPF = (k: keyof typeof pFilters, v: string) => setPFilters(f => ({ ...f, [k]: v }));
  const setRF = (k: keyof typeof rFilters, v: string) => setRFilters(f => ({ ...f, [k]: v }));

  // ── Processo expand/detail ───────────────────────────────────────────────────
  const handleExpand = async (codigo: number) => {
    if (expanded === codigo) { setExpanded(null); setFullData(null); return; }
    setExpanded(codigo);
    setLoadingFull(true);
    const data = await GpcService.getProcessoFull(codigo);
    setFullData(data);
    setLoadingFull(false);
  };

  const handleRefreshFull = async () => {
    if (!expanded) return;
    setLoadingFull(true);
    const data = await GpcService.getProcessoFull(expanded);
    setFullData(data);
    setLoadingFull(false);
    await loadProc();
  };

  const handleDeleteProc = async (codigo: number) => {
    if (!confirm('Excluir este processo e todos os dados relacionados?')) return;
    try { await GpcService.deleteProcesso(codigo); await loadProc(); }
    catch (ex: any) { alert(ex.message); }
  };

  const handleDeleteRec = async (codigo: number) => {
    if (!confirm('Excluir este registro?')) return;
    try { await GpcService.deleteRecebido(codigo); await loadRec(); }
    catch (ex: any) { alert(ex.message); }
  };

  const exportCSV = () => {
    const posMap = Object.fromEntries(posicoes.map(p => [p.codigo, p.posicao]));
    const cols = ['Processo', 'Convênio', 'Entidade', 'Exercício', 'DRS', 'Data', 'Responsável', 'Posição', 'Movimento'];
    const body = filteredRec.map(r => [
      r.processo ?? '', r.convenio ?? '', r.entidade ?? '',
      r.exercicio ?? '', r.drs ?? '', fmtDate(r.data), r.responsavel ?? '',
      r.posicao_id ? (posMap[r.posicao_id] ?? r.posicao_id) : '', r.movimento ?? ''
    ].map(v => { const s = String(v ?? ''); return s.includes(';') ? `"${s}"` : s; }).join(';'));
    const csv = '\uFEFF' + [cols.join(';'), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'gpc_recebidos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const procPages = Math.ceil(filteredProc.length / PAGE);
  const recPages = Math.ceil(filteredRec.length / PAGE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Grupo de Prestação de Contas</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {tab === 'processos'
              ? `${filteredProc.length.toLocaleString('pt-BR')} de ${processos.length.toLocaleString('pt-BR')} processos`
              : `${filteredRec.length.toLocaleString('pt-BR')} de ${recebidos.length.toLocaleString('pt-BR')} registros`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'recebidos' && (
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={exportCSV}
            >
              <Download size={14} />Exportar CSV
            </button>
          )}
          <button className={BTN_PRIMARY} onClick={() => tab === 'processos' ? setModalProc({}) : setModalRec({})}>
            <Plus size={16} />{tab === 'processos' ? 'Novo Processo' : 'Novo Registro'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {(['processos', 'recebidos'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'processos' ? `Processos (${processos.length})` : `Recebidos (${recebidos.length})`}
          </button>
        ))}
      </div>

      {/* ── Tab: Processos ──────────────────────────────────────────────────── */}
      {tab === 'processos' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingProc ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <SortTh label="#" col="codigo" sort={pSort} onSort={togglePSort} />
                    <SortTh label="Processo" col="processo" sort={pSort} onSort={togglePSort} />
                    <SortTh label="Convênio" col="convenio" sort={pSort} onSort={togglePSort} />
                    <SortTh label="Tipo" col="tipo" sort={pSort} onSort={togglePSort} />
                    <SortTh label="Ano" col="ano_cadastro" sort={pSort} onSort={togglePSort} />
                    <SortTh label="Entidade" col="entidade" sort={pSort} onSort={togglePSort} />
                    <SortTh label="DRS" col="drs" sort={pSort} onSort={togglePSort} />
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Vistoriado</th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">Parcelamento</th>
                    <th />
                  </tr>
                  <tr>
                    <FThEmpty />
                    <FTh value={pFilters.processo} onChange={v => setPF('processo', v)} />
                    <FTh value={pFilters.convenio} onChange={v => setPF('convenio', v)} />
                    <FThSelect value={pFilters.tipo} onChange={v => setPF('tipo', v)}
                      options={['SEI', 'SPDOC', 'SEM PAPEL', 'SPDOC/SISRAD', '18', '200'].map(t => ({ value: t, label: t }))} />
                    <FTh value={pFilters.ano_cadastro} onChange={v => setPF('ano_cadastro', v)} placeholder="ano" />
                    <FTh value={pFilters.entidade} onChange={v => setPF('entidade', v)} />
                    <FTh value={pFilters.drs} onChange={v => setPF('drs', v)} placeholder="drs" />
                    <FThEmpty />
                    <FThEmpty />
                    <FThEmpty />
                  </tr>
                </thead>
                <tbody>
                  {pagedProc.map(p => (
                    <React.Fragment key={p.codigo}>
                      <tr className={`border-t border-slate-100 hover:bg-blue-50/40 transition-colors ${expanded === p.codigo ? 'bg-blue-50' : ''}`}>
                        <td className="px-3 py-3 text-xs text-slate-400">{p.codigo}</td>
                        <td className="px-3 py-3 font-medium text-slate-800 max-w-[150px] truncate">{p.processo ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-600">{p.convenio ?? '-'}</td>
                        <td className="px-3 py-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs">{p.tipo ?? '-'}</span></td>
                        <td className="px-3 py-3 text-slate-600">{p.ano_cadastro ?? '-'}</td>
                        <td className="px-3 py-3 text-slate-700 max-w-[180px] truncate" title={p.entidade ?? ''}>{p.entidade ?? '-'}</td>
                        <td className="px-3 py-3 text-center text-slate-600">{p.drs ?? '-'}</td>
                        <td className="px-3 py-3 text-center">{p.vistoriado ? <span className="text-green-600">✔</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3 text-center">{p.parcelamento ? <span className="text-amber-600">✔</span> : <span className="text-slate-300">—</span>}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="Expandir" onClick={() => handleExpand(p.codigo)}>
                              {expanded === p.codigo ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                            </button>
                            <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="Editar" onClick={() => setModalProc({ data: p })}><Edit size={15} /></button>
                            <button className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Excluir" onClick={() => handleDeleteProc(p.codigo)}><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                      {expanded === p.codigo && (
                        <tr className="bg-blue-50/60">
                          <td colSpan={10} className="px-4 pb-4">
                            {loadingFull
                              ? <div className="flex items-center gap-2 py-4 text-slate-500 text-sm"><Loader2 size={16} className="animate-spin" />Carregando detalhes...</div>
                              : fullData ? <DetailPanel processo={fullData} posicoes={posicoes} onRefresh={handleRefreshFull} /> : null}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {!pagedProc.length && (
                    <tr><td colSpan={10} className="py-16 text-center text-slate-400">Nenhum processo encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Recebidos ──────────────────────────────────────────────────── */}
      {tab === 'recebidos' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {loadingRec ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <SortTh label="Processo" col="processo" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="Convênio" col="convenio" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="Entidade" col="entidade" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="Exercício" col="exercicio" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="DRS" col="drs" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="Data" col="data" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="Responsável" col="responsavel" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="Posição" col="posicao" sort={rSort} onSort={toggleRSort} />
                    <SortTh label="Movimento" col="movimento" sort={rSort} onSort={toggleRSort} />
                    <th />
                  </tr>
                  <tr>
                    <FTh value={rFilters.processo} onChange={v => setRF('processo', v)} />
                    <FTh value={rFilters.convenio} onChange={v => setRF('convenio', v)} />
                    <FTh value={rFilters.entidade} onChange={v => setRF('entidade', v)} />
                    <FTh value={rFilters.exercicio} onChange={v => setRF('exercicio', v)} placeholder="ano" />
                    <FTh value={rFilters.drs} onChange={v => setRF('drs', v)} placeholder="drs" />
                    <FThEmpty />
                    <FTh value={rFilters.responsavel} onChange={v => setRF('responsavel', v)} />
                    <FThSelect value={rFilters.posicao_id} onChange={v => setRF('posicao_id', v)}
                      options={posicoes.map(p => ({ value: String(p.codigo), label: p.posicao ?? '' }))} />
                    <FTh value={rFilters.movimento} onChange={v => setRF('movimento', v)} />
                    <FThEmpty />
                  </tr>
                </thead>
                <tbody>
                  {pagedRec.map(r => (
                    <tr key={r.codigo} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                      <td className="px-3 py-3 font-medium text-slate-800 max-w-[160px] truncate" title={r.processo ?? ''}>{r.processo ?? '-'}</td>
                      <td className="px-3 py-3 text-slate-600">{r.convenio ?? '-'}</td>
                      <td className="px-3 py-3 text-slate-700 max-w-[200px] truncate" title={r.entidade ?? ''}>{r.entidade ?? '-'}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{r.exercicio ?? '-'}</td>
                      <td className="px-3 py-3 text-center text-slate-600">{r.drs ?? '-'}</td>
                      <td className="px-3 py-3 whitespace-nowrap text-slate-600">{fmtDate(r.data)}</td>
                      <td className="px-3 py-3 text-slate-600">{r.responsavel ?? '-'}</td>
                      <td className="px-3 py-3"><PosicaoBadge id={r.posicao_id} label={r.posicao ?? null} /></td>
                      <td className="px-3 py-3 text-slate-600">{r.movimento ?? '-'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="Editar" onClick={() => setModalRec({ data: r })}><Edit size={15} /></button>
                          <button className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Excluir" onClick={() => handleDeleteRec(r.codigo)}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!pagedRec.length && (
                    <tr><td colSpan={10} className="py-16 text-center text-slate-400">Nenhum registro encontrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {tab === 'processos' && procPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Página {pPage} de {procPages} — {filteredProc.length.toLocaleString('pt-BR')} processos</span>
          <div className="flex gap-2">
            <button className={BTN_GHOST} disabled={pPage === 1} onClick={() => setPPage(p => p - 1)}><ChevronLeft size={16} />Anterior</button>
            <button className={BTN_GHOST} disabled={pPage === procPages} onClick={() => setPPage(p => p + 1)}>Próxima<ChevronRight size={16} /></button>
          </div>
        </div>
      )}
      {tab === 'recebidos' && recPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Página {rPage} de {recPages} — {filteredRec.length.toLocaleString('pt-BR')} registros</span>
          <div className="flex gap-2">
            <button className={BTN_GHOST} disabled={rPage === 1} onClick={() => setRPage(p => p - 1)}><ChevronLeft size={16} />Anterior</button>
            <button className={BTN_GHOST} disabled={rPage === recPages} onClick={() => setRPage(p => p + 1)}>Próxima<ChevronRight size={16} /></button>
          </div>
        </div>
      )}

      {/* Modais */}
      {modalProc !== null && (
        <Modal title={modalProc.data ? `Editar Processo #${modalProc.data.codigo}` : 'Novo Processo'} onClose={() => setModalProc(null)}>
          <ProcessoForm initial={modalProc.data} onSave={async p => { await GpcService.saveProcesso(p); await loadProc(); }} onClose={() => setModalProc(null)} />
        </Modal>
      )}
      {modalRec !== null && (
        <Modal title={modalRec.data ? 'Editar Registro' : 'Novo Registro'} onClose={() => setModalRec(null)}>
          <RecebidoForm initial={modalRec.data} posicoes={posicoes} onSave={async r => { await GpcService.saveRecebido(r); await loadRec(); }} onClose={() => setModalRec(null)} />
        </Modal>
      )}
    </div>
  );
};
