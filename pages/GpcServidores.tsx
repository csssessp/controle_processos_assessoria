import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Search, Plus, Edit, Trash2, X, Check, Loader2, AlertCircle, AlertTriangle,
  FolderOpen, ShieldAlert, Clock,
} from 'lucide-react';
import { GpcService } from '../services/gpcService';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { nomeDRSPorNumero, DRS_NOMES_ORDENADOS } from '../services/ggconMunicipios';
import { GpcServidor } from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const TIPO_LABELS: Record<GpcServidor['tipo'], string> = {
  PUBLICACAO_DOE: 'Publicação DOE',
  REQUISICAO: 'Requisição',
};

// Prazo de alerta: menos de 10 dias para o vencimento (ou já vencido).
const DIAS_ALERTA = 10;

const diasAte = (d: string | null | undefined): number | null => {
  if (!d) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(d.slice(0, 10) + 'T00:00:00');
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
};

const PrazoBadge = ({ prazo }: { prazo: string | null }) => {
  if (!prazo) return <span className="text-slate-300 text-xs">-</span>;
  const dias = diasAte(prazo)!;
  const cfg = dias < 0
    ? { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: `Vencido há ${Math.abs(dias)}d` }
    : dias < DIAS_ALERTA
    ? { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: dias === 0 ? 'Vence hoje' : `Faltam ${dias}d` }
    : { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', label: fmtDate(prazo) };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
};

// ─── shared styles (mesmo padrão de GpcRecebidos.tsx) ──────────────────────────

const INPUT = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300';
const LABEL = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm';

// ─── KPI Card (mesmo padrão de GpcRelatorios.tsx) ──────────────────────────────

const KpiCard = ({
  label, value, icon: Icon, color,
}: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} shrink-0`}>
      <Icon size={20} className="text-white" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5 truncate">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
    </div>
  </div>
);

// ─── Multi-select de responsáveis (mesma lógica/estilo de MultiSelectChips em
// GpcProcessos_v2.tsx) — busca na lista real de usuários GPC do sistema, não
// texto livre, podendo adicionar um ou vários. ──────────────────────────────

const MultiSelectResponsaveis = ({ options, selected, onChange }: {
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (v: string[]) => void;
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
        {selected.length === 0 && <span className="text-slate-300 text-sm">— clique para adicionar responsável —</span>}
        {available.length > 0 && (
          <span className="ml-auto text-xs text-blue-500 flex items-center gap-1 self-center">
            <Plus size={11} />Adicionar
          </span>
        )}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Selecionar responsável</div>
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
            <div className="px-3 py-3 text-xs text-slate-400 text-center">Todos os usuários já foram adicionados</div>
          )}
        </div>
      )}
    </div>
  );
};

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

const ServidorForm = ({ initial, defaultTipo, gpcUsers, onSave, onClose }: {
  initial?: Partial<GpcServidor>;
  defaultTipo: GpcServidor['tipo'];
  gpcUsers: { id: string; name: string }[];
  onSave: (s: Partial<GpcServidor>) => Promise<void>;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GpcServidor>>(initial ?? { tipo: defaultTipo, responsaveis: [] });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GpcServidor, v: any) => setForm(f => ({ ...f, [k]: v }));

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
        <div className="col-span-2">
          <label className={LABEL}>Tipo</label>
          <select className={INPUT} value={form.tipo ?? defaultTipo} onChange={e => set('tipo', e.target.value)} required>
            <option value="PUBLICACAO_DOE">Publicação DOE</option>
            <option value="REQUISICAO">Requisição</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Processo TCE</label>
          <input className={INPUT} value={form.processo_tce ?? ''} onChange={e => set('processo_tce', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Beneficiário</label>
          <input className={INPUT} value={form.beneficiario ?? ''} onChange={e => set('beneficiario', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>Convênio</label>
          <input className={INPUT} value={form.convenio ?? ''} onChange={e => set('convenio', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>DRS</label>
          <select className={INPUT} value={form.drs ?? ''} onChange={e => set('drs', e.target.value ? Number(e.target.value) : null)}>
            <option value="">— selecione —</option>
            {DRS_NOMES_ORDENADOS.map((nome, i) => (
              <option key={nome} value={i + 1}>{nome}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>Exercício</label>
          <input className={INPUT} value={form.exercicio ?? ''} onChange={e => set('exercicio', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>Qtde. Volumes</label>
          <input className={INPUT} type="number" min={0} value={form.qtde_volumes ?? ''} onChange={e => set('qtde_volumes', e.target.value ? Number(e.target.value) : null)}/>
        </div>
        <div>
          <label className={LABEL}>Prazo</label>
          <input className={INPUT} type="date" value={form.prazo ?? ''} onChange={e => set('prazo', e.target.value || null)}/>
          <p className="mt-1 text-[11px] text-slate-400">Alerta automático quando faltarem menos de {DIAS_ALERTA} dias</p>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Responsáveis</label>
          <MultiSelectResponsaveis
            options={gpcUsers}
            selected={form.responsaveis ?? []}
            onChange={v => set('responsaveis', v)}
          />
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Situação</label>
          <input className={INPUT} value={form.situacao ?? ''} onChange={e => set('situacao', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Entrega CATC</label>
          <input className={INPUT} value={form.entrega_catc ?? ''} onChange={e => set('entrega_catc', e.target.value)}/>
        </div>
        <div className="col-span-2">
          <label className={LABEL}>Observações</label>
          <textarea className={INPUT} rows={3} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)}/>
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

// ─── Main Page ────────────────────────────────────────────────────────────────

type TipoFiltro = 'TODOS' | GpcServidor['tipo'];

export const GpcServidores = ({ embedded = false }: { embedded?: boolean } = {}) => {
  const { toast } = useToast();
  const { confirmAction } = useConfirm();
  const [rows, setRows] = useState<GpcServidor[]>([]);
  const [gpcUsers, setGpcUsers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltro>('TODOS');
  const [somenteAlerta, setSomenteAlerta] = useState(false);
  const [modal, setModal] = useState<null | { data?: GpcServidor }>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await GpcService.getServidores();
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { GpcService.getGpcUsers().then(setGpcUsers); }, []);

  const alertaCount = useMemo(
    () => rows.filter(r => { const d = diasAte(r.prazo); return d != null && d < DIAS_ALERTA; }).length,
    [rows],
  );
  const vencidoCount = useMemo(
    () => rows.filter(r => { const d = diasAte(r.prazo); return d != null && d < 0; }).length,
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows.filter(r => {
      if (filtroTipo !== 'TODOS' && r.tipo !== filtroTipo) return false;
      if (somenteAlerta) {
        const d = diasAte(r.prazo);
        if (d == null || d >= DIAS_ALERTA) return false;
      }
      if (!needle) return true;
      return [r.processo_tce, r.beneficiario, r.convenio, r.responsavel]
        .some(v => (v ?? '').toLowerCase().includes(needle));
    });
  }, [rows, search, filtroTipo, somenteAlerta]);

  const handleDelete = async (codigo: number) => {
    if (!(await confirmAction('Excluir este registro?', { danger: true }))) return;
    try { await GpcService.deleteServidor(codigo); await load(); }
    catch (ex: any) { toast('error', ex.message); }
  };

  const TABS: { value: TipoFiltro; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'PUBLICACAO_DOE', label: 'Publicações DOE' },
    { value: 'REQUISICAO', label: 'Requisições' },
  ];

  return (
    <div className="space-y-6">
      {/* Header — omitido quando embutido numa aba: o título/subtítulo já vêm da
          página que hospeda esta aba, para não duplicar cabeçalho na tela. */}
      {embedded ? (
        <div className="flex justify-end">
          <button className={BTN_PRIMARY} onClick={() => setModal({})}>
            <Plus size={16}/>Novo Registro
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">TCE</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Publicações no DOE e requisições de documentos do Tribunal de Contas — {filtered.length.toLocaleString('pt-BR')} registros
            </p>
          </div>
          <button className={BTN_PRIMARY} onClick={() => setModal({})}>
            <Plus size={16}/>Novo Registro
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <KpiCard label="Total" value={rows.length} icon={FolderOpen} color="bg-blue-500" />
        <KpiCard label={`Vencendo em < ${DIAS_ALERTA}d`} value={alertaCount} icon={Clock} color="bg-amber-500" />
        <KpiCard label="Vencidos" value={vencidoCount} icon={ShieldAlert} color="bg-red-500" />
      </div>

      {/* Aviso de prazo */}
      {alertaCount > 0 && (
        <button
          onClick={() => setSomenteAlerta(v => !v)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors text-left ${
            somenteAlerta ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle size={18} className="shrink-0" />
          <span>
            {vencidoCount > 0 && <strong>{vencidoCount} vencido{vencidoCount > 1 ? 's' : ''}</strong>}
            {vencidoCount > 0 && alertaCount - vencidoCount > 0 && ' e '}
            {alertaCount - vencidoCount > 0 && <strong>{alertaCount - vencidoCount} vencendo em menos de {DIAS_ALERTA} dias</strong>}
            {' '}— clique para {somenteAlerta ? 'ver todos' : 'filtrar só esses'}
          </span>
        </button>
      )}

      {/* Tabs de tipo */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(t => (
          <button
            key={t.value}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              filtroTipo === t.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            onClick={() => setFiltroTipo(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
        <input
          className={INPUT + ' pl-10'}
          placeholder="Buscar por processo, beneficiário, convênio ou responsável..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Tipo','Processo TCE','Beneficiário','DRS','Convênio','Vol.','Prazo','Responsáveis','Situação',''].map(h => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.codigo} className="border-t border-slate-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-3 py-3 text-xs text-slate-600 whitespace-nowrap">{TIPO_LABELS[r.tipo]}</td>
                    <td className="px-3 py-3 text-sm font-medium text-slate-800 max-w-[180px] truncate" title={r.processo_tce ?? ''}>{r.processo_tce ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-700 max-w-[220px] truncate" title={r.beneficiario ?? ''}>{r.beneficiario ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-center text-slate-600 whitespace-nowrap">{nomeDRSPorNumero(r.drs) ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-slate-600">{r.convenio ?? '-'}</td>
                    <td className="px-3 py-3 text-sm text-center text-slate-600">{r.qtde_volumes ?? '-'}</td>
                    <td className="px-3 py-3"><PrazoBadge prazo={r.prazo} /></td>
                    <td className="px-3 py-3 text-sm text-slate-600 max-w-[200px]" title={(r.responsaveis ?? (r.responsavel ? [r.responsavel] : [])).join(', ')}>
                      {(r.responsaveis ?? (r.responsavel ? [r.responsavel] : [])).length ? (
                        <div className="flex flex-wrap gap-1">
                          {(r.responsaveis ?? [r.responsavel!]).map(nome => (
                            <span key={nome} className="inline-flex px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium">{nome}</span>
                          ))}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-600 max-w-[200px] truncate" title={r.situacao ?? ''}>{r.situacao ?? '-'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors" title="Editar" onClick={() => setModal({ data: r })}><Edit size={15}/></button>
                        <button className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors" title="Excluir" onClick={() => handleDelete(r.codigo)}><Trash2 size={15}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr><td colSpan={10} className="py-16 text-center text-slate-400">Nenhum registro encontrado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal !== null && (
        <Modal title={modal.data ? 'Editar Registro' : 'Novo Registro'} onClose={() => setModal(null)}>
          <ServidorForm
            initial={modal.data ? { ...modal.data, responsaveis: modal.data.responsaveis ?? (modal.data.responsavel ? [modal.data.responsavel] : []) } : undefined}
            defaultTipo={filtroTipo !== 'TODOS' ? filtroTipo : 'PUBLICACAO_DOE'}
            gpcUsers={gpcUsers}
            onSave={async (s) => { await GpcService.saveServidor(s); await load(); }}
            onClose={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  );
};
