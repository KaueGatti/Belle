import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, formatDateShortWeekday } from '../utils/format';

export default function ClienteConsultaScreen({ route, navigation }) {
  const { clienteId } = route.params || {};
  const {
    getCliente,
    agendamentos,
    contas,
    formatAgendamentoServicos,
    pacotesAtivosDoCliente,
    getPacote,
    totalQtdVenda,
  } = useData();
  const cliente = getCliente(clienteId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: cliente ? cliente.nome : 'Cliente' });
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

  const pacotesVigentes = useMemo(
    () => (clienteId ? pacotesAtivosDoCliente(clienteId) : []),
    [clienteId, pacotesAtivosDoCliente]
  );

  if (!cliente) {
    return (
      <Screen>
        <EmptyState
          icon="person-outline"
          title="Cliente não encontrado"
          subtitle="Este cliente pode ter sido removido"
        />
      </Screen>
    );
  }

  const infos = [
    { icon: 'call-outline', value: cliente.telefone },
    { icon: 'mail-outline', value: cliente.email },
  ].filter((i) => i.value);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{cliente.nome.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.nome}>{cliente.nome}</Text>
            {infos.map((i) => (
              <View key={i.icon} style={styles.infoRow}>
                <Ionicons name={i.icon} size={14} color={colors.textSecondary} />
                <Text style={styles.infoText}>{i.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {cliente.observacoes ? (
          <Card style={styles.obsCard}>
            <Text style={styles.obsTitle}>Observações</Text>
            <Text style={styles.obsText}>{cliente.observacoes}</Text>
          </Card>
        ) : null}

        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: colors.primaryLight, borderColor: colors.primaryLight }]}>
            <Text style={[styles.statValor, { color: colors.primaryDark }]}>{historico.length}</Text>
            <Text style={styles.statLabel}>Agendamentos</Text>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: colors.successLight, borderColor: colors.successLight }]}>
            <Text style={[styles.statValor, { color: colors.success }]}>{formatCurrency(totalRecebido)}</Text>
            <Text style={styles.statLabel}>Total recebido</Text>
          </Card>
        </View>

        <Button
          title="Editar Cliente"
          variant="outline"
          icon={<Ionicons name="create-outline" size={16} color={colors.primary} />}
          onPress={() => navigation.navigate('ClienteForm', { clienteId: cliente.id })}
          style={{ marginTop: spacing.md }}
        />

        <Text style={styles.sectionTitle}>Pacote vigente</Text>
        {pacotesVigentes.length === 0 ? (
          <View style={styles.semPacote}>
            <Text style={styles.semPacoteText}>
              Esta cliente não possui pacote com saldo disponível. Venda um pacote para acumular serviços.
            </Text>
          </View>
        ) : (
          pacotesVigentes.map((v) => {
            const pacote = getPacote(v.pacoteId);
            const restante = totalQtdVenda(v);
            return (
              <Card key={v.id} style={styles.pacoteCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pacoteNome}>{pacote?.nome || 'Pacote'}</Text>
                  <Text style={styles.pacoteMeta}>
                    {restante} serviço{restante === 1 ? '' : 's'} restante{restante === 1 ? '' : 's'}
                  </Text>
                </View>
                <View style={styles.pacoteBadge}>
                  <Text style={styles.pacoteBadgeText}>Em uso</Text>
                </View>
              </Card>
            );
          })
        )}
        <View style={styles.pacoteActions}>
          <Button
            title="Vender Pacote"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('VendaPacote', { clienteId: cliente.id })}
          />
          <Button
            title="Ver Pacotes"
            variant="outline"
            style={{ flex: 1 }}
            onPress={() => navigation.navigate('ClientePacotes', { clienteId: cliente.id })}
          />
        </View>

        <Text style={styles.sectionTitle}>Histórico de agendamentos</Text>
        {historico.length === 0 ? (
          <EmptyState
            icon="calendar-outline"
            title="Nenhum agendamento"
            subtitle="Crie um novo agendamento para esta cliente"
          />
        ) : (
          historico.map((a) => (
            <TouchableOpacity
              key={a.id}
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
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.itemValor}>{formatCurrency(a.valor)}</Text>
                <StatusBadge status={a.status} />
              </View>
            </TouchableOpacity>
          ))
        )}

        <Button
          title="Ver histórico completo"
          variant="ghost"
          onPress={() => navigation.navigate('ClienteHistorico', { clienteId: cliente.id })}
          style={{ marginTop: spacing.sm }}
        />

        <Button
          title="Novo Agendamento"
          icon={<Ionicons name="add" size={18} color={colors.textInverse} />}
          onPress={() =>
            navigation.navigate('AgendaTab', {
              screen: 'AgendamentoForm',
              params: { agendamentoId: null, clientePreset: cliente.id },
            })
          }
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profileCard: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryDark, fontWeight: '700', fontSize: 22 },
  nome: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 },
  infoText: { fontSize: 13, color: colors.textSecondary },
  obsCard: { marginTop: spacing.sm, backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  obsTitle: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4 },
  obsText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  statCard: { flex: 1, borderWidth: 0 },
  statValor: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.sm },
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
  itemValor: { fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  semPacote: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  semPacoteText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  pacoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    borderColor: colors.successLight,
    marginBottom: spacing.sm,
  },
  pacoteNome: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  pacoteMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  pacoteBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pacoteBadgeText: { fontSize: 11, fontWeight: '700', color: colors.success },
  pacoteActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
});
