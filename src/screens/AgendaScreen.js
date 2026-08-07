import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import SegmentedControl from '../components/SegmentedControl';
import Fab from '../components/Fab';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, formatDateShortWeekday, todayISO } from '../utils/format';

function addDays(iso, days) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function AgendaScreen({ navigation }) {
  const { agendamentos, getCliente, formatAgendamentoServicos } = useData();
  const [filtro, setFiltro] = useState('proximos'); // proximos | hoje | todos

  const secoes = useMemo(() => {
    const hoje = todayISO();
    const semanaLimite = addDays(hoje, 7);

    let lista = [...agendamentos];
    if (filtro === 'hoje') {
      lista = lista.filter((a) => a.data === hoje);
    } else if (filtro === 'proximos') {
      lista = lista.filter((a) => a.data >= hoje && a.data <= semanaLimite && a.status !== 'cancelado');
    }

    lista.sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora));

    const grupos = {};
    lista.forEach((a) => {
      if (!grupos[a.data]) grupos[a.data] = [];
      grupos[a.data].push(a);
    });

    return Object.keys(grupos)
      .sort()
      .map((data) => ({ title: data, data: grupos[data] }));
  }, [agendamentos, filtro]);

  return (
    <Screen>
      <View style={styles.header}>
        <SegmentedControl
          options={[
            { label: 'Próximos 7 dias', value: 'proximos' },
            { label: 'Hoje', value: 'hoje' },
            { label: 'Todos', value: 'todos' },
          ]}
          value={filtro}
          onChange={setFiltro}
        />
      </View>

      <SectionList
        sections={secoes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Nenhum agendamento"
            subtitle="Toque no botão + para agendar um horário"
          />
        }
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionTitle}>{formatDateShortWeekday(section.title)}</Text>
        )}
        renderItem={({ item }) => {
          const cliente = getCliente(item.clienteId);
          return (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AgendamentoForm', { agendamentoId: item.id })}
            >
              <View style={styles.horaBox}>
                <Text style={styles.horaText}>{item.hora}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.cliente}>{cliente ? cliente.nome : 'Cliente removido'}</Text>
                <Text style={styles.servico}>
                  {formatAgendamentoServicos(item)}
                  {item.duracao ? ` • ${item.duracao} min` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.valor}>{formatCurrency(item.valor)}</Text>
                <StatusBadge status={item.status} />
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Fab onPress={() => navigation.navigate('AgendamentoForm', { agendamentoId: null })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'capitalize',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  horaBox: { backgroundColor: colors.primaryLight, borderRadius: radius.sm, paddingVertical: 8, paddingHorizontal: 10 },
  horaText: { fontWeight: '700', color: colors.primaryDark },
  cliente: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  servico: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  valor: { fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
});
