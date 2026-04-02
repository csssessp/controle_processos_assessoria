import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, Check,
  Loader2, AlertCircle, FileText, Calendar, Activity,
  ClipboardList, GitBranch, Download, ArrowUp, ArrowDown,
  ArrowUpDown, ExternalLink, Link as LinkIcon, TrendingUp,
  User, Search, AlertTriangle, Clock, DollarSign, Info,
  BarChart2, Save, Eye,
} from 'lucide-react';
import { GpcService } from '../services/gpcService';
import {
  GpcProcessoFull, GpcExercicio, GpcHistorico, GpcObjeto,
  GpcParcelamento, GpcTa, GpcPosicao, GpcRecebido, GpcProdutividade
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
  CRIACAO:     { color: 'bg-blue-500',    label: 'Atribuição inicial' },
  RESPONSAVEL: { color: 'bg-emerald-500', label: 'Mudança de responsável' },
  POSICAO:     { color: 'bg-amber-500',   label: 'Mudança de posição' },
  MOVIMENTO:   { color: 'bg-purple-500',  label: 'Saída de análise' },
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

const ViewModal = ({ row, posicoes, onEdit, onClose, prevPositions }: {
  row: GpcRecebido;
  posicoes: GpcPosicao[];
  onEdit: () => void;
  onClose: () => void;
  prevPositions: string[];
}) => {
  const [tab, setTab] = useState<'dados' | 'prod'>('dados');

  return (
    <Modal
      title={row.processo ?? `#${row.codigo}`}
      subtitle={row.entidade ?? undefined}
      onClose={onClose}
      size="lg"
    >
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-slate-100 mb-5 -mt-2">
        <button
          onClick={() => setTab('dados')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${tab === 'dados' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <FileText size={12} />Detalhes
        </button>
        <button
          onClick={() => setTab('prod')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${tab === 'prod' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          <TrendingUp size={12} />Produtividade
        </button>
        <div className="ml-auto flex items-center pb-1">
          <button className={BTN_PRI + ' text-xs px-3 py-1.5'} onClick={onEdit}>
            <Edit size={13} />Editar
          </button>
        </div>
      </div>

      {tab === 'dados' && (
        <div className="space-y-4">
          {/* Process number full highlight */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="text-xs text-blue-500 font-semibold uppercase tracking-wide mb-1">
              Número do Processo
            </div>
            <div className="text-lg font-bold text-blue-800 font-mono break-all">
              {row.processo ?? '-'}
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Convênio" value={row.convenio} />
            <InfoCard label="Exercício" value={row.exercicio} />
            <InfoCard label="DRS" value={row.drs != null ? String(row.drs) : null} />
            <InfoCard label="Data Recebimento" value={fmtDate(row.data)} />
            <InfoCard label="Responsável" value={row.responsavel} icon={<User size={12} />} />
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-1.5">
                Posição Atual
              </div>
              <PosicaoBadge id={row.posicao_id} label={row.posicao ?? null} />
            </div>
            <InfoCard label="Movimento" value={row.movimento} />
            <InfoCard label="Entidade" value={row.entidade} />
          </div>

          {/* Link */}
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

          {/* Duplicate positions */}
          {prevPositions.length > 0 && (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-3">
              <div className="text-xs text-purple-600 font-semibold uppercase tracking-wide mb-2 flex items-center gap-1">
                <Info size={11} />Processo duplicado — outras posições registradas
              </div>
              <div className="flex flex-wrap gap-1.5">
                {prevPositions.map((p, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 text-xs bg-white border border-purple-200 text-purple-700 rounded-full px-2 py-0.5"
                  >
                    <Clock size={10} />{p}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'prod' && <ProdPanel registroId={row.codigo} />}
    </Modal>
  );
};

// ---- RegistroModal (create / edit) ----

interface RegistroModalProps {
  initial?: GpcRecebido;
  posicoes: GpcPosicao[];
  onSave: (form: Partial<GpcRecebido>, prev?: GpcRecebido) => Promise<GpcRecebido>;
  onClose: () => void;
}

const MOVIMENTOS = [
  'RECEBIDO',
  'EM ANÁLISE',
  'DILIGÊNCIA',
  'AGUARDANDO COMPLEMENTAÇÃO',
  'ENCAMINHADO À CHEFIA',
  'ENCAMINHADO AO TCE-SP',
  'ENCAMINHADO À PGE',
  'ENCAMINHADO À CGE',
  'ARQUIVADO',
  'CONCLUÍDO',
  'DEVOLVIDO AO CONVENENTE',
  'PARECER EMITIDO',
];

const RegistroModal: React.FC<RegistroModalProps> = ({ initial, posicoes, onSave, onClose }) => {
  const [liveRecord, setLiveRecord] = useState<GpcRecebido | undefined>(initial);
  const [form, setForm] = useState<Partial<GpcRecebido>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [savedOk, setSavedOk] = useState(false);
  const [tab, setTab] = useState<'dados' | 'exercicios' | 'historico' | 'objetos' | 'parcelamentos' | 'tas'>('dados');
  const [full, setFull] = useState<GpcProcessoFull | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [subModal, setSubModal] = useState<null | { type: string; data?: any }>(null);
  const [gpcUsers, setGpcUsers] = useState<{ id: string; name: string }[]>([]);

  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    GpcService.getGpcUsers().then(setGpcUsers);
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
        // First save — stay open in edit mode so user can add sub-items
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

  const isEditing = !!(liveRecord?.codigo);

  type TabId = 'dados' | 'exercicios' | 'historico' | 'objetos' | 'parcelamentos' | 'tas';
  const tabItems: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'dados',         label: 'Dados Gerais',  icon: <FileText size={13} /> },
    { id: 'exercicios',    label: 'Exercícios',    icon: <Calendar size={13} />,      count: full?.exercicios?.length },
    { id: 'historico',     label: 'Histórico',     icon: <Activity size={13} />,      count: full?.historicos?.length },
    { id: 'objetos',       label: 'Objetos',       icon: <ClipboardList size={13} />, count: full?.objetos?.length },
    { id: 'parcelamentos', label: 'Parcelamentos', icon: <DollarSign size={13} />,    count: full?.parcelamentos?.length },
    { id: 'tas',           label: 'TAs',           icon: <GitBranch size={13} />,     count: full?.tas?.length },
  ];

  return (
    <Modal
      title={isEditing ? 'Editar Registro' : 'Novo Registro'}
      subtitle={isEditing ? `#${liveRecord!.codigo} — ${liveRecord!.processo ?? ''}` : 'Preencha os dados do processo'}
      onClose={onClose}
      size="xl"
    >
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 mb-5 overflow-x-auto -mx-1 px-1">
        {tabItems.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as TabId)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700 bg-blue-50/60' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            {t.icon}{t.label}
            {t.count != null && (
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === t.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB: Dados Gerais */}
      {tab === 'dados' && (
        <form onSubmit={handleSubmit}>
          {err && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
              <AlertCircle size={16} className="flex-shrink-0" />{err}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <div>
              <label className={LABEL}>Exercício (ano)</label>
              <input className={INPUT} value={form.exercicio ?? ''} onChange={e => set('exercicio', e.target.value)} placeholder="ex: 2024" />
            </div>
            <div>
              <label className={LABEL}>DRS</label>
              <select className={INPUT} value={form.drs ?? ''} onChange={e => set('drs', e.target.value ? Number(e.target.value) : null)}>
                <option value="">— selecione —</option>
                {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>DRS {n.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Data de Recebimento</label>
              <input className={INPUT} type="date" value={form.data ?? ''} onChange={e => set('data', e.target.value || null)} />
            </div>
            <div>
              <label className={LABEL}>Responsável (Técnico)</label>
              <select className={INPUT} value={form.responsavel ?? ''} onChange={e => set('responsavel', e.target.value || null)}>
                <option value="">— selecione —</option>
                {gpcUsers.map(u => (
                  <option key={u.id} value={u.name}>{u.name}</option>
                ))}
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
                  <Clock size={11} />Anterior: <strong>{initial.posicao}</strong>
                </p>
              )}
            </div>
            <div>
              <label className={LABEL}>Movimento</label>
              <select className={INPUT} value={form.movimento ?? ''} onChange={e => set('movimento', e.target.value || null)}>
                <option value="">— selecione —</option>
                {MOVIMENTOS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
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
            <div className="sm:col-span-2 flex items-center gap-3 pt-1">
              <input
                id="is_parcelamento"
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer"
                checked={!!form.is_parcelamento}
                onChange={e => set('is_parcelamento', e.target.checked || null)}
              />
              <label htmlFor="is_parcelamento" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                Este processo é de <strong>Parcelamento</strong>
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>
                <span className="flex items-center gap-1"><LinkIcon size={11} />Link do Processo (URL)</span>
              </label>
              <div className="relative">
                <input
                  className={INPUT + ' pr-10'}
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
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
            <button type="submit" className={BTN_PRI} disabled={saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isEditing ? 'Atualizar' : 'Cadastrar'}
            </button>
          </div>
          {savedOk && (
            <div className="mt-3 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              <Check size={16} className="flex-shrink-0" />
              Registro cadastrado! Agora você pode adicionar Exercícios, Histórico e outros dados nas abas acima.
            </div>
          )}
        </form>
      )}

      {/* Sub-tabs */}
      {tab !== 'dados' && !isEditing && (
        <div className="py-14 text-center space-y-3">
          <Save size={36} className="mx-auto text-slate-300" />
          <p className="text-slate-600 text-sm font-semibold">Salve os Dados Gerais primeiro</p>
          <p className="text-slate-400 text-xs">Após cadastrar o registro você poderá adicionar itens nesta aba.</p>
          <button type="button" className={BTN_SEC + ' mx-auto mt-2'} onClick={() => setTab('dados')}>
            Voltar para Dados Gerais
          </button>
        </div>
      )}

      {tab !== 'dados' && isEditing && (
        <div>
          {loadingFull && (
            <div className="flex items-center gap-2 py-8 justify-center text-slate-400">
              <Loader2 size={18} className="animate-spin" />Carregando dados do processo...
            </div>
          )}
          {!loadingFull && !full && (
            <div className="py-8 text-center text-slate-400 text-sm">Processo relacionado não encontrado.</div>
          )}
          {!loadingFull && full && (
            <>
              {tab === 'exercicios' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className={BTN_PRI + ' text-xs px-3 py-1.5'} onClick={() => setSubModal({ type: 'exercicio' })}>
                      <Plus size={13} />Novo Exercício
                    </button>
                  </div>
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
                </div>
              )}
              {tab === 'historico' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className={BTN_PRI + ' text-xs px-3 py-1.5'} onClick={() => setSubModal({ type: 'historico' })}>
                      <Plus size={13} />Novo Movimento
                    </button>
                  </div>
                  <InlineTable
                    cols={[
                      { label: 'Data',        render: (r: GpcHistorico) => fmtDate(r.data) },
                      { label: 'Movimento',   render: (r: GpcHistorico) => <span className="max-w-[180px] block truncate" title={r.movimento ?? ''}>{r.movimento ?? '-'}</span> },
                      { label: 'Ação',        render: (r: GpcHistorico) => r.acao ?? '-' },
                      { label: 'Setor',       render: (r: GpcHistorico) => r.setor ?? '-' },
                      { label: 'Responsável', render: (r: GpcHistorico) => r.responsavel ?? '-' },
                      { label: 'Posição',     render: (r: GpcHistorico) => r.posicao ? <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">{r.posicao}</span> : '-' },
                    ]}
                    rows={full.historicos ?? []}
                    onEdit={r => setSubModal({ type: 'historico', data: r })}
                    onDelete={r => confirmDeleteSub(() => GpcService.deleteHistorico(r.codigo))}
                    emptyMsg="Nenhum movimento cadastrado"
                  />
                </div>
              )}
              {tab === 'objetos' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className={BTN_PRI + ' text-xs px-3 py-1.5'} onClick={() => setSubModal({ type: 'objeto' })}>
                      <Plus size={13} />Novo Objeto
                    </button>
                  </div>
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
                </div>
              )}
              {tab === 'parcelamentos' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className={BTN_PRI + ' text-xs px-3 py-1.5'} onClick={() => setSubModal({ type: 'parcelamento' })}>
                      <Plus size={13} />Novo Parcelamento
                    </button>
                  </div>
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
                </div>
              )}
              {tab === 'tas' && (
                <div className="space-y-3">
                  <div className="flex justify-end">
                    <button className={BTN_PRI + ' text-xs px-3 py-1.5'} onClick={() => setSubModal({ type: 'ta' })}>
                      <Plus size={13} />Novo Termo Aditivo
                    </button>
                  </div>
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
                </div>
              )}
            </>
          )}
        </div>
      )}

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
          {subModal.type === 'historico' && (
            <Modal title={subModal.data ? 'Editar Movimento' : 'Novo Movimento'} onClose={() => setSubModal(null)} size="md">
              <HistoricoForm
                exercicioId={subModal.data?.exercicio_id ?? full.exercicios?.[0]?.codigo ?? 0}
                posicoes={posicoes}
                gpcUsers={gpcUsers}
                initial={subModal.data}
                onSave={async h => { await GpcService.saveHistorico(h); await refreshFull(); setSubModal(null); }}
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
        <div><label className={LABEL}>Exerc. Anterior (R$)</label><input className={INPUT} type="number" step="0.01" value={f.exercicio_anterior ?? ''} onChange={e => set('exercicio_anterior', n(e.target.value))} /></div>
        <div><label className={LABEL}>Repasse (R$)</label><input className={INPUT} type="number" step="0.01" value={f.repasse ?? ''} onChange={e => set('repasse', n(e.target.value))} /></div>
        <div><label className={LABEL}>Aplicação (R$)</label><input className={INPUT} type="number" step="0.01" value={f.aplicacao ?? ''} onChange={e => set('aplicacao', n(e.target.value))} /></div>
        <div><label className={LABEL}>Gastos (R$)</label><input className={INPUT} type="number" step="0.01" value={f.gastos ?? ''} onChange={e => set('gastos', n(e.target.value))} /></div>
        <div><label className={LABEL}>Devolvido (R$)</label><input className={INPUT} type="number" step="0.01" value={f.devolvido ?? ''} onChange={e => set('devolvido', n(e.target.value))} /></div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRI} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar</button>
      </div>
    </form>
  );
};

const HistoricoForm = ({ exercicioId, posicoes, gpcUsers, initial, onSave, onClose }: {
  exercicioId: number; posicoes: GpcPosicao[]; gpcUsers: { id: string; name: string }[];
  initial?: Partial<GpcHistorico>;
  onSave: (h: Partial<GpcHistorico>) => Promise<void>; onClose: () => void;
}) => {
  const [f, setF] = useState<Partial<GpcHistorico>>(initial ?? { exercicio_id: exercicioId });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcHistorico, v: any) => setF(p => ({ ...p, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave({ ...f, exercicio_id: exercicioId }); }
    catch (ex: any) { setErr(ex.message); setSaving(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      {err && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className={LABEL}>Movimento *</label><input className={INPUT} value={f.movimento ?? ''} onChange={e => set('movimento', e.target.value)} required /></div>
        <div><label className={LABEL}>Data</label><input className={INPUT} type="date" value={f.data ?? ''} onChange={e => set('data', e.target.value || null)} /></div>
        <div><label className={LABEL}>Setor</label><input className={INPUT} value={f.setor ?? ''} onChange={e => set('setor', e.target.value)} /></div>
        <div>
          <label className={LABEL}>Responsável</label>
          <select className={INPUT} value={f.responsavel ?? ''} onChange={e => set('responsavel', e.target.value || null)}>
            <option value="">— selecione —</option>
            {gpcUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Posição</label>
          <select className={INPUT} value={f.posicao_id ?? ''} onChange={e => set('posicao_id', e.target.value ? Number(e.target.value) : null)}>
            <option value="">-</option>
            {posicoes.map(p => <option key={p.codigo} value={p.codigo}>{p.posicao}</option>)}
          </select>
        </div>
        <div><label className={LABEL}>Ação</label><input className={INPUT} value={f.acao ?? ''} onChange={e => set('acao', e.target.value)} /></div>
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
        <input className={INPUT} type="number" step="0.01" value={f.custo ?? ''} onChange={e => setF(p => ({ ...p, custo: e.target.value ? Number(e.target.value) : null }))} />
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
        <div><label className={LABEL}>Valor Parcelado (R$)</label><input className={INPUT} type="number" step="0.01" value={f.valor_parcelado ?? ''} onChange={e => set('valor_parcelado', n(e.target.value))} /></div>
        <div><label className={LABEL}>Valor Corrigido (R$)</label><input className={INPUT} type="number" step="0.01" value={f.valor_corrigido ?? ''} onChange={e => set('valor_corrigido', n(e.target.value))} /></div>
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
        <div><label className={LABEL}>Custo (R$)</label><input className={INPUT} type="number" step="0.01" value={f.custo ?? ''} onChange={e => setF(p => ({ ...p, custo: e.target.value ? Number(e.target.value) : null }))} /></div>
      </div>
      <div className="flex justify-end gap-3">
        <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>
        <button type="submit" className={BTN_PRI} disabled={saving}>{saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}Salvar</button>
      </div>
    </form>
  );
};

// ---- Productivity summary page ----

const ProdutividadePage = () => {
  const [resumo, setResumo] = useState<{ responsavel: string; mes: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesFiltro, setMesFiltro] = useState(() => new Date().toISOString().slice(0, 7));

  useEffect(() => {
    GpcService.getProdutividadeResumo().then(d => { setResumo(d); setLoading(false); });
  }, []);

  const allMeses = useMemo(() => [...new Set(resumo.map(r => r.mes))].sort().reverse(), [resumo]);
  const filtered = useMemo(() => resumo.filter(r => r.mes === mesFiltro).sort((a, b) => b.count - a.count), [resumo, mesFiltro]);
  const total = useMemo(() => filtered.reduce((s, r) => s + r.count, 0), [filtered]);

  if (loading) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-blue-400" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4">
        <label className="text-sm font-semibold text-slate-600">Mês:</label>
        <select
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={mesFiltro}
          onChange={e => setMesFiltro(e.target.value)}
        >
          {allMeses.map(m => <option key={m} value={m}>{fmtMes(m)}</option>)}
        </select>
        <span className="text-sm text-slate-400 ml-auto">{total} evento{total !== 1 ? 's' : ''} em {fmtMes(mesFiltro)}</span>
      </div>
      {!filtered.length ? (
        <div className="bg-white rounded-xl border border-slate-200 py-16 text-center">
          <TrendingUp size={40} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400 text-sm">Nenhum dado para {fmtMes(mesFiltro)}.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mês</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Eventos</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Participação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => {
                const pct = total > 0 ? Math.round((r.count / total) * 100) : 0;
                return (
                  <tr key={`${r.responsavel}__${r.mes}`} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                          {r.responsavel.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{r.responsavel}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{fmtMes(r.mes)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">{r.count}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2">
                          <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-full h-2 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-9 text-right font-medium">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
              <tr>
                <td className="px-4 py-3 text-sm font-bold text-slate-700" colSpan={2}>Total</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2.5 py-1 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">{total}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-blue-500 rounded-full h-2" />
                    <span className="text-xs text-slate-500 w-9 text-right font-medium">100%</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

// ---- Main Page ----

export const GpcProcessos = () => {
  const [mainTab, setMainTab] = useState<'registros' | 'parcelamentos' | 'produtividade'>('registros');
  const [rows, setRows] = useState<GpcRecebido[]>([]);
  const [posicoes, setPosicoes] = useState<GpcPosicao[]>([]);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState<SortState | null>(null);
  const [filters, setFilters] = useState({ processo: '', convenio: '', entidade: '', exercicio: '', drs: '', responsavel: '', posicao_id: '', movimento: '', remessa: '' });
  const [page, setPage] = useState(1);
  const [viewRow, setViewRow] = useState<GpcRecebido | null>(null);
  const [modal, setModal] = useState<null | { data?: GpcRecebido }>(null);
  const PAGE = 25;

  const load = useCallback(async () => {
    setLoading(true);
    const r = await GpcService.getRecebidos('', 1, 9999);
    setRows(r.data);
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
      (!f.remessa     || sv(r.remessa) === sv(f.remessa))
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
    if (!prev?.codigo) {
      if (form.responsavel) {
        await GpcService.saveProdutividade({ registro_id: saved.codigo, responsavel: form.responsavel, posicao_id: form.posicao_id ?? null, posicao: posLabel, evento: 'CRIACAO', data_evento: now });
      }
    } else {
      if (form.responsavel !== prev.responsavel && form.responsavel) {
        await GpcService.saveProdutividade({ registro_id: saved.codigo, responsavel: form.responsavel, posicao_id: form.posicao_id ?? null, posicao: posLabel, evento: 'RESPONSAVEL', data_evento: now });
      }
      if (form.posicao_id !== prev.posicao_id && form.posicao_id) {
        // Calcula tempo na posição anterior
        const posLabelPrev = posicoes.find(p => p.codigo === prev.posicao_id)?.posicao ?? String(prev.posicao_id ?? '');
        let posObsText: string;
        const prevEvents = await GpcService.getProdutividade(saved.codigo);
        const lastPosEvent = [...prevEvents].reverse().find(e => e.evento === 'POSICAO' || e.evento === 'CRIACAO');
        const refDate = lastPosEvent?.data_evento ?? prev.data ?? null;
        if (refDate) {
          const dtStart = new Date(refDate);
          const dtHoje = new Date();
          const dias = Math.round((dtHoje.getTime() - dtStart.getTime()) / (1000 * 60 * 60 * 24));
          posObsText = `${posLabelPrev || 'posição anterior'} → ${posLabel || 'nova posição'}. Tempo na posição: ${dias} dia${dias !== 1 ? 's' : ''}`;
        } else {
          posObsText = `${posLabelPrev || 'posição anterior'} → ${posLabel || 'nova posição'}`;
        }
        await GpcService.saveProdutividade({ registro_id: saved.codigo, responsavel: form.responsavel ?? null, posicao_id: form.posicao_id, posicao: posLabel, evento: 'POSICAO', data_evento: now, obs: posObsText });
      }
      // Saída de EM ANÁLISE → calcula tempo desde data de recebimento
      if (prev.movimento === 'EM ANÁLISE' && form.movimento && form.movimento !== 'EM ANÁLISE') {
        const dataReceb = form.data ?? prev.data;
        let obsText: string;
        if (dataReceb) {
          const dtReceb = new Date(dataReceb);
          const dtHoje = new Date();
          const dias = Math.round((dtHoje.getTime() - dtReceb.getTime()) / (1000 * 60 * 60 * 24));
          obsText = `EM ANÁLISE → ${form.movimento}. Tempo em análise: ${dias} dia${dias !== 1 ? 's' : ''} (recebido em ${fmtDate(dataReceb)})`;
        } else {
          obsText = `EM ANÁLISE → ${form.movimento}`;
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

  const handleDelete = async (codigo: number) => {
    if (!confirm('Confirma a exclusão?')) return;
    try { await GpcService.deleteRecebido(codigo); setViewRow(null); await load(); }
    catch (ex: any) { alert(ex.message); }
  };

  const exportCSV = () => {
    const posMap = Object.fromEntries(posicoes.map(p => [p.codigo, p.posicao]));
    const cols = ['Processo', 'Convenio', 'Entidade', 'Exercicio', 'DRS', 'Data', 'Responsavel', 'Posicao', 'Movimento', 'Link'];
    const body = filtered.map(r =>
      [r.processo, r.convenio, r.entidade, r.exercicio, r.drs, fmtDate(r.data), r.responsavel,
        r.posicao_id ? (posMap[r.posicao_id] ?? r.posicao_id) : '', r.movimento, r.link_processo ?? '']
        .map(v => { const s = String(v ?? ''); return s.includes(';') ? `"${s}"` : s; }).join(';')
    );
    const csv = '\uFEFF' + [cols.join(';'), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'gpc_processos.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => ({
    total: rows.length,
    comLink: rows.filter(r => r.link_processo).length,
    semResponsavel: rows.filter(r => !r.responsavel).length,
    duplicados: Object.values(duplicateMap).filter(v => v.length > 1).length,
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
              onClick={exportCSV}
            >
              <Download size={14} />Exportar CSV
            </button>
            <button className={BTN_PRI} onClick={() => setModal({})}>
              <Plus size={16} />Novo Registro
            </button>
          </div>
        )}
      </div>

      {/* KPI cards */}
      {mainTab === 'registros' && (
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
                      <FThX />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paged.map(r => {
                      const dupes = duplicateMap[sv(r.processo)] ?? [];
                      const isDupe = dupes.length > 1;
                      const prevPositions = getPrevPositions(r);

                      return (
                        <tr
                          key={r.codigo}
                          className="hover:bg-blue-50/40 transition-colors cursor-pointer"
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
                        <td colSpan={11} className="py-20 text-center">
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
        />
      )}

      {/* Edit / Create Modal */}
      {modal !== null && (
        <RegistroModal
          initial={modal.data}
          posicoes={posicoes}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
};
