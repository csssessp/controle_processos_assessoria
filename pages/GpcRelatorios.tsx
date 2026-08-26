import React, { useState, useCallback, useEffect } from 'react';
import ExcelJS from 'exceljs';
import {
  FileSpreadsheet, Loader2, DollarSign, FolderOpen,
  ClipboardList, GitBranch, BarChart3, Layers, Info,
  RefreshCw, CheckCircle2, Users2, ChevronDown, ChevronUp, ShieldAlert,
  Gavel, AlertTriangle, PhoneCall, Archive, Landmark,
} from 'lucide-react';
import { GpcService } from '../services/gpcService';
import { nomeDRSPorNumero } from '../services/ggconMunicipios';
import { GpcRecebido } from '../types';

// ─── XLSX utility ────────────────────────────────────────────────────────────
// Cabeçalho dourado (#FFE699) — mesma cor usada nas abas PARCELAMENTOS / CSS
// PARCELAMENTO / Servidores da planilha de referência do TCE. A lib xlsx (grátis)
// só lê estilo, não escreve — por isso os relatórios usam exceljs para gerar
// arquivos já formatados (cor, negrito, bordas, congelar cabeçalho).
const HEADER_FILL = 'FFFFE699';
const BORDER_COLOR = 'FFE2E8F0';
const THIN_BORDER = { style: 'thin' as const, color: { argb: BORDER_COLOR } };

