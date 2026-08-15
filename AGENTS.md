# AGENTS.md — Manicure App 💅

Documentação de referência do projeto para agentes de IA (e para o próprio desenvolvimento).
Este arquivo deve ser lido antes de fazer qualquer mudança no código.

---

## Visão geral

Aplicativo mobile em **React Native (Expo)** para gestão de manicures/nail designers
autônomas. Permite:

- Agenda de agendamentos (próximos 7 dias / hoje / todos) com status (agendado, concluído, cancelado) e geração automática de conta a receber.
- Cadastro e busca de clientes, com histórico de atendimentos e pacotes vigentes.
- Serviços e **Pacotes** (com venda com desconto, controle de saldo de serviços e baixa por agendamento).
- **Financeiro** (a receber / a pagar) com pagamento parcial/total, status pendente/quitado e reversão.
- **Centros de custo** (categorias de receita/despesa) com total consolidado.
- **Dashboard** com resumo financeiro, estatísticas rápidas e próximos agendamentos.

Os dados são **local-first** (async storage) — o app funciona 100% offline. Há
**espelho opcional em nuvem** (Supabase + login Google) ativado em
Configurações > Conta e sincronização (ver seções "Backup/Sincronização" e o guia
`SUPABASE_SETUP.md`). O código está pronto; a ativação depende de configurar o
projeto Supabase (URL + anon key em `src/utils/supabase.js`) — pendente.

---

## Tecnologias e ferramentas

| Categoria | Escolha | Versão |
|-----------|---------|--------|
| Framework | **Expo** (managed) | 54.0.2 |
| UI/Plataforma | **React Native** | 0.81.4 |
| Linguagem | **React 19.1.0** | JS (CommonJS default) |
| Navegação | `@react-navigation/native` + `bottom-tabs` + `native-stack` | 7.x |
| Persistência | `@react-native-async-storage/async-storage` | 2.2.0 |
| Notificações locais | `expo-notifications` | 0.32.17 |
| Gradientes | `expo-linear-gradient` | ~15.0.8 |
| Atualizações OTA | `expo-updates` (+ EAS Update) | ~1.0.2 |
| Cripto/polyfill (PKCE login) | `expo-crypto` | ~15.0.1 |
| Ícones | `@expo/vector-icons` (Ionicons) | ^15.1.1 |
| Data/Time picker | `@react-native-community/datetimepicker` | 8.4.4 |
| Safe areas | `react-native-safe-area-context` | ~5.6.0 |
| Gestos | `react-native-gesture-handler` | ~2.28.0 |
| Navegação por gestos/screens | `react-native-screens` | ~4.16.0 |
| Status bar / nav bar | `expo-status-bar`, `expo-navigation-bar`, `expo-font` | — |
| Babel | `babel-preset-expo` | ~54.0.12 |
| Tipos | **TypeScript** (`typescript`, `@types/react`) | ~5.9.2 (devDependencies) |

> Dependências adicionadas depois: **`expo-linear-gradient`** (via `npx expo install`) foi a base da estilização com gradientes.

---

## Estrutura do projeto

```
manicure-app/
├── App.tsx                    # Entry point: providers + tela de loading com logo
├── app.json                   # Configuração do Expo
├── babel.config.js
├── tsconfig.json              # TypeScript (strict) — extends expo/tsconfig.base
├── README.md                  # Docs em nível de produto
├── AGENTS.md                  # Este arquivo
├── src/
│   ├── context/
│   │   └── DataContext.tsx    # Estado global + persistência (AsyncStorage) + regras de negócio
│   ├── components/            # Componentes reutilizáveis (ver seção própria; ainda .js)
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Bottom tabs + 6 stacks
│   ├── screens/               # 19 telas (ver seção própria; misto .tsx/.js — migração em andamento)
│   ├── theme/
│   │   └── colors.ts          # Paleta, spacing, radius, typography
│   ├── types/                 # Tipos compartilhados
│   │   ├── entities.ts        # Cliente, Agendamento, Conta, Servico, Pacote...
│   │   └── navigation.ts      # StackParamList + TabParamList
│   └── utils/
│       ├── format.ts          # Moeda, telefone, %, datas, máscaras
│       ├── notifications.js   # Agendamento de notificações locais (resumo diário + lembrete)
│       └── storage.ts         # Chaves AsyncStorage + load/save helpers
```

---

## Como rodar

```bash
npm install
npx expo start          # inicia Metro e gera QR Code
npx expo start --android
npx expo export --platform android   # valida o bundle (usado como smoke test)
```

**Validação sem rodar o app** (usado ao final de cada mudança):
- Sintaxe JS: `node --check <arquivo>`
- Tipos TS: `npx tsc --noEmit` (para arquivos `.ts`/`.tsx`)
- Bundle: `npx expo export --platform android` (gera `dist/`)

> Mudanças relacionadas a nativo (ex.: `expo-linear-gradient`, `statusBarTranslucent`)
> podem exigir **reload/rebuild** do app para refletir.

---

## Estado global / regras de negócio (`src/context/DataContext.js`)

`DataProvider` expõe tudo via `useData()`. Entidades:

- **clientes**: `{ id, nome, telefone, email, observacoes, notes, createdAt }`
- **agendamentos**: `{ id, clienteId, data, hora, servicos: string[], servico (legado), valor, sinal, sorteio, status, observacoes, pacoteVendaId, createdAt }`
- **contas** (Financeiro): `{ id, tipo: 'pagar'|'receber', descricao, valor, vencimento, centroCustoId?, clienteId?, agendamentoId?, status: 'pendente'|'quitado', valorPago, dataPagamento }`
- **centrosCusto**: `{ id, nome, tipo: 'receita'|'despesa'|'ambos', descricao }`
- **servicos**: `{ id, nome, valor }`
- **pacotes**: `{ id, nome, valor, servicos: [{ servicoId, qtd }] }`
- **pacotesVendidos**: `{ id, pacoteId, clienteId, vendidoEm, valor, desconto, servicos: [{ serviçoId, qtd }] }` (qtd = **saldo restante**)

Principais funções ligadas a pacotes:
- `venderPacote(clienteId, pacoteId, desconto = 0)` — cria venda com `valor` final (após desconto) e `desconto`, e gera uma conta a receber. `valorFinal = pacote.valor - desconto`.
- `debitarPacote(pacoteVendaId, servicoIds)` — debita 1 unidade de cada serviço usado.
- `restaurarPacote(pacoteVendaId, servicoIds)` — devolve unidades ao editar/excluir agendamento de pacote.
- `pacotesAtivosDoCliente(clienteId)` — vendas com saldo (`qtd > 0`).
- `totalQtdVenda(venda)`, `pacoteUsadoCount`, `pacoteUsadoCountFor`.

