import React, { useLayoutEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, maskCurrency, maskCurrencyInput, parseCurrencyInput } from '../utils/format';

export default function PacoteFormScreen({ route, navigation }) {
  const { pacoteId } = route.params || {};
  const { servicos, getPacote, addPacote, updatePacote, deletePacote, pacoteUsadoCount } = useData();
  const { showToast } = useToast();
  const existente = pacoteId ? getPacote(pacoteId) : null;

  const [nome, setNome] = useState(existente?.nome || '');
  const [valorTexto, setValorTexto] = useState(existente?.valor != null ? maskCurrency(existente.valor) : '');
  const [itens, setItens] = useState(() =>
    (existente?.servicos || []).map((s) => ({ servicoId: s.servicoId, qtd: Number(s.qtd) || 0 }))
  );
  const [erros, setErros] = useState({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Pacote' : 'Novo Pacote' });
  }, [navigation, existente]);

  function qtdOf(servicoId) {
    return itens.find((i) => i.servicoId === servicoId)?.qtd || 0;
  }

  function toggleServico(servicoId) {
    setItens((prev) => {
      const existe = prev.find((i) => i.servicoId === servicoId);
      if (existe) return prev.filter((i) => i.servicoId !== servicoId);
      return [...prev, { servicoId, qtd: 1 }];
    });
  }

  function setQtd(servicoId, delta) {
    setItens((prev) =>
      prev.map((i) =>
        i.servicoId === servicoId ? { ...i, qtd: Math.max(0, Number(i.qtd || 0) + delta) } : i
      )
    );
  }

  function handleSalvar() {
    const novosErros = {};
    if (!nome.trim()) novosErros.nome = 'Informe o nome do pacote';
    const itensValidos = itens.filter((i) => Number(i.qtd) > 0);
    if (itensValidos.length === 0) novosErros.servicos = 'Selecione ao menos um serviço com quantidade';
    const valor = parseCurrencyInput(valorTexto);
    if (!valor || valor <= 0) novosErros.valor = 'Informe o valor do pacote';
    setErros(novosErros);
    if (Object.keys(novosErros).length > 0) return;

    const dados = {
      nome: nome.trim(),
      servicos: itensValidos.map((i) => ({ servicoId: i.servicoId, qtd: Number(i.qtd) })),
      valor,
    };
    if (existente) {
      updatePacote(existente.id, dados);
    } else {
      addPacote(dados);
    }
    showToast(existente ? 'Pacote atualizado' : 'Pacote cadastrado');
    navigation.goBack();
  }

  function handleExcluir() {
    const usos = pacoteUsadoCount(existente.id);
    if (usos > 0) {
      Alert.alert('Não é possível excluir', `Este pacote já foi vendido ${usos} vez(es).`);
      return;
    }
    Alert.alert('Excluir pacote', `Deseja excluir "${existente.nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deletePacote(existente.id);
          showToast('Pacote excluído', 'error');
          navigation.goBack();
        },
      },
    ]);
  }

  const listaServicos = servicos.slice().sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        <Input
          label="Nome do pacote"
          required
          value={nome}
          onChangeText={(t) => {
            setNome(t);
            if (t.trim()) setErros((e) => ({ ...e, nome: '' }));
          }}
          placeholder="Ex: Pacote Manicure Mensal"
          error={erros.nome}
        />

        <Text style={styles.label}>Serviços incluídos</Text>
        {listaServicos.length === 0 ? (
          <View style={styles.semServicos}>
            <Text style={styles.semServicosText}>
              Cadastre serviços antes de montar o pacote. Cada serviço selecionado recebe uma quantidade.
            </Text>
            <Button
              title="Cadastrar Serviço"
              variant="outline"
              onPress={() => navigation.navigate('ServicoForm', { servicoId: null })}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        ) : (
          listaServicos.map((s) => {
            const qtd = qtdOf(s.id);
            const ativo = qtd > 0;
            return (
              <View key={s.id} style={[styles.item, ativo && styles.itemAtivo]}>
                <TouchableOpacity style={styles.itemMain} onPress={() => toggleServico(s.id)} activeOpacity={0.7}>
                  <View style={[styles.check, ativo && styles.checkAtivo]}>
                    {ativo ? <Ionicons name="checkmark" size={16} color={colors.textInverse} /> : null}
                  </View>
                  <View style={{ flex: 1, marginLeft: spacing.sm }}>
                    <Text style={styles.itemNome}>{s.nome}</Text>
                  </View>
                  <Text style={styles.itemPreco}>{formatCurrency(s.preco)}</Text>
                </TouchableOpacity>
                {ativo ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setQtd(s.id, -1)}>
                      <Ionicons name="remove" size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.stepperQtd}>{qtd}</Text>
                    <TouchableOpacity style={styles.stepperBtn} onPress={() => setQtd(s.id, 1)}>
                      <Ionicons name="add" size={18} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
        {erros.servicos ? <Text style={styles.erroText}>{erros.servicos}</Text> : null}

        <Input
          label="Valor do pacote"
          required
          value={valorTexto}
          onChangeText={(t) => {
            setValorTexto(maskCurrencyInput(t));
            if (parseCurrencyInput(t) > 0) setErros((e) => ({ ...e, valor: '' }));
          }}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          error={erros.valor}
        />

        <Button title="Salvar" onPress={handleSalvar} style={{ marginTop: spacing.sm }} />
        {existente ? (
          <Button title="Excluir Pacote" variant="danger" onPress={handleExcluir} style={{ marginTop: spacing.sm }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  semServicos: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  semServicosText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemAtivo: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '33' },
  itemMain: { flexDirection: 'row', alignItems: 'center' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemNome: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  itemPreco: { fontSize: 14, fontWeight: '700', color: colors.primary },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtd: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  erroText: { color: colors.danger, fontSize: 12, marginTop: -4, marginBottom: spacing.sm },
});
