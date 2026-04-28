import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import * as XLSX from 'xlsx';

import {

  Plus, Edit, Trash2, ChevronLeft, ChevronRight, X, Check,

  Loader2, AlertCircle, FileText, Calendar, Activity,

  ClipboardList, GitBranch, Download, ArrowUp, ArrowDown,

  ArrowUpDown, ExternalLink, Link as LinkIcon, TrendingUp, TrendingDown,

  User, Search, AlertTriangle, Clock, DollarSign, Info,

  BarChart2, Save, Eye, Lock, BookOpen, Gauge, Timer, PenLine,

  ShieldCheck, ShieldAlert, ShieldOff, Award, KeyRound, Unlock, Star,

} from 'lucide-react';

import { useApp } from '../context/AppContext';

import { UserRole } from '../types';

import { GpcService } from '../services/gpcService';

import { DbService } from '../services/dbService';

import {

  GpcProcessoFull, GpcExercicio, GpcHistorico, GpcObjeto,

  GpcParcelamento, GpcTa, GpcPosicao, GpcRecebido, GpcProdutividade,

  GpcFluxoTecnico, ParcAutorizacaoEntry

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



const INPUT = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300';

const LABEL = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';

const BTN_PRI = 'inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';

const BTN_SEC = 'inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm';



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



// ---- MovimentoBadge + Situacao Badge ----

// ---- MovimentoBadge ----

const MOV_CFG: Record<string, { bg: string; text: string; border: string }> = {

  'EM ANÁLISE':            { bg: 'bg-sky-50',     text: 'text-sky-700',     border: 'border-sky-200' },

  'AGUARDANDO':            { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },

  'AGUARDANDO ANÁLISE':    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },

  'ENCAMINHADO':           { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },

  'ENCAMINHADO AO GGCON':  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },

  'DEVOLVIDO':             { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },

  'DEVOLVIDO À DRS':       { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },

  'DEVOLVIDO A DRS':       { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },

  'DILIGÊNCIA':            { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200' },

  'RECEBIDO':              { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },

  'REANÁLISE':             { bg: 'bg-violet-50',  text: 'text-violet-700',  border: 'border-violet-200' },

  'CONCLUÍDO':             { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },

  'CONCLUSÃO':             { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },

  'ARQUIVADO':             { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200' },

  'ARQUIVAMENTO':          { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200' },

};

const MOV_DEF = { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };



const MovimentoBadge = ({ movimento }: { movimento: string | null | undefined }) => {

  if (!movimento) return <span className="text-slate-300 text-xs">—</span>;

  const key = movimento.toUpperCase();

  const c = Object.entries(MOV_CFG).find(([k]) => k === key || key.startsWith(k))?.[1] ?? MOV_DEF;

  return (

    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}>

      {movimento}

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



const Modal = ({ title, subtitle, onClose, onBack, children, size = 'lg' }: {

  title: string; subtitle?: string; onClose: () => void; onBack?: () => void;

  children: React.ReactNode; size?: 'md' | 'lg' | 'xl';

}) => {

  const widths = { md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"

      onClick={onClose}

    >

      <div

        className={`bg-slate-50/95 rounded-2xl shadow-2xl ring-1 ring-black/5 w-full ${widths[size]} max-h-[92vh] flex flex-col`}

        onClick={e => e.stopPropagation()}

      >

        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-100 bg-white rounded-t-2xl">

          <div className="flex items-center gap-2">

            {onBack && (

              <button

                onClick={onBack}

                className="p-1.5 rounded-xl hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs font-semibold mr-1"

                title="Voltar aos Detalhes"

              >

                <ChevronLeft size={16} />Detalhes

              </button>

            )}

            <div>

              <h3 className="text-base font-bold text-slate-800">{title}</h3>

              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}

            </div>

          </div>

          <button

            onClick={onClose}

            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"

          >

            <X size={16} />

          </button>

        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>

      </div>

    </div>

  );

};



// ---- Section password ----

const SECTION_PASSWORD = 'cgof2026';



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

  <div className="bg-white border border-slate-100 rounded-xl p-3.5 hover:border-slate-200 hover:shadow-sm transition-all">

    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</div>

    <div className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">

      {icon}{value != null && value !== '' ? value : <span className="text-slate-300 font-normal">—</span>}

    </div>

  </div>

);



// ---- Productivity Panel ----



const EVENTO_CFG: Record<string, { color: string; label: string }> = {

  CRIACAO:        { color: 'bg-blue-500',    label: 'Atribuição inicial' },

  CADASTRO:       { color: 'bg-slate-500',   label: 'Responsável pelo cadastro' },

  RESPONSAVEL:    { color: 'bg-emerald-500', label: 'Mudança de responsável' },

  POSICAO:        { color: 'bg-amber-500',   label: 'Mudança de posição' },

  MOVIMENTO:      { color: 'bg-purple-500',  label: 'Alteração de movimento' },

  INICIO_ANALISE: { color: 'bg-sky-500',     label: 'Início de análise' },

};





// ---- ProcessTimeline: chronological process flow ----

const PARC_STEP_COLOR: Record<string, string> = {
  AUTORIZO_SECRETARIO: 'bg-amber-500',
  AUTORIZO_CASA_CIVIL: 'bg-orange-500',
  ASSINATURA:          'bg-emerald-600',
  AUTORIZO_GOVERNADOR: 'bg-red-500',
};

const ProcessTimeline = ({ row, posicoes, parcelamentos }: {
  row: GpcRecebido; posicoes: GpcPosicao[];
  parcelamentos?: GpcParcelamento[] | null;
}) => {

  type TLEvent = {

    id: string; date: string; tipo: string; color: string;

    iconType: string; title: string; detail: string; badge?: string; obs?: string;

  };

  const [events, setEvents] = useState<TLEvent[]>([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    Promise.all([

      GpcService.getProdutividade(row.codigo),

      GpcService.getFluxoTecnico(row.codigo),

    ]).then(([prod, fluxo]) => {

      const ev: TLEvent[] = [];



      // Cadastro event

      if (row.created_at) {

        ev.push({

          id: 'created', date: row.created_at, tipo: 'CADASTRO',

          color: 'bg-slate-600', iconType: 'file',

          title: 'Processo cadastrado no sistema',

          detail: row.responsavel_cadastro || row.responsavel || '',

        });

      }



      // Produtividade events (excluding CADASTRO which is already above)

      for (const p of prod) {

        if (p.evento === 'INICIO_ANALISE') {

          ev.push({

            id: `prod-${p.id}`, date: p.data_evento, tipo: 'ANALISE',

            color: 'bg-sky-500', iconType: 'search',

            title: `Processo em análise — ${p.responsavel}`,

            detail: '',

            badge: p.responsavel,

          });

        } else if (p.evento === 'RESPONSAVEL') {

          ev.push({

            id: `prod-${p.id}`, date: p.data_evento, tipo: 'RESPONSAVEL',

            color: 'bg-amber-500', iconType: 'user',

            title: `Mudança de analista — ${p.responsavel}`,

            detail: p.obs ?? '',

          });

        }

      }



      // Fluxo técnico events

      for (const ft of fluxo) {

        const posLabel = posicoes.find(p => p.codigo === ft.posicao_id)?.posicao ?? ft.posicao;

        const title = posLabel

          ? `Posição: ${posLabel}`

          : ft.movimento ?? ft.acao ?? 'Evento registrado';

        ev.push({

          id: `ft-${ft.id}`, date: ft.data_evento, tipo: 'FLUXO',

          color: posLabel ? 'bg-purple-600' : ft.movimento ? 'bg-blue-600' : 'bg-slate-500',

          iconType: 'activity',

          title,

          detail: ft.tecnico ?? '',

          badge: ft.movimento ?? undefined,

        });

      }



      // Parcelamento authorization events
      for (const parc of (parcelamentos ?? [])) {
        const parcLog = (parc.autorizacoes_log ?? []) as ParcAutorizacaoEntry[];
        const parcLabel = `${parc.tipo_parcelamento ?? 'Parcelamento'} #${parc.codigo}`;
        for (const entry of parcLog) {
          const stepLabel = PARC_FLUXO_STEPS.find(s => s.tipo === entry.tipo)?.label ?? entry.tipo;
          ev.push({
            id: `parc-${parc.codigo}-${entry.tipo}-${entry.registrado_em}`,
            date: entry.registrado_em,
            tipo: 'PARCELAMENTO',
            color: PARC_STEP_COLOR[entry.tipo] ?? 'bg-slate-500',
            iconType: 'dollar',
            title: stepLabel,
            detail: entry.registrado_por ?? '',
            badge: parcLabel,
            obs: entry.obs ?? undefined,
          });
        }
      }

      ev.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setEvents(ev);

      setLoading(false);

    });

  }, [row.codigo, parcelamentos]);



  if (loading) return (

    <div className="flex items-center gap-2 py-6 justify-center text-slate-400 text-sm">

      <Loader2 size={14} className="animate-spin" />Carregando linha do tempo...

    </div>

  );

  if (!events.length) return (

    <div className="text-center py-6 text-slate-400 text-sm italic">Nenhum evento registrado ainda</div>

  );



  const IconFor = ({ type }: { type: string }) => {

    if (type === 'file') return <FileText size={14} />;

    if (type === 'search') return <Search size={14} />;

    if (type === 'user') return <User size={14} />;

    if (type === 'dollar') return <DollarSign size={14} />;

    return <Activity size={14} />;

  };



  return (

    <div className="relative">

      {/* Vertical line */}

      <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-gradient-to-b from-slate-200 to-transparent" />

      <div className="space-y-0">

        {events.map((ev, idx) => (

          <div key={ev.id} className={`relative flex items-start gap-3 ${idx < events.length - 1 ? 'pb-4' : ''}`}>

            <div className={`relative z-10 w-10 h-10 rounded-full ${ev.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm ring-2 ring-white`}>

              <IconFor type={ev.iconType} />

            </div>

            <div className="flex-1 bg-white border border-slate-100 rounded-xl px-4 py-3 shadow-sm min-w-0 hover:border-slate-200 transition-colors">

              <div className="flex items-start justify-between gap-2 flex-wrap">

                <div className="font-semibold text-sm text-slate-800 leading-snug">{ev.title}</div>

                <div className="text-[11px] text-slate-400 whitespace-nowrap font-medium tabular-nums">{fmtTs(ev.date)}</div>

              </div>

              {ev.detail && (

                <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">

                  <User size={10} className="flex-shrink-0" />{ev.detail}

                </div>

              )}

              {ev.badge && ev.badge !== ev.title && (

                <span className="mt-1.5 inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200">

                  {ev.badge}

                </span>

              )}

              {(ev as any).obs && (

                <div className="mt-1.5 text-xs text-slate-500 italic">

                  {(ev as any).obs}

                </div>

              )}

            </div>

          </div>

        ))}

      </div>

    </div>

  );

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



// ---- MultiSelectChips: multi-select with chips ----

const MultiSelectChips = ({

  options, selected, onChange, placeholder = '— clique para adicionar analista —'

}: {

  options: { id: string; name: string }[];

  selected: string[];

  onChange: (v: string[]) => void;

  placeholder?: string;

}) => {

  const [open, setOpen] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

  const available = options.filter(o => !selected.includes(o.name));



  useEffect(() => {

    const handler = (e: MouseEvent) => {

      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);

    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);

  }, []);



  return (

    <div ref={ref} className="relative">

      <div

        className={INPUT + ' min-h-[42px] flex flex-wrap gap-1.5 py-2 cursor-pointer'}

        onClick={() => setOpen(o => !o)}

      >

        {selected.map(name => (

          <span key={name} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">

            {name}

            <button

              type="button"

              onClick={e => { e.stopPropagation(); onChange(selected.filter(n => n !== name)); }}

              className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-blue-300 text-blue-600 hover:text-blue-900 transition-colors"

            >×</button>

          </span>

        ))}

        {selected.length === 0 && (

          <span className="text-slate-300 text-sm">{placeholder}</span>

        )}

        {available.length > 0 && (

          <span className="ml-auto text-xs text-blue-500 flex items-center gap-1 self-center">

            <Plus size={11} />Adicionar

          </span>

        )}

      </div>

      {open && available.length > 0 && (

        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">

          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Selecionar analista</div>

          {available.map(u => (

            <button

              key={u.id}

              type="button"

              onClick={() => { onChange([...selected, u.name]); setOpen(false); }}

              className="w-full px-3 py-2.5 text-sm text-left hover:bg-blue-50 text-slate-700 flex items-center gap-2 transition-colors"

            >

              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">

                {u.name.charAt(0).toUpperCase()}

              </div>

              {u.name}

            </button>

          ))}

          {available.length === 0 && (

            <div className="px-3 py-3 text-xs text-slate-400 text-center">Todos os técnicos já foram adicionados</div>

          )}

        </div>

      )}

    </div>

  );

};



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



const FluxoTecnicoFormInline = ({ registroId, posicoes, numPaginas, gpcUsers, onSaved, currentUserName }: {

  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;

  gpcUsers: { id: string; name: string }[];

  onSaved: () => Promise<void> | void;

  currentUserName?: string;

}) => {

  const [form, setForm] = useState<Partial<GpcFluxoTecnico>>({

    registro_id: registroId,

    num_paginas_analise: numPaginas ?? undefined,

    tecnico: currentUserName ?? undefined,

  });

  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState('');

  // Sync logged-in user whenever prop becomes available (e.g. after auth resolves)

  useEffect(() => {

    if (currentUserName) setForm(f => ({ ...f, tecnico: currentUserName }));

  }, [currentUserName]);

  const now = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const set = (k: keyof GpcFluxoTecnico, v: any) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {

    e.preventDefault(); setSaving(true); setErr('');

    try {

      await GpcService.saveFluxoTecnico({ ...form, registro_id: registroId, data_evento: new Date().toISOString() });

      setForm({ registro_id: registroId, num_paginas_analise: numPaginas ?? undefined, tecnico: currentUserName ?? undefined });

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

          <label className={LABEL + ' flex items-center gap-1'}>

            <User size={10} className="text-slate-400" />Registrado por

          </label>

          <div className={INPUT + ' bg-slate-50 text-slate-700 flex items-center gap-2 select-none'}>

            {form.tecnico

              ? <><div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{form.tecnico.charAt(0).toUpperCase()}</div><span className="text-sm font-medium">{form.tecnico}</span><span className="ml-auto text-[10px] text-slate-400 font-medium">Usuário logado</span></>

              : <><div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0"><User size={10} className="text-slate-500" /></div><span className="text-slate-400 text-xs italic">Carregando usuário...</span></>}

          </div>

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

        <div className="sm:col-span-1">

          <label className={LABEL}>Observações</label>

          <input className={INPUT} value={form.obs ?? ''} onChange={e => set('obs', e.target.value || null)} placeholder="Detalhes adicionais..." />

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



const FluxoTecnicoPanel = ({ registroId, posicoes, numPaginas, gpcUsers, signatoryUsers, responsavelAssinatura, responsavelAssinatura2, onRecordUpdated, readOnly, hideAssinatura, currentUserName, onAssinaturaChange }: {

  registroId: number; posicoes: GpcPosicao[]; numPaginas: number | null | undefined;

  gpcUsers: { id: string; name: string }[];

  signatoryUsers: { id: string; name: string }[];

  responsavelAssinatura?: string | null;

  responsavelAssinatura2?: string | null;

  onRecordUpdated?: () => Promise<void> | void;

  readOnly?: boolean;

  hideAssinatura?: boolean;

  currentUserName?: string;

  onAssinaturaChange?: (a1: string, a2: string) => void;

}) => {

  const [items, setItems] = useState<GpcFluxoTecnico[]>([]);

  const [loading, setLoading] = useState(true);

  const [assinatura1, setAssinatura1] = useState<string>(responsavelAssinatura ?? '');

  const [assinatura2, setAssinatura2] = useState<string>(responsavelAssinatura2 ?? '');



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

              <select className={INPUT} value={assinatura1} onChange={e => { setAssinatura1(e.target.value); onAssinaturaChange?.(e.target.value, assinatura2); }}>

                <option value="">— selecione —</option>

                {signatoryUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}

              </select>

            </div>

            <div>

              <label className={LABEL}>2º Responsável <span className="text-slate-400 font-normal">(opcional)</span></label>

              <select className={INPUT} value={assinatura2} onChange={e => { setAssinatura2(e.target.value); onAssinaturaChange?.(assinatura1, e.target.value); }}>

                <option value="">— nenhum —</option>

                {signatoryUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}

              </select>

            </div>

          </div>

          {signatoryUsers.length === 0 && (

            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">

              Nenhum usuário habilitado para assinar processos. O administrador deve marcar usuários como "Pode assinar processos" no Gerenciamento de Usuários.

            </p>

          )}

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

          currentUserName={currentUserName}

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

            <Activity size={12} />Eventos do Fluxo Técnico ({items.length})

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

                          {it.posicao && <PosicaoBadge id={it.posicao_id} label={it.posicao} />}

                          {it.movimento && (

                            <span className="text-xs text-slate-600 bg-white border border-slate-200 rounded-full px-2 py-0.5 font-medium">

                              {it.movimento}

                            </span>

                          )}

                          {it.acao && !it.posicao && !it.movimento && (

                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} border ${cfg.border}`}>

                              {it.acao}

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

  const { currentUser } = useApp();

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



  const Sec = ({ icon, title }: { icon: React.ReactNode; title: string }) => (

    <div className="flex items-center gap-2.5 mb-4">

      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">

        {icon}

      </span>

      <span className="text-sm font-bold text-slate-700">{title}</span>

      <div className="flex-1 h-px bg-slate-100" />

    </div>

  );



  const cpxLabel = (n: number | null | undefined) => {

    if (!n) return null;

    if (n <= 50)  return { label: 'Baixa',     color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-100',  ring: 'bg-green-100',  icon: 'text-green-600' };

    if (n <= 200) return { label: 'Média',     color: 'text-amber-700',  bg: 'bg-amber-50',  border: 'border-amber-100',  ring: 'bg-amber-100',  icon: 'text-amber-600' };

    if (n <= 500) return { label: 'Alta',      color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', ring: 'bg-orange-100', icon: 'text-orange-600' };

    return        { label: 'Muito Alta', color: 'text-red-700',    bg: 'bg-red-50',    border: 'border-red-100',    ring: 'bg-red-100',    icon: 'text-red-600' };

  };

  const cpx = cpxLabel(row.num_paginas);



  return (

    <Modal

      title={row.processo ?? `#${row.codigo}`}

      subtitle={row.entidade ?? undefined}

      onClose={onClose}

      size="xl"

    >

      {/* Action bar */}

      <div className="flex items-center justify-between -mt-1 mb-5">

        <div className="flex items-center gap-2 text-xs text-slate-400">

          Registro <span className="font-bold text-slate-600">#{row.codigo}</span>

          {row.created_at && <span className="text-slate-300">·</span>}

          {row.created_at && <span>Cadastrado em {fmtDate(row.created_at)}</span>}

        </div>

        <button className={BTN_PRI} onClick={onEdit}>

          <Edit size={13} />Editar Registro

        </button>

      </div>



      <div className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">



        {/* -- HERO CARD -- */}

        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-6 text-white shadow-xl">

          <div className="pointer-events-none absolute -top-16 -right-16 w-56 h-56 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-8 left-4 w-36 h-36 rounded-full bg-indigo-500/10 blur-2xl" />



          <div className="relative flex items-start justify-between gap-4 mb-5">

            <div className="flex-1 min-w-0">

              <div className="flex items-center gap-2 flex-wrap mb-2">

                <span className="inline-flex items-center gap-1 bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md tracking-widest uppercase">

                  <FileText size={9} />Processo #{row.codigo}

                </span>

                {row.is_parcelamento && (

                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">Parcelamento</span>

                )}

                {row.remessa && (

                  <span className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md">

                    {row.remessa === 'ACIMA' ? 'Acima de Remessa' : 'Abaixo de Remessa'}

                  </span>

                )}

              </div>

              <div className="font-mono text-xl font-bold text-white tracking-tight break-all leading-snug">

                {row.processo ?? '—'}

              </div>

              {(row.convenio || row.valor_convenio) && (

                <div className="text-slate-400 text-sm mt-1.5 flex items-center gap-2 flex-wrap">

                  {row.convenio && <span>Convênio {row.convenio}</span>}

                  {row.valor_convenio != null && (

                    <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold px-2 py-0.5 rounded-md">

                      <DollarSign size={10} />{row.valor_convenio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

                    </span>

                  )}

                </div>

              )}

            </div>

            <div className="flex flex-col items-end gap-2 flex-shrink-0">

              <SituacaoBadge situacao={row.situacao} />

              <PosicaoBadge id={row.posicao_id} label={row.posicao ?? null} />

            </div>

          </div>



          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative">

            {[

              { label: 'Exercício',    value: row.exercicio ?? '—' },

              { label: 'DRS',          value: row.drs != null ? `DRS ${String(row.drs).padStart(2, '0')}` : '—' },

              { label: 'Recebimento',  value: fmtDate(row.data) },

              { label: 'Entidade',     value: row.entidade ?? '—' },

            ].map(({ label, value }) => (

              <div key={label} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 border border-white/10">

                <div className="text-slate-400 text-[10px] uppercase tracking-widest font-semibold mb-0.5">{label}</div>

                <div className="text-white text-xs font-semibold truncate">{value}</div>

              </div>

            ))}

          </div>

        </div>





        {/* -- Linha do Tempo do Processo -- */}

        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

          <Sec icon={<TrendingUp size={13} />} title="Linha do Tempo do Processo" />

          <ProcessTimeline row={row} posicoes={posicoes} parcelamentos={full?.parcelamentos} />

        </section>



                {/* -- Indicadores chave -- */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

          {/* Responsável pelo Cadastro */}

          <div className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">

            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">

              <User size={17} className="text-slate-500" />

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Responsável pelo Cadastro</div>

              <div className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{row.responsavel_cadastro || row.responsavel || <span className="text-slate-300 font-normal">—</span>}</div>

            </div>

          </div>

          {/* Analistas */}

          <div className="flex items-start gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">

            <div className="w-10 h-10 rounded-full bg-sky-50 flex items-center justify-center flex-shrink-0 mt-0.5">

              <Search size={17} className="text-sky-500" />

            </div>

            <div className="min-w-0 flex-1">

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Técnicos Analistas</div>

              {(row.responsaveis_analise ?? []).length > 0 ? (

                <div className="flex flex-wrap gap-1">

                  {(row.responsaveis_analise ?? []).map(a => (

                    <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-100 text-sky-800 rounded-full text-xs font-semibold border border-sky-200">{a}</span>

                  ))}

                </div>

              ) : (

                <span className="text-sm text-slate-300 font-normal italic">— não atribuído</span>

              )}

              {row.movimento && <div className="text-[10px] text-slate-500 mt-1.5 truncate font-medium">{row.movimento}</div>}

            </div>

          </div>

          <div className={`flex items-center gap-3 rounded-2xl p-4 border shadow-sm ${cpx ? `${cpx.bg} ${cpx.border}` : 'bg-white border-slate-100'}`}>

            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cpx ? cpx.ring : 'bg-slate-100'}`}>

              <BookOpen size={17} className={cpx ? cpx.icon : 'text-slate-400'} />

            </div>

            <div className="min-w-0">

              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Complexidade</div>

              {cpx

                ? <div className="mt-0.5"><span className={`text-sm font-bold ${cpx.color}`}>{cpx.label}</span><span className="text-xs text-slate-500 ml-1.5">({row.num_paginas} pág.)</span></div>

                : <div className="text-sm text-slate-300 font-normal mt-0.5">Não informado</div>}

            </div>

          </div>

        </div>

        {/* ── Responsáveis pela Assinatura ── */}
        {(row.responsavel_assinatura || row.responsavel_assinatura_2) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: '1º Responsável pela Assinatura', value: row.responsavel_assinatura },
              { label: '2º Responsável pela Assinatura', value: row.responsavel_assinatura_2 },
            ].filter(r => r.value).map(({ label, value }) => (
              <div key={label} className="flex items-center gap-3 bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <PenLine size={17} className="text-indigo-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
                  <div className="text-sm font-semibold text-slate-700 mt-0.5 truncate">{value}</div>
                </div>
              </div>
            ))}
          </div>
        )}





        {/* -- Situação do Processo -- */}

        {row.situacao && (

        <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

          <Sec icon={<ShieldCheck size={13} />} title="Situação do Processo" />

            <div className={`rounded-2xl overflow-hidden border-2 shadow-sm ${

              row.situacao === 'REGULAR' ? 'border-green-200' :

              row.situacao === 'IRREGULAR' ? 'border-red-300' : 'border-amber-300'

            }`}>

              <div className={`px-5 py-3.5 flex items-center gap-3 ${

                row.situacao === 'REGULAR' ? 'bg-green-600' :

                row.situacao === 'IRREGULAR' ? 'bg-red-600' : 'bg-amber-500'

              }`}>

                {row.situacao === 'REGULAR'

                  ? <ShieldCheck size={18} className="text-white" />

                  : row.situacao === 'IRREGULAR'

                    ? <ShieldAlert size={18} className="text-white" />

                    : <ShieldOff size={18} className="text-white" />}

                <span className="text-white font-bold text-sm">

                  {row.situacao === 'REGULAR' ? 'Processo Regular — sem pendências financeiras'

                    : row.situacao === 'IRREGULAR' ? 'Processo Irregular — com pendências financeiras'

                    : 'Parcialmente Regular — pendências parciais'}

                </span>

              </div>

              <div className={`px-5 py-4 space-y-3 ${

                row.situacao === 'REGULAR' ? 'bg-green-50' :

                row.situacao === 'IRREGULAR' ? 'bg-red-50' : 'bg-amber-50'

              }`}>

                {row.situacao === 'REGULAR' && (

                  <p className="text-sm text-green-700 flex items-center gap-2">

                    <Check size={14} className="text-green-600 flex-shrink-0" />Processo sem pendências financeiras identificadas.

                  </p>

                )}

                {(row.situacao === 'IRREGULAR' || row.situacao === 'PARCIALMENTE_REGULAR') && (

                  <div className="grid grid-cols-3 gap-3">

                    <div className="bg-white rounded-xl p-3.5 border border-red-200 text-center shadow-sm">

                      <div className="text-[10px] text-red-500 font-bold uppercase tracking-wider mb-1">A Devolver</div>

                      <div className="text-lg font-bold text-red-700">{row.valor_a_devolver ? fmt(row.valor_a_devolver) : '—'}</div>

                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-green-200 text-center shadow-sm">

                      <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Já Devolvido</div>

                      <div className="text-lg font-bold text-green-700">{row.valor_devolvido ? fmt(row.valor_devolvido) : '—'}</div>

                    </div>

                    {(row.valor_a_devolver ?? 0) > 0 && (() => {

                      const saldo = (row.valor_a_devolver ?? 0) - (row.valor_devolvido ?? 0);

                      return (

                        <div className={`bg-white rounded-xl p-3.5 border text-center shadow-sm ${saldo <= 0 ? 'border-green-200' : 'border-red-200'}`}>

                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Saldo</div>

                          <div className={`text-lg font-bold ${saldo <= 0 ? 'text-green-700' : 'text-red-700'}`}>

                            {saldo <= 0 ? '? Quitado' : fmt(saldo)}

                          </div>

                        </div>

                      );

                    })()}

                  </div>

                )}

                {row.situacao_obs && (

                  <div className="bg-white/80 rounded-xl p-4 border border-current/10">

                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Observações</p>

                    <p className="text-sm text-slate-600 leading-relaxed">{row.situacao_obs}</p>

                  </div>

                )}

              </div>

            </div>

        </section>

        )}







        {/* -- Link -- */}

        {row.link_processo && (

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">

            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">

              <ExternalLink size={17} className="text-blue-600" />

            </div>

            <div className="flex-1 min-w-0">

              <div className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-0.5">Link do Processo</div>

              <a href={row.link_processo} target="_blank" rel="noopener noreferrer"

                className="text-blue-700 hover:text-blue-900 text-sm font-medium break-all flex items-center gap-1.5">

                <span className="truncate">{row.link_processo}</span>

              </a>

            </div>

          </div>

        )}



        {/* -- Dados assíncronos -- */}

        {loadingFull && (

          <div className="flex items-center gap-2 py-4 justify-center text-slate-400 text-xs">

            <Loader2 size={13} className="animate-spin" />Carregando dados adicionais...

          </div>

        )}

        {full && (

          <div className="space-y-4">

            <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

              <Sec icon={<BarChart2 size={13} />} title="Resumo Financeiro" />

              <div className="grid grid-cols-3 gap-3">

                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">

                  <ClipboardList size={20} className="text-blue-300 mx-auto mb-2" />

                  <div className="text-2xl font-bold text-blue-700">{full.objetos?.length ?? 0}</div>

                  <div className="text-xs text-blue-500 font-semibold mt-0.5">Objetos</div>

                  {(full.objetos?.length ?? 0) > 0 && <div className="text-xs text-blue-600 font-bold mt-1.5">{fmt(full.objetos!.reduce((s, o) => s + (o.custo ?? 0), 0))}</div>}

                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">

                  <DollarSign size={20} className="text-amber-300 mx-auto mb-2" />

                  <div className="text-2xl font-bold text-amber-700">{full.parcelamentos?.length ?? 0}</div>

                  <div className="text-xs text-amber-500 font-semibold mt-0.5">Parcelamentos</div>

                  {(full.parcelamentos?.length ?? 0) > 0 && <div className="text-xs text-amber-600 font-bold mt-1.5">{fmt(full.parcelamentos!.reduce((s, p) => s + (p.valor_parcelado ?? 0), 0))}</div>}

                </div>

                <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4 text-center">

                  <GitBranch size={20} className="text-purple-300 mx-auto mb-2" />

                  <div className="text-2xl font-bold text-purple-700">{full.tas?.length ?? 0}</div>

                  <div className="text-xs text-purple-500 font-semibold mt-0.5">Termos Aditivos</div>

                  {(full.tas?.length ?? 0) > 0 && <div className="text-xs text-purple-600 font-bold mt-1.5">{fmt(full.tas!.reduce((s, t) => s + (t.custo ?? 0), 0))}</div>}

                </div>

              </div>

            </section>



            {(full.exercicios?.length ?? 0) > 0 && (

              <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">

                <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">

                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">

                    <Calendar size={13} />

                  </span>

                  <span className="text-sm font-bold text-slate-700">Exercícios ({full.exercicios!.length})</span>

                </div>

                <div className="divide-y divide-slate-50">

                  {full.exercicios!.map(ex => (

                    <div key={ex.codigo} className="grid grid-cols-4 gap-3 px-5 py-3 text-xs hover:bg-slate-50/50 transition-colors">

                      <span className="font-bold text-slate-700">{ex.exercicio}</span>

                      <span className="text-slate-500">Rep: <span className="text-green-700 font-semibold">{fmt(ex.repasse)}</span></span>

                      <span className="text-slate-500">Apl: <span className="font-medium">{fmt(ex.aplicacao)}</span></span>

                      <span className="text-slate-500">Dev: <span className="font-medium">{fmt(ex.devolvido)}</span></span>

                    </div>

                  ))}

                </div>

                {(() => {
                  const exs = full.exercicios!;
                  const tRep = exs.reduce((s, e) => s + (e.repasse ?? 0), 0);
                  const tApl = exs.reduce((s, e) => s + (e.aplicacao ?? 0), 0);
                  const tConv = exs.reduce((s, e) => s + (e.exercicio_anterior ?? 0) + (e.repasse ?? 0) + (e.aplicacao ?? 0), 0);
                  return (
                    <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Total Repasse</div>
                        <div className="font-bold text-green-700">{fmt(tRep)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Total Aplicação</div>
                        <div className="font-bold text-slate-700">{fmt(tApl)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-blue-400 font-semibold mb-0.5">Total do Convênio</div>
                        <div className="font-bold text-blue-700">{fmt(tConv)}</div>
                      </div>
                    </div>
                  );
                })()}

              </section>

            )}

            {/* ── Parcelamentos: fluxo de autorização (read-only) ── */}
            {(full.parcelamentos?.length ?? 0) > 0 && (
              <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                    <DollarSign size={13} />
                  </span>
                  <span className="text-sm font-bold text-slate-700">Parcelamento / Reparcelamento ({full.parcelamentos!.length})</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {full.parcelamentos!.map(parc => {
                    const plog = ((parc.autorizacoes_log ?? []) as import('../types').ParcAutorizacaoEntry[]);
                    const visSteps = PARC_FLUXO_STEPS.filter(s => !s.onlyGov || (parc.parcelas ?? 0) > 60);
                    const doneCnt = visSteps.filter(s => plog.some(e => e.tipo === s.tipo)).length;
                    return (
                      <div key={parc.codigo} className="px-5 py-4 space-y-3">
                        {/* Header do parcelamento */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            parc.tipo_parcelamento === 'REPARCELAMENTO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {parc.tipo_parcelamento ?? parc.tipo ?? 'Parcelamento'}
                          </span>
                          {parc.exercicio && <span className="text-xs text-slate-500">Exercício {parc.exercicio}</span>}
                          {parc.valor_parcelado != null && <span className="text-xs font-semibold text-green-700">{fmt(parc.valor_parcelado)}</span>}
                          {parc.parcelas != null && <span className="text-xs text-slate-400">{parc.parcelas} parcelas</span>}
                          <span className={`ml-auto text-[10px] font-semibold ${doneCnt === visSteps.length && visSteps.length > 0 ? 'text-emerald-600' : doneCnt > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
                            {doneCnt}/{visSteps.length} etapas
                          </span>
                        </div>
                        {/* Barra de progresso */}
                        {visSteps.length > 0 && (
                          <div className="w-full bg-slate-100 rounded-full h-1">
                            <div className="h-1 rounded-full bg-gradient-to-r from-blue-400 to-emerald-500 transition-all" style={{ width: `${(doneCnt / visSteps.length) * 100}%` }} />
                          </div>
                        )}
                        {/* Passos do fluxo */}
                        <div className="space-y-1.5">
                          {visSteps.map((step, i) => {
                            const entries = plog.filter(e => e.tipo === step.tipo);
                            const done = entries.length > 0;
                            return (
                              <div key={step.tipo} className={`rounded-lg border overflow-hidden ${done ? 'border-emerald-200' : 'border-slate-100'}`}>
                                <div className={`flex items-center gap-2.5 px-3 py-2 ${done ? 'bg-emerald-50' : 'bg-slate-50/50'}`}>
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                    {done ? <Check size={9} /> : i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className={`text-xs font-semibold ${done ? 'text-emerald-700' : 'text-slate-500'}`}>{step.label}</span>
                                  </div>
                                  {!done && <span className="text-[10px] text-slate-300">Pendente</span>}
                                </div>
                                {entries.length > 0 && (
                                  <div className="divide-y divide-emerald-100">
                                    {entries.map((entry, j) => (
                                      <div key={j} className="flex items-center gap-2 px-3 py-1.5 bg-white text-[11px]">
                                        <Calendar size={9} className="text-emerald-400 flex-shrink-0" />
                                        <span className="font-semibold text-slate-700">{fmtDate(entry.data)}</span>
                                        {entry.obs && <span className="text-slate-400 flex-1 truncate">{entry.obs}</span>}
                                        {entry.registrado_por && <span className="ml-auto text-blue-600 font-semibold flex items-center gap-0.5 flex-shrink-0"><User size={9} />{entry.registrado_por}</span>}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {/* Status badges */}
                        <div className="flex gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${parc.em_dia ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-400'}`}>
                            {parc.em_dia ? <Check size={9} /> : <X size={9} />}Em Dia
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${parc.parcelas_concluidas ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>
                            {parc.parcelas_concluidas ? <Check size={9} /> : <X size={9} />}Concluído
                          </span>
                        </div>
                        {parc.providencias && <p className="text-xs text-slate-500 italic">{parc.providencias}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {(full.historicos?.length ?? 0) > 0 && (

              <section className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">

                <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2.5">

                  <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">

                    <Clock size={13} />

                  </span>

                  <span className="text-sm font-bold text-slate-700">Histórico de Movimentos ({full.historicos!.length})</span>

                </div>

                <div className="divide-y divide-slate-50">

                  {full.historicos!.slice(-5).map(h => (

                    <div key={h.codigo} className="flex items-center gap-3 px-5 py-2.5 text-xs hover:bg-slate-50/50 transition-colors">

                      <span className="text-slate-400 whitespace-nowrap w-20 flex-shrink-0">{fmtDate(h.data)}</span>

                      <span className="text-slate-700 font-medium truncate flex-1">{h.movimento ?? '-'}</span>

                      {h.posicao && <span className="flex-shrink-0 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">{h.posicao}</span>}

                      {h.responsavel && <span className="flex-shrink-0 text-slate-400 flex items-center gap-0.5"><User size={9} />{h.responsavel}</span>}

                    </div>

                  ))}

                </div>

              </section>

            )}

          </div>

        )}



        {prevPositions.length > 0 && (

          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

            <Sec icon={<Info size={13} />} title="Processo com múltiplas posições" />

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex flex-wrap gap-2">

              {prevPositions.map((p, i) => (

                <span key={i} className="inline-flex items-center gap-1 text-xs bg-white border border-purple-200 text-purple-700 rounded-full px-3 py-1 shadow-sm">

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

// ---- ParcFluxoCard — fluxo de autorização do parcelamento (estilo FluxoTécnico) ----
const ParcFluxoCard = ({ parc, currentUserName, onSaveLog }: {
  parc: GpcParcelamento;
  currentUserName?: string;
  onSaveLog: (updated: GpcParcelamento) => Promise<void>;
}) => {
  const [log, setLog] = useState<import('../types').ParcAutorizacaoEntry[]>(
    (parc.autorizacoes_log ?? []) as import('../types').ParcAutorizacaoEntry[]
  );
  const [step, setStep] = useState('');
  const [obs, setObs]   = useState('');
  const [saving, setSaving] = useState(false);

  const needsGov    = (parc.parcelas ?? 0) > 60;
  const visSteps    = PARC_FLUXO_STEPS.filter(s => !s.onlyGov || needsGov);
  const doneCnt     = visSteps.filter(s => log.some(e => e.tipo === s.tipo)).length;
  const nowLabel    = () => new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const handleRegister = async () => {
    if (!step) return;
    setSaving(true);
    const entry: import('../types').ParcAutorizacaoEntry = {
      tipo: step as any,
      data: new Date().toISOString().split('T')[0],
      obs: obs || null,
      registrado_por: currentUserName ?? null,
      registrado_em: new Date().toISOString(),
    };
    const newLog = [...log, entry];
    try {
      await onSaveLog({ ...parc, autorizacoes_log: newLog });
      setLog(newLog);
      setStep('');
      setObs('');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {/* Header do parcelamento */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
          parc.tipo_parcelamento === 'REPARCELAMENTO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
        }`}>{parc.tipo_parcelamento ?? parc.tipo ?? 'Parcelamento'}</span>
        {parc.exercicio && <span className="text-xs text-slate-500">Exercício {parc.exercicio}</span>}
        {parc.valor_parcelado != null && <span className="text-xs font-semibold text-green-700">{fmt(parc.valor_parcelado)}</span>}
        {parc.parcelas != null && <span className="text-xs text-slate-400">{parc.parcelas} parcelas</span>}
        <span className={`ml-auto text-[11px] font-bold ${doneCnt === visSteps.length && visSteps.length > 0 ? 'text-emerald-600' : doneCnt > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
          {doneCnt}/{visSteps.length} etapas
        </span>
      </div>

      {/* Barra de progresso */}
      {visSteps.length > 0 && (
        <div className="w-full bg-slate-100 rounded-full h-1">
          <div className="h-1 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
            style={{ width: `${(doneCnt / visSteps.length) * 100}%` }} />
        </div>
      )}

      {/* Formulário — mesmo estilo do FluxoTécnico */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Activity size={14} className="text-blue-600" />
          <span className="text-sm font-bold text-slate-700">Registrar Autorização</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Registrado por */}
          <div>
            <label className={LABEL + ' flex items-center gap-1'}><User size={10} className="text-slate-400" />Registrado por</label>
            <div className={INPUT + ' bg-slate-50 text-slate-700 flex items-center gap-2 select-none'}>
              {currentUserName
                ? <><div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">{currentUserName.charAt(0).toUpperCase()}</div><span className="text-sm font-medium truncate">{currentUserName}</span><span className="ml-auto text-[10px] text-slate-400 font-medium flex-shrink-0">Usuário logado</span></>
                : <><div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0"><User size={10} className="text-slate-500" /></div><span className="text-slate-400 text-xs italic">Carregando...</span></>}
            </div>
          </div>
          {/* Data/Hora */}
          <div>
            <label className={LABEL + ' flex items-center gap-1'}><Lock size={10} className="text-slate-400" />Data/Hora</label>
            <div className={INPUT + ' bg-slate-100 text-slate-500 flex items-center gap-2 cursor-not-allowed select-none'}>
              <Clock size={13} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm font-medium">{nowLabel()}</span>
              <span className="ml-auto text-xs text-slate-400 flex-shrink-0">Automático</span>
            </div>
          </div>
          {/* Etapa */}
          <div>
            <label className={LABEL}>Etapa</label>
            <select className={INPUT} value={step} onChange={e => setStep(e.target.value)}>
              <option value="">— selecione —</option>
              {visSteps.map(s => <option key={s.tipo} value={s.tipo}>{s.label}</option>)}
            </select>
          </div>
          {/* Observação */}
          <div className="sm:col-span-2">
            <label className={LABEL}>Observação</label>
            <input className={INPUT} value={obs} onChange={e => setObs(e.target.value)} placeholder="Detalhes sobre a autorização..." />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              disabled={!step || saving}
              onClick={handleRegister}
              className={BTN_PRI + ' w-full justify-center'}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}Registrar
            </button>
          </div>
        </div>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-2">
        {visSteps.map((s, idx) => {
          const entries = log.filter(e => e.tipo === s.tipo);
          const isDone  = entries.length > 0;
          return (
            <div key={s.tipo} className={`border rounded-xl overflow-hidden ${isDone ? 'border-emerald-200' : 'border-slate-200'}`}>
              <div className={`flex items-center gap-3 px-4 py-2.5 ${isDone ? 'bg-emerald-50' : 'bg-slate-50/40'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${isDone ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {isDone ? <Check size={10} /> : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-semibold ${isDone ? 'text-emerald-700' : 'text-slate-600'}`}>{s.label}</span>
                  <span className="ml-2 text-[11px] text-slate-400">{s.desc}</span>
                </div>
                {!isDone && <span className="text-[10px] text-slate-300 font-medium">Pendente</span>}
              </div>
              {entries.length > 0 && (
                <div className="divide-y divide-emerald-100/70">
                  {entries.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2 bg-white text-xs">
                      <Calendar size={10} className="text-emerald-400 flex-shrink-0" />
                      <span className="font-semibold text-slate-700">{fmtDate(entry.data)}</span>
                      {entry.obs && <span className="text-slate-400 flex-1 truncate">{entry.obs}</span>}
                      {entry.registrado_por && (
                        <span className="ml-auto text-blue-500 font-medium flex items-center gap-1 flex-shrink-0">
                          <User size={9} />{entry.registrado_por}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
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

  onBackToView?: (rec: GpcRecebido) => void;

}



const RegistroModal: React.FC<RegistroModalProps> = ({ initial, posicoes, onSave, onClose, isAdmin, onRecordUpdated, onBackToView }) => {

  const { currentUser } = useApp();

  const [liveRecord, setLiveRecord] = useState<GpcRecebido | undefined>(initial);

  const [form, setForm] = useState<Partial<GpcRecebido>>(initial ?? { responsavel_cadastro: currentUser?.name ?? null });

  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState('');

  const [savedOk, setSavedOk] = useState(false);

  const [activeTab, setActiveTab] = useState<'analise' | 'ident' | 'fluxo' | 'financeiro'>('ident');

  const [full, setFull] = useState<GpcProcessoFull | null>(null);

  const [loadingFull, setLoadingFull] = useState(false);

  const [subModal, setSubModal] = useState<null | { type: string; data?: any }>(null);

  const [tipoParc, setTipoParc] = useState<'' | 'PARCELAMENTO' | 'REPARCELAMENTO'>(
    initial?.is_parcelamento ? 'PARCELAMENTO' : ''
  );

  const [gpcUsers, setGpcUsers] = useState<{ id: string; name: string }[]>([]);

  const [signatoryUsers, setSignatoryUsers] = useState<{ id: string; name: string }[]>([]);



  const set = (k: keyof GpcRecebido, v: any) => setForm(f => ({ ...f, [k]: v }));

  const isEditing = !!(liveRecord?.codigo);



  // Section locking (require password to edit Identificação + Classificação)

  const [identLocked, setIdentLocked] = useState(isEditing);

  const [classifLocked, setClassifLocked] = useState(isEditing);

  const tryUnlock = (setter: (v: boolean) => void) => {

    const pw = window.prompt('Digite a senha para liberar a edição desta seção:');

    if (pw === SECTION_PASSWORD) {

      setter(false);

    } else if (pw !== null) {

      alert('Senha incorreta. Acesso negado.');

    }

  };

  const LockBtn = ({ locked, onUnlock }: { locked: boolean; onUnlock: () => void }) => (

    <button

      type="button"

      onClick={locked ? onUnlock : undefined}

      title={locked ? 'Clique para desbloquear (requer senha)' : 'Seção desbloqueada para edição'}

      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors ${

        locked

          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer'

          : 'bg-green-50 text-green-700 border border-green-200 cursor-default'

      }`}

    >

      {locked ? <Lock size={11} /> : <Unlock size={11} />}

      {locked ? 'Bloqueado' : 'Desbloqueado'}

    </button>

  );



  useEffect(() => {

    GpcService.getGpcUsers().then(setGpcUsers);

    GpcService.getSignatoryUsers().then(setSignatoryUsers);

  }, []);



  useEffect(() => {

    if (!liveRecord?.processo_codigo) return;

    setLoadingFull(true);

    GpcService.getProcessoFull(liveRecord.processo_codigo).then(d => {
      setFull(d);
      setLoadingFull(false);
      // Auto-preenche tipoParc a partir do primeiro parcelamento cadastrado
      if (d?.parcelamentos?.length) {
        const tp = d.parcelamentos[0].tipo_parcelamento;
        if (tp) setTipoParc(tp);
      }
    });

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

        onRecordUpdated?.();

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

    <div className="flex items-center gap-3 mb-4">

      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">

        {icon}

      </span>

      <span className="text-sm font-bold text-slate-700">{title}</span>

      <div className="flex-1 h-px bg-slate-100" />

      {action}

    </div>

  );



  return (

    <Modal

      title={isEditing ? 'Editar Registro' : 'Novo Registro'}

      subtitle={isEditing ? `#${liveRecord!.codigo} — ${liveRecord!.processo ?? ''}` : 'Preencha os dados do processo'}

      onClose={onClose}

      onBack={isEditing && onBackToView && liveRecord ? () => onBackToView(liveRecord) : undefined}

      size="xl"

    >

      {/* ── Barra de abas ── */}
      <div className="flex border-b border-slate-200 mb-4 gap-0 flex-wrap -mx-1">
        {([
          { id: 'ident',      label: 'Identificação', icon: <FileText size={13} /> },
          { id: 'analise',    label: 'Análise',       icon: <Search size={13} /> },
          ...(isEditing ? [
            { id: 'fluxo',      label: 'Fluxo',         icon: <Activity size={13} /> },
            { id: 'financeiro', label: 'Financeiro',     icon: <BarChart2 size={13} /> },
          ] : []),
        ] as { id: string; label: string; icon: React.ReactNode }[]).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-700 bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.icon}{tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[66vh] overflow-y-auto pr-1">



        <form onSubmit={handleSubmit} className="space-y-4">

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



          {activeTab === 'ident' && (<>

          {/* -- Identificação do Processo -- */}

          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

            <Sec icon={<FileText size={13} />} title="Identificação do Processo" action={isEditing ? <LockBtn locked={identLocked} onUnlock={() => tryUnlock(setIdentLocked)} /> : undefined} />

            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 transition-opacity ${identLocked ? 'opacity-50 pointer-events-none select-none' : ''}`}>

              <div>

                <label className={LABEL}>Número do Processo *</label>

                <input className={INPUT} value={form.processo ?? ''} onChange={e => set('processo', e.target.value)} required placeholder="ex: 00163175/2025-14" />

              </div>

              <div>

                <label className={LABEL}>Convênio</label>

                <input className={INPUT} value={form.convenio ?? ''} onChange={e => set('convenio', e.target.value)} placeholder="ex: 555/2024" />

              </div>

              <div>

                <label className={LABEL}>Valor do Convênio (R$)</label>

                <CurrencyInput value={form.valor_convenio} onChange={v => set('valor_convenio', v)} />

              </div>

              <div className="sm:col-span-2">

                <label className={LABEL}>Entidade / Município</label>

                <input className={INPUT} value={form.entidade ?? ''} onChange={e => set('entidade', e.target.value)} placeholder="Nome da entidade ou município" />

              </div>

            </div>

          </section>



          {/* -- Classificação -- */}

          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

            <Sec icon={<ClipboardList size={13} />} title="Classificação e Posição" action={isEditing ? <LockBtn locked={classifLocked} onUnlock={() => tryUnlock(setClassifLocked)} /> : undefined} />

            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 transition-opacity ${classifLocked ? 'opacity-50 pointer-events-none select-none' : ''}`}>

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

                <select className={INPUT} value={form.responsavel_cadastro ?? ''} onChange={e => set('responsavel_cadastro', e.target.value || null)}>

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

              <div>

                <label className={LABEL}>Tipo de Parcelamento</label>

                <select className={INPUT} value={tipoParc} onChange={e => {
                  const v = e.target.value as '' | 'PARCELAMENTO' | 'REPARCELAMENTO';
                  setTipoParc(v);
                  set('is_parcelamento', v ? true : null);
                }}>

                  <option value="">— nenhum —</option>

                  <option value="PARCELAMENTO">Parcelamento</option>

                  <option value="REPARCELAMENTO">Reparcelamento</option>

                </select>

              </div>

            </div>

          </section>



          </>)}

          {activeTab === 'analise' && (<>

          {/* -- Análise -- */}

          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

            <Sec icon={<BookOpen size={13} />} title="Análise do Processo" />

            <div className="space-y-3">

              <div>

                <label className={LABEL + ' flex items-center gap-1.5'}>

                  <User size={11} />Técnicos Responsáveis pela Análise

                  <span className="text-slate-300 font-normal normal-case tracking-normal text-[10px]">(múltiplos possíveis)</span>

                </label>

                <MultiSelectChips

                  options={gpcUsers}

                  selected={form.responsaveis_analise ?? []}

                  onChange={v => set('responsaveis_analise', v.length > 0 ? v : null)}

                />

                <p className="mt-1 text-xs text-slate-400">Cada analista é contabilizado individualmente na produtividade</p>

              </div>

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

            </div>

          </section>



          {/* -- Situação do Processo -- */}

          <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

            <Sec icon={<ShieldCheck size={13} />} title="Situação do Processo" />

            <div className="space-y-3">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                <div className="sm:col-span-2">

                  <label className={LABEL}>Situação</label>

                  <select className={INPUT} value={form.situacao ?? ''} onChange={e => set('situacao', e.target.value || null)}>

                    <option value="">— não avaliada —</option>

                    <option value="REGULAR">Regular — sem pendências financeiras</option>

                    <option value="PARCIALMENTE_REGULAR">Parcialmente Regular — pendências parciais</option>

                    <option value="IRREGULAR">Irregular — com pendências / valores a devolver</option>

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

                            {saldo <= 0 && <span className="ml-2 text-xs text-green-600 font-normal flex items-center gap-1"><Check size={10} />Totalmente quitado</span>}

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



          </>)}

          {/* -- Save bar -- */}

          {(activeTab === 'analise' || activeTab === 'ident' || activeTab === 'fluxo') && (
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 sticky bottom-0 bg-white/97 backdrop-blur-sm py-3">

            <div className="text-xs text-slate-400">

              {isEditing ? <span>Editando registro <span className="font-semibold text-slate-600">#{liveRecord!.codigo}</span></span> : <span className="text-slate-400">Novo registro</span>}

            </div>

            <div className="flex gap-3">

              <button type="button" className={BTN_SEC} onClick={onClose}>Cancelar</button>

              <button type="submit" className={BTN_PRI} disabled={saving}>

                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}

                {isEditing ? 'Salvar Alterações' : 'Cadastrar Processo'}

              </button>

            </div>

          </div>
          )}

        </form>



        {/* -- Sections visible only when a record exists -- */}

        {isEditing && activeTab === 'fluxo' && (

          <div className="space-y-4 pb-4">



            {/* Fluxo Técnico */}

            <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

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

                currentUserName={currentUser?.name ?? undefined}

                onAssinaturaChange={(a1, a2) => setForm(f => ({ ...f, responsavel_assinatura: a1 || null, responsavel_assinatura_2: a2 || null }))}

              />

            </section>

            {/* Parcelamento / Reparcelamento — fluxo de autorização */}
            {(full?.parcelamentos?.length ?? 0) > 0 && (
              <div className="space-y-5">
                {full!.parcelamentos!.map(parc => (
                  <section key={parc.codigo} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <ParcFluxoCard
                      parc={parc}
                      currentUserName={currentUser?.name ?? undefined}
                      onSaveLog={async (updated) => {
                        await GpcService.saveParcelamento(updated);
                        await refreshFull();
                      }}
                    />
                  </section>
                ))}
              </div>
            )}
            {(full?.parcelamentos?.length ?? 0) === 0 && !loadingFull && (
              <div className="text-center py-10 text-slate-400 text-sm">
                <DollarSign size={28} className="mx-auto mb-2 opacity-30" />
                Nenhum parcelamento cadastrado. Adicione um na aba <strong>Financeiro</strong>.
              </div>
            )}

          </div>

        )}

        {isEditing && activeTab === 'financeiro' && (

          <div className="space-y-4 pb-4">

            {loadingFull && (

              <div className="flex items-center gap-2 py-5 justify-center text-slate-400 text-sm">

                <Loader2 size={16} className="animate-spin" />Carregando dados vinculados...

              </div>

            )}



            {!loadingFull && full && (

              <>

                {/* Exercícios */}

                <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

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

                  {(full.exercicios?.length ?? 0) > 0 && (() => {

                    const totalRepasse   = (full.exercicios ?? []).reduce((s, e) => s + (e.repasse ?? 0), 0);

                    const totalAplicacao = (full.exercicios ?? []).reduce((s, e) => s + (e.aplicacao ?? 0), 0);

                    const totalConvenio = (full.exercicios ?? []).reduce((s, e) => s + (e.exercicio_anterior ?? 0) + (e.repasse ?? 0) + (e.aplicacao ?? 0), 0);

                    return (

                      <div className="mt-3 grid grid-cols-3 gap-3">

                        <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">

                          <div className="text-[10px] uppercase tracking-wider text-green-500 font-semibold mb-0.5">Total Repasse</div>

                          <div className="text-sm font-bold text-green-700">{fmt(totalRepasse)}</div>

                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5">

                          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">Total Aplicação</div>

                          <div className="text-sm font-bold text-slate-700">{fmt(totalAplicacao)}</div>

                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5">

                          <div className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold mb-0.5">Total do Convênio</div>

                          <div className="text-sm font-bold text-blue-700">{fmt(totalConvenio)}</div>

                        </div>

                      </div>

                    );

                  })()}

                </section>



                {/* Objetos */}

                <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

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



                {/* Parcelamentos — cadastro básico (fluxo de autorização na aba Fluxo) */}
                <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <Sec
                    icon={<DollarSign size={13} />}
                    title={`Parcelamento / Reparcelamento (${full.parcelamentos?.length ?? 0})`}
                    action={
                      <button className={BTN_PRI + ' text-xs px-2.5 py-1'} onClick={() => setSubModal({ type: 'parcelamento', data: tipoParc ? { tipo_parcelamento: tipoParc } : undefined })}>
                        <Plus size={12} />Adicionar
                      </button>
                    }
                  />
                  <InlineTable
                    cols={[
                      { label: 'Tipo', render: (r: GpcParcelamento) => (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          r.tipo_parcelamento === 'REPARCELAMENTO' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>{r.tipo_parcelamento ?? r.tipo ?? '-'}</span>
                      )},
                      { label: 'Exercício', render: (r: GpcParcelamento) => r.exercicio ?? '-' },
                      { label: 'Valor',     render: (r: GpcParcelamento) => <span className="text-green-700 font-medium">{fmt(r.valor_parcelado)}</span> },
                      { label: 'Parcelas',  render: (r: GpcParcelamento) => r.parcelas ?? '-' },
                      { label: 'Em Dia',    render: (r: GpcParcelamento) => r.em_dia ? <Check size={13} className="text-green-600" /> : <X size={13} className="text-red-400" /> },
                      { label: 'Concluído', render: (r: GpcParcelamento) => r.parcelas_concluidas ? <Check size={13} className="text-green-600" /> : <X size={13} className="text-red-400" /> },
                    ]}
                    rows={full.parcelamentos ?? []}
                    onEdit={r => setSubModal({ type: 'parcelamento', data: r })}
                    onDelete={r => confirmDeleteSub(() => GpcService.deleteParcelamento(r.codigo))}
                    emptyMsg="Nenhum parcelamento cadastrado"
                  />
                </section>

                {/* TAs */}

                <section className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">

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

          {subModal.type === 'exercicio' && (() => {

            let lastSaldo: number | undefined;

            if (!subModal.data && (full.exercicios?.length ?? 0) > 0) {

              const sorted = [...(full.exercicios ?? [])].sort((a, b) =>

                String(a.exercicio ?? '').localeCompare(String(b.exercicio ?? ''))

              );

              const last = sorted[sorted.length - 1];

              const tot = (last.exercicio_anterior ?? 0) + (last.repasse ?? 0) + (last.aplicacao ?? 0);

              const sal = tot - (last.gastos ?? 0) - (last.devolvido ?? 0);

              lastSaldo = sal > 0 ? sal : undefined;

            }

            return (

              <Modal title={subModal.data ? 'Editar Exercício' : 'Novo Exercício'} onClose={() => setSubModal(null)} size="md">

                <ExercicioForm

                  processoId={full.codigo}

                  initial={subModal.data}

                  lastSaldo={lastSaldo}

                  onSave={async e => { await GpcService.saveExercicio(e); await refreshFull(); setSubModal(null); }}

                  onClose={() => setSubModal(null)}

                />

              </Modal>

            );

          })()}

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

            <Modal title={subModal.data ? 'Editar Parcelamento / Reparcelamento' : 'Novo Parcelamento / Reparcelamento'} onClose={() => setSubModal(null)} size="lg">

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



const ExercicioForm = ({ processoId, initial, lastSaldo, onSave, onClose }: {

  processoId: number; initial?: Partial<GpcExercicio>; lastSaldo?: number;

  onSave: (e: Partial<GpcExercicio>) => Promise<void>; onClose: () => void;

}) => {

  const [f, setF] = useState<Partial<GpcExercicio>>(initial ?? {

    processo_id: processoId,

    exercicio_anterior: lastSaldo ?? undefined,

  });

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

        {(() => {

          const _total = (f.exercicio_anterior ?? 0) + (f.repasse ?? 0) + (f.aplicacao ?? 0);

          if (_total === 0) return null;

          const parts = [];

          if ((f.exercicio_anterior ?? 0) > 0) parts.push('Ex. Ant. + ');

          parts.push('Repasse + Aplicação');

          return (

            <div className="col-span-2">

              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">

                <div>

                  <div className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Total Disponível no Exercício</div>

                  <div className="text-[10px] text-blue-400 mt-0.5">{parts.join('')}</div>

                </div>

                <div className="text-lg font-bold text-blue-700">

                  {_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

                </div>

              </div>

            </div>

          );

        })()}

        <div><label className={LABEL}>Gastos (R$)</label><CurrencyInput value={f.gastos} onChange={v => set('gastos', v)} /></div>

        <div><label className={LABEL}>Devolvido (R$)</label><CurrencyInput value={f.devolvido} onChange={v => set('devolvido', v)} /></div>

      </div>

      {/* Saldo disponível para próximo exercício */}

      {(() => {

        const exAnt     = f.exercicio_anterior ?? 0;

        const repasse   = f.repasse    ?? 0;

        const aplicacao = f.aplicacao  ?? 0;

        const gastos    = f.gastos     ?? 0;

        const devolvido = f.devolvido  ?? 0;

        const total     = exAnt + repasse + aplicacao;

        // Arredondar para 2 casas para evitar erro de ponto flutuante (ex: -2.84e-14)
        const saldo     = Math.round((total - gastos - devolvido) * 100) / 100;

        if (total === 0) return null;

        // Construir string de detalhe: positivos com "+", negativos com "−"
        const posParts: string[] = [];
        const negParts: string[] = [];
        if (exAnt > 0) posParts.push(`Ex. Ant. ${fmt(exAnt)}`);
        posParts.push(`Repasse ${fmt(repasse)}`);
        if (aplicacao > 0) posParts.push(`Aplic. ${fmt(aplicacao)}`);
        if (gastos > 0) negParts.push(`Gastos ${fmt(gastos)}`);
        if (devolvido > 0) negParts.push(`Dev. ${fmt(devolvido)}`);
        const detStr = posParts.join(' + ') + (negParts.length ? ' \u2212 ' + negParts.join(' \u2212 ') : '');

        return (

          <div className={`rounded-xl border p-3.5 flex items-center gap-3 ${saldo > 0 ? 'bg-blue-50 border-blue-200' : saldo < 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>

            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${saldo > 0 ? 'bg-blue-100' : saldo < 0 ? 'bg-red-100' : 'bg-slate-100'}`}>

              <DollarSign size={15} className={saldo > 0 ? 'text-blue-600' : saldo < 0 ? 'text-red-600' : 'text-slate-400'} />

            </div>

            <div className="flex-1 min-w-0">

              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">Saldo para o próximo exercício</div>

              <div className={`text-base font-bold ${saldo > 0 ? 'text-blue-700' : saldo < 0 ? 'text-red-700' : 'text-slate-500'}`}>

                {saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}

                {saldo < 0 && <span className="ml-2 text-xs font-normal text-red-600">⚠ gastos excedem o total disponível</span>}

              </div>

              <div className="text-xs text-slate-400 mt-0.5">{detStr}</div>

            </div>

          </div>

        );

      })()}

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

// Passos fixos do fluxo de autorização de parcelamento
const PARC_FLUXO_STEPS: { tipo: 'AUTORIZO_SECRETARIO' | 'AUTORIZO_CASA_CIVIL' | 'ASSINATURA' | 'AUTORIZO_GOVERNADOR'; label: string; desc: string; onlyGov?: boolean }[] = [
  { tipo: 'AUTORIZO_SECRETARIO', label: 'Autorizo do Secretário',  desc: 'Despacho autorizador do Secretário de Estado' },
  { tipo: 'AUTORIZO_CASA_CIVIL', label: 'Autorizo da Casa Civil',  desc: 'Manifestação favorável da Casa Civil do Estado' },
  { tipo: 'ASSINATURA',          label: 'Assinatura do Termo',     desc: 'Assinatura do termo de parcelamento' },
  { tipo: 'AUTORIZO_GOVERNADOR', label: 'Autorizo do Governador',  desc: 'Obrigatório para parcelamentos acima de 60 parcelas', onlyGov: true },
];

const ParcelamentoForm = ({ processoId, initial, onSave, onClose }: {

  processoId: number; initial?: Partial<GpcParcelamento>;

  onSave: (p: Partial<GpcParcelamento>) => Promise<void>; onClose: () => void;

}) => {

  const [f, setF] = useState<Partial<GpcParcelamento>>(initial ?? {
    processo_id: processoId,
    em_dia: false,
    parcelas_concluidas: false,
    autorizacoes_log: [],
  });

  const [saving, setSaving] = useState(false);

  const [err, setErr] = useState('');

  const set = (k: keyof GpcParcelamento, v: any) => setF(p => ({ ...p, [k]: v }));

  const n = (v: string) => v === '' ? null : Number(v);

  const needsGov = (f.parcelas ?? 0) > 60;

  const submit = async (e: React.FormEvent) => {

    e.preventDefault(); setSaving(true); setErr('');

    try { await onSave({ ...f, processo_id: processoId }); }

    catch (ex: any) { setErr(ex.message); setSaving(false); }

  };

  return (

    <form onSubmit={submit} className="space-y-5">

      {err && <div className="text-red-600 text-sm flex items-center gap-2"><AlertCircle size={14} />{err}</div>}

      {/* Tipo + dados básicos numa grid compacta */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className={LABEL}>Tipo *</label>
          <select
            className={INPUT}
            value={f.tipo_parcelamento ?? ''}
            onChange={e => set('tipo_parcelamento', (e.target.value || null) as any)}
          >
            <option value="">— selecione —</option>
            <option value="PARCELAMENTO">Parcelamento</option>
            <option value="REPARCELAMENTO">Reparcelamento</option>
          </select>
        </div>
        <div>
          <label className={LABEL}>Exercício</label>
          <input className={INPUT} type="number" placeholder="ex: 2024" value={f.exercicio ?? ''} onChange={e => set('exercicio', n(e.target.value))} />
        </div>
        <div>
          <label className={LABEL}>Nº de Parcelas</label>
          <input className={INPUT} type="number" min={1} placeholder="ex: 36" value={f.parcelas ?? ''} onChange={e => set('parcelas', n(e.target.value))} />
          {needsGov && (
            <p className="mt-1 text-[11px] text-amber-600 font-semibold flex items-center gap-1">
              <Star size={10} />Acima de 60 parcelas — requer Autorizo do Governador
            </p>
          )}
        </div>
        <div>
          <label className={LABEL}>Valor Parcelado (R$)</label>
          <CurrencyInput value={f.valor_parcelado} onChange={v => set('valor_parcelado', v)} />
        </div>
        <div>
          <label className={LABEL}>Valor Corrigido (R$)</label>
          <CurrencyInput value={f.valor_corrigido} onChange={v => set('valor_corrigido', v)} />
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-3">
        <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${f.em_dia ? 'bg-green-50 border-green-400' : 'bg-white border-slate-200'}`}>
          <input type="checkbox" checked={f.em_dia ?? false} onChange={e => set('em_dia', e.target.checked)} className="w-4 h-4 accent-green-600 rounded" />
          <div>
            <div className={`text-sm font-semibold ${f.em_dia ? 'text-green-700' : 'text-slate-600'}`}>Em Dia</div>
            <div className="text-[11px] text-slate-400">Parcelas em dia</div>
          </div>
        </label>
        <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${f.parcelas_concluidas ? 'bg-blue-50 border-blue-400' : 'bg-white border-slate-200'}`}>
          <input type="checkbox" checked={f.parcelas_concluidas ?? false} onChange={e => set('parcelas_concluidas', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
          <div>
            <div className={`text-sm font-semibold ${f.parcelas_concluidas ? 'text-blue-700' : 'text-slate-600'}`}>Concluído</div>
            <div className="text-[11px] text-slate-400">Parcelamento quitado</div>
          </div>
        </label>
      </div>

      {/* Providências e Observações */}
      <div className="space-y-3">
        <div><label className={LABEL}>Providências</label><textarea className={INPUT} rows={2} value={f.providencias ?? ''} onChange={e => set('providencias', e.target.value || null)} placeholder="Providências a adotar..." /></div>
        <div><label className={LABEL}>Observações</label><textarea className={INPUT} rows={2} value={f.obs ?? ''} onChange={e => set('obs', e.target.value || null)} placeholder="Informações adicionais..." /></div>
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



type ProdEvento = { registro_id: number; responsavel: string; evento: string; data_evento: string; obs?: string | null };

type Granularity = 'dia' | 'mes' | 'ano' | 'geral';



interface TechStats {

  responsavel: string;

  cadastros: number;      // CADASTRO events (not counted in total)

  analises: number;       // unique registro_ids with INICIO_ANALISE

  posicoes: number;       // POSICAO events

  movimentos: number;     // MOVIMENTO events

  total: number;          // analises + posicoes + movimentos (excludes cadastros)

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

  const map: Record<string, { cadastros: number; analises: Set<number>; posicoes: number; movimentos: number }> = {};

  for (const e of inPeriod) {

    if (!map[e.responsavel]) map[e.responsavel] = { cadastros: 0, analises: new Set(), posicoes: 0, movimentos: 0 };

    if (e.evento === 'CADASTRO')       map[e.responsavel].cadastros++;

    if (e.evento === 'INICIO_ANALISE') map[e.responsavel].analises.add(e.registro_id);

    if (e.evento === 'POSICAO')        map[e.responsavel].posicoes++;

    if (e.evento === 'MOVIMENTO')      map[e.responsavel].movimentos++;

  }

  return Object.entries(map).map(([responsavel, s]) => ({

    responsavel,

    cadastros:  s.cadastros,

    analises:   s.analises.size,

    posicoes:   s.posicoes,

    movimentos: s.movimentos,

    total:      s.analises.size + s.posicoes + s.movimentos, // cadastros NOT counted in total

  })).sort((a, b) => b.total - a.total);

}



const ProdutividadePage = ({ rows: allRows }: { rows: GpcRecebido[] }) => {

  const [events, setEvents] = useState<ProdEvento[]>([]);

  const [loading, setLoading] = useState(true);

  const [gran, setGran] = useState<Granularity>('mes');

  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7));

  const [fluxoResumo, setFluxoResumo] = useState<{

    tecnico: string; total_registros: number; total_paginas: number;

    tempo_medio_dias: number; ultimo_evento: string;

  }[]>([]);

  const [selectedTech, setSelectedTech] = useState<string | null>(null);



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



  // Merge stats + fluxoResumo into unified technician objects

  const technicians = useMemo(() => stats.map(s => {

    const fluxo = fluxoResumo.find(f => f.tecnico === s.responsavel);

    return {

      ...s,

      paginas: fluxo?.total_paginas ?? 0,

      tempMedio: fluxo?.tempo_medio_dias ?? 0,

      ultimoEvento: fluxo?.ultimo_evento ?? null,

      fluxoRegistros: fluxo?.total_registros ?? 0,

    };

  }), [stats, fluxoResumo]);



  // Events filtered to current period (for detail view)

  const inPeriodEvents = useMemo(() =>

    gran === 'geral' ? events : events.filter(e => periodoKey(e.data_evento, gran) === period),

    [events, gran, period]);



  // Processes worked by selected technician

  const techProcesses = useMemo(() => {

    if (!selectedTech) return [];

    const techEvts = inPeriodEvents.filter(e => e.responsavel === selectedTech);

    const map = new Map<number, ProdEvento[]>();

    for (const e of techEvts) {

      if (!map.has(e.registro_id)) map.set(e.registro_id, []);

      map.get(e.registro_id)!.push(e);

    }

    return [...map.entries()].map(([rid, evts]) => ({

      registro_id: rid,

      rec: allRows.find(r => r.codigo === rid) ?? null,

      events: evts.sort((a, b) => a.data_evento.localeCompare(b.data_evento)),

    })).sort((a, b) =>

      (b.events.at(-1)?.data_evento ?? '').localeCompare(a.events.at(-1)?.data_evento ?? ''));

  }, [selectedTech, inPeriodEvents, allRows]);



  // XLSX export: summary sheet + detail sheet

  const exportXLSX = () => {

    const wb = XLSX.utils.book_new();

    // Sheet 1: Resumo por técnico

    const h1 = ['Técnico', 'Cadastros', 'Processos Analisados', 'Avanços de Posição', 'Atualizações de Movimento',

      'Total de Ações', 'Ações no Fluxo', 'Páginas Analisadas', 'Efic. (pág/ação)', 'Tempo Médio (dias)', 'Último Registro'];

    const b1 = technicians.map(t => [

      t.responsavel, t.cadastros, t.analises, t.posicoes, t.movimentos, t.total,

      t.fluxoRegistros, t.paginas,

      t.fluxoRegistros > 0 ? Math.round(t.paginas / t.fluxoRegistros) : 0,

      t.tempMedio,

      t.ultimoEvento ? fmtTs(t.ultimoEvento) : '',

    ]);

    const ws1 = XLSX.utils.aoa_to_sheet([h1, ...b1]);

    ws1['!cols'] = [25, 20, 20, 24, 14, 14, 18, 16, 17, 20].map(w => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumo por Técnico');

    // Sheet 2: Detalhamento de eventos

    const h2 = ['Técnico', 'Data/Hora', 'Evento', 'Descrição', 'Processo', 'Entidade', 'Convênio', 'Exercício', 'Posição Atual'];

    const evtLbl = (e: string) =>

      e === 'INICIO_ANALISE' ? 'Início de Análise' : e === 'POSICAO' ? 'Avanço de Posição' : e === 'MOVIMENTO' ? 'Atualização de Movimento' : e;

    const b2 = inPeriodEvents.map(e => {

      const rec = allRows.find(r => r.codigo === e.registro_id);

      return [e.responsavel, fmtTs(e.data_evento), evtLbl(e.evento), e.obs ?? '', rec?.processo ?? '', rec?.entidade ?? '', rec?.convenio ?? '', rec?.exercicio ?? '', rec?.posicao ?? ''];

    });

    const ws2 = XLSX.utils.aoa_to_sheet([h2, ...b2]);

    ws2['!cols'] = [25, 18, 22, 40, 32, 35, 18, 10, 25].map(w => ({ wch: w }));

    XLSX.utils.book_append_sheet(wb, ws2, 'Detalhamento de Eventos');

    XLSX.writeFile(wb, `produtividade_gpc_${new Date().toISOString().slice(0, 10)}.xlsx`);

  };



  const Delta = ({ cur, prev }: { cur: number; prev: number }) => {

    if (!prev || gran === 'geral') return null;

    const d = cur - prev;

    if (d === 0) return <span className="text-xs text-slate-400 ml-1">= mesmo</span>;

    return (

      <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${d > 0 ? 'text-green-600' : 'text-red-500'}`}>

        {d > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}

        {d > 0 ? '+' : ''}{d} vs anterior

      </span>

    );

  };



  const evtInfo = (evento: string) => {

    if (evento === 'INICIO_ANALISE') return { label: 'Início de Análise', cls: 'text-sky-700 bg-sky-50 border-sky-200', dot: 'bg-sky-400' };

    if (evento === 'POSICAO')        return { label: 'Avanço de Posição', cls: 'text-amber-700 bg-amber-50 border-amber-200', dot: 'bg-amber-400' };

    if (evento === 'MOVIMENTO')      return { label: 'Atualização de Movimento', cls: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-400' };

    return { label: evento, cls: 'text-slate-600 bg-slate-50 border-slate-200', dot: 'bg-slate-300' };

  };



  if (loading) return (

    <div className="flex items-center justify-center py-16">

      <Loader2 size={24} className="animate-spin text-blue-400" />

    </div>

  );



  return (

    <div className="space-y-5">

      {/* Filter bar */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">

        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">

          {(['dia', 'mes', 'ano', 'geral'] as Granularity[]).map(g => (

            <button key={g} onClick={() => setGran(g)}

              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${gran === g ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>

              {g === 'dia' ? 'Dia' : g === 'mes' ? 'Mês' : g === 'ano' ? 'Ano' : 'Geral'}

            </button>

          ))}

        </div>

        {gran !== 'geral' && (

          <select className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"

            value={period} onChange={e => setPeriod(e.target.value)}>

            {allPeriods.map(p => <option key={p} value={p}>{fmtPeriodo(p, gran)}</option>)}

          </select>

        )}

        {prevPeriodStr && prevTotals.total > 0 && (

          <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-500">

            Anterior: <strong className="text-slate-700">{fmtPeriodo(prevPeriodStr, gran)}</strong>

            {' · '}{prevTotals.total} ações

          </div>

        )}

        <span className="ml-auto text-sm text-slate-400">

          {gran === 'geral' ? 'Todos os períodos' : fmtPeriodo(period, gran)}

          {' · '}<strong className="text-slate-600">{stats.length}</strong> técnico{stats.length !== 1 ? 's' : ''}

        </span>

        <button

          onClick={exportXLSX}

          disabled={!technicians.length}

          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-sm transition-colors disabled:opacity-50"

        >

          <Download size={14} />Exportar XLSX

        </button>

      </div>



      {/* KPI totals */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        <div className="bg-white rounded-2xl border border-sky-100 shadow-sm px-5 py-4">

          <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center mb-3">

            <Search size={18} className="text-sky-600" />

          </div>

          <div className="text-3xl font-black text-sky-700">{totals.analises.toLocaleString('pt-BR')}</div>

          <div className="text-xs font-bold text-slate-600 mt-1">Processos Analisados</div>

          <div className="text-xs text-slate-400 mt-0.5">início de análise no período</div>

          <Delta cur={totals.analises} prev={prevTotals.analises} />

        </div>

        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm px-5 py-4">

          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3">

            <TrendingUp size={18} className="text-amber-600" />

          </div>

          <div className="text-3xl font-black text-amber-700">{totals.posicoes.toLocaleString('pt-BR')}</div>

          <div className="text-xs font-bold text-slate-600 mt-1">Avanços de Posição</div>

          <div className="text-xs text-slate-400 mt-0.5">posições movimentadas</div>

          <Delta cur={totals.posicoes} prev={prevTotals.posicoes} />

        </div>

        <div className="bg-white rounded-2xl border border-purple-100 shadow-sm px-5 py-4">

          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3">

            <Activity size={18} className="text-purple-600" />

          </div>

          <div className="text-3xl font-black text-purple-700">{totals.movimentos.toLocaleString('pt-BR')}</div>

          <div className="text-xs font-bold text-slate-600 mt-1">Atualizações de Movimento</div>

          <div className="text-xs text-slate-400 mt-0.5">estágios registrados</div>

          <Delta cur={totals.movimentos} prev={prevTotals.movimentos} />

        </div>

        <div className="bg-white rounded-2xl border border-blue-100 shadow-sm px-5 py-4">

          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3">

            <BarChart2 size={18} className="text-blue-600" />

          </div>

          <div className="text-3xl font-black text-blue-700">{totals.total.toLocaleString('pt-BR')}</div>

          <div className="text-xs font-bold text-slate-600 mt-1">Total de Ações</div>

          <div className="text-xs text-slate-400 mt-0.5">todas as atividades</div>

          <Delta cur={totals.total} prev={prevTotals.total} />

        </div>

      </div>



      {/* Technician table */}

      {!technicians.length ? (

        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center">

          <BarChart2 size={40} className="mx-auto mb-3 text-slate-200" />

          <p className="text-slate-400 text-sm font-medium">Nenhuma atividade registrada neste período.</p>

          <p className="text-slate-300 text-xs mt-1">Selecione outro período ou altere a granularidade.</p>

        </div>

      ) : (

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">

            <User size={14} className="text-slate-400" />

            <span className="text-sm font-bold text-slate-700">Atividade por Técnico</span>

            <span className="ml-auto text-xs text-slate-400">clique em uma linha para ver os processos</span>

          </div>

          <table className="w-full text-sm">

            <thead>

              <tr className="border-b border-slate-100">

                <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Técnico</th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider" title="Processos cadastrados no sistema (não conta no total)">Cadastros</th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-sky-500 uppercase tracking-wider" title="Processos distintos com início de análise">Analisados</th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-amber-500 uppercase tracking-wider" title="Avanços de posição registrados">Posições</th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-purple-500 uppercase tracking-wider" title="Atualizações de movimento">Movimentos</th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-blue-500 uppercase tracking-wider">Total</th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Páginas</th>

                <th className="px-4 py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tempo Médio</th>

                <th className="px-5 py-2.5 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider min-w-[140px]">Composição</th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {technicians.map(t => {

                const totalComposition = t.analises + t.posicoes + t.movimentos;

                const pct = totals.total > 0 ? Math.round((t.total / totals.total) * 100) : 0;

                const efic = t.fluxoRegistros > 0 ? Math.round(t.paginas / t.fluxoRegistros) : 0;

                const diasUltimo = t.ultimoEvento

                  ? Math.round((Date.now() - new Date(t.ultimoEvento).getTime()) / 86400000)

                  : null;

                return (

                  <tr

                    key={t.responsavel}

                    onClick={() => setSelectedTech(t.responsavel)}

                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group"

                  >

                    {/* Técnico */}

                    <td className="px-5 py-3">

                      <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">

                          {t.responsavel.charAt(0).toUpperCase()}

                        </div>

                        <div>

                          <div className="font-semibold text-slate-800 leading-tight">{t.responsavel}</div>

                          {diasUltimo !== null && (

                            <div className={`text-[11px] ${diasUltimo === 0 ? 'text-green-600 font-semibold' : diasUltimo <= 3 ? 'text-green-500' : diasUltimo <= 7 ? 'text-amber-500' : 'text-slate-400'}`}>

                              {diasUltimo === 0 ? '? Ativo hoje' : `Ativo há ${diasUltimo}d`}

                            </div>

                          )}

                        </div>

                      </div>

                    </td>

                    {/* Cadastros */}

                    <td className="px-4 py-3 text-center">

                      {t.cadastros > 0

                        ? <span className="inline-block min-w-[32px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded-lg text-sm font-semibold">{t.cadastros}</span>

                        : <span className="text-slate-300">—</span>}

                    </td>

                    {/* Analisados */}

                    <td className="px-4 py-3 text-center">

                      <span className="inline-block min-w-[32px] px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg text-sm font-bold">{t.analises}</span>

                    </td>

                    {/* Posições */}

                    <td className="px-4 py-3 text-center">

                      <span className="inline-block min-w-[32px] px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-bold">{t.posicoes}</span>

                    </td>

                    {/* Movimentos */}

                    <td className="px-4 py-3 text-center">

                      <span className="inline-block min-w-[32px] px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-bold">{t.movimentos}</span>

                    </td>

                    {/* Total */}

                    <td className="px-4 py-3 text-center">

                      <div className="flex flex-col items-center gap-0.5">

                        <span className="inline-block min-w-[32px] px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold">{t.total}</span>

                        <span className="text-[10px] text-slate-400 font-semibold">{pct}%</span>

                      </div>

                    </td>

                    {/* Páginas */}

                    <td className="px-4 py-3 text-center text-sm text-slate-600 font-medium">

                      {t.paginas > 0 ? t.paginas.toLocaleString('pt-BR') : <span className="text-slate-300">—</span>}

                      {efic > 0 && <div className="text-[10px] text-slate-400">{efic} pág/ação</div>}

                    </td>

                    {/* Tempo Médio */}

                    <td className="px-4 py-3 text-center">

                      {t.tempMedio > 0 ? (

                        <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-bold ${t.tempMedio <= 5 ? 'bg-green-50 text-green-700' : t.tempMedio <= 15 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>

                          {t.tempMedio}d

                        </span>

                      ) : <span className="text-slate-300 text-sm">—</span>}

                    </td>

                    {/* Composição */}

                    <td className="px-5 py-3">

                      {totalComposition > 0 ? (

                        <div className="space-y-1">

                          <div className="flex h-2 rounded-full overflow-hidden gap-px">

                            {t.analises   > 0 && <div style={{ width: `${(t.analises   / totalComposition) * 100}%` }} className="bg-sky-400" />}

                            {t.posicoes   > 0 && <div style={{ width: `${(t.posicoes   / totalComposition) * 100}%` }} className="bg-amber-400" />}

                            {t.movimentos > 0 && <div style={{ width: `${(t.movimentos / totalComposition) * 100}%` }} className="bg-purple-400" />}

                          </div>

                          <div className="flex h-1.5 rounded-full bg-slate-100 overflow-hidden">

                            <div className="h-full rounded-full bg-blue-300 transition-all" style={{ width: `${pct}%` }} />

                          </div>

                        </div>

                      ) : <div className="h-2 rounded-full bg-slate-100" />}

                    </td>

                  </tr>

                );

              })}

            </tbody>

            <tfoot className="border-t-2 border-slate-100 bg-slate-50/60">

              <tr>

                <td className="px-5 py-2.5 text-xs font-bold text-slate-500">Total geral</td>

                <td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 bg-sky-50 text-sky-700 rounded-lg text-xs font-bold">{totals.analises}</span></td>

                <td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold">{totals.posicoes}</span></td>

                <td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold">{totals.movimentos}</span></td>

                <td className="px-4 py-2.5 text-center"><span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">{totals.total}</span></td>

                <td colSpan={3} className="px-4 py-2.5" />

              </tr>

            </tfoot>

          </table>

          {/* Legend */}

          <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 px-5 py-3 border-t border-slate-100">

            <span className="font-semibold text-slate-500">Composição:</span>

            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-sky-400 inline-block" />Processos analisados</span>

            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-amber-400 inline-block" />Avanços de posição</span>

            <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded bg-purple-400 inline-block" />Atualizações de movimento</span>

            <span className="ml-auto flex items-center gap-1">Tempo: <span className="text-green-600 font-semibold">=5d rápido</span> · <span className="text-amber-600 font-semibold">=15d regular</span> · <span className="text-red-600 font-semibold">&gt;15d lento</span></span>

          </div>

        </div>

      )}



      {/* Technician detail drawer */}

      {selectedTech && (() => {

        const st = technicians.find(t => t.responsavel === selectedTech);

        const efic = (st?.fluxoRegistros ?? 0) > 0 ? Math.round((st?.paginas ?? 0) / (st?.fluxoRegistros ?? 1)) : 0;

        return (

          <div className="fixed inset-0 z-50 flex">

            <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedTech(null)} />

            <div className="w-full max-w-2xl bg-white h-full flex flex-col overflow-hidden shadow-2xl">

              {/* Drawer header */}

              <div className="flex items-center gap-4 p-5 border-b border-slate-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">

                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-2xl font-black shadow-md flex-shrink-0">

                  {selectedTech.charAt(0).toUpperCase()}

                </div>

                <div className="flex-1 min-w-0">

                  <div className="font-black text-slate-800 text-lg leading-tight truncate">{selectedTech}</div>

                  <div className="text-xs text-slate-500 mt-0.5">{gran === 'geral' ? 'Todos os períodos' : fmtPeriodo(period, gran)}</div>

                </div>

                <button onClick={() => setSelectedTech(null)} className="p-2 rounded-xl hover:bg-white text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0">

                  <X size={18} />

                </button>

              </div>

              {/* Summary metrics */}

              {st && (

                <>

                  <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100 flex-shrink-0">

                    {[

                      { label: 'Analisados', value: st.analises, color: 'text-sky-700', bg: 'bg-sky-50' },

                      { label: 'Posições', value: st.posicoes, color: 'text-amber-700', bg: 'bg-amber-50' },

                      { label: 'Movimentos', value: st.movimentos, color: 'text-purple-700', bg: 'bg-purple-50' },

                      { label: 'Total', value: st.total, color: 'text-blue-700', bg: 'bg-blue-50' },

                    ].map(m => (

                      <div key={m.label} className={`${m.bg} py-3 text-center`}>

                        <div className={`text-2xl font-black ${m.color}`}>{m.value}</div>

                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{m.label}</div>

                      </div>

                    ))}

                  </div>

                  {(st.paginas > 0 || st.tempMedio > 0) && (

                    <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 flex-shrink-0">

                      <div className="py-3 text-center">

                        <div className="text-lg font-black text-slate-700">{st.paginas.toLocaleString('pt-BR')}</div>

                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Páginas Analisadas</div>

                      </div>

                      <div className="py-3 text-center">

                        <div className="text-lg font-black text-slate-700">{efic > 0 ? `${efic}` : '—'}</div>

                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Pág / Ação no Fluxo</div>

                      </div>

                      <div className="py-3 text-center">

                        <div className={`text-lg font-black ${st.tempMedio === 0 ? 'text-slate-400' : st.tempMedio <= 5 ? 'text-green-600' : st.tempMedio <= 15 ? 'text-amber-600' : 'text-red-600'}`}>

                          {st.tempMedio === 0 ? '< 1 dia' : `${st.tempMedio} dia${st.tempMedio !== 1 ? 's' : ''}`}

                        </div>

                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">

                          {st.tempMedio <= 5 ? '? Tempo Rápido' : st.tempMedio <= 15 ? '~ Tempo Regular' : '! Tempo Lento'}

                        </div>

                      </div>

                    </div>

                  )}

                </>

              )}

              {/* Process list */}

              <div className="flex-1 overflow-y-auto p-5">

                {techProcesses.length === 0 ? (

                  <div className="text-center py-12">

                    <Search size={32} className="mx-auto mb-3 text-slate-200" />

                    <p className="text-slate-400 text-sm">Nenhum processo encontrado para este período.</p>

                  </div>

                ) : (

                  <div className="space-y-3">

                    <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">

                      {techProcesses.length} processo{techProcesses.length !== 1 ? 's' : ''} trabalhado{techProcesses.length !== 1 ? 's' : ''} no período

                    </div>

                    {techProcesses.map(p => (

                      <div key={p.registro_id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">

                        {/* Process header */}

                        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-100">

                          <div className="flex items-start gap-3">

                            <FileText size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />

                            <div className="flex-1 min-w-0">

                              <div className="font-bold text-blue-700 font-mono text-sm leading-tight">

                                {p.rec?.processo ?? `Registro #${p.registro_id}`}

                              </div>

                              {p.rec?.entidade && (

                                <div className="text-xs text-slate-600 mt-0.5 truncate">{p.rec.entidade}</div>

                              )}

                              <div className="flex flex-wrap gap-2 mt-1.5">

                                {p.rec?.convenio && (

                                  <span className="text-xs text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Conv. {p.rec.convenio}</span>

                                )}

                                {p.rec?.exercicio && (

                                  <span className="text-xs text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Exerc. {p.rec.exercicio}</span>

                                )}

                                {p.rec?.posicao && (

                                  <span className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded px-1.5 py-0.5">{p.rec.posicao}</span>

                                )}

                                {p.rec?.responsavel && (

                                  <span className="text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded px-1.5 py-0.5">Resp: {p.rec.responsavel}</span>

                                )}

                              </div>

                            </div>

                            <span className="text-xs text-slate-400 flex-shrink-0 bg-slate-100 rounded-lg px-2 py-1">

                              {p.events.length} evento{p.events.length !== 1 ? 's' : ''}

                            </span>

                          </div>

                        </div>

                        {/* Events timeline */}

                        <div className="px-4 py-3 space-y-2.5">

                          {p.events.map((e, i) => {

                            const { label, cls, dot } = evtInfo(e.evento);

                            return (

                              <div key={i} className="flex items-start gap-2.5">

                                <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dot}`} />

                                <div className="flex-1 min-w-0">

                                  <div className="flex flex-wrap items-center gap-1.5">

                                    <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-md border ${cls}`}>{label}</span>

                                    <span className="text-xs text-slate-400">{fmtTs(e.data_evento)}</span>

                                  </div>

                                  {e.obs && (

                                    <div className="text-xs text-slate-500 mt-1 leading-relaxed">{e.obs}</div>

                                  )}

                                </div>

                              </div>

                            );

                          })}

                        </div>

                      </div>

                    ))}

                  </div>

                )}

              </div>

            </div>

          </div>

        );

      })()}

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

          posObsText = `${posLabelPrev || 'posição anterior'} ? ${posLabel || 'nova posição'}. Tempo na posição: ${dias} dia${dias !== 1 ? 's' : ''}`;

        } else {

          posObsText = `${posLabelPrev || 'posição anterior'} ? ${posLabel || 'nova posição'}`;

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

            obsText = `${prev.movimento} ? ${form.movimento}. Tempo em análise: ${dias} dia${dias !== 1 ? 's' : ''}`;

          } else {

            obsText = `${prev.movimento} ? ${form.movimento}`;

          }

        } else {

          obsText = `${prev.movimento ?? '-'} ? ${form.movimento}`;

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

    emAnalise: rows.filter(r => r.movimento === 'EM ANÁLISE').length,

    acima: rows.filter(r => r.remessa === 'ACIMA').length,

    parcelamentos: rows.filter(r => !!r.is_parcelamento).length,

    semResponsavel: rows.filter(r => !r.responsavel).length,

    regulares: rows.filter(r => r.situacao === 'REGULAR').length,

    irregulares: rows.filter(r => r.situacao === 'IRREGULAR').length,

    parcialmente: rows.filter(r => r.situacao === 'PARCIALMENTE_REGULAR').length,

    semSituacao: rows.filter(r => !r.situacao).length,

  }), [rows]);



  return (

    <div className="space-y-6">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">

        <div>

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Grupo de Prestação de Contas</h2>

          <p className="text-sm text-slate-500 mt-0.5">

            {mainTab === 'registros'

              ? `${filtered.length.toLocaleString('pt-BR')} de ${rows.length.toLocaleString('pt-BR')} registros`

              : 'Produtividade mensal por técnico'}

          </p>

        </div>

        {mainTab === 'registros' && (

          <div className="flex items-center gap-2.5">

            <button

              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white text-emerald-700 rounded-xl border border-emerald-200 hover:bg-emerald-50 shadow-sm transition-all active:scale-95"

              onClick={exportXLSX}

            >

              <Download size={15} />Exportar XLSX

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

            {/* Total */}

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 flex items-center gap-4">

              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center flex-shrink-0 shadow-inner">

                <FileText size={20} className="text-slate-500" />

              </div>

              <div className="flex-1 min-w-0">

                <div className="text-3xl font-black text-slate-800 leading-none tracking-tight">{stats.total.toLocaleString('pt-BR')}</div>

                <div className="text-xs font-semibold text-slate-500 mt-1">Total de Processos</div>

              </div>

            </div>

            {/* Em Análise */}

            <div className="bg-white rounded-2xl border border-sky-100 shadow-sm px-5 py-4 flex items-center gap-4">

              <div className="w-12 h-12 rounded-2xl bg-sky-50 flex items-center justify-center flex-shrink-0 shadow-inner">

                <Search size={20} className="text-sky-500" />

              </div>

              <div className="flex-1 min-w-0">

                <div className="text-3xl font-black text-sky-700 leading-none tracking-tight">{stats.emAnalise.toLocaleString('pt-BR')}</div>

                <div className="text-xs font-semibold text-slate-500 mt-1">Em Análise</div>

                <div className="text-[11px] text-sky-400 font-medium mt-0.5">{stats.total > 0 ? Math.round((stats.emAnalise / stats.total) * 100) : 0}% do total</div>

              </div>

            </div>

            {/* Acima de Remessa */}

            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm px-5 py-4 flex items-center gap-4">

              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center flex-shrink-0 shadow-inner">

                <ArrowUp size={20} className="text-indigo-500" />

              </div>

              <div className="flex-1 min-w-0">

                <div className="text-3xl font-black text-indigo-700 leading-none tracking-tight">{stats.acima.toLocaleString('pt-BR')}</div>

                <div className="text-xs font-semibold text-slate-500 mt-1">Acima de Remessa</div>

                <div className="text-[11px] text-indigo-400 font-medium mt-0.5">{stats.total > 0 ? Math.round((stats.acima / stats.total) * 100) : 0}% do total</div>

              </div>

            </div>

            {/* Parcelamentos */}

            <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm px-5 py-4 flex items-center gap-4">

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center flex-shrink-0 shadow-inner">

                <DollarSign size={20} className="text-emerald-500" />

              </div>

              <div className="flex-1 min-w-0">

                <div className="text-3xl font-black text-emerald-700 leading-none tracking-tight">{stats.parcelamentos.toLocaleString('pt-BR')}</div>

                <div className="text-xs font-semibold text-slate-500 mt-1">Parcelamentos</div>

                <div className="text-[11px] text-emerald-400 font-medium mt-0.5">{stats.total > 0 ? Math.round((stats.parcelamentos / stats.total) * 100) : 0}% do total</div>

              </div>

            </div>

          </div>



          {/* Situação breakdown — subtle inline row */}

          {(stats.regulares + stats.irregulares + stats.parcialmente) > 0 && (() => {

            const totalAval = stats.regulares + stats.irregulares + stats.parcialmente;

            const regPct = totalAval > 0 ? Math.round((stats.regulares / totalAval) * 100) : 0;

            const parPct = totalAval > 0 ? Math.round((stats.parcialmente / totalAval) * 100) : 0;

            const irrPct = totalAval > 0 ? Math.round((stats.irregulares / totalAval) * 100) : 0;

            return (

              <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">

                <ShieldCheck size={13} className="text-slate-400 flex-shrink-0" />

                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">Situação</span>

                <div className="flex h-1.5 flex-1 rounded-full overflow-hidden gap-px">

                  {stats.regulares   > 0 && <div style={{ width: `${regPct}%` }} className="bg-green-400" title={`${stats.regulares} regulares`} />}

                  {stats.parcialmente > 0 && <div style={{ width: `${parPct}%` }} className="bg-amber-400" title={`${stats.parcialmente} parcialmente`} />}

                  {stats.irregulares  > 0 && <div style={{ width: `${irrPct}%` }} className="bg-red-400" title={`${stats.irregulares} irregulares`} />}

                </div>

                <div className="flex items-center gap-3 flex-shrink-0">

                  <span className="flex items-center gap-1 text-[11px] text-green-700 font-semibold">

                    <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />{stats.regulares} reg.

                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">

                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />{stats.parcialmente} parc.

                  </span>

                  <span className="flex items-center gap-1 text-[11px] text-red-700 font-semibold">

                    <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />{stats.irregulares} irreg.

                  </span>

                  {stats.semSituacao > 0 && (

                    <span className="text-[11px] text-slate-400">{stats.semSituacao} s/ avaliação</span>

                  )}

                </div>

              </div>

            );

          })()}

        </div>

      )}



      {/* Main tabs */}

      <div className="flex items-center gap-0 bg-slate-100 rounded-2xl p-1">

        <button

          onClick={() => setMainTab('registros')}

          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === 'registros' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}

        >

          <FileText size={14} className={mainTab === 'registros' ? 'text-blue-600' : 'text-slate-400'} />

          Processos

          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${mainTab === 'registros' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{rows.length}</span>

        </button>

        <button

          onClick={() => setMainTab('parcelamentos')}

          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === 'parcelamentos' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}

        >

          <DollarSign size={14} className={mainTab === 'parcelamentos' ? 'text-green-600' : 'text-slate-400'} />

          Parcelamentos

          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${mainTab === 'parcelamentos' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>{rows.filter(r => !!r.is_parcelamento).length}</span>

        </button>

        <button

          onClick={() => setMainTab('produtividade')}

          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === 'produtividade' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}

        >

          <BarChart2 size={14} className={mainTab === 'produtividade' ? 'text-amber-600' : 'text-slate-400'} />

          Produtividade

        </button>

      </div>



      {mainTab === 'produtividade' && <ProdutividadePage rows={rows} />}



      {(mainTab === 'registros' || mainTab === 'parcelamentos') && (

        <>

          {/* -- Filter Panel -- */}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">

              <div className="flex items-center gap-2">

                <Search size={13} className="text-slate-400" />

                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filtros</span>

                {Object.values(filters).some(Boolean) && (

                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">

                    {Object.values(filters).filter(Boolean).length} ativo{Object.values(filters).filter(Boolean).length !== 1 ? 's' : ''}

                  </span>

                )}

              </div>

              {Object.values(filters).some(Boolean) && (

                <button

                  onClick={() => setFilters({ processo: '', convenio: '', entidade: '', exercicio: '', drs: '', responsavel: '', posicao_id: '', movimento: '', remessa: '', situacao: '' })}

                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"

                >

                  <X size={11} />Limpar filtros

                </button>

              )}

            </div>

            <div className="p-4 space-y-3">

              {/* Row 1 */}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                <div>

                  <label className={LABEL}>Processo</label>

                  <input className={INPUT + ' py-2 text-xs'} placeholder="filtrar..." value={filters.processo} onChange={e => setF('processo', e.target.value)} />

                </div>

                <div>

                  <label className={LABEL}>Convênio</label>

                  <input className={INPUT + ' py-2 text-xs'} placeholder="filtrar..." value={filters.convenio} onChange={e => setF('convenio', e.target.value)} />

                </div>

                <div>

                  <label className={LABEL}>Entidade</label>

                  <input className={INPUT + ' py-2 text-xs'} placeholder="filtrar..." value={filters.entidade} onChange={e => setF('entidade', e.target.value)} />

                </div>

                <div>

                  <label className={LABEL}>Exercício</label>

                  <input className={INPUT + ' py-2 text-xs'} placeholder="ano" value={filters.exercicio} onChange={e => setF('exercicio', e.target.value)} />

                </div>

              </div>

              {/* Row 2 */}

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">

                <div>

                  <label className={LABEL}>DRS</label>

                  <input className={INPUT + ' py-2 text-xs'} placeholder="nº" value={filters.drs} onChange={e => setF('drs', e.target.value)} />

                </div>

                <div>

                  <label className={LABEL}>Analista</label>

                  <input className={INPUT + ' py-2 text-xs'} placeholder="nome..." value={filters.responsavel} onChange={e => setF('responsavel', e.target.value)} />

                </div>

                <div>

                  <label className={LABEL}>Posição</label>

                  <select className={INPUT + ' py-2 text-xs'} value={filters.posicao_id} onChange={e => setF('posicao_id', e.target.value)}>

                    <option value="">Todas</option>

                    {posicoes.map(p => <option key={p.codigo} value={String(p.codigo)}>{p.posicao}</option>)}

                  </select>

                </div>

                <div>

                  <label className={LABEL}>Movimento</label>

                  <input className={INPUT + ' py-2 text-xs'} placeholder="filtrar..." value={filters.movimento} onChange={e => setF('movimento', e.target.value)} />

                </div>

                <div>

                  <label className={LABEL}>Situação</label>

                  <select className={INPUT + ' py-2 text-xs'} value={filters.situacao} onChange={e => setF('situacao', e.target.value)}>

                    <option value="">Todas</option>

                    <option value="REGULAR">Regular</option>

                    <option value="PARCIALMENTE_REGULAR">Parcialmente Regular</option>

                    <option value="IRREGULAR">Irregular</option>

                  </select>

                </div>

              </div>

            </div>

            {Object.values(filters).some(Boolean) && (

              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">

                <strong className="text-slate-600">{filtered.length.toLocaleString('pt-BR')}</strong> resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}

              </div>

            )}

          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">

            {loading ? (

              <div className="flex items-center justify-center py-20">

                <Loader2 size={28} className="animate-spin text-blue-400" />

              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full text-sm">

                  <thead>

                    <tr className="bg-slate-50/80 border-b border-slate-100">

                      <SortTh label="Processo"    col="processo"    sort={sort} onSort={toggleSort} />

                      <SortTh label="Convênio"    col="convenio"    sort={sort} onSort={toggleSort} />

                      <SortTh label="Entidade"    col="entidade"    sort={sort} onSort={toggleSort} />

                      <SortTh label="Exer."       col="exercicio"   sort={sort} onSort={toggleSort} cls="w-16" />

                      <SortTh label="DRS"         col="drs"         sort={sort} onSort={toggleSort} cls="w-14" />

                      <SortTh label="Data"        col="data"        sort={sort} onSort={toggleSort} cls="w-24" />

                      <SortTh label="Cadastro / Analistas" col="responsavel" sort={sort} onSort={toggleSort} />

                      <SortTh label="Posição"     col="posicao"     sort={sort} onSort={toggleSort} />

                      <SortTh label="Movimento"   col="movimento"   sort={sort} onSort={toggleSort} />

                      <SortTh label="Remessa"     col="remessa"     sort={sort} onSort={toggleSort} cls="w-24" />

                      <SortTh label="Situação"    col="situacao"    sort={sort} onSort={toggleSort} />

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

                          className={`transition-all cursor-pointer group ${

                            rowIdx % 2 === 0 ? 'bg-white hover:bg-blue-50/40' : 'bg-slate-50/50 hover:bg-blue-50/40'

                          } ${r.situacao === 'IRREGULAR' ? 'border-l-[3px] border-l-red-400' : r.situacao === 'PARCIALMENTE_REGULAR' ? 'border-l-[3px] border-l-amber-400' : r.situacao === 'REGULAR' ? 'border-l-[3px] border-l-green-400' : ''}`}

                          onClick={() => setViewRow(r)}

                        >

                          {/* Processo + Entidade stacked */}

                          <td className="px-4 py-4 min-w-[200px]">

                            <div className="flex flex-col gap-1">

                              <div className="flex items-center gap-1.5">

                                <span className="font-bold text-blue-700 text-xs font-mono tracking-tight">

                                  {r.processo ?? '-'}

                                </span>

                                {r.link_processo && (

                                  <a href={r.link_processo} target="_blank" rel="noopener noreferrer"

                                    className="text-blue-300 hover:text-blue-500 transition-colors flex-shrink-0"

                                    title="Abrir link" onClick={e => e.stopPropagation()}>

                                    <ExternalLink size={11} />

                                  </a>

                                )}

                                {isDupe && (

                                  <span className="text-[10px] text-purple-500 flex items-center gap-0.5 flex-shrink-0" title={`${dupes.length} registros com este número`}>

                                    <Info size={9} />{dupes.length}x

                                  </span>

                                )}

                              </div>

                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">

                                {r.is_parcelamento && (

                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5">

                                    <DollarSign size={8} />Parcela

                                  </span>

                                )}

                                {prevPositions.map((p, i) => (

                                  <span key={i} className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5">

                                    <Clock size={8} />Ant: {p}

                                  </span>

                                ))}

                              </div>

                            </div>

                          </td>

                          <td className="px-3 py-4 text-slate-500 whitespace-nowrap text-xs">{r.convenio ?? '-'}</td>

                          {/* Entidade moved into processo cell */}

                          <td className="px-3 py-4 text-slate-600 text-xs max-w-[180px]">

                            <span className="line-clamp-2" title={r.entidade ?? ''}>{r.entidade ?? '—'}</span>

                          </td>

                          <td className="px-3 py-4 text-center">

                            <span className="inline-block bg-slate-100 text-slate-700 rounded-lg px-2 py-0.5 text-xs font-bold">{r.exercicio ?? '—'}</span>

                          </td>

                          <td className="px-3 py-4 text-center text-slate-500 text-xs font-medium">{r.drs ?? '—'}</td>

                          <td className="px-3 py-4 whitespace-nowrap text-slate-400 text-xs">{fmtDate(r.data)}</td>

                          <td className="px-3 py-4 min-w-[160px]">

                            {/* Cadastrado por */}

                            {(r.responsavel_cadastro || r.responsavel) && (

                              <div className="flex items-center gap-1.5 mb-1.5">

                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 shadow-sm">

                                  {(r.responsavel_cadastro || r.responsavel)!.charAt(0).toUpperCase()}

                                </div>

                                <span className="text-xs text-slate-600 font-medium truncate max-w-[110px]" title={r.responsavel_cadastro || r.responsavel || ''}>

                                  {r.responsavel_cadastro || r.responsavel}

                                </span>

                              </div>

                            )}

                            {/* Analistas */}

                            {(r.responsaveis_analise ?? []).length > 0 ? (

                              <div className="flex flex-wrap gap-1">

                                {(r.responsaveis_analise ?? []).slice(0, 2).map(a => (

                                  <span key={a} className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 text-sky-700 rounded-full text-[10px] font-semibold border border-sky-200 shadow-sm" title={a}>

                                    <div className="w-3.5 h-3.5 rounded-full bg-sky-400 text-white flex items-center justify-center text-[8px] font-bold flex-shrink-0">

                                      {a.charAt(0).toUpperCase()}

                                    </div>

                                    {a.split(' ')[0]}

                                  </span>

                                ))}

                                {(r.responsaveis_analise ?? []).length > 2 && (

                                  <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-semibold border border-slate-200">

                                    +{(r.responsaveis_analise ?? []).length - 2}

                                  </span>

                                )}

                              </div>

                            ) : (!(r.responsavel_cadastro || r.responsavel) && (

                              <span className="text-slate-300 text-xs">—</span>

                            ))}

                          </td>

                          <td className="px-3 py-3">

                            <PosicaoBadge id={r.posicao_id} label={r.posicao ?? null} />

                          </td>

                          <td className="px-3 py-4">

                            <MovimentoBadge movimento={r.movimento} />

                          </td>

                          <td className="px-3 py-4 text-xs text-center">

                            {r.remessa === 'ACIMA' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"><ArrowUp size={9} />Acima</span>}

                            {r.remessa === 'ABAIXO' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200"><ArrowDown size={9} />Abaixo</span>}

                            {!r.remessa && <span className="text-slate-200">—</span>}

                          </td>

                          <td className="px-3 py-3">

                            <SituacaoBadge situacao={r.situacao} compact />

                            {(r.situacao === 'IRREGULAR' || r.situacao === 'PARCIALMENTE_REGULAR') && (r.valor_a_devolver ?? 0) > 0 && (

                              <div className="mt-0.5 text-xs text-red-600 font-medium">

                                {r.valor_devolvido != null && r.valor_devolvido >= (r.valor_a_devolver ?? 0)

                                  ? <span className="text-green-600">? Quitado</span>

                                  : <span>Pend: {fmt((r.valor_a_devolver ?? 0) - (r.valor_devolvido ?? 0))}</span>}

                              </div>

                            )}

                          </td>

                          <td className="px-3 py-4">

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150" onClick={e => e.stopPropagation()}>

                              <button

                                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 transition-colors shadow-sm"

                                title="Ver detalhes"

                                onClick={() => setViewRow(r)}

                              >

                                <Eye size={13} />

                              </button>

                              <button

                                className="p-2 rounded-xl bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"

                                title="Editar"

                                onClick={() => setModal({ data: r })}

                              >

                                <Edit size={13} />

                              </button>

                              <button

                                className="p-2 rounded-xl bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors shadow-sm"

                                title="Excluir"

                                onClick={() => handleDelete(r.codigo)}

                              >

                                <Trash2 size={13} />

                              </button>

                            </div>

                          </td>

                        </tr>

                      );

                    })}

                    {!paged.length && (

                      <tr>

                        <td colSpan={12} className="py-24 text-center">

                          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">

                            <Search size={24} className="text-slate-300" />

                          </div>

                          <p className="text-slate-500 text-sm font-semibold">Nenhum registro encontrado</p>

                          <p className="text-slate-300 text-xs mt-1.5">Ajuste os filtros ou cadastre um novo processo</p>

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

          onBackToView={modal.data ? (rec) => { setModal(null); setViewRow(rec); } : undefined}

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

