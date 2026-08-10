import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import EmptyState from '../components/EmptyState';
import Fab from '../components/Fab';
import SegmentedControl from '../components/SegmentedControl';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency } from '../utils/format';
import type { StackParamList } from '../types/navigation';
import type { Pacote } from '../types/entities';

type Props = NativeStackScreenProps<StackParamList, 'Servicos'>;

type Modo = 'servicos' | 'pacotes' | 'produtos';

export default function ServicosScreen({ route, navigation }: Props) {
  const { servicos, pacotes, produtos, agendamentos, pacoteUsadoCount, produtoUsadoCount } = useData();
  const [modo, setModo] = useState<Modo>(route.params?.modo || 'servicos');

  const listaServicos = useMemo(() => {
    return servicos
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((s) => ({
        ...s,
        usos: agendamentos.filter((a) => Array.isArray(a.servicos) && a.servicos.includes(s.id)).length,
      }));
  }, [servicos, agendamentos]);

  const listaPacotes = useMemo(() => {
    return pacotes
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((p) => ({
        ...p,
        usos: pacoteUsadoCount(p.id),
      }));
  }, [pacotes, pacoteUsadoCount]);

  const listaProdutos = useMemo(() => {
    return produtos
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((p) => ({
        ...p,
        usos: produtoUsadoCount(p.id),
      }));
  }, [produtos, produtoUsadoCount]);

  function resumoPacote(pacote: Pacote) {
    const itens = (pacote.servicos || [])
      .map((s) => {
        const serv = servicos.find((x) => x.id === s.servicoId);
        return serv ? `${serv.nome} x${s.qtd}` : null;
      })
      .filter(Boolean);
    return itens.length ? itens.join(' • ') : 'Sem serviços';
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.subtitle}>Cadastre os serviços, pacotes e produtos de atendimento</Text>
        <View style={styles.toggle}>
          <SegmentedControl
            options={[
              { label: 'Serviços', value: 'servicos' },
              { label: 'Pacotes', value: 'pacotes' },
              { label: 'Produtos', value: 'produtos' },
            ]}
            value={modo}
            onChange={setModo}
          />
        </View>
      </View>

      {modo === 'servicos' ? (
        <FlatList
          data={listaServicos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <EmptyState
              icon="cut-outline"
              title="Nenhum serviço cadastrado"
              subtitle="Toque no botão + para cadastrar serviços como Manicure, Pedicure..."
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ServicoForm', { servicoId: item.id })}
            >
              <View style={styles.icone}>
                <Ionicons name="cut-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.nome}>{item.nome}</Text>
                <Text style={styles.meta}>
                  {item.usos} agendamento{item.usos === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={styles.preco}>{formatCurrency(item.preco)}</Text>
            </TouchableOpacity>
          )}
        />
      ) : modo === 'pacotes' ? (
        <FlatList
          data={listaPacotes}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <EmptyState
              icon="grid-outline"
              title="Nenhum pacote cadastrado"
              subtitle="Monte combos de serviços com quantidade e valor para vender às clientes"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PacoteForm', { pacoteId: item.id })}
            >
              <View style={styles.icone}>
                <Ionicons name="grid-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.nome}>{item.nome}</Text>
                <Text style={styles.meta}>{resumoPacote(item)}</Text>
                <Text style={styles.meta}>
                  {item.usos} venda{item.usos === 1 ? '' : 's'}
                </Text>
              </View>
              <Text style={styles.preco}>{formatCurrency(item.valor)}</Text>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList
          data={listaProdutos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
          ListEmptyComponent={
            <EmptyState
              icon="bag-handle-outline"
              title="Nenhum produto cadastrado"
              subtitle="Cadastre esmaltes, lixas e demais produtos vendidos às clientes"
            />
          }
          renderItem={({ item }) => (
            <View style={styles.item}>
              <TouchableOpacity
                style={styles.itemMain}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('ProdutoForm', { produtoId: item.id })}
              >
                <View style={styles.icone}>
                  <Ionicons name="bag-handle-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: spacing.sm }}>
                  <Text style={styles.nome}>{item.nome}</Text>
                  <Text style={styles.meta}>
                    {item.estoque} em estoque • {item.usos} agendamento{item.usos === 1 ? '' : 's'}
                  </Text>
                </View>
                <Text style={styles.preco}>{formatCurrency(item.preco)}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('VendaProduto', { clienteId: null })}
                style={styles.sellBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="cart-outline" size={18} color={colors.primary} />
                <Text style={styles.sellText}>Vender</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Fab
        onPress={() => {
          if (modo === 'servicos') navigation.navigate('ServicoForm', { servicoId: null });
          else if (modo === 'pacotes') navigation.navigate('PacoteForm', { pacoteId: null });
          else navigation.navigate('ProdutoForm', { produtoId: null });
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.sm },
  toggle: { marginBottom: spacing.sm },
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
  itemMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sellBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  sellText: { fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: 4 },
  icone: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  nome: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  preco: { fontSize: 14, fontWeight: '700', color: colors.primary },
});