import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import SegmentedControl from '../components/SegmentedControl';
import PeriodFilter from '../components/PeriodFilter';
import Fab from '../components/Fab';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import {
  formatCurrency,
  formatDateBR,
  isPast,
  maskCurrencyInput,
  parseCurrencyInput,
  contaInPeriodo,
} from '../utils/format';

export default function FinanceiroScreen({ navigation }) {
  const { contas, getCentroCusto, pagarConta, marcarContaStatus } = useData();
  const { showToast } = useToast();
  const [tipo, setTipo] = useState('receber'); // pagar | receber
  const [statusFiltro, setStatusFiltro] = useState('pendente'); // pendente | quitado | todos
  const [periodo, setPeriodo] = useState(null);

  const [pagamento, setPagamento] = useState(null); // conta em pagamento
  const [pagamentoTexto, setPagamentoTexto] = useState('');
  const [erroPagamento, setErroPagamento] = useState('');

  const listaFiltrada = useMemo(() => {
    let lista = contas.filter((c) => c.tipo === tipo && contaInPeriodo(c, periodo));
    if (statusFiltro !== 'todos') lista = lista.filter((c) => c.status === statusFiltro);
    return lista.sort((a, b) => (a.vencimento || '').localeCompare(b.vencimento || ''));
  }, [contas, tipo, statusFiltro, periodo]);

  const totais = useMemo(() => {
    const doTipo = contas.filter((c) => c.tipo === tipo && contaInPeriodo(c, periodo));
    const pendente = doTipo
      .filter((c) => c.status === 'pendente')
      .reduce((s, c) => s + (Number(c.valor || 0) - Number(c.valorPago || 0)), 0);
    const quitado = doTipo.filter((c) => c.status === 'quitado').reduce((s, c) => s + Number(c.valor || 0), 0);
    return { pendente, quitado };
  }, [contas, tipo, periodo]);

  const acaoLabel = tipo === 'pagar' ? 'Pago' : 'Recebido';

  function abrirPagamento(conta) {
    setPagamento(conta);
    setPagamentoTexto('');
    setErroPagamento('');
  }

  function confirmarPagamento() {
    const valor = parseCurrencyInput(pagamentoTexto);
    if (!valor || valor <= 0) {
      setErroPagamento('Informe um valor válido');
      return;
    }
    pagarConta(pagamento.id, valor);
    showToast(pagamento.tipo === 'pagar' ? 'Pagamento registrado' : 'Recebimento registrado');
    setPagamento(null);
  }

  function pagarRestante() {
    const restante = Number(pagamento.valor || 0) - Number(pagamento.valorPago || 0);
    setPagamentoTexto(String(restante));
    setErroPagamento('');
  }

  return (
    <Screen>
      <View style={styles.header}>
        <SegmentedControl
          options={[
            { label: 'A Receber', value: 'receber' },
            { label: 'A Pagar', value: 'pagar' },
          ]}
          value={tipo}
          onChange={setTipo}
        />

        <View style={styles.totaisRow}>
          <Card style={[styles.totalCard, { backgroundColor: colors.warningLight, borderColor: colors.warningLight }]}>
            <Text style={[styles.totalLabel, { color: colors.warning }]}>Pendente</Text>
            <Text style={[styles.totalValor, { color: colors.warning }]}>{formatCurrency(totais.pendente)}</Text>
          </Card>
          <Card style={[styles.totalCard, { backgroundColor: colors.successLight, borderColor: colors.successLight }]}>
            <Text style={[styles.totalLabel, { color: colors.success }]}>{acaoLabel}</Text>
            <Text style={[styles.totalValor, { color: colors.success }]}>{formatCurrency(totais.quitado)}</Text>
          </Card>
        </View>

        <View style={styles.filtroRow}>
          {['pendente', 'quitado', 'todos'].map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setStatusFiltro(f)}
              style={[styles.filtroChip, statusFiltro === f && styles.filtroChipAtivo]}
            >
              <Text style={[styles.filtroText, statusFiltro === f && styles.filtroTextAtivo]}>
                {f === 'pendente' ? 'Pendentes' : f === 'quitado' ? acaoLabel + 's' : 'Todos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.periodoWrap}>
          <PeriodFilter value={periodo} onChange={setPeriodo} />
        </View>
      </View>

      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon="cash-outline"
            title="Nenhuma conta encontrada"
            subtitle="Toque no botão + para lançar uma nova conta"
          />
        }
        renderItem={({ item }) => {
          const centro = getCentroCusto(item.centroCustoId);
          const atrasada = item.status === 'pendente' && isPast(item.vencimento);
          const valorPago = Number(item.valorPago || 0);
          const restante = Number(item.valor || 0) - valorPago;
          return (
            <TouchableOpacity
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ContaForm', { contaId: item.id, tipoPreset: tipo })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.descricao}>{item.descricao}</Text>
                <Text style={styles.meta}>
                  Vencimento: {formatDateBR(item.vencimento)}
                  {centro ? ` • ${centro.nome}` : ''}
                </Text>
                {valorPago > 0 && item.status === 'pendente' ? (
                  <View style={styles.progressRow}>
                    <View style={styles.progressBg}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(100, (valorPago / Number(item.valor || 0)) * 100)}%` },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {formatCurrency(valorPago)} de {formatCurrency(item.valor)}
                    </Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center', gap: 8 }}>
                  <StatusBadge status={atrasada ? 'atrasado' : item.status} label={atrasada ? 'Atrasado' : undefined} />
                  {item.status === 'pendente' && restante > 0 ? (
                    <Text style={styles.restanteText}>Falta {formatCurrency(restante)}</Text>
                  ) : null}
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.valor}>{formatCurrency(item.valor)}</Text>
                {item.status === 'pendente' ? (
                  <TouchableOpacity style={styles.acaoBtn} onPress={() => abrirPagamento(item)}>
                    <Ionicons name="card-outline" size={14} color={colors.primary} />
                    <Text style={[styles.acaoBtnText, { color: colors.primary }]}>{acaoLabel}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.acaoBtn}
                    onPress={() => {
                      marcarContaStatus(item.id, 'pendente');
                      showToast('Conta revertida para pendente', 'info');
                    }}
                  >
                    <Ionicons name="arrow-undo-outline" size={14} color={colors.textSecondary} />
                    <Text style={[styles.acaoBtnText, { color: colors.textSecondary }]}>Reverter</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Fab onPress={() => navigation.navigate('ContaForm', { contaId: null, tipoPreset: tipo })} />

      <Modal visible={!!pagamento} transparent animationType="fade" onRequestClose={() => setPagamento(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPagamento(null)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {pagamento ? (
              <>
                <Text style={styles.sheetTitle}>
                  {pagamento.tipo === 'pagar' ? 'Pagar conta' : 'Receber da conta'}
                </Text>
                <Text style={styles.sheetSubtitle}>{pagamento.descricao}</Text>
                <Text style={styles.sheetValor}>
                  {formatCurrency(pagamento.valorPago || 0)} de {formatCurrency(pagamento.valor)} recebido
                </Text>
                <Input
                  label="Valor deste pagamento"
                  value={pagamentoTexto}
                  onChangeText={(t) => {
                    setPagamentoTexto(maskCurrencyInput(t));
                    setErroPagamento('');
                  }}
                  placeholder="R$ 0,00"
                  keyboardType="decimal-pad"
                  error={erroPagamento}
                  style={{ marginTop: spacing.sm }}
                />
                <TouchableOpacity onPress={pagarRestante} style={styles.restanteLink}>
                  <Text style={styles.restanteLinkText}>
                    Pagar valor restante ({formatCurrency(Number(pagamento.valor || 0) - Number(pagamento.valorPago || 0))})
                  </Text>
                </TouchableOpacity>
                <Button title="Confirmar" onPress={confirmarPagamento} style={{ marginTop: spacing.sm }} />
                <Button title="Cancelar" variant="ghost" onPress={() => setPagamento(null)} style={{ marginTop: spacing.sm }} />
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  totaisRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  totalCard: { flex: 1, borderWidth: 0 },
  totalLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  totalValor: { fontSize: 17, fontWeight: '700' },
  filtroRow: { flexDirection: 'row', gap: 8, marginTop: spacing.md },
  periodoWrap: { marginTop: spacing.md },
  filtroChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  filtroChipAtivo: { backgroundColor: colors.primary },
  filtroText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filtroTextAtivo: { color: colors.textInverse },
  item: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  descricao: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  valor: { fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  acaoBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  acaoBtnText: { fontSize: 12, fontWeight: '700', color: colors.success },
  progressRow: { alignItems: 'center', marginTop: 6, gap: 4 },
  progressBg: { height: 5, borderRadius: 3, backgroundColor: colors.surfaceAlt, width: '100%', overflow: 'hidden' },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.primary },
  progressText: { fontSize: 11, color: colors.textSecondary, alignSelf: 'flex-start', marginTop: 2 },
  restanteText: { fontSize: 11, fontWeight: '600', color: colors.warning },
  backdrop: { flex: 1, backgroundColor: 'rgba(46,33,38,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sheetSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  sheetValor: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 8 },
  restanteLink: { alignItems: 'center', marginTop: -4, marginBottom: 4 },
  restanteLinkText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
});
