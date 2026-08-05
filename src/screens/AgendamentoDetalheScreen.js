import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import SegmentedControl from '../components/SegmentedControl';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, formatDateShortWeekday } from '../utils/format';

export default function AgendamentoDetalheScreen({ route, navigation }) {
  const { agendamentoId } = route.params || {};
  const {
    getAgendamento,
    updateAgendamento,
    deleteAgendamento,
    getCliente,
    getConta,
    getPacoteVenda,
    getPacote,
    formatAgendamentoServicos,
    contas,
  } = useData();
  const { showToast } = useToast();

  const agendamento = getAgendamento(agendamentoId);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: agendamento ? formatDateShortWeekday(agendamento.data) : 'Agendamento',
    });
  }, [navigation, agendamento]);

  const cliente = agendamento ? getCliente(agendamento.clienteId) : null;
  const conta = useMemo(
    () => (agendamento ? contas.find((c) => c.agendamentoId === agendamento.id) : null),
    [agendamento, contas]
  );
  const venda = agendamento?.pacoteVendaId ? getPacoteVenda(agendamento.pacoteVendaId) : null;
  const pacote = venda ? getPacote(venda.pacoteId) : null;
  const contaObj = conta ? getConta(conta.id) : null;

  function setStatus(status) {
    updateAgendamento(agendamento.id, { status });
    showToast('Status atualizado');
  }

  function handleExcluir() {
    Alert.alert(
      'Excluir agendamento',
      'Deseja excluir este agendamento? Os serviços usados de um pacote, se houver, serão devolvidos e a conta financeira vinculada removida.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteAgendamento(agendamento.id);
            showToast('Agendamento excluído', 'error');
            navigation.goBack();
          },
        },
      ]
    );
  }

  if (!agendamento) {
    return (
      <Screen>
        <EmptyState
          icon="calendar-outline"
          title="Agendamento não encontrado"
          subtitle="Este agendamento pode ter sido removido"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroInfo}>
              <Text style={styles.cliente}>{cliente ? cliente.nome : 'Cliente removido'}</Text>
              <Text style={styles.servico}>{formatAgendamentoServicos(agendamento)}</Text>
            </View>
            <StatusBadge status={agendamento.status} />
          </View>
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              <Text style={styles.metaText}>{formatDateShortWeekday(agendamento.data)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={colors.primary} />
              <Text style={styles.metaText}>{agendamento.hora}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Valores</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Valor</Text>
            <Text style={styles.valor}>{formatCurrency(agendamento.valor || 0)}</Text>
          </View>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>Sinal</Text>
            <Text style={styles.valueText}>{formatCurrency(agendamento.sinal || 0)}</Text>
          </View>
          {agendamento.sorteio ? (
            <View style={styles.badgeRow}>
              <Ionicons name="gift-outline" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>Foi sorteio</Text>
            </View>
          ) : null}
        </Card>

        {agendamento.observacoes ? (
          <Card style={[styles.card, styles.obsCard]}>
            <Text style={styles.cardTitle}>Observações</Text>
            <Text style={styles.obsText}>{agendamento.observacoes}</Text>
          </Card>
        ) : null}

        {contaObj ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Conta {contaObj.tipo === 'pagar' ? 'a pagar' : 'a receber'}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>{contaObj.descricao}</Text>
              <Text style={styles.valueText}>{formatCurrency(contaObj.valor)}</Text>
            </View>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Vencimento</Text>
              <StatusBadge status={contaObj.status} />
            </View>
          </Card>
        ) : null}

        {pacote ? (
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Pacote utilizado</Text>
            <Text style={styles.pacoteText}>{pacote.nome}</Text>
            <Text style={styles.pacoteMeta}>Coberto pelo pacote • Sem cobrança</Text>
          </Card>
        ) : null}

        <Text style={styles.statusLabel}>Status</Text>
        <SegmentedControl
          options={[
            { label: 'Agendado', value: 'agendado' },
            { label: 'Concluído', value: 'concluido' },
            { label: 'Cancelado', value: 'cancelado' },
          ]}
          value={agendamento.status}
          onChange={setStatus}
        />

        <Button
          title="Editar Agendamento"
          variant="outline"
          icon={<Ionicons name="create-outline" size={16} color={colors.primary} />}
          onPress={() =>
            navigation.navigate('AgendaTab', {
              screen: 'AgendamentoForm',
              params: { agendamentoId: agendamento.id },
            })
          }
          style={{ marginTop: spacing.md }}
        />
        <Button
          title="Excluir Agendamento"
          variant="danger"
          onPress={handleExcluir}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, paddingBottom: 60 },
  heroCard: { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroInfo: { flex: 1, marginRight: spacing.sm },
  cliente: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  servico: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  heroMeta: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  card: { marginTop: spacing.sm },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  label: { fontSize: 13, color: colors.textSecondary },
  valor: { fontSize: 16, fontWeight: '800', color: colors.primary },
  valueText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  badgeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  obsCard: { backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  obsText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  pacoteText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  pacoteMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  statusLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.lg, marginBottom: 6 },
});