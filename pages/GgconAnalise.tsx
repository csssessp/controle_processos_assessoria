import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, Plus, X, Check, Loader2, AlertCircle, ClipboardCheck, Send, UserCog,
  History, ChevronLeft, ChevronRight, Lock, Trash2, MoreVertical, RotateCcw, Inbox,
  ArrowUp, ArrowDown, ArrowUpDown, RefreshCw, StickyNote, Download, Users, ExternalLink,
  Pencil, FileSignature, AlertTriangle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import brasaoUrl from '../img/Brasão.png';
import { GgconAnaliseService, GgconAnaliseFiltroStatus, GgconAnaliseSortField } from '../services/ggconAnaliseService';
import { CHECKLISTS, GGCON_TIPO_CONVENIADA_LABELS, ITENS_INVESTIMENTO_OBRA, MODELOS_REFERENCIA } from '../services/ggconAnaliseChecklists';
import { MUNICIPIOS, buscarDRSPorMunicipio } from '../services/ggconMunicipios';
import { useToast } from '../context/ToastContext';
import { useApp } from '../context/AppContext';
import { DbService } from '../services/dbService';
import {
  GgconAnalise, GgconAnaliseItem, GgconAnaliseExercicio, GgconAnaliseHistorico, GgconAnaliseStatus,
  GgconAnaliseResposta, GgconTipoConveniada, GGCON_ANALISE_STATUS_LABELS, podeLiberarAnalise, podeAssinarGgcon, podeAdministrarAnalise, User, UserRole,
} from '../types';

const DRS_UNIDADES = [
  'I - Grande São Paulo', 'II - Araçatuba', 'III - Araraquara', 'IV - Baixada Santista',
  'V - Barretos', 'VI - Bauru', 'VII - Campinas', 'VIII - Franca', 'IX - Marília',
  'X - Piracicaba', 'XI - Presidente Prudente', 'XII - Registro', 'XIII - Ribeirão Preto',
  'XIV - São João da Boa Vista', 'XV - São José do Rio Preto', 'XVI - Sorocaba', 'XVII - Taubaté',
];

const AREAS_ENCAMINHAMENTO = ['GPC', 'DRS', 'Consultoria Jurídica', 'Comitê Gestor', 'Gabinete do Secretário', 'Devolvido à Conveniada'];

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (d: string | null | undefined) => {
  if (!d) return '-';
  const [y, m, day] = d.slice(0, 10).split('-');
  return `${day}/${m}/${y}`;
};

const fmtBRL = (v: number | null | undefined) =>
  v == null ? '-' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const RESPOSTA_LABEL: Record<string, string> = { SIM: 'SIM', NAO: 'NÃO', NAO_SE_APLICA: 'N/A', OUTROS: 'OUTROS' };

// Normaliza documento_sei para array — blindagem contra a coluna ainda estar no tipo
// antigo (TEXT, uma string só) num banco onde a migration parte_66 não tiver rodado
// ainda; sem isso um valor legado quebra a tela inteira (ver ChecklistItemRow).
const toLinks = (raw: string[] | string | null | undefined): string[] =>
  Array.isArray(raw) ? raw : raw ? [raw] : [];

// Cada item de documento_sei continua sendo uma string (sem alterar o schema/tipo da
// coluna) — quando tem número de página, vira um JSON `{url, pagina}`; quando não tem,
// continua sendo a URL pura (formato legado, inclusive dos links já salvos antes desta
// funcionalidade existir). parseLink faz o parse tolerante dos dois formatos.
interface DocSeiLink { url: string; pagina?: string }

const parseLink = (raw: string): DocSeiLink => {
  if (raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.url === 'string') {
        return { url: parsed.url, pagina: parsed.pagina || undefined };
      }
    } catch { /* não era JSON — trata como link puro mesmo começando com "{" */ }
  }
  return { url: raw };
};

const serializeLink = (link: DocSeiLink): string =>
  link.pagina?.trim() ? JSON.stringify({ url: link.url, pagina: link.pagina.trim() }) : link.url;

// Brasão de SP carregado uma vez e cacheado em base64 (jsPDF.addImage precisa de
// dados da imagem, não só a URL do asset) — mesmo brasão usado no cabeçalho dos
// PDFs oficiais "Check Entidade"/"Check List Prefeitura".
let brasaoDataUrlCache: string | null = null;
async function getBrasaoDataUrl(): Promise<string | null> {
  if (brasaoDataUrlCache) return brasaoDataUrlCache;
  try {
    const res = await fetch(brasaoUrl);
    const blob = await res.blob();
    brasaoDataUrlCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return brasaoDataUrlCache;
  } catch { return null; }
}

// ─── exportação PDF da ficha preenchida (despacho + checklist) — mesmo padrão
// jsPDF + autoTable usado em GgconProcessos.tsx/ProcessManager.tsx ───────────
const exportAnaliseFichaPDF = async (analise: GgconAnalise, itens: GgconAnaliseItem[], exercicios: GgconAnaliseExercicio[]) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  const brasao = await getBrasaoDataUrl();
  const textX = brasao ? 32 : 14;
  if (brasao) {
    try { doc.addImage(brasao, 'PNG', 14, 6, 14, 16); } catch { /* segue sem o brasão se a imagem falhar */ }
  }
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SECRETARIA DA SAÚDE', textX, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('COORDENADORIA DE GESTÃO ORÇAMENTÁRIA E FINANCEIRA', textX, 16.5);
  doc.setFontSize(8);
  doc.text(
    analise.tipo_conveniada === 'ENTIDADE'
      ? 'GRUPO DE PRESTAÇÃO DE CONTAS — INSTRUÇÕES 01/2024 (Entidades)'
      : 'GRUPO DE GESTÃO DE CONVÊNIOS — PRESTAÇÃO DE CONTAS (Prefeituras)',
    textX, 21,
  );

  doc.setDrawColor(30, 64, 175);
  doc.setLineWidth(0.6);
  doc.line(marginX, 25, pageWidth - marginX, 25);

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DESPACHO', pageWidth / 2, 33, { align: 'center' });
  doc.setFont('helvetica', 'normal');

  // Rótulo em negrito seguido do valor em fonte normal, na mesma linha — mais legível
  // que a versão anterior "Rótulo: valor" toda no mesmo peso de fonte.
  let y = 42;
  doc.setFontSize(9);
  const col1 = marginX, col2 = 195;
  const rowWidth = pageWidth - marginX * 2;
  const field = (x: number, label: string, value: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, y);
    const labelWidth = doc.getTextWidth(`${label}:`) + 1.5;
    doc.setFont('helvetica', 'normal');
    doc.text(value || '-', x + labelWidth, y);
  };
  // Campos que podem vir com texto longo (nome de conveniada, objeto do convênio)
  // quebram linha dentro da largura da linha inteira — sem isso, texto comprido
  // estourava a margem direita da página. Retorna a quantidade de linhas usadas
  // para o chamador ajustar o próximo "y".
  const fieldWrapped = (x: number, label: string, value: string, maxWidth: number): number => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${label}:`, x, y);
    const labelWidth = doc.getTextWidth(`${label}:`) + 1.5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(value || '-', maxWidth - labelWidth);
    doc.text(lines, x + labelWidth, y);
    return lines.length;
  };
  field(col1, 'Convênio Nº', analise.convenio_numero ?? '-');
  field(col2, 'Processo SEI', analise.processo_sei);
  y += 6;
  field(col1, 'Exercício(s)', exercicios.map(e => e.exercicio != null ? String(e.exercicio) : 'Não especificado').join(', ') || '-');
  y += 6;
  field(col1, 'CNPJ', analise.cnpj ?? '-');
  field(col2, 'Tipo', GGCON_TIPO_CONVENIADA_LABELS[analise.tipo_conveniada]);
  y += 6;
  y += fieldWrapped(col1, 'Interessado', analise.interessado ?? '-', rowWidth) * 5;
  y += fieldWrapped(col1, 'Objeto do Convênio', analise.objeto ?? '-', rowWidth) * 5 + 1;
  field(col1, 'Custeio/Investimento', [analise.custeio ? 'Custeio' : null, analise.investimento ? 'Investimento' : null].filter(Boolean).join(' + ') || '-');
  field(col2, 'Valor Total do Repasse', fmtBRL(analise.valor_repasse));
  y += 6;
  field(col1, 'Vigência', `${fmtDate(analise.vigencia_inicio)} a ${fmtDate(analise.vigencia_termino)}${analise.vigencia_prorrogado_ate ? ` (prorrogado até ${fmtDate(analise.vigencia_prorrogado_ate)})` : ''}`);
  y += 6;
  field(col1, 'Termo(s) Aditivo(s)', analise.termo_aditivo_numeros?.join(', ') || '-');
  field(col2, 'Resolução Nº', analise.resolucao_numero ?? '-');
  y += 6;
  field(col1, 'Retirratificação', analise.termo_retirratificacao ? 'Sim' : 'Não');
  field(col2, 'Município/DRS', [analise.municipio, analise.drs_unidade].filter(Boolean).join(' — ') || '-');

  y += 5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(marginX, y, pageWidth - marginX, y);

  // Coluna "Documento SEI": quando o item tem link(s) colados pelo analista, o texto
  // vira hyperlink clicável (azul + doc.link sobrepondo a linha renderizada) em vez de
  // texto solto — reaproveita a quebra de linha nativa do autoTable (um link por linha,
  // igual ao \n já usado nas sublistas a)/b)/c) da descrição).
  const DOCUMENTO_SEI_COL = 3;
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = y + 5;
  const gruposExercicio = exercicios.length ? exercicios : [{ id: -1, analise_id: analise.id, exercicio: null } as GgconAnaliseExercicio];
  gruposExercicio.forEach(ex => {
    const itensEx = exercicios.length ? itens.filter(i => i.exercicio_id === ex.id) : itens;
    if (cursorY > pageHeight - 25) { doc.addPage(); cursorY = 14; }
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`Checklist — Exercício ${ex.exercicio != null ? ex.exercicio : 'Não especificado'}`, marginX, cursorY);
    doc.setFont('helvetica', 'normal');
    autoTable(doc, {
      startY: cursorY + 3,
      styles: { fontSize: 7, cellPadding: 1.3, valign: 'middle' },
      headStyles: { fillColor: [30, 64, 175] },
      columnStyles: { 0: { cellWidth: 9 }, 1: { cellWidth: 130 }, 2: { cellWidth: 18, halign: 'center' }, [DOCUMENTO_SEI_COL]: { cellWidth: 55, fontSize: 6 }, 4: { cellWidth: 40, fontSize: 6.5 } },
      head: [['Item', 'Descrição dos Documentos da Conveniada', 'Atendeu', 'Documento SEI', 'Observação']],
      body: itensEx.map(i => {
        const dica = CHECKLISTS[analise.tipo_conveniada].find(t => t.numero === i.item_numero)?.dica;
        const links = toLinks(i.documento_sei).map(parseLink);
        const docCell = links.length ? links.map(l => l.pagina ? `${l.url} (pág. ${l.pagina})` : l.url).join('\n') : (dica || '-');
        return [String(i.item_numero), i.item_descricao, RESPOSTA_LABEL[i.resposta ?? ''] ?? '-', docCell, i.observacao ?? '-'];
      }),
      didParseCell: (data) => {
        if (data.column.index === DOCUMENTO_SEI_COL && data.section === 'body') {
          const links = toLinks(itensEx[data.row.index]?.documento_sei);
          if (links.length) data.cell.styles.textColor = [37, 99, 235];
        }
      },
      didDrawCell: (data) => {
        if (data.column.index === DOCUMENTO_SEI_COL && data.section === 'body') {
          const links = toLinks(itensEx[data.row.index]?.documento_sei).map(parseLink);
          if (links.length) {
            const lineHeight = data.cell.height / links.length;
            links.forEach(({ url }, idx) => {
              doc.link(data.cell.x, data.cell.y + idx * lineHeight, data.cell.width, lineHeight, { url });
            });
          }
        }
      },
    });
    cursorY = (doc as any).lastAutoTable.finalY + 8;
  });

  const finalY = cursorY;
  doc.setFontSize(9);
  doc.text(
    `Analista Responsável: ${analise.analista_atual ?? '-'}      Status: ${GGCON_ANALISE_STATUS_LABELS[analise.status]}`,
    14, finalY,
  );
  doc.text(
    `Recebimento: ${fmtDate(analise.data_recebimento)}      Atribuição: ${fmtDate(analise.data_liberacao)}      Conclusão: ${fmtDate(analise.data_analise)}      Encaminhamento: ${analise.area_encaminhamento ?? '-'} (${fmtDate(analise.data_encaminhamento)})`,
    14, finalY + 5,
  );
  let proximaLinhaY = finalY + 10;
  if (analise.pendencia_descricao) {
    const linhas = doc.splitTextToSize(`Pendência (${fmtDate(analise.data_pendencia)}): ${analise.pendencia_descricao}`, 270);
    doc.text(linhas, 14, proximaLinhaY);
    proximaLinhaY += linhas.length * 5;
  }
  if (analise.observacoes) {
    doc.text(doc.splitTextToSize(`Observações: ${analise.observacoes}`, 270), 14, proximaLinhaY);
  }

  doc.save(`analise_${analise.processo_sei.replace(/\D/g, '')}.pdf`);
};

// ─── shared styles (mesmos tokens usados em GgconProcessos.tsx) ──────────────

const INPUT = 'w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all shadow-sm placeholder:text-slate-300';
const LABEL = 'block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5';
const BTN_PRIMARY = 'inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm';
const BTN_PRIMARY_GREEN = BTN_PRIMARY.replace('bg-blue-600', 'bg-green-600').replace('hover:bg-blue-700', 'hover:bg-green-700');
const BTN_PRIMARY_RED = BTN_PRIMARY.replace('bg-blue-600', 'bg-red-600').replace('hover:bg-blue-700', 'hover:bg-red-700');
const BTN_GHOST = 'inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-sm';
const BTN_MUTED = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors';
const BTN_PRIMARY_LG = 'inline-flex items-center gap-2 px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg';

// ─── Modal ────────────────────────────────────────────────────────────────────

const Modal = ({ title, subtitle, onClose, children, size = 'lg' }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode; size?: 'md' | 'lg' | 'xl';
}) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    // stopPropagation aqui evita que o clique feche também um overlay "pai" quando este
    // Modal é aberto por cima de outro (ex.: confirmar senha de Resetar dentro da tela
    // de Análise) — sem isso, o clique no fundo fecharia os dois de uma vez.
    onClick={e => { e.stopPropagation(); onClose(); }}
  >
    <div
      className={`bg-slate-50/95 rounded-2xl shadow-2xl ring-1 ring-black/5 w-full ${size === 'md' ? 'max-w-xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-3xl'} max-h-[92vh] flex flex-col`}
      onClick={e => e.stopPropagation()}
    >
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

const Sec = ({ title }: { title: string }) => (
  <div className="flex items-center gap-2.5 pt-1 pb-1">
    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">{title}</span>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);

// ─── Status badge ─────────────────────────────────────────────────────────────

const statusTone = (status: GgconAnaliseStatus): { bg: string; text: string; border: string } => {
  switch (status) {
    case 'AGUARDANDO_LIBERACAO': return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' };
    case 'AGUARDANDO_ANALISE': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'EM_ANALISE': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'AGUARDANDO_ASSINATURA': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'CONFERENCIA_PENDENCIA': return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    case 'CONCLUIDA': return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
  }
};

const StatusBadge = ({ status }: { status: GgconAnaliseStatus }) => {
  const c = statusTone(status);
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${c.bg} ${c.text} ${c.border}`}>
      {GGCON_ANALISE_STATUS_LABELS[status]}
    </span>
  );
};

