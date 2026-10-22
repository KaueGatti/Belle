import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { NavigationContainer, createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import type { TabParamList, StackParamList } from '../types/navigation';

import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ClienteFormScreen from '../screens/ClienteFormScreen';
import ClienteConsultaScreen from '../screens/ClienteConsultaScreen';
import ClienteHistoricoScreen from '../screens/ClienteHistoricoScreen';
import ClientePacotesScreen from '../screens/ClientePacotesScreen';
import VendaPacoteScreen from '../screens/VendaPacoteScreen';
import AgendaScreen from '../screens/AgendaScreen';
import AgendamentoFormScreen from '../screens/AgendamentoFormScreen';
import CompromissoFormScreen from '../screens/CompromissoFormScreen';
import FinanceiroScreen from '../screens/FinanceiroScreen';
import ContaFormScreen from '../screens/ContaFormScreen';
import CentroCustoScreen from '../screens/CentroCustoScreen';
import CentroCustoFormScreen from '../screens/CentroCustoFormScreen';
import ServicosScreen from '../screens/ServicosScreen';
import ServicoFormScreen from '../screens/ServicoFormScreen';
import PacoteFormScreen from '../screens/PacoteFormScreen';
import ProdutoFormScreen from '../screens/ProdutoFormScreen';
import VendaProdutoScreen from '../screens/VendaProdutoScreen';
import SpeedDial, { type SpeedDialAction } from '../components/SpeedDial';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<StackParamList>();
const navigationRef = createNavigationContainerRef<TabParamList>();

// Tela-raiz de cada aba (destino do botão "Sair" global)
const TAB_ROOT_SCREEN: Partial<Record<keyof TabParamList, keyof StackParamList>> = {
  DashboardTab: 'Dashboard',
  AgendaTab: 'Agenda',
  ClientesTab: 'Clientes',
  FinanceiroTab: 'Financeiro',
};

// Volta para a tela-raiz do stack da aba atualmente focada. Usado pelo botão
// "Sair" e pelo clique na aba já focada. O reset com target garante que sobre
// apenas a raiz, mesmo se o stack foi criado sem a tela-raiz (navegação cruzada).
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

function useStackScreenOptions(): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.textPrimary,
    headerTitleStyle: { fontWeight: '700' },
    headerShadowVisible: false,
    ...(Platform.OS === 'android' ? { statusBarTranslucent: true } : {}),
    contentStyle: { backgroundColor: colors.background },
    headerRight: () => (
      <TouchableOpacity onPress={irParaRaizDaAba} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>Sair</Text>
      </TouchableOpacity>
    ),
  };
}

function HomeSpeedDial({ bottomOffset = 0 }: { bottomOffset?: number }) {
  // initial: false = ao criar o stack da aba preguiçosamente, mantém a
  // tela-raiz da aba na base (sem isso "Sair"/voltar quebram).
  const actions: SpeedDialAction[] = [
    {
      key: 'novo-agendamento',
      icon: 'calendar',
      label: 'Novo Agendamento',
      onPress: () =>
        navigationRef.navigate('AgendaTab', { screen: 'AgendamentoForm', params: { agendamentoId: null }, initial: false }),
    },
    {
      key: 'novo-compromisso',
      icon: 'lock-closed',
      label: 'Novo Compromisso',
      onPress: () =>
        navigationRef.navigate('AgendaTab', { screen: 'CompromissoForm', params: { compromissoId: null }, initial: false }),
    },
    {
      key: 'cadastrar-cliente',
      icon: 'person-add',
      label: 'Cadastrar Cliente',
      onPress: () =>
        navigationRef.navigate('ClientesTab', { screen: 'ClienteForm', params: { clienteId: null }, initial: false }),
    },
    {
      key: 'vender-pacote',
      icon: 'gift',
      label: 'Vender Pacote',
      onPress: () =>
        navigationRef.navigate('ClientesTab', { screen: 'VendaPacote', params: { clienteId: null }, initial: false }),
    },
    {
      key: 'servicos',
      icon: 'cut',
      label: 'Serviços & Pacotes',
      onPress: () =>
        navigationRef.navigate('DashboardTab', { screen: 'Servicos', params: { modo: 'servicos' }, initial: false }),
    },
    {
      key: 'produtos',
      icon: 'bag-handle',
      label: 'Produtos',
      onPress: () =>
        navigationRef.navigate('DashboardTab', { screen: 'Servicos', params: { modo: 'produtos' }, initial: false }),
    },
    {
      key: 'nova-conta',
      icon: 'wallet',
      label: 'Nova Conta',
      onPress: () =>
        navigationRef.navigate('FinanceiroTab', { screen: 'ContaForm', params: { contaId: null }, initial: false }),
    },
    {
      key: 'categorias',
      icon: 'pricetags',
      label: 'Categorias',
      onPress: () => navigationRef.navigate('DashboardTab', { screen: 'CentroCusto', initial: false }),
    },
  ];

  return <SpeedDial actions={actions} bottomOffset={bottomOffset} />;
}

function DashboardStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Início', headerRight: () => null }} />
      <Stack.Screen name="Configuracoes" component={SettingsScreen} options={{ title: 'Configurações' }} />
      <Stack.Screen name="Servicos" component={ServicosScreen} options={{ title: 'Serviços & Pacotes' }} />
      <Stack.Screen name="ServicoForm" component={ServicoFormScreen} />
      <Stack.Screen name="PacoteForm" component={PacoteFormScreen} />
      <Stack.Screen name="ProdutoForm" component={ProdutoFormScreen} />
      <Stack.Screen name="VendaProduto" component={VendaProdutoScreen} options={{ title: 'Vender Produtos' }} />
      <Stack.Screen name="CentroCusto" component={CentroCustoScreen} options={{ title: 'Centro de Custo' }} />
      <Stack.Screen name="CentroCustoForm" component={CentroCustoFormScreen} />
    </Stack.Navigator>
  );
}

function AgendaStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda', headerRight: () => null }} />
      <Stack.Screen name="AgendamentoForm" component={AgendamentoFormScreen} />
      <Stack.Screen
        name="CompromissoForm"
        component={CompromissoFormScreen}
        options={{ title: 'Novo Compromisso' }}
      />
    </Stack.Navigator>
  );
}

function ClientesStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Clientes', headerRight: () => null }} />
      <Stack.Screen name="ClienteConsulta" component={ClienteConsultaScreen} options={{ title: 'Cliente' }} />
      <Stack.Screen name="ClienteForm" component={ClienteFormScreen} />
      <Stack.Screen name="ClienteHistorico" component={ClienteHistoricoScreen} />
      <Stack.Screen name="ClientePacotes" component={ClientePacotesScreen} />
      <Stack.Screen name="VendaPacote" component={VendaPacoteScreen} />
    </Stack.Navigator>
  );
}

function FinanceiroStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Financeiro" component={FinanceiroScreen} options={{ title: 'Financeiro', headerRight: () => null }} />
      <Stack.Screen name="ContaForm" component={ContaFormScreen} />
    </Stack.Navigator>
  );
}

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  DashboardTab: 'home',
  AgendaTab: 'calendar',
  ClientesTab: 'people',
  FinanceiroTab: 'wallet',
};

export default function AppNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 62 + insets.bottom;

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={{ flex: 1 }}>
        <Tab.Navigator
          screenListeners={({ route }) => ({
            tabPress: (e) => {
              if (e.target !== route.key) return;
              if (!navigationRef.isReady()) return;
              const rootState = navigationRef.getRootState();
              const focusedTab = rootState?.routes?.[rootState?.index ?? -1];
              if (focusedTab?.key === route.key) {
                irParaRaizDaAba();
              }
            },
          })}
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              height: tabBarHeight,
              paddingBottom: 8 + insets.bottom,
              paddingTop: 6,
            },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={`${ICONS[route.name]}${focused ? '' : '-outline'}` as keyof typeof Ionicons.glyphMap}
                size={size - 2}
                color={color}
              />
            ),
          })}
        >
          <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Início' }} />
          <Tab.Screen name="AgendaTab" component={AgendaStack} options={{ title: 'Agenda' }} />
          <Tab.Screen name="ClientesTab" component={ClientesStack} options={{ title: 'Clientes' }} />
          <Tab.Screen name="FinanceiroTab" component={FinanceiroStack} options={{ title: 'Financeiro' }} />
        </Tab.Navigator>
        <HomeSpeedDial bottomOffset={tabBarHeight} />
      </View>
    </NavigationContainer>
  );
}