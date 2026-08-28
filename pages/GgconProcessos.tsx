import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight,
  X, Check, Loader2, AlertCircle, Download, Scale, Activity, Lock, ArrowUp, ArrowDown, ArrowUpDown, Flag, MoreVertical, RotateCcw,
  ClipboardCheck, Building2, Landmark,
} from 'lucide-react';
import { GgconService, GgconSortField, diasSemMovimentacao, alertaComiteGestor, deriveSituacaoFromEtapa } from '../services/ggconService';
import { GgconAnaliseService } from '../services/ggconAnaliseService';
import { MUNICIPIOS, buscarDRSPorMunicipio } from '../services/ggconMunicipios';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useApp } from '../context/AppContext';
import { DbService } from '../services/dbService';
import { GgconProcesso, GgconTipoConveniada } from '../types';

// ─── listas de referência (extraídas da planilha produtividade_todos.xlsm, aba
// Listas_Configuracoes) — combinadas com <datalist>, então o usuário pode
// escolher uma opção conhecida ou digitar uma nova sem travar o cadastro. ────

const ETAPAS = [
  'Aguardando análise técnica', 'Aguardando assinatura', 'Aguardando documentação',
  'Aguardando indicação orçamentária', 'Aguardando publicação', 'Análise da solicitação - GGCon',
  'Assinado', 'Cancelada', 'Comitê Gestor', 'Consultoria Jurídica', 'Devolvido ao DRS',
  'Em análise GGCon', 'Em diligência', 'Em processo SIAFEM', 'Encaminhado para Autorizo do Secretário',
  'Encaminhado para manifestação de outra área', 'Manifestação do Grupo de Controle Financeiro',
  'Manifestação do Grupo de Controle Orçamentário', 'Pago', 'Preparar para CJ', 'Prestação de Contas',
  'Processo SIAFEM', 'Publicado', 'Rescindido', 'Aguardando a demanda ser cadastrada',
  'Manifestação da CRS', 'Aguarda Formalização do Convênio', 'Pendente de Assinatura GGCON',
  'Pendente Assinatura CGOF', 'Processo Arquivado', 'Encaminhado ao GPC', 'Retorno GPC',
];
const PROXIMAS_PROVIDENCIAS = [
  'Aguarda Deliberação do Comitê Gestor', 'Aguarda Parecer da Consultoria Jurídica',
  'Aguardando Autorizo do Secretário', 'Alimentar Portal de Finanças', 'Cadastro da demanda',
  'Dar andamento no SEI', 'Devolver para o DRS', 'Encaminhar à Consultoria Jurídica',
  'Formalizar o Convênio', 'Manifestação de Outra Área', 'Preparar para Comitê Gestor',
  'Publicado - anexar Publicação', 'Solicitar documentação', 'Tramitação para outra área',
  'Devolver para CRS', 'Devolver para CSS', 'Processo devolvido para complementação de documentos',
  'Concluído',
];
export const TIPOS = [
  'Convênio', 'Termo Aditivo', 'Prestação de Contas', 'Parecer/Consulta',
  'Cancelamento', 'Rescisão/Denúncia', 'Fundo a Fundo', 'Outros',
];
const COORDENADORIAS = ['CAF', 'CCD', 'CDSA', 'CGGP', 'CGOF', 'CJ', 'CRH', 'CRS', 'CSS', 'GCO', 'GPC', 'GS'];
export const DRS_UNIDADES = [
  'I - Grande São Paulo', 'II - Araçatuba', 'III - Araraquara', 'IV - Baixada Santista',
  'V - Barretos', 'VI - Bauru', 'VII - Campinas', 'VIII - Franca', 'IX - Marília',
  'X - Piracicaba', 'XI - Presidente Prudente', 'XII - Registro', 'XIII - Ribeirão Preto',
  'XIV - São João da Boa Vista', 'XV - São José do Rio Preto', 'XVI - Sorocaba', 'XVII - Taubaté',
];

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const fmtBRL = (v: number | null | undefined) =>
  v == null ? '-' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// ─── exportação XLSX (mesmo helper usado em GgconRelatorios.tsx / GpcRelatorios.tsx) ─

