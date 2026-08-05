import React, { useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import EmptyState from '../components/EmptyState';
import Fab from '../components/Fab';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency } from '../utils/format';

const TIPO_LABEL = { receita: 'Receita', despesa: 'Despesa', ambos: 'Receita e Despesa' };
const TIPO_COR = { receita: colors.success, despesa: colors.danger, ambos: colors.info };

export default function CentroCustoScreen({ navigation }) {
  const { centrosCusto, contas } = useData();

  const lista = useMemo(() => {
    return centrosCusto
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((cc) => {
        const contasDoCentro = contas.filter((c) => c.centroCustoId === cc.id);
        const total = contasDoCentro.reduce((sum, c) => sum + Number(c.valor || 0), 0);
        return { ...cc, quantidade: contasDoCentro.length, total };
      });
  }, [centrosCusto, contas]);

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Organize suas receitas e despesas por categoria</Text>
      </View>

      <FlatList
        data={lista}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon="pricetags-outline"
            title="Nenhum centro de custo"
            subtitle="Toque no botão + para criar categorias como Serviços, Produtos, Aluguel..."
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('CentroCustoForm', { centroCustoId: item.id })}
          >
            <View style={[styles.icone, { backgroundColor: TIPO_COR[item.tipo] + '22' }]}>
              <Ionicons name="pricetag-outline" size={20} color={TIPO_COR[item.tipo]} />
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.meta}>
                {TIPO_LABEL[item.tipo]} • {item.quantidade} conta{item.quantidade === 1 ? '' : 's'}
              </Text>
            </View>
            <Text style={styles.total}>{formatCurrency(item.total)}</Text>
          </TouchableOpacity>
        )}
      />

      <Fab onPress={() => navigation.navigate('CentroCustoForm', { centroCustoId: null })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
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
  icone: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  total: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
});
