import React, { useLayoutEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Button from '../components/Button';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, formatDateBR } from '../utils/format';

export default function ClientePacotesScreen({ route, navigation }) {
  const { clienteId } = route.params || {};
  const {
    getCliente,
    getPacote,
    servicos,
    pacotesVendidos,
    totalQtdVenda,
    pacoteVendaUsadoCount,
    deletePacoteVenda,
  } = useData();
  const { showToast } = useToast();
  const cliente = getCliente(clienteId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: cliente ? `Pacotes de ${cliente.nome.split(' ')[0]}` : 'Pacotes' });
  }, [navigation, cliente]);

  const vendas = useMemo(() => {
    return pacotesVendidos
      .filter((v) => v.clienteId === clienteId)
      .sort((a, b) => String(b.vendidoEm).localeCompare(String(a.vendidoEm)));
  }, [pacotesVendidos, clienteId]);

  function resumoVenda(venda) {
    return (venda.servicos || [])
      .map((s) => {
        const serv = servicos.find((x) => x.id === s.servicoId);
        const nome = serv?.nome || 'Serviço removido';
        return Number(s.qtd) > 0 ? `${nome} (${s.qtd})` : null;
      })
      .filter(Boolean)
      .join(' • ');
  }

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
        data={vendas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}
        ListHeaderComponent={
          <Button
            title="Vender Pacote"
            icon={<Ionicons name="add" size={18} color={colors.textInverse} />}
            onPress={() => navigation.navigate('VendaPacote', { clienteId: cliente.id })}
            style={{ marginBottom: spacing.md }}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="grid-outline"
            title="Nenhum pacote contratado"
            subtitle="Venda um pacote para esta cliente para que ela tenha saldo de serviços"
          />
        }
        renderItem={({ item: venda }) => {
          const pacote = getPacote(venda.pacoteId);
          const restante = totalQtdVenda(venda);
          const ativo = restante > 0;
          const usadoCount = pacoteVendaUsadoCount(venda.id);
          const podeExcluir = usadoCount === 0;
          function excluirVenda() {
            Alert.alert(
              'Excluir pacote',
              `Deseja excluir o pacote "${pacote?.nome || 'Pacote'}" vendido para ${cliente.nome}? Esta ação não pode ser desfeita.`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Excluir',
                  style: 'destructive',
                  onPress: () => {
                    deletePacoteVenda(venda.id);
                    showToast('Pacote excluído', 'error');
                  },
                },
              ]
            );
          }
          return (
            <Card style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nome}>{pacote?.nome || 'Pacote removido'}</Text>
                  <Text style={styles.meta}>Vendido em {formatDateBR(venda.vendidoEm)}</Text>
                </View>
                <View style={[styles.badge, ativo ? styles.badgeAtivo : styles.badgeEsgotado]}>
                  <Text style={[styles.badgeText, { color: ativo ? colors.success : colors.textSecondary }]}>
                    {ativo ? `${restante} restante(s)` : 'Esgotado'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={podeExcluir ? excluirVenda : null}
                  style={[styles.deleteBtn, !podeExcluir && styles.deleteBtnDisabled]}
                  disabled={!podeExcluir}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color={podeExcluir ? colors.danger : colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <View style={styles.listaItens}>
                {resumoVenda(venda) ? (
                  <Text style={styles.itens}>{resumoVenda(venda)}</Text>
                ) : (
                  <Text style={styles.itensVazio}>Todos os serviços foram utilizados</Text>
                )}
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.valor}>{formatCurrency(venda.valor)}</Text>
                {!podeExcluir ? (
                  <Text style={styles.usadoText}>Em uso em {usadoCount} agendamento{usadoCount === 1 ? '' : 's'}</Text>
                ) : null}
              </View>
            </Card>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  nome: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeAtivo: { backgroundColor: colors.successLight },
  badgeEsgotado: { backgroundColor: colors.surfaceAlt },
  badgeText: { fontSize: 11, fontWeight: '700' },
  deleteBtn: {
    marginLeft: spacing.sm,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
  },
  deleteBtnDisabled: { backgroundColor: colors.surfaceAlt },
  listaItens: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itens: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  itensVazio: { fontSize: 13, color: colors.textSecondary, fontStyle: 'italic' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  valor: { fontSize: 15, fontWeight: '700', color: colors.primary },
  usadoText: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
});
