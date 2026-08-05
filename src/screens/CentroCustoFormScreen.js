import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, Text, Alert, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import SegmentedControl from '../components/SegmentedControl';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';

export default function CentroCustoFormScreen({ route, navigation }) {
  const { centroCustoId } = route.params || {};
  const { getCentroCusto, addCentroCusto, updateCentroCusto, deleteCentroCusto, contaCountForCentro } = useData();
  const { showToast } = useToast();
  const existente = centroCustoId ? getCentroCusto(centroCustoId) : null;

  const [nome, setNome] = useState(existente?.nome || '');
  const [tipo, setTipo] = useState(existente?.tipo || 'despesa');
  const [descricao, setDescricao] = useState(existente?.descricao || '');
  const [erroNome, setErroNome] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Centro de Custo' : 'Novo Centro de Custo' });
  }, [navigation, existente]);

  function handleSalvar() {
    if (!nome.trim()) {
      setErroNome('Informe o nome do centro de custo');
      return;
    }
    const dados = { nome: nome.trim(), tipo, descricao: descricao.trim() };
    if (existente) {
      updateCentroCusto(existente.id, dados);
    } else {
      addCentroCusto(dados);
    }
    showToast(existente ? 'Categoria atualizada' : 'Categoria cadastrada');
    navigation.goBack();
  }

  function handleExcluir() {
    const qtd = contaCountForCentro(existente.id);
    if (qtd > 0) {
      Alert.alert(
        'Não é possível excluir',
        `Existem ${qtd} conta(s) vinculada(s) a este centro de custo. Reatribua ou exclua essas contas antes de remover a categoria.`
      );
      return;
    }
    Alert.alert('Excluir centro de custo', `Deseja excluir "${existente.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteCentroCusto(existente.id);
          showToast('Categoria excluída', 'error');
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
          placeholder="Ex: Produtos e Materiais"
          error={erroNome}
        />

        <Text style={styles.label}>Tipo</Text>
        <SegmentedControl
          options={[
            { label: 'Receita', value: 'receita' },
            { label: 'Despesa', value: 'despesa' },
            { label: 'Ambos', value: 'ambos' },
          ]}
          value={tipo}
          onChange={setTipo}
        />

        <Input
          label="Descrição (opcional)"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Detalhes sobre esta categoria"
          multiline
          style={{ marginTop: spacing.md }}
        />

        <Button title="Salvar" onPress={handleSalvar} style={{ marginTop: spacing.sm }} />
        {existente ? (
          <Button title="Excluir Centro de Custo" variant="danger" onPress={handleExcluir} style={{ marginTop: spacing.sm }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
});
