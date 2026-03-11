import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Process, PrestacaoConta, PRESTACAO_STATUS_OPTIONS } from '../types';
import { DbService } from '../services/dbService';
import { toDisplayDate } from './ProcessManager';
import {
  BarChart3, TrendingUp, Clock, AlertTriangle, FileText, ArrowRight,
  Calendar, Loader2, RefreshCw, CheckCircle2, Timer, Zap,
  Building2, FolderOpen, Users
} from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── Cores ──────────────────────────────────────────────────────
const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981',
  '#ec4899', '#f97316', '#14b8a6', '#6366f1', '#84cc16', '#e11d48'
];

const STATUS_COLORS: Record<string, string> = {
  'Pendente': '#eab308',
  'Em Análise': '#3b82f6',
  'Aprovada': '#22c55e',
  'Reprovada': '#ef4444',
  'Devolvida': '#f97316',
  'Concluída': '#10b981',
};

interface MonthlyData { month: string; entrada: number; saida: number; }

export const Dashboard = () => {
  const { fetchPrestacaoContas } = useApp();

  const [processes, setProcesses] = useState<Process[]>([]);
  const [prestacoes, setPrestacoes] = useState<PrestacaoConta[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const loadAll = async () => {
    setLoading(true);
    try {
      const [procResult, pcResult] = await Promise.all([
        DbService.getAllProcessesForDashboard(),
        fetchPrestacaoContas()
      ]);
      setProcesses(procResult.data);
      setPrestacoes(pcResult);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // ─── KPIs Processos ──────────────────────────────────────────
  const processStats = useMemo(() => {
    const total = processes.length;
    const urgent = processes.filter(p => p.urgent).length;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const withDeadline = processes.filter(p => p.deadline);
    const overdue = withDeadline.filter(p => new Date(p.deadline!) < today).length;

    const nearDeadline = withDeadline.filter(p => {
      const d = new Date(p.deadline!);
      const diff = (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 7;
    }).length;

    const withExitDate = processes.filter(p => p.processDate).length;
    const withoutExitDate = total - withExitDate;

    const tramitacao = processes
      .filter(p => p.processDate && p.entryDate)
      .map(p => {
        const entry = new Date(p.entryDate);
        const exit = new Date(p.processDate!);
        return (exit.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24);
      })
      .filter(d => d >= 0);
    const avgDays = tramitacao.length > 0
      ? Math.round(tramitacao.reduce((a, b) => a + b, 0) / tramitacao.length)
      : 0;

    return { total, urgent, overdue, nearDeadline, withExitDate, withoutExitDate, avgDays };
  }, [processes]);

  // ─── Processos por mês (últimos 12 meses) ─────────────────────
  const monthlyProcesses = useMemo(() => {
    const now = new Date();
    const months: MonthlyData[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      const entrada = processes.filter(p => p.entryDate?.startsWith(key)).length;
      const saida = processes.filter(p => p.processDate?.startsWith(key)).length;
      months.push({ month: label, entrada, saida });
    }
    return months;
  }, [processes]);

  // ─── Processos por CGOF ──────────────────────────────────────
  const byCGOF = useMemo(() => {
    const map: Record<string, number> = {};
    processes.forEach(p => {
      const key = p.CGOF || 'Não informado';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count], i) => ({ name, count, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.count - a.count);
  }, [processes]);

  // ─── Top 10 Setores ──────────────────────────────────────
  const topSectors = useMemo(() => {
    const map: Record<string, number> = {};
    processes.forEach(p => {
      const key = p.sector || 'Não informado';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count], i) => ({ name, count, color: CHART_COLORS[i % CHART_COLORS.length] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [processes]);

  // ─── Top 10 Interessadas ────────────────────────────────────
  const topInterested = useMemo(() => {
    const map: Record<string, number> = {};
    processes.forEach(p => {
      const key = p.interested || 'Não informado';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [processes]);

  // ─── Prestação de Contas Stats ─────────────────────────────
  const pcStats = useMemo(() => {
    const total = prestacoes.length;
    const byStatus: Record<string, number> = {};
    PRESTACAO_STATUS_OPTIONS.forEach(s => { byStatus[s] = 0; });
    prestacoes.forEach(p => {
      byStatus[p.status] = (byStatus[p.status] || 0) + 1;
    });

    const byMonth: Record<string, number> = {};
    prestacoes.forEach(p => {
      if (p.month) byMonth[p.month] = (byMonth[p.month] || 0) + 1;
    });
    const topMonths = Object.entries(byMonth)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const withExit = prestacoes.filter(p => p.exit_date).length;
    const withoutExit = total - withExit;

    return { total, byStatus, topMonths, withExit, withoutExit };
  }, [prestacoes]);

  // ─── Processos urgentes recentes ────────────────────────────
  const recentUrgent = useMemo(() => {
    return processes
      .filter(p => p.urgent)
      .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      .slice(0, 5);
  }, [processes]);

  // ─── Processos vencidos ─────────────────────────────────────
  const overdueProcesses = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return processes
      .filter(p => p.deadline && new Date(p.deadline) < today)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .slice(0, 5);
  }, [processes]);

  // ─── Chart utils ─────────────────────────────────────────────
  const maxMonthly = useMemo(() => Math.max(...monthlyProcesses.map(m => Math.max(m.entrada, m.saida)), 1), [monthlyProcesses]);
  const maxSector = useMemo(() => Math.max(...topSectors.map(s => s.count), 1), [topSectors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="animate-spin text-blue-500" />
          <p className="text-slate-500 font-medium">Carregando dados do dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={26} />
            Dashboard
          </h2>
          <p className="text-slate-500 text-sm">Visão geral do sistema de controle de processos</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-400">
            Atualizado: {lastRefresh.toLocaleTimeString('pt-BR')}
          </span>
          <button onClick={loadAll} disabled={loading} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm hover:bg-slate-50 transition shadow-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      {/* ═══════════ KPI CARDS ═══════════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
        <KPICard icon={FolderOpen} label="Total Processos" value={processStats.total} color="blue" />
        <KPICard icon={Zap} label="Urgentes" value={processStats.urgent} color="red" accent />
        <KPICard icon={AlertTriangle} label="Vencidos" value={processStats.overdue} color="orange" accent={processStats.overdue > 0} />
        <KPICard icon={Clock} label="Vence em 7 dias" value={processStats.nearDeadline} color="amber" />
        <KPICard icon={CheckCircle2} label="Com Saída" value={processStats.withExitDate} color="green" />
        <KPICard icon={Timer} label="Sem Saída" value={processStats.withoutExitDate} color="slate" />
        <KPICard icon={Calendar} label="Tempo Médio" value={`${processStats.avgDays}d`} color="indigo" />
        <KPICard icon={FileText} label="Prestações" value={pcStats.total} color="purple" />
      </div>

      {/* ═══════════ ROW 1: Gráfico Mensal + CGOF ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Entradas/Saídas por Mês */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
              <TrendingUp size={16} className="text-blue-500" />
              Movimentação Mensal (12 meses)
            </h3>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500 inline-block"></span>Entradas</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span>Saídas</span>
            </div>
          </div>
          <div className="flex items-end gap-1 h-48">
            {monthlyProcesses.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full flex gap-0.5 items-end justify-center" style={{ height: '160px' }}>
                  <div
                    className="bg-blue-500 rounded-t-sm transition-all hover:bg-blue-600 relative"
                    style={{ width: '40%', height: `${Math.max((m.entrada / maxMonthly) * 100, 2)}%`, minHeight: '2px' }}
                    title={`Entradas: ${m.entrada}`}
                  >
                    {m.entrada > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">{m.entrada}</span>
                    )}
                  </div>
                  <div
                    className="bg-emerald-500 rounded-t-sm transition-all hover:bg-emerald-600 relative"
                    style={{ width: '40%', height: `${Math.max((m.saida / maxMonthly) * 100, 2)}%`, minHeight: '2px' }}
                    title={`Saídas: ${m.saida}`}
                  >
                    {m.saida > 0 && (
                      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">{m.saida}</span>
                    )}
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 font-medium leading-none mt-1 whitespace-nowrap" style={{ writingMode: monthlyProcesses.length > 8 ? 'vertical-rl' : undefined, transform: monthlyProcesses.length > 8 ? 'rotate(180deg)' : undefined }}>
                  {m.month.substring(0, 7)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CGOF Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-indigo-500" />
            Distribuição por CGOF
          </h3>
          <div className="space-y-3">
            {byCGOF.map((item) => {
              const pct = processStats.total > 0 ? ((item.count / processStats.total) * 100).toFixed(1) : '0';
              return (
                <div key={item.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-slate-600 font-medium truncate max-w-[60%]">{item.name}</span>
                    <span className="text-xs font-bold text-slate-800">{item.count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          {byCGOF.length === 0 && <p className="text-slate-400 text-xs text-center py-8">Sem dados</p>}
        </div>
      </div>

      {/* ═══════════ ROW 2: Top Setores + Top Interessadas ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Setores */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
            <Building2 size={16} className="text-cyan-500" />
            Top 10 Setores (Localização)
          </h3>
          <div className="space-y-2">
            {topSectors.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-bold w-4 text-right">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="text-xs text-slate-700 truncate max-w-[70%]" title={s.name}>{s.name}</span>
                    <span className="text-xs font-bold text-slate-700">{s.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.count / maxSector) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          {topSectors.length === 0 && <p className="text-slate-400 text-xs text-center py-8">Sem dados</p>}
        </div>

        {/* Top Interessadas */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
            <Users size={16} className="text-pink-500" />
            Top 10 Interessadas
          </h3>
          <div className="space-y-2">
            {topInterested.map((item, i) => {
              const maxInt = topInterested[0]?.count || 1;
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 font-bold w-4 text-right">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-xs text-slate-700 truncate max-w-[70%]" title={item.name}>{item.name}</span>
                      <span className="text-xs font-bold text-slate-700">{item.count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="h-full rounded-full transition-all duration-500 bg-pink-400" style={{ width: `${(item.count / maxInt) * 100}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {topInterested.length === 0 && <p className="text-slate-400 text-xs text-center py-8">Sem dados</p>}
        </div>
      </div>

      {/* ═══════════ ROW 3: Prestação de Contas ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* PC por Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
            <FileText size={16} className="text-purple-500" />
            Prestações por Status
          </h3>
          {pcStats.total > 0 ? (
            <div className="space-y-2.5">
              {Object.entries(pcStats.byStatus).filter(([, v]) => v > 0).sort(([, a], [, b]) => b - a).map(([status, count]) => {
                const pct = ((count / pcStats.total) * 100).toFixed(1);
                return (
                  <div key={status}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] || '#94a3b8' }} />
                        <span className="text-xs text-slate-600 font-medium">{status}</span>
                      </div>
                      <span className="text-xs font-bold">{count} <span className="text-[10px] text-slate-400 font-normal">({pct}%)</span></span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: STATUS_COLORS[status] || '#94a3b8' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-slate-400 text-xs text-center py-12">Nenhuma prestação cadastrada</p>}
        </div>

        {/* PC por Mês */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
            <Calendar size={16} className="text-purple-500" />
            Prestações por Mês
          </h3>
          {pcStats.topMonths.length > 0 ? (
            <div className="space-y-2.5">
              {pcStats.topMonths.map(([month, count]) => {
                const maxM = pcStats.topMonths[0][1] as number;
                return (
                  <div key={month} className="flex items-center gap-3">
                    <span className="text-xs text-purple-600 font-bold font-mono w-16">{month}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                      <div className="h-full rounded-full transition-all bg-purple-400" style={{ width: `${((count as number) / maxM) * 100}%` }} />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-purple-800">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-slate-400 text-xs text-center py-12">Sem dados</p>}
        </div>

        {/* PC Resumo */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2 mb-4">
            <BarChart3 size={16} className="text-purple-500" />
            Resumo Prestações
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Total" value={pcStats.total} color="purple" />
            <MiniStat label="Com Saída" value={pcStats.withExit} color="green" />
            <MiniStat label="Sem Saída" value={pcStats.withoutExit} color="slate" />
            <MiniStat label="Pendentes" value={pcStats.byStatus['Pendente'] || 0} color="yellow" />
            <MiniStat label="Em Análise" value={pcStats.byStatus['Em Análise'] || 0} color="blue" />
            <MiniStat label="Concluídas" value={pcStats.byStatus['Concluída'] || 0} color="emerald" />
          </div>
          <Link to="/prestacao-contas" className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-slate-100 text-xs text-purple-600 font-bold hover:text-purple-800 transition-colors">
            Ver Prestações de Contas <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ═══════════ ROW 4: Urgentes + Vencidos ═══════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Processos Urgentes Recentes */}
        <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-red-50 border-b border-red-100">
            <h3 className="font-bold text-red-800 text-sm flex items-center gap-2">
              <Zap size={16} className="text-red-500" />
              Processos Urgentes Recentes
            </h3>
            <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full">{processStats.urgent} total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentUrgent.length > 0 ? recentUrgent.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-red-50/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-800">{p.number}</span>
                    <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold uppercase">Urgente</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.interested} • {p.subject}</p>
                </div>
                <div className="text-right ml-3 shrink-0">
                  <p className="text-[10px] text-slate-400">Entrada</p>
                  <p className="text-xs font-medium text-slate-600">{toDisplayDate(p.entryDate)}</p>
                </div>
              </div>
            )) : (
              <div className="px-5 py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-green-300" />
                Nenhum processo urgente
              </div>
            )}
          </div>
        </div>

        {/* Processos Vencidos */}
        <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-orange-50 border-b border-orange-100">
            <h3 className="font-bold text-orange-800 text-sm flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" />
              Processos com Prazo Vencido
            </h3>
            <span className="text-[10px] font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">{processStats.overdue} total</span>
          </div>
          <div className="divide-y divide-slate-100">
            {overdueProcesses.length > 0 ? overdueProcesses.map(p => {
              const daysOverdue = Math.ceil((new Date().getTime() - new Date(p.deadline!).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={p.id} className="flex items-center justify-between px-5 py-3 hover:bg-orange-50/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-800">{p.number}</span>
                      <span className="text-[9px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold">{daysOverdue}d atraso</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{p.interested} • {p.sector}</p>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <p className="text-[10px] text-slate-400">Prazo</p>
                    <p className="text-xs font-medium text-red-600">{toDisplayDate(p.deadline)}</p>
                  </div>
                </div>
              );
            }) : (
              <div className="px-5 py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 size={24} className="mx-auto mb-2 text-green-300" />
                Nenhum processo vencido
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════ ROW 5: Banner Resumo ═══════════ */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <BarChart3 size={36} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Resumo Geral do Sistema</h3>
              <p className="text-blue-100 text-sm">Assessoria CGOF - Controle de Processos</p>
            </div>
          </div>
          <div className="flex gap-6 flex-wrap justify-center">
            <div className="text-center">
              <p className="text-3xl font-black">{processStats.total}</p>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Processos</p>
            </div>
            <div className="w-px bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-3xl font-black">{processStats.withExitDate}</p>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Concluídos</p>
            </div>
            <div className="w-px bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-3xl font-black">{processStats.withoutExitDate}</p>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Em Tramitação</p>
            </div>
            <div className="w-px bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-3xl font-black">{pcStats.total}</p>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Prest. Contas</p>
            </div>
            <div className="w-px bg-white/20 hidden md:block" />
            <div className="text-center">
              <p className="text-3xl font-black">{processStats.avgDays}<span className="text-lg">d</span></p>
              <p className="text-[10px] text-blue-200 uppercase font-bold tracking-wider">Tempo Médio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Componentes auxiliares ─────────────────────────────────────────
const KPICard = ({ icon: Icon, label, value, color, accent }: { icon: any; label: string; value: string | number; color: string; accent?: boolean }) => {
  const colorMap: Record<string, { bg: string; text: string; icon: string; border: string }> = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-500',   border: 'border-blue-100' },
    red:    { bg: 'bg-red-50',    text: 'text-red-700',    icon: 'text-red-500',    border: 'border-red-100' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500', border: 'border-orange-100' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'text-amber-500',  border: 'border-amber-100' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-500',  border: 'border-green-100' },
    slate:  { bg: 'bg-slate-50',  text: 'text-slate-700',  icon: 'text-slate-500',  border: 'border-slate-200' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-500', border: 'border-indigo-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500', border: 'border-purple-100' },
  };
  const c = colorMap[color] || colorMap.slate;

  return (
    <div className={`${c.bg} rounded-xl p-3 border ${c.border} transition-all hover:shadow-md`}>
      <div className="flex items-center gap-1.5 mb-2">
        <Icon size={14} className={c.icon} />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-none truncate">{label}</span>
      </div>
      <p className={`text-2xl font-black ${c.text} leading-none`}>{value}</p>
    </div>
  );
};

const MiniStat = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colorMap: Record<string, string> = {
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-100',
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };
  return (
    <div className={`rounded-lg p-3 border text-center ${colorMap[color] || colorMap.slate}`}>
      <p className="text-xl font-black leading-none">{value}</p>
      <p className="text-[10px] font-bold uppercase mt-1 opacity-70">{label}</p>
    </div>
  );
};
