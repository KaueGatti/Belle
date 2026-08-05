import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';
import { formatCurrency, maskPhone } from '../utils/format';

export default function ClienteFormScreen({ route, navigation }) {
  const { clienteId } = route.params || {};
  const { getCliente, addCliente, updateCliente, deleteCliente, agendamentos, contas } = useData();
  const { showToast } = useToast();
  const existente = clienteId ? getCliente(clienteId) : null;

  const [nome, setNome] = useState(existente?.nome || '');
  const [telefone, setTelefone] = useState(existente?.telefone ? maskPhone(existente.telefone) : '');
  const [email, setEmail] = useState(existente?.email || '');
  const [observacoes, setObservacoes] = useState(existente?.observacoes || '');
  const [erroNome, setErroNome] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Cliente' : 'Nova Cliente' });
  }, [navigation, existente]);

  const resumo = useMemo(() => {
    if (!clienteId) return null;
    const ags = agendamentos.filter((a) => a.clienteId === clienteId);
    const totalRecebido = contas
      .filter((c) => c.clienteId === clienteId && c.tipo === 'receber' && c.status === 'quitado')
      .reduce((sum, c) => sum + Number(c.valor || 0), 0);
    return { totalAgendamentos: ags.length, totalRecebido };
  }, [clienteId, agendamentos, contas]);

  function handleSalvar() {
    if (!nome.trim()) {
      setErroNome('Informe o nome da cliente');
      return;
    }
    const dados = { nome: nome.trim(), telefone: telefone.trim(), email: email.trim(), observacoes: observacoes.trim() };
    if (existente) {
      updateCliente(existente.id, dados);
    } else {
      addCliente(dados);
    }
    showToast(existente ? 'Cliente atualizada' : 'Cliente cadastrada');
    navigation.goBack();
  }

  function handleExcluir() {
    Alert.alert('Excluir cliente', `Deseja excluir "${existente.nome}"? Esta ação não pode ser desfeita.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteCliente(existente.id);
          showToast('Cliente excluída', 'error');
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        {resumo ? (
          <Card style={{ marginBottom: spacing.md, flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.resumoValor}>{resumo.totalAgendamentos}</Text>
              <Text style={styles.resumoLabel}>Agendamentos</Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.resumoValor}>{formatCurrency(resumo.totalRecebido)}</Text>
              <Text style={styles.resumoLabel}>Total recebido</Text>
            </View>
          </Card>
        ) : null}

        <Input
          label="Nome"
          required
          value={nome}
          onChangeText={(t) => {
            setNome(t);
            if (t.trim()) setErroNome('');
          }}
          placeholder="Nome completo"
          error={erroNome}
        />
        <Input
          label="Telefone"
          value={telefone}
          onChangeText={(t) => setTelefone(maskPhone(t))}
          placeholder="(00) 00000-0000"
          keyboardType="phone-pad"
        />
        <Input label="E-mail" value={email} onChangeText={setEmail} placeholder="opcional" keyboardType="email-address" />
        <Input
          label="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Preferências, alergias, histórico..."
          multiline
        />

        <Button title="Salvar" onPress={handleSalvar} style={{ marginTop: spacing.sm }} />
        {existente ? (
          <Button title="Excluir Cliente" variant="danger" onPress={handleExcluir} style={{ marginTop: spacing.sm }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  resumoValor: { fontSize: 17, fontWeight: '700', color: colors.primary },
  resumoLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
