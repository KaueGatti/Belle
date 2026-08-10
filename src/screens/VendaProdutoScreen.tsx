import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import SelectField from '../components/SelectField';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import DateField from '../components/DateField';
import EmptyState from '../components/EmptyState';
import StepperList from '../components/StepperList';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';
import { formatCurrency, maskCurrencyInput, parseCurrencyInput, todayISO } from '../utils/format';
import type { StackParamList } from '../types/navigation';
import type { ProdutoItem } from '../types/entities';

type Props = NativeStackScreenProps<StackParamList, 'VendaProduto'>;

export default function VendaProdutoScreen({ route, navigation }: Props) {
  const { clienteId: clientePreset } = route.params || {};
  const { clientes, produtos, venderProduto } = useData();
  const { showToast } = useToast();

  const [clienteId, setClienteId] = useState(clientePreset || null);
  const [qtds, setQtds] = useState<Partial<Record<string, number>>>({});
  const [dataVenda, setDataVenda] = useState(todayISO());
  const [dataRecebimento, setDataRecebimento] = useState(todayISO());
  const [valorPagoTexto, setValorPagoTexto] = useState('');
  const [erroCliente, setErroCliente] = useState('');
  const [erroItens, setErroItens] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Vender Produtos' });
  }, [navigation]);

  const opcoesClientes = clientes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((c) => ({ label: c.nome, value: c.id }));

  const listaProdutos = useMemo(() => {
    return produtos
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((p) => ({
        value: p.id,
        label: p.nome,
        subtitle: `${p.estoque} em estoque`,
        price: p.preco,
        qtd: qtds[p.id] || 0,
        maxQtd: Math.max(0, p.estoque || 0),
        disabled: Number(p.estoque || 0) <= 0,
        disabledReason: Number(p.estoque || 0) <= 0 ? 'Sem estoque' : undefined,
        icon: 'bag-handle-outline' as const,
      }));
  }, [produtos, qtds]);

  const itens: ProdutoItem[] = useMemo(
    () =>
      Object.entries(qtds)
        .filter(([, q]) => Number(q) > 0)
        .map(([id, q]) => ({ produtoId: id, qtd: Number(q) || 1 })),
    [qtds]
  );

  const total = useMemo(
    () =>
      itens.reduce((acc, it) => {
        const p = produtos.find((x) => x.id === it.produtoId);
        return acc + Number(p?.preco || 0) * it.qtd;
      }, 0),
    [itens, produtos]
  );

  function handleVender() {
    let ok = true;
    if (!clienteId) {
      setErroCliente('Selecione a cliente');
      ok = false;
    } else {
      setErroCliente('');
    }
    if (itens.length === 0) {
      setErroItens('Selecione ao menos um produto');
      ok = false;
    } else {
      setErroItens('');
    }
    const valorPago = parseCurrencyInput(valorPagoTexto);
    if (valorPago > total) {
      setErroItens('O valor já recebido não pode ser maior que o total');
      ok = false;
    }
    if (!ok) return;

    const salvou = venderProduto(clienteId as string, itens, {
      dataVenda,
      valorPago,
      dataRecebimento,
    });
    if (!salvou) {
      setErroItens('Não foi possível registrar a venda');
      return;
    }
    showToast('Produtos vendidos');
    navigation.goBack();
  }

  if (clientes.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="person-add-outline"
          title="Cadastre uma cliente primeiro"
          subtitle="Você precisa ter ao menos uma cliente cadastrada para vender produtos"
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        {!clientePreset ? (
          <>
            <SelectField
              label="Cliente"
              required
              value={clienteId}
              options={opcoesClientes}
              onSelect={setClienteId}
              placeholder="Selecionar cliente"
            />
            {erroCliente ? <Text style={styles.erroText}>{erroCliente}</Text> : null}
          </>
        ) : (
          <Card style={styles.presetCard}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <Text style={styles.presetText}>{clientes.find((c) => c.id === clienteId)?.nome || 'Cliente'}</Text>
          </Card>
        )}

        <Text style={styles.label}>Produtos</Text>
        <StepperList
          options={listaProdutos}
          emptyMessage={produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Sem produtos disponíveis'}
          onIncrement={(value) => {
            const p = produtos.find((x) => x.id === value);
            const max = Math.max(0, Number(p?.estoque || 0));
            setQtds((prev) => ({ ...prev, [value]: Math.min(max, (prev[value] || 0) + 1) }));
            setErroItens('');
          }}
          onDecrement={(value) =>
            setQtds((prev) => ({ ...prev, [value]: Math.max(0, (prev[value] || 0) - 1) }))
          }
        />
        {erroItens ? <Text style={styles.erroText}>{erroItens}</Text> : null}

        {itens.length > 0 ? (
          <Card style={styles.resumoCard}>
            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Total</Text>
              <Text style={styles.resumoTotal}>{formatCurrency(total)}</Text>
            </View>
            <Text style={styles.resumoObs}>
              A venda gera uma conta a receber no Financeiro e baixa o estoque dos produtos.
            </Text>
          </Card>
        ) : null}

        <Text style={styles.label}>Data da venda</Text>
        <DateField
          value={dataVenda}
          onChange={(d) => {
            setDataVenda(d);
            setDataRecebimento(d);
          }}
        />

        <Input
          label="Valor já recebido na venda"
          value={valorPagoTexto}
          onChangeText={(t) => setValorPagoTexto(maskCurrencyInput(t))}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
        />
        {parseCurrencyInput(valorPagoTexto) > 0 ? (
          <DateField label="Data do recebimento" value={dataRecebimento} onChange={setDataRecebimento} />
        ) : null}

        <Button title="Confirmar Venda" onPress={handleVender} style={{ marginTop: spacing.md }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryLight,
  },
  presetText: { marginLeft: spacing.sm, fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  erroText: { color: colors.danger, fontSize: 12, marginTop: -8, marginBottom: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  resumoCard: { marginTop: spacing.sm, backgroundColor: colors.surfaceAlt, borderColor: colors.surfaceAlt },
  resumoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  resumoLabel: { fontSize: 13, color: colors.textSecondary },
  resumoTotal: { fontSize: 16, fontWeight: '700', color: colors.primary },
  resumoObs: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: spacing.sm,
  },
});