async function exportXLSX(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  filename: string,
) {
  const wb = new ExcelJS.Workbook();
  const withData = sheets.filter(s => s.rows.length > 0);
  const finalSheets = withData.length ? withData : [{ name: 'Sem dados', rows: [{ 'Aviso': 'Sem dados para os filtros selecionados' }] }];

  for (const { name, rows } of finalSheets) {
    const ws = wb.addWorksheet(name.substring(0, 31));
    const cols = Object.keys(rows[0]);
    ws.columns = cols.map(col => ({
      header: col,
      key: col,
      width: Math.min(
        60,
        Math.max(col.length + 2, ...rows.slice(0, 300).map(r => String(r[col] ?? '').length + 1)),
      ),
    }));
    ws.addRows(rows);

    ws.eachRow(row => {
      row.eachCell(cell => {
        cell.border = { top: THIN_BORDER, left: THIN_BORDER, right: THIN_BORDER, bottom: THIN_BORDER };
      });
    });

    const headerRow = ws.getRow(1);
    headerRow.height = 22;
    headerRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
      cell.font = { bold: true, color: { argb: 'FF3F3300' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    if (cols.length) {
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const todayStr = () => new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
const fmtData = (d: string | null | undefined) => d ? d.slice(0, 10) : '';

// A UI atual não grava mais o campo legado "responsavel" (ver comentário em
// GpcProcessos_v2.tsx sobre responsavel_cadastro/responsaveis_analise) — usando
// só r.responsavel, todo registro cadastrado pelo sistema hoje sai com
// Responsável vazio no relatório. Mesma ordem de prioridade da tela de detalhes.
const resolveResponsavel = (r: Pick<GpcRecebido, 'responsavel' | 'responsavel_cadastro' | 'responsaveis_analise'>) =>
  (r.responsaveis_analise?.length ? r.responsaveis_analise.join(', ') : null)
  ?? r.responsavel_cadastro
  ?? r.responsavel
  ?? '';

const SITUACAO_LABELS: Record<string, string> = {
  REGULAR: 'Regular',
  IRREGULAR: 'Irregular',
  PARCIALMENTE_REGULAR: 'Parcialmente Regular',
};

const IRREGULAR_TIPO_LABELS: Record<string, string> = {
  CONTENCIOSO: 'Contencioso',
  CADIN: 'Cadin',
};

const IRREGULAR_DEBITO_LABELS: Record<string, string> = {
  SEM_DEBITO: 'Sem Débito',
  COM_DEBITO: 'Com Débito',
};

const RESSARCIMENTO_STATUS_LABELS: Record<string, string> = {
  RECOLHIDO: 'Recolhido',
  NAO_RECOLHIDO: 'Não Recolhido',
};

const COBRANCA_ESTAGIO_LABELS: Record<string, string> = {
  COBRANCA: 'Cobrança',
  DIVIDA_ATIVA: 'Dívida Ativa',
  EXECUCAO_FISCAL: 'Execução Fiscal',
};

const situacaoLabel = (s?: string | null) => (s ? (SITUACAO_LABELS[s] ?? s) : 'Não Avaliado');
const irregularTiposLabel = (tipos?: string[] | null) =>
  (tipos ?? []).map(t => IRREGULAR_TIPO_LABELS[t] ?? t).join(', ');

// Desfecho do julgamento IRREGULAR: Multa (sem débito) ou o estágio mais avançado do ressarcimento (com débito)
const desfechoJulgamentoLabel = (r: Pick<GpcRecebido, 'situacao' | 'irregular_debito' | 'ressarcimento_status' | 'cobranca_estagio'>) => {
  if (r.situacao !== 'IRREGULAR' || !r.irregular_debito) return '';
  if (r.irregular_debito === 'SEM_DEBITO') return 'Multa';
  const parts = ['Ressarcimento'];
  if (r.ressarcimento_status) parts.push(RESSARCIMENTO_STATUS_LABELS[r.ressarcimento_status] ?? r.ressarcimento_status);
  if (r.cobranca_estagio) parts.push(COBRANCA_ESTAGIO_LABELS[r.cobranca_estagio] ?? r.cobranca_estagio);
  return parts.join(' › ');
};

// ─── KPI Card ────────────────────────────────────────────────────────────────

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

// ─── Report List Item ───────────────────────────────────────────────────────

const ReportListItem = ({
  icon: Icon, color, title, description, badge, onGenerate,
}: {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
  badge?: string;
  onGenerate: () => Promise<void>;
}) => {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handle = async () => {
    setLoading(true);
    setDone(false);
    try {
      await onGenerate();
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-start gap-3 sm:items-center flex-1 min-w-0">
        <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
          <Icon size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
            {badge && (
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={handle}
        disabled={loading}
        className={`shrink-0 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-60
          ${done ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-green-700 hover:bg-green-800'}`}
      >
        {loading ? (
          <><Loader2 size={15} className="animate-spin" /> Gerando…</>
        ) : done ? (
          <><CheckCircle2 size={15} /> Baixado!</>
        ) : (
          <><FileSpreadsheet size={15} /> Gerar XLSX</>
        )}
      </button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GpcRelatorios = () => {
  // ── KPI state ─────────────────────────────────────────────────────────────
  const [kpis, setKpis] = useState<{
    totalProcessos: number;
    totalExercicios: number;
    totalParcelamentos: number;
    totalTas: number;
    parcelamentosAtivos: number;
    valorTotalRepasse: number;
  } | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);

  const loadKpis = async () => {
    setLoadingKpis(true);
    const d = await GpcService.getReportData();
    setKpis({
      totalProcessos: d.totalProcessos,
      totalExercicios: d.totalExercicios,
      totalParcelamentos: d.totalParcelamentos,
      totalTas: d.totalTas,
      parcelamentosAtivos: d.parcelamentosAtivos,
      valorTotalRepasse: d.valorTotalRepasse,
    });
    setLoadingKpis(false);
  };

  useEffect(() => { loadKpis(); }, []);

  // ── Report generators ─────────────────────────────────────────────────────

  const relProcessos = useCallback(async () => {
    const rows = await GpcService.getAllProcessosExport();
    await exportXLSX([{
      name: 'Processos',
      rows: rows.map(p => ({
        'Código': p.codigo,
        'Processo': p.processo ?? '',
        'Convênio': p.convenio ?? '',
        'Tipo': p.tipo ?? '',
        'Ano Cadastro': p.ano_cadastro ?? '',
        'Entidade': p.entidade ?? '',
        'DRS': nomeDRSPorNumero(p.drs) ?? '',
        'Vistoriado': p.vistoriado ? 'Sim' : 'Não',
        'Parcelamento': p.parcelamento ? 'Sim' : 'Não',
        'Acima/Abaixo': p.acima_abaixo ?? '',
      })),
    }], `gpc_processos_${todayStr()}.xlsx`);
  }, []);

  const relExercicios = useCallback(async () => {
    const rows = await GpcService.getExerciciosRelatorio();
    await exportXLSX([{
      name: 'Processos x Exercícios',
      rows: rows.map(e => ({
        'Código': e.processo_id,
        'Processo': e.processo ?? '',
        'Convênio': e.convenio ?? '',
        'Entidade': e.entidade ?? '',
        'Exercício': e.exercicio ?? '',
        'Ex. Anterior (R$)': e.exercicio_anterior ?? 0,
        'Repasse (R$)': e.repasse ?? 0,
        'Aplicação (R$)': e.aplicacao ?? 0,
        'Total Convênio (R$)': e.total_convenio,
        'Gastos (R$)': e.gastos ?? 0,
        'Devolvido (R$)': e.devolvido ?? 0,
        'Saldo (R$)': e.saldo,
      })),
    }], `gpc_exercicios_${todayStr()}.xlsx`);
  }, []);

  // Mesma estrutura de colunas da aba PARCELAMENTOS/CSS PARCELAMENTO da planilha de
  // referência do TCE (ITEM, Nº PROCESSO SEI/SPDOC..., ENTIDADE, Valor do Conv, DRS,
  // CONVENIO, EXERCICIO, RESPONSÁVEL/ANALISE, INICIO/TERMINO DA ANALISE, SITUAÇÃO,
  // Observação-Estatus) — Responsável e Início/Término vêm do envelope em
  // cgof_gpc_recebidos e da timeline em cgof_gpc_fluxo_tecnico (cgof_gpc_parcelamento
  // não tem esses campos), ver GpcService.getParcelamentosCompletos. Colunas extras do
  // próprio sistema (Tipo, Nº Parcelas, Em Dia, Concluído) ficam no fim, além do que a
  // planilha original tinha.
  const parcelamentoRowExport = (p: Awaited<ReturnType<typeof GpcService.getParcelamentosCompletos>>[number], item: number) => ({
    'ITEM': item,
    'Nº PROCESSO SEI/SPDOC SEM PAPEL/SISRAD': p.proc_parcela ?? p.processo ?? '',
    'ENTIDADE': p.entidade ?? '',
    'Valor do Conv (R$)': p.valor_corrigido ?? 0,
    'DRS': nomeDRSPorNumero(p.drs) ?? '',
    'CONVENIO': p.convenio ?? '',
    'EXERCICIO': p.exercicios?.length ? p.exercicios.join(', ') : (p.exercicio ?? ''),
    'RESPONSÁVEL/ANALISE': p.responsavel ?? '',
    'INICIO DA ANALISE': fmtData(p.inicio_analise),
    'TERMINO DA ANALISE': fmtData(p.termino_analise),
    'SITUAÇÃO': p.movimento ?? (p.parcelas_concluidas ? 'Parcelamento Quitado' : p.em_dia ? 'Em Pagamento' : ''),
    'Observação-Estatus': p.obs ?? p.providencias ?? '',
    'Tipo': p.tipo_parcelamento ?? p.tipo ?? '',
    'Nº Parcelas': p.parcelas ?? '',
    'Em Dia': p.em_dia ? 'Sim' : 'Não',
    'Concluído': p.parcelas_concluidas ? 'Sim' : 'Não',
  });

  const relParcelamentos = useCallback(async () => {
    const rows = await GpcService.getParcelamentosCompletos();
    await exportXLSX([{
      name: 'Parcelamentos',
      rows: rows.map((p, i) => parcelamentoRowExport(p, i + 1)),
    }], `gpc_parcelamentos_${todayStr()}.xlsx`);
  }, []);

  const relRegistros = useCallback(async () => {
    const rows = await GpcService.getAllRecebidos();
    await exportXLSX([{
      name: 'Registros — Situação',
      rows: rows.map(r => ({
        'Código': r.codigo,
        'Processo': r.processo ?? '',
        'Convênio': r.convenio ?? '',
        'Entidade': r.entidade ?? '',
        'Exercício': r.exercicio ?? '',
        'DRS': nomeDRSPorNumero(r.drs) ?? '',
        'Responsável': resolveResponsavel(r),
        'Posição': r.posicao ?? '',
        'Movimento': r.movimento ?? '',
        'Data': r.data ?? '',
        'Situação': situacaoLabel(r.situacao),
        'Tipos de Irregularidade': irregularTiposLabel(r.irregular_tipos),
        'Débito': r.irregular_debito ? (IRREGULAR_DEBITO_LABELS[r.irregular_debito] ?? r.irregular_debito) : '',
        'Desfecho do Julgamento': desfechoJulgamentoLabel(r),
        'Valor da Multa (R$)': r.valor_multa ?? 0,
        'Valor a Devolver (R$)': r.valor_a_devolver ?? 0,
        'Valor Devolvido (R$)': r.valor_devolvido ?? 0,
        'Obs. Situação': r.situacao_obs ?? '',
      })),
    }], `gpc_registros_situacao_${todayStr()}.xlsx`);
  }, []);

  const relTas = useCallback(async () => {
    const rows = await GpcService.getAllTasExport();
    await exportXLSX([{
      name: 'Termos Aditivos',
      rows: rows.map(t => ({
        'Código TA': t.codigo,
        'Processo': t.processo ?? '',
        'Convênio': t.convenio ?? '',
        'Entidade': t.entidade ?? '',
        'Número TA': t.numero ?? '',
        'Data': t.data ?? '',
        'Custo (R$)': t.custo ?? 0,
      })),
    }], `gpc_termos_aditivos_${todayStr()}.xlsx`);
  }, []);

  const relDistribuicao = useCallback(async () => {
    const d = await GpcService.getReportData();
    await exportXLSX([
      {
        name: 'Por DRS',
        rows: d.byDrs.map(x => ({ 'DRS': nomeDRSPorNumero(x.drs) ?? 'Não informado', 'Quantidade': x.count })),
      },
      {
        name: 'Por Tipo',
        rows: d.byTipo.map(x => ({ 'Tipo': x.tipo ?? 'Não informado', 'Quantidade': x.count })),
      },
    ], `gpc_distribuicao_${todayStr()}.xlsx`);
  }, []);

  const relPorDrsDetalhado = useCallback(async () => {
    const [rows, fluxo] = await Promise.all([
      GpcService.getAllRecebidos(),
      GpcService.getFluxoTecnicoTimeline(),
    ]);
    // Início/término da análise (colunas "Inicio"/"Termino" na planilha DRS 01..17) não
    // são campo próprio de cgof_gpc_recebidos — vêm do primeiro/último evento do técnico
    // no Fluxo Técnico ligado a este registro.
    const datasPorRegistro = new Map<number, string[]>();
    for (const f of fluxo) {
      if (!datasPorRegistro.has(f.registro_id)) datasPorRegistro.set(f.registro_id, []);
      datasPorRegistro.get(f.registro_id)!.push(f.data_evento);
    }
    const enviadoGgcon = (r: GpcRecebido) => /ggcon/i.test(r.movimento ?? '') || /ggcon/i.test(r.posicao ?? '') ? 'Sim' : 'Não';

    // DRS válido é 1–17, mais 18 = CSS (Coordenadoria de Serviços de Saúde, não é
    // uma DRS geográfica — ver services/ggconMunicipios.ts). Qualquer outro valor
    // (0, 19+ — lixo de digitação) cai no grupo "Não informado" em vez de virar
    // uma aba fantasma tipo "DRS 0".
    const porDrs = new Map<number | null, GpcRecebido[]>();
    for (const r of rows) {
      const key = (r.drs != null && r.drs >= 1 && r.drs <= 18) ? r.drs : null;
      if (!porDrs.has(key)) porDrs.set(key, []);
      porDrs.get(key)!.push(r);
    }
    const drsKeys = Array.from(porDrs.keys()).sort((a, b) => {
      if (a == null) return 1;
      if (b == null) return -1;
      return a - b;
    });
    // Nome da aba exatamente como na planilha de referência do TCE: "DRS 01".."DRS 17", "CSS".
    // Colunas seguem a mesma estrutura das abas "DRS 01".."DRS 17" originais (Numero_Processo,
    // Convênio, Valor do convênio, Nome do interessado, Data_Recebimento_GPC, Exercício
    // analisado, nome do tecn, Inicio, Termino, Folhas analisada, Enviado ao GGCON, Situação),
    // com as colunas de julgamento (Situação/Irregularidade) do sistema no fim.
    const sheets = drsKeys.map(drs => ({
      name: drs != null ? (drs === 18 ? 'CSS' : `DRS ${String(drs).padStart(2, '0')}`) : 'Não informado',
      rows: porDrs.get(drs)!.map(r => {
        const datas = (datasPorRegistro.get(r.codigo) ?? []).slice().sort();
        return {
          'Código': r.codigo,
          'Numero_Processo': r.processo ?? '',
          'Convênio': r.convenio ?? '',
          'Valor do convênio (R$)': r.valor_convenio ?? 0,
          'Nome do interessado': r.entidade ?? '',
          'Data_Recebimento_GPC': fmtData(r.data),
          'Exercício analisado': r.exercicio ?? '',
          'nome do tecn': resolveResponsavel(r),
          'Inicio': fmtData(datas[0]),
          'Termino': fmtData(datas.length ? datas[datas.length - 1] : null),
          'Folhas analisada': r.num_paginas ?? '',
          'Enviado ao GGCON': enviadoGgcon(r),
          'Posição': r.posicao ?? '',
          'Movimento': r.movimento ?? '',
          'Situação': situacaoLabel(r.situacao),
          'Tipos de Irregularidade': irregularTiposLabel(r.irregular_tipos),
          'Desfecho do Julgamento': desfechoJulgamentoLabel(r),
          'Valor a Devolver (R$)': r.valor_a_devolver ?? 0,
          'Valor Devolvido (R$)': r.valor_devolvido ?? 0,
        };
      }),
    }));

    // Aba extra: processos julgados IRREGULAR e classificados como Contencioso e/ou
    // Cadin (irregular_tipos) — destino é a Procuradoria Geral do Estado para cobrança
    // judicial/inscrição em Dívida Ativa. Junta registros de todas as DRS — por isso
    // tem coluna própria "DRS_Origem".
    const registrosPge = rows.filter(r =>
      r.situacao === 'IRREGULAR' &&
      (r.irregular_tipos?.includes('CONTENCIOSO') || r.irregular_tipos?.includes('CADIN')),
    );
    const sheetPge = {
      name: 'PGE CONTENCIOSO E DIVIDA ATIVA',
      rows: registrosPge.map(r => {
        const datas = (datasPorRegistro.get(r.codigo) ?? []).slice().sort();
        return {
          'Código': r.codigo,
          'Numero_Processo': r.processo ?? '',
          'Convênio': r.convenio ?? '',
          'Valor do convênio (R$)': r.valor_convenio ?? 0,
          'Nome do interessado': r.entidade ?? '',
          'Assunto_Especificacao': r.situacao_obs ?? '',
          'DRS_Origem': nomeDRSPorNumero(r.drs) ?? '',
          'Data_Recebimento_GPC': fmtData(r.data),
          'Exercício analisado': r.exercicio ?? '',
          'nome do tecn': resolveResponsavel(r),
          'Inicio': fmtData(datas[0]),
          'Termino': fmtData(datas.length ? datas[datas.length - 1] : null),
          'Folhas analisada': r.num_paginas ?? '',
          'Enviado ao GGCON': enviadoGgcon(r),
          'Situação': r.cobranca_estagio ? (COBRANCA_ESTAGIO_LABELS[r.cobranca_estagio] ?? r.cobranca_estagio) : '',
        };
      }),
    };

    await exportXLSX([...sheets, sheetPge], `gpc_registros_por_drs_${todayStr()}.xlsx`);
  }, []);

  // Colunas comuns a CJ/Outros — mesmo recorte de campos do relatório "Registros por DRS".
  const recebidoRowExport = (r: GpcRecebido) => ({
    'Código': r.codigo,
    'Processo': r.processo ?? '',
    'Convênio': r.convenio ?? '',
    'Entidade': r.entidade ?? '',
    'DRS': nomeDRSPorNumero(r.drs) ?? '',
    'Exercício': r.exercicio ?? '',
    'Responsável': resolveResponsavel(r),
    'Posição': r.posicao ?? '',
    'Movimento': r.movimento ?? '',
    'Data': r.data ?? '',
    'Observações': r.situacao_obs ?? '',
  });

  const relCj = useCallback(async () => {
    const rows = await GpcService.getAllRecebidos();
    const cj = rows.filter(r => r.posicao === 'Consultoria Jurídica (CJ)');
    await exportXLSX([{ name: 'CJ', rows: cj.map(recebidoRowExport) }], `gpc_cj_${todayStr()}.xlsx`);
  }, []);

  const relProcessosIrregulares = useCallback(async () => {
    const rows = await GpcService.getAllRecebidos();
    const irregulares = rows.filter(r => r.situacao === 'IRREGULAR');
    await exportXLSX([{
      name: 'Processos Irregulares',
      rows: irregulares.map(r => ({
        'Código': r.codigo,
        'Processo': r.processo ?? '',
        'Convênio': r.convenio ?? '',
        'Entidade': r.entidade ?? '',
        'Exercício': r.exercicio ?? '',
        'DRS': nomeDRSPorNumero(r.drs) ?? '',
        'Responsável': resolveResponsavel(r),
        'Posição': r.posicao ?? '',
        'Movimento': r.movimento ?? '',
        'Data': r.data ?? '',
        'Situação': situacaoLabel(r.situacao),
        'Tipos de Irregularidade': irregularTiposLabel(r.irregular_tipos),
        'Valor a Devolver (R$)': r.valor_a_devolver ?? 0,
        'Valor Devolvido (R$)': r.valor_devolvido ?? 0,
        'Obs. Situação': r.situacao_obs ?? '',
      })),
    }], `gpc_processos_irregulares_${todayStr()}.xlsx`);
  }, []);

  const relServicosApartados = useCallback(async () => {
    const rows = await GpcService.getAtividadesAvulsas();
    await exportXLSX([{
      name: 'Serviços Apartados',
      rows: rows.map(a => ({
        'Técnico': a.tecnico,
        'Tipo': a.tipo,
        'Descrição': a.descricao,
        'Contexto': a.contexto ?? '',
        'Horas': a.horas ?? '',
        'Páginas': a.paginas ?? '',
        'Data': a.data_atividade.slice(0, 16).replace('T', ' '),
      })),
    }], `gpc_servicos_apartados_${todayStr()}.xlsx`);
  }, []);

  // "Outros" e "CSS Parcelamento" eram recortes manuais da planilha sem campo
  // estrutural equivalente no sistema — dependem da coluna origem_planilha
  // (parte_61), preenchida só para os registros importados dessas duas abas.
  const relOutros = useCallback(async () => {
    const rows = await GpcService.getAllRecebidos();
    const outros = rows.filter(r => r.origem_planilha === 'OUTROS');
    await exportXLSX([{ name: 'OUTROS', rows: outros.map(recebidoRowExport) }], `gpc_outros_${todayStr()}.xlsx`);
  }, []);

  const relCssParcelamento = useCallback(async () => {
    const rows = await GpcService.getParcelamentosCompletos();
    const css = rows.filter(p => p.origem_planilha === 'CSS_PARCELAMENTO');
    await exportXLSX([{
      name: 'CSS Parcelamento',
      rows: css.map((p, i) => parcelamentoRowExport(p, i + 1)),
    }], `gpc_css_parcelamento_${todayStr()}.xlsx`);
  }, []);

  const relCompleto = useCallback(async () => {
    const [exercicios, reportData, processos, tas, recebidos, parcelamentos] = await Promise.all([
      GpcService.getExerciciosRelatorio(),
      GpcService.getReportData(),
      GpcService.getAllProcessosExport(),
      GpcService.getAllTasExport(),
      GpcService.getAllRecebidos(),
      GpcService.getParcelamentosCompletos(),
    ]);

    const raw = (v: number | null | undefined) =>
      v == null ? 0 : v;

    const regulares = recebidos.filter(r => r.situacao === 'REGULAR').length;
    const irregulares = recebidos.filter(r => r.situacao === 'IRREGULAR').length;
    const parcialmente = recebidos.filter(r => r.situacao === 'PARCIALMENTE_REGULAR').length;
    const semSituacao = recebidos.filter(r => !r.situacao).length;

    await exportXLSX([
      {
        name: 'Resumo',
        rows: [{
          'Data de Geração': new Date().toLocaleString('pt-BR'),
          'Total de Processos': reportData.totalProcessos,
          'Total de Exercícios': reportData.totalExercicios,
          'Total de Parcelamentos': reportData.totalParcelamentos,
          'Parcelamentos Ativos': reportData.parcelamentosAtivos,
          'Termos Aditivos': reportData.totalTas,
          'Valor Total Repasse (R$)': raw(reportData.valorTotalRepasse),
          'Registros Regulares': regulares,
          'Registros Irregulares': irregulares,
          'Registros Parcialmente Regulares': parcialmente,
          'Registros Sem Avaliação': semSituacao,
        }],
      },
      {
        name: 'Processos',
        rows: processos.map(p => ({
          'Código': p.codigo,
          'Processo': p.processo ?? '',
          'Convênio': p.convenio ?? '',
          'Tipo': p.tipo ?? '',
          'Ano Cadastro': p.ano_cadastro ?? '',
          'Entidade': p.entidade ?? '',
          'DRS': nomeDRSPorNumero(p.drs) ?? '',
          'Vistoriado': p.vistoriado ? 'Sim' : 'Não',
          'Parcelamento': p.parcelamento ? 'Sim' : 'Não',
          'Acima/Abaixo': p.acima_abaixo ?? '',
        })),
      },
      {
        name: 'Registros — Situação',
        rows: recebidos.map(r => ({
          'Código': r.codigo,
          'Processo': r.processo ?? '',
          'Convênio': r.convenio ?? '',
          'Entidade': r.entidade ?? '',
          'Exercício': r.exercicio ?? '',
          'DRS': nomeDRSPorNumero(r.drs) ?? '',
          'Responsável': resolveResponsavel(r),
          'Posição': r.posicao ?? '',
          'Movimento': r.movimento ?? '',
          'Data': r.data ?? '',
          'Situação': situacaoLabel(r.situacao),
          'Tipos de Irregularidade': irregularTiposLabel(r.irregular_tipos),
          'Débito': r.irregular_debito ? (IRREGULAR_DEBITO_LABELS[r.irregular_debito] ?? r.irregular_debito) : '',
          'Desfecho do Julgamento': desfechoJulgamentoLabel(r),
          'Valor da Multa (R$)': raw(r.valor_multa),
          'Valor a Devolver (R$)': raw(r.valor_a_devolver),
          'Valor Devolvido (R$)': raw(r.valor_devolvido),
          'Obs. Situação': r.situacao_obs ?? '',
        })),
      },
      {
        name: 'Processos x Exercícios',
        rows: exercicios.map(e => ({
          'Código': e.processo_id,
          'Processo': e.processo ?? '',
          'Convênio': e.convenio ?? '',
          'Entidade': e.entidade ?? '',
          'Exercício': e.exercicio ?? '',
          'Ex. Anterior (R$)': raw(e.exercicio_anterior),
          'Repasse (R$)': raw(e.repasse),
          'Aplicação (R$)': raw(e.aplicacao),
          'Total Convênio (R$)': e.total_convenio,
          'Gastos (R$)': raw(e.gastos),
          'Devolvido (R$)': raw(e.devolvido),
          'Saldo (R$)': e.saldo,
        })),
      },
      {
        name: 'Parcelamentos',
        rows: parcelamentos.map((p, i) => parcelamentoRowExport(p, i + 1)),
      },
      {
        name: 'Termos Aditivos',
        rows: tas.map(t => ({
          'Código TA': t.codigo,
          'Processo': t.processo ?? '',
          'Convênio': t.convenio ?? '',
          'Entidade': t.entidade ?? '',
          'Número TA': t.numero ?? '',
          'Data': t.data ?? '',
          'Custo (R$)': raw(t.custo),
        })),
      },
      {
        name: 'Por DRS',
        rows: reportData.byDrs.map(x => ({ 'DRS': nomeDRSPorNumero(x.drs) ?? 'Não informado', 'Quantidade': x.count })),
      },
      {
        name: 'Por Tipo',
        rows: reportData.byTipo.map(x => ({ 'Tipo': x.tipo ?? 'Não informado', 'Quantidade': x.count })),
      },
      {
        name: 'CJ',
        rows: recebidos.filter(r => r.posicao === 'Consultoria Jurídica (CJ)').map(recebidoRowExport),
      },
      {
        name: 'OUTROS',
        rows: recebidos.filter(r => r.origem_planilha === 'OUTROS').map(recebidoRowExport),
      },
      {
        name: 'CSS Parcelamento',
        rows: parcelamentos.filter(p => p.origem_planilha === 'CSS_PARCELAMENTO').map((p, i) => parcelamentoRowExport(p, i + 1)),
      },
      {
        name: 'Serviços Apartados',
        rows: (await GpcService.getAtividadesAvulsas()).map(a => ({
          'Técnico': a.tecnico,
          'Tipo': a.tipo,
          'Descrição': a.descricao,
          'Contexto': a.contexto ?? '',
          'Horas': a.horas ?? '',
          'Páginas': a.paginas ?? '',
          'Data': a.data_atividade.slice(0, 16).replace('T', ' '),
        })),
      },
    ], `gpc_relatorio_completo_${todayStr()}.xlsx`);
  }, []);

  // ── Produtividade state ──────────────────────────────────────────────────
  const curYear = new Date().getFullYear().toString();
  const [prodAno, setProdAno] = useState(curYear);
  const [prodMes, setProdMes] = useState(''); // '' = ano inteiro
  const [prodExpanded, setProdExpanded] = useState(false);
  const [prodLoading, setProdLoading] = useState(false);
  const [prodDone, setProdDone] = useState(false);

  const MESES = [
    { v: '01', l: 'Janeiro' }, { v: '02', l: 'Fevereiro' }, { v: '03', l: 'Março' },
    { v: '04', l: 'Abril' },   { v: '05', l: 'Maio' },      { v: '06', l: 'Junho' },
    { v: '07', l: 'Julho' },   { v: '08', l: 'Agosto' },    { v: '09', l: 'Setembro' },
    { v: '10', l: 'Outubro' }, { v: '11', l: 'Novembro' },  { v: '12', l: 'Dezembro' },
  ];

  const gerarProdutividade = useCallback(async () => {
    setProdLoading(true);
    setProdDone(false);
    try {
      const { resumo, eventos, atividades } = await GpcService.getProdutividadeParaRelatorio(prodAno, prodMes || undefined);
      const periodoLabel = prodMes
        ? `${MESES.find(m => m.v === prodMes)?.l ?? prodMes}/${prodAno}`
        : `Ano ${prodAno}`;

      const evtLbl = (e: string) =>
        e === 'INICIO_ANALISE'     ? 'Início de Análise'
        : e === 'POSICAO'          ? 'Avanço de Posição'
        : e === 'MOVIMENTO'        ? 'Atualização de Movimento'
        : e === 'CORRECAO'         ? 'Correção Documental'
        : e === 'CADASTRO'         ? 'Cadastro'
        : e === 'CADASTRO_EXERCICIO' ? 'Exercício Cadastrado'
        : e;

      await exportXLSX([
        {
          name: 'Resumo por Técnico',
          rows: resumo.map(t => ({
            'Técnico': t.responsavel,
            'Cadastros': t.cadastros,
            'Processos Analisados': t.analises,
            'Avanços de Posição': t.posicoes,
            'Atualizações de Movimento': t.movimentos,
            'Correções Documentais': t.correcoes,       // trabalho analítico de revisão, contado à parte
            'Exercícios Cadastrados': t.exercicios,
            'Outras Atividades': t.outras,               // trabalho sem vínculo a processo do GPC (auxílio a setor, documento, etc.)
            'Total de Ações': t.total,                  // = Analisados + Posições + Movimentos + Correções + Exercícios + Outras (sem Cadastros)
            'Páginas Trabalhadas': t.paginas,            // páginas de análises + páginas de correções documentais
            'Horas em Outras Atividades': t.horas,
          })),
        },
        {
          name: 'Detalhamento de Eventos',
          rows: eventos.map(e => ({
            'Técnico': e.responsavel,
            'Data/Hora': e.data_evento.slice(0, 16).replace('T', ' '),
            'Evento': evtLbl(e.evento),
            'Descrição': e.obs ?? '',
            'Processo (ID)': e.registro_id,
            'Páginas': e.num_paginas_analise ?? '',
          })),
        },
        {
          name: 'Atividades Avulsas',
          rows: atividades.map(a => ({
            'Técnico': a.tecnico,
            'Tipo': a.tipo,
            'Data': a.data_atividade.slice(0, 16).replace('T', ' '),
            'Descrição': a.descricao,
            'Contexto': a.contexto ?? '',
            'Páginas': a.paginas ?? '',
            'Horas': a.horas ?? '',
          })),
        },
      ], `produtividade_gpc_${periodoLabel.replace('/', '-')}_${todayStr()}.xlsx`);

      setProdDone(true);
      setTimeout(() => setProdDone(false), 3000);
    } finally {
      setProdLoading(false);
    }
  }, [prodAno, prodMes]);

  // ── Report catalog ────────────────────────────────────────────────────────

  const reports = [
    {
      icon: FolderOpen,
      color: 'bg-blue-500',
      title: 'Todos os Processos',
      description:
        'Lista completa de todos os convênios cadastrados com informações de DRS, tipo, entidade, vistoria e parcelamento.',
      onGenerate: relProcessos,
    },
    {
      icon: DollarSign,
      color: 'bg-emerald-600',
      title: 'Processos × Exercícios',
      description:
        'Dados financeiros por exercício: ex. anterior, repasse, aplicação, gastos, devolvido e saldo calculado.',
      onGenerate: relExercicios,
    },
    {
      icon: ClipboardList,
      color: 'bg-amber-500',
      title: 'Parcelamentos',
      description:
        'Situação de todos os parcelamentos com valores, número de parcelas, status de adimplência e providências.',
      onGenerate: relParcelamentos,
    },
    {
      icon: ShieldAlert,
      color: 'bg-red-500',
      title: 'Registros — Situação',
      description:
        'Situação de regularidade de cada registro: Regular, Irregular ou Parcialmente Regular, com tipos de irregularidade e valores a devolver/devolvidos.',
      onGenerate: relRegistros,
    },
    {
      icon: GitBranch,
      color: 'bg-indigo-500',
      title: 'Termos Aditivos',
      description:
        'Todos os termos aditivos registrados com número, data e custo associado ao processo/convênio.',
      onGenerate: relTas,
    },
    {
      icon: BarChart3,
      color: 'bg-slate-600',
      title: 'Distribuição por DRS e Tipo',
      description:
        'Contagem de processos agrupada por DRS e por tipo de convênio. Gera arquivo com duas abas.',
      badge: '2 abas',
      onGenerate: relDistribuicao,
    },
    {
      icon: Users2,
      color: 'bg-cyan-600',
      title: 'Registros por DRS',
      description:
        'Lista detalhada dos registros (processo, entidade, responsável, posição, situação) separada em uma aba por DRS, mais uma aba com os encaminhados à PGE (Contencioso e Dívida Ativa).',
      badge: 'Múltiplas abas',
      onGenerate: relPorDrsDetalhado,
    },
    {
      icon: Gavel,
      color: 'bg-purple-600',
      title: 'CJ',
      description:
        'Processos atualmente na posição "Consultoria Jurídica (CJ)".',
      onGenerate: relCj,
    },
    {
      icon: AlertTriangle,
      color: 'bg-red-600',
      title: 'Processos Irregulares',
      description:
        'Recorte apenas dos registros com situação Irregular — mesma informação de "Registros — Situação", filtrada.',
      onGenerate: relProcessosIrregulares,
    },
    {
      icon: PhoneCall,
      color: 'bg-teal-600',
      title: 'Serviços Apartados',
      description:
        'Atendimentos e tarefas avulsas dos técnicos sem vínculo a um processo específico do GPC.',
      onGenerate: relServicosApartados,
    },
    {
      icon: Archive,
      color: 'bg-orange-600',
      title: 'Outros',
      description:
        'Processos diversos sem classificação de DRS — recorte histórico da planilha de origem (só cobre os registros importados a partir dela).',
      onGenerate: relOutros,
    },
    {
      icon: Landmark,
      color: 'bg-fuchsia-600',
      title: 'CSS Parcelamento',
      description:
        'Parcelamentos originados da Coordenadoria de Serviços de Saúde (CSS) — recorte histórico da planilha de origem.',
      onGenerate: relCssParcelamento,
    },
    {
      icon: Layers,
      color: 'bg-rose-600',
      title: 'Relatório Completo',
      description:
        'Arquivo único com todas as abas: Resumo, Processos, Situação dos Registros, Exercícios, Parcelamentos, TAs, DRS, Tipo, CJ, Outros, CSS Parcelamento e Serviços Apartados.',
      badge: '12 abas',
      onGenerate: relCompleto,
    },
  ];

  const fmtBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios GPC</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Selecione o relatório desejado e clique em <strong>Gerar XLSX</strong> para baixar
          </p>
        </div>
        <button
          onClick={loadKpis}
          disabled={loadingKpis}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={loadingKpis ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────────── */}
      {loadingKpis && !kpis ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <p className="text-slate-500 text-sm">Carregando indicadores...</p>
        </div>
      ) : kpis ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard label="Processos" value={kpis.totalProcessos} icon={FolderOpen} color="bg-blue-500" />
          <KpiCard label="Exercícios" value={kpis.totalExercicios} icon={DollarSign} color="bg-emerald-600" />
          <KpiCard label="Parcelamentos" value={kpis.totalParcelamentos} icon={ClipboardList} color="bg-amber-500" />
          <KpiCard label="Parc. Ativos" value={kpis.parcelamentosAtivos} icon={CheckCircle2} color="bg-orange-500" />
          <KpiCard label="Termos Adit." value={kpis.totalTas} icon={GitBranch} color="bg-indigo-500" />
          <KpiCard label="Total Repasse" value={fmtBRL(kpis.valorTotalRepasse)} icon={DollarSign} color="bg-green-700" />
        </div>
      ) : null}

      {/* ── Report catalog ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
          Relatórios disponíveis ({reports.length})
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {reports.map(r => (
            <ReportListItem key={r.title} {...r} />
          ))}
        </div>
      </div>

      {/* ── Produtividade — relatório com filtro de período ────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header row — always visible */}
        <button
          className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
          onClick={() => setProdExpanded(v => !v)}
        >
          <div className="p-2.5 rounded-xl bg-violet-600 shrink-0">
            <Users2 size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-800 text-sm">Produtividade por Período</h3>
              <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-wide">2 abas</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Resumo por técnico + detalhamento de eventos filtrando por ano e mês
            </p>
          </div>
          {prodExpanded ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
        </button>

        {/* Expanded filters */}
        {prodExpanded && (
          <div className="border-t border-slate-100 px-5 py-4 space-y-4">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Ano */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ano</label>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                  value={prodAno}
                  onChange={e => setProdAno(e.target.value)}
                >
                  {Array.from({ length: 6 }, (_, i) => (new Date().getFullYear() - i).toString()).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Mês */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Mês (opcional)</label>
                <select
                  className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400"
                  value={prodMes}
                  onChange={e => setProdMes(e.target.value)}
                >
                  <option value="">Ano inteiro</option>
                  {MESES.map(m => (
                    <option key={m.v} value={m.v}>{m.l}</option>
                  ))}
                </select>
              </div>

              {/* Generate button */}
              <button
                onClick={gerarProdutividade}
                disabled={prodLoading}
                className={`flex items-center gap-2 px-5 py-2 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-60
                  ${prodDone ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-violet-600 hover:bg-violet-700'}`}
              >
                {prodLoading ? (
                  <><Loader2 size={15} className="animate-spin" /> Gerando…</>
                ) : prodDone ? (
                  <><CheckCircle2 size={15} /> Baixado!</>
                ) : (
                  <><FileSpreadsheet size={15} /> Gerar XLSX</>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Selecione <strong>Ano inteiro</strong> para consolidar todos os meses do ano, ou escolha um mês específico.
              O XLSX terá duas abas: <em>Resumo por Técnico</em> e <em>Detalhamento de Eventos</em>.
            </p>
          </div>
        )}
      </div>

      {/* ── Info notice ────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
        <Info size={15} className="shrink-0 mt-0.5" />
        <span>
          Todos os relatórios são gerados em formato <strong>XLSX (Excel)</strong>. Os valores financeiros são
          exportados como números para permitir cálculos e formatação personalizada dentro do Excel.
          O arquivo é nomeado automaticamente com a data de hoje.
        </span>
      </div>
    </div>
  );
};
