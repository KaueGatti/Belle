import React, { useMemo, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Logo from '../components/Logo';
import EmptyState from '../components/EmptyState';
import PeriodFilter from '../components/PeriodFilter';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, formatDateShortWeekday, todayISO, contaInPeriodo } from '../utils/format';

export default function DashboardScreen({ navigation }) {
  const { contas, agendamentos, clientes, getCliente, formatAgendamentoServicos } = useData();
  const [periodo, setPeriodo] = useState(null);

  const heroScale = useRef(new Animated.Value(0.96)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(heroOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(heroScale, { toValue: 1, speed: 10, bounciness: 8, useNativeDriver: true }),
    ]).start();
  }, [heroOpacity, heroScale]);

  const resumo = useMemo(() => {
    const noPeriodo = contas.filter((c) => contaInPeriodo(c, periodo));
    const aReceber = noPeriodo
      .filter((c) => c.tipo === 'receber' && c.status === 'pendente')
      .reduce((sum, c) => sum + Number(c.valor || 0), 0);
    const aPagar = noPeriodo
      .filter((c) => c.tipo === 'pagar' && c.status === 'pendente')
      .reduce((sum, c) => sum + Number(c.valor || 0), 0);
    return { aReceber, aPagar, saldo: aReceber - aPagar };
  }, [contas, periodo]);

  const proximos = useMemo(() => {
    const hoje = todayISO();
    return agendamentos
      .filter((a) => a.status === 'agendado' && a.data >= hoje)
      .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora))
      .slice(0, 5);
  }, [agendamentos]);

  const agendamentosHoje = agendamentos.filter((a) => a.data === todayISO() && a.status !== 'cancelado').length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: heroOpacity, transform: [{ scale: heroScale }] }}>
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroGreeting}>Olá Josiane!</Text>
                <Text style={styles.heroSub}>Resumo do seu negócio</Text>
              </View>
              <Logo size={54} />
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => navigation.navigate('Configuracoes')}
                activeOpacity={0.7}
              >
                <Ionicons name="settings-outline" size={22} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
            <View style={styles.heroStats}>
              <HeroStat label="A receber" value={formatCurrency(resumo.aReceber)} />
              <View style={styles.heroDivider} />
              <HeroStat label="A pagar" value={formatCurrency(resumo.aPagar)} />
              <View style={styles.heroDivider} />
              <HeroStat label="Saldo" value={formatCurrency(resumo.saldo)} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.periodoWrap}>
          <PeriodFilter value={periodo} onChange={setPeriodo} />
        </View>

        <View style={styles.quickRow}>
          <QuickStat icon="people-outline" value={clientes.length} label="Clientes" />
          <QuickStat icon="today-outline" value={agendamentosHoje} label="Hoje" />
          <QuickStat
            icon="list-outline"
            value={contas.filter((c) => c.status === 'pendente').length}
            label="Pendências"
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sectionDot}
            />
            <Text style={styles.sectionTitle}>Próximos agendamentos</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('AgendaTab')}>
            <Text style={styles.sectionLink}>Ver agenda</Text>
          </TouchableOpacity>
        </View>

        {proximos.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nenhum agendamento futuro"
            subtitle="Adicione um novo agendamento na aba Agenda"
          />
        ) : (
          proximos.map((a) => {
            const cliente = getCliente(a.clienteId);
            return (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('AgendamentoDetalhe', { agendamentoId: a.id })}
              >
                <Card style={styles.agendamentoCard}>
                  <LinearGradient
                    colors={[colors.primary, colors.accent]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.agendamentoDate}
                  >
                    <Text style={styles.agendamentoDateData}>{formatDateShortWeekday(a.data)}</Text>
                    <Text style={styles.agendamentoDateText}>{a.hora}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.agendamentoCliente}>{cliente ? cliente.nome : 'Cliente removido'}</Text>
                    <Text style={styles.agendamentoServico}>{formatAgendamentoServicos(a)}</Text>
                  </View>
                  <Text style={styles.agendamentoValor}>{formatCurrency(a.valor)}</Text>
                </Card>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}

function HeroStat({ label, value }) {
  return (
    <View style={styles.heroStat}>
      <Text style={styles.heroStatLabel}>{label}</Text>
      <Text style={styles.heroStatValue}>{value}</Text>
    </View>
  );
}

function QuickStat({ icon, value, label }) {
  return (
    <View style={styles.quickStat}>
      <LinearGradient
        colors={[colors.primaryLight, colors.surfaceAlt]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.quickIconWrap}
      >
        <Ionicons name={icon} size={18} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 100 },
  hero: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center' },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroGreeting: { fontSize: 24, fontWeight: '800', color: colors.textInverse },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroStats: {
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.25)',
  },
  heroStat: { flex: 1, alignItems: 'center' },
  heroStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  heroStatValue: { fontSize: 15, fontWeight: '800', color: colors.textInverse, marginTop: 3 },
  heroDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.3)' },
  periodoWrap: { marginTop: spacing.md },
  quickRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },  quickStat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  quickIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickValue: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  quickLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionTitleWrap: { flexDirection: 'row', alignItems: 'center' },
  sectionDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sectionLink: { fontSize: 13, fontWeight: '600', color: colors.primary },
  agendamentoCard: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  agendamentoDate: {
    minWidth: 84,
    flexShrink: 0,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendamentoDateData: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 10,
    fontWeight: '700',
  },
  agendamentoDateText: { fontWeight: '800', color: colors.textInverse, fontSize: 15, marginTop: 2 },
  agendamentoCliente: { fontWeight: '700', color: colors.textPrimary, fontSize: 14 },
  agendamentoServico: { color: colors.textSecondary, fontSize: 12, marginTop: 1 },
  agendamentoValor: { fontWeight: '700', color: colors.textPrimary },
});
