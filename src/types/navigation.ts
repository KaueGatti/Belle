import type { NavigatorScreenParams } from '@react-navigation/native';

// Params de cada tela dos stacks das abas.
// | undefined = tela sem params (evita erro ao navegar com navigate(route))
export type StackParamList = {
  Dashboard: undefined;
  Configuracoes: undefined;
  // Stack Início (seções acessadas pelo menu flutuante)
  Servicos: { modo?: 'servicos' | 'pacotes' | 'produtos' } | undefined;
  ServicoForm: { servicoId?: string | null };
  PacoteForm: { pacoteId?: string | null };
  ProdutoForm: { produtoId?: string | null };
  VendaProduto: { clienteId?: string | null } | undefined;
  CentroCusto: undefined;
  CentroCustoForm: { centroCustoId?: string | null };
  // Agenda
  Agenda: undefined;
  AgendamentoForm: { agendamentoId?: string | null; clientePreset?: string | null } | undefined;
  // Clientes
  Clientes: undefined;
  ClienteConsulta: { clienteId: string };
  ClienteForm: { clienteId?: string | null };
  ClienteHistorico: { clienteId: string };
  ClientePacotes: { clienteId: string };
  VendaPacote: { clienteId?: string | null } | undefined;
  // Financeiro
  Financeiro: undefined;
  ContaForm: { contaId?: string | null; tipoPreset?: 'pagar' | 'receber' } | undefined;
};

// Params das abas (navegação cruzada: navigate('AgendaTab', { screen, params }))
export type TabParamList = {
  DashboardTab: NavigatorScreenParams<StackParamList>;
  AgendaTab: NavigatorScreenParams<StackParamList>;
  ClientesTab: NavigatorScreenParams<StackParamList>;
  FinanceiroTab: NavigatorScreenParams<StackParamList>;
};