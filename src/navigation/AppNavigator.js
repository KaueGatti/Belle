import React from 'react';
import { Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

import DashboardScreen from '../screens/DashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AgendamentoDetalheScreen from '../screens/AgendamentoDetalheScreen';
import ClientesScreen from '../screens/ClientesScreen';
import ClienteFormScreen from '../screens/ClienteFormScreen';
import ClienteConsultaScreen from '../screens/ClienteConsultaScreen';
import ClienteHistoricoScreen from '../screens/ClienteHistoricoScreen';
import ClientePacotesScreen from '../screens/ClientePacotesScreen';
import VendaPacoteScreen from '../screens/VendaPacoteScreen';
import AgendaScreen from '../screens/AgendaScreen';
import AgendamentoFormScreen from '../screens/AgendamentoFormScreen';
import FinanceiroScreen from '../screens/FinanceiroScreen';
import ContaFormScreen from '../screens/ContaFormScreen';
import CentroCustoScreen from '../screens/CentroCustoScreen';
import CentroCustoFormScreen from '../screens/CentroCustoFormScreen';
import ServicosScreen from '../screens/ServicosScreen';
import ServicoFormScreen from '../screens/ServicoFormScreen';
import PacoteFormScreen from '../screens/PacoteFormScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function useStackScreenOptions() {
  return {
    headerStyle: { backgroundColor: colors.surface },
    headerTintColor: colors.textPrimary,
    headerTitleStyle: { fontWeight: '700' },
    headerShadowVisible: false,
    ...(Platform.OS === 'android' ? { statusBarTranslucent: true } : {}),
    contentStyle: { backgroundColor: colors.background },
  };
}

function DashboardStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Início' }} />
      <Stack.Screen name="Configuracoes" component={SettingsScreen} options={{ title: 'Configurações' }} />
      <Stack.Screen name="AgendamentoDetalhe" component={AgendamentoDetalheScreen} options={{ title: 'Agendamento' }} />
    </Stack.Navigator>
  );
}

function AgendaStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ title: 'Agenda' }} />
      <Stack.Screen name="AgendamentoForm" component={AgendamentoFormScreen} />
    </Stack.Navigator>
  );
}

function ClientesStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Clientes" component={ClientesScreen} options={{ title: 'Clientes' }} />
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
      <Stack.Screen name="Financeiro" component={FinanceiroScreen} options={{ title: 'Financeiro' }} />
      <Stack.Screen name="ContaForm" component={ContaFormScreen} />
    </Stack.Navigator>
  );
}

function CentroCustoStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="CentroCusto" component={CentroCustoScreen} options={{ title: 'Centro de Custo' }} />
      <Stack.Screen name="CentroCustoForm" component={CentroCustoFormScreen} />
    </Stack.Navigator>
  );
}

function ServicosStack() {
  const stackScreenOptions = useStackScreenOptions();
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="Servicos" component={ServicosScreen} options={{ title: 'Serviços' }} />
      <Stack.Screen name="ServicoForm" component={ServicoFormScreen} />
      <Stack.Screen name="PacoteForm" component={PacoteFormScreen} />
    </Stack.Navigator>
  );
}

const ICONS = {
  DashboardTab: 'home',
  AgendaTab: 'calendar',
  ClientesTab: 'people',
  FinanceiroTab: 'wallet',
  CentroCustoTab: 'pricetags',
  ServicosTab: 'cut',
};

export default function AppNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 62 + insets.bottom,
            paddingBottom: 8 + insets.bottom,
            paddingTop: 6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={`${ICONS[route.name]}${focused ? '' : '-outline'}`} size={size - 2} color={color} />
          ),
        })}
      >
        <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Início' }} />
        <Tab.Screen name="AgendaTab" component={AgendaStack} options={{ title: 'Agenda' }} />
        <Tab.Screen name="ClientesTab" component={ClientesStack} options={{ title: 'Clientes' }} />
        <Tab.Screen name="ServicosTab" component={ServicosStack} options={{ title: 'Serviços' }} />
        <Tab.Screen name="FinanceiroTab" component={FinanceiroStack} options={{ title: 'Financeiro' }} />
        <Tab.Screen name="CentroCustoTab" component={CentroCustoStack} options={{ title: 'Categorias' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
