import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import SelectField from '../components/SelectField';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import SegmentedControl from '../components/SegmentedControl';
import EmptyState from '../components/EmptyState';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';
import {
  formatCurrency,
  maskCurrencyInput,
  maskPercent,
  parseCurrencyInput,
} from '../utils/format';

export default function VendaPacoteScreen({ route, navigation }) {
  const { clienteId: clientePreset } = route.params || {};
  const { clientes, pacotes, servicos, getPacote, venderPacote } = useData();
  const { showToast } = useToast();

  const [clienteId, setClienteId] = useState(clientePreset || null);
  const [pacoteId, setPacoteId] = useState(null);
  const [tipoDesconto, setTipoDesconto] = useState('percent');
  const [descontoTexto, setDescontoTexto] = useState('');
  const [erroCliente, setErroCliente] = useState('');
  const [erroPacote, setErroPacote] = useState('');
  const [erroDesconto, setErroDesconto] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'Vender Pacote' });
  }, [navigation]);

  const opcoesClientes = clientes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((c) => ({ label: c.nome, value: c.id }));

  const opcoesPacotes = pacotes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((p) => ({ label: p.nome, value: p.id }));

  const pacote = pacoteId ? getPacote(pacoteId) : null;

  const itensPreview = useMemo(() => {
    if (!pacote) return [];
    return (pacote.servicos || [])
      .map((s) => {
        const serv = servicos.find((x) => x.id === s.servicoId);
        return { servicoId: s.servicoId, qtd: s.qtd, nome: serv?.nome || 'Serviço removido' };
      })
      .filter((s) => Number(s.qtd) > 0);
  }, [pacote, servicos]);

  const valorPacote = pacote ? Number(pacote.valor || 0) : 0;

  const descontoValor = useMemo(() => {
    if (!pacote) return 0;
    if (tipoDesconto === 'percent') {
      const pct = parseInt((descontoTexto || '').replace(/\D/g, ''), 10) || 0;
      return (valorPacote * Math.min(pct, 100)) / 100;
    }
    return parseCurrencyInput(descontoTexto);
  }, [pacote, tipoDesconto, descontoTexto, valorPacote]);

  const valorFinal = Math.max(0, valorPacote - descontoValor);

  function handleVender() {
    let ok = true;
    if (!clienteId) {
      setErroCliente('Selecione a cliente');
      ok = false;
    } else {
      setErroCliente('');
    }
    if (!pacoteId) {
      setErroPacote('Selecione o pacote');
      ok = false;
    } else {
      setErroPacote('');
    }
    if (pacote && descontoValor > valorPacote) {
      setErroDesconto('O desconto não pode ser maior que o valor do pacote');
      ok = false;
    } else {
      setErroDesconto('');
    }
    if (!ok) return;

    venderPacote(clienteId, pacoteId, descontoValor);
    showToast('Pacote vendido');
    navigation.goBack();
  }

  if (clientes.length === 0 || pacotes.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="grid-outline"
          title="Cadastre cliente e pacote"
          subtitle="Você precisa de ao menos uma cliente e um pacote cadastrado para vender"
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
            <Text style={styles.presetText}>
              {clientes.find((c) => c.id === clienteId)?.nome || 'Cliente'}
            </Text>
          </Card>
        )}

        <SelectField
          label="Pacote"
          required
          value={pacoteId}
          options={opcoesPacotes}
          onSelect={setPacoteId}
          placeholder="Selecionar pacote"
        />
        {erroPacote ? <Text style={styles.erroText}>{erroPacote}</Text> : null}

        {pacote ? (
          <Card style={styles.preview}>
            <View style={styles.previewHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.previewNome}>{pacote.nome}</Text>
                <Text style={styles.previewMeta}>{itensPreview.length} serviço(s) incluído(s)</Text>
              </View>
              <Text style={styles.previewValor}>{formatCurrency(valorPacote)}</Text>
            </View>
            {itensPreview.map((it) => (
              <View key={it.servicoId} style={styles.previewItem}>
                <Text style={styles.previewItemNome}>{it.nome}</Text>
                <Text style={styles.previewItemQtd}>x{it.qtd}</Text>
              </View>
            ))}
            <Text style={styles.previewObs}>
              A venda gera uma conta a receber no Financeiro e um saldo de serviços para a cliente.
            </Text>
          </Card>
        ) : null}

        {pacote ? (
          <>
            <Text style={styles.label}>Desconto</Text>
            <SegmentedControl
              options={[
                { label: 'Percentual (%)', value: 'percent' },
                { label: 'Valor (R$)', value: 'fixed' },
              ]}
              value={tipoDesconto}
              onChange={setTipoDesconto}
            />
            <Input
              label={tipoDesconto === 'percent' ? 'Desconto' : 'Desconto'}
              value={descontoTexto}
              onChangeText={(t) => {
                if (tipoDesconto === 'percent') {
                  setDescontoTexto(maskPercent(t));
                } else {
                  setDescontoTexto(maskCurrencyInput(t));
                }
                setErroDesconto('');
              }}
              placeholder={tipoDesconto === 'percent' ? '0%' : 'R$ 0,00'}
              keyboardType="decimal-pad"
              error={erroDesconto}
            />
          </>
        ) : null}

        {pacote && descontoValor > 0 ? (
          <Card style={styles.resumoCard}>
            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Valor do pacote</Text>
              <Text style={styles.resumoText}>{formatCurrency(valorPacote)}</Text>
            </View>
            <View style={styles.resumoRow}>
              <Text style={styles.resumoLabel}>Desconto</Text>
              <Text style={[styles.resumoText, { color: colors.danger }]}>
                -{formatCurrency(descontoValor)}
              </Text>
            </View>
            <View style={[styles.resumoRow, styles.resumoTotal]}>
              <Text style={styles.resumoTotalLabel}>Total a pagar</Text>
              <Text style={styles.resumoTotalValue}>{formatCurrency(valorFinal)}</Text>
            </View>
          </Card>
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
  preview: { marginTop: spacing.sm },
  previewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  previewNome: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  previewMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  previewValor: { fontSize: 16, fontWeight: '700', color: colors.primary },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  previewItemNome: { fontSize: 14, color: colors.textPrimary },
  previewItemQtd: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  resumoCard: {
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.surfaceAlt,
  },
  resumoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  resumoLabel: { fontSize: 13, color: colors.textSecondary },
  resumoText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  resumoTotal: { marginTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.sm },
  resumoTotalLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  resumoTotalValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  previewObs: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    padding: spacing.sm,
  },
});