Regras:
- Agendamento pode gerenciar conta a receber automaticamente (opção no formulário, ativa por padrão).
- `pagarConta` admite pagamento **parcial** (soma `valorPago`, marca quitado quando >= valor).
- `marcarContaStatus(id, 'pendente')` = **reverter** (zera `valorPago`).

Persistência: cada estado tem `useEffect` que grava no AsyncStorage somente após o carregamento inicial (`hasLoaded.current`). Há **seed** de centros de custo padrão na primeira execução (chave `SEEDED`).

---

## Navegação (`src/navigation/AppNavigator.tsx`)

- **4 abas** (Bottom Tabs): **Início (DashboardTab)**, **Agenda (AgendaTab)**, **Clientes**, **Financeiro**.
  (As abas **Serviços** e **Centro de Custo/Categorias** foram removidas; o acesso é pelo **FAB em leque**
  `SpeedDial`, **disponível em todas as telas**, flutuando sobre a tab bar.)
- Cada aba é uma `Stack`. No **stack do Início** ficam: `Dashboard`, `Configuracoes`, `Servicos` (toggle
  Serviços/Pacotes/Produtos), `ServicoForm`, `PacoteForm`, `ProdutoForm`, `VendaProduto`, `CentroCusto`,
  `CentroCustoForm`. No stack de **Clientes**: `ClienteConsulta/Form/Historico/Pacotes` + `VendaPacote`.
- **SpeedDial** (`src/components/SpeedDial.tsx`): FAB em leque com gradiente `primary→accent`; **montado
  globalmente** no `AppNavigator` (após o `Tab.Navigator`, `bottomOffset` = altura da tab bar). Painel em
  `ScrollView` (maxHeight 70%) renderiza as ações **em ordem inversa** (`Novo Agendamento` fica na base,
  perto do FAB); área de clique = só o ícone+texto (`alignSelf: 'flex-start'`). Ações: Novo Agendamento,
  Cadastrar Cliente, Vender Pacote, Serviços & Pacotes, Produtos, Nova Conta e Categorias (navegação
  cruzada via `createNavigationContainerRef<TabParamList>()`).
- **Botão "Sair" global**: `headerRight` padrão em `useStackScreenOptions()` (`irParaRaizDaAba()`).
  `irParaRaizDaAba` **não usa `goBack()`** (o `goBack` no tab navigator cai no `backBehavior: 'firstRoute'`
  e joga para o Início sem desempilhar a tela). Ele faz `getRootState()` → rota focada → **`StackActions.popToTop()`
  com `target` = `route.state.key` do stack da aba** (reset limpo, sem deixar telas "mortas" empilhadas);
  fallback para `CommonActions.navigate` à tela-raiz (`TAB_ROOT_SCREEN`: Dashboard/Agenda/Clientes/Financeiro)
  quando não há estado aninhado. Telas-raiz (Dashboard, Agenda, Clientes, Financeiro) sobrescrevem com
  `headerRight: () => null`. **Nenhuma tela define `headerRight` próprio** (AgendamentoForm já não sobrescreve —
  o global cuida; o motivo do antigo `sairDoForm` era o `goBack` quebrado).
- **Clique na aba já focada = volta para a raiz da aba**: `screenListeners` no `Tab.Navigator` com handler de
  `tabPress` — se a aba pressionada (`e.target`) é a aba já focada, chama `irParaRaizDaAba()` (ex.: de
  `AgendamentoForm`, tocar em "Agenda" na navbar → volta para `Agenda`). Sem isso o bottom-tabs v7 **não faz
  nada** ao re-pressionar a aba focada (o `onPress` interno só navega quando `!focused`).
- Navegação cruzada entre abas (ex.: telas do stack de Agenda → ClientesTab) via
  `navigation.getParent<BottomTabNavigationProp<TabParamList>>()`.
- Opções de stack via `useStackScreenOptions()` (header claro, sem sombra, `contentStyle` de fundo).
- **Android**: `statusBarTranslucent: true` (substitui o antigo `headerStatusBarHeight`, que **não funciona** no native-stack 7.18.6 — ver bugs).
- Título das abas centralizado com ícones Ionicons (`focused` = filled / outline).

---

## Telas (`src/screens/`)

| Tela | Responsabilidade |
|------|------------------|
| `DashboardScreen` | Hero gradiente + logo, stats a receber/pagar/saldo, QuickStats (Clientes/Hoje/Pendências), "Próximos agendamentos". |
| `AgendaScreen` | SectionList por data, filtro Próximos 7 dias / Hoje / Todos, hora/serviço/valor/status. |
| `AgendamentoFormScreen` | Criar/editar agendamento: **qtds de serviço** (`StepperList`), **venda de produtos** (baixa estoque), **adicional livre**, valor automático (soma), **uso de pacote** (saldo limitado), **pop-up de conflito de horário**, modal "Gerar conta a receber?". |
| `ClientesScreen` | Lista + busca por nome/telefone. |
| `ClienteConsultaScreen` | Ficha da cliente, resumo de agendamentos/recebimento, **seção de pacote vigente**. |
| `ClienteHistoricoScreen` | Histórico de atendimentos. |
| `ClientePacotesScreen` | Pacotes da cliente (`nomePacoteVenda`; excluir avisa sobre conta vinculada). |
| `ClienteFormScreen` | Cadastro/edição/exclusão de cliente. |
| `ServicosScreen` | Toggle **Serviços / Pacotes / Produtos** com listas + botão **Vender** (produto). |
| `ServicoFormScreen` | CRUD de serviço. |
| `PacoteFormScreen` | CRUD de pacote (serviço + qtd + valor). |
| `ProdutoFormScreen` | CRUD de produto (nome, preço, estoque). |
| `VendaProdutoScreen` | Vende produtos a uma cliente (gera conta a receber + baixa estoque). |
| `VendaPacoteScreen` | Vende pacote com **desconto** (% ou R$); toggle **catálogo × montar na venda** (pacote personalizado). |
| `FinanceiroScreen` | Contas a pagar/receber, filtro por status, pagamento (modal), reverter. |
| `ContaFormScreen` | CRUD de conta com centros de custo + cliente opcional. |
| `CentroCustoScreen` | Categorias com quantidade e total. |
| `CentroCustoFormScreen` | CRUD de categoria. |
| `SettingsScreen` | Configurações: switch liga/desliga notificações locais (acessível pela engrenagem do hero do Dashboard). |

