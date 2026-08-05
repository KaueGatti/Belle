import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, formatDateShortWeekday } from '../utils/format';

export default function ClienteHistoricoScreen({ route, navigation }) {
  const { clienteId } = route.params || {};
  const { getCliente, agendamentos, contas, formatAgendamentoServicos } = useData();
  const cliente = getCliente(clienteId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: cliente ? `Histórico de ${cliente.nome.split(' ')[0]}` : 'Histórico' });
  }, [navigation, cliente]);

  const historico = useMemo(() => {
    return agendamentos
      .filter((a) => a.clienteId === clienteId)
      .sort((a, b) => (b.data + b.hora).localeCompare(a.data + a.hora));
  }, [agendamentos, clienteId]);

  const totalRecebido = useMemo(
    () =>
      contas
        .filter((c) => c.clienteId === clienteId && c.tipo === 'receber' && c.status === 'quitado')
        .reduce((sum, c) => sum + Number(c.valor || 0), 0),
    [contas, clienteId]
  );

  if (!cliente) {
    return (
      <Screen>
        <EmptyState icon="person-outline" title="Cliente não encontrado" subtitle="Este cliente pode ter sido removido" />
      </Screen>
    );
  }

  return (
    <Screen>
      <FlatList
        data={historico}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        ListHeaderComponent={
          <>
            <Card style={styles.resumo}>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoValor}>{historico.length}</Text>
                <Text style={styles.resumoLabel}>Agendamentos</Text>
              </View>
              <View style={styles.resumoItem}>
                <Text style={styles.resumoValor}>{formatCurrency(totalRecebido)}</Text>
                <Text style={styles.resumoLabel}>Total recebido</Text>
              </View>
            </Card>
            <Button
              title="Novo Agendamento"
              onPress={() =>
                navigation.navigate('AgendaTab', {
                  screen: 'AgendamentoForm',
                  params: { agendamentoId: null, clientePreset: cliente.id },
                })
              }
              style={{ marginBottom: spacing.md }}
            />
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Nenhum agendamento"
            subtitle="Crie um novo agendamento para esta cliente"
          />
        }
        renderItem={({ item: a }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('AgendaTab', { screen: 'AgendamentoForm', params: { agendamentoId: a.id } })
            }
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.itemData}>
                {formatDateShortWeekday(a.data)} às {a.hora}
              </Text>
              <Text style={styles.itemServico}>{formatAgendamentoServicos(a)}</Text>
              {a.observacoes ? <Text style={styles.itemObs}>{a.observacoes}</Text> : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.itemValor}>{formatCurrency(a.valor)}</Text>
              <StatusBadge status={a.status} />
            </View>
          </TouchableOpacity>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  resumo: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.md },
  resumoItem: { alignItems: 'center' },
  resumoValor: { fontSize: 17, fontWeight: '700', color: colors.primary },
  resumoLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
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
  itemData: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  itemServico: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  itemObs: { fontSize: 12, color: colors.textSecondary, marginTop: 2, fontStyle: 'italic' },
  itemValor: { fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
});
