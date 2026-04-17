import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, Check,
  Loader2, AlertCircle, FileText, Calendar, Activity,
  ClipboardList, GitBranch, Download, ArrowUp, ArrowDown,
  ArrowUpDown, ExternalLink, Link as LinkIcon, TrendingUp, TrendingDown,
  User, Search, AlertTriangle, Clock, DollarSign, Info,
  BarChart2, Save, Eye, Lock, BookOpen, Gauge, Timer, PenLine,
  ShieldCheck, ShieldAlert, ShieldOff, Award, KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { GpcService } from '../services/gpcService';
import { DbService } from '../services/dbService';
import {
  GpcProcessoFull, GpcExercicio, GpcHistorico, GpcObjeto,
  GpcParcelamento, GpcTa, GpcPosicao, GpcRecebido, GpcProdutividade,
  GpcFluxoTecnico
} from '../types';

// ---- Utilities ----

const fmt = (v: number | null | undefined) =>
  v == null ? '-' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const fmtTs = (d: string | null | undefined) => {
  if (!d) return '-';
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const sv = (v: unknown) => (v == null ? '' : String(v)).toLowerCase().trim();

interface SortState { col: string; dir: 'asc' | 'desc'; }

function sortRows<T>(arr: T[], s: SortState | null): T[] {
  if (!s) return arr;
  return [...arr].sort((a, b) => {
    const va = sv((a as Record<string, unknown>)[s.col]);
    const vb = sv((b as Record<string, unknown>)[s.col]);
    const c = va.localeCompare(vb, 'pt-BR', { numeric: true });
    return s.dir === 'asc' ? c : -c;
  });
}

const MONTHS_PT = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const fmtMes = (ym: string) => {
  const [y, m] = ym.split('-');
  return `${MONTHS_PT[Number(m) - 1] ?? m}/${y}`;
};

// ---- Design tokens ----

const INPUT = 'w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow placeholder:text-slate-300';
const LABEL = 'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1';
const BTN_PRI = 'inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
const BTN_SEC = 'inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all';

// ---- CurrencyInput (BRL masked input) ----
const CurrencyInput = ({ value, onChange, placeholder = '0,00' }: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder?: string;
}) => {
  const toDisplay = (v: number | null | undefined) =>
    v == null ? '' : v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [display, setDisplay] = useState(() => toDisplay(value));
  const prevRef = useRef(value);

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value;
      setDisplay(toDisplay(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) { setDisplay(''); onChange(null); return; }
    const num = parseInt(digits, 10) / 100;
    setDisplay(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    onChange(num);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none select-none">R$</span>
      <input
        type="text"
        inputMode="numeric"
        className={INPUT + ' pl-9'}
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
      />
    </div>
  );
};

// ---- Posicao visual config ----

const POS_CFG: Record<number, { bg: string; text: string; dot: string }> = {
  1:  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500' },
  2:  { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-500' },
  3:  { bg: 'bg-yellow-50',  text: 'text-yellow-700',  dot: 'bg-yellow-500' },
  4:  { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500' },
  5:  { bg: 'bg-slate-100',  text: 'text-slate-600',   dot: 'bg-slate-400' },
  6:  { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500' },
  7:  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  8:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  dot: 'bg-indigo-500' },
  9:  { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-500' },
  10: { bg: 'bg-teal-50',    text: 'text-teal-700',    dot: 'bg-teal-500' },
  11: { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-500' },
  12: { bg: 'bg-pink-50',    text: 'text-pink-700',    dot: 'bg-pink-500' },
};
const POS_DEF = { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' };

const PosicaoBadge = ({ id, label }: { id: number | null; label: string | null }) => {
  if (!id || !label) return <span className="text-slate-300 text-xs">-</span>;
  const c = POS_CFG[id] ?? POS_DEF;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {label}
    </span>
  );
};

// ---- Situacao Badge ----

type Situacao = 'REGULAR' | 'IRREGULAR' | 'PARCIALMENTE_REGULAR';

const SituacaoBadge = ({ situacao, compact = false }: { situacao: Situacao | string | null | undefined; compact?: boolean }) => {
  if (!situacao) return <span className="text-slate-300 text-xs">—</span>;
  if (situacao === 'REGULAR')
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-green-50 text-green-700 border-green-200`}>
        <ShieldCheck size={10} />{compact ? 'Regular' : 'Regular'}
      </span>
    );
  if (situacao === 'IRREGULAR')
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-red-50 text-red-700 border-red-200`}>
        <ShieldAlert size={10} />{compact ? 'Irregular' : 'Irregular'}
      </span>
    );
  if (situacao === 'PARCIALMENTE_REGULAR')
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border bg-amber-50 text-amber-700 border-amber-200`}>
        <ShieldOff size={10} />{compact ? 'Parcial' : 'Parcialmente Regular'}
      </span>
    );
  return <span className="text-slate-300 text-xs">—</span>;
};

// ---- SortTh ----

const SortTh = ({ label, col, sort, onSort, cls = '' }: {
  label: string; col: string; sort: SortState | null;
  onSort: (c: string) => void; cls?: string;
}) => {
  const active = sort?.col === col;
  return (
    <th
      onClick={() => onSort(col)}
      className={`px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:bg-slate-100 group transition-colors ${cls}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {active
          ? sort!.dir === 'asc'
            ? <ArrowUp size={11} className="text-blue-500 flex-shrink-0" />
            : <ArrowDown size={11} className="text-blue-500 flex-shrink-0" />
          : <ArrowUpDown size={11} className="text-slate-300 group-hover:text-slate-400 flex-shrink-0" />}
      </div>
    </th>
  );
};

const FTh = ({ v, onChange, ph = '' }: { v: string; onChange: (x: string) => void; ph?: string }) => (
  <th className="px-2 py-1.5 bg-slate-50/80">
    <input
      className="w-full text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 placeholder:text-slate-300"
      placeholder={ph || 'filtrar...'}
      value={v}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
    />
  </th>
);

const FThSel = ({ v, onChange, opts }: { v: string; onChange: (x: string) => void; opts: { value: string; label: string }[] }) => (
  <th className="px-2 py-1.5 bg-slate-50/80">
    <select
      className="w-full text-xs border border-slate-200 rounded-md px-1 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
      value={v}
      onChange={e => onChange(e.target.value)}
      onClick={e => e.stopPropagation()}
    >
      <option value="">Todos</option>
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </th>
);

const FThX = () => <th className="px-2 py-1.5 bg-slate-50/80" />;

// ---- Modal ----

const Modal = ({ title, subtitle, onClose, children, size = 'lg' }: {
  title: string; subtitle?: string; onClose: () => void;
  children: React.ReactNode; size?: 'md' | 'lg' | 'xl';
}) => {
  const widths = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${widths[size]} max-h-[92vh] flex flex-col`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ---- InlineTable ----

function InlineTable<T extends { codigo: number }>({ cols, rows, onEdit, onDelete, emptyMsg }: {
  cols: { label: string; render: (r: T) => React.ReactNode }[];
  rows: T[];
  onEdit: (r: T) => void;
  onDelete: (r: T) => void;
  emptyMsg: string;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
      <table className="w-full text-xs">
        <thead className="bg-slate-50">
          <tr>
            {cols.map(c => (
              <th key={c.label} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {c.label}
              </th>
            ))}
            <th className="px-2 py-2 w-16" />
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.codigo} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
              {cols.map(c => <td key={c.label} className="px-3 py-2">{c.render(r)}</td>)}
              <td className="px-2 py-2">
                <div className="flex items-center gap-1">
                  <button className="p-1 rounded hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors" onClick={() => onEdit(r)}>
                    <Edit size={12} />
                  </button>
                  <button className="p-1 rounded hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors" onClick={() => onDelete(r)}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={cols.length + 1} className="px-3 py-4 text-center text-slate-400 italic">
                {emptyMsg}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---- InfoCard ----

const InfoCard = ({ label, value, icon }: { label: string; value: string | null | undefined; icon?: React.ReactNode }) => (
  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
    <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1">{label}</div>
    <div className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
      {icon}{value || '-'}
    </div>
  </div>
);

// ---- Productivity Panel ----

const EVENTO_CFG: Record<string, { color: string; label: string }> = {
  CRIACAO:        { color: 'bg-blue-500',    label: 'Atribuição inicial' },
  RESPONSAVEL:    { color: 'bg-emerald-500', label: 'Mudança de responsável' },
  POSICAO:        { color: 'bg-amber-500',   label: 'Mudança de posição' },
  MOVIMENTO:      { color: 'bg-purple-500',  label: 'Alteração de movimento' },
  INICIO_ANALISE: { color: 'bg-sky-500',     label: 'Início de análise' },
};

const ProdPanel = ({ registroId }: { registroId: number }) => {
  const [items, setItems] = useState<GpcProdutividade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GpcService.getProdutividade(registroId).then(d => { setItems(d); setLoading(false); });
  }, [registroId]);

  if (loading) return (
    <div className="flex items-center gap-2 py-8 justify-center text-slate-400 text-sm">
      <Loader2 size={16} className="animate-spin" />Carregando...
    </div>
  );
  if (!items.length) return (
    <div className="py-10 text-center text-slate-400 text-sm">
      <TrendingUp size={32} className="mx-auto mb-2 opacity-30" />
      Nenhum evento registrado. Gerado ao salvar responsável ou posição.
    </div>
  );

  return (
    <div className="relative pl-5 space-y-0">
      <div className="absolute left-5 top-2 bottom-2 w-px bg-slate-200" />
      {items.map((it, idx) => {
        const cfg = EVENTO_CFG[it.evento] ?? { color: 'bg-slate-400', label: it.evento };
        return (
          <div key={it.id} className={`relative flex gap-3 ${idx < items.length - 1 ? 'pb-3' : ''}`}>
            <div className={`absolute -left-1 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white ${cfg.color}`} />
            <div className="bg-white border border-slate-100 rounded-lg px-3 py-2 text-xs w-full shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-700">{cfg.label}</span>
                <span className="text-slate-400 whitespace-nowrap">{fmtTs(it.data_evento)}</span>
              </div>
              <div className="mt-1 flex items-center gap-3 text-slate-600">
                {it.responsavel && <span className="flex items-center gap-1"><User size={10} />{it.responsavel}</span>}
                {it.posicao && <PosicaoBadge id={it.posicao_id} label={it.posicao} />}
              </div>
              {it.obs && (
                <p className="mt-1 text-xs text-slate-500 italic">{it.obs}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ---- ViewModal - all info of a record ----

// ---- Movement options (shared) ----

const MOVIMENTOS = [
  'RECEBIDO',
  'EM ANÁLISE',
  'DILIGÊNCIA',
  'AGUARDANDO COMPLEMENTAÇÃO',
  'ENCAMINHADO À CHEFIA',
  'ENCAMINHADO A CHEFIA GCP',
  'ENCAMINHADO AO GGCON',
  'ENCAMINHADO AO CATC',
  'ENCAMINHADO A ASSESSORIA',
  'ENCAMINHADO AO GABINETE',
  'ENCAMINHADO AO TCE-SP',
  'ENCAMINHADO À PGE',
  'ENCAMINHADO À CGE',
  'ARQUIVADO',
  'CONCLUÍDO',
  'DEVOLVIDO AO CONVENENTE',
  'PARECER EMITIDO',
  'REANÁLISE',
];

// ---- Fluxo Técnico Panel ----

const ACAO_OPTIONS = [
  'RECEBIMENTO',
  'INÍCIO DA ANÁLISE',
  'ANÁLISE EM ANDAMENTO',
  'DILIGÊNCIA EMITIDA',
  'AGUARDANDO RESPOSTA',
  'RESPOSTA RECEBIDA',
  'PARECER ELABORADO',
  'REVISÃO DO PARECER',
  'ENCAMINHAMENTO',
  'DEVOLUÇÃO',
  'ARQUIVAMENTO',
  'CONCLUSÃO',
  'REANÁLISE',
];

const ACAO_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'RECEBIMENTO':          { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500' },
  'INÍCIO DA ANÁLISE':    { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200',     dot: 'bg-sky-500' },
  'ANÁLISE EM ANDAMENTO': { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500' },
  'DILIGÊNCIA EMITIDA':   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-500' },
  'AGUARDANDO RESPOSTA':  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  dot: 'bg-orange-400' },
  'RESPOSTA RECEBIDA':    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    dot: 'bg-teal-500' },
  'PARECER ELABORADO':    { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  dot: 'bg-purple-500' },
  'REVISÃO DO PARECER':   { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',    dot: 'bg-pink-500' },
  'ENCAMINHAMENTO':       { bg: 'bg-cyan-50',    text: 'text-cyan-700',    border: 'border-cyan-200',    dot: 'bg-cyan-500' },
  'DEVOLUÇÃO':            { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-500' },
  'ARQUIVAMENTO':         { bg: 'bg-slate-50',   text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400' },
  'CONCLUSÃO':            { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   dot: 'bg-green-500' },
  'REANÁLISE':            { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200',  dot: 'bg-violet-500' },
};
const ACAO_DEF = { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };

const FluxoTecnicoFormInline = ({ registroId, posicoes, numPaginas, gpcUsers, onSaved }: {
  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;
  gpcUsers: { id: string; name: string }[];
  onSaved: () => Promise<void> | void;
}) => {
  const [form, setForm] = useState<Partial<GpcFluxoTecnico>>({
    registro_id: registroId,
    num_paginas_analise: numPaginas ?? undefined,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const now = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const set = (k: keyof GpcFluxoTecnico, v: any) => setForm(f => ({ ...f, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try {
      await GpcService.saveFluxoTecnico({ ...form, registro_id: registroId, data_evento: new Date().toISOString() });
      setForm({ registro_id: registroId, num_paginas_analise: numPaginas ?? undefined });
      onSaved();
    } catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Activity size={14} className="text-blue-600" />
        <span className="text-sm font-bold text-slate-700">Registrar Novo Evento no Fluxo</span>
      </div>
      {err && <div className="text-red-600 text-xs flex items-center gap-1"><AlertCircle size={12} />{err}</div>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div>
          <label className={LABEL}>Técnico Responsável</label>
          <select className={INPUT} value={form.tecnico ?? ''} onChange={e => set('tecnico', e.target.value || null)} required>
            <option value="">— selecione —</option>
            {gpcUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL + ' flex items-center gap-1'}>
            <Lock size={10} className="text-slate-400" />Data/Hora do Evento
          </label>
          <div className={INPUT + ' bg-slate-100 text-slate-500 flex items-center gap-2 cursor-not-allowed select-none'}>
            <Clock size={13} className="text-slate-400 flex-shrink-0" />
            <span className="text-sm font-medium">{now()}</span>
            <span className="ml-auto text-xs text-slate-400">Automático</span>
          </div>
        </div>
        <div>
          <label className={LABEL}>Ação Realizada</label>
          <select className={INPUT} value={form.acao ?? ''} onChange={e => set('acao', e.target.value || null)} required>
            <option value="">— selecione —</option>
            {ACAO_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Posição Atual</label>
          <select className={INPUT} value={form.posicao_id ?? ''} onChange={e => set('posicao_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">— selecione —</option>
            {posicoes.map(p => <option key={p.codigo} value={p.codigo}>{p.posicao}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Movimento</label>
          <select className={INPUT} value={form.movimento ?? ''} onChange={e => set('movimento', e.target.value || null)}>
            <option value="">— selecione —</option>
            {MOVIMENTOS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Páginas Analisadas</label>
          <input className={INPUT} type="number" min={0} value={form.num_paginas_analise ?? ''} onChange={e => set('num_paginas_analise', e.target.value ? Number(e.target.value) : null)} placeholder="ex: 50" />
        </div>
        <div className="sm:col-span-3">
          <label className={LABEL}>Observações</label>
          <input className={INPUT} value={form.obs ?? ''} onChange={e => set('obs', e.target.value || null)} placeholder="Detalhes adicionais sobre o evento..." />
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <button type="submit" className={BTN_PRI + ' text-xs px-3 py-1.5'} disabled={saving}>
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}Registrar Evento
        </button>
      </div>
    </form>
  );
};

const FluxoTecnicoPanel = ({ registroId, posicoes, numPaginas, gpcUsers, signatoryUsers, responsavelAssinatura, responsavelAssinatura2, onRecordUpdated, readOnly, hideAssinatura }: {
  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;
  gpcUsers: { id: string; name: string }[];
  signatoryUsers: { id: string; name: string }[];
  responsavelAssinatura?: string | null;
  responsavelAssinatura2?: string | null;
  onRecordUpdated?: () => Promise<void> | void;
  readOnly?: boolean;
  hideAssinatura?: boolean;
}) => {
  const [items, setItems] = useState<GpcFluxoTecnico[]>([]);
  const [loading, setLoading] = useState(true);
  const [assinatura1, setAssinatura1] = useState<string>(responsavelAssinatura ?? '');
  const [assinatura2, setAssinatura2] = useState<string>(responsavelAssinatura2 ?? '');
  const [savingAssinatura, setSavingAssinatura] = useState(false);
  const [assinaturaMsg, setAssinaturaMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSaveAssinatura = async () => {
    setSavingAssinatura(true); setAssinaturaMsg(null);
    try {
      await GpcService.updateAssinatura(registroId, assinatura1 || null, assinatura2 || null);
      setAssinaturaMsg({ type: 'ok', text: 'Responsáveis salvos com sucesso!' });
      onRecordUpdated?.();
    } catch (ex: any) {
      setAssinaturaMsg({ type: 'err', text: ex.message });
    } finally {
      setSavingAssinatura(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    const d = await GpcService.getFluxoTecnico(registroId);
    setItems(d);
    setLoading(false);
  }, [registroId]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este evento do fluxo?')) return;
    await GpcService.deleteFluxoTecnico(id);
    load();
  };

  // Compute derived metrics
  const metrics = useMemo(() => {
    if (!items.length) return null;
    const tecnicos = new Set(items.map(i => i.tecnico).filter(Boolean));
    const firstEvent = items[0];
    const lastEvent = items[items.length - 1];
    const totalDias = firstEvent && lastEvent
      ? Math.round((new Date(lastEvent.data_evento).getTime() - new Date(firstEvent.data_evento).getTime()) / 86400000)
      : 0;
    const totalPaginas = items.reduce((s, i) => s + (i.num_paginas_analise ?? 0), 0);
    const diligencias = items.filter(i => i.acao === 'DILIGÊNCIA EMITIDA').length;
    const analises = items.filter(i => i.acao === 'ANÁLISE EM ANDAMENTO' || i.acao === 'INÍCIO DA ANÁLISE').length;
    // Tempo médio entre eventos
    let tempoMedio = 0;
    if (items.length > 1) {
      let total = 0;
      for (let i = 1; i < items.length; i++) {
        total += Math.abs(new Date(items[i].data_evento).getTime() - new Date(items[i - 1].data_evento).getTime());
      }
      tempoMedio = Math.round((total / (items.length - 1)) / 86400000);
    }
    return { tecnicos: tecnicos.size, totalDias, totalPaginas, diligencias, analises, tempoMedio, totalEventos: items.length };
  }, [items]);

  if (loading) return (
    <div className="flex items-center gap-2 py-10 justify-center text-slate-400 text-sm">
      <Loader2 size={16} className="animate-spin" />Carregando fluxo técnico...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Responsável pela Assinatura */}
      {readOnly && !hideAssinatura ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
          <div className="flex items-center gap-2 mb-3">
            <PenLine size={15} className="text-indigo-500" />
            <span className="text-sm font-bold text-indigo-800">Responsável pela Assinatura</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white border border-indigo-100 rounded-lg p-3">
              <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-1">1º Responsável</div>
              <div className="text-sm font-medium text-slate-800">{assinatura1 || <span className="text-slate-300">—</span>}</div>
            </div>
            <div className="bg-white border border-indigo-100 rounded-lg p-3">
              <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-1">2º Responsável</div>
              <div className="text-sm font-medium text-slate-800">{assinatura2 || <span className="text-slate-300">—</span>}</div>
            </div>
          </div>
        </div>
      ) : !readOnly ? (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PenLine size={15} className="text-indigo-500" />
            <span className="text-sm font-bold text-indigo-800">Responsável pela Assinatura</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>1º Responsável</label>
              <select className={INPUT} value={assinatura1} onChange={e => setAssinatura1(e.target.value)}>
                <option value="">— selecione —</option>
                {signatoryUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className={LABEL}>2º Responsável <span className="text-slate-400 font-normal">(opcional)</span></label>
              <select className={INPUT} value={assinatura2} onChange={e => setAssinatura2(e.target.value)}>
                <option value="">— nenhum —</option>
                {signatoryUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
          </div>
          {assinaturaMsg && (
            <p className={`text-xs ${assinaturaMsg.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{assinaturaMsg.text}</p>
          )}
          {signatoryUsers.length === 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              Nenhum usuário habilitado para assinar processos. O administrador deve marcar usuários como "Pode assinar processos" no Gerenciamento de Usuários.
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveAssinatura}
              disabled={savingAssinatura}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-60"
            >
              {savingAssinatura ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Salvar Responsáveis
            </button>
          </div>
        </div>
      ) : null}

      {/* Metrics cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: 'Eventos',    value: String(metrics.totalEventos), color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100',   icon: <Activity size={14} className="text-blue-400" /> },
            { label: 'Tempo Total', value: `${metrics.totalDias} dias`, color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-200',  icon: <Timer size={14} className="text-slate-400" /> },
            { label: 'Pág. Analisadas', value: String(metrics.totalPaginas), color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100', icon: <BookOpen size={14} className="text-purple-400" /> },
            { label: 'Tempo Médio/Evento', value: `${metrics.tempoMedio} dias`, color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100',  icon: <Gauge size={14} className="text-amber-400" /> },
          ].map(k => (
            <div key={k.label} className={`${k.bg} rounded-xl border px-3 py-2.5 flex items-center gap-2.5`}>
              {k.icon}
              <div>
                <div className={`text-lg font-bold ${k.color}`}>{k.value}</div>
                <div className="text-xs text-slate-500">{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complexity indicator */}
      {(numPaginas ?? 0) > 0 && (
        <div className={`rounded-xl border p-3 flex items-center gap-3 ${
          (numPaginas ?? 0) <= 50 ? 'bg-green-50 border-green-200' :
          (numPaginas ?? 0) <= 200 ? 'bg-amber-50 border-amber-200' :
          (numPaginas ?? 0) <= 500 ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'
        }`}>
          <BookOpen size={18} className={
            (numPaginas ?? 0) <= 50 ? 'text-green-500' :
            (numPaginas ?? 0) <= 200 ? 'text-amber-500' :
            (numPaginas ?? 0) <= 500 ? 'text-orange-500' : 'text-red-500'
          } />
          <div>
            <div className="text-sm font-bold text-slate-700">
              Processo com {numPaginas} páginas — Complexidade{' '}
              <span className={
                (numPaginas ?? 0) <= 50 ? 'text-green-700' :
                (numPaginas ?? 0) <= 200 ? 'text-amber-700' :
                (numPaginas ?? 0) <= 500 ? 'text-orange-700' : 'text-red-700'
              }>
                {(numPaginas ?? 0) <= 50 ? 'Baixa' :
                 (numPaginas ?? 0) <= 200 ? 'Média' :
                 (numPaginas ?? 0) <= 500 ? 'Alta' : 'Muito Alta'}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {(numPaginas ?? 0) <= 50 ? 'Prazo estimado: 5-10 dias úteis' :
               (numPaginas ?? 0) <= 200 ? 'Prazo estimado: 10-20 dias úteis' :
               (numPaginas ?? 0) <= 500 ? 'Prazo estimado: 20-40 dias úteis' : 'Prazo estimado: 40+ dias úteis — análise complexa'}
            </div>
          </div>
        </div>
      )}

      {/* New entry form */}
      {!readOnly && (
        <FluxoTecnicoFormInline
          registroId={registroId}
          posicoes={posicoes}
          numPaginas={numPaginas}
          gpcUsers={gpcUsers}
          onSaved={async () => { await load(); onRecordUpdated?.(); }}
        />
      )}

      {/* Timeline */}
      {items.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-sm">
          <Activity size={36} className="mx-auto mb-2 opacity-30" />
          <p className="font-medium">Nenhum evento registrado no fluxo técnico</p>
          {!readOnly && <p className="text-xs mt-1">Use o formulário acima para registrar o primeiro evento.</p>}
        </div>
      ) : (
        <div className="space-y-0">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity size={12} />Linha do Tempo do Processo ({items.length} eventos)
          </div>
          <div className="relative pl-6">
            {/* Vertical line */}
            <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-blue-300 via-slate-200 to-green-300 rounded-full" />

            {items.map((it, idx) => {
              const cfg = ACAO_COLORS[it.acao ?? ''] ?? ACAO_DEF;
              const isFirst = idx === 0;
              const isLast = idx === items.length - 1;
              // Calculate time from previous event
              let daysSincePrev: number | null = null;
              if (idx > 0) {
                daysSincePrev = Math.round(
                  (new Date(it.data_evento).getTime() - new Date(items[idx - 1].data_evento).getTime()) / 86400000
                );
              }

              return (
                <div key={it.id} className={`relative flex gap-3 ${idx < items.length - 1 ? 'pb-4' : ''}`}>
                  {/* Dot */}
                  <div className={`absolute -left-[13px] top-2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10 ${
                    isFirst ? 'bg-blue-500 ring-2 ring-blue-200' :
                    isLast ? 'bg-green-500 ring-2 ring-green-200' : cfg.dot
                  }`} />

                  {/* Card */}
                  <div className={`${cfg.bg} border ${cfg.border} rounded-xl px-4 py-3 w-full shadow-sm hover:shadow-md transition-shadow group`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                            {it.acao ?? 'EVENTO'}
                          </span>
                          {it.posicao && <PosicaoBadge id={it.posicao_id} label={it.posicao} />}
                          {it.movimento && (
                            <span className="text-xs text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                              {it.movimento}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar size={10} className="text-slate-400" />
                            {fmtTs(it.data_evento)}
                          </span>
                          {it.tecnico && (
                            <span className="flex items-center gap-1">
                              <User size={10} className="text-slate-400" />
                              <span className="font-semibold">{it.tecnico}</span>
                            </span>
                          )}
                          {it.num_paginas_analise && (
                            <span className="flex items-center gap-1 text-purple-600">
                              <BookOpen size={10} />{it.num_paginas_analise} pág.
                            </span>
                          )}
                          {daysSincePrev !== null && daysSincePrev > 0 && (
                            <span className={`flex items-center gap-1 font-medium ${
                              daysSincePrev <= 5 ? 'text-green-600' :
                              daysSincePrev <= 15 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              <Timer size={10} />+{daysSincePrev} dia{daysSincePrev !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                        {it.obs && (
                          <p className="mt-1.5 text-xs text-slate-500 italic">{it.obs}</p>
                        )}
                      </div>
                      {!readOnly && (
                      <button
                        className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => handleDelete(it.id)}
                        title="Excluir evento"
                      >
                        <Trash2 size={12} />
                      </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ---- ViewModal - all info of a record ----

const ViewModal = ({ row, posicoes, onEdit, onClose, prevPositions, onRecordUpdated }: {
  row: GpcRecebido;
  posicoes: GpcPosicao[];
  onEdit: () => void;
  onClose: () => void;
  prevPositions: string[];
  onRecordUpdated?: () => Promise<void> | void;
}) => {
  const [full, setFull] = useState<GpcProcessoFull | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [gpcUsers, setGpcUsers] = useState<{ id: string; name: string }[]>([]);
  const [signatoryUsers, setSignatoryUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!row.processo_codigo) return;
    setLoadingFull(true);
    GpcService.getProcessoFull(row.processo_codigo).then(d => { setFull(d); setLoadingFull(false); });
  }, [row.processo_codigo]);

  useEffect(() => {
    GpcService.getGpcUsers().then(setGpcUsers);
    GpcService.getSignatoryUsers().then(setSignatoryUsers);
  }, []);

  // Compact section header helper
  const Sec = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );

  return (
    <Modal
      title={row.processo ?? `#${row.codigo}`}
      subtitle={row.entidade ?? undefined}
      onClose={onClose}
      size="xl"
    >
      {/* Edit button */}
      <div className="flex justify-end -mt-2 mb-4">
        <button className={BTN_PRI + ' text-xs px-3 py-1.5'} onClick={onEdit}>
          <Edit size={13} />Editar
        </button>
      </div>

      <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">

        {/* ── Identificação ── */}
        <section>
          <Sec icon={<FileText size={13} />} title="Identificação" />
          <div className="font-mono text-sm font-bold text-blue-800 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-3 break-all select-all">
            {row.processo ?? '-'}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <InfoCard label="Convênio" value={row.convenio} />
            <InfoCard label="Exercício" value={row.exercicio} />
            <InfoCard label="DRS" value={row.drs != null ? String(row.drs) : null} />
            <InfoCard label="Recebimento" value={fmtDate(row.data)} />
            <InfoCard label="Responsável" value={row.responsavel} icon={<User size={12} />} />
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5">Posição</div>
              <PosicaoBadge id={row.posicao_id} label={row.posicao ?? null} />
            </div>
            <InfoCard label="Movimento" value={row.movimento} />
            <InfoCard label="Entidade" value={row.entidade} />
            {row.remessa && (
              <InfoCard label="Remessa" value={row.remessa === 'ACIMA' ? 'Acima de Remessa' : 'Abaixo de Remessa'} />
            )}
            <InfoCard label="Parcelamento" value={row.is_parcelamento ? 'Sim' : 'Não'} />
            {(row.num_paginas ?? 0) > 0 && (
              <InfoCard
                label="Páginas"
                value={`${row.num_paginas} — ${
                  (row.num_paginas ?? 0) <= 50 ? 'Complexidade Baixa' :
                  (row.num_paginas ?? 0) <= 200 ? 'Complexidade Média' :
                  (row.num_paginas ?? 0) <= 500 ? 'Complexidade Alta' : 'Complexidade Muito Alta'
                }`}
                icon={<BookOpen size={12} />}
              />
            )}
            {row.created_at && <InfoCard label="Cadastrado em" value={fmtTs(row.created_at)} />}
          </div>
        </section>

        {/* ── Responsáveis pela Assinatura ── */}
        <section>
          <Sec icon={<PenLine size={13} />} title="Responsáveis pela Assinatura" />
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
              <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-1">1º Responsável</div>
              <div className="text-sm font-medium text-slate-800">
                {row.responsavel_assinatura || <span className="text-slate-300">—</span>}
              </div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
              <div className="text-xs text-indigo-400 font-semibold uppercase tracking-wide mb-1">2º Responsável</div>
              <div className="text-sm font-medium text-slate-800">
                {row.responsavel_assinatura_2 || <span className="text-slate-300">—</span>}
              </div>
            </div>
          </div>
        </section>

        {/* ── Situação do Processo ── */}
        <section>
          <Sec icon={<ShieldCheck size={13} />} title="Situação do Processo" />
          {row.situacao ? (
            <div className={`rounded-xl p-4 border ${
              row.situacao === 'REGULAR' ? 'bg-green-50 border-green-200' :
              row.situacao === 'IRREGULAR' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {row.situacao === 'REGULAR'
                  ? <ShieldCheck size={15} className="text-green-600" />
                  : row.situacao === 'IRREGULAR'
                    ? <ShieldAlert size={15} className="text-red-600" />
                    : <ShieldOff size={15} className="text-amber-600" />}
                <SituacaoBadge situacao={row.situacao} />
              </div>
              {row.situacao === 'REGULAR' && (
                <p className="text-sm text-green-700">Processo sem pendências financeiras.</p>
              )}
              {(row.situacao === 'IRREGULAR' || row.situacao === 'PARCIALMENTE_REGULAR') && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white/70 rounded-lg p-2.5 border border-current/10">
                    <div className="text-xs font-semibold uppercase tracking-wide text-red-500 mb-0.5">Valor a Devolver</div>
                    <div className="text-sm font-bold text-red-700">{row.valor_a_devolver ? fmt(row.valor_a_devolver) : '—'}</div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-2.5 border border-current/10">
                    <div className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-0.5">Já Devolvido</div>
                    <div className="text-sm font-bold text-green-700">{row.valor_devolvido ? fmt(row.valor_devolvido) : '—'}</div>
                  </div>
                  {(row.valor_a_devolver ?? 0) > 0 && (() => {
                    const saldo = (row.valor_a_devolver ?? 0) - (row.valor_devolvido ?? 0);
                    return (
                      <div className="col-span-2 bg-white/70 rounded-lg p-2.5 border border-current/10 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Saldo Pendente</span>
                        <span className={`text-base font-bold ${saldo <= 0 ? 'text-green-700' : 'text-red-700'}`}>
                          {fmt(saldo)}{saldo <= 0 && <span className="ml-1.5 text-xs text-green-600 font-normal">✓ Quitado</span>}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              )}
              {row.situacao_obs && (
                <div className="mt-3 pt-3 border-t border-current/10">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1">Observações</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{row.situacao_obs}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl p-3 border border-dashed border-slate-200 flex items-center gap-2 text-slate-400">
              <ShieldOff size={14} />
              <span className="text-xs">Situação ainda não avaliada</span>
              <button className="ml-auto text-xs text-blue-500 hover:text-blue-700 font-semibold" onClick={onEdit}>Avaliar agora →</button>
            </div>
          )}
        </section>

        {/* ── Fluxo Técnico ── */}
        <section>
          <Sec icon={<Activity size={13} />} title="Fluxo Técnico" />
          <FluxoTecnicoPanel
            registroId={row.codigo}
            posicoes={posicoes}
            numPaginas={row.num_paginas}
            gpcUsers={gpcUsers}
            signatoryUsers={signatoryUsers}
            responsavelAssinatura={row.responsavel_assinatura}
            responsavelAssinatura2={row.responsavel_assinatura_2}
            onRecordUpdated={onRecordUpdated}
            readOnly={true}
            hideAssinatura={true}
          />
        </section>

        {/* ── Histórico de Atribuições ── */}
        <section>
          <Sec icon={<TrendingUp size={13} />} title="Histórico de Atribuições" />
          <ProdPanel registroId={row.codigo} />
        </section>

        {/* ── Link ── */}
        {row.link_processo && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1 flex items-center gap-1">
              <LinkIcon size={11} />Link do Processo
            </div>
            <a
              href={row.link_processo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-700 hover:text-blue-900 font-medium flex items-center gap-1.5 break-all text-sm"
            >
              <ExternalLink size={14} className="flex-shrink-0" />{row.link_processo}
            </a>
          </div>
        )}

        {/* ── Dados do Processo (assíncronos) ── */}
        {loadingFull && (
          <div className="flex items-center gap-2 py-3 text-slate-400 text-xs">
            <Loader2 size={13} className="animate-spin" />Carregando dados adicionais...
          </div>
        )}
        {full && (
          <div className="space-y-4">
            <section>
              <Sec icon={<BookOpen size={13} />} title="Resumo Financeiro" />
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-700">{full.objetos?.length ?? 0}</div>
                  <div className="text-xs text-blue-500 mt-0.5">Objetos</div>
                  {(full.objetos?.length ?? 0) > 0 && <div className="text-xs text-blue-600 font-semibold mt-0.5">{fmt(full.objetos!.reduce((s, o) => s + (o.custo ?? 0), 0))}</div>}
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-amber-700">{full.parcelamentos?.length ?? 0}</div>
                  <div className="text-xs text-amber-500 mt-0.5">Parcelamentos</div>
                  {(full.parcelamentos?.length ?? 0) > 0 && <div className="text-xs text-amber-600 font-semibold mt-0.5">{fmt(full.parcelamentos!.reduce((s, p) => s + (p.valor_parcelado ?? 0), 0))}</div>}
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-purple-700">{full.tas?.length ?? 0}</div>
                  <div className="text-xs text-purple-500 mt-0.5">TAs</div>
                  {(full.tas?.length ?? 0) > 0 && <div className="text-xs text-purple-600 font-semibold mt-0.5">{fmt(full.tas!.reduce((s, t) => s + (t.custo ?? 0), 0))}</div>}
                </div>
              </div>
            </section>

            {(full.exercicios?.length ?? 0) > 0 && (
              <section>
                <Sec icon={<Calendar size={13} />} title={`Exercícios (${full.exercicios!.length})`} />
                <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-1">
                  {full.exercicios!.map(ex => (
                    <div key={ex.codigo} className="grid grid-cols-4 gap-2 text-xs">
                      <span className="font-bold text-slate-700">{ex.exercicio}</span>
                      <span className="text-slate-500">Rep: <span className="text-green-700 font-medium">{fmt(ex.repasse)}</span></span>
                      <span className="text-slate-500">Apl: <span className="font-medium">{fmt(ex.aplicacao)}</span></span>
                      <span className="text-slate-500">Dev: <span className="font-medium">{fmt(ex.devolvido)}</span></span>
                    </div>
                  ))}
                  <div className="border-t border-green-200 pt-1 flex justify-between text-xs font-bold">
                    <span className="text-slate-600">Total Repasse</span>
                    <span className="text-green-700">{fmt(full.exercicios!.reduce((s, e) => s + (e.repasse ?? 0), 0))}</span>
                  </div>
                </div>
              </section>
            )}

            {(full.historicos?.length ?? 0) > 0 && (
              <section>
                <Sec icon={<Clock size={13} />} title={`Histórico de Movimentos (${full.historicos!.length})`} />
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
                  {full.historicos!.slice(-5).map(h => (
                    <div key={h.codigo} className="flex items-center gap-2 text-xs py-0.5">
                      <span className="text-slate-400 whitespace-nowrap w-20 flex-shrink-0">{fmtDate(h.data)}</span>
                      <span className="text-slate-700 font-medium truncate">{h.movimento ?? '-'}</span>
                      {h.posicao && <span className="flex-shrink-0 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-xs font-medium">{h.posicao}</span>}
                      {h.responsavel && <span className="flex-shrink-0 text-slate-400 flex items-center gap-0.5"><User size={9} />{h.responsavel}</span>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ── Posições Duplicadas ── */}
        {prevPositions.length > 0 && (
          <section>
            <Sec icon={<Info size={13} />} title="Processo duplicado — outras posições" />
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 flex flex-wrap gap-1.5">
              {prevPositions.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-purple-200 text-purple-700 rounded-full px-2 py-0.5">
                  <Clock size={10} />{p}
                </span>
              ))}
            </div>
          </section>
        )}

      </div>
    </Modal>
  );
};

// ---- RegistroModal (create / edit) ----

interface RegistroModalProps {
  initial?: GpcRecebido;
  posicoes: GpcPosicao[];
  onSave: (form: Partial<GpcRecebido>, prev?: GpcRecebido) => Promise<GpcRecebido>;
  onClose: () => void;
  isAdmin?: boolean;
  onRecordUpdated?: () => Promise<void> | void;
}

const RegistroModal: React.FC<RegistroModalProps> = ({ initial, posicoes, onSave, onClose, isAdmin, onRecordUpdated }) => {
  const [liveRecord, setLiveRecord] = useState<GpcRecebido | undefined>(initial);
  const [form, setForm] = useState<Partial<GpcRecebido>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [full, setFull] = useState<GpcProcessoFull | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [subModal, setSubModal] = useState<null | { type: string; data?: any }>(null);
  const [gpcUsers, setGpcUsers] = useState<{ id: string; name: string }[]>([]);
  const [signatoryUsers, setSignatoryUsers] = useState<{ id: string; name: string }[]>([]);

  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));
  const isEditing = !!(liveRecord?.codigo);

  useEffect(() => {
    GpcService.getGpcUsers().then(setGpcUsers);
    GpcService.getSignatoryUsers().then(setSignatoryUsers);
  }, []);

  useEffect(() => {
    if (!liveRecord?.processo_codigo) return;
    setLoadingFull(true);
    GpcService.getProcessoFull(liveRecord.processo_codigo).then(d => { setFull(d); setLoadingFull(false); });
  }, [liveRecord?.processo_codigo]);

  const refreshFull = async () => {
    if (!liveRecord?.processo_codigo) return;
    const d = await GpcService.getProcessoFull(liveRecord.processo_codigo);
    setFull(d);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setErr(''); setSavedOk(false);
    try {
      const saved = await onSave(form, liveRecord);
      if (!liveRecord?.codigo) {
        setLiveRecord(saved);
        setForm(saved);
        setSavedOk(true);
      } else {
        onClose();
      }
    }
    catch (ex: any) { setErr(ex.message ?? 'Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const confirmDeleteSub = async (action: () => Promise<void>) => {
    if (!confirm('Confirma a exclusão?')) return;
    try { await action(); await refreshFull(); }
    catch (ex: any) { alert(ex.message); }
  };

  const Sec = ({ icon, title, action }: { icon: React.ReactNode; title: string; action?: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-400">{icon}</span>
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</span>
      <div className="flex-1 h-px bg-slate-100" />
      {action}
    </div>
  );

  return (
    <Modal
      title={isEditing ? 'Editar Registro' : 'Novo Registro'}
      subtitle={isEditing ? `#${liveRecord!.codigo} — ${liveRecord!.processo ?? ''}` : 'Preencha os dados do processo'}
      onClose={onClose}
      size="xl"
    >
      <div className="max-h-[78vh] overflow-y-auto pr-0.5 space-y-5">

        <form onSubmit={handleSubmit} className="space-y-5">
          {err && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />{err}
            </div>
          )}
          {savedOk && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <Check size={15} className="flex-shrink-0" />Registro cadastrado! Complete as informações adicionais abaixo.
            </div>
          )}

          {/* ── Identificação do Processo ── */}
          <section>
            <Sec icon={<FileText size={13} />} title="Identificação do Processo" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Número do Processo *</label>
                <input className={INPUT} value={form.processo ?? ''} onChange={e => set('processo', e.target.value)} required placeholder="ex: 00163175/2025-14" />
              </div>
              <div>
                <label className={LABEL}>Convênio</label>
                <input className={INPUT} value={form.convenio ?? ''} onChange={e => set('convenio', e.target.value)} placeholder="ex: 555/2024" />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL}>Entidade / Município</label>
                <input className={INPUT} value={form.entidade ?? ''} onChange={e => set('entidade', e.target.value)} placeholder="Nome da entidade ou município" />
              </div>
            </div>
          </section>

          {/* ── Classificação ── */}
          <section>
            <Sec icon={<ClipboardList size={13} />} title="Classificação e Posição" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className={LABEL}>Exercício (ano)</label>
                <input className={INPUT} value={form.exercicio ?? ''} onChange={e => set('exercicio', e.target.value)} placeholder="ex: 2024" />
              </div>
              <div>
                <label className={LABEL}>DRS</label>
                <select className={INPUT} value={form.drs ?? ''} onChange={e => set('drs', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— sel. —</option>
                  {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>DRS {n.toString().padStart(2, '0')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL + ' flex items-center gap-1'}>
                  Data de Recebimento
                  {!!initial?.data && !isAdmin && <Lock size={11} className="text-slate-400" />}
                </label>
                {!!initial?.data && !isAdmin ? (
                  <div className={INPUT + ' bg-slate-50 text-slate-500 flex items-center gap-1 cursor-not-allowed select-none'}>
                    <Lock size={12} className="text-slate-400 flex-shrink-0" />
                    <span className="text-xs">{form.data ?? '—'}</span>
                  </div>
                ) : (
                  <input className={INPUT} type="date" value={form.data ?? ''} onChange={e => set('data', e.target.value || null)} />
                )}
              </div>
              <div>
                <label className={LABEL}>Responsável pelo Cadastro</label>
                <select className={INPUT} value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value || null)}>
                  <option value="">— selecione —</option>
                  {gpcUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Posição Atual</label>
                <select className={INPUT} value={form.posicao_id ?? ''} onChange={e => set('posicao_id', e.target.value ? Number(e.target.value) : null)}>
                  <option value="">— selecione —</option>
                  {posicoes.map(p => <option key={p.codigo} value={p.codigo}>{p.posicao}</option>)}
                </select>
                {isEditing && initial?.posicao && form.posicao_id !== initial?.posicao_id && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                    <Clock size={11} />Ant: <strong>{initial.posicao}</strong>
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL}>Movimento</label>
                <select className={INPUT} value={form.movimento ?? ''} onChange={e => set('movimento', e.target.value || null)}>
                  <option value="">— selecione —</option>
                  {MOVIMENTOS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Remessa</label>
                <select className={INPUT} value={form.remessa ?? ''} onChange={e => set('remessa', (e.target.value || null) as 'ACIMA' | 'ABAIXO' | null)}>
                  <option value="">— selecione —</option>
                  <option value="ACIMA">Acima de Remessa</option>
                  <option value="ABAIXO">Abaixo de Remessa</option>
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                    checked={!!form.is_parcelamento}
                    onChange={e => set('is_parcelamento', e.target.checked || null)}
                  />
                  <strong>Parcelamento</strong>
                </label>
              </div>
            </div>
          </section>

          {/* ── Análise ── */}
          <section>
            <Sec icon={<BookOpen size={13} />} title="Análise do Processo" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1"><BookOpen size={11} />Nº de Páginas do Processo</span>
                </label>
                <input
                  className={INPUT}
                  type="number"
                  min={0}
                  placeholder="ex: 150"
                  value={form.num_paginas ?? ''}
                  onChange={e => set('num_paginas', e.target.value ? Number(e.target.value) : null)}
                />
                {(form.num_paginas ?? 0) > 0 && (
                  <p className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                    <Gauge size={10} />Complexidade:{' '}
                    <span className={`font-semibold ${
                      (form.num_paginas ?? 0) <= 50 ? 'text-green-600' :
                      (form.num_paginas ?? 0) <= 200 ? 'text-amber-600' :
                      (form.num_paginas ?? 0) <= 500 ? 'text-orange-600' : 'text-red-600'
                    }`}>
                      {(form.num_paginas ?? 0) <= 50 ? 'Baixa' :
                       (form.num_paginas ?? 0) <= 200 ? 'Média' :
                       (form.num_paginas ?? 0) <= 500 ? 'Alta' : 'Muito Alta'}
                    </span>
                  </p>
                )}
              </div>
              <div>
                <label className={LABEL}>
                  <span className="flex items-center gap-1"><LinkIcon size={11} />Link do Processo (URL)</span>
                </label>
                <div className="relative">
                  <input
                    className={INPUT + ' pr-9'}
                    type="url"
                    placeholder="https://..."
                    value={form.link_processo ?? ''}
                    onChange={e => set('link_processo', e.target.value || null)}
                  />
                  {form.link_processo && (
                    <a href={form.link_processo} target="_blank" rel="noopener noreferrer"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ── Situação do Processo ── */}
          <section>
            <Sec icon={<ShieldCheck size={13} />} title="Situação do Processo" />
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={LABEL}>Situação</label>
                  <select className={INPUT} value={form.situacao ?? ''} onChange={e => set('situacao', e.target.value || null)}>
                    <option value="">— não avaliada —</option>
                    <option value="REGULAR">✅ Regular — sem pendências financeiras</option>
                    <option value="PARCIALMENTE_REGULAR">⚠️ Parcialmente Regular — pendências parciais</option>
                    <option value="IRREGULAR">❌ Irregular — com pendências / valores a devolver</option>
                  </select>
                </div>
                {(form.situacao === 'IRREGULAR' || form.situacao === 'PARCIALMENTE_REGULAR') && (
                  <>
                    <div>
                      <label className={LABEL}>Valor a Devolver (R$)</label>
                      <CurrencyInput value={form.valor_a_devolver} onChange={v => set('valor_a_devolver', v)} />
                      <p className="mt-1 text-xs text-slate-400">Total que deve ser restituído ao erário</p>
                    </div>
                    <div>
                      <label className={LABEL}>Valor já Devolvido (R$)</label>
                      <CurrencyInput value={form.valor_devolvido} onChange={v => set('valor_devolvido', v)} />
                      <p className="mt-1 text-xs text-slate-400">Valor efetivamente já restituído</p>
                    </div>
                    {(form.valor_a_devolver ?? 0) > 0 && (() => {
                      const saldo = (form.valor_a_devolver ?? 0) - (form.valor_devolvido ?? 0);
                      return (
                        <div className={`sm:col-span-2 rounded-lg p-3 border ${saldo <= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-0.5">Saldo Pendente</div>
                          <div className={`text-base font-bold ${saldo <= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {fmt(saldo)}
                            {saldo <= 0 && <span className="ml-2 text-xs text-green-600 font-normal">✓ Totalmente quitado</span>}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
                <div className="sm:col-span-2">
                  <label className={LABEL}>Observações / Fundamentação</label>
                  <textarea
                    className={INPUT}
                    rows={3}
                    value={form.situacao_obs ?? ''}
                    onChange={e => set('situacao_obs', e.target.value || null)}
                    placeholder="Descreva os motivos, irregularidades encontradas, diligências realizadas..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Save bar ── */}
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 sticky bottom-0 bg-white/95 backdrop-blur-sm py-3">
            <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
            <button type="submit" className={BTN_PRI} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditing ? 'Salvar Alterações' : 'Cadastrar Processo'}
            </button>
          </div>
        </form>

        {/* ── Sections visible only when a record exists ── */}
        {isEditing && (
          <div className="space-y-5 pb-2">

            {/* Fluxo Técnico */}
            <section>
              <Sec icon={<Activity size={13} />} title="Fluxo Técnico e Responsáveis pela Assinatura" />
              <FluxoTecnicoPanel
                registroId={liveRecord!.codigo}
                posicoes={posicoes}
                numPaginas={form.num_paginas}
                gpcUsers={gpcUsers}
                signatoryUsers={signatoryUsers}
                responsavelAssinatura={form.responsavel_assinatura}
                responsavelAssinatura2={form.responsavel_assinatura_2}
                onRecordUpdated={onRecordUpdated}
              />
            </section>

            {loadingFull && (
              <div className="flex items-center gap-2 py-5 justify-center text-slate-400 text-sm">
                <Loader2 size={16} className="animate-spin" />Carregando dados vinculados...
              </div>
            )}

            {!loadingFull && full && (
              <>
                {/* Exercícios */}
                <section>
                  <Sec
                    icon={<Calendar size={13} />}
                    title={`Exercícios (${full.exercicios?.length ?? 0})`}
                    action={
                      <button className={BTN_PRI + ' text-xs px-2.5 py-1'} onClick={() => setSubModal({ type: 'exercicio' })}>
                        <Plus size={12} />Adicionar
                      </button>
                    }
                  />
                  <InlineTable
                    cols={[
                      { label: 'Ano',       render: (r: GpcExercicio) => <span className="font-bold text-slate-700">{r.exercicio}</span> },
                      { label: 'Ex. Ant.',  render: (r: GpcExercicio) => fmt(r.exercicio_anterior) },
                      { label: 'Repasse',   render: (r: GpcExercicio) => <span className="text-green-700 font-medium">{fmt(r.repasse)}</span> },
                      { label: 'Aplicação', render: (r: GpcExercicio) => fmt(r.aplicacao) },
                      { label: 'Gastos',    render: (r: GpcExercicio) => fmt(r.gastos) },
                      { label: 'Devolvido', render: (r: GpcExercicio) => fmt(r.devolvido) },
                    ]}
                    rows={full.exercicios ?? []}
                    onEdit={r => setSubModal({ type: 'exercicio', data: r })}
                    onDelete={r => confirmDeleteSub(() => GpcService.deleteExercicio(r.codigo))}
                    emptyMsg="Nenhum exercício cadastrado"
                  />
                </section>

                {/* Objetos */}
                <section>
                  <Sec
                    icon={<ClipboardList size={13} />}
                    title={`Objetos (${full.objetos?.length ?? 0})`}
                    action={
                      <button className={BTN_PRI + ' text-xs px-2.5 py-1'} onClick={() => setSubModal({ type: 'objeto' })}>
                        <Plus size={12} />Adicionar
                      </button>
                    }
                  />
                  <InlineTable
                    cols={[
                      { label: 'Descrição', render: (r: GpcObjeto) => <span className="max-w-[300px] block truncate" title={r.objeto ?? ''}>{r.objeto ?? '-'}</span> },
                      { label: 'Custo',     render: (r: GpcObjeto) => <span className="text-green-700 font-semibold">{fmt(r.custo)}</span> },
                    ]}
                    rows={full.objetos ?? []}
                    onEdit={r => setSubModal({ type: 'objeto', data: r })}
                    onDelete={r => confirmDeleteSub(() => GpcService.deleteObjeto(r.codigo))}
                    emptyMsg="Nenhum objeto cadastrado"
                  />
                </section>

                {/* Parcelamentos */}
                <section>
                  <Sec
                    icon={<DollarSign size={13} />}
                    title={`Parcelamentos (${full.parcelamentos?.length ?? 0})`}
                    action={
                      <button className={BTN_PRI + ' text-xs px-2.5 py-1'} onClick={() => setSubModal({ type: 'parcelamento' })}>
                        <Plus size={12} />Adicionar
                      </button>
                    }
                  />
                  <InlineTable
                    cols={[
                      { label: 'Proc. Parcela', render: (r: GpcParcelamento) => <span className="font-medium">{r.proc_parcela ?? '-'}</span> },
                      { label: 'Tipo',           render: (r: GpcParcelamento) => r.tipo ?? '-' },
                      { label: 'Exercício',      render: (r: GpcParcelamento) => r.exercicio ?? '-' },
                      { label: 'Valor',          render: (r: GpcParcelamento) => <span className="text-green-700 font-medium">{fmt(r.valor_parcelado)}</span> },
                      { label: 'Parcelas',       render: (r: GpcParcelamento) => r.parcelas ?? '-' },
                      { label: 'Em Dia',         render: (r: GpcParcelamento) => r.em_dia ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-500">✗</span> },
                      { label: 'Concluído',      render: (r: GpcParcelamento) => r.parcelas_concluidas ? <span className="text-green-600 font-bold">✓</span> : <span className="text-red-500">✗</span> },
                    ]}
                    rows={full.parcelamentos ?? []}
                    onEdit={r => setSubModal({ type: 'parcelamento', data: r })}
                    onDelete={r => confirmDeleteSub(() => GpcService.deleteParcelamento(r.codigo))}
                    emptyMsg="Nenhum parcelamento cadastrado"
                  />
                </section>

                {/* TAs */}
                <section>
                  <Sec
                    icon={<GitBranch size={13} />}
                    title={`Termos Aditivos (${full.tas?.length ?? 0})`}
                    action={
                      <button className={BTN_PRI + ' text-xs px-2.5 py-1'} onClick={() => setSubModal({ type: 'ta' })}>
                        <Plus size={12} />Adicionar
                      </button>
                    }
                  />
                  <InlineTable
                    cols={[
                      { label: 'Número', render: (r: GpcTa) => <span className="font-medium">{r.numero ?? '-'}</span> },
                      { label: 'Data',   render: (r: GpcTa) => fmtDate(r.data) },
                      { label: 'Custo',  render: (r: GpcTa) => <span className="text-green-700 font-semibold">{fmt(r.custo)}</span> },
                    ]}
                    rows={full.tas ?? []}
                    onEdit={r => setSubModal({ type: 'ta', data: r })}
                    onDelete={r => confirmDeleteSub(() => GpcService.deleteTa(r.codigo))}
                    emptyMsg="Nenhum TA cadastrado"
                  />
                </section>
              </>
            )}
          </div>
        )}
      </div>

      {/* Sub-modals */}
      {subModal && full && (
        <>
          {subModal.type === 'exercicio' && (
            <Modal title={subModal.data ? 'Editar Exercício' : 'Novo Exercício'} onClose={() => setSubModal(null)} size="md">
              <ExercicioForm
                processoId={full.codigo}
                initial={subModal.data}
                onSave={async e => { await GpcService.saveExercicio(e); await refreshFull(); setSubModal(null); }}
                onClose={() => setSubModal(null)}
              />
            </Modal>
          )}
          {subModal.type === 'objeto' && (
            <Modal title={subModal.data ? 'Editar Objeto' : 'Novo Objeto'} onClose={() => setSubModal(null)} size="md">
              <ObjetoForm
                processoId={full.codigo}
                initial={subModal.data}
                onSave={async o => { await GpcService.saveObjeto(o); await refreshFull(); setSubModal(null); }}
                onClose={() => setSubModal(null)}
              />
            </Modal>
          )}
          {subModal.type === 'parcelamento' && (
            <Modal title={subModal.data ? 'Editar Parcelamento' : 'Novo Parcelamento'} onClose={() => setSubModal(null)} size="lg">
              <ParcelamentoForm
                processoId={full.codigo}
                initial={subModal.data}
                onSave={async p => { await GpcService.saveParcelamento(p); await refreshFull(); setSubModal(null); }}
                onClose={() => setSubModal(null)}
              />
            </Modal>
          )}
          {subModal.type === 'ta' && (
            <Modal title={subModal.data ? 'Editar TA' : 'Novo Termo Aditivo'} onClose={() => setSubModal(null)} size="md">
              <TaForm
                processoId={full.codigo}
                initial={subModal.data}
                onSave={async t => { await GpcService.saveTa(t); await refreshFull(); setSubModal(null); }}
                onClose={() => setSubModal(null)}
              />
            </Modal>
          )}
        </>
      )}
    </Modal>
  );
};

// ---- Sub-forms ----

const ExercicioForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcExercicio>;
  onSave: (e: Partial<GpcExercicio>) => Promise<void>; onClose: () => void;
}) => {
  const [f, setF] = useState<Partial<GpcExercicio>>(initial ?? { processo_id: processoId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const n = (v: string) => v === '' ? null : Number(v);
  const set = (k: keyof GpcExercicio, v: any) => setF(p => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...f, processo_id: processoId }); }
    catch (ex: any) { setErr(ex.message); setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Exercício *</label><input className={INPUT} value={f.exercicio ?? ''} onChange={e => set('exercicio', e.target.value)} required /></div>
        <div><label className={LABEL}>Exerc. Anterior (R$)</label><CurrencyInput value={f.exercicio_anterior} onChange={v => set('exercicio_anterior', v)} /></div>
        <div><label className={LABEL}>Repasse (R$)</label><CurrencyInput value={f.repasse} onChange={v => set('repasse', v)} /></div>
        <div><label className={LABEL}>Aplicação (R$)</label><CurrencyInput value={f.aplicacao} onChange={v => set('aplicacao', v)} /></div>
        <div><label className={LABEL}>Gastos (R$)</label><CurrencyInput value={f.gastos} onChange={v => set('gastos', v)} /></div>
        <div><label className={LABEL}>Devolvido (R$)</label><CurrencyInput value={f.devolvido} onChange={v => set('devolvido', v)} /></div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRI} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar</button>
      </div>
    </form>
  );
};

const ObjetoForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcObjeto>;
  onSave: (o: Partial<GpcObjeto>) => Promise<void>; onClose: () => void;
}) => {
  const [f, setF] = useState<Partial<GpcObjeto>>(initial ?? { processo_id: processoId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...f, processo_id: processoId }); }
    catch (ex: any) { setErr(ex.message); setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</div>}
      <div>
        <label className={LABEL}>Descrição *</label>
        <textarea className={INPUT} rows={3} value={f.objeto ?? ''} onChange={e => setF(p => ({ ...p, objeto: e.target.value }))} required />
      </div>
      <div>
        <label className={LABEL}>Custo (R$)</label>
        <CurrencyInput value={f.custo} onChange={v => setF(p => ({ ...p, custo: v }))} />
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRI} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar</button>
      </div>
    </form>
  );
};

const ParcelamentoForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcParcelamento>;
  onSave: (p: Partial<GpcParcelamento>) => Promise<void>; onClose: () => void;
}) => {
  const [f, setF] = useState<Partial<GpcParcelamento>>(initial ?? { processo_id: processoId, em_dia: false, parcelas_concluidas: false });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcParcelamento, v: any) => setF(p => ({ ...p, [k]: v }));
  const n = (v: string) => v === '' ? null : Number(v);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...f, processo_id: processoId }); }
    catch (ex: any) { setErr(ex.message); setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Proc. Parcela</label><input className={INPUT} value={f.proc_parcela ?? ''} onChange={e => set('proc_parcela', e.target.value)} /></div>
        <div><label className={LABEL}>Tipo</label><input className={INPUT} value={f.tipo ?? ''} onChange={e => set('tipo', e.target.value)} /></div>
        <div><label className={LABEL}>Exercício</label><input className={INPUT} type="number" value={f.exercicio ?? ''} onChange={e => set('exercicio', n(e.target.value))} /></div>
        <div><label className={LABEL}>Nº Parcelas</label><input className={INPUT} type="number" value={f.parcelas ?? ''} onChange={e => set('parcelas', n(e.target.value))} /></div>
        <div><label className={LABEL}>Valor Parcelado (R$)</label><CurrencyInput value={f.valor_parcelado} onChange={v => set('valor_parcelado', v)} /></div>
        <div><label className={LABEL}>Valor Corrigido (R$)</label><CurrencyInput value={f.valor_corrigido} onChange={v => set('valor_corrigido', v)} /></div>
        <div className="col-span-2 flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={f.em_dia ?? false} onChange={e => set('em_dia', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />Em Dia
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={f.parcelas_concluidas ?? false} onChange={e => set('parcelas_concluidas', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />Concluídas
          </label>
        </div>
        <div className="col-span-2"><label className={LABEL}>Providências</label><textarea className={INPUT} rows={2} value={f.providencias ?? ''} onChange={e => set('providencias', e.target.value)} /></div>
        <div className="col-span-2"><label className={LABEL}>Observações</label><textarea className={INPUT} rows={2} value={f.obs ?? ''} onChange={e => set('obs', e.target.value)} /></div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRI} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar</button>
      </div>
    </form>
  );
};

const TaForm = ({ processoId, initial, onSave, onClose }: {
  processoId: number; initial?: Partial<GpcTa>;
  onSave: (t: Partial<GpcTa>) => Promise<void>; onClose: () => void;
}) => {
  const [f, setF] = useState<Partial<GpcTa>>(initial ?? { processo_id: processoId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...f, processo_id: processoId }); }
    catch (ex: any) { setErr(ex.message); setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={LABEL}>Número do TA *</label>
          <input className={INPUT} value={f.numero ?? ''} onChange={e => setF(p => ({ ...p, numero: e.target.value }))} required />
        </div>
        <div><label className={LABEL}>Data</label><input className={INPUT} type="date" value={f.data ?? ''} onChange={e => setF(p => ({ ...p, data: e.target.value || null }))} /></div>
        <div><label className={LABEL}>Custo (R$)</label><CurrencyInput value={f.custo} onChange={v => setF(p => ({ ...p, custo: v }))} /></div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRI} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar</button>
      </div>
    </form>
  );
};

// ---- Productivity summary page ----

// ---- Productivity Page ----

type ProdEvento = { registro_id: number; responsavel: string; evento: string; data_evento: string };
type Granularity = 'dia' | 'mes' | 'ano' | 'geral';

interface TechStats {
  responsavel: string;
  analises: number;       // unique registro_ids with INICIO_ANALISE
  posicoes: number;       // POSICAO events
  movimentos: number;     // MOVIMENTO events
  total: number;
}

function periodoKey(date: string, gran: Granularity): string {
  const d = date.slice(0, 10);
  if (gran === 'dia')   return d;
  if (gran === 'mes')   return d.slice(0, 7);
  if (gran === 'ano')   return d.slice(0, 4);
  return 'geral';
}

function fmtPeriodo(key: string, gran: Granularity): string {
  if (gran === 'dia')  { const [y, m, d] = key.split('-'); return `${d}/${m}/${y}`; }
  if (gran === 'mes')  { const [y, m] = key.split('-'); return `${MONTHS_PT[Number(m) - 1] ?? m}/${y}`; }
  if (gran === 'ano')  return key;
  return 'Geral';
}

function computeStats(events: ProdEvento[], gran: Granularity, period: string): TechStats[] {
  const inPeriod = gran === 'geral' ? events : events.filter(e => periodoKey(e.data_evento, gran) === period);
  const map: Record<string, { analises: Set<number>; posicoes: number; movimentos: number }> = {};
  for (const e of inPeriod) {
    if (!map[e.responsavel]) map[e.responsavel] = { analises: new Set(), posicoes: 0, movimentos: 0 };
    if (e.evento === 'INICIO_ANALISE') map[e.responsavel].analises.add(e.registro_id);
    if (e.evento === 'POSICAO')        map[e.responsavel].posicoes++;
    if (e.evento === 'MOVIMENTO')      map[e.responsavel].movimentos++;
  }
  return Object.entries(map).map(([responsavel, s]) => ({
    responsavel,
    analises:   s.analises.size,
    posicoes:   s.posicoes,
    movimentos: s.movimentos,
    total:      s.analises.size + s.posicoes + s.movimentos,
  })).sort((a, b) => b.total - a.total);
}

const ProdutividadePage = () => {
  const [events, setEvents] = useState<ProdEvento[]>([]);
  const [loading, setLoading] = useState(true);
  const [gran, setGran] = useState<Granularity>('mes');
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));
  const [fluxoResumo, setFluxoResumo] = useState<{
    tecnico: string; total_registros: number; total_paginas: number;
    tempo_medio_dias: number; ultimo_evento: string;
  }[]>([]);

  useEffect(() => {
    GpcService.getProdutividadeDetalhado().then(d => { setEvents(d); setLoading(false); });
    GpcService.getFluxoResumoTecnicos().then(setFluxoResumo);
  }, []);

  const allPeriods = useMemo(() => {
    if (gran === 'geral') return ['geral'];
    const set = new Set<string>();
    for (const e of events) set.add(periodoKey(e.data_evento, gran));
    return [...set].sort().reverse();
  }, [events, gran]);

  useEffect(() => {
    if (gran === 'geral') { setPeriod('geral'); return; }
    const now = new Date().toISOString();
    const cur = periodoKey(now, gran);
    setPeriod(prev => allPeriods.includes(prev) ? prev : (allPeriods[0] ?? cur));
  }, [gran, allPeriods]);

  const stats = useMemo(() => computeStats(events, gran, period), [events, gran, period]);

  // Período anterior para comparação
  const prevPeriodStr = useMemo(() => {
    if (gran === 'geral' || !period || period === 'geral') return null;
    if (gran === 'mes') {
      const [y, m] = period.split('-').map(Number);
      if (m === 1) return `${y - 1}-12`;
      return `${y}-${String(m - 1).padStart(2, '0')}`;
    }
    if (gran === 'dia') {
      const d = new Date(period); d.setDate(d.getDate() - 1);
      return d.toISOString().slice(0, 10);
    }
    if (gran === 'ano') return String(Number(period) - 1);
    return null;
  }, [period, gran]);

  const prevStats = useMemo(() =>
    prevPeriodStr ? computeStats(events, gran, prevPeriodStr) : [], [events, gran, prevPeriodStr]);

  const totals = useMemo(() => stats.reduce((acc, s) => ({
    analises: acc.analises + s.analises,
    posicoes: acc.posicoes + s.posicoes,
    movimentos: acc.movimentos + s.movimentos,
    total: acc.total + s.total,
  }), { analises: 0, posicoes: 0, movimentos: 0, total: 0 }), [stats]);

  const prevTotals = useMemo(() => prevStats.reduce((acc, s) => ({
    analises: acc.analises + s.analises,
    posicoes: acc.posicoes + s.posicoes,
    movimentos: acc.movimentos + s.movimentos,
    total: acc.total + s.total,
  }), { analises: 0, posicoes: 0, movimentos: 0, total: 0 }), [prevStats]);

  const topPerformer = stats[0] ?? null;

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-400" /></div>;

  const Delta = ({ cur, prev }: { cur: number; prev: number }) => {
    if (!prev || gran === 'geral') return null;
    const d = cur - prev;
    if (d === 0) return <span className="text-xs text-slate-400 ml-1 font-medium">= mesmo</span>;
    return (
      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${d > 0 ? 'text-green-600' : 'text-red-500'}`}>
        {d > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {d > 0 ? '+' : ''}{d} vs anterior
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {(['dia', 'mes', 'ano', 'geral'] as Granularity[]).map(g => (
            <button key={g} onClick={() => setGran(g)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${gran === g ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {g === 'dia' ? 'Dia' : g === 'mes' ? 'Mês' : g === 'ano' ? 'Ano' : 'Geral'}
            </button>
          ))}
        </div>
        {gran !== 'geral' && (
          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={period} onChange={e => setPeriod(e.target.value)}>
            {allPeriods.map(p => <option key={p} value={p}>{fmtPeriodo(p, gran)}</option>)}
          </select>
        )}
        {prevPeriodStr && prevTotals.total > 0 && (
          <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500">
            Período anterior: <strong className="text-slate-700">{fmtPeriodo(prevPeriodStr, gran)}</strong>
            {' · '}<span className="text-slate-600">{prevTotals.total} ações</span>
          </div>
        )}
        <span className="ml-auto text-sm text-slate-400">
          {gran === 'geral' ? 'Todos os períodos' : fmtPeriodo(period, gran)}
          {' · '}<strong className="text-slate-600">{stats.length}</strong> técnico{stats.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Destaque do período */}
      {topPerformer && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-4 flex items-center gap-4 text-white shadow-lg">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <Award size={22} className="text-yellow-300" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">🏆 Técnico destaque do período</div>
            <div className="text-lg font-extrabold mt-0.5 truncate">{topPerformer.responsavel}</div>
            <div className="text-xs text-blue-200 mt-0.5 flex flex-wrap gap-x-3">
              <span>{topPerformer.analises} processo{topPerformer.analises !== 1 ? 's' : ''} analisado{topPerformer.analises !== 1 ? 's' : ''}</span>
              <span>{topPerformer.posicoes} avanço{topPerformer.posicoes !== 1 ? 's' : ''} de posição</span>
              <span>{topPerformer.movimentos} atualização{topPerformer.movimentos !== 1 ? 'ões' : ''}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-4xl font-black leading-none">
              {totals.total > 0 ? `${Math.round((topPerformer.total / totals.total) * 100)}%` : '—'}
            </div>
            <div className="text-xs text-blue-200 mt-1">do total de ações</div>
            <div className="text-sm font-bold mt-0.5">{topPerformer.total} ações</div>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Processos Analisados', sub: 'Processos que receberam início de análise no período',
            value: totals.analises, prev: prevTotals.analises,
            bg: 'bg-sky-50 border-sky-100', text: 'text-sky-700', dot: 'bg-sky-500',
          }, {
            label: 'Avanços de Posição', sub: 'Vezes que a posição de um processo foi movimentada',
            value: totals.posicoes, prev: prevTotals.posicoes,
            bg: 'bg-amber-50 border-amber-100', text: 'text-amber-700', dot: 'bg-amber-500',
          }, {
            label: 'Atualizações de Movimento', sub: 'Novos estágios registrados nos processos',
            value: totals.movimentos, prev: prevTotals.movimentos,
            bg: 'bg-purple-50 border-purple-100', text: 'text-purple-700', dot: 'bg-purple-500',
          }, {
            label: 'Total de Ações', sub: 'Soma de todas as atividades registradas no período',
            value: totals.total, prev: prevTotals.total,
            bg: 'bg-blue-50 border-blue-100', text: 'text-blue-700', dot: 'bg-blue-500',
          },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl border p-4 flex flex-col gap-1`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${k.dot}`} />
            <div className={`text-2xl font-extrabold mt-1 ${k.text}`}>{k.value.toLocaleString('pt-BR')}</div>
            <div className="text-xs font-bold text-slate-700 leading-tight">{k.label}</div>
            <div className="text-xs text-slate-400 leading-tight">{k.sub}</div>
            <Delta cur={k.value} prev={k.prev} />
          </div>
        ))}
      </div>

      {/* Tabela por técnico */}
      {!stats.length ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <TrendingUp size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-sm font-medium">Nenhuma atividade registrada neste período.</p>
          <p className="text-slate-300 text-xs mt-1">Selecione outro período ou altere a granularidade.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <BarChart2 size={15} className="text-slate-400" />
              <span className="text-sm font-bold text-slate-700">Atividade por Técnico</span>
              <span className="ml-auto text-xs text-slate-400">{stats.length} técnico{stats.length !== 1 ? 's' : ''} ativos no período</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-3 text-center text-xs font-bold text-slate-400 w-10">#</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-sky-600 uppercase tracking-wider"
                    title="Número de processos distintos onde o técnico registrou início de análise">
                    <span className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />Analisados</span>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wider"
                    title="Número de vezes que o técnico movimentou a posição de um processo">
                    <span className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Posições</span>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 uppercase tracking-wider"
                    title="Número de movimentos/estágios registrados pelo técnico">
                    <span className="flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />Movimentos</span>
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-blue-600 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider min-w-[160px]"
                    title="Distribuição percentual das atividades (azul=análises, laranja=posições, roxo=movimentos)">
                    Composição
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map((s, idx) => {
                  const pct = totals.total > 0 ? Math.round((s.total / totals.total) * 100) : 0;
                  const total = s.analises + s.posicoes + s.movimentos;
                  const rankClr = ['text-yellow-500', 'text-slate-400', 'text-amber-600'];
                  const avatarGrad = idx === 0 ? 'from-yellow-400 to-amber-500' : idx === 1 ? 'from-slate-300 to-slate-400' : idx === 2 ? 'from-amber-500 to-amber-700' : 'from-blue-400 to-blue-600';
                  return (
                    <tr key={s.responsavel} className={`hover:bg-blue-50/30 transition-colors ${idx === 0 ? 'bg-yellow-50/30' : ''}`}>
                      <td className="px-3 py-3 text-center">
                        {idx < 3
                          ? <span className={`text-sm font-black ${rankClr[idx]}`}>#{idx + 1}</span>
                          : <span className="text-xs text-slate-400 font-medium">{idx + 1}</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${avatarGrad} text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0`}>
                            {s.responsavel.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className={`font-semibold ${idx === 0 ? 'text-amber-800' : 'text-slate-800'}`}>{s.responsavel}</div>
                            {idx === 0 && <div className="text-xs text-amber-600 flex items-center gap-1"><Award size={10} />Destaque do período</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-bold">{s.analises}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">{s.posicoes}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{s.movimentos}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{s.total}</span>
                          <span className="text-xs text-slate-400 font-semibold">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1.5">
                          {total > 0 ? (
                            <div className="flex h-3 rounded-full overflow-hidden gap-px" title={`${s.analises} análises · ${s.posicoes} posições · ${s.movimentos} movimentos`}>
                              {s.analises   > 0 && <div style={{ width: `${(s.analises / total) * 100}%`   }} className="bg-sky-400" />}
                              {s.posicoes   > 0 && <div style={{ width: `${(s.posicoes / total) * 100}%`   }} className="bg-amber-400" />}
                              {s.movimentos > 0 && <div style={{ width: `${(s.movimentos / total) * 100}%` }} className="bg-purple-400" />}
                            </div>
                          ) : <div className="h-3 rounded-full bg-slate-100" />}
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td className="px-3 py-3" />
                  <td className="px-4 py-3 text-sm font-bold text-slate-700">Total geral</td>
                  <td className="px-4 py-3 text-center"><span className="inline-block px-2.5 py-1 bg-sky-50 text-sky-700 rounded-full text-xs font-bold">{totals.analises}</span></td>
                  <td className="px-4 py-3 text-center"><span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold">{totals.posicoes}</span></td>
                  <td className="px-4 py-3 text-center"><span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">{totals.movimentos}</span></td>
                  <td className="px-4 py-3 text-center"><span className="inline-block px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">{totals.total}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex h-3 rounded-full overflow-hidden gap-px">
                      {totals.analises   > 0 && <div style={{ width: `${(totals.analises   / totals.total) * 100}%` }} className="bg-sky-400" />}
                      {totals.posicoes   > 0 && <div style={{ width: `${(totals.posicoes   / totals.total) * 100}%` }} className="bg-amber-400" />}
                      {totals.movimentos > 0 && <div style={{ width: `${(totals.movimentos / totals.total) * 100}%` }} className="bg-purple-400" />}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-500">Legenda da composição:</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-sky-400 inline-block" />Processos analisados</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-amber-400 inline-block" />Avanços de posição</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded bg-purple-400 inline-block" />Atualizações de movimento</span>
          </div>
        </>
      )}

      {/* Fluxo Técnico — Desempenho detalhado */}
      {fluxoResumo.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Activity size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Fluxo Técnico — Desempenho Detalhado</h3>
              <p className="text-xs text-slate-400 mt-0.5">Baseado nos eventos registrados no fluxo técnico de cada processo individualmente</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider"
                    title="Total de ações registradas no fluxo técnico dos processos">Ações no Fluxo</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-purple-600 uppercase tracking-wider"
                    title="Total de páginas processadas/analisadas nos eventos">Páginas Analisadas</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-cyan-600 uppercase tracking-wider"
                    title="Média de páginas por ação registrada — indica a densidade de trabalho">Efic. (pág/ação)</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-amber-600 uppercase tracking-wider"
                    title="Média de dias entre eventos consecutivos. Verde ≤5 dias (rápido), Amarelo ≤15 (regular), Vermelho >15 (lento)">Tempo Médio</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Último Registro</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Produtividade Rel.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fluxoResumo.map((s, idx) => {
                  const maxRegs = Math.max(...fluxoResumo.map(f => f.total_registros), 1);
                  const pct = Math.round((s.total_registros / maxRegs) * 100);
                  const efic = s.total_registros > 0 ? Math.round(s.total_paginas / s.total_registros) : 0;
                  const diasUltimo = s.ultimo_evento
                    ? Math.round((Date.now() - new Date(s.ultimo_evento).getTime()) / 86400000)
                    : null;
                  return (
                    <tr key={s.tecnico} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-bold shadow-sm flex-shrink-0 ${idx === 0 ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' : 'bg-gradient-to-br from-indigo-300 to-indigo-500'}`}>
                            {s.tecnico.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800">{s.tecnico}</div>
                            {diasUltimo !== null && (
                              <div className={`text-xs mt-0.5 ${diasUltimo === 0 ? 'text-green-600 font-semibold' : diasUltimo <= 3 ? 'text-green-500' : diasUltimo <= 7 ? 'text-amber-500' : 'text-slate-400'}`}>
                                {diasUltimo === 0 ? '● Ativo hoje' : `Ativo há ${diasUltimo} dia${diasUltimo !== 1 ? 's' : ''}`}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold">{s.total_registros}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">{s.total_paginas.toLocaleString('pt-BR')}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${efic >= 100 ? 'bg-cyan-100 text-cyan-700' : efic >= 30 ? 'bg-blue-100 text-blue-700' : efic > 0 ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'}`}>
                          {efic > 0 ? `${efic} pág/ação` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${s.tempo_medio_dias === 0 ? 'bg-slate-100 text-slate-500' : s.tempo_medio_dias <= 5 ? 'bg-green-100 text-green-700' : s.tempo_medio_dias <= 15 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {s.tempo_medio_dias === 0 ? '< 1 dia' : `${s.tempo_medio_dias} dia${s.tempo_medio_dias !== 1 ? 's' : ''}`}
                          </span>
                          <span className={`text-xs ${s.tempo_medio_dias === 0 || s.tempo_medio_dias <= 5 ? 'text-green-500' : s.tempo_medio_dias <= 15 ? 'text-amber-500' : 'text-red-400'}`}>
                            {s.tempo_medio_dias <= 5 ? 'Rápido' : s.tempo_medio_dias <= 15 ? 'Regular' : 'Lento'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{fmtTs(s.ultimo_evento)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-500 w-9 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td className="px-4 py-3 text-sm font-bold text-slate-600">Total</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">
                      {fluxoResumo.reduce((s, r) => s + r.total_registros, 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
                      {fluxoResumo.reduce((s, r) => s + r.total_paginas, 0).toLocaleString('pt-BR')}
                    </span>
                  </td>
                  <td colSpan={4} className="px-4 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-500">Tempo Médio entre eventos:</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Rápido ≤5 dias</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Regular ≤15 dias</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Lento &gt;15 dias</span>
          </div>
        </div>
      )}
    </div>
  );
};

// ---- Delete Password Modal ----

const DeletePasswordModal = ({ processo, onCancel, onConfirm }: {
  processo: string | null;
  onCancel: () => void;
  onConfirm: (password: string) => Promise<string | null>;
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) { setErr('Digite sua senha'); return; }
    setLoading(true); setErr('');
    const error = await onConfirm(password);
    if (error) { setErr(error); setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="bg-red-50 border-b border-red-100 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-600" />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">Confirmar Exclusão</div>
            {processo && <div className="text-xs text-slate-500 font-mono mt-0.5">{processo}</div>}
          </div>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <p className="text-sm text-slate-600">
            Esta ação é <strong className="text-red-600">irreversível</strong>. Digite sua senha para confirmar a exclusão do registro.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              <span className="flex items-center gap-1"><KeyRound size={11} />Sua senha</span>
            </label>
            <input
              type="password"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-red-400"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErr(''); }}
              autoFocus
            />
          </div>
          {err && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle size={13} />{err}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Excluir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ---- Main Page ----

export const GpcProcessos = () => {
  const { currentUser } = useApp();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const [mainTab, setMainTab] = useState<'registros' | 'parcelamentos' | 'produtividade'>('registros');
  const [rows, setRows] = useState<GpcRecebido[]>([]);
  const [posicoes, setPosicoes] = useState<GpcPosicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState({ processo: '', convenio: '', entidade: '', exercicio: '', drs: '', responsavel: '', posicao_id: '', movimento: '', remessa: '', situacao: '' });
  const [page, setPage] = useState(1);
  const [viewRow, setViewRow] = useState<GpcRecebido | null>(null);
  const [modal, setModal] = useState<null | { data?: GpcRecebido }>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ codigo: number; processo: string | null } | null>(null);
  const PAGE = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const data = await GpcService.getAllRecebidos();
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); GpcService.getPosicoes().then(setPosicoes); }, [load]);

  const duplicateMap = useMemo(() => {
    const map: Record<string, { codigo: number; posicao: string | null }[]> = {};
    for (const r of rows) {
      const key = sv(r.processo);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push({ codigo: r.codigo, posicao: r.posicao ?? null });
    }
    return map;
  }, [rows]);

  const filtered = useMemo(() => {
    const f = filters;
    const base = mainTab === 'parcelamentos'
      ? rows.filter(r => !!r.is_parcelamento)
      : rows;
    return sortRows(base.filter(r =>
      (!f.processo    || sv(r.processo).includes(sv(f.processo))) &&
      (!f.convenio    || sv(r.convenio).includes(sv(f.convenio))) &&
      (!f.entidade    || sv(r.entidade).includes(sv(f.entidade))) &&
      (!f.exercicio   || sv(r.exercicio).includes(sv(f.exercicio))) &&
      (!f.drs         || sv(r.drs).includes(sv(f.drs))) &&
      (!f.responsavel || sv(r.responsavel).includes(sv(f.responsavel))) &&
      (!f.posicao_id  || sv(r.posicao_id) === sv(f.posicao_id)) &&
      (!f.movimento   || sv(r.movimento).includes(sv(f.movimento))) &&
      (!f.remessa     || sv(r.remessa) === sv(f.remessa)) &&
      (!f.situacao    || sv(r.situacao) === sv(f.situacao))
    ), sort);
  }, [rows, filters, sort, mainTab]);

  useEffect(() => { setPage(1); }, [filters, sort]);

  const paged = useMemo(() => filtered.slice((page - 1) * PAGE, page * PAGE), [filtered, page]);
  const totalPages = Math.ceil(filtered.length / PAGE);

  const toggleSort = (col: string) => setSort(s => s?.col === col ? { col, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' });
  const setF = (k: keyof typeof filters, v: string) => setFilters(f => ({ ...f, [k]: v }));

  const getPrevPositions = (r: GpcRecebido): string[] => {
    const dupes = duplicateMap[sv(r.processo)] ?? [];
    return dupes.filter(d => d.codigo !== r.codigo).map(d => d.posicao).filter(Boolean) as string[];
  };

  const handleSave = async (form: Partial<GpcRecebido>, prev?: GpcRecebido): Promise<GpcRecebido> => {
    let saved = await GpcService.saveRecebido(form);

    // Auto-create linked cgof_gpc_processo for brand-new records so sub-tabs work immediately
    if (!prev?.codigo && !saved.processo_codigo) {
      const proc = await GpcService.saveProcesso({
        processo: saved.processo ?? null,
        convenio: saved.convenio ?? null,
        entidade: saved.entidade ?? null,
        drs: saved.drs ?? null,
        ano_cadastro: saved.exercicio ?? null,
      });
      saved = await GpcService.saveRecebido({ ...saved, processo_codigo: proc.codigo });
    }

    const now = new Date().toISOString();
    const posLabel = posicoes.find(p => p.codigo === form.posicao_id)?.posicao ?? null;
    const diffDias = (from: string) =>
      Math.round((new Date().getTime() - new Date(from).getTime()) / 86400000);

    if (!prev?.codigo) {
      // New record
      if (form.responsavel) {
        await GpcService.saveProdutividade({ registro_id: saved.codigo, responsavel: form.responsavel, posicao_id: form.posicao_id ?? null, posicao: posLabel, evento: 'CRIACAO', data_evento: now });
      }
      // If created already in EM ANÁLISE, register start of analysis
      if (form.movimento === 'EM ANÁLISE') {
        await GpcService.saveProdutividade({
          registro_id: saved.codigo, responsavel: form.responsavel ?? null,
          posicao_id: form.posicao_id ?? null, posicao: posLabel,
          evento: 'INICIO_ANALISE', data_evento: now,
          obs: `Processo criado já em análise${form.responsavel ? ' por ' + form.responsavel : ''}`,
        });
      }
    } else {
      // Lazy-load previous events (fetched at most once)
      let _prevEvents: GpcProdutividade[] | null = null;
      const getEvents = async () => {
        if (!_prevEvents) _prevEvents = await GpcService.getProdutividade(saved.codigo);
        return _prevEvents;
      };

      // 1. Responsible changed
      if (form.responsavel !== prev.responsavel && form.responsavel) {
        await GpcService.saveProdutividade({ registro_id: saved.codigo, responsavel: form.responsavel, posicao_id: form.posicao_id ?? null, posicao: posLabel, evento: 'RESPONSAVEL', data_evento: now });
      }

      // 2. Process entering EM ANÁLISE (e.g. new technician starts analysis)
      if (prev.movimento !== 'EM ANÁLISE' && form.movimento === 'EM ANÁLISE') {
        await GpcService.saveProdutividade({
          registro_id: saved.codigo, responsavel: form.responsavel ?? null,
          posicao_id: form.posicao_id ?? null, posicao: posLabel,
          evento: 'INICIO_ANALISE', data_evento: now,
          obs: `Iniciado em análise${form.responsavel ? ' por ' + form.responsavel : ''}`,
        });
      }

      // 3. Position changed — calculate time in previous position
      if (form.posicao_id !== prev.posicao_id && form.posicao_id) {
        const posLabelPrev = posicoes.find(p => p.codigo === prev.posicao_id)?.posicao ?? String(prev.posicao_id ?? '');
        const events = await getEvents();
        const lastRef = [...events].reverse().find(e =>
          e.evento === 'POSICAO' || e.evento === 'CRIACAO' || e.evento === 'INICIO_ANALISE'
        );
        let posObsText: string;
        if (lastRef?.data_evento) {
          const dias = diffDias(lastRef.data_evento);
          posObsText = `${posLabelPrev || 'posição anterior'} → ${posLabel || 'nova posição'}. Tempo na posição: ${dias} dia${dias !== 1 ? 's' : ''}`;
        } else {
          posObsText = `${posLabelPrev || 'posição anterior'} → ${posLabel || 'nova posição'}`;
        }
        await GpcService.saveProdutividade({ registro_id: saved.codigo, responsavel: form.responsavel ?? null, posicao_id: form.posicao_id, posicao: posLabel, evento: 'POSICAO', data_evento: now, obs: posObsText });
      }

      // 4. Movement changed — track ANY movimento change
      if (form.movimento && form.movimento !== prev.movimento) {
        let obsText: string;
        if (prev.movimento === 'EM ANÁLISE') {
          const events = await getEvents();
          const lastAnalise = [...events].reverse().find(e => e.evento === 'INICIO_ANALISE');
          if (lastAnalise?.data_evento) {
            const dias = diffDias(lastAnalise.data_evento);
            obsText = `${prev.movimento} → ${form.movimento}. Tempo em análise: ${dias} dia${dias !== 1 ? 's' : ''}`;
          } else {
            obsText = `${prev.movimento} → ${form.movimento}`;
          }
        } else {
          obsText = `${prev.movimento ?? '-'} → ${form.movimento}`;
        }
        await GpcService.saveProdutividade({
          registro_id: saved.codigo,
          responsavel: form.responsavel ?? null,
          posicao_id: form.posicao_id ?? null,
          posicao: posLabel,
          evento: 'MOVIMENTO',
          data_evento: now,
          obs: obsText,
        });
      }
    }
    await load();
    return saved;
  };

  const handleDelete = (codigo: number) => {
    const r = rows.find(x => x.codigo === codigo);
    setDeleteConfirm({ codigo, processo: r?.processo ?? null });
  };

  const confirmDeleteWithPassword = async (password: string): Promise<string | null> => {
    if (!currentUser?.id) return 'Usuário não autenticado';
    const valid = await DbService.verifyPassword(currentUser.id, password);
    if (!valid) return 'Senha incorreta';
    try {
      await GpcService.deleteRecebido(deleteConfirm!.codigo);
      setViewRow(null);
      setDeleteConfirm(null);
      await load();
      return null;
    } catch (ex: any) {
      return ex.message ?? 'Erro ao excluir';
    }
  };

  const exportXLSX = () => {
    const situacaoLabel = (s: string | null | undefined) =>
      s === 'REGULAR' ? 'Regular' : s === 'IRREGULAR' ? 'Irregular' : s === 'PARCIALMENTE_REGULAR' ? 'Parcialmente Regular' : '';
    const headers = [
      'Processo', 'Convênio', 'Entidade', 'Exercício', 'DRS', 'Data Recebimento',
      'Responsável', 'Posição', 'Movimento', 'Remessa', 'Parcelamento',
      'Situação', 'Valor a Devolver (R$)', 'Valor Devolvido (R$)', 'Saldo Pendente (R$)',
      '1º Resp. Assinatura', '2º Resp. Assinatura',
      'Nº Páginas', 'Link', 'Cadastrado em',
    ];
    const body = filtered.map(r => [
      r.processo ?? '',
      r.convenio ?? '',
      r.entidade ?? '',
      r.exercicio ?? '',
      r.drs ?? '',
      fmtDate(r.data),
      r.responsavel ?? '',
      r.posicao ?? '',
      r.movimento ?? '',
      r.remessa === 'ACIMA' ? 'Acima de Remessa' : r.remessa === 'ABAIXO' ? 'Abaixo de Remessa' : '',
      r.is_parcelamento ? 'Sim' : 'Não',
      situacaoLabel(r.situacao),
      r.valor_a_devolver ?? '',
      r.valor_devolvido ?? '',
      r.valor_a_devolver != null ? (r.valor_a_devolver - (r.valor_devolvido ?? 0)) : '',
      r.responsavel_assinatura ?? '',
      r.responsavel_assinatura_2 ?? '',
      r.num_paginas ?? '',
      r.link_processo ?? '',
      r.created_at ? fmtTs(r.created_at) : '',
    ]);
    const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
    // Column widths
    ws['!cols'] = [30,18,35,10,8,14,20,22,28,16,14,22,20,20,20,25,25,10,40,20].map(w => ({ wch: w }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'GPC Processos');
    XLSX.writeFile(wb, `gpc_processos_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const stats = useMemo(() => ({
    total: rows.length,
    comLink: rows.filter(r => r.link_processo).length,
    semResponsavel: rows.filter(r => !r.responsavel).length,
    duplicados: Object.values(duplicateMap).filter(v => v.length > 1).length,
    regulares: rows.filter(r => r.situacao === 'REGULAR').length,
    irregulares: rows.filter(r => r.situacao === 'IRREGULAR').length,
    parcialmente: rows.filter(r => r.situacao === 'PARCIALMENTE_REGULAR').length,
    semSituacao: rows.filter(r => !r.situacao).length,
  }), [rows, duplicateMap]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Grupo de Prestação de Contas</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            {mainTab === 'registros'
              ? `${filtered.length.toLocaleString('pt-BR')} de ${rows.length.toLocaleString('pt-BR')} registros`
              : 'Produtividade mensal por técnico'}
          </p>
        </div>
        {mainTab === 'registros' && (
          <div className="flex items-center gap-2.5">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
              onClick={exportXLSX}
            >
              <Download size={14} />Exportar XLSX
            </button>
            <button className={BTN_PRI} onClick={() => setModal({})}>
              <Plus size={16} />Novo Registro
            </button>
          </div>
        )}
      </div>

      {/* KPI cards */}
      {mainTab === 'registros' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total',           value: stats.total,          color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-200',   icon: <FileText size={16} className="text-slate-400" /> },
              { label: 'Com Link',        value: stats.comLink,        color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100',     icon: <ExternalLink size={16} className="text-blue-400" /> },
              { label: 'Sem Responsável', value: stats.semResponsavel, color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100',   icon: <AlertTriangle size={16} className="text-amber-400" /> },
              { label: 'Nº Duplicados',   value: stats.duplicados,     color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100', icon: <Info size={16} className="text-purple-400" /> },
            ].map(k => (
              <div key={k.label} className={`${k.bg} rounded-xl border px-4 py-3 flex items-center gap-3`}>
                {k.icon}
                <div>
                  <div className={`text-xl font-bold ${k.color}`}>{k.value.toLocaleString('pt-BR')}</div>
                  <div className="text-xs text-slate-500">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Situação breakdown */}
          {(stats.regulares + stats.irregulares + stats.parcialmente) > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <ShieldCheck size={14} className="text-slate-500" />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Situação dos Processos Avaliados</span>
                <span className="ml-auto text-xs text-slate-400">
                  {stats.semSituacao > 0 && `${stats.semSituacao} sem avaliação · `}
                  {(stats.regulares + stats.irregulares + stats.parcialmente)} avaliados
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <ShieldCheck size={18} className="text-green-600 flex-shrink-0" />
                  <div>
                    <div className="text-lg font-bold text-green-700">{stats.regulares}</div>
                    <div className="text-xs text-green-600 font-semibold">Regulares</div>
                    <div className="text-xs text-slate-400">Sem pendências</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <ShieldOff size={18} className="text-amber-600 flex-shrink-0" />
                  <div>
                    <div className="text-lg font-bold text-amber-700">{stats.parcialmente}</div>
                    <div className="text-xs text-amber-600 font-semibold">Parcialmente Regulares</div>
                    <div className="text-xs text-slate-400">Pendências parciais</div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <ShieldAlert size={18} className="text-red-600 flex-shrink-0" />
                  <div>
                    <div className="text-lg font-bold text-red-700">{stats.irregulares}</div>
                    <div className="text-xs text-red-600 font-semibold">Irregulares</div>
                    <div className="text-xs text-slate-400">Pendências totais</div>
                  </div>
                </div>
              </div>
              {/* Visual bar */}
              {(() => {
                const total = stats.regulares + stats.irregulares + stats.parcialmente;
                return total > 0 ? (
                  <div className="mt-2.5 flex h-2 rounded-full overflow-hidden gap-px">
                    {stats.regulares > 0 && <div style={{ width: `${(stats.regulares / total) * 100}%` }} className="bg-green-400" title={`${stats.regulares} regulares`} />}
                    {stats.parcialmente > 0 && <div style={{ width: `${(stats.parcialmente / total) * 100}%` }} className="bg-amber-400" title={`${stats.parcialmente} parcialmente regulares`} />}
                    {stats.irregulares > 0 && <div style={{ width: `${(stats.irregulares / total) * 100}%` }} className="bg-red-400" title={`${stats.irregulares} irregulares`} />}
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      )}

      {/* Main tabs */}
      <div className="flex border-b border-slate-200 gap-1">
        <button
          onClick={() => setMainTab('registros')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${mainTab === 'registros' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={15} />Processos
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${mainTab === 'registros' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{rows.length}</span>
        </button>
        <button
          onClick={() => setMainTab('parcelamentos')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${mainTab === 'parcelamentos' ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <DollarSign size={15} />Parcelamentos
          <span className={`px-1.5 py-0.5 rounded-full text-xs ${mainTab === 'parcelamentos' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{rows.filter(r => !!r.is_parcelamento).length}</span>
        </button>
        <button
          onClick={() => setMainTab('produtividade')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${mainTab === 'produtividade' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <BarChart2 size={15} />Produtividade
        </button>
      </div>

      {mainTab === 'produtividade' && <ProdutividadePage />}

      {(mainTab === 'registros' || mainTab === 'parcelamentos') && (
        <>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={28} className="animate-spin text-blue-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <SortTh label="Processo"    col="processo"    sort={sort} onSort={toggleSort} />
                      <SortTh label="Convênio"    col="convenio"    sort={sort} onSort={toggleSort} />
                      <SortTh label="Entidade"    col="entidade"    sort={sort} onSort={toggleSort} />
                      <SortTh label="Exer."       col="exercicio"   sort={sort} onSort={toggleSort} cls="w-16" />
                      <SortTh label="DRS"         col="drs"         sort={sort} onSort={toggleSort} cls="w-14" />
                      <SortTh label="Data"        col="data"        sort={sort} onSort={toggleSort} cls="w-24" />
                      <SortTh label="Responsável" col="responsavel" sort={sort} onSort={toggleSort} />
                      <SortTh label="Posição"     col="posicao"     sort={sort} onSort={toggleSort} />
                      <SortTh label="Movimento"   col="movimento"   sort={sort} onSort={toggleSort} />
                      <SortTh label="Remessa"     col="remessa"     sort={sort} onSort={toggleSort} cls="w-24" />
                      <SortTh label="Situação"    col="situacao"    sort={sort} onSort={toggleSort} />
                      <FThX />
                    </tr>
                    <tr>
                      <FTh v={filters.processo}    onChange={v => setF('processo', v)} />
                      <FTh v={filters.convenio}    onChange={v => setF('convenio', v)} />
                      <FTh v={filters.entidade}    onChange={v => setF('entidade', v)} />
                      <FTh v={filters.exercicio}   onChange={v => setF('exercicio', v)} ph="ano" />
                      <FTh v={filters.drs}         onChange={v => setF('drs', v)} ph="nº" />
                      <FThX />
                      <FTh v={filters.responsavel} onChange={v => setF('responsavel', v)} />
                      <FThSel
                        v={filters.posicao_id}
                        onChange={v => setF('posicao_id', v)}
                        opts={posicoes.map(p => ({ value: String(p.codigo), label: p.posicao ?? '' }))}
                      />
                      <FTh v={filters.movimento} onChange={v => setF('movimento', v)} />
                      <FThSel
                        v={filters.remessa}
                        onChange={v => setF('remessa', v)}
                        opts={[{ value: 'ACIMA', label: 'Acima' }, { value: 'ABAIXO', label: 'Abaixo' }]}
                      />
                      <FThSel
                        v={filters.situacao}
                        onChange={v => setF('situacao', v)}
                        opts={[
                          { value: 'REGULAR', label: 'Regular' },
                          { value: 'PARCIALMENTE_REGULAR', label: 'Parcialmente Regular' },
                          { value: 'IRREGULAR', label: 'Irregular' },
                        ]}
                      />
                      <FThX />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map((r, rowIdx) => {
                      const dupes = duplicateMap[sv(r.processo)] ?? [];
                      const isDupe = dupes.length > 1;
                      const prevPositions = getPrevPositions(r);

                      return (
                        <tr
                          key={r.codigo}
                          className={`transition-colors cursor-pointer group ${
                            rowIdx % 2 === 0 ? 'bg-white hover:bg-blue-50/60' : 'bg-slate-50/70 hover:bg-blue-50/60'
                          } ${r.situacao === 'IRREGULAR' ? 'border-l-2 border-l-red-400' : r.situacao === 'PARCIALMENTE_REGULAR' ? 'border-l-2 border-l-amber-400' : r.situacao === 'REGULAR' ? 'border-l-2 border-l-green-400' : ''}`}
                          onClick={() => setViewRow(r)}
                        >
                          {/* Processo - full number, no truncation */}
                          <td className="px-3 py-3 min-w-[160px]">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-blue-700 text-xs font-mono">
                                {r.processo ?? '-'}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {r.link_processo && (
                                  <a
                                    href={r.link_processo}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-400 hover:text-blue-600 transition-colors"
                                    title="Abrir link"
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <ExternalLink size={11} />
                                  </a>
                                )}
                                {isDupe && (
                                  <span className="text-xs text-purple-500 flex items-center gap-0.5" title={`${dupes.length} registros com este número`}>
                                    <Info size={10} />{dupes.length}
                                  </span>
                                )}
                                {r.is_parcelamento && (
                                  <span className="inline-flex items-center gap-0.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1 py-0.5" title="Parcelamento">
                                    <DollarSign size={9} />Parcela
                                  </span>
                                )}
                              </div>
                              {prevPositions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {prevPositions.map((p, i) => (
                                    <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">
                                      <Clock size={9} />Ant: {p}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-slate-600 whitespace-nowrap text-xs">{r.convenio ?? '-'}</td>
                          <td className="px-3 py-3 text-slate-700 max-w-[180px]">
                            <span className="block truncate text-xs" title={r.entidade ?? ''}>{r.entidade ?? '-'}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-slate-500 text-xs font-medium">{r.exercicio ?? '-'}</td>
                          <td className="px-3 py-3 text-center text-slate-500 text-xs font-medium">{r.drs ?? '-'}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-slate-500 text-xs">{fmtDate(r.data)}</td>
                          <td className="px-3 py-3">
                            {r.responsavel
                              ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {r.responsavel.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-xs font-medium text-slate-700 truncate max-w-[90px]" title={r.responsavel}>
                                    {r.responsavel}
                                  </span>
                                </div>
                              ) : <span className="text-slate-300 text-xs">-</span>}
                          </td>
                          <td className="px-3 py-3">
                            <PosicaoBadge id={r.posicao_id} label={r.posicao ?? null} />
                          </td>
                          <td className="px-3 py-3 text-slate-500 text-xs max-w-[110px]">
                            <span className="block truncate" title={r.movimento ?? ''}>{r.movimento ?? '-'}</span>
                          </td>
                          <td className="px-3 py-3 text-xs text-center">
                            {r.remessa === 'ACIMA' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Acima</span>}
                            {r.remessa === 'ABAIXO' && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">Abaixo</span>}
                            {!r.remessa && <span className="text-slate-300">-</span>}
                          </td>
                          <td className="px-3 py-3">
                            <SituacaoBadge situacao={r.situacao} compact />
                            {(r.situacao === 'IRREGULAR' || r.situacao === 'PARCIALMENTE_REGULAR') && (r.valor_a_devolver ?? 0) > 0 && (
                              <div className="mt-0.5 text-xs text-red-600 font-medium">
                                {r.valor_devolvido != null && r.valor_devolvido >= (r.valor_a_devolver ?? 0)
                                  ? <span className="text-green-600">✓ Quitado</span>
                                  : <span>Pend: {fmt((r.valor_a_devolver ?? 0) - (r.valor_devolvido ?? 0))}</span>}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
                              <button
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Ver detalhes"
                                onClick={() => setViewRow(r)}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Editar"
                                onClick={() => setModal({ data: r })}
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors"
                                title="Excluir"
                                onClick={() => handleDelete(r.codigo)}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!paged.length && (
                      <tr>
                        <td colSpan={12} className="py-20 text-center">
                          <Search size={32} className="mx-auto mb-3 text-slate-200" />
                          <p className="text-slate-400 text-sm">Nenhum registro encontrado</p>
                          <p className="text-slate-300 text-xs mt-1">Tente ajustar os filtros</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>
                Página <strong className="text-slate-700">{page}</strong> de <strong className="text-slate-700">{totalPages}</strong>
                {' '}&mdash; {filtered.length.toLocaleString('pt-BR')} registros
              </span>
              <div className="flex gap-2">
                <button className={BTN_SEC} disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={16} />Anterior
                </button>
                <button className={BTN_SEC} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                  Próxima<ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal - click row to open */}
      {viewRow !== null && (
        <ViewModal
          row={viewRow}
          posicoes={posicoes}
          prevPositions={getPrevPositions(viewRow)}
          onEdit={() => { setModal({ data: viewRow }); setViewRow(null); }}
          onClose={() => setViewRow(null)}
          onRecordUpdated={async () => {
            await load();
            const updated = await GpcService.getRecebidoByCode(viewRow.codigo);
            if (updated) setViewRow(updated);
          }}
        />
      )}

      {/* Edit / Create Modal */}
      {modal !== null && (
        <RegistroModal
          initial={modal.data}
          posicoes={posicoes}
          onSave={handleSave}
          onClose={() => setModal(null)}
          isAdmin={isAdmin}
          onRecordUpdated={load}
        />
      )}

      {/* Delete password confirmation modal */}
      {deleteConfirm !== null && (
        <DeletePasswordModal
          processo={deleteConfirm.processo}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={confirmDeleteWithPassword}
        />
      )}
    </div>
  );
};