---

## Componentes (`src/components/`)

| Componente | Descrição |
|------------|-----------|
| `Button` | Variante `primary` com **LinearGradient** + animação de press (Animated scale). |
| `Fab` | Floating action button com gradiente `primary→accent` + press animation. |
| `Screen` | Wrapper com animação de entrada (fade + translateY); bordas `['left','right']` (sem `top`, para não duplicar inset). |
| `ScreenTitle` | Título grande + **linha de acento gradiente** embaixo (usado nas listas). |
| `Card` | Superfície com borda. |
| `Input` | Campo com máscara (tipo de imagem). |
| `DateField`, `TimeField` | Pickers de data/hora. |
| `SelectField` | Select simples. |
| `MultiSelect`, `MultiSelectField` | Seleção múltipla (serviços). |
| `SegmentedControl` | Alternador de segmentos (estilo Material). |
| `StatusBadge` | Badge de status (agendado/concluído/cancelado; pendente/quitado). |
| `EmptyState` | Estado vazio com ícone sobre fundo **gradiente**. |
| `Logo` | Logo vetorial: círculo `LinearGradient` + anel + brilho + ícone `brush` + nome opcional (`showName`). |
| `Toast` | `ToastProvider` + hook `useToast().showToast(msg, type)` — topo da tela, animado, 2,6s, tipos `success`/`error`/`info`. |
| `AppModal` | Bottom sheet com título/ícone + backdrop. **Overlay in-screen** (absoluto dentro da tela, não é RN `Modal`) para o header nativo permanecer tocável; `BackHandler` fecha no voltar do Android. Usado nos modais de conflito/"Gerar conta?" do `AgendamentoForm`. |
| `NotificationSync` | Componente invisível dentro do `DataProvider` que reage a `agendamentos`/`clientes` e sincroniza notificações locais. |

---

## Temas (`src/theme/colors.js`)

Identidade "rosé/dourada":
- `primary: #A64D6B` (rosa), `primaryDark: #7D3752`, `primaryLight: #F5DCE4`
- `accent: #C9974C` (dourado)
- `background: #FFF9FB`, `surface: #FFFFFF`, `surfaceAlt: #FBEFF2`
- Texto: `textPrimary #2E2126`, `textSecondary #8A7480`, `textInverse #FFFFFF`
- Semânticos: `success`/`warning`/`danger`/`info` + variações `*Light`.

Tokens: `spacing` (xs 4 … xl 32), `radius` (sm 8, md 14, lg 20, pill 999), `typography`.

**Gradientes** usam sempre o par `[colors.primary, colors.accent]`.

---

## Utilidades (`src/utils/format.js`)

- `formatCurrency`, `maskCurrency`/`maskCurrencyInput` (moeda centavos, pt-BR)
- `maskPercent` (0–100%)
- `maskPhone` (BR)
- `parseCurrencyInput` (aceita "1.234,56", "R$ 50,00"…)
- `dateToISO`/`isoToDate`/`todayISO`/`timeToString`
- `formatDateBR` (`DD/MM/AAAA`), `formatDateShortWeekday` (`Seg, 05/08`), `isPast`
- `generateId(prefix)` — ids únicos

`utils/storage.js`: `STORAGE_KEYS` + `loadItem`/`saveItem` com `JSON.parse`.

`utils/notifications.js`: agendamento de **notificações locais** (`expo-notifications`).
- `initNotifications()` — handler de foreground (banner/lista/som).
- `ensureNotificationChannel()` — canal Android `agendamentos` (importância HIGH).
- `ensurePermissions()` — pede permissão (Android 13+/iOS).
- `isNotificationsEnabled()` / `setNotificationsEnabled()` — switch persistido em `STORAGE_KEYS.NOTIFICACOES_ENABLED` (default **ligado**).
- `syncNotifications(agendamentos, clientes, servicos)` — **cancel-all + re-agenda**: lembrete **1h antes** de cada agendamento futuro não cancelado e **resumo diário às 06:00** (`SUMMARY_HOUR`) dos **próximos 7 dias** (`SUMMARY_DAYS_AHEAD`), com corpo listando hora + cliente + serviço.
- `cancelAllNotifications()`.

> Conteúdo de notificações é fixo no agendamento; por isso o padrão é re-agendar (cancelar tudo e recriar) a cada mudança nos dados. As notificações são **locais** (só no aparelho da manicure) e funcionam no Expo Go.

---

## Bugs resolvidos (histórico importante)

1. **Header abaixo da barra de notificações / título muito afastado.**
   - Causa: `@react-navigation/native-stack` 7.18.6 **removida/ignora** a opção `headerStatusBarHeight` (vira cógigo morto).
   - Fix: `statusBarTranslucent: true` (Android) no `useStackScreenOptions()`; `Screen` com `edges={['left','right']}` para não duplicar o inset superior; recarregar app para propagar.
2. **Quebra de linha do horário no badge do Dashboard (Próximos Agendamentos).**
   - Causa: `width: 56` fixo + padding comprimia o horário, causando quebra.
   - Fix: `minWidth: 72` + `flexShrink: 0` (horário sempre em uma linha).
3. **Íconos de lista (Button/Fab) sem feedback visual.**
   - Fix: adicionado press animation (Animated) e gradientes (`expo-linear-gradient`).
4. **Nenhum retorno visual após ações CRUD.**
   - Fix: sistema de `Toast` global + chamadas `useToast().showToast(...)` em todos os formulários e no Financeiro.

---

## Pendências de produto (próximos passos agendados)

- [ ] Notificações push para lembrar clientes de agendamentos. *(Notas: os lembretes locais atuais são para o aparelho da manicure; push para clientes exigiria backend e tokens.)*
- [ ] Exportar relatórios financeiros (PDF/Excel).
- [ ] Foto de perfil da cliente.

> **Sincronização em nuvem**: implementada em código (backup/import + Supabase com login Google).
> Falta apenas configurar o projeto Supabase (URL/key + tabela `registros` + provider Google) —
> ver seção **Sessão: Backup + Sincronização (Supabase)** abaixo.

> Ver também a seção **Observações pendentes** no final.

---

## Convenções de código

