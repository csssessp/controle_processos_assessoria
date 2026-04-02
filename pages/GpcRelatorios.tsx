import React, { useState, useEffect } from 'react';
import { Download, FileText, Loader2, DollarSign, FolderOpen, ClipboardList, GitBranch, RefreshCw } from 'lucide-react';
import { GpcService, GpcReportData } from '../services/gpcService';

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (v: number | null | undefined) =>
  v == null ? 'R$ 0,00' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const exportCSV = (rows: Record<string, any>[], filename: string) => {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const header = cols.join(';');
  const body = rows.map(r => cols.map(c => {
    const val = r[c];
    if (val == null) return '';
    const str = String(val);
    return str.includes(';') || str.includes('"') || str.includes('\n') ? `"${str.replace(/"/g, '""')}"` : str;
  }).join(';'));
  const csv = '\uFEFF' + [header, ...body].join('\n'); // BOM for Excel pt-BR
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: any; color: string }) => (
  <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4`}>
    <div className={`p-3 rounded-full ${color}`}>
      <Icon size={22} className="text-white" />
    </div>
    <div>
      <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-0.5">{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</p>
    </div>
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-base font-semibold text-slate-700 mb-3">{children}</h3>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export const GpcRelatorios = () => {
  const [data, setData] = useState<GpcReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await GpcService.getReportData();
    setData(r);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const maxDrs = data ? Math.max(...data.byDrs.map(d => d.count), 1) : 1;
  const maxTipo = data ? Math.max(...data.byTipo.map(t => t.count), 1) : 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Relatórios GPC</h2>
          <p className="text-sm text-slate-500 mt-0.5">Visão consolidada dos convênios e processos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={load}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          {data && (
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              onClick={() => exportCSV([
                { 'Processos': data.totalProcessos, 'Exercícios': data.totalExercicios, 'Parcelamentos': data.totalParcelamentos, 'Termos Aditivos': data.totalTas, 'Parcelamentos Ativos': data.parcelamentosAtivos, 'Valor Total Repasse': data.valorTotalRepasse }
              ], 'gpc_resumo.csv')}
            >
              <Download size={14} />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24"><Loader2 size={32} className="animate-spin text-blue-500" /></div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Total de Processos" value={data.totalProcessos} icon={FolderOpen} color="bg-blue-500" />
            <StatCard label="Total de Exercícios" value={data.totalExercicios} icon={FileText} color="bg-indigo-500" />
            <StatCard label="Parcelamentos" value={data.totalParcelamentos} icon={ClipboardList} color="bg-amber-500" />
            <StatCard label="Termos Aditivos" value={data.totalTas} icon={GitBranch} color="bg-emerald-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-500">
                <ClipboardList size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Parcelamentos Ativos (em dia)</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{data.parcelamentosAtivos.toLocaleString('pt-BR')}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-600">
                <DollarSign size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Valor Total Repasse (exercícios)</p>
                <p className="text-2xl font-bold text-slate-800 mt-0.5">{fmt(data.valorTotalRepasse)}</p>
              </div>
            </div>
          </div>

          {/* Charts section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Por DRS */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Processos por DRS</SectionTitle>
                <button
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-green-700 border border-slate-200 px-2 py-1 rounded"
                  onClick={() => exportCSV(data.byDrs.map(d => ({ DRS: d.drs ?? 'Não informado', Quantidade: d.count })), 'gpc_por_drs.csv')}
                >
                  <Download size={11} /> CSV
                </button>
              </div>
              <div className="space-y-2">
                {data.byDrs.map(d => (
                  <div key={d.drs ?? 'n'} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-20 text-right shrink-0">DRS {d.drs ?? '—'}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${(d.count / maxDrs) * 100}%`, minWidth: '32px' }}
                      >
                        <span className="text-[10px] text-white font-semibold">{d.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!data.byDrs.length && <p className="text-sm text-slate-400 text-center py-4">Sem dados</p>}
              </div>
            </div>

            {/* Por Tipo */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <SectionTitle>Processos por Tipo</SectionTitle>
                <button
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-green-700 border border-slate-200 px-2 py-1 rounded"
                  onClick={() => exportCSV(data.byTipo.map(t => ({ Tipo: t.tipo ?? 'Não informado', Quantidade: t.count })), 'gpc_por_tipo.csv')}
                >
                  <Download size={11} /> CSV
                </button>
              </div>
              <div className="space-y-2">
                {data.byTipo.map(t => (
                  <div key={t.tipo ?? 'n'} className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-24 text-right shrink-0 truncate">{t.tipo ?? '—'}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full flex items-center justify-end pr-2 transition-all"
                        style={{ width: `${(t.count / maxTipo) * 100}%`, minWidth: '32px' }}
                      >
                        <span className="text-[10px] text-white font-semibold">{t.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {!data.byTipo.length && <p className="text-sm text-slate-400 text-center py-4">Sem dados</p>}
              </div>
            </div>
          </div>

          {/* Parcelamentos em aberto */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Parcelamentos — situação por processo</SectionTitle>
              <button
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-green-700 border border-slate-200 px-2 py-1 rounded"
                onClick={() => exportCSV(
                  (data.parcelamentosDetalhes ?? []).map(p => ({
                    'Cód.Processo': p.processo_id,
                    'Processo': p.processo,
                    'Convênio': p.convenio,
                    'Entidade': p.entidade,
                    'Proc.Parcela': p.proc_parcela,
                    'Tipo': p.tipo,
                    'Exercício': p.exercicio,
                    'Valor Parcelado': p.valor_parcelado,
                    'Valor Corrigido': p.valor_corrigido,
                    'Parcelas': p.parcelas,
                    'Em Dia': p.em_dia ? 'Sim' : 'Não',
                    'Concluído': p.parcelas_concluidas ? 'Sim' : 'Não',
                    'Providências': p.providencias,
                  })),
                  'gpc_parcelamentos.csv'
                )}
              >
                <Download size={11} /> Exportar CSV
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    {['Processo','Convênio','Entidade','Proc.Parcela','Tipo','Exercício','Val.Parcelado','Val.Corrigido','Parcelas','Em Dia','Concluído'].map(h => (
                      <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(data.parcelamentosDetalhes ?? []).slice(0, 100).map((p, i) => (
                    <tr key={i} className="border-t hover:bg-slate-50">
                      <td className="px-2 py-1.5 font-medium max-w-[120px] truncate">{p.processo ?? '-'}</td>
                      <td className="px-2 py-1.5">{p.convenio ?? '-'}</td>
                      <td className="px-2 py-1.5 max-w-[160px] truncate" title={p.entidade}>{p.entidade ?? '-'}</td>
                      <td className="px-2 py-1.5 max-w-[120px] truncate">{p.proc_parcela ?? '-'}</td>
                      <td className="px-2 py-1.5">{p.tipo ?? '-'}</td>
                      <td className="px-2 py-1.5">{p.exercicio ?? '-'}</td>
                      <td className="px-2 py-1.5">{fmt(p.valor_parcelado)}</td>
                      <td className="px-2 py-1.5">{fmt(p.valor_corrigido)}</td>
                      <td className="px-2 py-1.5 text-center">{p.parcelas ?? '-'}</td>
                      <td className="px-2 py-1.5 text-center">{p.em_dia ? '✅' : '❌'}</td>
                      <td className="px-2 py-1.5 text-center">{p.parcelas_concluidas ? '✅' : '❌'}</td>
                    </tr>
                  ))}
                  {!(data.parcelamentosDetalhes ?? []).length && (
                    <tr><td colSpan={11} className="py-6 text-center text-slate-400">Nenhum parcelamento encontrado</td></tr>
                  )}
                </tbody>
              </table>
              {(data.parcelamentosDetalhes ?? []).length > 100 && (
                <p className="text-xs text-slate-400 px-3 py-2">Exibindo 100 de {data.parcelamentosDetalhes!.length} registros. Use o CSV para exportar todos.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
