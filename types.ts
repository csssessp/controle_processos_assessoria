
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

// Removed enum ProcessCategory to allow dynamic categories/origins from DB
export type ProcessCategory = string;

// Define specific options for CGOF column
export const CGOF_OPTIONS = [
  'Assessoria',
  'Recebimento',
  'Gabinete do Coordenador'
] as const;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  password_hash?: string; // Stored hash
  password?: string; // Input only, not stored in DB directly
}

export interface Process {
  id: string;
  category: string; // Changed to string to act as "Origem"
  CGOF: string; // Field for CGOF column (Uppercase as requested)
  entryDate: string; // ISO Date (YYYY-MM-DD)
  number: string;
  interested: string;
  subject: string;
  sector: string;
  processDate: string | null; // ISO Date or null
  urgent: boolean;
  deadline: string | null; // ISO Date or null
  observations?: string;
  processLink?: string; // Link direto do processo
  isPrestacaoConta?: boolean; // Marca se é prestação de contas
  
  createdBy: string; // User ID
  updatedBy: string;
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
}

export interface Log {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'USER_MGMT';
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  targetId?: string; // ID of the process or user affected
}

export interface DashboardStats {
  total: number;
  urgent: number;
  overdue: number;
  nearDeadline: number;
  bySector: { name: string; value: number }[];
}

export interface ProcessFilters {
  CGOF?: string;
  sector?: string;
  entryDateStart?: string;
  entryDateEnd?: string;
  urgent?: boolean;
  overdue?: boolean;
  emptySector?: boolean;
  emptyExitDate?: boolean;
}

export interface ProcessSort {
  field: 'deadline' | 'updatedAt' | 'number' | 'entryDate';
  order: 'asc' | 'desc';
}

export interface ProcessQueryParams {
  page: number;
  itemsPerPage: number;
  searchTerm?: string;
  filters?: ProcessFilters;
  sortBy?: ProcessSort;
}
export interface PrestacaoConta {
  id: string;
  processId?: string | null; // ID do processo relacionado
  processNumber: string; // Número do processo (ex: 001/2024)
  month: string; // Mês da prestação (YYYY-MM)
  status: 'REGULAR' | 'IRREGULAR'; // Status da prestação
  motivo?: string; // Motivo da irregularidade (se irregular)
  observations?: string; // Observações adicionais
  entryDate: string; // Data de entrada (YYYY-MM-DD)
  exitDate?: string | null; // Data de saída (YYYY-MM-DD)
  link?: string; // Link do documento/processo
  versionNumber: number; // Versão da prestação (incrementa a cada alteração)
  
  createdBy: string; // User ID
  updatedBy: string;
  createdAt: string; // ISO Timestamp
  updatedAt: string; // ISO Timestamp
}

export interface PrestacaoContaHistorico {
  id: string;
  prestacaoId: string; // ID da prestação
  versionNumber: number; // Versão desta entrada
  statusAnterior?: 'REGULAR' | 'IRREGULAR' | null; // Status antes da mudança
  statusNovo: 'REGULAR' | 'IRREGULAR'; // Status novo
  motivoAnterior?: string | null; // Motivo anterior
  motivoNovo?: string | null; // Motivo novo
  observacoes?: string; // Observações sobre a mudança
  descricao: string; // Descrição da mudança (ex: "Alterado de IRREGULAR para REGULAR")
  
  alteradoPor: string; // User ID
  nomeUsuario: string; // Nome do usuário
  dataAlteracao: string; // ISO Timestamp
}

export interface PrestacaoContaFilters {
  processNumber?: string;
  monthStart?: string;
  monthEnd?: string;
  status?: 'REGULAR' | 'IRREGULAR';
}

export interface PrestacaoContaSort {
  field: 'processNumber' | 'month' | 'status' | 'updatedAt';
  order: 'asc' | 'desc';
}

export interface PrestacaoContaQueryParams {
  page: number;
  itemsPerPage: number;
  searchTerm?: string;
  filters?: PrestacaoContaFilters;
  sortBy?: PrestacaoContaSort;
}