- **JS (CommonJS), sem TypeScript.** Sem semicolons obrigatórios; usar estilo do arquivo vizinho.
- **NÃO adicionar comentários** salvo se solicitado (o código atual tem poucos e só onde ajuda).
- Estado global sempre via `useData()` (nunca regras de negócio no componente).
- Espaçamentos, radius e cores sempre importados de `theme/colors.js` (nunca hardcoded), exceto gradientes e `rgba(...)`.
- Feedback pós-ação de sessão: usar `useToast()` (`success` = sucesso default, `error` = exclusões, `info` = avisos).
- Telas de lista usam `ScreenTitle` para o cabeçalho e `EmptyState` para lista vazia.
- Ícone de telas e campos: sempre Ionicons.

---

# Última Sessão

Resumo de tudo o que foi feito nesta sessão de estilização visual + feedback CRUD + logo:

## Instalação
- Adicionado **`expo-linear-gradient`** via `npx expo install` (base dos gradientes).

## Novos componentes
- **`src/components/Logo.js`** — logo vetorial gradiente (círculo `primary→accent`, anel, brilho, ícone `brush`, opção `showName`).
- **`src/components/Toast.js`** — `ToastProvider` + hook `useToast()`; toast animado no topo, dura ~2,3s, tipos `success`/`error`/`info`.
- **`src/components/ScreenTitle.js`** — título grande com linhas de acento gradiente embaixo.

## Componentes redesenhados
- **`Button`** — variante `primary` com gradiente + latência de press (Animated scale).
- **`Fab`** — gradiente `primary→accent` + press animation.
- **`Screen`** — animação de entrada (fade + translateY); `edges={['left','right']}`.
- **`EmptyState`** — ícone de fundo com gradiente.

## Telas e integração
- **`App.js`** — adicionado `ToastProvider`; tela de loading agora exibe o **Logo** + ActivityIndicator.
- **`DashboardScreen`** — reescrito: hero `LinearGradient` com Logo, stats (a receber / a pagar / saldo), `QuickStat` (Clientes/Hoje/Pendências), seção "Próximos agendamentos" com dot gradiente e badge de hora gradiente; **corrigido o badge de horário** para não quebrar a linha (`minWidth: 72`, `flexShrink: 0`).
- **Títulos das listas** (Clientes, Agenda, Serviços & Pacotes, Financeiro, Centros de Custo) passaram a usar `ScreenTitle`.

## Feedback CRUD (toasts) adicionados
- `ClienteFormScreen`: "Cliente cadastrada"/"atualizada"/"excluída".
- `ServicoFormScreen`: "Serviço cadastrado"/"atualizado"/"excluído".
- `PacoteFormScreen`: "Pacote cadastrado"/"atualizado"/"excluído".
- `AgendamentoFormScreen`: "Agendamento realizado"/"atualizado"/"excluído".
- `ContaFormScreen` e `CentroCustoFormScreen`: cadastro/atualização/exclusão.
- `VendaPacoteScreen`: "Pacote vendido".
- `FinanceiroScreen`: "Pagamento/Recebimento registrado" e reversão ("Conta revertida para pendente", `info`).

## Validação
- `node --check` em todos os arquivos alterados + `npx expo export --platform android` (bundle OK, ~1058 módulos) no final da sessão.

---

## Observações pendentes

### 1. ~~Filtro por período definido e personalizado no Dashboard e no Financeiro~~ ✔ (implementado — ver "Última Sessão (atual)")

---

## Sessão: Filtro de período + backup no aparelho + detalhe do agendamento

Implementações desta sessão:

### Filtro de período (Dashboard + Financeiro)
- **Novo componente:** `src/components/PeriodFilter.js` — chips horizontais **Todos / Hoje / Ontem / Amanhã / Essa Semana / Esse Mês / Período** (personalizado abre dois `DateField` "De"/"Até").
- **Novos helpers em `src/utils/format.js`:** `periodRange(key, customStart, customEnd)` (retorna `{start, end}` ISO; `null` = todos) e `contaInPeriodo(conta, range)` (considera `vencimento` **ou** `dataPagamento`).
- **DashboardScreen:** filtro aplicado ao resumo a receber/a pagar/saldo (`resumo`, via `contaInPeriodo`). `value` = `null` por padrão (Todos).
- **FinanceiroScreen:** filtro aplicado à lista e aos totais (pendente/quitado), combinado com os filtros de tipo e status existentes.

### Salvar backup no aparelho (SAF)
- **`src/utils/backup.js`:** nova `salvarBackupNoDispositivo()` — usa `StorageAccessFramework` (`expo-file-system/legacy`) para abrir o seletor de pasta (ex.: Downloads) e gravar o `.json` em local **visível**. Android apenas (iOS lança erro com orientação).
- **SettingsScreen:** card de backup agora tem **Compartilhar**, **Salvar no celular** e **Importar**. Resolve o caso do arquivo "sumir" ao compartilhar (WhatsApp guarda o anexo na conversa, não no Downloads).

### Detalhe do agendamento a partir do Dashboard
- **Nova tela:** `src/screens/AgendamentoDetalheScreen.js` — dados do agendamento (cliente, serviços, data/hora, valores, sinal, sorteio, observações, conta vinculada, pacote usado), troca de status (Agendado/Concluído/Cancelado), editar e excluir.
- **DashboardScreen:** cards de "Próximos agendamentos" são `TouchableOpacity` → `navigation.navigate('AgendamentoDetalhe', { agendamentoId })`.
- **AppNavigator:** `AgendamentoDetalhe` registrado no stack do Dashboard. A edição redireciona para `AgendaTab/AgendamentoForm`.

### Excluir pacote vendido (sem uso)
- **`DataContext`:** `pacoteVendaUsadoCount(id)` (conta agendamentos com `pacoteVendaId`) e `deletePacoteVenda(id)`.
- **ClientePacotesScreen:** ícone de lixeira em cada pacote; **liberado apenas quando não há agendamento usando o saldo** (senão fica desabilitado com aviso "Em uso em N agendamento(s)"). Exclusão com `Alert` de confirmação + Toast.

### Remoção de títulos duplicados (header)
- Removidos os `ScreenTitle` internos de **Agenda, Clientes, Financeiro, Serviços & Pacotes, Centro de Custo** (o título já vem do header do navigator). Sub-títulos (ex.: "Cadastre os serviços...") foram mantidos e o `marginTop` negativo deles ajustado.

## Validação
- `node --check` em todos os arquivos alterados + `npx expo export --platform android` (bundle OK, 1294 módulos).

---

# Última Sessão (atual) — Ajustes UX (Rodada 1 + Rodada 2) + fixes de navegação

