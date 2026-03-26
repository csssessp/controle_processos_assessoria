
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
  is_prestacao_conta?: boolean; // Marca se é prestação de contas
  
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

// Status possíveis para Prestação de Contas
export const PRESTACAO_STATUS_OPTIONS = [
  'REGULAR',
  'REGULAR COM RESSALVA',
  'IRREGULAR'
] as const;

export const REGULARIDADE_OPTIONS = [
  'Não avaliada',
  'Regular',
  'Regular com Ressalva',
  'Irregular'
] as const;

export interface PrestacaoConta {
  id: string;
  process_id: string | null;
  process_number: string;
  month: string;
  status: string;
  regularidade?: string;
  motivo?: string;
  observations?: string;
  entry_date: string | null;
  exit_date: string | null;
  link?: string;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
  version_number: number;
  interested?: string;
}

export interface PrestacaoContaHistorico {
  id: string;
  prestacao_id: string;
  version_number: number;
  status_anterior: string;
  status_novo: string;
  motivo_anterior?: string;
  motivo_novo?: string;
  observacoes?: string;
  descricao?: string;
  alterado_por: string;
  nome_usuario: string;
  data_alteracao: string;
}
