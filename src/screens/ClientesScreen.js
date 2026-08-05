import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../components/Screen';
import Input from '../components/Input';
import EmptyState from '../components/EmptyState';
import Fab from '../components/Fab';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';

export default function ClientesScreen({ navigation }) {
  const { clientes } = useData();
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = [...clientes].sort((a, b) => a.nome.localeCompare(b.nome));
    if (!termo) return lista;
    return lista.filter(
      (c) => c.nome.toLowerCase().includes(termo) || (c.telefone || '').includes(termo)
    );
  }, [clientes, busca]);

  return (
    <Screen>
      <View style={styles.header}>
        <Input
          placeholder="Buscar por nome ou telefone"
          value={busca}
          onChangeText={setBusca}
          style={{ marginBottom: 0 }}
        />
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            subtitle={busca ? 'Tente buscar por outro nome' : 'Toque no botão + para cadastrar sua primeira cliente'}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ClienteConsulta', { clienteId: item.id })}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.nome.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.nome}>{item.nome}</Text>
              {item.telefone ? <Text style={styles.telefone}>{item.telefone}</Text> : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      />

      <Fab onPress={() => navigation.navigate('ClienteForm', { clienteId: null })} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primaryDark, fontWeight: '700', fontSize: 18 },
  nome: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  telefone: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
});