## Rodada 1 — fluxo de seleção/valor/menu (validado; tsc 0, export 1300 módulos)
- **Novo componente `CheckboxStepper.tsx`**: checklist + stepper de quantidade **apenas nos selecionados**
  (não lista todos com qtd 0). Usado em AgendamentoForm, VendaPacote e VendaProduto.
- **`maskCurrencyDec`** em `utils/format.ts` (máscara com 2 casas decimais; **depois substituída pela
  máscara com estado — ver Rodada 2**).
- **AgendamentoFormScreen**: Valor automático (`useEffect` soma serviços×qtd + produtos×qtd + adicional)
  com opção "Usar soma total" quando editado; switch "Gerar conta a receber" **removido** (decisão só no
  modal de confirmação); Adicional movido para baixo do Valor.
- **SpeedDial reescrito**: FAB à esquerda (`left:20`, ícone `menu`/`close`), painel em `ScrollView`.
- **`MultiSelect.js`**: tipado via JSDoc (`MultiSelectOption`).

## Rodada 2 — correções (tsc 0, export OK, fingerprint `5324463898…` inalterado)
1. **Menu FAB**: ordem **invertida** no `ScrollView` (`[...actions].reverse()` — "Novo Agendamento" na
   base, perto do FAB); **disponível em todas as telas** (montado globalmente no `AppNavigator` com
   `bottomOffset = 62 + insets.bottom`, flutuando sobre a tab bar); área de clique **só o ícone+texto**
   (`alignSelf: 'flex-start'`). Removido `useNavigation` do componente (não é mais usado e agora ele é
   renderizado fora do `NavigationContainer`).
2. **Botão "Sair" global**: `headerRight` em `useStackScreenOptions()` via `sairDaTela()`
   (inicialmente `goBack()`; **depois trocado por navegação para a tela-raiz da aba — ver fixes abaixo**);
   telas-raiz ocultam com `headerRight: () => null`. AgendamentoForm mantém o próprio Sair, que sobrescreve o global.
3. **CheckboxStepper → combobox multivalores**: usa **`MultiSelectField`** (gatilho mostra os
   selecionados, modal com checkboxes reutilizando `MultiSelect`). Novos props `label`/`placeholder`;
   labels movidos das telas para o componente. `MultiSelectField.js` tipado via JSDoc (`MultiSelectOpt`).
4. **Campo Adicional corrigido (máscara com estado)**: antes, `maskCurrencyDec("R$ 2,0")` reinterpretava a
   última vírgula como decimal → travava em 2,00. Agora `adicionalMask` ref (`{int, dec, sep, seeded}`) +
   `handleAdicionalChange`: dígito evolui a parte inteira (2→20→200), vírgula inicia os centavos (2 dígitos),
   backspace reverte; fallback para `parseCurrencyInput` em edição no meio do texto.

## Fixes pós-rodada 2
- **Área de scroll do menu FAB** (`SpeedDial.tsx`): "Novo Agendamento" (item da base) ficava escondido.
  Causa: `ScrollView` não encolhia dentro do painel com `maxHeight` — o conteúdo estourava para fora da
  tela. Fix: `maxHeight: height * 0.88` + `style={styles.scrollView}` com **`flexShrink: 1`** no `ScrollView`
  (rolando dentro da área visível).
- **Sair do AgendamentoForm levava ao Início** (`AppNavigator.tsx` + `AgendamentoFormScreen.tsx`): o
  `goBack()` no tab navigator caía no `backBehavior: 'firstRoute'` → Início **sem desempilhar** o
  formulário (ficava preso na aba Agenda). Fix: `sairDaTela()` usa `getRootState()` → aba focada →
  `CommonActions.navigate` para a **tela-raiz da aba** (`TAB_ROOT_SCREEN`: Dashboard/Agenda/Clientes/
  Financeiro), desempilhando a pilha; `sairDoForm` → `popToTop()` se `canGoBack`, senão
  `navigate('AgendaTab', { screen: 'Agenda' })`.

## Validação (sessão completa)
- `npx tsc --noEmit`: 0 erros.
- `npx expo export --platform android`: bundle OK (último: `AppEntry-83f46f…`, 4 MB).
- Fingerprint: `5324463898446a60971b8fb1a468d0db4602f3f8` **inalterado** (só JS; sem mudanças nativas).
- `node --check` nos `.js` alterados (`.tsx` checados via tsc).

---

# Sessão: Notificações locais

Implementação de notificações locais para o aparelho da manicure (nenhum backend).

## Dependência
- **`expo-notifications` 0.32.17** instalado via `npx expo install expo-notifications` (compatível SDK 54).

## Novos arquivos
- **`src/utils/notifications.js`** — toda a lógica de notificações (ver seção `utils/notifications.js` acima).
- **`src/components/NotificationSync.js`** — componente invisível dentro de `DataProvider`: no mount faz `initNotifications()` + canal + permissão (automática, Android 13+/iOS) e re-sincroniza sempre que `agendamentos`/`clientes`/`servicos` mudam **e quando o app volta ao primeiro plano** (`AppState`). Sincronizações são **serializadas** (fila de promises) para evitar corrida entre cancel-all + re-agenda.
- **`src/screens/SettingsScreen.js`** — tela de Configurações com **switch** liga/desliga notificações (persistido em `@manicure_app:notificacoes_enabled`, default ligado). Ao ligar, pede permissão e sincroniza; ao desligar, cancela tudo. Inclui **Diagnóstico**: status da permissão, lista das notificações agendadas (`getScheduledNotifications`) e botões **"Requerer permissão"** e **"Testar em 10s"** (`scheduleTestNotification`).

## Comportamento das notificações
1. **Lembrete 1h antes** de cada agendamento futuro com `status !== 'cancelado'`: título `"Cliente às HH:mm"`, corpo com o serviço.
2. **Resumo do dia às 06:00** (`SUMMARY_HOUR = 6`) para os **próximos 7 dias** (`SUMMARY_DAYS_AHEAD = 7`): título `"Agenda Seg, DD/MM"`, corpo listando `HH:mm - Cliente (Serviço)`.
- Padrão **cancel-all + re-agenda** a cada mudança de dados (conteúdo de notificação é fixo no agendamento).
- Guard: `syncNotifications` só agenda se houver permissão concedida; agendamentos do passado são ignorados.

