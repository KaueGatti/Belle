import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, Alert } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';
import { maskCurrency, maskCurrencyInput, parseCurrencyInput } from '../utils/format';
import type { StackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<StackParamList, 'ProdutoForm'>;

export default function ProdutoFormScreen({ route, navigation }: Props) {
  const { produtoId } = route.params || {};
  const { getProduto, addProduto, updateProduto, deleteProduto, produtoUsadoCount } = useData();
  const { showToast } = useToast();
  const existente = produtoId ? getProduto(produtoId) : null;

  const [nome, setNome] = useState(existente?.nome || '');
  const [precoTexto, setPrecoTexto] = useState(existente?.preco != null ? maskCurrency(existente.preco) : '');
  const [estoqueTexto, setEstoqueTexto] = useState(existente?.estoque != null ? String(existente.estoque) : '');
  const [erroNome, setErroNome] = useState('');
  const [erroPreco, setErroPreco] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Produto' : 'Novo Produto' });
  }, [navigation, existente]);

  function handleSalvar() {
    let ok = true;
    if (!nome.trim()) {
      setErroNome('Informe o nome do produto');
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
    const estoque = Math.max(0, parseInt((estoqueTexto || '').replace(/\D/g, ''), 10) || 0);
    if (!ok) return;

    const dados = { nome: nome.trim(), preco, estoque };
    if (existente) {
      updateProduto(existente.id, dados);
    } else {
      addProduto(dados);
    }
    showToast(existente ? 'Produto atualizado' : 'Produto cadastrado');
    navigation.goBack();
  }

  function handleExcluir() {
    if (!existente) return;
    const usos = produtoUsadoCount(existente.id);
    if (usos > 0) {
      Alert.alert('Não é possível excluir', `Este produto está vinculado a ${usos} agendamento(s).`);
      return;
    }
    Alert.alert('Excluir produto', `Deseja excluir "${existente.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteProduto(existente.id);
          showToast('Produto excluído', 'error');
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
          placeholder="Ex: Esmalte vermelho, Lixa..."
          error={erroNome}
        />
        <Input
          label="Preço de venda"
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
          label="Estoque atual"
          value={estoqueTexto}
          onChangeText={(t) => setEstoqueTexto((t || '').replace(/\D/g, ''))}
          placeholder="Ex: 10"
          keyboardType="number-pad"
        />

        <Button title="Salvar" onPress={handleSalvar} style={{ marginTop: spacing.sm }} />
        {existente ? (
          <Button title="Excluir Produto" variant="danger" onPress={handleExcluir} style={{ marginTop: spacing.sm }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}