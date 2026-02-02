import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { PrestacaoContaQueryParams, UserRole } from '../types';
import { 
  Search, Plus, Edit, Trash2, AlertTriangle, 
  X, CheckSquare, Square, Filter, ChevronLeft, ChevronRight, 
  Loader2, Lock, AlertCircle, ExternalLink, History, ZoomIn, ZoomOut
} from 'lucide-react';
import { DbService } from '../services/dbService';

const STORAGE_KEY_FILTERS = 'prestacao_contas_filters';

const getInitialState = <T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed[key] !== undefined ? parsed[key] : defaultValue;
    }
  } catch (e) {}
  return defaultValue;
};

export const PrestacaoContas = () => {
  const { currentUser } = useApp();
  
  const [prestacoes, setPrestacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [processosPrestacao, setProcessosPrestacao] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrestacao, setEditingPrestacao] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState(false);
  const [selectedIdToDelete, setSelectedIdToDelete] = useState<string | null>(null);
  
  const [isHistoricoModalOpen, setIsHistoricoModalOpen] = useState(false);
  const [historicoData, setHistoricoData] = useState<any[]>([]);
  const [historicoLoading, setHistoricoLoading] = useState(false);
  const [currentProcessNumberForFluxo, setCurrentProcessNumberForFluxo] = useState<string | null>(null);
  
  const [isNovoFluxoModalOpen, setIsNovoFluxoModalOpen] = useState(false);
  const [novoFluxoData, setNovoFluxoData] = useState({
    month: '',
    status: 'REGULAR',
    motivo: '',
    observations: '',
    entryDate: '',
    exitDate: ''
  });
  const [novoFluxoSaving, setNovoFluxoSaving] = useState(false);
  
  const [editingFluxoId, setEditingFluxoId] = useState<string | null>(null);
  const [isEditFluxoModalOpen, setIsEditFluxoModalOpen] = useState(false);
  const [editFluxoData, setEditFluxoData] = useState({
    month: '',
    status: 'REGULAR',
    motivo: '',
    observations: '',
    entryDate: '',
    exitDate: ''
  });
  const [editFluxoSaving, setEditFluxoSaving] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState(() => getInitialState('searchTerm', ''));
  const [filterStatus, setFilterStatus] = useState(() => getInitialState('filterStatus', ''));
  const [filterMonthStart, setFilterMonthStart] = useState(() => getInitialState('filterMonthStart', ''));
  const [filterMonthEnd, setFilterMonthEnd] = useState(() => getInitialState('filterMonthEnd', ''));
  const [sortBy, setSortBy] = useState<'processNumber' | 'month' | 'status' | 'updatedAt' | 'entryDate' | 'interested'>(() => getInitialState('sortBy', 'month'));
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => getInitialState('sortOrder', 'desc'));
  const [tableFontSize, setTableFontSize] = useState(() => getInitialState('tableFontSize', 14));
  const [itemsPerPage, setItemsPerPage] = useState(() => getInitialState('itemsPerPage', 20));
  const [currentPage, setCurrentPage] = useState(() => getInitialState('currentPage', 1));
  
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const formRef = useRef<HTMLFormElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stateToSave = {
      searchTerm, filterStatus, filterMonthStart, filterMonthEnd, sortBy, sortOrder, itemsPerPage, currentPage, tableFontSize
    };
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(stateToSave));
  }, [searchTerm, filterStatus, filterMonthStart, filterMonthEnd, sortBy, sortOrder, itemsPerPage, currentPage, tableFontSize]);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedSearchTerm(searchTerm); }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const getCurrentParams = useCallback(() => ({
    page: currentPage,
    itemsPerPage: itemsPerPage,
    searchTerm: debouncedSearchTerm,
    filters: {
      status: filterStatus || undefined,
      monthStart: filterMonthStart || undefined,
      monthEnd: filterMonthEnd || undefined,
    },
    sortBy: {
      field: sortBy,
      order: sortOrder
    }
  }), [currentPage, itemsPerPage, debouncedSearchTerm, filterStatus, filterMonthStart, filterMonthEnd, sortBy, sortOrder]);

  const fetchPrestacoes = useCallback(async () => {
    setLoading(true);
    try {
      const params = getCurrentParams();
      const result = await DbService.getPrestacoes(params);
      setPrestacoes(result.data);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Erro ao buscar prestações:', error);
      alert('Erro ao carregar prestações de contas');
    } finally {
      setLoading(false);
    }
  }, [getCurrentParams]);

  useEffect(() => {
    fetchPrestacoes();
  }, [fetchPrestacoes]);

  useEffect(() => {
    const loadProcessosPrestacao = async () => {
      try {
        const processos = await DbService.getProcessesPrestacaoConta();
        setProcessosPrestacao(processos);
      } catch (error) {
        console.error('Erro ao buscar processos de prestação:', error);
      }
    };
    loadProcessosPrestacao();
  }, []);

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<any>>, value: any) => {
    setter(value);
    setCurrentPage(1);
  };

  const changeFontSize = (delta: number) => {
    setTableFontSize(prev => Math.min(Math.max(prev + delta, 9), 16));
  };

  const handleSort = (field: 'entryDate' | 'processNumber' | 'interested' | 'month' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  const getSortIndicator = (field: 'entryDate' | 'processNumber' | 'interested' | 'month' | 'status') => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  };

  const handleSelectProcesso = (processoId: string) => {
    const processo = processosPrestacao.find(p => p.id === processoId);
    if (processo && formRef.current) {
      const form = formRef.current;
      const processNumberField = form.querySelector('input[name="processNumber"]') as HTMLInputElement;
      const interestedField = form.querySelector('input[name="interested"]') as HTMLInputElement;
      const entryDateField = form.querySelector('input[name="entryDate"]') as HTMLInputElement;
      const exitDateField = form.querySelector('input[name="exitDate"]') as HTMLInputElement;
      
      if (processNumberField) {
        processNumberField.value = processo.number || '';
      }
      
      if (interestedField) {
        interestedField.value = processo.interested || '';
      }
      
      if (entryDateField && processo.entryDate) {
        entryDateField.value = processo.entryDate.slice(0, 10);
      }

      if (exitDateField) {
        // Se houver processDate, usar como exitDate padrão
        if (processo.processDate) {
          exitDateField.value = processo.processDate.slice(0, 10);
        }
      }
    }
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

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

  const handleOpenModal = (prestacao?: any) => {
    setIsModalOpen(true);
    setEditingPrestacao(prestacao || null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrestacao(null);
  };

  const handleOpenHistorico = async (prestacaoId: string) => {
    setIsHistoricoModalOpen(true);
    setHistoricoLoading(true);
    try {
      const historico = await DbService.getHistoricoPrestacao(prestacaoId);
      setHistoricoData(historico);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      alert('Erro ao carregar histórico');
    } finally {
      setHistoricoLoading(false);
    }
  };

  const handleCloseHistorico = () => {
    setIsHistoricoModalOpen(false);
    setHistoricoData([]);
  };

  // Agrupar prestações por número - mostrar apenas a mais recente de cada grupo
  const groupedPrestacoes = useMemo(() => {
    const grouped: { [key: string]: any[] } = {};
    
    (prestacoes || []).forEach(prestacao => {
      if (!grouped[prestacao.processNumber]) {
        grouped[prestacao.processNumber] = [];
      }
      grouped[prestacao.processNumber].push(prestacao);
    });

    // Para cada grupo, manter apenas a mais recente (ordenada por month DESC)
    return Object.values(grouped).map(group => {
      return group.sort((a, b) => {
        const monthA = new Date(a.month + '-01');
        const monthB = new Date(b.month + '-01');
        return monthB.getTime() - monthA.getTime();
      })[0];
    });
  }, [prestacoes]);

  const handleNumberClick = async (processNumber: string) => {
    // Buscar histórico da tabela prestacoes_contas_historico
    setHistoricoLoading(true);
    try {
      const historico = await DbService.getHistoricoByProcessNumber(processNumber);
      setHistoricoData(historico);
      setCurrentProcessNumberForFluxo(processNumber);
      setIsHistoricoModalOpen(true);
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      alert('Erro ao carregar histórico do processo');
    } finally {
      setHistoricoLoading(false);
    }
  };

  const handleOpenNovoFluxoModal = () => {
    setIsNovoFluxoModalOpen(true);
  };

  const handleCloseNovoFluxoModal = () => {
    setIsNovoFluxoModalOpen(false);
    setNovoFluxoData({
      month: '',
      status: 'REGULAR',
      motivo: '',
      observations: '',
      entryDate: '',
      exitDate: ''
    });
  };

  const handleSaveNovoFluxo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProcessNumberForFluxo || !currentUser) return;

    if (!novoFluxoData.month || !novoFluxoData.entryDate) {
      alert('Preencha mês e data de entrada');
      return;
    }

    if (novoFluxoData.status === 'IRREGULAR' && !novoFluxoData.motivo) {
      alert('Informe o motivo da irregularidade');
      return;
    }

    setNovoFluxoSaving(true);
    try {
      const now = new Date().toISOString();
      const newPrestacao: any = {
        processNumber: currentProcessNumberForFluxo,
        month: novoFluxoData.month,
        status: novoFluxoData.status,
        motivo: novoFluxoData.status === 'IRREGULAR' ? novoFluxoData.motivo : undefined,
        observations: novoFluxoData.observations,
        entryDate: novoFluxoData.entryDate,
        exitDate: novoFluxoData.exitDate || null,
        createdBy: currentUser.id,
        createdAt: now,
        updatedBy: currentUser.id,
        updatedAt: now
      };

      await DbService.savePrestacao(newPrestacao, currentUser);
      alert('Novo fluxo adicionado com sucesso!');
      handleCloseNovoFluxoModal();
      
      // Recarregar histórico
      const historico = await DbService.getHistoricoByProcessNumber(currentProcessNumberForFluxo);
      setHistoricoData(historico);
      
      // Recarregar lista de prestações
      fetchPrestacoes();
    } catch (error: any) {
      alert('Erro ao salvar: ' + (error?.message || 'Tente novamente'));
    } finally {
      setNovoFluxoSaving(false);
    }
  };

  const handleOpenEditFluxoModal = (fluxo: any) => {
    setEditingFluxoId(fluxo.prestacaoId);
    setEditFluxoData({
      month: fluxo.mes || '',
      status: fluxo.statusNovo || 'REGULAR',
      motivo: fluxo.motivoNovo || '',
      observations: fluxo.observacoes || '',
      entryDate: fluxo.dataEntrada ? fluxo.dataEntrada.split('T')[0] : '',
      exitDate: fluxo.dataSaida ? fluxo.dataSaida.split('T')[0] : ''
    });
    setIsEditFluxoModalOpen(true);
  };

  const handleCloseEditFluxoModal = () => {
    setIsEditFluxoModalOpen(false);
    setEditingFluxoId(null);
    setEditFluxoData({
      month: '',
      status: 'REGULAR',
      motivo: '',
      observations: '',
      entryDate: '',
      exitDate: ''
    });
  };

  const handleSaveEditFluxo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFluxoId || !currentProcessNumberForFluxo || !currentUser) return;

    if (!editFluxoData.month || !editFluxoData.entryDate) {
      alert('Preencha mês e data de entrada');
      return;
    }

    if (editFluxoData.status === 'IRREGULAR' && !editFluxoData.motivo) {
      alert('Informe o motivo da irregularidade');
      return;
    }

    setEditFluxoSaving(true);
    try {
      const now = new Date().toISOString();
      const updatedPrestacao: any = {
        id: editingFluxoId,
        processNumber: currentProcessNumberForFluxo,
        month: editFluxoData.month,
        status: editFluxoData.status,
        motivo: editFluxoData.status === 'IRREGULAR' ? editFluxoData.motivo : undefined,
        observations: editFluxoData.observations,
        entryDate: editFluxoData.entryDate,
        exitDate: editFluxoData.exitDate || null,
        updatedBy: currentUser.id,
        updatedAt: now
      };

      await DbService.savePrestacao(updatedPrestacao, currentUser);
      alert('Fluxo atualizado com sucesso!');
      handleCloseEditFluxoModal();
      
      // Recarregar histórico
      const historico = await DbService.getHistoricoByProcessNumber(currentProcessNumberForFluxo);
      setHistoricoData(historico);
      
      // Recarregar lista de prestações
      fetchPrestacoes();
    } catch (error: any) {
      alert('Erro ao atualizar: ' + (error?.message || 'Tente novamente'));
    } finally {
      setEditFluxoSaving(false);
    }
  };

  const handleDeleteFluxo = async (historicoId: string) => {
    if (!currentUser) return;

    try {
      await DbService.deleteHistoricoEntry(historicoId, currentUser);
      alert('Fluxo excluído com sucesso!');
      
      // Recarregar histórico
      if (currentProcessNumberForFluxo) {
        const historico = await DbService.getHistoricoByProcessNumber(currentProcessNumberForFluxo);
        setHistoricoData(historico);
      }
      
      // Recarregar lista de prestações
      fetchPrestacoes();
    } catch (error: any) {
      alert('Erro ao excluir: ' + (error?.message || 'Tente novamente'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current || !currentUser) return;

    setSaving(true);
    const formData = new FormData(formRef.current);
    const processoSelecionado = formData.get('processoSelecionado') as string;
    const processNumber = formData.get('processNumber') as string;
    const interested = formData.get('interested') as string;
    const month = formData.get('month') as string;
    const status = formData.get('status') as string;
    const motivo = formData.get('motivo') as string;
    const observations = formData.get('observations') as string;
    const entryDate = formData.get('entryDate') as string;
    const exitDate = formData.get('exitDate') as string;
    const link = formData.get('link') as string;

    if (!processNumber || !month || !status || !entryDate) {
      alert('Preencha todos os campos obrigatórios');
      setSaving(false);
      return;
    }

    if (status === 'IRREGULAR' && !motivo) {
      alert('Informe o motivo da irregularidade');
      setSaving(false);
      return;
    }

    const now = new Date().toISOString();
    const newPrestacao: any = {
      processNumber,
      interested,
      month,
      status,
      motivo: status === 'IRREGULAR' ? motivo : undefined,
      observations,
      entryDate,
      exitDate: exitDate || null,
      link: link || null,
      processId: processoSelecionado || undefined,
      updatedBy: currentUser.id,
      updatedAt: now
    };

    // Se estiver editando, incluir id, createdBy e createdAt
    if (editingPrestacao) {
      newPrestacao.id = editingPrestacao.id;
      newPrestacao.createdBy = editingPrestacao.createdBy;
      newPrestacao.createdAt = editingPrestacao.createdAt;
    } else {
      // Se for novo, NÃO incluir id - deixar savePrestacao gerar
      newPrestacao.createdBy = currentUser.id;
      newPrestacao.createdAt = now;
    }

    try {
      await DbService.savePrestacao(newPrestacao, currentUser);
      alert(editingPrestacao ? 'Atualizado com sucesso!' : 'Cadastrado com sucesso!');
      handleCloseModal();
      fetchPrestacoes();
    } catch (error: any) {
      alert('Erro ao salvar: ' + (error?.message || 'Tente novamente'));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPasswordDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedIdToDelete) return;

    setIsVerifyingPassword(true);
    setPasswordError('');

    try {
      const isValid = await DbService.verifyPassword(currentUser.id, confirmPassword);
      if (!isValid) {
        setPasswordError('Senha incorreta.');
        setIsVerifyingPassword(false);
        return;
      }

      await DbService.deletePrestacao(selectedIdToDelete, currentUser);
      setIsPasswordModalOpen(false);
      setConfirmPassword('');
      setSelectedIdToDelete(null);
      alert('Prestação de contas excluída com sucesso!');
      fetchPrestacoes();
    } catch (err: any) {
      setPasswordError('Erro ao excluir: ' + (err?.message || 'Tente novamente'));
    } finally {
      setIsVerifyingPassword(false);
    }
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${monthNames[parseInt(monthNum)]}/${year}`;
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-';
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-4 relative min-h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Prestações de Contas</h2>
          <p className="text-slate-500 text-sm">Controle de processos de prestação de contas com status regular ou irregular</p>
        </div>
        <div className="flex items-center gap-3 ml-auto sm:ml-0">
          <div className="flex items-center gap-1 bg-white border border-slate-300 rounded p-1 shadow-sm">
            <button 
              onClick={() => changeFontSize(-0.5)} 
              className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600"
              title="Diminuir Fonte"
            >
              <ZoomOut size={16}/>
            </button>
            <span className="text-[10px] font-bold text-slate-400 px-1 w-8 text-center">
              {tableFontSize.toFixed(1)}
            </span>
            <button 
              onClick={() => changeFontSize(0.5)} 
              className="p-1 hover:bg-slate-100 rounded transition-colors text-slate-600"
              title="Aumentar Fonte"
            >
              <ZoomIn size={16}/>
            </button>
          </div>
          <button 
            onClick={() => handleOpenModal()} 
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded hover:bg-blue-600 transition shadow-sm font-medium"
          >
            <Plus size={18} /> Nova Prestação
          </button>
        </div>
      </div>

      <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-center">
        <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Número do processo..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded text-sm outline-none" 
            value={searchTerm} 
            onChange={(e) => handleFilterChange(setSearchTerm, e.target.value)} 
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <select 
            value={filterStatus} 
            onChange={(e) => handleFilterChange(setFilterStatus, e.target.value)} 
            className="w-full pl-8 pr-8 py-2 border border-slate-300 rounded bg-white text-sm outline-none"
          >
            <option value="">Todos Status</option>
            <option value="REGULAR">Regular</option>
            <option value="IRREGULAR">Irregular</option>
          </select>
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="month" 
            value={filterMonthStart} 
            onChange={(e) => handleFilterChange(setFilterMonthStart, e.target.value)} 
            className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded text-sm outline-none" 
            placeholder="Período" 
          />
        </div>
        <div className="flex gap-1.5 w-full lg:col-span-1 justify-end">
          <button 
            onClick={() => { 
              setSearchTerm(''); 
              setFilterStatus(''); 
              setFilterMonthStart(''); 
              setFilterMonthEnd(''); 
              setCurrentPage(1); 
            }} 
            className="px-2 text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-tighter"
          >
            Limpar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-[400px]">
        <div className="overflow-x-auto flex-1 relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
            </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10 font-bold">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button 
                    onClick={() => { 
                      if (selectedIds.size === prestacoes.length) setSelectedIds(new Set()); 
                      else setSelectedIds(new Set(prestacoes.map(p => p.id))); 
                    }}
                  >
                    {selectedIds.size > 0 && selectedIds.size === prestacoes.length ? <CheckSquare size={16} /> : <Square size={16} />}
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button 
                    onClick={() => handleSort('entryDate')}
                    className="font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Data Entrada{getSortIndicator('entryDate')}
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button 
                    onClick={() => handleSort('processNumber')}
                    className="font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Número{getSortIndicator('processNumber')}
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button 
                    onClick={() => handleSort('interested')}
                    className="font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Interessado{getSortIndicator('interested')}
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button 
                    onClick={() => handleSort('month')}
                    className="font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Mês{getSortIndicator('month')}
                  </button>
                </th>
                <th className="px-3 py-3">
                  <button 
                    onClick={() => handleSort('status')}
                    className="font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    Status{getSortIndicator('status')}
                  </button>
                </th>
                <th className="px-3 py-3">Motivo da Irregularidade</th>
                <th className="px-3 py-3">Observações</th>
                <th className="px-3 py-3">Ações</th>
                <th className="px-3 py-3">Data Saída</th>
                <th className="px-3 py-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100" style={{ fontSize: `${tableFontSize}px` }}>
              {groupedPrestacoes.map(prestacao => {
                const isIrregular = prestacao.status === 'IRREGULAR';
                return (
                  <tr 
                    key={prestacao.id} 
                    className={`group transition-colors ${isIrregular ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-blue-50/30'} ${selectedIds.has(prestacao.id) ? 'bg-blue-50/80' : ''}`}
                  >
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => { 
                          const s = new Set(selectedIds); 
                          if (s.has(prestacao.id)) s.delete(prestacao.id); 
                          else s.add(prestacao.id); 
                          setSelectedIds(s); 
                        }}
                      >
                      {selectedIds.has(prestacao.id) ? <CheckSquare size={16} className="text-blue-500" /> : <Square size={16} />}
                      </button>
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-medium whitespace-nowrap">
                      {formatDate(prestacao.entryDate)}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-blue-600 whitespace-nowrap cursor-pointer hover:underline" onClick={() => handleNumberClick(prestacao.processNumber)}>
                      {prestacao.processNumber}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {prestacao.interested || <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-medium whitespace-nowrap">
                      {formatMonth(prestacao.month)}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                        isIrregular 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-green-100 text-green-700 border border-green-200'
                      }`}>
                        {isIrregular ? '⚠️ Irregular' : '✓ Regular'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {prestacao.motivo ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                          <AlertTriangle size={12} />
                          {prestacao.motivo}
                        </span>
                      ) : (
                        <span className="text-slate-300 italic">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 max-w-xs truncate" title={prestacao.observations}>
                      {prestacao.observations || <span className="text-slate-300 italic">-</span>}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={() => handleOpenModal(prestacao)} 
                          className="p-1 text-slate-600 hover:text-blue-600 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir esta prestação de contas?')) {
                              setSelectedIdToDelete(prestacao.id);
                              setIsPasswordModalOpen(true);
                            }
                          }} 
                          className="p-1 text-slate-600 hover:text-red-600 rounded transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-600 font-medium whitespace-nowrap">
                      {formatDate(prestacao.exitDate)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {prestacao.link ? (
                        <a 
                          href={prestacao.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors border border-blue-200"
                          title="Abrir link"
                        >
                          <ExternalLink size={14} />
                          <span className="text-[10px] font-medium">Link</span>
                        </a>
                      ) : (
                        <span className="text-slate-300 text-[10px] italic">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!loading && prestacoes.length === 0 && (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
              <Search size={48} className="mb-3 opacity-10" />
              <p>Nenhuma prestação de contas encontrada.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm gap-4 mt-auto">
        <div className="text-xs text-slate-500">Página {currentPage} de {totalPages} ({totalCount} registros)</div>
        <div className="flex items-center gap-3">
          <select 
            value={itemsPerPage} 
            onChange={(e) => setItemsPerPage(Number(e.target.value))} 
            className="border border-slate-300 rounded px-2 py-1 text-xs outline-none"
          >
            {[10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <div className="flex items-center rounded-md border border-slate-300 divide-x divide-slate-300 overflow-hidden">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
              disabled={currentPage === 1} 
              className="p-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex">
              {getPageNumbers().map(pageNum => (
                <button 
                  key={pageNum} 
                  onClick={() => setCurrentPage(pageNum)} 
                  className={`px-3 py-1.5 text-xs font-medium ${currentPage === pageNum ? 'bg-blue-50 text-blue-600' : 'bg-white hover:bg-slate-50'}`}
                >
                  {pageNum}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
              disabled={currentPage === totalPages || totalPages === 0} 
              className="p-1.5 hover:bg-slate-50 disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden transform">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-3">
              <Trash2 className="text-red-600" size={24} />
              <h3 className="font-bold text-red-900">Excluir Prestação de Contas</h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)} 
                className="ml-auto text-red-400 hover:text-red-700"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleConfirmPasswordDelete} className="p-6 space-y-4">
              <p className="text-slate-600 text-sm">Confirme sua senha para excluir esta prestação de contas:</p>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  ref={passwordInputRef}
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPasswordError('');
                  }} 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-200 outline-none" 
                  placeholder="Senha de acesso" 
                  required 
                />
              </div>
              {passwordError && <div className="text-red-600 text-xs flex items-center gap-1 font-medium"><AlertCircle size={12}/>{passwordError}</div>}
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsPasswordModalOpen(false)} 
                  className="flex-1 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium border border-slate-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isVerifyingPassword || !confirmPassword} 
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium flex justify-center items-center gap-2 hover:bg-red-700 shadow-sm"
                >
                  {isVerifyingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Excluir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b bg-slate-50 sticky top-0 z-20">
              <h3 className="text-lg font-bold text-slate-800">
                {editingPrestacao ? 'Editar Prestação de Contas' : 'Nova Prestação de Contas'}
              </h3>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-200 rounded">
                <X size={24} />
              </button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">
                  Selecione um Processo
                </label>
                <select 
                  name="processoSelecionado"
                  onChange={(e) => handleSelectProcesso(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">-- Selecione um processo de prestação de contas --</option>
                  {processosPrestacao.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.number} - {p.subject}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Selecione um processo marcado como "Prestação de Contas"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">
                    Número do Processo <span className="text-red-600">*</span>
                  </label>
                  <input 
                    required 
                    name="processNumber" 
                    type="text" 
                    defaultValue={editingPrestacao?.processNumber || ''} 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm font-mono focus:ring-2 focus:ring-blue-100" 
                    placeholder="Ex: 001/2024" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">
                    Interessado
                  </label>
                  <input 
                    name="interested" 
                    type="text" 
                    defaultValue={editingPrestacao?.interested || ''} 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100" 
                    placeholder="Ex: Órgão/Empresa" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">
                    Mês da Prestação <span className="text-red-600">*</span>
                  </label>
                  <input 
                    required 
                    name="month" 
                    type="month" 
                    defaultValue={editingPrestacao?.month || new Date().toISOString().slice(0, 7)} 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">
                  Status <span className="text-red-600">*</span>
                </label>
                <select 
                  required 
                  name="status" 
                  defaultValue={editingPrestacao?.status || 'REGULAR'} 
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100"
                >
                  <option value="REGULAR">✓ Regular</option>
                  <option value="IRREGULAR">⚠️ Irregular</option>
                </select>
              </div>

              <div id="motivo-section">
                <label className="block text-sm font-bold mb-1 text-slate-700">
                  Motivo da Irregularidade
                </label>
                <input 
                  name="motivo" 
                  type="text" 
                  defaultValue={editingPrestacao?.motivo || ''} 
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100" 
                  placeholder="Descreva o motivo da irregularidade" 
                />
                <p className="text-xs text-slate-500 mt-1">Obrigatório se o status for Irregular</p>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">Observações</label>
                <textarea 
                  name="observations" 
                  rows={3} 
                  defaultValue={editingPrestacao?.observations || ''} 
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100" 
                  placeholder="Informações adicionais..." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">
                    Data de Entrada <span className="text-red-600">*</span>
                  </label>
                  <input 
                    required 
                    name="entryDate" 
                    type="date" 
                    defaultValue={editingPrestacao?.entryDate || ''} 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1 text-slate-700">Data de Saída</label>
                  <input 
                    name="exitDate" 
                    type="date" 
                    defaultValue={editingPrestacao?.exitDate || ''} 
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">Link</label>
                <input 
                  name="link" 
                  type="url" 
                  defaultValue={editingPrestacao?.link || ''} 
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none text-sm focus:ring-2 focus:ring-blue-100" 
                  placeholder="https://exemplo.com" 
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-6 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold flex items-center gap-2 text-sm shadow-md hover:bg-blue-700 transition-colors"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  Gravar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Histórico/Fluxo */}
      {isHistoricoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History size={24} className="text-purple-600" />
                <h2 className="text-xl font-bold text-slate-900">Fluxo de Status</h2>
              </div>
              <button 
                onClick={handleCloseHistorico}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {historicoLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
              ) : historicoData.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhum histórico encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historicoData.map((entrada, index) => (
                    <div key={entrada.id} className="relative">
                      {/* Linha vertical conectando entradas */}
                      {index < historicoData.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-8 bg-slate-200" />
                      )}

                      <div className="flex gap-4">
                        {/* Indicador circular */}
                        <div className="flex flex-col items-center pt-1">
                          <div className={`w-4 h-4 rounded-full border-4 ${
                            entrada.statusNovo === 'REGULAR' 
                              ? 'bg-green-100 border-green-500' 
                              : 'bg-yellow-100 border-yellow-500'
                          }`} />
                        </div>

                        {/* Conteúdo da entrada */}
                        <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-bold text-slate-900">
                                {entrada.statusAnterior ? (
                                  <>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold mr-2 ${
                                      entrada.statusAnterior === 'REGULAR' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {entrada.statusAnterior}
                                    </span>
                                    <span className="text-slate-400">→</span>
                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ml-2 ${
                                      entrada.statusNovo === 'REGULAR' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {entrada.statusNovo}
                                    </span>
                                  </>
                                ) : (
                                  <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                    entrada.statusNovo === 'REGULAR' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {entrada.statusNovo}
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-700 text-sm mt-1">{entrada.descricao}</p>
                              
                              {/* Informações da Prestação */}
                              <div className="mt-2 p-2 bg-white rounded border-l-2 border-slate-300 space-y-1">
                                {entrada.mes && (
                                  <div className="text-xs">
                                    <span className="text-slate-500 font-bold">Mês:</span>
                                    <span className="text-slate-700 ml-2">{new Date(entrada.mes + '-01').toLocaleString('pt-BR', {month: 'long', year: 'numeric'})}</span>
                                  </div>
                                )}
                                {entrada.dataEntrada && (
                                  <div className="text-xs">
                                    <span className="text-slate-500 font-bold">Entrada:</span>
                                    <span className="text-slate-700 ml-2">{entrada.dataEntrada.split('T')[0].split('-').reverse().join('/')}</span>
                                  </div>
                                )}
                                {entrada.dataSaida && (
                                  <div className="text-xs">
                                    <span className="text-slate-500 font-bold">Saída:</span>
                                    <span className="text-slate-700 ml-2">{entrada.dataSaida.split('T')[0].split('-').reverse().join('/')}</span>
                                  </div>
                                )}
                              </div>
                              
                              {entrada.motivoNovo && (
                                <div className="mt-2 p-2 bg-white rounded border-l-2 border-orange-300">
                                  <p className="text-xs text-slate-500 font-bold">Motivo:</p>
                                  <p className="text-xs text-slate-700 mt-1">{entrada.motivoNovo}</p>
                                </div>
                              )}

                              {entrada.observacoes && (
                                <div className="mt-2 p-2 bg-white rounded border-l-2 border-blue-300">
                                  <p className="text-xs text-slate-500 font-bold">Observações:</p>
                                  <p className="text-xs text-slate-700 mt-1">{entrada.observacoes}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                            <span>Por: <strong>{entrada.nomeUsuario}</strong></span>
                            <div className="flex items-center gap-2">
                              <span>{new Date(entrada.dataAlteracao).toLocaleString('pt-BR')}</span>
                              <button
                                onClick={() => handleOpenEditFluxoModal(entrada)}
                                className="ml-3 p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                title="Editar fluxo"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir este fluxo?')) {
                                    handleDeleteFluxo(entrada.id);
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                title="Deletar fluxo"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-2">
              <button 
                onClick={handleOpenNovoFluxoModal}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                + Novo Fluxo
              </button>
              <button 
                onClick={handleCloseHistorico}
                className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isNovoFluxoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Novo Fluxo de Prestação</h2>
              <button 
                onClick={handleCloseNovoFluxoModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveNovoFluxo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Mês *
                  </label>
                  <input 
                    type="month" 
                    required
                    value={novoFluxoData.month}
                    onChange={(e) => setNovoFluxoData({...novoFluxoData, month: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Status *
                  </label>
                  <select 
                    required
                    value={novoFluxoData.status}
                    onChange={(e) => setNovoFluxoData({...novoFluxoData, status: e.target.value as 'REGULAR' | 'IRREGULAR'})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="IRREGULAR">Irregular</option>
                  </select>
                </div>
              </div>

              {novoFluxoData.status === 'IRREGULAR' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Motivo da Irregularidade *
                  </label>
                  <textarea 
                    required
                    value={novoFluxoData.motivo}
                    onChange={(e) => setNovoFluxoData({...novoFluxoData, motivo: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm min-h-[100px]"
                    placeholder="Descreva o motivo da irregularidade"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Observações
                </label>
                <textarea 
                  value={novoFluxoData.observations}
                  onChange={(e) => setNovoFluxoData({...novoFluxoData, observations: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm min-h-[80px]"
                  placeholder="Observações adicionais"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Data de Entrada *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={novoFluxoData.entryDate}
                    onChange={(e) => setNovoFluxoData({...novoFluxoData, entryDate: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Data de Saída
                  </label>
                  <input 
                    type="date" 
                    value={novoFluxoData.exitDate}
                    onChange={(e) => setNovoFluxoData({...novoFluxoData, exitDate: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <button 
                  type="submit"
                  disabled={novoFluxoSaving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
                >
                  {novoFluxoSaving ? 'Salvando...' : 'Salvar Novo Fluxo'}
                </button>
                <button 
                  type="button"
                  onClick={handleCloseNovoFluxoModal}
                  className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditFluxoModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Editar Fluxo de Prestação</h2>
              <button 
                onClick={handleCloseEditFluxoModal}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveEditFluxo} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Mês *
                  </label>
                  <input 
                    type="month" 
                    required
                    value={editFluxoData.month}
                    onChange={(e) => setEditFluxoData({...editFluxoData, month: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Status *
                  </label>
                  <select 
                    required
                    value={editFluxoData.status}
                    onChange={(e) => setEditFluxoData({...editFluxoData, status: e.target.value as 'REGULAR' | 'IRREGULAR'})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="IRREGULAR">Irregular</option>
                  </select>
                </div>
              </div>

              {editFluxoData.status === 'IRREGULAR' && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Motivo da Irregularidade *
                  </label>
                  <textarea 
                    required
                    value={editFluxoData.motivo}
                    onChange={(e) => setEditFluxoData({...editFluxoData, motivo: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm min-h-[100px]"
                    placeholder="Descreva o motivo da irregularidade"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Observações
                </label>
                <textarea 
                  value={editFluxoData.observations}
                  onChange={(e) => setEditFluxoData({...editFluxoData, observations: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm min-h-[80px]"
                  placeholder="Observações adicionais"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Data de Entrada *
                  </label>
                  <input 
                    type="date" 
                    required
                    value={editFluxoData.entryDate}
                    onChange={(e) => setEditFluxoData({...editFluxoData, entryDate: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    Data de Saída
                  </label>
                  <input 
                    type="date" 
                    value={editFluxoData.exitDate}
                    onChange={(e) => setEditFluxoData({...editFluxoData, exitDate: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 space-y-2">
                <button 
                  type="submit"
                  disabled={editFluxoSaving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
                >
                  {editFluxoSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
                <button 
                  type="button"
                  onClick={handleCloseEditFluxoModal}
                  className="w-full px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}    </div>
  );
};