## Integração
- **`App.js`**: `<NotificationSync />` dentro do `DataProvider`.
- **`AppNavigator.js`**: tela `Configuracoes` adicionada ao stack do Dashboard.
- **`DashboardScreen.js`**: botão de **engrenagem** no hero (gradiente) que abre as Configurações.
- **`app.json`**: plugin `expo-notifications` com `color: "#A64D6B"` e permissão `SCHEDULE_EXACT_ALARM` (build nativo; no Expo Go usa o config do Expo Go).

## Validação
- `node --check` em todos os arquivos alterados + `npx expo export --platform android` (bundle OK, 1197 módulos).

---

# Sessão: Backup/Import + Sincronização em nuvem (Supabase)

Backup manual em JSON + sincronização **local-first** com Supabase (login Google).
O app continua 100% offline/local sem conta; a nuvem é um espelho opcional.

## Dependências adicionadas
- `expo-file-system`, `expo-sharing`, `expo-document-picker` — backup JSON.
- `@supabase/supabase-js`, `expo-auth-session`, `expo-web-browser`, `expo-linking` — auth Google + sync.
- `app.json`: adicionado `"scheme": "manicureapp"` (redirect OAuth).

## Backup local (exportar/importar)
- **`src/utils/backup.js`** — `collectSnapshot()`, `exportarBackup()` (gera `.json` na pasta de documentos + `Sharing.shareAsync`), `validateSnapshot()`, `aplicarBackup()` (grava de volta no AsyncStorage) e `lerArquivoBackup(uri)` (parse do `.json` escolhido).
- **`DataContext.restoreSnapshot(dados)`** — substitui os 7 estados de uma vez e persiste (usado no import e no sync).
- **`SettingsScreen`** — card **"Backup de dados"**: botão **Exportar dados** (compartilhar/salvar) e **Importar** (`DocumentPicker` + confirmação). Migração Expo Go ↔ APK feita manualmente por aqui.

## Auth (Supabase + Google)
- **`src/utils/supabase.js`** — placeholders `SUPABASE_URL` e `SUPABASE_ANON_KEY` (vazios por padrão; `isSupabaseConfigured()`). `createClient` com `auth.storage = AsyncStorage` (sessão persistida localmente). `signInWithGoogle()` via `WebBrowser.openAuthSessionAsync` → `supabase.auth.exchangeCodeForSession`. `signOut()`.
- **`src/context/AuthContext.js`** — `user`, `carregando`, `signInWithGoogle`, `signOut`, `supabaseConfigurado`. Restaura a sessão no boot (`getSession` + `onAuthStateChange`).
- Login **opcional**, feito só no Settings (card **"Conta e sincronização"**). Sem conta, nada muda no comportamento atual.

## Sync local-first (Supabase)
- **`src/context/SyncContext.js`** (`SyncProvider` + `useSync`) — orquestra tudo:
  - **Pull+merge**: `mergeLocalRemote` faz last-write-wins por registro via `updatedAt` (nunca remove local; adiciona o que falta e substitui o que é mais novo no remoto).
  - **Push**: `pushChanges` faz `upsert` dos registros locais mais novos que o remoto e **deleta** no remoto registros que foram apagados localmente (**tombstones** — ids detectados sumindo das listas).
  - Dispara no **login** (`user?.id`), ao **voltar ao primeiro plano** (`AppState`) e após **mudanças locais** (debounce 2s).
  - `restoreSnapshot` só roda se o merge **mudou algo** (comparação JSON) — evita loop de re-sync.
  - Expõe `syncing`, `ultimaSync`, `ultimoErro`, `syncNow()` e `configurado`.
- **`src/utils/sync.js`** — `ENTITIES`, `loadSyncMeta`/`saveSyncMeta`, `fetchRemote`, `mergeLocalRemote`, `computePushPlan`, `pushChanges`.
- **`DataContext`** — todos os `add*/update*` (e `pagarConta`, `marcarContaStatus`, `debitar/restaurarPacote`, `venderPacote`) carimbam **`updatedAt`** (base do last-write-wins).
- **`storage.js`** — nova chave `SYNC_META` (`@manicure_app:sync_meta` → `{ lastSyncAt, tombstones }`).
- **`App.js`** — ordem de providers: `DataProvider > AuthProvider > SyncProvider > NotificationSync + ToastProvider`.

## Configuração do Supabase (para ativar a nuvem)
- Seguir o guia passo a passo **`SUPABASE_SETUP.md`** (criado na sessão de cloud storage).
- O script SQL pronto está em **`supabase.sql`** na raiz (cria tabela `registros` + índices + RLS):
  1. Criar projeto em https://supabase.com; copiar **Project URL** + **anon key** (Settings > API) para `src/utils/supabase.js`.
  2. **SQL Editor** → colar `supabase.sql` → Run (cria `registros` `(user_id, entidade, id)` + políticas RLS `auth.uid()`).
  3. **Auth > Providers**: habilitar **Google** com Client ID/Secret (criar via *Create new client*, grátis).
  4. Adicionar o URI de redirect (`redirect_to`) no allowlist do Auth (no Expo Go é o `exp://…`; em build standalone é `manicureapp://…`).
  5. Rebuild/reload do app (novos módulos nativos + `scheme`).

> Nota: o Firestore JS não teria offline no RN; o Supabase escolhido mantém o AsyncStorage como fonte offline real.

> **Hardening PKCE**: `src/utils/supabase.js:34` `signInWithGoogle()` usa fluxo PKCE, que exige `crypto.getRandomValues`. Como o Hermes/APK não tem isso, `App.js` faz o polyfill com `expo-crypto` (`global.crypto.getRandomValues`). Não remover/deslocar esse polyfill antes do `createClient`.

## Validação
- `node --check` em todos os arquivos alterados + `npx expo export --platform android` (bundle OK).

---

# Sessão: Atualizações OTA (EAS Update)

Configurado o **over-the-air (OTA)** para enviar correções de JS **sem rebuild/reenvio de APK**.

## Mudanças
- **`package.json`** — adicionado `expo-updates` (via `npx expo install`).
- **`app.json`** — seção `updates` com `url` + **`runtimeVersion: { "policy": "appVersion" }` no
  topo de `expo`** (migrado de `fingerprint` em 11/08/2026 — ver "Por que `appVersion`" abaixo).
- **`eas.json`** — `cli.appVersionSource: "remote"`; canais por perfil: `preview` (APK interno) e
  `production` (app-bundle/Play Store).

