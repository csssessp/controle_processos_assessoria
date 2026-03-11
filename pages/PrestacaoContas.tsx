import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { PrestacaoConta, PrestacaoContaHistorico, PRESTACAO_STATUS_OPTIONS, UserRole } from '../types';
import { toDisplayDate, toDisplayDateTime, toServerDateOnly, toServerTimestampNoonLocal } from './ProcessManager';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DbService } from '../services/dbService';
import { 
  Search, Plus, Edit, Trash2, Download, X, Filter, ChevronLeft, ChevronRight,
  Loader2, Lock, AlertCircle, FileText, Activity, ZoomIn, ZoomOut, ExternalLink
} from 'lucide-react';

export const PrestacaoContas = () => {
  const { 
    currentUser, fetchPrestacaoContas, savePrestacaoConta, deletePrestacaoConta, fetchPrestacaoContaHistorico
  } = useApp();

  const [prestacoes, setPrestacoes] = useState<PrestacaoConta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Filtros
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [tableFontSize, setTableFontSize] = useState(10.5);

  // Modal de edição/criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrestacao, setEditingPrestacao] = useState<PrestacaoConta | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Modal de histórico
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<PrestacaoContaHistorico[]>([]);
  const [selectedPrestacaoNumber, setSelectedPrestacaoNumber] = useState('');

  // Modal de senha para exclusão
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [selectedDeleteId, setSelectedDeleteId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    loadData();
  }, [debouncedSearchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchPrestacaoContas(debouncedSearchTerm || undefined);
      setPrestacoes(data);
    } catch (err) {
      console.error('Erro ao carregar prestação de contas:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPrestacoes = useMemo(() => {
    let result = prestacoes;
    if (filterStatus) result = result.filter(p => p.status === filterStatus);
    if (filterMonth) result = result.filter(p => p.month === filterMonth);
    return result;
  }, [prestacoes, filterStatus, filterMonth]);

  const availableMonths = useMemo(() => {
    const months = new Set(prestacoes.map(p => p.month).filter(Boolean));
    return Array.from(months).sort().reverse();
  }, [prestacoes]);

  const paginatedPrestacoes = useMemo(() => {
    const from = (currentPage - 1) * itemsPerPage;
    return filteredPrestacoes.slice(from, from + itemsPerPage);
  }, [filteredPrestacoes, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredPrestacoes.length / itemsPerPage);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      if (startPage === 1) endPage = Math.min(totalPages, maxPagesToShow);
      if (endPage === totalPages) startPage = Math.max(1, totalPages - maxPagesToShow + 1);
      for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    }
    return pageNumbers;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Em Análise': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Aprovada': return 'bg-green-100 text-green-800 border-green-200';
      case 'Reprovada': return 'bg-red-100 text-red-800 border-red-200';
      case 'Devolvida': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Concluída': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleOpenModal = (prestacao?: PrestacaoConta) => {
    setEditingPrestacao(prestacao || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrestacao(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current || !currentUser) return;
    setSaving(true);
    const formData = new FormData(formRef.current);
    const now = new Date().toISOString();

    const data: PrestacaoConta = {
      id: editingPrestacao?.id || crypto.randomUUID(),
      process_id: editingPrestacao?.process_id || '',
      process_number: formData.get('process_number') as string,
      month: formData.get('month') as string,
      status: formData.get('status') as string,
      motivo: (formData.get('motivo') as string) || undefined,
      observations: (formData.get('observations') as string) || undefined,
      entry_date: toServerTimestampNoonLocal(formData.get('entry_date') as string),
      exit_date: toServerTimestampNoonLocal(formData.get('exit_date') as string),
      link: (formData.get('link') as string) || undefined,
      interested: (formData.get('interested') as string) || undefined,
      created_by: editingPrestacao?.created_by || currentUser.id,
      updated_by: currentUser.id,
      created_at: editingPrestacao?.created_at || now,
      updated_at: now,
      version_number: editingPrestacao?.version_number || 1
    };

    try {
      await savePrestacaoConta(data);
      alert(editingPrestacao ? 'Atualizado com sucesso!' : 'Cadastrado com sucesso!');
      handleCloseModal();
      loadData();
    } catch (error: any) {
      alert('Erro ao salvar: ' + (error?.message || 'Verifique os dados.'));
    } finally {
      setSaving(false);
    }
  };

  const handleOpenHistory = async (prestacao: PrestacaoConta) => {
    setSelectedPrestacaoNumber(prestacao.process_number);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const history = await fetchPrestacaoContaHistorico(prestacao.id);
      setSelectedHistory(history);
    } catch (e) {
      console.error('Erro ao carregar histórico:', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRequestDelete = (id: string) => {
    setSelectedDeleteId(id);
    setConfirmPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsVerifying(true);
    setPasswordError('');
    try {
      const isValid = await DbService.verifyPassword(currentUser.id, confirmPassword);
      if (!isValid) { setPasswordError('Senha incorreta.'); setIsVerifying(false); return; }
      await deletePrestacaoConta(selectedDeleteId);
      setIsPasswordModalOpen(false);
      alert('Prestação de contas excluída com sucesso!');
      loadData();
    } catch (err: any) {
      setPasswordError('Erro: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsVerifying(false);
    }
  };

  const exportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredPrestacoes.map(p => ({
      'Nº Processo': p.process_number,
      'Interessada': p.interested || '',
      'Mês': p.month,
      'Status': p.status,
      'Motivo': p.motivo || '',
      'Data Entrada': toDisplayDate(p.entry_date),
      'Data Saída': toDisplayDate(p.exit_date),
      'Link': p.link || ''
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prestação de Contas");
    XLSX.writeFile(workbook, `Prestacao_Contas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Prestação de Contas - Relatório', 14, 15);
    autoTable(doc, {
      startY: 20,
      head: [['Nº Processo', 'Interessada', 'Mês', 'Status', 'Motivo', 'Entrada', 'Saída']],
      body: filteredPrestacoes.map(p => [
        p.process_number,
        p.interested || '-',
        p.month,
        p.status,
        p.motivo || '-',
        toDisplayDate(p.entry_date),
        toDisplayDate(p.exit_date)
      ]),
      styles: { fontSize: 7 },
      columnStyles: { 1: { cellWidth: 35 } }
    });
    doc.save('Prestacao_Contas_Relatorio.pdf');
  };

  const changeFontSize = (delta: number) => {
    setTableFontSize(prev => Math.min(Math.max(prev + delta, 9), 16));
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const formatMonth = (month: string | undefined | null): string => {
    if (!month) return '-';
    // If already mm/aaaa, return as-is
    if (/^\d{2}\/\d{4}$/.test(month)) return month;
    // If yyyy-mm, convert to mm/aaaa
    if (/^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split('-');
      return `${m}/${y}`;
    }
    return month;
  };

  const getCurrentMonthDefault = () => {
    const now = new Date();
    return `${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  };

  return (
    <div className="space-y-4 relative min-h-[calc(100vh-100px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-purple-600" size={24} />
            Prestação de Contas
          </h2>
          <p className="text-slate-500 text-sm">Controle de prestações de contas vinculadas aos processos</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full xl:w-auto items-center">
          {/* Zoom */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-1 shadow-sm mr-2">
            <button onClick={() => changeFontSize(-0.5)} className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600" title="Diminuir Fonte"><ZoomOut size={16}/></button>
            <span className="text-[10px] font-bold text-slate-400 px-1 w-8 text-center">{tableFontSize.toFixed(1)}</span>
            <button onClick={() => changeFontSize(0.5)} className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600" title="Aumentar Fonte"><ZoomIn size={16}/></button>
          </div>
          {isAdmin && (
            <>
              <button onClick={exportExcel} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm hover:bg-slate-50 transition shadow-sm">
                <Download size={16} /> Excel
              </button>
              <button onClick={exportPDF} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded text-sm hover:bg-slate-50 transition shadow-sm">
                <Download size={16} /> PDF
              </button>
            </>
          )}
          <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition ml-auto sm:ml-0 shadow-sm font-medium">
            <Plus size={18} /> Novo Registro
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
        <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Nº processo, interessada, observações..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded text-sm outline-none" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded bg-white text-sm outline-none">
            <option value="">Todos os Status</option>
            {PRESTACAO_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <select value={filterMonth} onChange={(e) => { setFilterMonth(e.target.value); setCurrentPage(1); }} className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded bg-white text-sm outline-none">
            <option value="">Todos os Meses</option>
            {availableMonths.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex gap-1.5 justify-end">
          <button onClick={() => { setSearchTerm(''); setFilterStatus(''); setFilterMonth(''); setCurrentPage(1); }} className="px-2 text-[10px] font-bold text-purple-600 hover:underline uppercase tracking-tighter">Limpar</button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
            </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase bg-purple-50 border-b border-purple-200 sticky top-0 z-10 font-bold">
              <tr>
                <th className="px-3 py-3">Nº Processo</th>
                <th className="px-3 py-3">Interessada</th>
                <th className="px-3 py-3">Mês</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Motivo</th>
                <th className="px-3 py-3">Entrada</th>
                <th className="px-3 py-3">Saída</th>
                <th className="px-3 py-3">Link</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedPrestacoes.map(pc => {
                const dynamicRowStyle = { fontSize: `${tableFontSize}px` };
                return (
                  <tr key={pc.id} className="hover:bg-purple-50/30 transition-colors group">
                    <td style={dynamicRowStyle} className="px-3 py-2 font-mono text-slate-900 whitespace-nowrap font-bold">
                      <button onClick={() => handleOpenHistory(pc)} className="hover:underline text-purple-700">{pc.process_number}</button>
                    </td>
                    <td style={dynamicRowStyle} className="px-3 py-2 text-slate-700 leading-tight" title={pc.interested}>{pc.interested || '-'}</td>
                    <td style={dynamicRowStyle} className="px-3 py-2 text-slate-600 whitespace-nowrap font-medium">{formatMonth(pc.month)}</td>
                    <td style={dynamicRowStyle} className="px-3 py-2 whitespace-nowrap">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${getStatusColor(pc.status)}`}>{pc.status}</span>
                    </td>
                    <td style={dynamicRowStyle} className="px-3 py-2 text-slate-600 leading-tight" title={pc.motivo}>{pc.motivo || <span className="text-slate-300">-</span>}</td>
                    <td style={dynamicRowStyle} className="px-3 py-2 text-slate-600 whitespace-nowrap">{toDisplayDate(pc.entry_date)}</td>
                    <td style={dynamicRowStyle} className="px-3 py-2 text-slate-600 italic whitespace-nowrap">
                      {pc.exit_date ? toDisplayDate(pc.exit_date) : <span className="text-slate-300">Em curso</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {pc.link ? (
                        <a href={pc.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors border border-blue-200" title="Abrir link">
                          <ExternalLink size={14} />
                          <span className="text-[10px] font-medium">Link</span>
                        </a>
                      ) : <span className="text-slate-300 text-[10px]">-</span>}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleOpenHistory(pc)} className="p-1 text-slate-600 hover:text-purple-600 rounded" title="Ver Histórico"><Activity size={16} /></button>
                        <button onClick={() => handleOpenModal(pc)} className="p-1 text-slate-600 hover:text-purple-600 rounded" title="Editar"><Edit size={16} /></button>
                        <button onClick={() => handleRequestDelete(pc.id)} className="p-1 text-slate-400 hover:text-red-600 rounded" title="Excluir"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && filteredPrestacoes.length === 0 && (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <FileText size={48} className="mb-3 opacity-10" />
              <p>Nenhuma prestação de contas encontrada.</p>
              <p className="text-xs mt-1">Marque processos como "Prestação de Contas" ao criar ou editar um registro na tela de Processos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Paginação */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm gap-4 mt-auto">
        <div className="text-xs text-slate-500">Página {currentPage} de {totalPages} ({filteredPrestacoes.length} registros)</div>
        <div className="flex items-center gap-3">
          <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="border border-slate-300 rounded px-2 py-1 text-xs outline-none">
            {[10, 20, 50, 100, 500].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <div className="flex items-center rounded-md border border-slate-300 divide-x divide-slate-300 overflow-hidden">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-1.5 hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={14} /></button>
            <div className="flex">
              {getPageNumbers().map(pageNum => (
                <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`px-3 py-1.5 text-xs font-medium ${currentPage === pageNum ? 'bg-purple-50 text-purple-600' : 'bg-white hover:bg-slate-50'}`}>{pageNum}</button>
              ))}
            </div>
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="p-1.5 hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      {/* Modal de Histórico */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b bg-purple-50">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Activity size={20} className="text-purple-600"/>Histórico de Alterações</h3>
                <p className="text-xs font-mono text-slate-600 mt-1">Processo: {selectedPrestacaoNumber}</p>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-1 hover:bg-slate-200 rounded"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              {historyLoading ? (
                <div className="flex flex-col items-center h-48 justify-center gap-3"><Loader2 size={32} className="animate-spin text-purple-500" /></div>
              ) : selectedHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <Activity size={40} className="mx-auto mb-3 opacity-20" />
                  <p>Nenhum histórico de alterações encontrado.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-purple-100 ml-4 space-y-6">
                  {selectedHistory.map((item, idx) => (
                    <div key={item.id} className="relative pl-8">
                      <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ${idx === 0 ? 'bg-purple-600 border-purple-600 shadow-lg shadow-purple-400' : 'bg-white border-purple-200'}`}></div>
                      <div className={`p-4 rounded-xl border-2 shadow-sm ${idx === 0 ? 'bg-purple-50 border-purple-300' : 'bg-white border-slate-200'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`text-[10px] uppercase font-bold ${idx === 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                              Versão {item.version_number}
                            </span>
                            {item.descricao && <p className="text-xs text-slate-600 mt-1">{item.descricao}</p>}
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">{toDisplayDateTime(item.data_alteracao)}</div>
                            <div className="text-[10px] text-slate-500 font-medium mt-0.5">por {item.nome_usuario}</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t text-[11px]" style={{borderColor: idx === 0 ? '#e9d5ff' : '#f1f5f9'}}>
                          <div>
                            <span className="text-slate-400">Status:</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${getStatusColor(item.status_anterior)}`}>{item.status_anterior || '-'}</span>
                              <span className="text-slate-400">→</span>
                              <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold ${getStatusColor(item.status_novo)}`}>{item.status_novo || '-'}</span>
                            </div>
                          </div>
                          {(item.motivo_anterior || item.motivo_novo) && (
                            <div>
                              <span className="text-slate-400">Motivo:</span>
                              <div className="text-slate-600 mt-0.5">
                                <span className="line-through text-slate-400">{item.motivo_anterior || '-'}</span> → {item.motivo_novo || '-'}
                              </div>
                            </div>
                          )}
                        </div>
                        {item.observacoes && (
                          <div className="mt-2 pt-2 border-t border-dashed border-slate-100 text-[10px] italic text-slate-500">
                            Obs: {item.observacoes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-white flex justify-end">
              <button onClick={() => setIsHistoryModalOpen(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-700">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Criação/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
            <div className="flex items-center justify-between p-4 border-b bg-purple-50 sticky top-0 z-20">
              <h3 className="text-lg font-bold text-slate-800">{editingPrestacao ? 'Editar Prestação de Contas' : 'Nova Prestação de Contas'}</h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-200 rounded"><X size={24} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">Nº do Processo <span className="text-red-600">*</span></label>
                  <input required name="process_number" type="text" defaultValue={editingPrestacao?.process_number} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm font-mono placeholder-slate-300 focus:ring-2 focus:ring-purple-100" placeholder="000.000/0000" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">Interessada</label>
                  <input name="interested" type="text" defaultValue={editingPrestacao?.interested} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm placeholder-slate-300 focus:ring-2 focus:ring-purple-100" placeholder="Quem solicita ou órgão" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">Mês de Referência <span className="text-red-600">*</span></label>
                  <input required name="month" type="text" defaultValue={editingPrestacao?.month || getCurrentMonthDefault()} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm placeholder-slate-300 focus:ring-2 focus:ring-purple-100" placeholder="MM/AAAA" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">Status <span className="text-red-600">*</span></label>
                  <select name="status" defaultValue={editingPrestacao?.status || 'Pendente'} required className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-100">
                    {PRESTACAO_STATUS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">Motivo</label>
                <input name="motivo" type="text" defaultValue={editingPrestacao?.motivo} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm placeholder-slate-300 focus:ring-2 focus:ring-purple-100" placeholder="Motivo da prestação de contas" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">Data de Entrada</label>
                  <input name="entry_date" type="date" defaultValue={toServerDateOnly(editingPrestacao?.entry_date)} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-100" />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">Data de Saída</label>
                  <input name="exit_date" type="date" defaultValue={toServerDateOnly(editingPrestacao?.exit_date)} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-100" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">Link</label>
                <input name="link" type="url" defaultValue={editingPrestacao?.link || ''} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-100" placeholder="https://exemplo.com/documento" />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">Observações</label>
                <textarea name="observations" rows={3} defaultValue={editingPrestacao?.observations} className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-purple-100" placeholder="Informações adicionais..."></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-purple-600 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-md hover:bg-purple-700 transition-colors">{saving && <Loader2 size={16} className="animate-spin" />}Gravar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Senha para Exclusão */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
              <Trash2 className="text-red-600" size={24} />
              <h3 className="font-bold text-red-900">Excluir Prestação de Contas</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="ml-auto text-red-400 hover:text-red-700"><X size={20} /></button>
            </div>
            <form onSubmit={handleConfirmDelete} className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">Confirme sua senha para excluir esta prestação de contas:</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }} className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none" placeholder="Senha de acesso" required autoFocus />
              </div>
              {passwordError && <div className="text-red-600 text-xs flex items-center gap-1 font-medium"><AlertCircle size={12}/>{passwordError}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium border border-slate-200">Cancelar</button>
                <button type="submit" disabled={isVerifying || !confirmPassword} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2 hover:bg-red-700 shadow-sm">{isVerifying ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
