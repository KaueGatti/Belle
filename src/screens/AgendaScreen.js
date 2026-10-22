import React, { useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const { agendamentos, compromissos, getCliente, formatAgendamentoServicos } = useData();
  const [filtro, setFiltro] = useState('proximos'); // proximos | hoje | todos

  const secoes = useMemo(() => {
    const hoje = todayISO();
    const semanaLimite = addDays(hoje, 7);

    let ags = [...agendamentos];
    let cps = [...compromissos];
    if (filtro === 'hoje') {
      ags = ags.filter((a) => a.data === hoje);
      cps = cps.filter((c) => c.data === hoje);
    } else if (filtro === 'proximos') {
      ags = ags.filter((a) => a.data >= hoje && a.data <= semanaLimite && a.status !== 'cancelado');
      cps = cps.filter((c) => c.data >= hoje && c.data <= semanaLimite);
    }

    const grupos = {};
    ags.forEach((a) => {
      if (!grupos[a.data]) grupos[a.data] = [];
      grupos[a.data].push({ tipo: 'agendamento', chave: `ag-${a.id}`, horaOrdem: a.hora, item: a });
    });
    cps.forEach((c) => {
      if (!grupos[c.data]) grupos[c.data] = [];
      grupos[c.data].push({ tipo: 'compromisso', chave: `cp-${c.id}`, horaOrdem: c.horaInicio, item: c });
    });

    return Object.keys(grupos)
      .sort()
      .map((data) => ({
        title: data,
        data: grupos[data].sort((a, b) => String(a.horaOrdem).localeCompare(String(b.horaOrdem))),
      }));
  }, [agendamentos, compromissos, filtro]);

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
        keyExtractor={(item) => item.chave}
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
        renderItem={({ item }) =>
          item.tipo === 'compromisso' ? (
            <CompromissoItem
              compromisso={item.item}
              onPress={() => navigation.navigate('CompromissoForm', { compromissoId: item.item.id })}
            />
          ) : (
            <AgendamentoItem
              agendamento={item.item}
              getCliente={getCliente}
              formatAgendamentoServicos={formatAgendamentoServicos}
              onPress={() => navigation.navigate('AgendamentoForm', { agendamentoId: item.item.id })}
            />
          )
        }
      />

      <Fab onPress={() => navigation.navigate('AgendamentoForm', { agendamentoId: null })} />
    </Screen>
  );
}

function AgendamentoItem({ agendamento, getCliente, formatAgendamentoServicos, onPress }) {
  const cliente = getCliente(agendamento.clienteId);
  return (
    <TouchableOpacity
      style={styles.item}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.horaBox}>
        <Text style={styles.horaText}>{agendamento.hora}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={styles.cliente}>{cliente ? cliente.nome : 'Cliente removido'}</Text>
        <Text style={styles.servico}>
          {formatAgendamentoServicos(agendamento)}
          {agendamento.duracao ? ` • ${agendamento.duracao} min` : ''}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.valor}>{formatCurrency(agendamento.valor)}</Text>
        <StatusBadge status={agendamento.status} />
      </View>
    </TouchableOpacity>
  );
}

function CompromissoItem({ compromisso, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.item, styles.compromissoItem]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.compromissoHoraBox}>
        <Text style={styles.compromissoHoraText}>{compromisso.horaInicio}</Text>
      </View>
      <View style={{ flex: 1, marginLeft: spacing.sm }}>
        <Text style={styles.compromissoTitulo}>{compromisso.titulo}</Text>
        <Text style={styles.compromissoPeriodo}>
          {compromisso.horaInicio} – {compromisso.horaFim}
        </Text>
      </View>
      <View style={styles.compromissoBadge}>
        <Ionicons name="lock-closed" size={11} color={colors.textSecondary} />
        <Text style={styles.compromissoBadgeText}>Indisponível</Text>
      </View>
    </TouchableOpacity>
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
  compromissoItem: {
    backgroundColor: colors.surfaceAlt,
    borderStyle: 'dashed',
  },
  compromissoHoraBox: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  compromissoHoraText: { fontWeight: '700', color: colors.textSecondary },
  compromissoTitulo: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  compromissoPeriodo: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  compromissoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  compromissoBadgeText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
});
