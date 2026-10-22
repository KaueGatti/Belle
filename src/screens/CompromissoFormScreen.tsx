import React, { useLayoutEffect, useState } from 'react';
import { ScrollView, Alert, Text, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import DateField from '../components/DateField';
import TimeField from '../components/TimeField';
import { useToast } from '../components/Toast';
import { useData, type CompromissoInput } from '../context/DataContext';
import { colors, spacing } from '../theme/colors';
import { horaParaMin, todayISO } from '../utils/format';
import type { StackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<StackParamList, 'CompromissoForm'>;

export default function CompromissoFormScreen({ route, navigation }: Props) {
  const { compromissoId } = route.params || {};
  const { getCompromisso, addCompromisso, updateCompromisso, deleteCompromisso, compromissos } = useData();
  const { showToast } = useToast();
  const existente = compromissoId ? getCompromisso(compromissoId) : null;

  const [titulo, setTitulo] = useState(existente?.titulo || '');
  const [data, setData] = useState(existente?.data || todayISO());
  const [horaInicio, setHoraInicio] = useState(existente?.horaInicio || '');
  const [horaFim, setHoraFim] = useState(existente?.horaFim || '');
  const [observacoes, setObservacoes] = useState(existente?.observacoes || '');
  const [erroTitulo, setErroTitulo] = useState('');
  const [erroHorario, setErroHorario] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Compromisso' : 'Novo Compromisso' });
  }, [navigation, existente]);

  function achaConflito(inicio: number, fim: number) {
    return (
      compromissos.find((c) => {
        if (existente && c.id === existente.id) return false;
        if (c.data !== data) return false;
        const ci = horaParaMin(c.horaInicio);
        const cf = horaParaMin(c.horaFim);
        return inicio < cf && fim > ci;
      }) || null
    );
  }

  function handleSalvar() {
    let ok = true;
    if (!titulo.trim()) {
      setErroTitulo('Informe o título do compromisso');
      ok = false;
    } else {
      setErroTitulo('');
    }

    let erroHorarioMsg = '';
    const inicio = horaParaMin(horaInicio);
    const fim = horaParaMin(horaFim);
    if (!horaInicio || !horaFim) {
      erroHorarioMsg = 'Informe o horário de início e fim';
    } else if (fim <= inicio) {
      erroHorarioMsg = 'O horário de fim deve ser depois do início';
    }
    if (erroHorarioMsg) {
      setErroHorario(erroHorarioMsg);
      ok = false;
    } else {
      setErroHorario('');
    }

    if (!ok) return;

    const conflito = achaConflito(inicio, fim);
    if (conflito) {
      setErroHorario(`Já existe "${conflito.titulo}" das ${conflito.horaInicio} às ${conflito.horaFim} neste dia`);
      return;
    }

    const dados: CompromissoInput = {
      titulo: titulo.trim(),
      data,
      horaInicio,
      horaFim,
      observacoes: observacoes.trim() || undefined,
    };
    if (existente) {
      updateCompromisso(existente.id, dados);
    } else {
      addCompromisso(dados);
    }
    showToast(existente ? 'Compromisso atualizado' : 'Compromisso cadastrado');
    navigation.goBack();
  }

  function handleExcluir() {
    if (!existente) return;
    Alert.alert('Excluir compromisso', `Deseja excluir "${existente.titulo}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteCompromisso(existente.id);
          showToast('Compromisso excluído', 'error');
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        <Input
          label="Título"
          required
          value={titulo}
          onChangeText={(t: string) => {
            setTitulo(t);
            if (t.trim()) setErroTitulo('');
          }}
          placeholder="Ex: Almoço em família"
          error={erroTitulo}
        />

        <DateField label="Data" required value={data} onChange={setData} />

        <TimeField
          label="Início"
          required
          value={horaInicio}
          onChange={(h: string) => {
            setHoraInicio(h);
            setErroHorario('');
          }}
        />

        <TimeField
          label="Fim"
          required
          value={horaFim}
          onChange={(h: string) => {
            setHoraFim(h);
            setErroHorario('');
          }}
        />

        <Input
          label="Observações (opcional)"
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Detalhes sobre este compromisso"
          multiline
        />

        {erroHorario ? <Text style={styles.erro}>{erroHorario}</Text> : null}

        <Button title="Salvar" onPress={handleSalvar} />
        {existente ? (
          <Button title="Excluir Compromisso" variant="danger" onPress={handleExcluir} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  erro: {
    fontSize: 13,
    color: colors.danger,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },
});