// Etiqueta visual "Novo" — não é um status novo na máquina de estados (continua
// AGUARDANDO_LIBERACAO como qualquer cadastro manual), só sinaliza que este
// registro veio automaticamente de "Processos GGCON" (Tipo = Prestação de Contas)
// e ainda ninguém liberou. Controlada por `novo_destaque` (coluna própria de
// destaque/ordenação — ver getFila em ggconAnaliseService.ts), que o service já
// zera assim que alguém libera ou corrige o status manualmente.
const NovoBadge = () => (
  <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap bg-cyan-50 text-cyan-700 border-cyan-200">
    Novo
  </span>
);

const ProgressoChecklist = ({ respondidos, total }: { respondidos: number; total: number }) => {
  if (!total) return <span className="text-slate-300 text-xs">-</span>;
  const pct = Math.round((respondidos / total) * 100);
  const cor = pct === 100 ? 'bg-green-500' : pct > 0 ? 'bg-blue-500' : 'bg-slate-300';
  return (
    <div className="min-w-[110px]">
      <div className="flex justify-between text-[10px] text-slate-500 mb-1">
        <span>{respondidos}/{total}</span><span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${cor} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// ─── Confirmação por senha (mesmo padrão usado em GgconProcessos.tsx / ProcessManager.tsx) ─

const PasswordConfirmModal = ({
  title, message, onCancel, onConfirm,
  confirmLabel = 'Excluir', confirmIcon: ConfirmIcon = Trash2, tone = 'red',
  extraLabel, extraValue, onExtraChange,
}: {
  title: string; message: string; onCancel: () => void; onConfirm: (password: string) => Promise<void>;
  confirmLabel?: string; confirmIcon?: any; tone?: 'red' | 'amber';
  extraLabel?: string; extraValue?: string; onExtraChange?: (v: string) => void;
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

  const toneClasses = tone === 'amber' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700';

  return (
    <Modal title={title} onClose={onCancel} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">{message}</p>
        {extraLabel && (
          <div>
            <label className={LABEL}>{extraLabel}</label>
            <textarea className={INPUT} rows={2} value={extraValue ?? ''} onChange={e => onExtraChange?.(e.target.value)}/>
          </div>
        )}
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
            className={`inline-flex items-center gap-2 px-4 py-2.5 ${toneClasses} text-white text-sm font-semibold rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm`}
          >
            {busy ? <Loader2 size={16} className="animate-spin"/> : <ConfirmIcon size={16}/>}{confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Row menu (três pontos) ────────────────────────────────────────────────────

const RowMenu = ({ items }: { items: { label: string; icon: any; onClick: () => void; danger?: boolean }[] }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + 4, left: rect.right - 176 });
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

  if (!items.length) return null;

  return (
    <>
      <button ref={btnRef} className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors" title="Mais ações" onClick={toggle}>
        <MoreVertical size={16}/>
      </button>
      {open && pos && createPortal(
        <div ref={menuRef} className="fixed z-50 bg-white rounded-lg shadow-lg border border-slate-200 py-1 w-44" style={{ top: pos.top, left: pos.left }}>
          {items.map(it => (
            <button
              key={it.label}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${it.danger ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50'}`}
              onClick={() => { setOpen(false); it.onClick(); }}
            >
              <it.icon size={14}/>{it.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
};

// ─── Barra de gestão de exercícios (usada no formulário de cadastro e na tela de
// detalhe) — cada exercício tem seu próprio checklist. `itens`/`onSelect` são
// opcionais: quando ausentes (uso no formulário de cadastro), a barra vira só
// gestão estrutural (adicionar/renomear/remover), sem badge de progresso nem
// seleção de aba — quem responde o checklist é sempre a tela "Abrir Análise".
const ExerciciosBar = ({ exercicios, itens, activeId, onSelect, analiseId, tipoConveniada, criadoPor, canManage, onChanged }: {
  exercicios: GgconAnaliseExercicio[];
  itens?: GgconAnaliseItem[];
  activeId?: number | null;
  onSelect?: (id: number) => void;
  analiseId: number;
  tipoConveniada: GgconTipoConveniada;
  criadoPor: string;
  canManage: boolean;
  onChanged: () => void | Promise<void>;
}) => {
  const { toast } = useToast();
  const [novoAno, setNovoAno] = useState('');
  const [showNovo, setShowNovo] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);

  // Um exercício sem ano definido (herdado de análises antigas, de antes do ano
  // virar obrigatório) não é exibido como opção válida — some da lista assim que o
  // técnico define o ano dele. Quando é o único exercício da análise, "Adicionar"
  // corrige o ano desse mesmo registro (preservando o checklist já existente) em
  // vez de criar um segundo, que deixaria o placeholder vazio pra trás.
  const semAnoUnico = exercicios.length === 1 && exercicios[0].exercicio == null ? exercicios[0] : null;

  const adicionar = async () => {
    if (!novoAno.trim()) { toast('error', 'Informe o ano do exercício.'); return; }
    const ano = Number(novoAno.trim());
    try {
      if (semAnoUnico) await GgconAnaliseService.atualizarExercicio(semAnoUnico.id, ano);
      else await GgconAnaliseService.adicionarExercicio(analiseId, ano, tipoConveniada, criadoPor);
      setNovoAno('');
      setShowNovo(false);
      await onChanged();
      toast('success', 'Exercício adicionado.');
    } catch (ex: any) { toast('error', ex.message); }
  };

  const renomear = async (id: number, valor: string) => {
    setEditandoId(null);
    const ano = valor.trim() ? Number(valor.trim()) : null;
    try { await GgconAnaliseService.atualizarExercicio(id, ano); await onChanged(); }
    catch (ex: any) { toast('error', ex.message); }
  };

  const remover = async (ex: GgconAnaliseExercicio) => {
    const itensEx = itens?.filter(i => i.exercicio_id === ex.id);
    const rotulo = ex.exercicio != null ? String(ex.exercicio) : 'sem ano definido';
    const aviso = itensEx ? ` O checklist dele (${itensEx.filter(i => i.resposta).length}/${itensEx.length} itens respondidos) será perdido.` : ' O checklist dele será perdido.';
    if (!window.confirm(`Remover o exercício ${rotulo}?${aviso}`)) return;
    try {
      await GgconAnaliseService.removerExercicio(analiseId, ex.id);
      await onChanged();
      toast('success', 'Exercício removido.');
    } catch (ex2: any) { toast('error', ex2.message); }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {exercicios.filter(ex => ex.exercicio != null).map(ex => {
        const itensEx = itens?.filter(i => i.exercicio_id === ex.id);
        const isActive = !!onSelect && ex.id === activeId;
        const isEditing = editandoId === ex.id;
        return (
          <div
            key={ex.id}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-xs ${isActive ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
          >
            {isEditing ? (
              <input
                autoFocus
                type="number"
                className="w-16 border border-slate-200 rounded px-1 py-0.5 text-xs"
                defaultValue={ex.exercicio ?? ''}
                onBlur={e => renomear(ex.id, e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') setEditandoId(null); }}
              />
            ) : (
              <button
                type="button"
                className="font-medium"
                onClick={() => onSelect?.(ex.id)}
                onDoubleClick={() => canManage && setEditandoId(ex.id)}
                title={canManage ? (onSelect ? 'Clique para selecionar · duplo clique para editar o ano' : 'Duplo clique para editar o ano') : undefined}
              >
                Exercício {ex.exercicio}
              </button>
            )}
            {itensEx && <span className="text-[10px] opacity-70">{itensEx.filter(i => i.resposta).length}/{itensEx.length}</span>}
            {canManage && (
              <button type="button" title="Remover este exercício" className="text-slate-300 hover:text-red-500" onClick={() => remover(ex)}>
                <X size={11}/>
              </button>
            )}
          </div>
        );
      })}
      {canManage && (
        showNovo ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="number"
              placeholder="Ano"
              className="w-16 border border-slate-200 rounded px-1 py-0.5 text-xs"
              value={novoAno}
              onChange={e => setNovoAno(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); adicionar(); } if (e.key === 'Escape') setShowNovo(false); }}
            />
            <button type="button" title="Confirmar" className="text-blue-600 hover:text-blue-800" onClick={adicionar}><Check size={13}/></button>
            <button type="button" title="Cancelar" className="text-slate-400 hover:text-slate-600" onClick={() => { setShowNovo(false); setNovoAno(''); }}><X size={13}/></button>
          </div>
        ) : (
          <button type="button" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-1.5 py-1" onClick={() => setShowNovo(true)}>
            <Plus size={12}/>Adicionar Exercício
          </button>
        )
      )}
    </div>
  );
};

// ─── Formulário de Despacho (cadastro/edição do cabeçalho) ────────────────────

const DespachoForm = ({ initial, onSave, onClose, lockRecebimento }: {
  initial?: Partial<GgconAnalise>;
  onSave: (p: Partial<GgconAnalise> & { exercicios?: number[] }) => Promise<void>;
  onClose: () => void;
  // Analista responsável pode editar o cadastro a partir da tela de análise, mas não
  // mexe no Nº do Processo SEI (já travado abaixo via isEdit) nem na Data de
  // Recebimento (é o marco de entrada do processo, só quem libera corrige).
  lockRecebimento?: boolean;
}) => {
  const { currentUser } = useApp();
  const [form, setForm] = useState<Partial<GgconAnalise> & { termoAditivoTexto?: string; exerciciosTexto?: string }>({
    custeio: false, investimento: false, termo_retirratificacao: false, tipo_conveniada: 'ENTIDADE',
    data_recebimento: new Date().toISOString().slice(0, 10),
    ...initial,
    termoAditivoTexto: initial?.termo_aditivo_numeros?.join(', ') ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const isEdit = !!initial?.id;
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  // Exercícios de uma análise já existente — geridos aqui direto (add/renomear/
  // remover já persistem na hora, fora do submit do formulário), já que processos
  // já cadastrados também precisam continuar acessíveis para isso mesmo fora da
  // tela "Abrir Análise" (ex.: "Editar Cadastro" a partir da listagem).
  const [exerciciosExistentes, setExerciciosExistentes] = useState<GgconAnaliseExercicio[]>([]);
  const [loadingExercicios, setLoadingExercicios] = useState(isEdit);
  const reloadExercicios = useCallback(async () => {
    if (!initial?.id) return;
    setExerciciosExistentes(await GgconAnaliseService.getExercicios(initial.id));
  }, [initial?.id]);
  useEffect(() => {
    if (!isEdit) return;
    reloadExercicios().finally(() => setLoadingExercicios(false));
  }, [isEdit, reloadExercicios]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.processo_sei?.trim()) { setErr('Informe o número do processo SEI.'); return; }
    if (!form.tipo_conveniada) { setErr('Informe o tipo de conveniada.'); return; }
    // Toda análise precisa nascer com pelo menos 1 exercício (cada um com seu
    // próprio checklist) — ver AnaliseDetalheOverlay para adicionar mais depois.
    const exercicios = Array.from(new Set(
      (form.exerciciosTexto ?? '').split(',').map(s => s.trim()).filter(Boolean).map(Number).filter(n => !isNaN(n)),
    ));
    if (!isEdit && exercicios.length === 0) { setErr('Informe ao menos um exercício.'); return; }
    setSaving(true); setErr('');
    try {
      const termoAditivoNumeros = (form.termoAditivoTexto ?? '').split(',').map(s => s.trim()).filter(Boolean);
      await onSave({ ...form, termo_aditivo_numeros: termoAditivoNumeros, exercicios });
      onClose();
    } catch (ex: any) { setErr(ex.message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}

      <Sec title="Identificação" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Nº do Processo SEI *</label>
          <input className={INPUT} value={form.processo_sei ?? ''} onChange={e => set('processo_sei', e.target.value)} placeholder="000.00000000/0000-00" required disabled={isEdit}/>
        </div>
        <div className={isEdit ? '' : 'grid grid-cols-3 gap-2'}>
          <div className={isEdit ? '' : 'col-span-2'}>
            <label className={LABEL}>Nº do Convênio</label>
            <input className={INPUT} value={form.convenio_numero ?? ''} onChange={e => set('convenio_numero', e.target.value)}/>
          </div>
          {!isEdit && (
            <div>
              <label className={LABEL}>Exercício(s) *</label>
              <input
                className={INPUT}
                value={form.exerciciosTexto ?? ''}
                onChange={e => set('exerciciosTexto', e.target.value)}
                placeholder="2024, 2025"
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">Um checklist será criado para cada exercício informado. Mais podem ser adicionados depois.</p>
            </div>
          )}
        </div>
        {isEdit && initial?.id && (
          <div className="sm:col-span-2">
            <label className={LABEL}>Exercício(s)</label>
            {loadingExercicios ? (
              <p className="text-xs text-slate-400 flex items-center gap-1.5"><Loader2 size={12} className="animate-spin"/>Carregando…</p>
            ) : (
              <ExerciciosBar
                exercicios={exerciciosExistentes}
                analiseId={initial.id}
                tipoConveniada={form.tipo_conveniada ?? 'ENTIDADE'}
                criadoPor={currentUser?.name ?? ''}
                canManage
                onChanged={reloadExercicios}
              />
            )}
            <p className="text-[11px] text-slate-400 mt-1">Cada exercício tem seu próprio checklist — respondido em "Abrir Análise".</p>
          </div>
        )}
        <div>
          <label className={LABEL}>CNPJ</label>
          <input className={INPUT} value={form.cnpj ?? ''} onChange={e => set('cnpj', e.target.value)}/>
        </div>
        <div>
          <label className={LABEL}>Tipo de Conveniada *</label>
          <select className={INPUT} value={form.tipo_conveniada ?? ''} onChange={e => set('tipo_conveniada', e.target.value as GgconTipoConveniada)} required disabled={isEdit}>
            {Object.entries(GGCON_TIPO_CONVENIADA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          {isEdit && <p className="text-[11px] text-slate-400 mt-1">Não é possível trocar o tipo depois que o checklist foi criado.</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Interessado</label>
          <input className={INPUT} value={form.interessado ?? ''} onChange={e => set('interessado', e.target.value)}/>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Objeto do Convênio</label>
          <textarea className={INPUT} rows={2} value={form.objeto ?? ''} onChange={e => set('objeto', e.target.value)}/>
        </div>
      </div>

      <Sec title="Localização" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Município</label>
          <ListInput
            id="dl-analise-municipio"
            options={MUNICIPIOS}
            value={form.municipio ?? ''}
            onChange={v => {
              set('municipio', v || null);
              const drs = buscarDRSPorMunicipio(v);
              if (drs) set('drs_unidade', drs);
            }}
          />
        </div>
        <div>
          <label className={LABEL}>DRS / Unidade</label>
          <ListInput id="dl-analise-drs" options={DRS_UNIDADES} value={form.drs_unidade ?? ''} onChange={v => set('drs_unidade', v || null)}/>
        </div>
      </div>

      <Sec title="Repasse" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${form.custeio ? 'bg-blue-50 border-blue-300' : 'bg-white border-slate-200'}`}>
          <input type="checkbox" checked={form.custeio ?? false} onChange={e => set('custeio', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded"/>
          <span className="text-sm font-medium text-slate-700">Custeio</span>
        </label>
        <label className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition-all ${form.investimento ? 'bg-purple-50 border-purple-300' : 'bg-white border-slate-200'}`}>
          <input type="checkbox" checked={form.investimento ?? false} onChange={e => set('investimento', e.target.checked)} className="w-4 h-4 accent-purple-600 rounded"/>
          <span className="text-sm font-medium text-slate-700">Investimento (Obra)</span>
        </label>
        <div>
          <label className={LABEL}>Valor Total do Repasse (R$)</label>
          <input className={INPUT} type="number" step="0.01" min={0} value={form.valor_repasse ?? ''} onChange={e => set('valor_repasse', e.target.value ? Number(e.target.value) : null)}/>
        </div>
      </div>

      <Sec title="Vigência do Ajuste" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={LABEL}>Início</label>
          <input className={INPUT} type="date" value={form.vigencia_inicio ?? ''} onChange={e => set('vigencia_inicio', e.target.value || null)}/>
        </div>
        <div>
          <label className={LABEL}>Término</label>
          <input className={INPUT} type="date" value={form.vigencia_termino ?? ''} onChange={e => set('vigencia_termino', e.target.value || null)}/>
        </div>
        <div>
          <label className={LABEL}>Prorrogado até</label>
          <input className={INPUT} type="date" value={form.vigencia_prorrogado_ate ?? ''} onChange={e => set('vigencia_prorrogado_ate', e.target.value || null)}/>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Termo(s) Aditivo(s) — números separados por vírgula</label>
          <input className={INPUT} value={form.termoAditivoTexto ?? ''} onChange={e => set('termoAditivoTexto', e.target.value)} placeholder="Ex.: 12/2024, 03/2025"/>
        </div>
        <div>
          <label className={LABEL}>Resolução Nº</label>
          <input className={INPUT} value={form.resolucao_numero ?? ''} onChange={e => set('resolucao_numero', e.target.value)}/>
        </div>
        <label className="sm:col-span-3 flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer w-fit">
          <input type="checkbox" checked={form.termo_retirratificacao ?? false} onChange={e => set('termo_retirratificacao', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded"/>
          <span className="text-sm font-medium text-slate-700">Termo de Retirratificação</span>
        </label>
      </div>

      <Sec title="Recebimento" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Data de Recebimento</label>
          <input className={INPUT} type="date" value={form.data_recebimento ?? ''} onChange={e => set('data_recebimento', e.target.value || null)} disabled={lockRecebimento}/>
          {lockRecebimento && <p className="text-[11px] text-slate-400 mt-1">Só quem libera processos para análise pode corrigir a data de recebimento.</p>}
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

// ─── Liberar para análise ──────────────────────────────────────────────────────

const LiberarModal = ({ analise, analistas, onConfirm, onClose }: {
  analise: GgconAnalise; analistas: string[]; onConfirm: (analista: string) => Promise<void>; onClose: () => void;
}) => {
  const [analista, setAnalista] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analista) { setErr('Selecione o analista responsável.'); return; }
    setBusy(true); setErr('');
    try { await onConfirm(analista); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Liberar para Análise" subtitle={`Processo SEI ${analise.processo_sei}`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Analista Responsável *</label>
          <select className={INPUT} value={analista} onChange={e => { setAnalista(e.target.value); setErr(''); }} required autoFocus>
            <option value="">Selecione...</option>
            {analistas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
          <button type="submit" className={BTN_PRIMARY_GREEN} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}Liberar
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Reatribuir analista ────────────────────────────────────────────────────────

const ReatribuirModal = ({ analise, analistas, onConfirm, onClose }: {
  analise: GgconAnalise; analistas: string[]; onConfirm: (novoAnalista: string, motivo: string) => Promise<void>; onClose: () => void;
}) => {
  const [analista, setAnalista] = useState('');
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analista) { setErr('Selecione o novo analista responsável.'); return; }
    setBusy(true); setErr('');
    try { await onConfirm(analista, motivo); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Reatribuir Analista" subtitle={`Processo SEI ${analise.processo_sei} — atualmente com ${analise.analista_atual ?? 'ninguém'}`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Novo Analista Responsável *</label>
          <select className={INPUT} value={analista} onChange={e => { setAnalista(e.target.value); setErr(''); }} required autoFocus>
            <option value="">Selecione...</option>
            {analistas.filter(a => a !== analise.analista_atual).map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Motivo (opcional)</label>
          <textarea className={INPUT} rows={2} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex.: férias, redistribuição de carga de trabalho..."/>
        </div>
        {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
          <button type="submit" className={BTN_PRIMARY} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin"/> : <UserCog size={16}/>}Reatribuir
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Alterar status manualmente ─────────────────────────────────────────────────
// Correção direta pra quem libera processos — principalmente para os registros
// importados da planilha antiga (já vêm "Concluída" mas sem checklist digitalizado
// aqui) ou qualquer outra situação que não se encaixe no fluxo automático.

const AlterarStatusModal = ({ analise, onConfirm, onClose }: {
  analise: GgconAnalise; onConfirm: (novoStatus: GgconAnaliseStatus, motivo: string) => Promise<void>; onClose: () => void;
}) => {
  const [novoStatus, setNovoStatus] = useState<GgconAnaliseStatus>(analise.status);
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (novoStatus === analise.status) { setErr('Selecione um status diferente do atual.'); return; }
    if (!motivo.trim()) { setErr('Informe o motivo da alteração.'); return; }
    setBusy(true); setErr('');
    try { await onConfirm(novoStatus, motivo.trim()); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Alterar Status" subtitle={`Processo SEI ${analise.processo_sei} — status atual: ${GGCON_ANALISE_STATUS_LABELS[analise.status]}`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Isso só muda o status — não mexe no checklist nem nas datas. Exceção: se o novo status for "Aguardando Liberação", o analista responsável é removido automaticamente (esse status significa "ainda não atribuído a ninguém"). Use para corrigir registros importados ou situações que não se encaixam no fluxo normal (Liberar → Analisar → Concluir → Encaminhar).
        </p>
        <div>
          <label className={LABEL}>Novo Status *</label>
          <select className={INPUT} value={novoStatus} onChange={e => { setNovoStatus(e.target.value as GgconAnaliseStatus); setErr(''); }} required autoFocus>
            {Object.entries(GGCON_ANALISE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Motivo *</label>
          <textarea className={INPUT} rows={2} value={motivo} onChange={e => { setMotivo(e.target.value); setErr(''); }} placeholder="Ex.: registro importado da planilha antiga, já concluído no processo real."/>
        </div>
        {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
          <button type="submit" className={BTN_PRIMARY} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin"/> : <RefreshCw size={16}/>}Alterar Status
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ─── Liberar / Reatribuir em lote (várias linhas selecionadas de uma vez) ──────

const LiberarLoteModal = ({ quantidade, analistas, onConfirm, onClose }: {
  quantidade: number; analistas: string[]; onConfirm: (analista: string) => Promise<void>; onClose: () => void;
}) => {
  const [analista, setAnalista] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analista) { setErr('Selecione o analista responsável.'); return; }
    setBusy(true); setErr('');
    try { await onConfirm(analista); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Liberar em Lote" subtitle={`${quantidade} processo${quantidade !== 1 ? 's' : ''} selecionado${quantidade !== 1 ? 's' : ''} — só os que estão "Aguardando Liberação" serão liberados`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Analista Responsável *</label>
          <select className={INPUT} value={analista} onChange={e => { setAnalista(e.target.value); setErr(''); }} required autoFocus>
            <option value="">Selecione...</option>
            {analistas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
          <button type="submit" className={BTN_PRIMARY_GREEN} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}Liberar todos
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ReatribuirLoteModal = ({ quantidade, analistas, onConfirm, onClose }: {
  quantidade: number; analistas: string[]; onConfirm: (novoAnalista: string, motivo: string) => Promise<void>; onClose: () => void;
}) => {
  const [analista, setAnalista] = useState('');
  const [motivo, setMotivo] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analista) { setErr('Selecione o novo analista responsável.'); return; }
    setBusy(true); setErr('');
    try { await onConfirm(analista, motivo); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Reatribuir em Lote" subtitle={`${quantidade} processo${quantidade !== 1 ? 's' : ''} selecionado${quantidade !== 1 ? 's' : ''} — só os que já estão em análise serão reatribuídos`} onClose={onClose} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={LABEL}>Novo Analista Responsável *</label>
          <select className={INPUT} value={analista} onChange={e => { setAnalista(e.target.value); setErr(''); }} required autoFocus>
            <option value="">Selecione...</option>
            {analistas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className={LABEL}>Motivo (opcional)</label>
          <textarea className={INPUT} rows={2} value={motivo} onChange={e => setMotivo(e.target.value)} placeholder="Ex.: férias, redistribuição de carga de trabalho..."/>
        </div>
        {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
          <button type="submit" className={BTN_PRIMARY} disabled={busy}>
            {busy ? <Loader2 size={16} className="animate-spin"/> : <UserCog size={16}/>}Reatribuir todos
          </button>
        </div>
      </form>
    </Modal>
  );
};

const ConfirmarAssinaturaLoteModal = ({ quantidade, onConfirm, onClose }: {
  quantidade: number; onConfirm: () => Promise<void>; onClose: () => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleConfirm = async () => {
    setBusy(true); setErr('');
    try { await onConfirm(); onClose(); }
    catch (ex: any) { setErr(ex.message); }
    finally { setBusy(false); }
  };

  return (
    <Modal title="Confirmar Assinatura em Lote" subtitle={`${quantidade} processo${quantidade !== 1 ? 's' : ''} selecionado${quantidade !== 1 ? 's' : ''} — só os que estão "Aguardando Assinatura" e ainda não assinados serão confirmados`} onClose={onClose} size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">Confirma a assinatura de todos os processos elegíveis selecionados? Fica registrado no histórico de cada um, com sua data e seu nome.</p>
        {err && <div className="flex items-center gap-2 text-red-600 text-sm"><AlertCircle size={16}/>{err}</div>}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" className={BTN_GHOST} onClick={onClose}>Cancelar</button>
          <button type="button" className={BTN_PRIMARY} disabled={busy} onClick={handleConfirm}>
            {busy ? <Loader2 size={16} className="animate-spin"/> : <FileSignature size={16}/>}Confirmar todos
          </button>
        </div>
      </div>
    </Modal>
  );
};

// ─── Consolidado por Analista — painel gerencial para quem libera processos ────

const ConsolidadoTonePorIdade = (dias: number | null): string => {
  if (dias == null) return 'text-slate-400';
  if (dias > 60) return 'text-red-600 font-bold';
  if (dias > 30) return 'text-amber-600 font-semibold';
  return 'text-slate-600';
};

const ConsolidadoPorAnalista = ({ onClose }: { onClose: () => void }) => {
  const [linhas, setLinhas] = useState<Awaited<ReturnType<typeof GgconAnaliseService.getConsolidadoPorAnalista>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    GgconAnaliseService.getConsolidadoPorAnalista().then(r => { setLinhas(r); setLoading(false); });
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Users size={15} className="text-blue-600"/>Consolidado por Analista</h3>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={15}/></button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 size={22} className="animate-spin text-blue-500"/></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Analista', 'Aguardando Análise', 'Em Análise', 'Concluídas', 'Total', 'Tempo médio p/ concluir', 'Mais antigo em aberto'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map(l => (
                <tr key={l.analista} className="border-t border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{l.analista}</td>
                  <td className="px-4 py-2.5 text-slate-600">{l.aguardandoAnalise}</td>
                  <td className="px-4 py-2.5 text-slate-600">{l.emAnalise}</td>
                  <td className="px-4 py-2.5 text-slate-600">{l.concluidas}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-700">{l.total}</td>
                  <td className="px-4 py-2.5 text-slate-600">{l.tempoMedioDias != null ? `${l.tempoMedioDias} dia${l.tempoMedioDias !== 1 ? 's' : ''}` : '-'}</td>
                  <td className={`px-4 py-2.5 ${ConsolidadoTonePorIdade(l.maisAntigoAbertoDias)}`}>{l.maisAntigoAbertoDias != null ? `${l.maisAntigoAbertoDias} dia${l.maisAntigoAbertoDias !== 1 ? 's' : ''}` : '-'}</td>
                </tr>
              ))}
              {!linhas.length && (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400">Nenhum processo atribuído a analistas ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ─── Item do checklist ──────────────────────────────────────────────────────────

const RESPOSTA_OPCOES: { value: GgconAnaliseResposta; label: string; on: string; off: string }[] = [
  { value: 'SIM', label: 'Sim', on: 'bg-green-600 text-white border-green-600', off: 'bg-white text-slate-500 border-slate-200 hover:border-green-300' },
  { value: 'NAO', label: 'Não', on: 'bg-red-600 text-white border-red-600', off: 'bg-white text-slate-500 border-slate-200 hover:border-red-300' },
  { value: 'NAO_SE_APLICA', label: 'Não se aplica', on: 'bg-slate-500 text-white border-slate-500', off: 'bg-white text-slate-500 border-slate-200 hover:border-slate-400' },
  { value: 'OUTROS', label: 'Outros', on: 'bg-amber-500 text-white border-amber-500', off: 'bg-white text-slate-500 border-slate-200 hover:border-amber-300' },
];

const ChecklistItemRow = ({ item, dica, readOnly, onChange }: {
  item: GgconAnaliseItem; dica?: string; readOnly: boolean; onChange: (patch: Partial<GgconAnaliseItem>) => void;
}) => {
  const [novoLink, setNovoLink] = useState('');
  const [novaPagina, setNovaPagina] = useState('');
  const links = toLinks(item.documento_sei);

  const addLink = () => {
    const v = novoLink.trim();
    if (!v) return;
    onChange({ documento_sei: [...links, serializeLink({ url: v, pagina: novaPagina })] });
    setNovoLink('');
    setNovaPagina('');
  };
  const removeLink = (idx: number) => {
    const next = links.filter((_, i) => i !== idx);
    onChange({ documento_sei: next.length ? next : null });
  };

  // Observação do item — igual ao padrão do campo "Observações" do processo: estado
  // local pra digitação fluida, só salva no blur (evita 1 request por tecla). Ressincroniza
  // se item.observacao mudar por fora (ex.: Resetar Análise), sem apagar o que o usuário
  // está digitando no meio de uma edição.
  const [obsTexto, setObsTexto] = useState(item.observacao ?? '');
  useEffect(() => { setObsTexto(item.observacao ?? ''); }, [item.observacao]);
  const salvarObs = () => {
    const v = obsTexto.trim() || null;
    if (v !== item.observacao) onChange({ observacao: v });
  };

  return (
    <div className={`p-3.5 rounded-xl border ${item.resposta ? 'bg-white border-slate-200' : 'bg-amber-50/40 border-amber-100'}`}>
      <div className="flex gap-3">
        <span className="text-xs font-bold text-slate-400 mt-0.5 w-6 shrink-0 text-right">{item.item_numero}</span>
        <div className="flex-1">
          <p className="text-sm text-slate-700 whitespace-pre-line">{item.item_descricao}</p>
          {dica && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1 mt-1.5 inline-flex items-center gap-1">
              <AlertCircle size={11} className="shrink-0"/>{dica}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-2.5 pl-9">
        <div className="flex gap-1.5">
          {RESPOSTA_OPCOES.map(op => (
            <button
              key={op.value}
              type="button"
              disabled={readOnly}
              onClick={() => onChange({ resposta: item.resposta === op.value ? null : op.value })}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all disabled:cursor-not-allowed disabled:opacity-70 ${item.resposta === op.value ? op.on : op.off}`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documento(s) SEI — um item pode ter mais de um link comprobatório; cada link
          fica clicável aqui (abre em nova aba) e também vira hyperlink no PDF exportado. */}
      <div className="pl-9 mt-2 space-y-1.5">
        {links.map((raw, idx) => {
          const { url, pagina } = parseLink(raw);
          return (
            <div key={idx} className="flex items-center gap-1.5 bg-blue-50/70 border border-blue-100 rounded-lg px-2 py-1">
              <ExternalLink size={11} className="text-blue-500 shrink-0"/>
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-700 hover:underline truncate flex-1" title={url}>
                {url}
              </a>
              {pagina && (
                <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded px-1.5 py-0.5 shrink-0">
                  pág. {pagina}
                </span>
              )}
              {!readOnly && (
                <button type="button" onClick={() => removeLink(idx)} className="text-slate-400 hover:text-red-600 shrink-0" title="Remover link">
                  <X size={12}/>
                </button>
              )}
            </div>
          );
        })}
        {!readOnly ? (
          <div className="flex gap-1.5">
            <input
              className="flex-1 min-w-[180px] border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder={dica ? `Colar link do Documento SEI... (${dica})` : 'Colar link do Documento SEI...'}
              value={novoLink}
              onChange={e => setNovoLink(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
            />
            <input
              className="w-20 shrink-0 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Pág."
              title="Número da página do documento SEI onde a informação está"
              value={novaPagina}
              onChange={e => setNovaPagina(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }}
            />
            <button
              type="button"
              onClick={addLink}
              disabled={!novoLink.trim()}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1"
            >
              <Plus size={12}/>Adicionar
            </button>
          </div>
        ) : !links.length && (
          <p className="text-xs text-slate-300 italic">Nenhum documento vinculado.</p>
        )}
      </div>

      {/* Observação do item — nota livre do analista (ex.: justificativa de divergência,
          contexto da resposta), salva no blur assim como o campo "Observações" do processo. */}
      <div className="pl-9 mt-2">
        {!readOnly ? (
          <textarea
            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            rows={2}
            placeholder="Observação sobre este item (opcional)..."
            value={obsTexto}
            onChange={e => setObsTexto(e.target.value)}
            onBlur={salvarObs}
          />
        ) : item.observacao ? (
          <p className="text-xs text-slate-500 italic whitespace-pre-wrap bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5">{item.observacao}</p>
        ) : null}
      </div>
    </div>
  );
};

// ─── Timeline de histórico de responsáveis ─────────────────────────────────────

const EVENTO_LABELS: Record<GgconAnaliseHistorico['evento'], string> = {
  LIBERADA: 'Liberada para análise',
  REATRIBUIDA: 'Analista reatribuído',
  INICIADA: 'Análise iniciada',
  CONCLUIDA: 'Preenchimento concluído',
  ENCAMINHADA: 'Encaminhada',
  RESETADA: 'Análise resetada',
  STATUS_ALTERADO: 'Status alterado manualmente',
  HISTORICO_LIMPO: 'Histórico limpo',
  LIBERADA_ASSINATURA: 'Liberado para assinatura',
  ASSINADA: 'Assinado',
  CONCLUIDA_COM_PENDENCIA: 'Conferência concluída com pendência',
};

const HistoricoResponsaveis = ({ historico }: { historico: GgconAnaliseHistorico[] }) => (
  <div className="space-y-3">
    {!historico.length && <p className="text-sm text-slate-400 italic">Nenhum evento registrado ainda.</p>}
    {[...historico].reverse().map(h => (
      <div key={h.id} className="flex gap-3 text-xs">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"/>
        <div className="flex-1">
          <p className="text-slate-700 font-medium">
            {EVENTO_LABELS[h.evento]}
            {h.analista_novo && h.evento === 'REATRIBUIDA' && (
              <span className="text-slate-500 font-normal"> — {h.analista_anterior ?? 'ninguém'} → {h.analista_novo}</span>
            )}
            {h.analista_novo && h.evento === 'LIBERADA' && (
              <span className="text-slate-500 font-normal"> — para {h.analista_novo}</span>
            )}
          </p>
          <p className="text-slate-400 mt-0.5">
            {h.usuario_responsavel ?? 'Sistema'} · {new Date(h.data_evento).toLocaleString('pt-BR')}
          </p>
          {h.observacao && h.evento !== 'ENCAMINHADA' && <p className="text-slate-500 italic mt-0.5">{h.observacao}</p>}
        </div>
      </div>
    ))}
  </div>
);

// ─── Overlay de análise (tela cheia) ───────────────────────────────────────────

const AnaliseDetalheOverlay = ({ analiseId, currentUser, canLiberar, onClose, onChanged }: {
  analiseId: number; currentUser: User | null; canLiberar: boolean; onClose: () => void; onChanged: () => void;
}) => {
  const { toast } = useToast();
  const currentUserName = currentUser?.name;
  const [analise, setAnalise] = useState<GgconAnalise | null>(null);
  const [itens, setItens] = useState<GgconAnaliseItem[]>([]);
  const [exercicios, setExercicios] = useState<GgconAnaliseExercicio[]>([]);
  const [activeExercicioId, setActiveExercicioId] = useState<number | null>(null);
  const [showEscolherExercicioPdf, setShowEscolherExercicioPdf] = useState(false);
  const [historico, setHistorico] = useState<GgconAnaliseHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [areaEncaminhamento, setAreaEncaminhamento] = useState('');
  const [showEncaminhar, setShowEncaminhar] = useState(false);
  const [observacoesTexto, setObservacoesTexto] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [showModelos, setShowModelos] = useState(false);
  const [showAlterarStatus, setShowAlterarStatus] = useState(false);
  const [showLimparHistorico, setShowLimparHistorico] = useState(false);
  const [showEditCadastro, setShowEditCadastro] = useState(false);
  const [showPendencia, setShowPendencia] = useState(false);
  const [pendenciaTexto, setPendenciaTexto] = useState('');
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const canAdministrarAnalise = podeAdministrarAnalise(currentUser);
  const [resetMotivo, setResetMotivo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [a, i, ex, h] = await Promise.all([
      GgconAnaliseService.getById(analiseId),
      GgconAnaliseService.getItens(analiseId),
      GgconAnaliseService.getExercicios(analiseId),
      GgconAnaliseService.getHistorico(analiseId),
    ]);
    setAnalise(a);
    setItens(i);
    setExercicios(ex);
    // Prefere manter/cair num exercício com ano definido — o "sem ano" (placeholder
    // herdado de análises antigas) não é uma aba selecionável de verdade.
    setActiveExercicioId(prev => (prev && ex.some(e => e.id === prev))
      ? prev
      : (ex.find(e => e.exercicio != null)?.id ?? ex[0]?.id ?? null));
    setHistorico(h);
    setObservacoesTexto(a?.observacoes ?? '');
    setAreaEncaminhamento(a?.area_encaminhamento ?? '');
    setLoading(false);
    return a;
  }, [analiseId]);

  useEffect(() => {
    load().then(async a => {
      // Primeira abertura pelo analista responsável: marca início da análise.
      if (a && a.status === 'AGUARDANDO_ANALISE' && currentUserName && a.analista_atual === currentUserName) {
        await GgconAnaliseService.iniciarAnalise(analiseId, currentUserName);
        await load();
        onChanged();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analiseId]);

  const isDono = !!currentUserName && analise?.analista_atual === currentUserName;
  // canEdit governa o checklist em si (trava a partir de Aguardando Assinatura ou
  // Conferência com Pendência — o checklist já é o produto final da análise assim
  // que ela é concluída, por qualquer um dos dois caminhos).
  const canEdit = (isDono || canLiberar) && analise?.status !== 'CONCLUIDA'
    && analise?.status !== 'AGUARDANDO_ASSINATURA' && analise?.status !== 'CONFERENCIA_PENDENCIA';
  // canManage governa observações e encaminhamento — quem libera pode corrigir a
  // qualquer momento (mesmo depois de concluída), e o analista pode sempre deixar notas.
  const canManage = isDono || canLiberar;
  // Quem confirma a assinatura (ex.: Marilsa) — ver podeAssinarGgcon em types.ts.
  const podeAssinar = podeAssinarGgcon(currentUser);
  // Um exercício sem ano definido (herdado de análises antigas) não conta como
  // exercício de verdade — o técnico precisa definir o ano antes de poder
  // preencher/concluir o checklist (ver ExerciciosBar). Progresso/conclusão só
  // olham para exercícios válidos.
  const exerciciosValidos = exercicios.filter(ex => ex.exercicio != null);
  const temExercicioValido = exerciciosValidos.length > 0;
  const idsExerciciosValidos = new Set(exerciciosValidos.map(ex => ex.id));
  const itensValidos = itens.filter(i => idsExerciciosValidos.has(i.exercicio_id));
  const respondidos = itensValidos.filter(i => i.resposta).length;
  const total = itensValidos.length;
  // "Completo" exige 100% em TODOS os exercícios válidos da análise, não só no que
  // está sendo exibido no momento — cada exercício tem seu próprio checklist
  // independente.
  const completo = temExercicioValido && exerciciosValidos.every(ex => {
    const itensEx = itens.filter(i => i.exercicio_id === ex.id);
    return itensEx.length > 0 && itensEx.every(i => !!i.resposta);
  });
  const itensExercicioAtivo = useMemo(
    () => itens.filter(i => i.exercicio_id === activeExercicioId),
    [itens, activeExercicioId],
  );
  // Encaminhar só libera depois da assinatura confirmada, OU se a conferência foi
  // concluída com pendência (pula a assinatura de propósito), OU se já estava
  // Concluída, pra permitir corrigir área/data de um encaminhamento existente.
  const podeEncaminhar = !!analise?.area_encaminhamento || analise?.status === 'CONCLUIDA' ||
    analise?.status === 'CONFERENCIA_PENDENCIA' ||
    (analise?.status === 'AGUARDANDO_ASSINATURA' && !!analise?.data_assinatura);

  // Dica fixa do template ("Se não tiver, pedir declaração negativa" etc.) por número
  // de item — não fica salva em cgof_ggcon_analise_itens (só a resposta/documento_sei
  // do analista fica), então é buscada aqui a partir do tipo_conveniada da análise.
  const dicaPorItem = useMemo(() => {
    const map = new Map<number, string | undefined>();
    if (analise) for (const t of CHECKLISTS[analise.tipo_conveniada]) map.set(t.numero, t.dica);
    return map;
  }, [analise?.tipo_conveniada]);

  const handleItemChange = async (item: GgconAnaliseItem, patch: Partial<GgconAnaliseItem>) => {
    setItens(prev => prev.map(i => i.id === item.id ? { ...i, ...patch } : i));
    try { await GgconAnaliseService.salvarItem(item.id, patch); }
    catch (ex: any) { toast('error', ex.message); }
  };

  const handleConcluir = async () => {
    if (!analise || !currentUserName) return;
    setBusy(true);
    try {
      await GgconAnaliseService.concluirAnalise(analise.id, currentUserName);
      await load();
      onChanged();
      toast('success', 'Preenchimento concluído.');
    } catch (ex: any) { toast('error', ex.message); }
    finally { setBusy(false); }
  };

  const handleConcluirComPendencia = async () => {
    if (!analise || !currentUserName || !pendenciaTexto.trim()) return;
    setBusy(true);
    try {
      await GgconAnaliseService.concluirAnaliseComPendencia(analise.id, currentUserName, pendenciaTexto.trim());
      await load();
      onChanged();
      setShowPendencia(false);
      setPendenciaTexto('');
      toast('success', 'Conferência concluída com pendência.');
    } catch (ex: any) { toast('error', ex.message); }
    finally { setBusy(false); }
  };

  const handleLiberarAssinatura = async () => {
    if (!analise || !currentUserName) return;
    setBusy(true);
    try {
      await GgconAnaliseService.liberarParaAssinatura(analise.id, currentUserName);
      await load();
      onChanged();
      toast('success', 'Liberado para assinatura.');
    } catch (ex: any) { toast('error', ex.message); }
    finally { setBusy(false); }
  };

  const handleConfirmarAssinatura = async () => {
    if (!analise || !currentUserName) return;
    setBusy(true);
    try {
      await GgconAnaliseService.confirmarAssinatura(analise.id, currentUserName);
      await load();
      onChanged();
      toast('success', 'Assinatura confirmada.');
    } catch (ex: any) { toast('error', ex.message); }
    finally { setBusy(false); }
  };

  const handleEncaminhar = async () => {
    if (!analise || !currentUserName || !areaEncaminhamento.trim()) return;
    setBusy(true);
    try {
      await GgconAnaliseService.encaminhar(analise.id, areaEncaminhamento.trim(), currentUserName);
      await load();
      onChanged();
      setShowEncaminhar(false);
      toast('success', analise.status === 'CONCLUIDA' ? 'Encaminhamento atualizado.' : 'Processo encaminhado.');
    } catch (ex: any) { toast('error', ex.message); }
    finally { setBusy(false); }
  };

  const handleSalvarObservacoes = async () => {
    if (!analise) return;
    if ((analise.observacoes ?? '') === observacoesTexto) return;
    try {
      await GgconAnaliseService.atualizarObservacoes(analise.id, observacoesTexto);
      // Atualiza o estado local (em vez de esperar um load() completo) para que um
      // segundo blur sem mudanças não ache que o texto ainda difere do que já foi
      // salvo e dispare outro PATCH à toa.
      setAnalise(prev => prev ? { ...prev, observacoes: observacoesTexto.trim() || null } : prev);
      onChanged();
    } catch (ex: any) { toast('error', ex.message); }
  };

  const handleReset = async (password: string) => {
    if (!analise || !currentUser) return;
    const ok = await DbService.verifyPassword(currentUser.id, password);
    if (!ok) throw new Error('Senha incorreta.');
    await GgconAnaliseService.resetarAnalise(analise.id, currentUser.name, resetMotivo.trim() || undefined);
    setShowReset(false);
    setResetMotivo('');
    await load();
    onChanged();
    toast('success', 'Análise resetada.');
  };

  const handleAlterarStatus = async (novoStatus: GgconAnaliseStatus, motivo: string) => {
    if (!analise || !currentUser) return;
    await GgconAnaliseService.alterarStatus(analise.id, novoStatus, currentUser.name, motivo);
    setShowAlterarStatus(false);
    await load();
    onChanged();
    toast('success', `Status alterado para ${GGCON_ANALISE_STATUS_LABELS[novoStatus]}.`);
  };

  const handleSalvarCadastro = async (payload: Partial<GgconAnalise>) => {
    if (!analise) return;
    await GgconAnaliseService.atualizarCabecalho(analise.id, payload);
    await load();
    onChanged();
    toast('success', 'Cadastro atualizado.');
  };

  const handleLimparHistorico = async (password: string) => {
    if (!analise || !currentUser) return;
    const ok = await DbService.verifyPassword(currentUser.id, password);
    if (!ok) throw new Error('Senha incorreta.');
    await GgconAnaliseService.limparHistorico(analise.id, currentUser.name);
    setShowLimparHistorico(false);
    await load();
    toast('success', 'Histórico limpo.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-50/95 rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-[98vw] xl:max-w-[1600px] h-[96vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-white rounded-t-2xl">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ClipboardCheck size={18} className="text-blue-600"/>Análise do Processo
            </h3>
            {analise && <p className="text-xs font-mono text-slate-500 mt-0.5">{analise.processo_sei} — {analise.interessado ?? 'sem interessado'}</p>}
          </div>
          <div className="flex items-center gap-2">
            {analise && <StatusBadge status={analise.status}/>}
            {analise && analise.novo_destaque && <NovoBadge/>}
            {analise && canManage && (
              <button
                className={BTN_MUTED}
                title="Editar os dados do cadastro (convênio, interessado, vigência...)"
                onClick={() => setShowEditCadastro(true)}
              >
                <Pencil size={12}/>Editar Cadastro
              </button>
            )}
            {analise && (
              <button
                className={BTN_MUTED}
                title="Baixar a ficha preenchida (despacho + checklist) em PDF"
                onClick={() => {
                  if (exercicios.length > 1) setShowEscolherExercicioPdf(true);
                  else exportAnaliseFichaPDF(analise, itens, exercicios);
                }}
              >
                <Download size={12}/>PDF
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X size={16}/></button>
          </div>
        </div>

        {loading || !analise ? (
          <div className="flex items-center justify-center py-24"><Loader2 size={28} className="animate-spin text-blue-500"/></div>
        ) : (
          <div className="overflow-y-auto flex-1 px-6 py-6 bg-slate-50/30">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna principal — checklist */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-bold text-slate-700">
                      Checklist — {GGCON_TIPO_CONVENIADA_LABELS[analise.tipo_conveniada]}
                    </h4>
                    <ProgressoChecklist respondidos={respondidos} total={total}/>
                  </div>

                  {/* Um processo pode abranger vários exercícios financeiros — cada um com
                      seu próprio checklist, respondido de forma independente. */}
                  <div className="mb-2.5">
                    <ExerciciosBar
                      exercicios={exercicios}
                      itens={itens}
                      activeId={activeExercicioId}
                      onSelect={setActiveExercicioId}
                      analiseId={analise.id}
                      tipoConveniada={analise.tipo_conveniada}
                      criadoPor={currentUserName ?? ''}
                      canManage={canManage}
                      onChanged={async () => { await load(); }}
                    />
                  </div>

                  {temExercicioValido ? (
                    <>
                      <p className="text-[11px] text-slate-400 italic mb-2.5">Todas as documentações devem estar atualizadas e assinadas.</p>
                      <div className="space-y-2.5 max-h-[64vh] overflow-y-auto pr-1">
                        {itensExercicioAtivo.map(item => (
                          <ChecklistItemRow key={item.id} item={item} dica={dicaPorItem.get(item.item_numero)} readOnly={!canEdit} onChange={patch => handleItemChange(item, patch)}/>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 px-4">
                      <p className="text-sm text-slate-500 mb-1">Nenhum exercício cadastrado ainda.</p>
                      <p className="text-xs text-slate-400">Adicione um exercício (o ano do exercício financeiro) acima para começar a preencher o checklist.</p>
                    </div>
                  )}
                </div>

                {analise.investimento && (
                  <div className="bg-purple-50/50 rounded-xl border border-purple-200 p-4">
                    <h4 className="text-sm font-bold text-purple-800 mb-2">Documentos adicionais — Investimento (Obra)</h4>
                    <p className="text-[11px] text-purple-600 mb-3">Exigidos pela Lei nº 14.133/2021 quando a prestação de contas é destinada a investimento. Conferência informativa — não fazem parte da grade de itens numerados.</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {ITENS_INVESTIMENTO_OBRA.map(bloco => (
                        <div key={bloco.titulo}>
                          <p className="text-xs font-semibold text-purple-700 mb-1">{bloco.titulo}</p>
                          <ul className="text-[11px] text-purple-700/80 list-disc list-inside space-y-0.5">
                            {bloco.itens.map(i => <li key={i}>{i}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modelos de Referência (Anexo I) — vários itens do checklist citam "Modelo 0X" no
                    texto (ex.: item 17 cita o Modelo 02, item 31 o Modelo 04); antes disso o técnico
                    só via a citação, sem saber o que o modelo continha. Fica recolhido por padrão
                    (é material de consulta, não faz parte da grade de itens) mas acessível a qualquer
                    momento, para qualquer analista. */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setShowModelos(s => !s)}
                  >
                    <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                      <StickyNote size={14} className="text-blue-600"/>Modelos de Referência (Anexo I)
                    </span>
                    <span className="text-[11px] text-blue-600 font-semibold">{showModelos ? 'Ocultar' : 'Ver os 5 modelos'}</span>
                  </button>
                  {showModelos && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-100 pt-3">
                      <p className="text-[11px] text-slate-400">Referenciados no texto de alguns itens do checklist acima (ex.: "Modelo 02 - Anexo I"). Tabela de exemplo de cada planilha/modelo — campos em branco são o que a conveniada precisa preencher.</p>
                      {MODELOS_REFERENCIA[analise.tipo_conveniada].map(m => (
                        <div key={m.numero} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                          <p className="text-xs font-bold text-slate-700">Modelo {m.numero} — {m.titulo}</p>
                          <p className="text-[11px] text-slate-500 mt-1 mb-2">{m.descricao}</p>
                          <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-[10px] bg-white">
                              <thead className="bg-slate-100">
                                <tr>
                                  {m.colunas.map(c => (
                                    <th key={c} className="px-2 py-1.5 text-left font-semibold text-slate-600 whitespace-nowrap border-b border-slate-200">{c}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {m.linhasExemplo.map((linha, idx) => (
                                  <tr key={idx} className="border-t border-slate-100">
                                    {linha.map((cel, ci) => (
                                      <td key={ci} className="px-2 py-1.5 text-slate-500 whitespace-nowrap">{cel || <span className="text-slate-300">—</span>}</td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {m.observacao && <p className="text-[11px] text-amber-700 mt-2 italic">{m.observacao}</p>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Coluna lateral — datas, ações, histórico */}
              <div className="space-y-4">
                {/* Pendência — fica visível mesmo depois de Encaminhada/Concluída, como
                    registro permanente de que a conferência apontou algo a corrigir. */}
                {analise.pendencia_descricao && (
                  <div className="bg-orange-50 rounded-xl border border-orange-200 p-4 space-y-1">
                    <h4 className="text-sm font-bold text-orange-800 flex items-center gap-1.5"><AlertTriangle size={14}/>Pendência registrada</h4>
                    <p className="text-xs text-orange-700 whitespace-pre-wrap">{analise.pendencia_descricao}</p>
                    <p className="text-[11px] text-orange-500">{fmtDate(analise.data_pendencia)}</p>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-slate-700">Datas</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400 block">Recebimento</span><span className="font-semibold text-slate-700">{fmtDate(analise.data_recebimento)}</span></div>
                    <div><span className="text-slate-400 block">Liberação</span><span className="font-semibold text-slate-700">{fmtDate(analise.data_liberacao)}</span></div>
                    <div><span className="text-slate-400 block">Análise (conclusão)</span><span className="font-semibold text-slate-700">{fmtDate(analise.data_analise)}</span></div>
                    <div><span className="text-slate-400 block">Encaminhamento</span><span className="font-semibold text-slate-700">{fmtDate(analise.data_encaminhamento)}</span></div>
                  </div>
                  {analise.area_encaminhamento && (
                    <p className="text-xs text-slate-500 pt-1 border-t border-dashed border-slate-100">Encaminhado para <strong>{analise.area_encaminhamento}</strong></p>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5">
                  <h4 className="text-sm font-bold text-slate-700 mb-1">Analista Responsável</h4>
                  <p className="text-sm text-slate-600">{analise.analista_atual ?? 'Não atribuído'}</p>
                  {analise.liberado_por && <p className="text-[11px] text-slate-400">Liberado por {analise.liberado_por}</p>}
                </div>

                {/* Observações — nota de acompanhamento livre, editável pelo analista dono ou por
                    quem libera, em qualquer status (inclusive depois de concluída/encaminhada). */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><StickyNote size={14}/>Observações</h4>
                  {canManage ? (
                    <textarea
                      className={INPUT}
                      rows={3}
                      placeholder="Anotações sobre este processo (pendências, contexto, combinados com o DRS/entidade...)"
                      value={observacoesTexto}
                      onChange={e => setObservacoesTexto(e.target.value)}
                      onBlur={handleSalvarObservacoes}
                    />
                  ) : (
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{analise.observacoes || 'Nenhuma observação registrada.'}</p>
                  )}
                </div>

                {canEdit && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    {completo && analise.data_analise ? (
                      // Já concluído e ainda completo — some o botão para não permitir clicar de
                      // novo e gerar eventos "CONCLUIDA" duplicados no histórico à toa.
                      <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Check size={14} className="shrink-0"/>Preenchimento concluído em {fmtDate(analise.data_analise)} — aguardando liberação para assinatura.
                      </p>
                    ) : (
                      <>
                        {!completo && <p className="text-[11px] text-amber-600 text-center">Responda todos os {total} itens para concluir.</p>}
                        {!showPendencia && (
                          <div className="grid grid-cols-2 gap-2">
                            <button className={BTN_PRIMARY_GREEN + ' justify-center'} disabled={!completo || busy} onClick={handleConcluir} title="Checklist sem pendências — segue para a etapa de Assinatura">
                              <Check size={16}/>Conferência sem Pendência
                            </button>
                            <button
                              type="button"
                              className={BTN_PRIMARY_RED + ' justify-center'}
                              disabled={!completo || busy}
                              onClick={() => setShowPendencia(true)}
                              title="Falta algo a corrigir — pula a assinatura, vai direto para Encaminhar"
                            >
                              <AlertTriangle size={16}/>Conferência com Pendência
                            </button>
                          </div>
                        )}
                        {showPendencia && (
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <label className={LABEL}>Descrição da pendência</label>
                            <textarea
                              className={INPUT}
                              rows={2}
                              placeholder="Ex.: falta comprovante de..."
                              value={pendenciaTexto}
                              onChange={e => setPendenciaTexto(e.target.value)}
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <button type="button" className={BTN_GHOST + ' flex-1 justify-center'} onClick={() => { setShowPendencia(false); setPendenciaTexto(''); }}>Cancelar</button>
                              <button
                                type="button"
                                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-xl active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                disabled={!pendenciaTexto.trim() || busy}
                                onClick={handleConcluirComPendencia}
                              >
                                {busy ? <Loader2 size={16} className="animate-spin"/> : <AlertTriangle size={16}/>}Confirmar Pendência
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Assinatura — etapa obrigatória entre o checklist concluído e o Encaminhar.
                    Quem libera processos ou o próprio técnico dono da análise libera para
                    assinatura; quem tem ggcon_assina (ex.: Marilsa) confirma. Ver
                    podeAssinarGgcon em types.ts. */}
                {(canLiberar || isDono) && analise.status === 'EM_ANALISE' && analise.data_analise && (
                  <div className="bg-white rounded-xl border border-purple-200 bg-purple-50/30 p-4 space-y-2">
                    <h4 className="text-sm font-bold text-purple-800 flex items-center gap-1.5"><FileSignature size={14}/>Assinatura</h4>
                    <p className="text-[11px] text-purple-700/80">Antes de encaminhar, o processo precisa ser liberado e assinado.</p>
                    <button className={BTN_PRIMARY + ' w-full justify-center'} disabled={busy} onClick={handleLiberarAssinatura}>
                      {busy ? <Loader2 size={16} className="animate-spin"/> : <FileSignature size={16}/>}Liberar para Assinatura
                    </button>
                  </div>
                )}

                {analise.status === 'AGUARDANDO_ASSINATURA' && (
                  <div className="bg-white rounded-xl border border-purple-200 bg-purple-50/30 p-4 space-y-2">
                    <h4 className="text-sm font-bold text-purple-800 flex items-center gap-1.5"><FileSignature size={14}/>Assinatura</h4>
                    {analise.data_assinatura ? (
                      <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
                        <Check size={14} className="shrink-0"/>Assinado por {analise.assinado_por ?? '—'} em {fmtDate(analise.data_assinatura)}.
                      </p>
                    ) : podeAssinar ? (
                      <>
                        <p className="text-[11px] text-purple-700/80">Liberado para assinatura em {fmtDate(analise.data_liberacao_assinatura)}.</p>
                        <button className={BTN_PRIMARY + ' w-full justify-center'} disabled={busy} onClick={handleConfirmarAssinatura}>
                          {busy ? <Loader2 size={16} className="animate-spin"/> : <FileSignature size={16}/>}Confirmar Assinatura
                        </button>
                      </>
                    ) : (
                      <p className="text-[11px] text-purple-700/80">Aguardando assinatura (liberado em {fmtDate(analise.data_liberacao_assinatura)}).</p>
                    )}
                  </div>
                )}

                {/* Encaminhamento — só quem libera processos decide o destino; fica disponível
                    mesmo depois de concluída, para corrigir a área/data se necessário. Só
                    aparece depois da assinatura confirmada (ver podeEncaminhar acima). */}
                {canLiberar && podeEncaminhar && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><Send size={14}/>Encaminhamento</h4>
                    {showEncaminhar ? (
                      <div className="space-y-2">
                        <label className={LABEL}>Encaminhar para</label>
                        <ListInput id="dl-area-encaminhamento" options={AREAS_ENCAMINHAMENTO} value={areaEncaminhamento} onChange={setAreaEncaminhamento} placeholder="GPC, DRS, Consultoria Jurídica..."/>
                        {!completo && (
                          <p className="text-[11px] text-amber-600">Atenção: {total - respondidos} de {total} itens do checklist ainda sem resposta.</p>
                        )}
                        <div className="flex gap-2">
                          <button className={BTN_GHOST + ' flex-1 justify-center'} onClick={() => { setShowEncaminhar(false); setAreaEncaminhamento(analise.area_encaminhamento ?? ''); }}>Cancelar</button>
                          <button className={BTN_PRIMARY + ' flex-1 justify-center'} disabled={!areaEncaminhamento.trim() || busy} onClick={handleEncaminhar}>
                            {busy ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}Confirmar
                          </button>
                        </div>
                      </div>
                    ) : analise.area_encaminhamento ? (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-600">
                          Encaminhado para <strong>{analise.area_encaminhamento}</strong> em {fmtDate(analise.data_encaminhamento)}.
                        </p>
                        <button className={BTN_GHOST + ' w-full justify-center'} onClick={() => setShowEncaminhar(true)}>
                          <Send size={14}/>Alterar encaminhamento
                        </button>
                      </div>
                    ) : (
                      <button className={BTN_PRIMARY + ' w-full justify-center'} onClick={() => setShowEncaminhar(true)}>
                        <Send size={16}/>Encaminhar
                      </button>
                    )}
                  </div>
                )}

                {/* Alterar status manualmente — corrige registros que não se encaixam no fluxo
                    automático (ex.: importados da planilha antiga, já "Concluída" mas sem
                    checklist digitalizado aqui). Não mexe em mais nada, só no campo status.
                    Restrito a Administrador ou a quem tem ggcon_admin_analise — ação sensível
                    o suficiente pra não ficar disponível a quem só tem a permissão de liberar
                    processos. */}
                {canAdministrarAnalise && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><RefreshCw size={14}/>Alterar Status</h4>
                    <p className="text-[11px] text-slate-400">Corrige o status manualmente, sem passar pelo fluxo normal (Liberar → Analisar → Concluir → Encaminhar).</p>
                    <button
                      className={BTN_GHOST + ' w-full justify-center'}
                      onClick={() => setShowAlterarStatus(true)}
                    >
                      <RefreshCw size={14}/>Alterar Status
                    </button>
                  </div>
                )}

                {/* Resetar — apaga o checklist preenchido e as datas de análise/encaminhamento,
                    devolvendo o processo para a fila do mesmo analista. Ação sensível, por isso
                    exige senha (mesmo padrão de exclusão), fica registrada no histórico, e é
                    restrita a Administrador ou a quem tem ggcon_admin_analise (mesmo padrão de
                    Alterar Status). */}
                {canAdministrarAnalise && analise.status !== 'AGUARDANDO_LIBERACAO' && (
                  <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 p-4 space-y-2">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center gap-1.5"><RefreshCw size={14}/>Resetar Análise</h4>
                    <p className="text-[11px] text-amber-700/80">Apaga todas as respostas do checklist, a pendência registrada e as datas de análise/assinatura/encaminhamento. O analista responsável é mantido.</p>
                    <button
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-amber-700 text-sm font-semibold rounded-xl border border-amber-300 hover:bg-amber-100 active:scale-95 transition-all"
                      onClick={() => setShowReset(true)}
                    >
                      <RefreshCw size={14}/>Resetar
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5"><History size={14}/>Histórico de Responsáveis</h4>
                    {isAdmin && historico.length > 0 && (
                      <button
                        className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                        title="Apaga todo o histórico desta análise (ex.: entradas de teste) — só Administrador"
                        onClick={() => setShowLimparHistorico(true)}
                      >
                        <Trash2 size={11}/>Limpar
                      </button>
                    )}
                  </div>
                  <HistoricoResponsaveis historico={historico}/>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEditCadastro && analise && (
        <Modal title="Editar Cadastro" subtitle="Despacho — conferência de Prestação de Contas" onClose={() => setShowEditCadastro(false)} size="xl">
          <DespachoForm
            initial={analise}
            lockRecebimento={!canLiberar}
            onSave={handleSalvarCadastro}
            onClose={() => setShowEditCadastro(false)}
          />
        </Modal>
      )}

      {showReset && analise && (
        <PasswordConfirmModal
          title="Resetar análise"
          message={`Confirme sua senha para resetar a análise do processo ${analise.processo_sei}. Todas as respostas do checklist, a pendência registrada e as datas de análise/assinatura/encaminhamento serão apagadas — o processo volta para "Aguardando Análise", ainda com ${analise.analista_atual ?? 'o mesmo analista'} responsável. Fica registrado no histórico e não pode ser desfeito.`}
          confirmLabel="Resetar"
          confirmIcon={RefreshCw}
          tone="amber"
          extraLabel="Motivo (opcional)"
          extraValue={resetMotivo}
          onExtraChange={setResetMotivo}
          onCancel={() => { setShowReset(false); setResetMotivo(''); }}
          onConfirm={handleReset}
        />
      )}

      {showAlterarStatus && analise && (
        <AlterarStatusModal
          analise={analise}
          onClose={() => setShowAlterarStatus(false)}
          onConfirm={handleAlterarStatus}
        />
      )}

      {showLimparHistorico && analise && (
        <PasswordConfirmModal
          title="Limpar histórico"
          message={`Confirme sua senha para apagar todo o histórico de responsáveis do processo ${analise.processo_sei} (${historico.length} evento${historico.length !== 1 ? 's' : ''}). Fica um marcador registrando que você limpou, mas os eventos apagados não podem ser recuperados.`}
          confirmLabel="Limpar Histórico"
          confirmIcon={Trash2}
          tone="red"
          onCancel={() => setShowLimparHistorico(false)}
          onConfirm={handleLimparHistorico}
        />
      )}

      {showEscolherExercicioPdf && analise && (
        <Modal
          title="Exportar PDF"
          subtitle="Este processo tem mais de um exercício — escolha qual checklist exportar."
          onClose={() => setShowEscolherExercicioPdf(false)}
          size="md"
        >
          <div className="space-y-2">
            {exercicios.map(ex => {
              const itensEx = itens.filter(i => i.exercicio_id === ex.id);
              const respEx = itensEx.filter(i => i.resposta).length;
              return (
                <button
                  key={ex.id}
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all text-left"
                  onClick={() => { exportAnaliseFichaPDF(analise, itens, [ex]); setShowEscolherExercicioPdf(false); }}
                >
                  <span className="text-sm font-semibold text-slate-700">{ex.exercicio != null ? `Exercício ${ex.exercicio}` : 'Sem exercício'}</span>
                  <span className="text-xs text-slate-400">{respEx}/{itensEx.length} respondidos</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
};

// ─── Cards-resumo ───────────────────────────────────────────────────────────────

const ResumoCard = ({ label, value, active, tone, onClick }: {
  label: string; value: number; active: boolean; tone: string; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`text-left p-4 rounded-2xl border-2 transition-all ${active ? `${tone} shadow-sm` : 'bg-white border-slate-100 hover:border-slate-200'}`}
  >
    <p className="text-2xl font-bold text-slate-800">{value}</p>
    <p className="text-xs font-semibold text-slate-500 mt-0.5">{label}</p>
  </button>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTROS_STORAGE_KEY = 'ggcon_analise_filtros';

type FiltrosPersistidos = {
  search: string; statusFiltro: GgconAnaliseFiltroStatus; analistaFiltro: string; tipoFiltro: GgconTipoConveniada | '';
  sortBy: GgconAnaliseSortField; sortOrder: 'asc' | 'desc';
};

const FILTROS_PADRAO: FiltrosPersistidos = {
  search: '', statusFiltro: '', analistaFiltro: '', tipoFiltro: '', sortBy: 'data_recebimento', sortOrder: 'desc',
};

// Colunas ordenáveis da tabela — rótulo exibido no cabeçalho + campo usado no ORDER BY.
const COLUNAS: { label: string; field: GgconAnaliseSortField | null }[] = [
  { label: 'Processo SEI', field: 'processo_sei' },
  { label: 'Convênio', field: 'convenio_numero' },
  { label: 'Interessado', field: 'interessado' },
  { label: 'Tipo', field: 'tipo_conveniada' },
  { label: 'Status', field: 'status' },
  { label: 'Analista', field: 'analista_atual' },
  { label: 'Progresso', field: null },
  { label: 'Recebimento', field: 'data_recebimento' },
  { label: 'Atribuição', field: 'data_liberacao' },
  { label: 'Conclusão', field: 'data_analise' },
  { label: 'Encaminhamento', field: 'data_encaminhamento' },
  { label: 'Observações', field: null },
  { label: '', field: null },
];

const carregarFiltrosPersistidos = (): FiltrosPersistidos => {
  try {
    const raw = localStorage.getItem(FILTROS_STORAGE_KEY);
    if (raw) return { ...FILTROS_PADRAO, ...JSON.parse(raw) };
  } catch { /* localStorage indisponível ou JSON inválido — usa os padrões */ }
  return FILTROS_PADRAO;
};

type Overlay =
  | null
  | { type: 'form'; data?: Partial<GgconAnalise> }
  | { type: 'liberar'; analise: GgconAnalise }
  | { type: 'reatribuir'; analise: GgconAnalise }
  | { type: 'alterarStatus'; analise: GgconAnalise }
  | { type: 'detalhe'; id: number };

export const GgconAnalisePage = () => {
  const { toast } = useToast();
  const { currentUser } = useApp();
  const isViewOnly = currentUser?.view_only === true;
  const canLiberar = podeLiberarAnalise(currentUser);
  const podeAssinar = podeAssinarGgcon(currentUser);
  const canAdministrarAnalise = podeAdministrarAnalise(currentUser);

  const [rows, setRows] = useState<GgconAnalise[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [resumo, setResumo] = useState({ aguardandoLiberacao: 0, minhaFila: 0, emAndamento: 0, aguardandoAssinatura: 0, concluidas: 0 });
  const [analistas, setAnalistas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [resetRequest, setResetRequest] = useState<GgconAnalise | null>(null);
  const [resetMotivo, setResetMotivo] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loteOverlay, setLoteOverlay] = useState<null | 'liberar' | 'reatribuir' | 'assinatura'>(null);
  const [showConsolidado, setShowConsolidado] = useState(false);

  const filtrosIniciais = useMemo(carregarFiltrosPersistidos, []);
  const [search, setSearch] = useState(filtrosIniciais.search);
  const [statusFiltro, setStatusFiltro] = useState<GgconAnaliseFiltroStatus>(filtrosIniciais.statusFiltro);
  const [analistaFiltro, setAnalistaFiltro] = useState(filtrosIniciais.analistaFiltro);
  const [tipoFiltro, setTipoFiltro] = useState<GgconTipoConveniada | ''>(filtrosIniciais.tipoFiltro);
  const [sortBy, setSortBy] = useState<GgconAnaliseSortField>(filtrosIniciais.sortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filtrosIniciais.sortOrder);
  const PAGE_SIZE = 25;

  useEffect(() => {
    localStorage.setItem(FILTROS_STORAGE_KEY, JSON.stringify({ search, statusFiltro, analistaFiltro, tipoFiltro, sortBy, sortOrder }));
  }, [search, statusFiltro, analistaFiltro, tipoFiltro, sortBy, sortOrder]);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await GgconAnaliseService.getFila({ search, status: statusFiltro, analista: analistaFiltro, tipoConveniada: tipoFiltro, page, pageSize: PAGE_SIZE, sortBy, sortOrder });
    setRows(result.data);
    setCount(result.count);
    setLoading(false);
  }, [search, statusFiltro, analistaFiltro, tipoFiltro, page, sortBy, sortOrder]);

  const toggleSort = (field: GgconAnaliseSortField) => {
    if (sortBy === field) { setSortOrder(o => o === 'asc' ? 'desc' : 'asc'); }
    else { setSortBy(field); setSortOrder('asc'); }
    setPage(1);
  };

  const SortIcon = ({ field }: { field: GgconAnaliseSortField }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} className="text-slate-300"/>;
    return sortOrder === 'asc' ? <ArrowUp size={12} className="text-blue-600"/> : <ArrowDown size={12} className="text-blue-600"/>;
  };

  const loadResumo = useCallback(async () => {
    setResumo(await GgconAnaliseService.getResumo(currentUser?.name));
  }, [currentUser?.name]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadResumo(); }, [loadResumo]);
  useEffect(() => { GgconAnaliseService.getAnalistas().then(setAnalistas); }, []);

  const refresh = async () => { await load(); await loadResumo(); };

  // Seleção em lote é sempre relativa à página/filtro atual — some ao trocar de página
  // ou filtro para não arriscar aplicar uma ação em lote sobre linhas que não estão
  // mais visíveis.
  useEffect(() => { setSelectedIds(new Set()); }, [page, search, statusFiltro, analistaFiltro, tipoFiltro, sortBy, sortOrder]);

  const toggleSelected = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selecionadas = rows.filter(r => selectedIds.has(r.id));
  const elegiveisLiberar = selecionadas.filter(r => r.status === 'AGUARDANDO_LIBERACAO');
  const elegiveisReatribuir = selecionadas.filter(r => r.status === 'AGUARDANDO_ANALISE' || r.status === 'EM_ANALISE');
  const elegiveisAssinatura = selecionadas.filter(r => r.status === 'AGUARDANDO_ASSINATURA' && !r.data_assinatura);
  const todasSelecionaveisMarcadas = rows.length > 0 && rows.every(r => selectedIds.has(r.id));

  const filtrosAtivos = !!(search || statusFiltro || analistaFiltro || tipoFiltro);
  const ordenacaoAlterada = sortBy !== FILTROS_PADRAO.sortBy || sortOrder !== FILTROS_PADRAO.sortOrder;
  const limparFiltros = () => {
    setSearch(''); setStatusFiltro(''); setAnalistaFiltro(''); setTipoFiltro('');
    setSortBy(FILTROS_PADRAO.sortBy); setSortOrder(FILTROS_PADRAO.sortOrder);
    setPage(1);
  };

  const totalPages = Math.ceil(count / PAGE_SIZE);

  const criarAnalise = async (payload: Partial<GgconAnalise> & { exercicios?: number[] }) => {
    if (!currentUser) return;
    await GgconAnaliseService.criarAnalise(payload, currentUser.name);
    await refresh();
    toast('success', 'Processo cadastrado para análise.');
  };

  const editarCabecalho = async (payload: Partial<GgconAnalise>) => {
    if (!payload.id) return;
    await GgconAnaliseService.atualizarCabecalho(payload.id, payload);
    await refresh();
    toast('success', 'Cadastro atualizado.');
  };

  const executeDelete = async (password: string) => {
    if (!currentUser || deleteId == null) return;
    const ok = await DbService.verifyPassword(currentUser.id, password);
    if (!ok) throw new Error('Senha incorreta.');
    await GgconAnaliseService.deleteAnalise(deleteId);
    setDeleteId(null);
    await refresh();
    toast('success', 'Excluído com sucesso.');
  };

  const executeReset = async (password: string) => {
    if (!currentUser || !resetRequest) return;
    const ok = await DbService.verifyPassword(currentUser.id, password);
    if (!ok) throw new Error('Senha incorreta.');
    await GgconAnaliseService.resetarAnalise(resetRequest.id, currentUser.name, resetMotivo.trim() || undefined);
    setResetRequest(null);
    setResetMotivo('');
    await refresh();
    toast('success', 'Análise resetada.');
  };

  const executeLiberarLote = async (analista: string) => {
    if (!currentUser || !elegiveisLiberar.length) return;
    const { ok, falhas } = await GgconAnaliseService.liberarEmLote(elegiveisLiberar.map(r => r.id), analista, currentUser.name);
    setSelectedIds(new Set());
    await refresh();
    if (falhas > 0) toast('warning', `${ok} liberado(s) para ${analista}; ${falhas} falharam — tente novamente para os que faltaram.`);
    else toast('success', `${ok} processo(s) liberado(s) para ${analista}.`);
  };

  const executeReatribuirLote = async (novoAnalista: string, motivo: string) => {
    if (!currentUser || !elegiveisReatribuir.length) return;
    const { ok, falhas } = await GgconAnaliseService.reatribuirEmLote(
      elegiveisReatribuir.map(r => ({ id: r.id, analistaAnterior: r.analista_atual })),
      novoAnalista, currentUser.name, motivo,
    );
    setSelectedIds(new Set());
    await refresh();
    if (falhas > 0) toast('warning', `${ok} reatribuído(s) para ${novoAnalista}; ${falhas} falharam — tente novamente para os que faltaram.`);
    else toast('success', `${ok} processo(s) reatribuído(s) para ${novoAnalista}.`);
  };

  const executeConfirmarAssinaturaLote = async () => {
    if (!currentUser || !elegiveisAssinatura.length) return;
    const { ok, falhas } = await GgconAnaliseService.confirmarAssinaturaEmLote(elegiveisAssinatura.map(r => r.id), currentUser.name);
    setSelectedIds(new Set());
    await refresh();
    if (falhas > 0) toast('warning', `${ok} assinatura(s) confirmada(s); ${falhas} falharam — tente novamente para os que faltaram.`);
    else toast('success', `${ok} assinatura(s) confirmada(s).`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Análise Processo GGCON</h2>
          <p className="text-sm text-slate-500 mt-0.5">Conferência de Prestação de Contas — {count.toLocaleString('pt-BR')} processo{count !== 1 ? 's' : ''}</p>
        </div>
        {canLiberar && (
          <div className="flex items-center gap-2">
            <button className={BTN_GHOST} onClick={() => setShowConsolidado(s => !s)}>
              <Users size={16}/>{showConsolidado ? 'Ocultar Consolidado' : 'Consolidado por Analista'}
            </button>
            {!isViewOnly && (
              <button className={BTN_PRIMARY_LG} onClick={() => setOverlay({ type: 'form' })}>
                <Plus size={18}/>Novo Registro
              </button>
            )}
          </div>
        )}
      </div>

      {showConsolidado && canLiberar && <ConsolidadoPorAnalista onClose={() => setShowConsolidado(false)}/>}

      {/* Destaque — processos aguardando a análise do usuário logado, visível assim que
          ele entra na tela, sem precisar clicar em nenhum filtro. */}
      {currentUser && resumo.minhaFila > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-2xl bg-blue-600 text-white shadow-sm">
          <Inbox size={20} className="shrink-0"/>
          <p className="text-sm font-medium flex-1">
            Você tem <strong>{resumo.minhaFila}</strong> processo{resumo.minhaFila !== 1 ? 's' : ''} aguardando sua análise.
          </p>
          <button
            className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors shrink-0 w-fit"
            onClick={() => { setAnalistaFiltro(currentUser.name); setStatusFiltro('EM_ANDAMENTO'); setPage(1); }}
          >
            Ver meus processos
          </button>
        </div>
      )}

      {/* Destaque — processos aguardando a assinatura de quem tem a permissão
          ggcon_assina (ex.: Marilsa), visível assim que ela entra na tela. Checa o
          campo diretamente (não podeAssinarGgcon, que também libera Admin por poder
          agir como assinante de emergência) — Admin não deve ver esse aviso a menos
          que também tenha ggcon_assina configurado de propósito. */}
      {currentUser?.ggcon_assina === true && resumo.aguardandoAssinatura > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3.5 rounded-2xl bg-purple-600 text-white shadow-sm">
          <FileSignature size={20} className="shrink-0"/>
          <p className="text-sm font-medium flex-1">
            Você tem <strong>{resumo.aguardandoAssinatura}</strong> processo{resumo.aguardandoAssinatura !== 1 ? 's' : ''} aguardando sua assinatura.
          </p>
          <button
            className="text-xs font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors shrink-0 w-fit"
            onClick={() => { setStatusFiltro('AGUARDANDO_ASSINATURA'); setAnalistaFiltro(''); setPage(1); }}
          >
            Ver processos aguardando assinatura
          </button>
        </div>
      )}

      {/* Cards-resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResumoCard label="Aguardando Liberação" value={resumo.aguardandoLiberacao} tone="bg-slate-50 border-slate-300"
          active={statusFiltro === 'AGUARDANDO_LIBERACAO'}
          onClick={() => { setStatusFiltro(s => s === 'AGUARDANDO_LIBERACAO' ? '' : 'AGUARDANDO_LIBERACAO'); setAnalistaFiltro(''); setPage(1); }}/>
        <ResumoCard label="Minha Fila" value={resumo.minhaFila} tone="bg-blue-50 border-blue-300"
          active={!!currentUser && analistaFiltro === currentUser.name}
          onClick={() => { if (currentUser) setAnalistaFiltro(a => a === currentUser.name ? '' : currentUser.name); setStatusFiltro(''); setPage(1); }}/>
        <ResumoCard label="Em Andamento" value={resumo.emAndamento} tone="bg-amber-50 border-amber-300"
          active={statusFiltro === 'EM_ANDAMENTO'}
          onClick={() => { setStatusFiltro(s => s === 'EM_ANDAMENTO' ? '' : 'EM_ANDAMENTO'); setAnalistaFiltro(''); setPage(1); }}/>
        <ResumoCard label="Concluídas" value={resumo.concluidas} tone="bg-green-50 border-green-300"
          active={statusFiltro === 'CONCLUIDA'}
          onClick={() => { setStatusFiltro(s => s === 'CONCLUIDA' ? '' : 'CONCLUIDA'); setAnalistaFiltro(''); setPage(1); }}/>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
          <input
            className={INPUT + ' pl-10'}
            placeholder="Buscar por processo SEI, convênio ou interessado..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select className={INPUT + ' sm:w-52'} value={statusFiltro} onChange={e => { setStatusFiltro(e.target.value as GgconAnaliseFiltroStatus); setPage(1); }}>
          <option value="">Todos os status</option>
          {Object.entries(GGCON_ANALISE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select className={INPUT + ' sm:w-44'} value={analistaFiltro} onChange={e => { setAnalistaFiltro(e.target.value); setPage(1); }}>
          <option value="">Todos os analistas</option>
          {analistas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select className={INPUT + ' sm:w-40'} value={tipoFiltro} onChange={e => { setTipoFiltro(e.target.value as GgconTipoConveniada | ''); setPage(1); }}>
          <option value="">Entidade/Prefeitura</option>
          {Object.entries(GGCON_TIPO_CONVENIADA_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {(filtrosAtivos || ordenacaoAlterada) && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200 transition-colors shrink-0" onClick={limparFiltros}>
            <RotateCcw size={12}/>Limpar
          </button>
        )}
      </div>

      {/* Barra de ações em lote — só aparece com alguma linha marcada */}
      {(canLiberar || podeAssinar) && selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-slate-800 text-white shadow-sm">
          <span className="text-sm font-semibold">{selectedIds.size} selecionado{selectedIds.size !== 1 ? 's' : ''}</span>
          {canLiberar && (
            <button
              className="text-xs font-semibold bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              disabled={!elegiveisLiberar.length}
              title={!elegiveisLiberar.length ? 'Nenhuma das linhas selecionadas está "Aguardando Liberação"' : undefined}
              onClick={() => setLoteOverlay('liberar')}
            >
              <Send size={12}/>Liberar em lote ({elegiveisLiberar.length})
            </button>
          )}
          {canLiberar && (
            <button
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              disabled={!elegiveisReatribuir.length}
              title={!elegiveisReatribuir.length ? 'Nenhuma das linhas selecionadas está em análise' : undefined}
              onClick={() => setLoteOverlay('reatribuir')}
            >
              <UserCog size={12}/>Reatribuir em lote ({elegiveisReatribuir.length})
            </button>
          )}
          {podeAssinar && (
            <button
              className="text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
              disabled={!elegiveisAssinatura.length}
              title={!elegiveisAssinatura.length ? 'Nenhuma das linhas selecionadas está "Aguardando Assinatura" sem assinar' : undefined}
              onClick={() => setLoteOverlay('assinatura')}
            >
              <FileSignature size={12}/>Confirmar assinatura em lote ({elegiveisAssinatura.length})
            </button>
          )}
          <button className="ml-auto text-xs text-slate-300 hover:text-white transition-colors" onClick={() => setSelectedIds(new Set())}>
            Limpar seleção
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 size={28} className="animate-spin text-blue-500"/></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {(canLiberar || podeAssinar) && (
                    <th className="px-3 py-3 w-8">
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        checked={todasSelecionaveisMarcadas}
                        onChange={() => setSelectedIds(todasSelecionaveisMarcadas ? new Set() : new Set(rows.map(r => r.id)))}
                      />
                    </th>
                  )}
                  {COLUNAS.map(c => (
                    <th key={c.label || 'acoes'} className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                      {c.field ? (
                        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors" onClick={() => toggleSort(c.field!)}>
                          {c.label}<SortIcon field={c.field}/>
                        </button>
                      ) : c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const isMeu = !!currentUser && r.analista_atual === currentUser.name;
                  const menuItems = [
                    { label: 'Abrir Análise', icon: ClipboardCheck, onClick: () => setOverlay({ type: 'detalhe', id: r.id }) },
                    ...(canLiberar && !isViewOnly ? [
                      { label: 'Editar Cadastro', icon: ClipboardCheck, onClick: () => setOverlay({ type: 'form', data: r }) },
                      ...(r.status === 'AGUARDANDO_LIBERACAO' ? [{ label: 'Liberar para Análise', icon: Send, onClick: () => setOverlay({ type: 'liberar', analise: r }) }] : []),
                      ...(r.status !== 'AGUARDANDO_LIBERACAO' && r.status !== 'CONCLUIDA' ? [{ label: 'Reatribuir Analista', icon: UserCog, onClick: () => setOverlay({ type: 'reatribuir', analise: r }) }] : []),
                      ...(canAdministrarAnalise ? [{ label: 'Alterar Status', icon: RefreshCw, onClick: () => setOverlay({ type: 'alterarStatus', analise: r }) }] : []),
                      ...(canAdministrarAnalise && r.status !== 'AGUARDANDO_LIBERACAO' ? [{ label: 'Resetar Análise', icon: RefreshCw, onClick: () => setResetRequest(r) }] : []),
                      { label: 'Excluir', icon: Trash2, danger: true, onClick: () => setDeleteId(r.id) },
                    ] : []),
                  ];
                  return (
                    <tr key={r.id} className={`border-t transition-colors ${isMeu ? 'bg-blue-50/50 border-l-[3px] border-l-blue-400 border-slate-100 hover:bg-blue-50/80' : 'border-slate-100 hover:bg-blue-50/30'}`}>
                      {(canLiberar || podeAssinar) && (
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                            checked={selectedIds.has(r.id)}
                            onChange={() => toggleSelected(r.id)}
                          />
                        </td>
                      )}
                      <td className="px-3 py-3 text-xs max-w-[150px] truncate" title={r.processo_sei}>
                        <button className="font-medium text-blue-700 hover:text-blue-900 hover:underline transition-colors" onClick={() => setOverlay({ type: 'detalhe', id: r.id })}>
                          {r.processo_sei}
                        </button>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{r.convenio_numero ?? '-'}</td>
                      <td className="px-3 py-3 text-sm text-slate-700 max-w-[200px] truncate" title={r.interessado ?? ''}>{r.interessado ?? '-'}</td>
                      <td className="px-3 py-3 text-sm text-slate-600 whitespace-nowrap">{GGCON_TIPO_CONVENIADA_LABELS[r.tipo_conveniada]}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={r.status}/>
                          {r.novo_destaque && <NovoBadge/>}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-600 max-w-[120px] truncate">
                        {r.analista_atual ?? '-'}
                        {isMeu && <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-bold align-middle">VOCÊ</span>}
                      </td>
                      <td className="px-3 py-3"><ProgressoChecklist respondidos={r.itens_respondidos ?? 0} total={r.itens_total ?? 0}/></td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600">{fmtDate(r.data_recebimento)}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600">{fmtDate(r.data_liberacao)}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600">{fmtDate(r.data_analise)}</td>
                      <td className="px-3 py-3 text-sm whitespace-nowrap text-slate-600">
                        {r.area_encaminhamento ? (
                          <span title={fmtDate(r.data_encaminhamento) !== '-' ? `Em ${fmtDate(r.data_encaminhamento)}` : undefined}>
                            {r.area_encaminhamento}{r.data_encaminhamento ? ` (${fmtDate(r.data_encaminhamento)})` : ''}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-3 py-3 text-sm text-slate-500 max-w-[220px] truncate" title={r.observacoes ?? ''}>{r.observacoes ?? '-'}</td>
                      <td className="px-3 py-3"><RowMenu items={menuItems}/></td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr><td colSpan={COLUNAS.length + ((canLiberar || podeAssinar) ? 1 : 0)} className="py-16 text-center text-slate-400">
                    <Inbox size={28} className="mx-auto mb-2 text-slate-300"/>Nenhum registro encontrado
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>Página {page} de {totalPages} — {count.toLocaleString('pt-BR')} registros</span>
          <div className="flex gap-2">
            <button className={BTN_GHOST} disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/>Anterior</button>
            <button className={BTN_GHOST} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Próxima<ChevronRight size={16}/></button>
          </div>
        </div>
      )}

      {/* Modais */}
      {overlay?.type === 'form' && (
        <Modal title={overlay.data?.id ? 'Editar Cadastro' : 'Novo Registro'} subtitle="Despacho — conferência de Prestação de Contas" onClose={() => setOverlay(null)} size="xl">
          <DespachoForm
            initial={overlay.data}
            onSave={overlay.data?.id ? editarCabecalho : criarAnalise}
            onClose={() => setOverlay(null)}
          />
        </Modal>
      )}

      {overlay?.type === 'liberar' && (
        <LiberarModal
          analise={overlay.analise}
          analistas={analistas}
          onClose={() => setOverlay(null)}
          onConfirm={async (analista) => {
            if (!currentUser) return;
            await GgconAnaliseService.liberarParaAnalise(overlay.analise.id, analista, currentUser.name);
            await refresh();
            toast('success', `Liberado para ${analista}.`);
          }}
        />
      )}

      {overlay?.type === 'reatribuir' && (
        <ReatribuirModal
          analise={overlay.analise}
          analistas={analistas}
          onClose={() => setOverlay(null)}
          onConfirm={async (novoAnalista, motivo) => {
            if (!currentUser) return;
            await GgconAnaliseService.reatribuirAnalista(overlay.analise.id, overlay.analise.analista_atual, novoAnalista, currentUser.name, motivo);
            await refresh();
            toast('success', `Reatribuído para ${novoAnalista}.`);
          }}
        />
      )}

      {overlay?.type === 'alterarStatus' && (
        <AlterarStatusModal
          analise={overlay.analise}
          onClose={() => setOverlay(null)}
          onConfirm={async (novoStatus, motivo) => {
            if (!currentUser) return;
            await GgconAnaliseService.alterarStatus(overlay.analise.id, novoStatus, currentUser.name, motivo);
            await refresh();
            toast('success', `Status alterado para ${GGCON_ANALISE_STATUS_LABELS[novoStatus]}.`);
          }}
        />
      )}

      {overlay?.type === 'detalhe' && (
        <AnaliseDetalheOverlay
          analiseId={overlay.id}
          currentUser={currentUser}
          canLiberar={canLiberar}
          onClose={() => setOverlay(null)}
          onChanged={refresh}
        />
      )}

      {deleteId != null && (
        <PasswordConfirmModal
          title="Excluir análise"
          message="Confirme sua senha para excluir este registro de análise, incluindo todo o checklist e histórico. Esta ação não pode ser desfeita."
          onCancel={() => setDeleteId(null)}
          onConfirm={executeDelete}
        />
      )}

      {resetRequest && (
        <PasswordConfirmModal
          title="Resetar análise"
          message={`Confirme sua senha para resetar a análise do processo ${resetRequest.processo_sei}. Todas as respostas do checklist, a pendência registrada e as datas de análise/assinatura/encaminhamento serão apagadas — o processo volta para "Aguardando Análise", ainda com ${resetRequest.analista_atual ?? 'o mesmo analista'} responsável. Fica registrado no histórico e não pode ser desfeito.`}
          confirmLabel="Resetar"
          confirmIcon={RefreshCw}
          tone="amber"
          extraLabel="Motivo (opcional)"
          extraValue={resetMotivo}
          onExtraChange={setResetMotivo}
          onCancel={() => { setResetRequest(null); setResetMotivo(''); }}
          onConfirm={executeReset}
        />
      )}

      {loteOverlay === 'liberar' && (
        <LiberarLoteModal
          quantidade={elegiveisLiberar.length}
          analistas={analistas}
          onClose={() => setLoteOverlay(null)}
          onConfirm={executeLiberarLote}
        />
      )}

      {loteOverlay === 'reatribuir' && (
        <ReatribuirLoteModal
          quantidade={elegiveisReatribuir.length}
          analistas={analistas}
          onClose={() => setLoteOverlay(null)}
          onConfirm={executeReatribuirLote}
        />
      )}

      {loteOverlay === 'assinatura' && (
        <ConfirmarAssinaturaLoteModal
          quantidade={elegiveisAssinatura.length}
          onClose={() => setLoteOverlay(null)}
          onConfirm={executeConfirmarAssinaturaLote}
        />
      )}
    </div>
  );
};
