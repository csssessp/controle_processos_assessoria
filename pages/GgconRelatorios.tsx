import React, { useState, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet, Loader2, FolderOpen, GitBranch, BarChart3, Layers,
  RefreshCw, CheckCircle2, Users2, Clock, Scale, PenLine,
} from 'lucide-react';
import { GgconService, diasSemMovimentacao } from '../services/ggconService';

// ─── XLSX utility (idêntico ao usado em GpcRelatorios.tsx) ────────────────────

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
      wch: Math.min(60, Math.max(col.length + 2, ...rows.slice(0, 300).map(r => String(r[col] ?? '').length + 1))),
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
    <div className="min-w-0">
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-widest">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5 truncate">
        {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
      </p>
    </div>
  </div>
);

// ─── Report Card ─────────────────────────────────────────────────────────────

const ReportCard = ({
  icon: Icon, color, title, description, badge, onGenerate,
}: {
  icon: React.ElementType; color: string; title: string; description: string;
  badge?: string; onGenerate: () => Promise<void>;
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

// ─── Distribution bar (mesmo padrão do Dashboard) ─────────────────────────────

const DistBar = ({ label, count, total, color }: { label: string; count: number; total: number; color: string }) => (
  <div>
    <div className="flex justify-between text-xs text-slate-600 mb-1">
      <span className="truncate max-w-[70%]" title={label}>{label}</span>
      <span className="font-semibold">{count}</span>
    </div>
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full ${color}`} style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }} />
    </div>
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GgconRelatorios = () => {
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof GgconService.getDashboard>> | null>(null);
  const [loadingKpis, setLoadingKpis] = useState(false);

  const loadKpis = async () => {
    setLoadingKpis(true);
    setKpis(await GgconService.getDashboard());
    setLoadingKpis(false);
  };

  useEffect(() => { loadKpis(); }, []);

  const relTodos = useCallback(async () => {
    const rows = await GgconService.getAllProcessos();
    exportXLSX([{
      name: 'Processos GGCON',
      rows: rows.map(r => ({
        'Código': r.codigo,
        'Processo SEI': r.processo_sei,
        'Nº Demanda': r.numero_demanda ?? '',
        'Interessado': r.interessado ?? '',
        'Assunto': r.assunto ?? '',
        'Tipo': r.tipo ?? '',
        'Técnico Responsável': r.tecnico_responsavel ?? '',
        'Etapa Atual': r.etapa ?? '',
        'Coordenadoria': r.coordenadoria ?? '',
        'DRS / Unidade': r.drs_unidade ?? '',
        'Município': r.municipio ?? '',
        'Data de Entrada': r.data_entrada ?? '',
        'Data de Recebimento': r.data_recebimento ?? '',
        'Data da Movimentação': r.data_movimentacao ?? '',
        'Dias sem Movimentação': diasSemMovimentacao(r) ?? '',
        'Aguardando Assinatura': r.aguardando_assinatura ? 'Sim' : 'Não',
        'No Comitê Gestor': r.comite_gestor ? 'Sim' : 'Não',
        'Na Consultoria Jurídica': r.consultoria_juridica ? 'Sim' : 'Não',
        'Valor do Estado (R$)': r.valor_estado ?? 0,
        'Próxima Providência': r.proxima_providencia ?? '',
        'Área para Encaminhamento': r.area_encaminhamento ?? '',
        'Data de Envio': r.data_envio ?? '',
        'Observações': r.observacoes ?? '',
      })),
    }], `ggcon_processos_${todayStr()}.xlsx`);
  }, []);

  const relDistribuicao = useCallback(async () => {
    const d = await GgconService.getDashboard();
    exportXLSX([
      { name: 'Por Técnico', rows: d.porTecnico.map(x => ({ 'Técnico': x.tecnico, 'Quantidade': x.count })) },
      { name: 'Por Etapa', rows: d.porEtapa.map(x => ({ 'Etapa': x.etapa, 'Quantidade': x.count })) },
      { name: 'Por Coordenadoria', rows: d.porCoordenadoria.map(x => ({ 'Coordenadoria': x.coordenadoria, 'Quantidade': x.count })) },
      { name: 'Por Tipo', rows: d.porTipo.map(x => ({ 'Tipo': x.tipo, 'Quantidade': x.count })) },
    ], `ggcon_distribuicao_${todayStr()}.xlsx`);
  }, []);

  const relCompleto = useCallback(async () => {
    const [rows, d] = await Promise.all([GgconService.getAllProcessos(), GgconService.getDashboard()]);
    exportXLSX([
      {
        name: 'Resumo',
        rows: [{
          'Data de Geração': new Date().toLocaleString('pt-BR'),
          'Processos Únicos': d.processosUnicos,
          'Total de Movimentações': d.totalMovimentacoes,
          'Convênios Atuais': d.conveniosAtuais,
          'Termos Aditivos Atuais': d.termosAditivosAtuais,
          'No Comitê Gestor': d.comiteGestor,
          'Na Consultoria Jurídica': d.consultoriaJuridica,
          'Aguardando Assinatura': d.aguardandoAssinatura,
          'Parados > 30 dias': d.parados30,
          'Parados > 60 dias': d.parados60,
          'Sem Técnico': d.semTecnico,
          'Sem Próxima Providência': d.semProximaProvidencia,
        }],
      },
      {
        name: 'Processos',
        rows: rows.map(r => ({
          'Código': r.codigo,
          'Processo SEI': r.processo_sei,
          'Interessado': r.interessado ?? '',
          'Tipo': r.tipo ?? '',
          'Técnico Responsável': r.tecnico_responsavel ?? '',
          'Etapa Atual': r.etapa ?? '',
          'Coordenadoria': r.coordenadoria ?? '',
          'DRS / Unidade': r.drs_unidade ?? '',
          'Data da Movimentação': r.data_movimentacao ?? '',
          'Dias sem Movimentação': diasSemMovimentacao(r) ?? '',
          'Aguardando Assinatura': r.aguardando_assinatura ? 'Sim' : 'Não',
          'No Comitê Gestor': r.comite_gestor ? 'Sim' : 'Não',
          'Na Consultoria Jurídica': r.consultoria_juridica ? 'Sim' : 'Não',
          'Valor do Estado (R$)': r.valor_estado ?? 0,
          'Próxima Providência': r.proxima_providencia ?? '',
        })),
      },
      { name: 'Por Técnico', rows: d.porTecnico.map(x => ({ 'Técnico': x.tecnico, 'Quantidade': x.count })) },
      { name: 'Por Etapa', rows: d.porEtapa.map(x => ({ 'Etapa': x.etapa, 'Quantidade': x.count })) },
      { name: 'Por Coordenadoria', rows: d.porCoordenadoria.map(x => ({ 'Coordenadoria': x.coordenadoria, 'Quantidade': x.count })) },
      { name: 'Por Tipo', rows: d.porTipo.map(x => ({ 'Tipo': x.tipo, 'Quantidade': x.count })) },
    ], `ggcon_relatorio_completo_${todayStr()}.xlsx`);
  }, []);

  const reports = [
    {
      icon: FolderOpen, color: 'bg-blue-500', title: 'Todos os Processos',
      description: 'Lista completa de todas as movimentações registradas, com etapa, técnico, situação e valores.',
      onGenerate: relTodos,
    },
    {
      icon: BarChart3, color: 'bg-slate-600', title: 'Distribuição',
      description: 'Contagem da situação atual de cada processo agrupada por técnico, etapa, coordenadoria e tipo.',
      badge: '4 abas',
      onGenerate: relDistribuicao,
    },
    {
      icon: Layers, color: 'bg-rose-600', title: 'Relatório Completo',
      description: 'Arquivo único com todas as abas: Resumo, Processos, Técnico, Etapa, Coordenadoria e Tipo.',
      badge: '6 abas',
      onGenerate: relCompleto,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios GGCON</h2>
          <p className="text-sm text-slate-500 mt-0.5">Indicadores e exportações do controle de entrada de processos SEI</p>
        </div>
        <button
          onClick={loadKpis}
          disabled={loadingKpis}
          className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loadingKpis ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* KPIs */}
      {loadingKpis && !kpis ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 size={28} className="animate-spin text-blue-500" />
          <p className="text-slate-500 text-sm">Carregando indicadores...</p>
        </div>
      ) : kpis ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiCard label="Processos Únicos" value={kpis.processosUnicos} icon={FolderOpen} color="bg-blue-500" />
            <KpiCard label="Movimentações" value={kpis.totalMovimentacoes} icon={GitBranch} color="bg-indigo-500" />
            <KpiCard label="Convênios Atuais" value={kpis.conveniosAtuais} icon={FileSpreadsheet} color="bg-emerald-600" />
            <KpiCard label="TAs Atuais" value={kpis.termosAditivosAtuais} icon={FileSpreadsheet} color="bg-teal-600" />
            <KpiCard label="Comitê Gestor" value={kpis.comiteGestor} icon={Users2} color="bg-purple-500" />
            <KpiCard label="Consultoria Jurídica" value={kpis.consultoriaJuridica} icon={Scale} color="bg-cyan-600" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <KpiCard label="Aguard. Assinatura" value={kpis.aguardandoAssinatura} icon={PenLine} color="bg-amber-500" />
            <KpiCard label="Parados > 30 dias" value={kpis.parados30} icon={Clock} color="bg-orange-500" />
            <KpiCard label="Parados > 60 dias" value={kpis.parados60} icon={Clock} color="bg-red-600" />
            <KpiCard label="Sem Técnico" value={kpis.semTecnico} icon={Users2} color="bg-slate-500" />
            <KpiCard label="Sem Próx. Providência" value={kpis.semProximaProvidencia} icon={FileSpreadsheet} color="bg-slate-600" />
          </div>

          {/* Distribuições */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-4">Processos por Técnico (situação atual)</h3>
              <div className="space-y-2.5">
                {kpis.porTecnico.slice(0, 10).map(x => (
                  <DistBar key={x.tecnico} label={x.tecnico} count={x.count} total={kpis.processosUnicos} color="bg-blue-500" />
                ))}
                {!kpis.porTecnico.length && <p className="text-xs text-slate-400 text-center py-4">Sem dados</p>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-bold text-slate-700 text-sm mb-4">Processos por Etapa (situação atual)</h3>
              <div className="space-y-2.5">
                {kpis.porEtapa.slice(0, 10).map(x => (
                  <DistBar key={x.etapa} label={x.etapa} count={x.count} total={kpis.processosUnicos} color="bg-emerald-500" />
                ))}
                {!kpis.porEtapa.length && <p className="text-xs text-slate-400 text-center py-4">Sem dados</p>}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Relatórios */}
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
    </div>
  );
};
