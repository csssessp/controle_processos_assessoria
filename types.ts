
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
export type UserArea = 'assessoria' | 'gpc' | 'ggcon';
export const USER_AREA_OPTIONS: { value: UserArea; label: string }[] = [
  { value: 'assessoria', label: 'Processos Assessoria' },
  { value: 'gpc', label: 'Processos GPC' },
  { value: 'ggcon', label: 'Processos GGCON' },
];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  areas?: UserArea[]; // Áreas que o usuário pode acessar
  can_sign?: boolean; // Pode ser responsável pela assinatura de processos
  view_only?: boolean; // Usuário somente leitura — não pode alterar dados
  ggcon_libera_analise?: boolean; // Pode liberar processos para a fila de Análise GGCON
  password_hash?: string; // Stored hash
  password?: string; // Input only, not stored in DB directly
}

/** Verifica se o usuário tem acesso a uma área específica */
export const userHasArea = (user: User | null, area: UserArea): boolean => {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  return Array.isArray(user.areas) && user.areas.includes(area);
};

/** Verifica se o usuário pode liberar processos para a fila de Análise GGCON (Admin sempre pode) */
export const podeLiberarAnalise = (user: User | null): boolean => {
  if (!user) return false;
  if (user.role === UserRole.ADMIN) return true;
  return userHasArea(user, 'ggcon') && user.ggcon_libera_analise === true;
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
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'USER_MGMT' | 'GPC';
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
  qtd_paginas?: number | null;
  data_recebimento?: string | null;
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

export interface ParcAutorizacaoEntry {
  tipo: 'AUTORIZO_SECRETARIO' | 'AUTORIZO_CASA_CIVIL' | 'ASSINATURA' | 'AUTORIZO_GOVERNADOR';
  data: string;
  obs?: string | null;
  registrado_por?: string | null;
  registrado_em: string;
}

export interface GpcParcelamento {
  codigo: number;
  processo_id: number | null;
  proc_parcela: string | null;
  tipo: string | null;
  tipo_parcelamento: 'PARCELAMENTO' | 'REPARCELAMENTO' | null;
  exercicio: number | null;
  exercicios: number[] | null; // multiple exercise years (JSONB array)
  valor_parcelado: number | null;
  valor_corrigido: number | null;
  parcelas: number | null;
  data_parou_pagar: string | null;  // date when debtor stopped paying (for reparcelamento)
  valor_por_parcela: number | null; // value per installment
  em_dia: boolean;
  parcelas_concluidas: boolean;
  providencias: string | null;
  obs: string | null;
  autorizo_secretario: boolean;
  autorizo_casa_civil: boolean;
  data_assinatura: string | null;
  autorizo_governador: boolean;
  autorizacoes_log?: ParcAutorizacaoEntry[] | null;
  origem_planilha?: string | null; // proveniência quando importado de planilha externa (ex.: 'CSS_PARCELAMENTO')
}

export interface GpcParcela {
  codigo: number;
  parcelamento_id: number;
  numero: number;
  data_vencimento: string | null;
  valor: number | null;
  pago: boolean;
  data_pagamento: string | null;
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
  municipio?: string | null;
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
  tipo_parcelamento?: 'PARCELAMENTO' | 'REPARCELAMENTO' | null;
  exercicios?: number[] | null; // multiple exercise years for parcelamento/reparcelamento
  remessa?: 'ACIMA' | 'ABAIXO' | null;
  num_paginas?: number | null;
  responsavel_assinatura?: string | null;
  responsavel_assinatura_2?: string | null;
  // Responsabilidades
  responsavel_cadastro?: string | null;      // Quem cadastrou o processo no sistema
  responsaveis_analise?: string[] | null;    // Array de técnicos que analisam o processo
  // Valor do convênio (global, conforme termo)
  valor_convenio?: number | null;
  // Situação do processo
  situacao?: 'REGULAR' | 'IRREGULAR' | 'PARCIALMENTE_REGULAR' | null;
  irregular_tipos?: ('CONTENCIOSO' | 'CADIN')[] | null; // sub-type when situacao = IRREGULAR
  // Desfecho do julgamento quando situacao = IRREGULAR
  irregular_debito?: 'SEM_DEBITO' | 'COM_DEBITO' | null;
  valor_multa?: number | null;                                       // quando irregular_debito = SEM_DEBITO
  ressarcimento_status?: 'RECOLHIDO' | 'NAO_RECOLHIDO' | null;        // quando irregular_debito = COM_DEBITO
  cobranca_estagio?: 'COBRANCA' | 'DIVIDA_ATIVA' | 'EXECUCAO_FISCAL' | null; // quando ressarcimento_status = NAO_RECOLHIDO
  valor_a_devolver?: number | null;
  valor_devolvido?: number | null;
  situacao_obs?: string | null;
  // Correção documental — processo devolvido para correção
  correcao_paginas?: number | null;   // páginas analisadas na correção
  correcao_obs?: string | null;       // descrição do que foi corrigido
  origem_planilha?: string | null;    // proveniência quando importado de planilha externa (ex.: 'OUTROS')
  created_at?: string;
}

export interface GpcFluxoTecnico {
  id: number;
  registro_id: number;
  exercicio_id?: number | null;
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

// Estado de análise (posição, movimento, situação/julgamento, correção documental) de um
// registro para um exercício específico — cada exercício tem sua própria trilha.
export interface GpcRegistroExercicio {
  codigo: number;
  registro_id: number;
  exercicio_id: number;
  exercicio?: string | null; // ano do exercício (join com cgof_gpc_exercicio, não persistido aqui)
  posicao_id: number | null;
  posicao?: string | null;
  movimento: string | null;
  responsaveis_analise: string[] | null;
  num_paginas: number | null;
  situacao: 'REGULAR' | 'IRREGULAR' | 'PARCIALMENTE_REGULAR' | null;
  irregular_tipos: ('CONTENCIOSO' | 'CADIN')[] | null;
  irregular_debito: 'SEM_DEBITO' | 'COM_DEBITO' | null;
  valor_multa: number | null;
  ressarcimento_status: 'RECOLHIDO' | 'NAO_RECOLHIDO' | null;
  cobranca_estagio: 'COBRANCA' | 'DIVIDA_ATIVA' | 'EXECUCAO_FISCAL' | null;
  situacao_obs: string | null;
  valor_a_devolver: number | null;
  valor_devolvido: number | null;
  correcao_paginas: number | null;
  correcao_obs: string | null;
  responsavel_assinatura?: string | null;
  responsavel_assinatura_2?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GpcProdutividade {
  id: number;
  registro_id: number;
  responsavel: string | null;
  posicao_id: number | null;
  posicao?: string | null;
  evento: string; // 'CADASTRO' | 'INICIO_ANALISE' | 'RESPONSAVEL' | 'POSICAO' | 'MOVIMENTO' | 'CRIACAO'
  data_evento: string;
  obs: string | null;
  created_at?: string;
}

// Trabalho de um técnico GPC sem vínculo a um registro de processo do GPC — pode muito
// bem envolver um processo, só que de outro setor/departamento (ex.: auxílio a outro
// setor, elaboração de documento, reunião técnica) — por isso não tem registro_id,
// diferente de GpcProdutividade/GpcFluxoTecnico. Conta como produtividade própria
// ("Outras Atividades") na tela de Produtividade.
export interface GpcAtividadeAvulsa {
  codigo: number;
  tecnico: string;
  tipo: string;
  descricao: string;
  contexto?: string | null;
  horas?: number | null;
  paginas?: number | null;
  data_atividade: string;
  registrado_por?: string | null;
  created_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GGCON — Controle de Entrada de Processos SEI
// Cada registro é uma movimentação de um processo SEI (mesmo processo_sei pode
// repetir em várias linhas ao longo do tempo — ver services/ggconService.ts).
// ─────────────────────────────────────────────────────────────────────────────

export interface GgconProcesso {
  codigo: number;
  processo_sei: string;
  numero_demanda: string | null;
  data_entrada: string | null;
  data_recebimento: string | null;
  municipio: string | null;
  drs_unidade: string | null;
  coordenadoria: string | null;
  interessado: string | null;
  assunto: string | null;
  tipo: string | null;
  tecnico_responsavel: string | null;
  etapa: string | null;
  data_movimentacao: string | null;
  aguardando_assinatura: boolean;
  comite_gestor: boolean;
  consultoria_juridica: boolean;
  valor_estado: number | null;
  observacoes: string | null;
  area_encaminhamento: string | null;
  data_envio: string | null;
  proxima_providencia: string | null;
  urgente: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// GGCON — Análise Processo (conferência de Prestação de Contas)
// Fluxo: liberador cadastra o despacho e libera para um analista → analista
// preenche o checklist oficial (Entidade ou Prefeitura) em tela → conclui →
// liberador encaminha para outra área. Toda troca de analista fica registrada
// em cgof_ggcon_analise_historico (ver services/ggconAnaliseService.ts).
// ─────────────────────────────────────────────────────────────────────────────

export type GgconTipoConveniada = 'ENTIDADE' | 'PREFEITURA';

export type GgconAnaliseStatus =
  | 'AGUARDANDO_LIBERACAO'
  | 'AGUARDANDO_ANALISE'
  | 'EM_ANALISE'
  | 'CONCLUIDA';

export const GGCON_ANALISE_STATUS_LABELS: Record<GgconAnaliseStatus, string> = {
  AGUARDANDO_LIBERACAO: 'Aguardando Liberação',
  AGUARDANDO_ANALISE: 'Aguardando Análise',
  EM_ANALISE: 'Em Análise',
  CONCLUIDA: 'Concluída',
};

export type GgconAnaliseResposta = 'SIM' | 'NAO' | 'NAO_SE_APLICA';

export interface GgconAnalise {
  id: number;
  processo_sei: string;
  convenio_numero: string | null;
  cnpj: string | null;
  interessado: string | null;
  objeto: string | null;
  custeio: boolean;
  investimento: boolean;
  valor_repasse: number | null;
  vigencia_inicio: string | null;
  vigencia_termino: string | null;
  vigencia_prorrogado_ate: string | null;
  termo_aditivo_numeros: string[] | null;
  termo_retirratificacao: boolean;
  resolucao_numero: string | null;
  tipo_conveniada: GgconTipoConveniada;
  municipio: string | null;
  drs_unidade: string | null;
  status: GgconAnaliseStatus;
  analista_atual: string | null;
  liberado_por: string | null;
  data_recebimento: string | null;
  data_liberacao: string | null;
  data_inicio_analise: string | null;
  data_analise: string | null;
  data_encaminhamento: string | null;
  area_encaminhamento: string | null;
  observacoes: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
  // agregados calculados no service, não persistidos
  itens_total?: number;
  itens_respondidos?: number;
}

export interface GgconAnaliseItem {
  id: number;
  analise_id: number;
  item_numero: number;
  item_descricao: string;
  resposta: GgconAnaliseResposta | null;
  documento_sei: string[] | null; // lista de links dos documentos SEI comprobatórios deste item
  observacao: string | null;
  updated_at?: string;
}

export type GgconAnaliseEvento =
  | 'LIBERADA' | 'REATRIBUIDA' | 'INICIADA' | 'CONCLUIDA' | 'ENCAMINHADA' | 'RESETADA'
  | 'STATUS_ALTERADO' | 'HISTORICO_LIMPO';

export interface GgconAnaliseHistorico {
  id: number;
  analise_id: number;
  evento: GgconAnaliseEvento;
  analista_anterior: string | null;
  analista_novo: string | null;
  usuario_responsavel: string | null;
  data_evento: string;
  observacao: string | null;
}
