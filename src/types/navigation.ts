import type { NavigatorScreenParams } from '@react-navigation/native';

// Params de cada tela dos stacks das abas.
// | undefined = tela sem params (evita erro ao navegar com navigate(route))
export type StackParamList = {
  Dashboard: undefined;
  Configuracoes: undefined;
  Agenda: undefined;
  AgendamentoForm: { agendamentoId: string | null; clientePreset?: string | null } | undefined;
  Clientes: undefined;
  ClienteConsulta: { clienteId: string } | undefined;
  ClienteForm: { clienteId: string | null } | undefined;
  ClienteHistorico: { clienteId: string } | undefined;
  ClientePacotes: { clienteId: string } | undefined;
  VendaPacote: { clienteId: string | null } | undefined;
  Financeiro: undefined;
  ContaForm: { contaId: string | null; tipoPreset?: 'pagar' | 'receber' } | undefined;
  CentroCusto: undefined;
  CentroCustoForm: { centroCustoId: string | null } | undefined;
  Servicos: undefined;
  ServicoForm: { servicoId: string | null } | undefined;
  PacoteForm: { pacoteId: string | null } | undefined;
};

// Params das abas (navegação cruzada: navigate('AgendaTab', { screen, params }))
export type TabParamList = {
  DashboardTab: NavigatorScreenParams<StackParamList>;
  AgendaTab: NavigatorScreenParams<StackParamList>;
  ClientesTab: NavigatorScreenParams<StackParamList>;
  ServicosTab: NavigatorScreenParams<StackParamList>;
  FinanceiroTab: NavigatorScreenParams<StackParamList>;
  CentroCustoTab: NavigatorScreenParams<StackParamList>;
};