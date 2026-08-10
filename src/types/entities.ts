export type AgendamentoStatus = 'agendado' | 'concluido' | 'cancelado';
export type ContaTipo = 'pagar' | 'receber';
export type ContaStatus = 'pendente' | 'quitado';
export type CentroCustoTipo = 'receita' | 'despesa' | 'ambos';

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
}

// servicos: ids dos serviços atuais; servico: texto legado (agendamentos antigos)
export interface Agendamento {
  id: string;
  clienteId: string;
  data: string; // 'YYYY-MM-DD'
  hora: string; // 'HH:mm'
  servicos?: string[];
  servico?: string;
  valor: number;
  sinal?: number;
  status: AgendamentoStatus;
  sorteio?: boolean;
  duracao?: number; // em minutos
  observacoes?: string;
  pacoteVendaId?: string | null;
  createdAt: number;
  updatedAt?: number;
}

export interface Conta {
  id: string;
  tipo: ContaTipo;
  descricao: string;
  valor: number;
  vencimento: string; // 'YYYY-MM-DD'
  centroCustoId?: string | null;
  clienteId?: string | null;
  agendamentoId?: string | null;
  status: ContaStatus;
  valorPago: number;
  dataPagamento?: string | null;
  createdAt: number;
  updatedAt?: number;
}

export interface CentroCusto {
  id: string;
  nome: string;
  tipo: CentroCustoTipo;
  descricao?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface Servico {
  id: string;
  nome: string;
  preco: number;
  duracao: number; // em minutos
  createdAt: number;
  updatedAt?: number;
}

export interface PacoteItem {
  servicoId: string;
  qtd: number; // em Pacote é a quantidade vendida; em PacoteVendido é o saldo restante
}

export interface Pacote {
  id: string;
  nome: string;
  valor: number;
  servicos: PacoteItem[];
  createdAt: number;
  updatedAt?: number;
}

export interface PacoteVendido {
  id: string;
  pacoteId: string;
  clienteId: string;
  vendidoEm: string; // 'YYYY-MM-DD'
  valor: number;
  desconto: number;
  servicos: PacoteItem[];
  createdAt: number;
  updatedAt?: number;
}

export interface DadosApp {
  clientes: Cliente[];
  agendamentos: Agendamento[];
  contas: Conta[];
  centrosCusto: CentroCusto[];
  servicos: Servico[];
  pacotes: Pacote[];
  pacotesVendidos: PacoteVendido[];
}

export interface BackupSnapshot {
  versao: number;
  exportadoEm: string;
  dados: DadosApp;
}

// Registro espelhado no Supabase (tabela `registros`)
export interface RegistroRemoto {
  id: string;
  entidade: string;
  dados: unknown;
  updated_at: number | string;
  user_id?: string;
}

export interface Tombstone {
  entidade: string;
  id: string;
  deletedAt: number;
}

export interface SyncMeta {
  lastSyncAt: number | null;
  tombstones: Tombstone[];
}