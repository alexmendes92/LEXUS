
export interface Person {
  id: string;
  nome: string;
  folha: string;
  nacionalidade: string;
  cpf: string;
  rg: string;
  pai: string;
  mae: string;
  dataNascimento: string;
  endereco?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  uf?: string;
  cep?: string;
  telefone?: string;
  email?: string;
  tipoParte?: 'Vítima' | 'Investigado' | 'Representante da Vítima' | 'Outros';
  statusIntimacao?: 'Não Iniciado' | 'Pendente' | 'Concluído' | 'Erro';
}

export interface CaseData {
  numeroProcesso: string;
  cargo: string;
  promotor: string;
  dataAudiencia: string;
  urgente?: boolean;
}

export type Gender = 'M' | 'F';

export type AppScreen = 
  | 'DASHBOARD' 
  | 'PESQUISA_NI' 
  | 'SISDIGITAL' 
  | 'OFICIO' 
  | 'ANPP' 
  | 'MULTA_PENAL' 
  | 'PROMOCAO_ARQUIVAMENTO' 
  | 'ACTIVITIES' 
  | 'MENTOR' 
  | 'DATABASE' 
  | 'ACTIVITY_ANALYSIS' 
  | 'INTIMACAO' 
  | 'DATA_EXTRACTOR' 
  | 'LAYOUT_DOCS' 
  | 'PROVIDENCIAS' 
  | 'CERTIDAO_GENERATOR' 
  | 'NOTICIA_FATO_PROCEDURE' 
  | 'INTIMACAO_ARQUIVAMENTO' 
  | 'ARCHIVING_HELP' 
  | 'USER_GUIDE' 
  | 'PARTY_FINANCE' 
  | 'DB_SCHEMA_DOCS' 
  | 'RELATORIO_CGMP'
  | 'DESPACHO_AGENDAMENTO'
  | 'ANPP_BANKING'
  | 'ANPP_EXECUTIONS';

interface Schedule {
  name: string;
  gender: Gender;
  start: number;
  end: number;
}

export interface PromotoriaDef {
  id?: number;
  label: string;
  schedule: Schedule[];
}

export const ACTIVITY_STATUSES = [
  { label: 'Não Verificado', value: 'NAO_VERIFICADO', colorClass: { bg: 'bg-slate-300', text: 'text-slate-800' } },
  { label: 'Pendente', value: 'PENDENTE', colorClass: { bg: 'bg-yellow-500', text: 'text-white' } },
  { label: 'Revisar', value: 'REVISAR', colorClass: { bg: 'bg-orange-500', text: 'text-white' } },
  { label: 'Em Andamento', value: 'EM_ANDAMENTO', colorClass: { bg: 'bg-indigo-500', text: 'text-white' } },
  { label: 'Aguardando', value: 'AGUARDANDO', colorClass: { bg: 'bg-red-500', text: 'text-white' } },
  { label: 'Finalizado / Não Concluído', value: 'FINALIZADO_NAO_CONCLUIDO', colorClass: { bg: 'bg-blue-300', text: 'text-blue-800' } },
  { label: 'Concluído', value: 'CONCLUIDO', colorClass: { bg: 'bg-green-500', text: 'text-white' } },
  { label: 'Finalizado', value: 'FINALIZADO', colorClass: { bg: 'bg-purple-500', text: 'text-white' } },
];

export type ActivityStatus = typeof ACTIVITY_STATUSES[number]['value'];

export interface Activity {
  id: string;
  numeroProcesso: string;
  data: string;
  status: ActivityStatus;
  tipo: string;
  cargo: string;
  promotor: string;
  observacao?: string;
}

export const ACTIVITY_TYPES = [
  'Multa Penal',
  'Pesquisa de NI',
  'Notificação - (Art. 28)',
  'ANPP - Execuções',
  'Ofício',
  'Agendamento de Despacho',
  'Outros',
  'ANPP - Dados Bancários',
  'Notícia de Fato',
];

export interface MasterPromotor {
  id: number;
  nome: string;
  sexo: string;
  start: number;
  end: number;
}

export interface MasterCargo {
  id: number;
  cargo: string;
  promotor: number;
  master_promotor?: {
    nome: string;
  };
}

export interface MasterAnalista {
  id: number;
  nome: string;
  email?: string;
  cargo_id?: number;
  master_cargos?: {
    cargo: string;
  };
}