const exportXLSX = (rows: GgconProcesso[]) => {
  const sheetRows = rows.map(r => ({
    'Urgente': r.urgente ? 'Sim' : 'Não', 'Código': r.codigo, 'Processo SEI': r.processo_sei, 'Nº Demanda': r.numero_demanda ?? '',
    'Interessado': r.interessado ?? '', 'Tipo': r.tipo ?? '', 'Etapa': r.etapa ?? '',
    'Técnico': r.tecnico_responsavel ?? '', 'Coordenadoria': r.coordenadoria ?? '',
    'DRS/Unidade': r.drs_unidade ?? '', 'Município': r.municipio ?? '',
    'Data Movimentação': fmtDate(r.data_movimentacao), 'Aguardando Assinatura': r.aguardando_assinatura ? 'Sim' : 'Não',
    'Comitê Gestor': r.comite_gestor ? 'Sim' : 'Não', 'Consultoria Jurídica': r.consultoria_juridica ? 'Sim' : 'Não',
    'Valor do Estado': r.valor_estado ?? '', 'Próxima Providência': r.proxima_providencia ?? '',
  }));
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheetRows);
  if (sheetRows.length) {
    const cols = Object.keys(sheetRows[0]);
    ws['!cols'] = cols.map(col => ({
      wch: Math.min(60, Math.max(col.length + 2, ...sheetRows.slice(0, 300).map(r => String((r as any)[col] ?? '').length + 1))),
    }));
  }
  XLSX.utils.book_append_sheet(wb, ws, 'Processos GGCON');
  XLSX.writeFile(wb, `ggcon_processos_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// ─── exportação PDF (impressão rápida da página atual da tabela — mesmo padrão de
// jsPDF + autoTable usado em ProcessManager.tsx) ───────────────────────────────

const exportPDF = (rows: GgconProcesso[]) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.text('Processos GGCON', 14, 15);
  autoTable(doc, {
    startY: 20,
    styles: { fontSize: 7 },
    head: [['Processo SEI', 'Nº Demanda', 'Interessado', 'Tipo', 'Etapa', 'Técnico', 'Coordenadoria', 'Data Mov.']],
    body: rows.map(r => [
      r.processo_sei, r.numero_demanda ?? '-', r.interessado ?? '-', r.tipo ?? '-',
      r.etapa ?? '-', r.tecnico_responsavel ?? '-', r.coordenadoria ?? '-', fmtDate(r.data_movimentacao),
    ]),
  });
  doc.save(`ggcon_processos_${new Date().toISOString().slice(0, 10)}.pdf`);
};

// ─── shared styles (mesmos tokens usados em GpcRecebidos.tsx / GpcProcessos_v2.tsx) ─

const INPUT = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300';
const LABEL = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
const BTN_PRIMARY_GREEN = BTN_PRIMARY.replace('bg-blue-600', 'bg-green-600').replace('hover:bg-blue-700', 'hover:bg-green-700');
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm';
const BTN_MUTED = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors';
const BTN_PRIMARY_LG = 'inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg';

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = ({ title, subtitle, onClose, children, size = 'lg' }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; size?: 'md' | 'lg';
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
    <div className={`bg-slate-50/95 rounded-2xl shadow-2xl ring-1 ring-black/5 w-full ${size === 'md' ? 'max-w-xl' : 'max-w-3xl'} max-h-[92vh] flex flex-col`} onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white rounded-t-2xl">
        <div>
          <h3 className="text-base font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
      </div>
      <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
    </div>
  </div>
);

// ─── datalist input (lista sugerida, mas aceita texto livre) ─────────────────

const ListInput = ({ id, options, value, onChange, placeholder }: {
  id: string; options: string[]; value: string; onChange: (v: string) => void; placeholder?: string;
}) => (
  <>
    <input className={INPUT} list={id} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    <datalist id={id}>
      {options.map(o => <option key={o} value={o} />)}
    </datalist>
  </>
);

// ─── Sec (cabeçalho de seção do formulário) ───────────────────────────────────

const Sec = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2.5 pt-1 pb-1">
    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">{title}</span>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);

// ─── Form ─────────────────────────────────────────────────────────────────────

const GgconForm = ({ initial, tecnicos, gpcAnalistas, onSave, onClose }: {
  initial?: Partial<GgconProcesso>;
  tecnicos: string[];
  gpcAnalistas: string[];
  onSave: (p: Partial<GgconProcesso>) => Promise<void>;
  onClose: () => void;
}) => {
  const [form, setForm] = useState<Partial<GgconProcesso>>(initial ?? {
    aguardando_assinatura: false, comite_gestor: false, consultoria_juridica: false,
    data_entrada: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (k: keyof GgconProcesso, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Duplicidade só faz sentido para um cadastro totalmente novo — se o formulário já
  // chegou com um processo_sei (edição, ou "Nova Movimentação" pré-preenchida a partir
  // do histórico), reencontrar o mesmo SEI é esperado, não um alerta.
  const skipDupCheck = !!initial?.processo_sei;
  const [dupWarning, setDupWarning] = useState<{ totalMovimentacoes: number; etapaAtual?: string | null; tecnico?: string | null } | null>(null);

  const handleProcessoSeiBlur = async () => {
    if (skipDupCheck) return;
    const raw = form.processo_sei?.trim();
    if (!raw) { setDupWarning(null); return; }
    const formatado = GgconService.formatarProcessoSei(raw);
    if (formatado !== raw) set('processo_sei', formatado);
    const r = await GgconService.checkDuplicateProcesso(formatado);
    setDupWarning(r.existe ? r : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.processo_sei?.trim()) { setErr('Informe o número do processo SEI.'); return; }
    setSaving(true); setErr('');
    try { await onSave(form); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
      {dupWarning && (
        <div className="flex items-start gap-2 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0"/>
          <span>
            Este processo SEI já tem {dupWarning.totalMovimentacoes} movimentação(ões) registrada(s)
            (etapa atual: <strong>{dupWarning.etapaAtual ?? '—'}</strong>, técnico: <strong>{dupWarning.tecnico ?? '—'}</strong>).
            Considere usar "Histórico" → "Nova Movimentação" nesse processo em vez de criar um cadastro novo.
          </span>
        </div>
      )}

      <label className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.urgente ? 'bg-red-50 border-red-400' : 'bg-white border-slate-200'}`}>
        <input type="checkbox" checked={form.urgente ?? false} onChange={e => set('urgente', e.target.checked)} className="w-4 h-4 accent-red-600 rounded"/>
        <Flag size={14} className={form.urgente ? 'text-red-600' : 'text-slate-400'}/>
        <span className={`text-sm font-semibold ${form.urgente ? 'text-red-700' : 'text-slate-600'}`}>Marcar como urgente (fica no topo da lista)</span>
      </label>

      <Sec title="Identificação" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Nº do Processo SEI *</label>
          <input className={INPUT} value={form.processo_sei ?? ''} onChange={e => set('processo_sei', e.target.value)} onBlur={handleProcessoSeiBlur} placeholder="000.00000000/0000-00" required/>
        </div>
        <div>
          <label className={LABEL}>Nº da Demanda</label>
          <input className={INPUT} value={form.numero_demanda ?? ''} onChange={e => set('numero_demanda', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>Tipo</label>
          {/* Lista fechada, não texto livre: "Prestação de Contas" precisa bater
              exatamente com esse valor pra tela de Processos oferecer criar o
              registro correspondente em Análise GGCON (ver salvarProcessoEChecarAnalise
              abaixo) — texto livre já deixou passar variação de grafia no passado. */}
          <select className={INPUT} value={form.tipo ?? ''} onChange={e => set('tipo', e.target.value || null)}>
            <option value="">Selecione...</option>
            {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            {form.tipo && !TIPOS.includes(form.tipo) && <option value={form.tipo}>{form.tipo}</option>}
          </select>
        </div>
        <div>
          <label className={LABEL}>Valor do Estado (R$)</label>
          <input className={INPUT} type="number" step="0.01" min={0} value={form.valor_estado ?? ''} onChange={e => set('valor_estado', e.target.value ? Number(e.target.value) : null)}/>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Interessado</label>
          <input className={INPUT} value={form.interessado ?? ''} onChange={e => set('interessado', e.target.value)}/>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Assunto / Movimentação</label>
          <textarea className={INPUT} rows={2} value={form.assunto ?? ''} onChange={e => set('assunto', e.target.value)}/>
        </div>
      </div>

      <Sec title="Localização" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Município</label>
          <ListInput
            id="dl-municipio"
            options={MUNICIPIOS}
            value={form.municipio ?? ''}
            onChange={v => {
              set('municipio', v || null);
              // Ao escolher/digitar um município conhecido, preenche a DRS/Unidade automaticamente
              // (mesmo comportamento de Planilha2.Worksheet_Change + modMunicipios.BuscarDRSPorMunicipio no VBA).
              const drs = buscarDRSPorMunicipio(v);
              if (drs) set('drs_unidade', drs);
            }}
          />
        </div>
        <div>
          <label className={LABEL}>DRS / Unidade</label>
          <ListInput id="dl-drs" options={DRS_UNIDADES} value={form.drs_unidade ?? ''} onChange={v => set('drs_unidade', v || null)}/>
        </div>
        <div>
          <label className={LABEL}>Coordenadoria</label>
          <ListInput id="dl-coord" options={COORDENADORIAS} value={form.coordenadoria ?? ''} onChange={v => set('coordenadoria', v || null)}/>
        </div>
      </div>

      <Sec title="Movimentação" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Técnico Responsável</label>
          <ListInput id="dl-tecnico" options={tecnicos} value={form.tecnico_responsavel ?? ''} onChange={v => set('tecnico_responsavel', v || null)}/>
        </div>
        <div>
          <label className={LABEL}>Etapa Atual</label>
          <ListInput id="dl-etapa" options={ETAPAS} value={form.etapa ?? ''} onChange={v => set('etapa', v || null)}/>
        </div>
        <div>
          <label className={LABEL}>Analista GPC</label>
          <ListInput id="dl-analista-gpc" options={gpcAnalistas} value={form.analista_gpc ?? ''} onChange={v => set('analista_gpc', v || null)}/>
        </div>
        <div>
          <label className={LABEL}>Data de Entrada</label>
          <input className={INPUT} type="date" value={form.data_entrada ?? ''} onChange={e => set('data_entrada', e.target.value || null)}/>
        </div>
        <div>
          <label className={LABEL}>Data de Recebimento</label>
          <input className={INPUT} type="date" value={form.data_recebimento ?? ''} onChange={e => set('data_recebimento', e.target.value || null)}/>
        </div>
        <div>
          <label className={LABEL}>Data da Movimentação</label>
          <input className={INPUT} type="date" value={form.data_movimentacao ?? ''} onChange={e => set('data_movimentacao', e.target.value || null)}/>
        </div>
      </div>

      <Sec title="Situação" />
      {(() => {
        const sit = deriveSituacaoFromEtapa(form.etapa);
        const badges: { on: boolean; label: string; cls: string }[] = [
          { on: sit.aguardando_assinatura, label: 'Aguardando Assinatura', cls: 'bg-amber-50 border-amber-300 text-amber-700' },
          { on: sit.comite_gestor, label: 'No Comitê Gestor', cls: 'bg-purple-50 border-purple-300 text-purple-700' },
          { on: sit.consultoria_juridica, label: 'Na Consultoria Jurídica', cls: 'bg-blue-50 border-blue-300 text-blue-700' },
        ];
        const ativas = badges.filter(b => b.on);
        return (
          <div className="space-y-1.5">
            <p className="text-[11px] text-slate-400">Calculada automaticamente a partir da Etapa Atual — não é editável diretamente.</p>
            <div className="flex flex-wrap gap-2">
              {ativas.length === 0
                ? <span className="text-xs text-slate-400 italic">Nenhuma situação especial para a etapa selecionada.</span>
                : ativas.map(b => (
                  <span key={b.label} className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${b.cls}`}>{b.label}</span>
                ))}
            </div>
          </div>
        );
      })()}
      {form.tipo && form.valor_estado ? alertaComiteGestor(form as GgconProcesso) && (
        <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
          <Scale size={11}/>Valor acima do limite — este processo deveria passar pelo Comitê Gestor.
        </p>
      ) : null}

      <Sec title="Encaminhamento" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Próxima Providência</label>
          <ListInput id="dl-prox" options={PROXIMAS_PROVIDENCIAS} value={form.proxima_providencia ?? ''} onChange={v => set('proxima_providencia', v || null)}/>
        </div>
        <div>
          <label className={LABEL}>Área para Encaminhamento</label>
          <input className={INPUT} value={form.area_encaminhamento ?? ''} onChange={e => set('area_encaminhamento', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>Data de Envio</label>
          <input className={INPUT} type="date" value={form.data_envio ?? ''} onChange={e => set('data_envio', e.target.value || null)}/>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Observações</label>
          <textarea className={INPUT} rows={2} value={form.observacoes ?? ''} onChange={e => set('observacoes', e.target.value)}/>
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

// ─── Sugestão de registrar na Análise GGCON — aparece depois de salvar um processo
// com Tipo = "Prestação de Contas" que ainda não tem análise correspondente. Só
// pergunta Entidade/Prefeitura porque "Processos GGCON" não guarda essa distinção
// (ver services/ggconAnaliseService.ts:existeParaProcesso para a checagem de duplicidade). ──

const NovaAnaliseAutomaticaModal = ({ processo, onConfirm, onSkip }: {
  processo: Partial<GgconProcesso>; onConfirm: (tipoConveniada: GgconTipoConveniada, exercicios: number[]) => Promise<void>; onSkip: () => void;
}) => {
  const [busy, setBusy] = useState<GgconTipoConveniada | null>(null);
  const [err, setErr] = useState('');
  const [exerciciosTexto, setExerciciosTexto] = useState('');

  const exercicios = Array.from(new Set(
    exerciciosTexto.split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n)),
  ));

  const escolher = async (tipo: GgconTipoConveniada) => {
    if (!exercicios.length) { setErr('Informe ao menos um exercício.'); return; }
    setBusy(tipo); setErr('');
    try { await onConfirm(tipo, exercicios); }
    catch (ex: any) { setErr(ex.message); setBusy(null); }
  };

  return (
    <Modal title="Registrar na Análise GGCON?" subtitle={`Processo SEI ${processo.processo_sei} — Tipo "Prestação de Contas"`} onClose={onSkip} size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600 flex items-start gap-2">
          <ClipboardCheck size={16} className="text-blue-600 shrink-0 mt-0.5"/>
          Este processo é do tipo "Prestação de Contas". Deseja já registrá-lo na tela
          "Análise Processo GGCON" para conferência do checklist? A conveniada é Entidade ou Prefeitura?
        </p>
        <div>
          <label className={LABEL}>Exercício(s) *</label>
          <input className={INPUT} value={exerciciosTexto} onChange={e => setExerciciosTexto(e.target.value)} placeholder="2024, 2025"/>
          <p className="text-[11px] text-slate-400 mt-1">Um checklist será criado para cada exercício informado.</p>
        </div>
        {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy !== null || exercicios.length === 0}
            onClick={() => escolher('ENTIDADE')}
          >
            {busy === 'ENTIDADE' ? <Loader2 size={22} className="animate-spin text-blue-600"/> : <Building2 size={22} className="text-blue-600"/>}
            <span className="text-sm font-semibold text-slate-700">Entidade</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={busy !== null || exercicios.length === 0}
            onClick={() => escolher('PREFEITURA')}
          >
            {busy === 'PREFEITURA' ? <Loader2 size={22} className="animate-spin text-blue-600"/> : <Landmark size={22} className="text-blue-600"/>}
            <span className="text-sm font-semibold text-slate-700">Prefeitura</span>
          </button>
        </div>
        <button type="button" className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors" disabled={busy !== null} onClick={onSkip}>
          Agora não
        </button>
      </div>
    </Modal>
  );
};

// ─── Etapa badge (heurística de cor por palavra-chave, mesma convenção "pílula
// com borda" usada em GPC — não há um enum fixo de etapas, então a cor é
// inferida do texto em vez de mapeada 1:1 como em GPC) ────────────────────────

const etapaTone = (etapa: string | null): { bg: string; text: string; border: string } => {
  const t = (etapa ?? '').toLowerCase();
  if (!t) return { bg: 'bg-slate-100', text: 'text-slate-500', border: 'border-slate-200' };
  if (/cancel|rescind|arquiv/.test(t)) return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  if (/conclu|pago|public|assinado|formaliz/.test(t)) return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  // Mesmo estágio (falta atribuir/distribuir para um técnico), só com texto digitado de
  // formas diferentes ("atribuição ao técnico", "atribuição para o técnico", "distribuição
  // para o técnico") — cor própria pra não se confundir com o "aguardando" genérico abaixo.
  if (/(atribui|distribui).*t[eé]cnic/.test(t)) return { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' };
  if (/aguard|pend|encaminh/.test(t)) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  if (/comit|jurídic|juridic|análise|analise|trâmit|tramit/.test(t)) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
  return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
};

const EtapaBadge = ({ etapa }: { etapa: string | null }) => {
  if (!etapa) return <span className="text-slate-300 text-xs">-</span>;
  const c = etapaTone(etapa);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap max-w-[180px] truncate ${c.bg} ${c.text} ${c.border}`} title={etapa}>
      {etapa}
    </span>
  );
};

// Faixa de Paralisação — mesma classificação e cores da planilha (coluna P / regras
// condicionais em modLayout.LayoutSEI: "Até 15 dias" verde, "16 a 30" e "31 a 60" âmbar
// (mesma cor nas duas faixas), "Mais de 60 dias" vermelho).
const faixaParalisacao = (dias: number): { label: string; bg: string; text: string; border: string } => {
  if (dias > 60) return { label: 'Mais de 60 dias', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
  if (dias > 30) return { label: '31 a 60 dias', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  if (dias > 15) return { label: '16 a 30 dias', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
  return { label: 'Até 15 dias', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
};

const DiasParadoBadge = ({ dias }: { dias: number | null }) => {
  if (dias == null) return <span className="text-slate-300 text-xs">-</span>;
  const f = faixaParalisacao(dias);
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${f.bg} ${f.text} ${f.border}`} title={f.label}>
      {dias}d
    </span>
  );
};

// ─── Menu de ações da linha (três pontos) — junta Editar/Excluir num só botão pra
// não ocupar tanto espaço horizontal da tabela. ────────────────────────────────

const RowMenu = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // O menu é renderizado num portal em document.body (posição fixa calculada a partir
  // do botão) em vez de "absolute" dentro da célula — a tabela fica num card com
  // overflow-hidden (cantos arredondados), que cortaria o menu nas últimas linhas.
  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 128 });
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const closeOnScroll = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
        title="Mais ações"
        onClick={toggle}
      >
        <MoreVertical size={16}/>
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-32"
          style={{ top: pos.top, left: pos.left }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={() => { setOpen(false); onEdit(); }}
          >
            <Edit size={14}/>Editar
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => { setOpen(false); onDelete(); }}
          >
            <Trash2 size={14}/>Excluir
          </button>
        </div>,
        document.body
      )}
    </>
  );
};

// ─── Confirmação por senha (mesmo requisito de segurança usado em ProcessManager.tsx
// para exclusões — pede a senha do usuário logado, não só um "tem certeza?") ─────────

const PasswordConfirmModal = ({ title, message, onCancel, onConfirm }: {
  title: string; message: string; onCancel: () => void; onConfirm: (password: string) => Promise<void>;
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await onConfirm(password); }
    catch (ex: any) { setError(ex.message || 'Senha incorreta.'); }
    finally { setBusy(false); }
  };

  return (
    <Modal title={title} onClose={onCancel} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <input
            type="password" autoFocus required
            className={INPUT + ' pl-10'}
            placeholder="Sua senha de acesso"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
          />
        </div>
        {error && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{error}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onCancel}>Cancelar</button>
          <button
            type="submit"
            disabled={busy || !password}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {busy ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16}/>}Excluir
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Histórico do fluxo (mesmo padrão de timeline vertical do "Histórico do Fluxo"
// em ProcessManager.tsx) — mostra todas as movimentações de um mesmo processo_sei,
// destacando a mais recente como situação atual. ──────────────────────────────────

const HistoricoTimelineModal = ({ processoSei, rows, loading, isViewOnly, onClose, onEdit, onDeleteMovimentacao, onDeleteFluxo, onNovaMovimentacao }: {
  processoSei: string;
  rows: GgconProcesso[];
  loading: boolean;
  isViewOnly: boolean;
  onClose: () => void;
  onEdit: (row: GgconProcesso) => void;
  onDeleteMovimentacao: (codigo: number) => void;
  onDeleteFluxo: () => void;
  onNovaMovimentacao: () => void;
}) => {
  const maxCodigo = rows.length ? Math.max(...rows.map(r => r.codigo)) : -1;
  // "rows" chega em ordem cronológica ascendente (mais antiga primeiro — usado por
  // abrirNovaMovimentacao para achar a movimentação mais recente); a exibição na
  // timeline é do mais novo para o mais velho, então invertemos só para renderizar.
  const displayRows = [...rows].reverse();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-50/95 rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-3xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Activity size={18} className="text-blue-600"/>Histórico do Processo</h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{processoSei} — {rows.length} movimentação(ões)</p>
          </div>
          <div className="flex items-center gap-2">
            {!isViewOnly && (
              <button className={BTN_PRIMARY_GREEN} onClick={onNovaMovimentacao} disabled={loading || !rows.length}><Plus size={14}/>Nova Movimentação</button>
            )}
            {!isViewOnly && (
              <button className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Excluir fluxo completo (todas as movimentações)" onClick={onDeleteFluxo}><Trash2 size={16}/></button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-6 bg-slate-50/30">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500"/></div>
          ) : (
            <div className="relative border-l-2 border-blue-100 ml-4 space-y-6">
              {displayRows.map(item => {
                const atual = item.codigo === maxCodigo;
                return (
                  <div key={item.codigo} className="relative pl-8">
                    <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${atual ? 'bg-green-600 border-green-600 shadow-lg shadow-green-400/50' : 'bg-white border-blue-200'}`}/>
                    <div className={`p-4 rounded-xl border-2 shadow-sm hover:shadow-md transition-all ${atual ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <div className="min-w-0">
                          <span className={`text-[10px] uppercase font-bold block mb-1 flex items-center gap-1 ${atual ? 'text-green-700' : 'text-slate-400'}`}>
                            {item.urgente && <Flag size={10} className="text-red-600" fill="currentColor"/>}
                            {atual ? '● Situação Atual' : 'Movimentação'}
                          </span>
                          <EtapaBadge etapa={item.etapa} />
                        </div>
                        <div className="flex items-start gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold block mb-1 text-slate-400">Movimentação</span>
                            <div className="text-xs font-bold text-blue-600">{fmtDate(item.data_movimentacao)}</div>
                          </div>
                          {!isViewOnly && (
                            <div className="flex gap-1">
                              <button onClick={() => onEdit(item)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar esta movimentação"><Edit size={15}/></button>
                              <button onClick={() => onDeleteMovimentacao(item.codigo)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Excluir esta movimentação"><Trash2 size={15}/></button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-700 line-clamp-2">{item.assunto || '-'}</p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100 text-[11px]">
                        <div><span className="text-slate-400 block">Técnico</span><span className="font-medium text-slate-700">{item.tecnico_responsavel ?? '-'}</span></div>
                        <div><span className="text-slate-400 block">Coordenadoria</span><span className="font-medium text-slate-700">{item.coordenadoria ?? '-'}</span></div>
                        <div><span className="text-slate-400 block">Próxima Providência</span><span className="font-medium text-slate-700">{item.proxima_providencia ?? '-'}</span></div>
                        <div><span className="text-slate-400 block">Valor</span><span className="font-medium text-slate-700">{fmtBRL(item.valor_estado)}</span></div>
                      </div>
                      {item.observacoes && <p className="mt-2 pt-2 border-t border-dashed border-slate-100 italic text-[11px] text-slate-500">{item.observacoes}</p>}
                    </div>
                  </div>
                );
              })}
              {!rows.length && <p className="text-sm text-slate-400 text-center py-10">Nenhuma movimentação encontrada.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type Overlay =
  | null
  | { type: 'form'; data?: Partial<GgconProcesso>; returnToHistorico?: string }
  | { type: 'historico'; processoSei: string };

const FILTROS_STORAGE_KEY = 'ggcon_filtros';

type FiltrosPersistidos = {
  search: string; etapaFiltro: string; tecnicoFiltro: string; coordenadoriaFiltro: string;
  dataInicioFiltro: string; dataFimFiltro: string;
  sortBy: GgconSortField; sortOrder: 'asc' | 'desc';
};

const FILTROS_PADRAO: FiltrosPersistidos = {
  search: '', etapaFiltro: '', tecnicoFiltro: '', coordenadoriaFiltro: '',
  dataInicioFiltro: '', dataFimFiltro: '', sortBy: 'codigo', sortOrder: 'desc',
};

// Atalhos de período — filtram por Data da Movimentação.
const PERIODOS_RAPIDOS: { label: string; dias: number }[] = [
  { label: 'Hoje', dias: 0 },
  { label: '7 dias', dias: 7 },
  { label: '30 dias', dias: 30 },
  { label: '90 dias', dias: 90 },
];

const carregarFiltrosPersistidos = (): FiltrosPersistidos => {
  try {
    const raw = localStorage.getItem(FILTROS_STORAGE_KEY);
    if (raw) return { ...FILTROS_PADRAO, ...JSON.parse(raw) };
  } catch { /* localStorage indisponível ou JSON inválido — usa os padrões */ }
  return FILTROS_PADRAO;
};

export const GgconProcessos = () => {
  const { toast } = useToast();
  const { confirmAction } = useConfirm();
  const { currentUser } = useApp();
  const isViewOnly = currentUser?.view_only === true;
  // Sugestão de criar a análise correspondente — ver NovaAnaliseAutomaticaModal.
  const [sugestaoAnalise, setSugestaoAnalise] = useState<Partial<GgconProcesso> | null>(null);
  const [rows, setRows] = useState<GgconProcesso[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const filtrosIniciais = React.useMemo(carregarFiltrosPersistidos, []);
  const [search, setSearch] = useState(filtrosIniciais.search);
  const [etapaFiltro, setEtapaFiltro] = useState(filtrosIniciais.etapaFiltro);
  const [tecnicoFiltro, setTecnicoFiltro] = useState(filtrosIniciais.tecnicoFiltro);
  const [coordenadoriaFiltro, setCoordenadoriaFiltro] = useState(filtrosIniciais.coordenadoriaFiltro);
  const [dataInicioFiltro, setDataInicioFiltro] = useState(filtrosIniciais.dataInicioFiltro);
  const [dataFimFiltro, setDataFimFiltro] = useState(filtrosIniciais.dataFimFiltro);
  const [sortBy, setSortBy] = useState<GgconSortField>(filtrosIniciais.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filtrosIniciais.sortOrder);
  const [loading, setLoading] = useState(false);
  // Único estado para qual overlay de tela cheia está aberto — form (novo/editar/nova
  // movimentação) OU histórico, nunca os dois ao mesmo tempo (evita os dois se
  // empilharem um atrás do outro, que é o que acontecia com dois estados separados).
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [tecnicos, setTecnicos] = useState<string[]>([]);
  const [tecnicosFiltro, setTecnicosFiltro] = useState<string[]>([]);
  const [gpcAnalistas, setGpcAnalistas] = useState<string[]>([]);
  const [historico, setHistorico] = useState<GgconProcesso[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState<null
    | { type: 'movimentacao'; codigo: number }
    | { type: 'fluxo'; processoSei: string }>(null);
  const PAGE_SIZE = 25;

  useEffect(() => {
    localStorage.setItem(FILTROS_STORAGE_KEY, JSON.stringify({
      search, etapaFiltro, tecnicoFiltro, coordenadoriaFiltro, dataInicioFiltro, dataFimFiltro, sortBy, sortOrder,
    }));
  }, [search, etapaFiltro, tecnicoFiltro, coordenadoriaFiltro, dataInicioFiltro, dataFimFiltro, sortBy, sortOrder]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await GgconService.getProcessos({
      search, page, pageSize: PAGE_SIZE, etapa: etapaFiltro, tecnico: tecnicoFiltro, coordenadoria: coordenadoriaFiltro,
      dataInicio: dataInicioFiltro, dataFim: dataFimFiltro, sortBy, sortOrder,
    });
    setRows(result.data);
    setCount(result.count);
    setLoading(false);
  }, [search, page, etapaFiltro, tecnicoFiltro, coordenadoriaFiltro, dataInicioFiltro, dataFimFiltro, sortBy, sortOrder]);

  const filtrosAtivos = !!(search || etapaFiltro || tecnicoFiltro || coordenadoriaFiltro || dataInicioFiltro || dataFimFiltro);
  const ordenacaoAlterada = sortBy !== FILTROS_PADRAO.sortBy || sortOrder !== FILTROS_PADRAO.sortOrder;

  const limparFiltros = () => {
    setSearch(FILTROS_PADRAO.search);
    setEtapaFiltro(FILTROS_PADRAO.etapaFiltro);
    setTecnicoFiltro(FILTROS_PADRAO.tecnicoFiltro);
    setCoordenadoriaFiltro(FILTROS_PADRAO.coordenadoriaFiltro);
    setDataInicioFiltro(FILTROS_PADRAO.dataInicioFiltro);
    setDataFimFiltro(FILTROS_PADRAO.dataFimFiltro);
    setSortBy(FILTROS_PADRAO.sortBy);
    setSortOrder(FILTROS_PADRAO.sortOrder);
    setPage(1);
  };

  const aplicarPeriodoRapido = (dias: number) => {
    const fim = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - dias);
    setDataInicioFiltro(inicio.toISOString().slice(0, 10));
    setDataFimFiltro(fim.toISOString().slice(0, 10));
    setPage(1);
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { GgconService.getTecnicos().then(setTecnicos); }, []);
  useEffect(() => { GgconService.getTecnicosFiltro().then(setTecnicosFiltro); }, []);
  useEffect(() => { GgconService.getGpcAnalistas().then(setGpcAnalistas); }, []);

  const toggleSort = (field: GgconSortField) => {
    if (sortBy === field) { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }
    else { setSortBy(field); setSortOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: GgconSortField }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-slate-300"/>;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-600"/> : <ArrowDown size={12} className="text-blue-600"/>;
  };

  const loadHistorico = useCallback(async (processoSei: string) => {
    setHistoricoLoading(true);
    setHistorico(await GgconService.getHistoricoPorProcesso(processoSei));
    setHistoricoLoading(false);
  }, []);

  useEffect(() => {
    if (overlay?.type === 'historico') loadHistorico(overlay.processoSei);
  }, [overlay, loadHistorico]);

  const refreshAfterChange = async () => {
    await load();
    if (overlay?.type === 'historico') await loadHistorico(overlay.processoSei);
  };

  // Depois de salvar um processo Tipo = "Prestação de Contas", sugere criar o
  // registro correspondente na Análise GGCON — só se ainda não existir um (evita
  // duplicar quando o mesmo processo é salvo de novo, ex.: editar outra movimentação).
  const salvarProcessoEChecarAnalise = async (p: Partial<GgconProcesso>) => {
    await GgconService.saveProcesso(p, currentUser?.name ?? null);
    await refreshAfterChange();
    if (p.tipo?.trim() === 'Prestação de Contas' && p.processo_sei) {
      const jaExiste = await GgconAnaliseService.existeParaProcesso(p.processo_sei);
      if (!jaExiste) setSugestaoAnalise(p);
    }
  };

  const confirmarNovaAnalise = async (tipoConveniada: GgconTipoConveniada, exercicios: number[]) => {
    if (!sugestaoAnalise?.processo_sei || !currentUser) return;
    await GgconAnaliseService.criarAnalise({
      processo_sei: sugestaoAnalise.processo_sei,
      interessado: sugestaoAnalise.interessado ?? null,
      objeto: sugestaoAnalise.assunto ?? null,
      municipio: sugestaoAnalise.municipio ?? null,
      drs_unidade: sugestaoAnalise.drs_unidade ?? null,
      data_recebimento: sugestaoAnalise.data_recebimento ?? null,
      tipo_conveniada: tipoConveniada,
      criado_automaticamente: true,
      exercicios,
    }, currentUser.name);
    setSugestaoAnalise(null);
    toast('success', 'Processo registrado na Análise GGCON.');
  };

  const requestDeleteMovimentacao = async (codigo: number) => {
    if (!(await confirmAction('Excluir esta movimentação?', { danger: true }))) return;
    setDeleteRequest({ type: 'movimentacao', codigo });
  };

  const requestDeleteFluxo = async (processoSei: string) => {
    if (!(await confirmAction(`Excluir TODAS as movimentações do processo ${processoSei}? Esta ação não pode ser desfeita.`, { danger: true }))) return;
    setDeleteRequest({ type: 'fluxo', processoSei });
  };

  const executeDelete = async (password: string) => {
    if (!currentUser || !deleteRequest) return;
    const ok = await DbService.verifyPassword(currentUser.id, password);
    if (!ok) throw new Error('Senha incorreta.');

    if (deleteRequest.type === 'movimentacao') {
      await GgconService.deleteProcesso(deleteRequest.codigo);
    } else {
      await GgconService.deleteFluxo(deleteRequest.processoSei);
      setOverlay(null);
    }
    setDeleteRequest(null);
    await refreshAfterChange();
    toast('success', 'Excluído com sucesso.');
  };

  // Abrir o formulário (edição de uma movimentação ou "Nova Movimentação") a partir do
  // histórico troca o overlay de "historico" para "form" — como é um único estado,
  // nunca dá pra ter os dois abertos ao mesmo tempo. Guarda o processo_sei em
  // "returnToHistorico" para reabrir o histórico quando o form fechar.
  const abrirEdicaoDeMovimentacao = (row: GgconProcesso) => {
    const processoSei = overlay?.type === 'historico' ? overlay.processoSei : undefined;
    setOverlay({ type: 'form', data: row, returnToHistorico: processoSei });
  };

  const abrirNovaMovimentacao = () => {
    if (!historico.length) return;
    const atual = historico[historico.length - 1];
    const processoSei = overlay?.type === 'historico' ? overlay.processoSei : undefined;
    setOverlay({
      type: 'form',
      data: {
        processo_sei: atual.processo_sei,
        municipio: atual.municipio,
        drs_unidade: atual.drs_unidade,
        coordenadoria: atual.coordenadoria,
        interessado: atual.interessado,
        tipo: atual.tipo,
        tecnico_responsavel: atual.tecnico_responsavel,
        data_entrada: new Date().toISOString().slice(0, 10),
      },
      returnToHistorico: processoSei,
    });
  };

  const fecharModalForm = () => {
    const returnTo = overlay?.type === 'form' ? overlay.returnToHistorico : undefined;
    setOverlay(returnTo ? { type: 'historico', processoSei: returnTo } : null);
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Processos GGCON</h2>
            <p className="text-sm text-slate-500 mt-0.5">{count.toLocaleString('pt-BR')} processo{count !== 1 ? 's' : ''} registrado{count !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              className={BTN_MUTED}
              onClick={async () => {
                const all = await GgconService.getAllProcessos();
                exportXLSX(all);
              }}
            >
              <Download size={12}/>XLSX
            </button>
            <button className={BTN_MUTED} title="Exporta a página atual (o que está sendo exibido na tabela)" onClick={() => exportPDF(rows)}>
              <Download size={12}/>PDF
            </button>
          </div>
        </div>
        {!isViewOnly && (
          <button className={BTN_PRIMARY_LG} onClick={() => setOverlay({ type: 'form' })}>
            <Plus size={18}/>Novo Registro
          </button>
        )}
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <input
            className={INPUT + ' pl-10'}
            placeholder="Buscar por processo SEI, nº da demanda, interessado, assunto ou técnico..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className={INPUT + ' sm:w-56'} value={etapaFiltro} onChange={e => { setEtapaFiltro(e.target.value); setPage(1); }}>
          <option value="">Todas as etapas</option>
          {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className={INPUT + ' sm:w-44'} value={tecnicoFiltro} onChange={e => { setTecnicoFiltro(e.target.value); setPage(1); }}>
          <option value="">Todos os técnicos</option>
          {tecnicosFiltro.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className={INPUT + ' sm:w-44'} value={coordenadoriaFiltro} onChange={e => { setCoordenadoriaFiltro(e.target.value); setPage(1); }}>
          <option value="">Todas as coordenadorias</option>
          {COORDENADORIAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Período + reset */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-500">Movimentação de</label>
          <input
            type="date" className={INPUT + ' sm:w-40 py-2'}
            value={dataInicioFiltro}
            onChange={e => { setDataInicioFiltro(e.target.value); setPage(1); }}
          />
          <label className="text-xs font-semibold text-slate-500">até</label>
          <input
            type="date" className={INPUT + ' sm:w-40 py-2'}
            value={dataFimFiltro}
            onChange={e => { setDataFimFiltro(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center gap-1">
          {PERIODOS_RAPIDOS.map(p => (
            <button
              key={p.label}
              className="px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-slate-200 transition-colors"
              onClick={() => aplicarPeriodoRapido(p.dias)}
            >
              {p.label}
            </button>
          ))}
        </div>
        {(filtrosAtivos || ordenacaoAlterada) && (
          <button
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors"
            title="Remove todos os filtros e volta à ordenação padrão (últimos cadastrados primeiro)"
            onClick={limparFiltros}
          >
            <RotateCcw size={12}/>Limpar filtros e voltar ao padrão
          </button>
        )}
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
                  {([
                    ['Processo SEI', 'processo_sei'], ['Nº Demanda', null], ['Interessado', 'interessado'],
                    ['Tipo', 'tipo'], ['Etapa', 'etapa'], ['Técnico', 'tecnico_responsavel'],
                    ['Coordenadoria', 'coordenadoria'], ['Data Mov.', 'data_movimentacao'], ['Parado', 'data_movimentacao'], ['', null],
                  ] as [string, GgconSortField | null][]).map(([h, field]) => (
                    <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                      {field ? (
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors" onClick={() => toggleSort(field)}>
                          {h}<SortIcon field={field}/>
                        </button>
                      ) : h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const dias = diasSemMovimentacao(r);
                  return (
                    <tr key={r.codigo} className={`border-t transition-colors ${r.urgente ? 'bg-red-50/60 border-red-100 hover:bg-red-50' : 'border-slate-100 hover:bg-blue-50/30'}`}>
                      <td className="px-3 py-3 text-sm max-w-[150px] truncate">
                        {r.urgente && <Flag size={12} className="inline text-red-600 mr-1 -mt-0.5" fill="currentColor"/>}
                        <button
                          className="font-medium text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                          title={`Ver histórico de ${r.processo_sei}`}
                          onClick={() => setOverlay({ type: 'historico', processoSei: r.processo_sei })}
                        >
                          {r.processo_sei}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{r.numero_demanda ?? '-'}</td>
                      <td className="px-3 py-3 text-sm text-slate-700 max-w-[220px] truncate" title={r.interessado ?? ''}>{r.interessado ?? '-'}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{r.tipo ?? '-'}</td>
                      <td className="px-3 py-3"><EtapaBadge etapa={r.etapa} /></td>
                      <td className="px-3 py-3 text-sm text-slate-600 max-w-[120px] truncate" title={r.tecnico_responsavel ?? ''}>{r.tecnico_responsavel ?? '-'}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{r.coordenadoria ?? '-'}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600">{fmtDate(r.data_movimentacao)}</td>
                      <td className="px-3 py-3"><DiasParadoBadge dias={dias} /></td>
                      <td className="px-3 py-3">
                        {!isViewOnly && (
                          <RowMenu
                            onEdit={() => setOverlay({ type: 'form', data: r })}
                            onDelete={() => requestDeleteMovimentacao(r.codigo)}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
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
      {overlay?.type === 'form' && (
        <Modal
          title={overlay.data?.codigo ? 'Editar Movimentação' : overlay.data?.processo_sei ? 'Nova Movimentação' : 'Novo Registro'}
          subtitle={overlay.data?.processo_sei ? `Processo SEI ${overlay.data.processo_sei}` : 'Cadastre um processo ou uma nova movimentação de um processo já existente'}
          onClose={fecharModalForm}
        >
          <GgconForm
            initial={overlay.data}
            tecnicos={tecnicos}
            gpcAnalistas={gpcAnalistas}
            onSave={salvarProcessoEChecarAnalise}
            onClose={fecharModalForm}
          />
        </Modal>
      )}

      {sugestaoAnalise && (
        <NovaAnaliseAutomaticaModal
          processo={sugestaoAnalise}
          onConfirm={confirmarNovaAnalise}
          onSkip={() => setSugestaoAnalise(null)}
        />
      )}

      {/* Histórico do fluxo */}
      {overlay?.type === 'historico' && (
        <HistoricoTimelineModal
          processoSei={overlay.processoSei}
          rows={historico}
          loading={historicoLoading}
          isViewOnly={isViewOnly}
          onClose={() => setOverlay(null)}
          onEdit={abrirEdicaoDeMovimentacao}
          onDeleteMovimentacao={(codigo) => requestDeleteMovimentacao(codigo)}
          onDeleteFluxo={() => requestDeleteFluxo(overlay.processoSei)}
          onNovaMovimentacao={abrirNovaMovimentacao}
        />
      )}

      {/* Confirmação de exclusão por senha */}
      {deleteRequest !== null && (
        <PasswordConfirmModal
          title={deleteRequest.type === 'fluxo' ? 'Excluir fluxo completo' : 'Excluir movimentação'}
          message={
            deleteRequest.type === 'fluxo'
              ? `Confirme sua senha para excluir TODAS as movimentações do processo ${deleteRequest.processoSei}. Esta ação não pode ser desfeita.`
              : 'Confirme sua senha para excluir esta movimentação.'
          }
          onCancel={() => setDeleteRequest(null)}
          onConfirm={executeDelete}
        />
      )}
    </div>
  );
};
