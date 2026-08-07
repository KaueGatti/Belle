import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';
import { maskCurrency, maskCurrencyInput, parseCurrencyInput } from '../utils/format';

export default function ServicoFormScreen({ route, navigation }) {
  const { servicoId } = route.params || {};
  const { getServico, addServico, updateServico, deleteServico, servicoUsadoCount } = useData();
  const { showToast } = useToast();
  const existente = servicoId ? getServico(servicoId) : null;

  const [nome, setNome] = useState(existente?.nome || '');
  const [precoTexto, setPrecoTexto] = useState(existente?.preco != null ? maskCurrency(existente.preco) : '');
  const [duracaoTexto, setDuracaoTexto] = useState(existente?.duracao != null ? String(existente.duracao) : '');
  const [erroNome, setErroNome] = useState('');
  const [erroPreco, setErroPreco] = useState('');
  const [erroDuracao, setErroDuracao] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Serviço' : 'Novo Serviço' });
  }, [navigation, existente]);

  function handleSalvar() {
    let ok = true;
    if (!nome.trim()) {
      setErroNome('Informe o nome do serviço');
      ok = false;
    } else {
      setErroNome('');
    }
    const preco = parseCurrencyInput(precoTexto);
    if (!preco || preco <= 0) {
      setErroPreco('Informe um preço válido');
      ok = false;
    } else {
      setErroPreco('');
    }
    const duracao = parseInt((duracaoTexto || '').replace(/\D/g, ''), 10) || 0;
    if (duracao <= 0) {
      setErroDuracao('Informe uma duração válida (min)');
      ok = false;
    } else {
      setErroDuracao('');
    }
    if (!ok) return;

    const dados = { nome: nome.trim(), preco, duracao };
    if (existente) {
      updateServico(existente.id, dados);
    } else {
      addServico(dados);
    }
    showToast(existente ? 'Serviço atualizado' : 'Serviço cadastrado');
    navigation.goBack();
  }

  function handleExcluir() {
    const usos = servicoUsadoCount(existente.id);
    if (usos > 0) {
      Alert.alert('Não é possível excluir', `Este serviço está vinculado a ${usos} agendamento(s).`);
      return;
    }
    Alert.alert('Excluir serviço', `Deseja excluir "${existente.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteServico(existente.id);
          showToast('Serviço excluído', 'error');
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        <Input
          label="Nome"
          required
          value={nome}
          onChangeText={(t) => {
            setNome(t);
            if (t.trim()) setErroNome('');
          }}
          placeholder="Ex: Manicure"
          error={erroNome}
        />
        <Input
          label="Preço"
          required
          value={precoTexto}
          onChangeText={(t) => {
            setPrecoTexto(maskCurrencyInput(t));
            if (parseCurrencyInput(t) > 0) setErroPreco('');
          }}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          error={erroPreco}
        />
        <Input
          label="Duração estimada (minutos)"
          required
          value={duracaoTexto}
          onChangeText={(t) => {
            setDuracaoTexto((t || '').replace(/\D/g, ''));
            if (parseInt(t.replace(/\D/g, ''), 10) > 0) setErroDuracao('');
          }}
          placeholder="Ex: 45"
          keyboardType="number-pad"
          error={erroDuracao}
        />

        <Button title="Salvar" onPress={handleSalvar} style={{ marginTop: spacing.sm }} />
        {existente ? (
          <Button title="Excluir Serviço" variant="danger" onPress={handleExcluir} style={{ marginTop: spacing.sm }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