## Rotina
```bash
# APK novo (quando muda nativo/config/permissões OU quando sobe expo.version)
npx eas build -p android --profile preview

# Correção de código JS (telas, lógica, estilos) — sem novo APK
npx eas update --channel preview --platform android
```
Clientes abrem o app e o update baixa sozinho. A **runtime version = `expo.version`** (ex.: `1.0.0`).
**Regra:** mudou código nativo/config/permissões → suba `version` no `app.json` (ex.: `1.0.1`),
rebuild do APK e depois `eas update` (a runtime version acompanha `version`). JS puro → só `eas update`.

## Por que `appVersion` (e não `fingerprint`) — 11/08/2026
- O eas-cli **21.6.0 e 21.7.1 ignoram o `runtimeVersion.policy: "fingerprint"` aninhado em
  `updates.runtimeVersion`**: em todo `eas update` ele re-gravava `android.runtimeVersion:
  {policy: "appVersion"}` no `app.json` (mais permissão `SCHEDULE_EXACT_ALARM` duplicada) e publicava
  com runtime `1.0.0` — que **não era aceito** pelo APK instalado (runtime embutida = fingerprint),
  por isso o app não atualizava (na 1ª tentativa o erro era "Unable to determine runtime version for
  Android").
- Fix: `npx eas update:configure` + mover a política para o **topo** de `expo` (`runtimeVersion:
  {policy: "appVersion"}`) e remover o `updates.runtimeVersion`. Com isso o `eas update` publica
  runtime `1.0.0` e **não altera mais o `app.json`** (verificado). A doc oficial do Expo recomenda
  `appVersion` (o `fingerprint` é "experimental").
- `git checkout app.json` reverte o artefato caso o eas-cli o injete de novo.

## Validação
- `npx expo export --platform android` (bundle OK).

---

# Sessão: Cloud storage (Supabase) — preparação

---

# Sessão: Migração para TypeScript (incremental, em andamento)

Migração **JS → TS** escolhida como **incremental** com `strict: true`. O app continua
funcionando durante a transição: o boom é Babel (`babel-preset-expo` transpila TS).

## Fase 0 — Fundação ✔
- `typescript ~5.9.2` + `@types/react ~19.1.10` em **devDependencies** (via `npx expo install`).
- `tsconfig.json` — `extends: "expo/tsconfig.base"` + `"strict": true`. `allowJs` já vem do base;
  os `.js` restantes não são checados (`checkJs` false) mas seguem funcionando.
- `App.js` → `App.tsx` (git rename; apenas cast no polyfill do `global.crypto`, que é
  **necessário antes de `createClient`** no `supabase`).

## Fases 1–3 ✔ (núcleo + utils/contexts)
- **`src/types/entities.ts`** — tipos das 7 entidades + `DadosApp`/`BackupSnapshot`/`RegistroRemoto`/
  `Tombstone`/`SyncMeta`. Notas de modelagem:
  - `Servico` usa `preco` e `duracao` (não `valor`).
  - `Agendamento` mantém legado: `servico?: string` (texto antigo) **ou** `servicos?: string[]`.
- **`src/context/DataContext.tsx`** — estados tipados; `useData()` retorna `DataContextValue`
  (exportado). Inputs das funções CRUD = `Partial<Omit<Entidade,'id'|'createdAt'|'updatedAt'>>`;
  spreads de `Partial` usam cast `as Entidade` (TS não deduz campos obrigatórios de spread).
- **`src/types/navigation.ts`** — `StackParamList` + `TabParamList` (usar quando as telas virarem TS).
- **`src/navigation/AppNavigator.tsx`** — `useStackScreenOptions(): NativeStackNavigationOptions`
  (contextual typing resolve o `fontWeight`); `ICONS` tipado com `keyof typeof Ionicons.glyphMap`.
- **`src/context/AuthContext.tsx`** / **`src/context/SyncContext.tsx`** — valores de contexto
  tipados (`AuthContextValue`, `SyncContextValue`); `syncingRef`/`debounceRef`/`prevIdsRef`.
- **`src/theme/colors.ts`**, **`src/utils/format.ts`** (novos tipos `MoneyValue`, `PeriodoKey`,
  `PeriodRange`, `ContaPeriodo`), **`src/utils/storage.ts`** (`loadItem<T>`, `STORAGE_KEYS as const`),
  **`src/utils/supabase.ts`** (`supabase: SupabaseClient | null`, `Session`/`User`),
  **`src/utils/sync.ts`** (`DadosApp`/`RegistroRemoto`/`Tombstone`; `computePushPlan(): PushPlan`;
  união de arrays por `ent` resolvida com `(x as { id })` onde o TS não deduz), **`src/utils/backup.ts`**
  (`collectSnapshot(): Promise<BackupSnapshot>`), **`src/utils/notifications.ts`**
  (`syncNotifications(agendamentos, clientes, servicos)` tipado).

## Estado atual
- Convertidos: `App`, `DataContext`, `AuthContext`, `SyncContext`, `AppNavigator`, `theme/colors`,
  `utils/format|storage|supabase|sync|backup|notifications`, `types/*`.
- Componentes em TS: `AppModal`, `Button`, `Card`, `DateField`, `Input`, `QtyStepper`, `Screen`,
  `SegmentedControl`, `SpeedDial`, `StepperList`, `TimeField`, `Toast`.
- Telas em TS: `AgendamentoForm`, `ProdutoForm`, `Servicos`, `VendaPacote`, `VendaProduto`.
- **Ainda `.js`** (convertidos conforme forem tocados): 14 telas, 10 componentes. Importam os `.ts`
  normalmente (misto permitido por `allowJs`).
- Validação contínua: `npx tsc --noEmit` + `npx expo export --platform android`.

## OTA / runtime version (importante)
- **Runtime version = `appVersion` desde 11/08/2026** (migrado de `fingerprint` — ver seção OTA).
  O eas-cli 21.x sobrescrevia o `fingerprint` aninhado em `updates.runtimeVersion` para `appVersion`
  e publicava runtime `1.0.0`, então a política foi movida para o **topo** de `expo`.
- Scripts novos no `package.json` **não alteram mais a runtime version** (deixou de ser `fingerprint`);
  porém ainda entram no fingerprint nativo — evite scripts desnecessários para não forçar rebuild.
- Regra atual: mudou nativo/config/permissões ou subiu `expo.version` → novo APK antes do próximo
  `eas update` (a runtime version acompanha `version`).

## Validação
- `npx tsc --noEmit` (0 erros) + `npx expo export --platform android` (bundle OK) + fingerprint intacto.

---

# Última Sessão (atual) — Ajustes de produto + navegação 4 abas (TypeScript)

Unificação do trabalho de **ajustes de produto** (base de dados + telas novas) com o **TS incremental**.
O fingerprint Android continua `5324463898446a60971b8fb1a468d0db4602f3f8` (só JS variou).

## Base de dados (`DataContext`, `entities`, `storage`, `backup`, `sync`)
- Entidade **`Produto`** (`{ id, nome, preco, estoque }`) + `ProdutoItem { produtoId, qtd }`; `produtos` em
  `DadosApp`, `STORAGE_KEYS`, `DATA_KEYS`/`SNAPSHOT_KEYS`/`ENTITIES`.
- `Agendamento`: novos campos `servicosQtd` (qtd por serviço), `produtos` (venda no ato), `adicional`,
  `duracao`, `sorteio`, `pacoteVendaId`.
- `PacoteVendido`: `pacoteId` pode ser `null` (personalizado) + `nome?` para pacote montado na venda.
- `venderPacotePersonalizado(…)`, `venderProduto(…)` (conta a receber + baixa estoque), `nomePacoteVenda(…)`,
  `debitar/restaurarPacote(…, quantidades?)`, `baixar/restaurarEstoqueProdutos(…)`, `produtoUsadoCount`,
  `deletePacoteVenda` (exclui a conta vinculada), `deleteAgendamento` devolve saldo de pacote e estoque.
- `SyncContext` passou a incluir `produtos` no espelho.

## Nova navegação (4 abas)
- `AppNavigator.tsx`: abas **Início / Agenda / Clientes / Financeiro**. Serviços/Pacotes/Produtos/Categorias
  saíram da barra e viraram rotas do **stack do Início** + **`SpeedDial`** em leque (`HomeSpeedDial`), montado
  **globalmente** (todas as telas, `bottomOffset` = tab bar) com 7 ações (Novo Agendamento, Cadastrar Cliente,
  Serviços & Pacotes, Produtos, Categorias, Vender Pacote, Nova Conta) via
  `createNavigationContainerRef<TabParamList>()`.
- Navigators tipados (`createBottomTabNavigator<TabParamList>()` / `createNativeStackNavigator<StackParamList>()`);
  navegação cruzada entre abas com `navigation.getParent<BottomTabNavigationProp<TabParamList>>()`.

## Telas/componentes (TS)
- Novas telas TS: `ProdutoFormScreen`, `VendaProdutoScreen`, `ServicosScreen` (toggle 3 segmentos + Vender),
  `VendaPacoteScreen` (catálogo × **montar na venda**), `AgendamentoFormScreen` (qtds com `StepperList`,
  venda de produtos, adicional livre, uso de pacote com saldo, pop-up de conflito, modal "Gerar conta a
  receber?").
- Componentes convertidos para `.tsx` (props opcionais tipados): `Button`, `Screen`, `Input`, `DateField`,
  `TimeField`, `Toast` (contexto tipado — corrige `showToast` como `never`), `SegmentedControl` (genérico),
  `Card`. Removidos os `.js` duplicados (AgendamentoForm/VendaPacote/ServicosScreen).
- `ClientePacotesScreen` usa `nomePacoteVenda` (pacotes personalizados) e aviso de que excluir o pacote
  também remove a conta a receber vinculada.

## Validação
- `npx tsc --noEmit` (0 erros) + `npx expo export --platform android` (bundle OK) + fingerprint intacto.

---

# Última Sessão (atual) — Fix de navegação: aba focada volta à raiz + "Sair" confiável

Correções na navegação (todas em `.tsx`; fingerprint nativo intacto, só JS).

## Problemas encontrados
1. **Tocar na aba já focada não fazia nada** — no `@react-navigation/bottom-tabs` v7 o `onPress` de cada aba
   só navega quando a aba **não** está focada (`if (!focused && !event.defaultPrevented)`). De dentro de uma
   tela empilhada (ex.: `AgendamentoForm`), tocar em "Agenda" na navbar não voltava à raiz.
2. **"Sair" do header às vezes não funcionava (principalmente no `AgendamentoForm`)**:
   - O antigo `sairDaTela()` usava `CommonActions.navigate` sem `pop`; no `StackRouter` v7, `navigate` para rota
     já existente **não desempilha** (remove e re-adiciona a rota no topo — `StackRouter.js`), deixando telas
     "mortas" na pilha (o voltar voltava para telas antigas).
   - No `AgendamentoForm`, os modais de **conflito de horário**/"Gerar conta a receber?" eram `RN Modal`
     full-screen (o `AppModal` antigo), cujo backdrop **cobria o header nativo** — o toque no "Sair" caía no
     backdrop (só fechava o modal), parecendo que o botão quebrou.

## Fixes
- **`src/navigation/AppNavigator.tsx`**:
  - Novo helper `irParaRaizDaAba()`: lê `getRootState()` → rota focada → `StackActions.popToTop()` com
    `target` = `route.state.key` do **stack da aba** (reset limpo, sem telas mortas); fallback para o
    `CommonActions.navigate` à tela-raiz quando não há estado aninhado.
  - O `headerRight` global ("Sair") agora chama `irParaRaizDaAba()` (antes `sairDaTela`).
  - `screenListeners` no `Tab.Navigator`: handler de `tabPress` — se `e.target` (aba pressionada) === aba já
    focada, chama `irParaRaizDaAba()` (volta para a raiz da aba). Abas não focadas mantêm o comportamento padrão.
- **`src/screens/AgendamentoFormScreen.tsx`**: removidos o `headerRight` custom e o `sairDoForm` (o "Sair"
  global cuida; título continua definido via `setOptions`). Removido o estilo `sairBtn` morto.
- **`src/components/AppModal.tsx`**: `RN Modal` → **overlay in-screen** (posição absoluta dentro do conteúdo
  da tela, `zIndex` 10) com fade (`Animated`). O header nativo fica sempre tocável, então o "Sair" funciona
  mesmo com o modal de conflito/"Gerar conta?" aberto. `BackHandler` (Android) fecha o modal. Único uso atual
  é no `AgendamentoForm` (2 modais).

## Regras/notas
- **`navigate` para rota já existente NÃO desempilha no v7** — sempre preferir `StackActions.popToTop()` com
  `target` para resetar um stack (não usar `goBack()` nem `navigate` puro para "voltar à raiz").
- O "Sair" global **não** deve ser sobrescrito por telas; o `AgendamentoForm` deixou de sobrescrevê-lo.

## Validação
- `npx tsc --noEmit` (0 erros) + `npx expo export --platform android` (bundle OK).