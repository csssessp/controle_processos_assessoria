import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Loader2, DollarSign, FolderOpen,
  ClipboardList, GitBranch, BarChart3, Layers, Info,
  RefreshCw, CheckCircle2, Users2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { GpcService } from '../services/gpcService';

// ─── XLSX utility ────────────────────────────────────────────────────────────

function exportXLSX(
  sheets: { name: string; rows: Record<string, unknown>[] }[],
  filename: string,
) {
  const wb = XLSX.utils.book_new();
  for (const { name, rows } of sheets) {
    if (!rows.length) continue;
    const ws = XLSX.utils.json_to_sheet(rows);
    const cols = Object.keys(rows[0]);
    ws['!cols'] = cols.map(col => ({
      wch: Math.min(
        60,
        Math.max(col.length + 2, ...rows.slice(0, 300).map(r => String(r[col] ?? '').length + 1)),
      ),
    }));
    XLSX.utils.book_append_sheet(wb, ws, name.substring(0, 31));
  }
  if (!wb.SheetNames.length) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Sem dados']]), 'Sem dados');
  }
  XLSX.writeFile(wb, filename);
}

const todayStr = () => new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');

// ─── KPI Card ────────────────────────────────────────────────────────────────

const KpiCard = ({
  label, value, icon: Icon, color,
}: { label: string; value: string | number; icon: React.ElementType; color: string }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
    <div className={`p-3 rounded-xl ${color} shrink-0`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
    </div>
  </div>
);

// ─── Report Card ─────────────────────────────────────────────────────────────

const ReportCard = ({
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
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
          <Icon size={20} className="text-white" />
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
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={handle}
        disabled={loading}
        className={`mt-auto flex items-center justify-center gap-2 w-full py-2.5 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-60
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
    exportXLSX([{
      name: 'Processos',
      rows: rows.map(p => ({
        'Código': p.codigo,
        'Processo': p.processo ?? '',
        'Convênio': p.convenio ?? '',
        'Tipo': p.tipo ?? '',
        'Ano Cadastro': p.ano_cadastro ?? '',
        'Entidade': p.entidade ?? '',
        'DRS': p.drs ?? '',
        'Vistoriado': p.vistoriado ? 'Sim' : 'Não',
        'Parcelamento': p.parcelamento ? 'Sim' : 'Não',
        'Acima/Abaixo': p.acima_abaixo ?? '',
      })),
    }], `gpc_processos_${todayStr()}.xlsx`);
  }, []);

  const relExercicios = useCallback(async () => {
    const rows = await GpcService.getExerciciosRelatorio();
    exportXLSX([{
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

  const relParcelamentos = useCallback(async () => {
    const d = await GpcService.getReportData();
    exportXLSX([{
      name: 'Parcelamentos',
      rows: (d.parcelamentosDetalhes ?? []).map(p => ({
        'Cód. Processo': p.processo_id,
        'Processo': p.processo ?? '',
        'Convênio': p.convenio ?? '',
        'Entidade': p.entidade ?? '',
        'Proc. Parcela': p.proc_parcela ?? '',
        'Tipo': p.tipo ?? '',
        'Exercício': p.exercicio ?? '',
        'Valor Gerador (R$)': p.valor_parcelado ?? 0,
        'Valor Corrigido (R$)': p.valor_corrigido ?? 0,
        'Nº Parcelas': p.parcelas ?? '',
        'Em Dia': p.em_dia ? 'Sim' : 'Não',
        'Concluído': p.parcelas_concluidas ? 'Sim' : 'Não',
        'Providências': p.providencias ?? '',
      })),
    }], `gpc_parcelamentos_${todayStr()}.xlsx`);
  }, []);

  const relTas = useCallback(async () => {
    const rows = await GpcService.getAllTasExport();
    exportXLSX([{
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
    exportXLSX([
      {
        name: 'Por DRS',
        rows: d.byDrs.map(x => ({ 'DRS': x.drs ?? 'Não informado', 'Quantidade': x.count })),
      },
      {
        name: 'Por Tipo',
        rows: d.byTipo.map(x => ({ 'Tipo': x.tipo ?? 'Não informado', 'Quantidade': x.count })),
      },
    ], `gpc_distribuicao_${todayStr()}.xlsx`);
  }, []);

  const relCompleto = useCallback(async () => {
    const [exercicios, reportData, processos, tas] = await Promise.all([
      GpcService.getExerciciosRelatorio(),
      GpcService.getReportData(),
      GpcService.getAllProcessosExport(),
      GpcService.getAllTasExport(),
    ]);

    const fmtBRL = (v: number | null | undefined) =>
      v == null ? 0 : v;

    exportXLSX([
      {
        name: 'Resumo',
        rows: [{
          'Data de Geração': new Date().toLocaleString('pt-BR'),
          'Total de Processos': reportData.totalProcessos,
          'Total de Exercícios': reportData.totalExercicios,
          'Total de Parcelamentos': reportData.totalParcelamentos,
          'Parcelamentos Ativos': reportData.parcelamentosAtivos,
          'Termos Aditivos': reportData.totalTas,
          'Valor Total Repasse (R$)': fmtBRL(reportData.valorTotalRepasse),
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
          'DRS': p.drs ?? '',
          'Vistoriado': p.vistoriado ? 'Sim' : 'Não',
          'Parcelamento': p.parcelamento ? 'Sim' : 'Não',
          'Acima/Abaixo': p.acima_abaixo ?? '',
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
          'Ex. Anterior (R$)': fmtBRL(e.exercicio_anterior),
          'Repasse (R$)': fmtBRL(e.repasse),
          'Aplicação (R$)': fmtBRL(e.aplicacao),
          'Total Convênio (R$)': e.total_convenio,
          'Gastos (R$)': fmtBRL(e.gastos),
          'Devolvido (R$)': fmtBRL(e.devolvido),
          'Saldo (R$)': e.saldo,
        })),
      },
      {
        name: 'Parcelamentos',
        rows: (reportData.parcelamentosDetalhes ?? []).map(p => ({
          'Cód. Processo': p.processo_id,
          'Processo': p.processo ?? '',
          'Convênio': p.convenio ?? '',
          'Entidade': p.entidade ?? '',
          'Proc. Parcela': p.proc_parcela ?? '',
          'Tipo': p.tipo ?? '',
          'Exercício': p.exercicio ?? '',
          'Valor Gerador (R$)': fmtBRL(p.valor_parcelado),
          'Valor Corrigido (R$)': fmtBRL(p.valor_corrigido),
          'Nº Parcelas': p.parcelas ?? '',
          'Em Dia': p.em_dia ? 'Sim' : 'Não',
          'Concluído': p.parcelas_concluidas ? 'Sim' : 'Não',
          'Providências': p.providencias ?? '',
        })),
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
          'Custo (R$)': fmtBRL(t.custo),
        })),
      },
      {
        name: 'Por DRS',
        rows: reportData.byDrs.map(x => ({ 'DRS': x.drs ?? 'Não informado', 'Quantidade': x.count })),
      },
      {
        name: 'Por Tipo',
        rows: reportData.byTipo.map(x => ({ 'Tipo': x.tipo ?? 'Não informado', 'Quantidade': x.count })),
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
      const { resumo, eventos } = await GpcService.getProdutividadeParaRelatorio(prodAno, prodMes || undefined);
      const periodoLabel = prodMes
        ? `${MESES.find(m => m.v === prodMes)?.l ?? prodMes}/${prodAno}`
        : `Ano ${prodAno}`;

      const evtLbl = (e: string) =>
        e === 'INICIO_ANALISE' ? 'Início de Análise'
        : e === 'POSICAO'     ? 'Avanço de Posição'
        : e === 'MOVIMENTO'   ? 'Atualização de Movimento'
        : e === 'CORRECAO'    ? 'Correção Documental'
        : e === 'CADASTRO'    ? 'Cadastro'
        : e;

      exportXLSX([
        {
          name: 'Resumo por Técnico',
          rows: resumo.map(t => ({
            'Técnico': t.responsavel,
            'Cadastros': t.cadastros,
            'Processos Analisados': t.analises,
            'Avanços de Posição': t.posicoes,
            'Atualizações de Movimento': t.movimentos, // inclui Correções Documentais (igual à tela)
            'Total de Ações': t.total,                 // = Analisados + Posições + Movimentos (sem Cadastros)
            'Páginas Analisadas': t.paginas,
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
      icon: Layers,
      color: 'bg-rose-600',
      title: 'Relatório Completo',
      description:
        'Arquivo único com todas as abas: Resumo, Processos, Exercícios, Parcelamentos, TAs, DRS e Tipo.',
      badge: '7 abas',
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
        <div className="flex items-center justify-center py-12">
          <Loader2 size={28} className="animate-spin text-blue-500" />
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
          Relatórios disponíveis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map(r => (
            <ReportCard key={r.title} {...r} />
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
