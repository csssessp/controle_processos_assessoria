import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { DbService } from '../services/dbService';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Loader2, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';

export const DashboardAnalytics = () => {
  const { currentUser } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const data = await DbService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8 text-center text-red-600">
        Erro ao carregar estatísticas
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#6366f1'];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Dashboard Analítico</h1>
          <p className="text-slate-600 mt-2">Visualização de estatísticas de processos e prestações de contas</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total de Processos</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalProcessos}</p>
              </div>
              <Clock className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Processos Urgentes</p>
                <p className="text-3xl font-bold text-slate-900">{stats.processosUrgentes}</p>
              </div>
              <AlertTriangle className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Sem Data de Saída</p>
                <p className="text-3xl font-bold text-slate-900">{stats.processosSemdataSaida}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Sem Localização</p>
                <p className="text-3xl font-bold text-slate-900">{stats.processosSemLocalizacao}</p>
              </div>
              <MapPin className="w-12 h-12 text-red-200" />
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Processos por Origem */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Processos por Origem</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.processosPorOrigem}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="origem" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Entrada últimos 7 dias */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Entrada - Últimos 7 Dias</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.entradaChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="quantidade" stroke="#10b981" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Saída últimos 7 dias */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Saída - Últimos 7 Dias</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.saidaChart}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="quantidade" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Prestações Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Prestações por Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Regular', value: stats.prestacaoRegulares },
                    { name: 'Irregular', value: stats.prestacaoIrregulares }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Localizações */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Localizações Mais Enviadas</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.localizacoesMaisEnviadas} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="localizacao" type="category" width={150} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prestações por Interessado */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Prestações por Interessado e Mês</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-slate-900 sticky left-0 bg-slate-50">Interessado</th>
                    {Array.from(
                      new Set(
                        Object.values(stats.prestacaoPorInteressado)
                          .flatMap(months => Object.keys(months))
                      )
                    )
                      .sort()
                      .map(mes => (
                        <th key={mes} className="px-4 py-2 text-center font-semibold text-slate-900 whitespace-nowrap">
                          {mes}
                        </th>
                      ))}
                    <th className="px-4 py-2 text-center font-semibold text-slate-900 bg-blue-50 border-l">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.prestacaoPorInteressado)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([interessado, months]) => {
                      const total = Object.values(months).reduce((sum, val) => sum + (val || 0), 0);
                      return (
                        <tr key={interessado} className="border-b hover:bg-slate-50">
                          <td className="px-4 py-2 font-medium text-slate-900 sticky left-0 bg-white hover:bg-slate-50">{interessado}</td>
                          {Array.from(
                            new Set(
                              Object.values(stats.prestacaoPorInteressado)
                                .flatMap(m => Object.keys(m))
                            )
                          )
                            .sort()
                            .map(mes => {
                              const value = months[mes] || 0;
                              const hasData = value > 0;
                              return (
                                <td 
                                  key={`${interessado}-${mes}`} 
                                  className={`px-4 py-2 text-center font-medium whitespace-nowrap ${
                                    hasData 
                                      ? 'bg-green-100 text-green-800 border border-green-200' 
                                      : 'bg-gray-50 text-gray-400'
                                  }`}
                                >
                                  {hasData ? value : '-'}
                                </td>
                              );
                            })}
                          <td className="px-4 py-2 text-center font-bold text-slate-900 bg-blue-50 border-l border-blue-200">
                            {total}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
