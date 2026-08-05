import React, { useLayoutEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import SelectField from '../components/SelectField';
import SegmentedControl from '../components/SegmentedControl';
import DateField from '../components/DateField';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';
import { maskCurrency, maskCurrencyInput, parseCurrencyInput, todayISO } from '../utils/format';

export default function ContaFormScreen({ route, navigation }) {
  const { contaId, tipoPreset } = route.params || {};
  const { getConta, addConta, updateConta, deleteConta, centrosCusto, clientes } = useData();
  const { showToast } = useToast();
  const existente = contaId ? getConta(contaId) : null;

  const [tipo, setTipo] = useState(existente?.tipo || tipoPreset || 'receber');
  const [descricao, setDescricao] = useState(existente?.descricao || '');
  const [valorTexto, setValorTexto] = useState(existente?.valor != null ? maskCurrency(existente.valor) : '');
  const [valorPagoTexto, setValorPagoTexto] = useState(
    existente?.valorPago != null && Number(existente.valorPago) > 0 ? maskCurrency(existente.valorPago) : ''
  );
  const [vencimento, setVencimento] = useState(existente?.vencimento || todayISO());
  const [centroCustoId, setCentroCustoId] = useState(existente?.centroCustoId || null);
  const [clienteId, setClienteId] = useState(existente?.clienteId || null);
  const [status, setStatus] = useState(existente?.status || 'pendente');
  const [erros, setErros] = useState({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Conta' : 'Nova Conta' });
  }, [navigation, existente]);

  const opcoesCentros = centrosCusto.map((c) => ({ label: c.nome, value: c.id }));
  const opcoesClientes = clientes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((c) => ({ label: c.nome, value: c.id }));

  function validar() {
    const novosErros = {};
    if (!descricao.trim()) novosErros.descricao = 'Informe a descrição';
    const valor = parseCurrencyInput(valorTexto);
    if (!valor || valor <= 0) novosErros.valor = 'Informe um valor válido';
    const valorPago = parseCurrencyInput(valorPagoTexto);
    if (valorPago > valor) novosErros.valorPago = 'Não pode ser maior que o valor';
    if (!centroCustoId) novosErros.centro = 'Selecione um centro de custo';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleSalvar() {
    if (!validar()) return;
    const valor = parseCurrencyInput(valorTexto);
    const valorPago = parseCurrencyInput(valorPagoTexto);
    const statusFinal = valorPago >= valor ? 'quitado' : valorPago > 0 ? 'pendente' : status;
    const dados = {
      tipo,
      descricao: descricao.trim(),
      valor,
      valorPago,
      vencimento,
      centroCustoId,
      clienteId: tipo === 'receber' ? clienteId : null,
      status: statusFinal,
      dataPagamento:
        statusFinal === 'quitado' ? existente?.dataPagamento || todayISO() : valorPago > 0 ? null : existente?.dataPagamento || null,
    };
    if (existente) {
      updateConta(existente.id, dados);
    } else {
      addConta(dados);
    }
    showToast(existente ? 'Conta atualizada' : 'Conta cadastrada');
    navigation.goBack();
  }

  function handleExcluir() {
    Alert.alert('Excluir conta', `Deseja excluir "${existente.descricao}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteConta(existente.id);
          showToast('Conta excluída', 'error');
          navigation.goBack();
        },
      },
    ]);
  }

  const labelQuitado = tipo === 'pagar' ? 'Pago' : 'Recebido';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        <Text style={styles.label}>Tipo</Text>
        <SegmentedControl
          options={[
            { label: 'A Receber', value: 'receber' },
            { label: 'A Pagar', value: 'pagar' },
          ]}
          value={tipo}
          onChange={setTipo}
        />

        <Input
          label="Descrição"
          required
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Ex: Aluguel do salão - Agosto"
          error={erros.descricao}
          style={{ marginTop: spacing.md }}
        />

        <Input
          label="Valor"
          required
          value={valorTexto}
          onChangeText={(t) => setValorTexto(maskCurrencyInput(t))}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          error={erros.valor}
        />

        <Input
          label={`Valor já ${tipo === 'pagar' ? 'pago' : 'recebido'} (pagamento parcial)`}
          value={valorPagoTexto}
          onChangeText={(t) => setValorPagoTexto(maskCurrencyInput(t))}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          error={erros.valorPago}
        />

        <DateField label="Vencimento" required value={vencimento} onChange={setVencimento} />

        <SelectField
          label="Centro de Custo"
          required
          value={centroCustoId}
          options={opcoesCentros}
          onSelect={setCentroCustoId}
          placeholder="Selecionar centro de custo"
          emptyMessage="Cadastre um centro de custo primeiro"
        />
        {erros.centro ? <Text style={styles.erroText}>{erros.centro}</Text> : null}

        {tipo === 'receber' ? (
          <SelectField
            label="Cliente (opcional)"
            value={clienteId}
            options={opcoesClientes}
            onSelect={setClienteId}
            placeholder="Vincular a uma cliente"
            emptyMessage="Nenhuma cliente cadastrada"
          />
        ) : null}

        <Text style={styles.label}>Status</Text>
        <SegmentedControl
          options={[
            { label: 'Pendente', value: 'pendente' },
            { label: labelQuitado, value: 'quitado' },
          ]}
          value={status}
          onChange={setStatus}
        />

        <Button title="Salvar" onPress={handleSalvar} style={{ marginTop: spacing.lg }} />
        {existente ? (
          <Button title="Excluir Conta" variant="danger" onPress={handleExcluir} style={{ marginTop: spacing.sm }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  erroText: { color: colors.danger, fontSize: 12, marginTop: -12, marginBottom: spacing.sm },
});
