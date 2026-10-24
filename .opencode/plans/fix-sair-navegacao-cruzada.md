# Fix: botão "Sair" / tabPress não voltam à raiz da aba (navegação cruzada)

## Diagnóstico

Quando o SpeedDial navega para uma tela de uma aba cujo stack **ainda não foi
inicializado** na sessão (ex.: usuário está no Início e toca "Novo Compromisso" →
`navigate('AgendaTab', { screen: 'CompromissoForm' })`), o react-navigation cria o
stack da Agenda **preguiçosamente apenas com a tela alvo**:
`routes: [CompromissoForm]` — sem a tela-raiz `Agenda` embaixo.

Sintomas explicados:
1. **"Sair" não faz nada** na CompromissoForm: `irParaRaizDaAba()` faz `popToTop`
   numa pilha de 1 rota → nada muda.
2. **Clicar na aba não volta**: o handler `tabPress` chama a mesma função.
3. **"Sair" no AgendamentoForm volta p/ Compromisso**: "Novo Agendamento" empilhou
   por cima (`[CompromissoForm, AgendamentoForm]`); `popToTop` cai em CompromissoForm.

Bug pré-existente: afeta todas as ações do SpeedDial (Novo Agendamento, Cadastrar
Cliente, Vender Pacote, Serviços & Pacotes, Produtos, Nova Conta, Categorias) e as
navegações cruzadas das telas, quando a aba destino ainda não foi visitada.

## Correções

### 1. Origem — `initial: false` nas navegações cruzadas entre abas
Com `initial: false`, o stack criado preguiçosamente ganha a tela-raiz primeiro:
`[Agenda, CompromissoForm]`. Corrige Sair/tabPress **e** o voltar físico do Android.

Arquivos/pontos:
- `src/navigation/AppNavigator.tsx` — 8 ações do `HomeSpeedDial`
  - novo-agendamento, novo-compromisso, cadastrar-cliente, vender-pacote,
    servicos, produtos, nova-conta, categorias
- `src/screens/AgendamentoFormScreen.tsx` — linhas ~827 e ~916
- `src/screens/ClienteConsultaScreen.js` — linhas ~165 e ~193
- `src/screens/ClienteHistoricoScreen.js` — linhas ~64 e ~85
- `src/screens/DashboardScreen.js` — linha ~124

### 2. Defesa — endurecer `irParaRaizDaAba()` (`AppNavigator.tsx`)
Trocar o dispatch `StackActions.popToTop()` por reset com target:

```ts
function irParaRaizDaAba() {
  if (!navigationRef.isReady()) return;
  const rootState = navigationRef.getRootState();
  const route = rootState?.routes?.[rootState?.index ?? -1];
  if (!route) return;
  const tabName = route.name as keyof TabParamList;
  const rootScreen = TAB_ROOT_SCREEN[tabName];
  const stackKey = (route as { state?: { key?: string } })?.state?.key;
  if (stackKey && rootScreen) {
    navigationRef.dispatch({
      ...CommonActions.reset({ index: 0, routes: [{ name: rootScreen }] }),
      target: stackKey,
    });
  } else if (rootScreen) {
    navigationRef.dispatch(CommonActions.navigate({ name: tabName, params: { screen: rootScreen } }));
  }
}
```

- Independente de como o stack foi criado, sobra só a tela-raiz correta.
- Remover import `StackActions` (fica sem uso).

## Validação

- `npx tsc --noEmit` (0 erros)
- `node --check` nos `.js` alterados
- `npx expo export --platform android` (bundle OK)

Sem mudanças nativas → fingerprint/runtime intactos (OTA possível).
