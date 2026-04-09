
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GPC = 'GPC'
}

// Removed enum ProcessCategory to allow dynamic categories/origins from DB
export type ProcessCategory = string;

// Define specific options for CGOF column
export const CGOF_OPTIONS = [
  'Assessoria',
  'Recebimento',
  'Gabinete do Coordenador'
] as const;

// Áreas de acesso disponíveis no sistema
export type UserArea = 'assessoria' | 'gpc';
export const USER_AREA_OPTIONS: { value: UserArea; label: string }[] = [
  { value: 'assessoria', label: 'Processos Assessoria' },
  { value: 'gpc', label: 'Processos GPC' },
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  areas?: UserArea[]; // Áreas que o usuário pode acessar
  password_hash?: string; // Stored hash
  password?: string; // Input only, not stored in DB directly
}

/** Verifica se o usuário tem acesso a uma área específica */
export const userHasArea = (user: User | null, area: UserArea): boolean => {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  return Array.isArray(user.areas) && user.areas.includes(area);
};

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

// ─────────────────────────────────────────────────────────────────────────────
// GPC (Grupo de Prestação de Contas) – tabelas migradas do Access
// ─────────────────────────────────────────────────────────────────────────────

export interface GpcClassificacao {
  codigo: number;
  indice: number;
  descricao: string;
}

export interface GpcPosicao {
  codigo: number;
  posicao: string;
}

export interface GpcProcesso {
  codigo: number;
  processo: string | null;
  convenio: string | null;
  tipo: string | null;
  ano_cadastro: string | null;
  entidade: string | null;
  drs: number | null;
  vistoriado: boolean;
  parcelamento: boolean;
  acima_abaixo: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GpcExercicio {
  codigo: number;
  processo_id: number;
  exercicio: string | null;
  exercicio_anterior: number | null;
  repasse: number | null;
  aplicacao: number | null;
  gastos: number | null;
  devolvido: number | null;
}

export interface GpcHistorico {
  codigo: number;
  exercicio_id: number;
  movimento: string | null;
  acao: string | null;
  data: string | null;
  setor: string | null;
  responsavel: string | null;
  posicao_id: number | null;
  // join
  posicao?: string;
}

export interface GpcObjeto {
  codigo: number;
  processo_id: number | null;
  objeto: string | null;
  custo: number | null;
}

export interface GpcParcelamento {
  codigo: number;
  processo_id: number | null;
  proc_parcela: string | null;
  tipo: string | null;
  exercicio: number | null;
  valor_parcelado: number | null;
  valor_corrigido: number | null;
  parcelas: number | null;
  em_dia: boolean;
  parcelas_concluidas: boolean;
  providencias: string | null;
  obs: string | null;
}

export interface GpcTa {
  codigo: number;
  processo_id: number | null;
  numero: string | null;
  data: string | null;
  custo: number | null;
}

export type GpcProcessoFull = GpcProcesso & {
  exercicios?: GpcExercicio[];
  historicos?: GpcHistorico[];
  objetos?: GpcObjeto[];
  parcelamentos?: GpcParcelamento[];
  tas?: GpcTa[];
};

export interface GpcRecebido {
  codigo: number;
  processo_codigo: number | null;
  processo: string | null;
  entidade: string | null;
  convenio: string | null;
  exercicio: string | null;
  drs: number | null;
  data: string | null;
  responsavel: string | null;
  posicao_id: number | null;
  posicao?: string | null;
  movimento: string | null;
  link_processo?: string | null;
  is_parcelamento?: boolean | null;
  remessa?: 'ACIMA' | 'ABAIXO' | null;
  num_paginas?: number | null;
  created_at?: string;
}

export interface GpcFluxoTecnico {
  id: number;
  registro_id: number;
  tecnico: string | null;
  data_evento: string;
  posicao_id: number | null;
  posicao?: string | null;
  movimento: string | null;
  acao: string | null;
  tempo_dias?: number | null;
  num_paginas_analise?: number | null;
  obs: string | null;
  created_at?: string;
}

export interface GpcProdutividade {
  id: number;
  registro_id: number;
  responsavel: string | null;
  posicao_id: number | null;
  posicao?: string | null;
  evento: string; // 'CRIACAO' | 'RESPONSAVEL' | 'POSICAO'
  data_evento: string;
  obs: string | null;
  created_at?: string;
}
