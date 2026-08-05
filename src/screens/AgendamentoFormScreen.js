import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import SelectField from '../components/SelectField';
import SegmentedControl from '../components/SegmentedControl';
import DateField from '../components/DateField';
import TimeField from '../components/TimeField';
import EmptyState from '../components/EmptyState';
import MultiSelectField from '../components/MultiSelectField';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import { formatCurrency, maskCurrency, maskCurrencyInput, parseCurrencyInput, todayISO } from '../utils/format';

export default function AgendamentoFormScreen({ route, navigation }) {
  const { agendamentoId, clientePreset } = route.params || {};
  const {
    clientes,
    servicos,
    getAgendamento,
    addAgendamento,
    updateAgendamento,
    deleteAgendamento,
    addConta,
    updateConta,
    deleteConta,
    contas,
    centrosCusto,
    pacotesAtivosDoCliente,
    getPacote,
    getPacoteVenda,
    totalQtdVenda,
    debitarPacote,
    restaurarPacote,
  } = useData();
  const { showToast } = useToast();

  const existente = agendamentoId ? getAgendamento(agendamentoId) : null;

  const [clienteId, setClienteId] = useState(existente?.clienteId || clientePreset || null);
  const [data, setData] = useState(existente?.data || todayISO());
  const [hora, setHora] = useState(existente?.hora || '09:00');
  const [servicosSelecionados, setServicosSelecionados] = useState(() =>
    Array.isArray(existente?.servicos) ? [...existente.servicos] : []
  );
  const [valorTexto, setValorTexto] = useState(existente?.valor != null ? maskCurrency(existente.valor) : '');
  const [valorEditado, setValorEditado] = useState(existente?.valor != null);
  const [sinalTexto, setSinalTexto] = useState(
    existente?.sinal != null && Number(existente.sinal) > 0 ? maskCurrency(existente.sinal) : ''
  );
  const [usarPacote, setUsarPacote] = useState(Boolean(existente?.pacoteVendaId));
  const [pacoteVendaId, setPacoteVendaId] = useState(existente?.pacoteVendaId || null);
  const [status, setStatus] = useState(existente?.status || 'agendado');
  const [observacoes, setObservacoes] = useState(existente?.observacoes || '');
  const [gerarConta, setGerarConta] = useState(true);
  const [sorteio, setSorteio] = useState(Boolean(existente?.sorteio));
  const [erros, setErros] = useState({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: existente ? 'Editar Agendamento' : 'Novo Agendamento' });
  }, [navigation, existente]);

  const contaVinculada = useMemo(
    () => (existente ? contas.find((c) => c.agendamentoId === existente.id) : null),
    [existente, contas]
  );

  const opcoesClientes = clientes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((c) => ({ label: c.nome, value: c.id }));

  const opcoesServicos = servicos
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((s) => ({ label: s.nome, value: s.id, price: s.preco }));

  const pacotesDisponiveis = clienteId ? pacotesAtivosDoCliente(clienteId) : [];

  const opcoesPacotes = pacotesDisponiveis.map((v) => {
    const pacote = getPacote(v.pacoteId);
    return { label: `${pacote?.nome || 'Pacote'} (${totalQtdVenda(v)} restantes)`, value: v.id };
  });

  const vendaSelecionada = pacoteVendaId ? getPacoteVenda(pacoteVendaId) : null;

  const opcoesPacoteServicos = useMemo(() => {
    if (!vendaSelecionada) return [];
    return vendaSelecionada.servicos
      .map((s) => {
        const serv = servicos.find((x) => x.id === s.servicoId);
        return {
          label: serv?.nome || 'Serviço removido',
          value: s.servicoId,
          subtitle: `Restam ${s.qtd}`,
          disabled: Number(s.qtd) <= 0,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [vendaSelecionada, servicos]);

  const valorSoma = useMemo(
    () =>
      servicosSelecionados.reduce((acc, id) => {
        const s = servicos.find((x) => x.id === id);
        return acc + Number(s?.preco || 0);
      }, 0),
    [servicosSelecionados, servicos]
  );

  function toggleServico(id) {
    const selecionados = servicosSelecionados.includes(id)
      ? servicosSelecionados.filter((s) => s !== id)
      : [...servicosSelecionados, id];
    setServicosSelecionados(selecionados);
    if (!valorEditado) {
      const soma = selecionados.reduce((acc, sid) => {
        const s = servicos.find((x) => x.id === sid);
        return acc + Number(s?.preco || 0);
      }, 0);
      setValorTexto(maskCurrency(soma));
    }
  }

  function toggleServicoPacote(id) {
    setServicosSelecionados((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function usarSoma() {
    setValorTexto(maskCurrency(valorSoma));
    setValorEditado(false);
  }

  function handleClienteChange(id) {
    setClienteId(id);
    setUsarPacote(false);
    setPacoteVendaId(null);
  }

  function handleUsarPacote(value) {
    setUsarPacote(value);
    setServicosSelecionados([]);
    setValorTexto('');
    setValorEditado(true);
    if (value && pacotesDisponiveis.length > 0) {
      setPacoteVendaId(pacotesDisponiveis[0].id);
    } else {
      setPacoteVendaId(null);
    }
  }

  function handlePacoteVenda(id) {
    setPacoteVendaId(id);
    setServicosSelecionados([]);
    setValorTexto('');
    setValorEditado(true);
  }

  function handleSorteio(value) {
    setSorteio(value);
    if (value) {
      setValorTexto(formatCurrency(0));
      setValorEditado(true);
      setSinalTexto('');
    }
  }

  function centroServicoPadrao() {
    return (
      centrosCusto.find((c) => c.nome.toLowerCase().includes('serviç')) ||
      centrosCusto.find((c) => c.tipo === 'receita') ||
      centrosCusto[0] ||
      null
    );
  }

  function validar() {
    const novosErros = {};
    if (!clienteId) novosErros.cliente = 'Selecione a cliente';
    if (usarPacote) {
      if (!pacoteVendaId) novosErros.pacote = 'Selecione o pacote';
      if (servicosSelecionados.length === 0) novosErros.servicos = 'Selecione ao menos um serviço do pacote';
      if (vendaSelecionada) {
        const indisponivel = servicosSelecionados.some((sid) => {
          const item = vendaSelecionada.servicos.find((s) => s.servicoId === sid);
          return !item || Number(item.qtd) <= 0;
        });
        if (indisponivel) novosErros.servicos = 'Um dos serviços não está mais disponível no pacote';
      }
    } else {
      if (servicosSelecionados.length === 0) novosErros.servicos = 'Selecione ao menos um serviço';
      const valor = parseCurrencyInput(valorTexto);
      if (valor < 0) novosErros.valor = 'Informe um valor válido';
      const sinal = parseCurrencyInput(sinalTexto);
      if (sinal > valor) novosErros.sinal = 'O sinal não pode ser maior que o valor';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleSalvar() {
    if (!validar()) return;

    // Devolve os serviços usados do pacote anterior antes de reaplicar (edição)
    if (existente?.pacoteVendaId && Array.isArray(existente.servicos)) {
      restaurarPacote(existente.pacoteVendaId, existente.servicos);
    }

    const cliente = clientes.find((c) => c.id === clienteId);
    const nomesServicos = servicosSelecionados
      .map((id) => servicos.find((s) => s.id === id)?.nome)
      .filter(Boolean)
      .join(' + ');

    let valor = 0;
    let sinal = 0;
    let pacoteVendaIdFinal = null;

    if (usarPacote) {
      pacoteVendaIdFinal = pacoteVendaId;
      if (pacoteVendaIdFinal && servicosSelecionados.length > 0) {
        debitarPacote(pacoteVendaIdFinal, servicosSelecionados);
      }
    } else {
      valor = parseCurrencyInput(valorTexto);
      sinal = parseCurrencyInput(sinalTexto);
    }

    const dadosAgendamento = {
      clienteId,
      data,
      hora,
      servicos: servicosSelecionados,
      valor,
      sinal,
      pacoteVendaId: pacoteVendaIdFinal,
      status,
      sorteio: Boolean(sorteio),
      observacoes: observacoes.trim(),
    };

    if (existente) {
      updateAgendamento(existente.id, dadosAgendamento);
      if (contaVinculada) {
        if (sorteio || valor <= 0) {
          deleteConta(contaVinculada.id);
        } else {
          const statusConta = status === 'concluido' ? 'quitado' : sinal >= valor ? 'quitado' : 'pendente';
          updateConta(contaVinculada.id, {
            descricao: `${nomesServicos || 'Serviço'} - ${cliente?.nome || ''}`,
            valor,
            valorPago: sinal,
            vencimento: data,
            clienteId,
            status: statusConta,
            dataPagamento: statusConta === 'quitado' ? todayISO() : null,
          });
        }
      }
    } else {
      const novo = addAgendamento(dadosAgendamento);
      const criaConta = (gerarConta || sinal > 0) && valor > 0 && !sorteio;
      if (!usarPacote && criaConta) {
        const centro = centroServicoPadrao();
        const statusConta = status === 'concluido' ? 'quitado' : sinal >= valor ? 'quitado' : 'pendente';
        addConta({
          tipo: 'receber',
          descricao: `${nomesServicos || 'Serviço'} - ${cliente?.nome || ''}`,
          valor,
          valorPago: sinal,
          vencimento: data,
          centroCustoId: centro ? centro.id : null,
          clienteId,
          agendamentoId: novo.id,
          status: statusConta,
          dataPagamento: statusConta === 'quitado' ? todayISO() : null,
        });
      }
    }
    showToast(existente ? 'Agendamento atualizado' : 'Agendamento realizado');
    navigation.goBack();
  }

  function handleExcluir() {
    Alert.alert(
      'Excluir agendamento',
      'Deseja excluir este agendamento? Os serviços usados de um pacote, se houver, serão devolvidos e a conta financeira vinculada removida.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            deleteAgendamento(existente.id);
            showToast('Agendamento excluído', 'error');
            navigation.goBack();
          },
        },
      ]
    );
  }

  if (clientes.length === 0) {
    return (
      <Screen>
        <EmptyState
          icon="person-add-outline"
          title="Cadastre uma cliente primeiro"
          subtitle="Você precisa ter ao menos uma cliente cadastrada para criar um agendamento"
        />
        <Button
          title="Cadastrar Cliente"
          onPress={() => navigation.navigate('ClientesTab', { screen: 'ClienteForm', params: { clienteId: null } })}
          style={{ marginHorizontal: spacing.md }}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
        <SelectField
          label="Cliente"
          required
          value={clienteId}
          options={opcoesClientes}
          onSelect={handleClienteChange}
          placeholder="Selecionar cliente"
          emptyMessage="Nenhuma cliente cadastrada"
        />
        {erros.cliente ? <Text style={styles.erroText}>{erros.cliente}</Text> : null}

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <DateField label="Data" required value={data} onChange={setData} />
          </View>
          <View style={{ flex: 1 }}>
            <TimeField label="Horário" required value={hora} onChange={setHora} />
          </View>
        </View>

        {pacotesDisponiveis.length > 0 ? (
          <TouchableOpacity style={styles.switchRow} onPress={() => handleUsarPacote(!usarPacote)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Usar pacote da cliente</Text>
              <Text style={styles.switchSubtitle}>
                {usarPacote ? 'Os serviços sairão do saldo do pacote, sem cobrança' : 'Descontar os serviços de um pacote contratado'}
              </Text>
            </View>
            <Switch
              value={usarPacote}
              onValueChange={handleUsarPacote}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={usarPacote ? colors.primary : '#fff'}
            />
          </TouchableOpacity>
        ) : null}

        {usarPacote ? (
          <>
            <SelectField
              label="Pacote"
              required
              value={pacoteVendaId}
              options={opcoesPacotes}
              onSelect={handlePacoteVenda}
              placeholder="Selecionar pacote"
            />
            {erros.pacote ? <Text style={styles.erroText}>{erros.pacote}</Text> : null}

            {vendaSelecionada ? (
              <>
                <MultiSelectField
                  label="Serviços do pacote"
                  required
                  options={opcoesPacoteServicos}
                  selected={servicosSelecionados}
                  onToggle={toggleServicoPacote}
                  placeholder="Selecionar serviços do pacote"
                />
                <Text style={styles.somaText}>Coberto pelo pacote • Sem cobrança</Text>
              </>
            ) : null}
            {erros.servicos ? <Text style={styles.erroText}>{erros.servicos}</Text> : null}
          </>
        ) : servicos.length === 0 ? (
          <>
            <Text style={styles.label}>Serviços</Text>
            <View style={styles.semServicos}>
              <Text style={styles.semServicosText}>
                Nenhum serviço cadastrado. Cadastre os serviços com nome e preço antes de agendar.
              </Text>
              <Button
                title="Cadastrar Serviço"
                variant="outline"
                onPress={() =>
                  navigation.navigate('ServicosTab', { screen: 'ServicoForm', params: { servicoId: null } })
                }
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </>
        ) : (
          <>
            <MultiSelectField
              label="Serviços"
              required
              options={opcoesServicos}
              selected={servicosSelecionados}
              onToggle={toggleServico}
              placeholder="Selecionar serviços"
              emptyMessage="Nenhum serviço disponível"
            />
            {servicosSelecionados.length > 0 ? (
              <Text style={styles.somaText}>Soma dos serviços: {formatCurrency(valorSoma)}</Text>
            ) : null}
          </>
        )}
        {!usarPacote && erros.servicos ? <Text style={styles.erroText}>{erros.servicos}</Text> : null}

        {usarPacote ? (
          <Text style={styles.avisoConta}>Este agendamento é coberto pelo pacote, sem valor a pagar.</Text>
        ) : (
          <>
            <Input
              label="Valor"
              required
              value={valorTexto}
              onChangeText={(t) => {
                setValorTexto(maskCurrencyInput(t));
                setValorEditado(true);
              }}
              placeholder="R$ 0,00"
              keyboardType="decimal-pad"
              error={erros.valor}
              editable={!sorteio}
            />
            {!sorteio && valorEditado && servicosSelecionados.length > 0 ? (
              <TouchableOpacity onPress={usarSoma} style={styles.recalcularWrap}>
                <Text style={styles.recalcular}>Usar soma dos serviços ({formatCurrency(valorSoma)})</Text>
              </TouchableOpacity>
            ) : null}

            <Input
              label="Sinal (valor recebido antecipado)"
              value={sinalTexto}
              onChangeText={(t) => setSinalTexto(maskCurrencyInput(t))}
              placeholder="R$ 0,00"
              keyboardType="decimal-pad"
              error={erros.sinal}
              editable={!sorteio}
            />
            {!sorteio && parseCurrencyInput(sinalTexto) > 0 ? (
              <Text style={styles.avisoConta}>
                O sinal será registrado como pagamento parcial da conta a receber gerada.
              </Text>
            ) : null}

            <TouchableOpacity style={styles.switchRow} onPress={() => handleSorteio(!sorteio)} activeOpacity={0.8}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Foi sorteio?</Text>
                <Text style={styles.switchSubtitle}>
                  {sorteio
                    ? 'Sorteio/premiação: valor zerado, sem conta a receber'
                    : 'Ative se o atendimento foi um sorteio (sem cobrança)'}
                </Text>
              </View>
              <Switch
                value={sorteio}
                onValueChange={handleSorteio}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={sorteio ? colors.primary : '#fff'}
              />
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.label}>Status</Text>
        <SegmentedControl
          options={[
            { label: 'Agendado', value: 'agendado' },
            { label: 'Concluído', value: 'concluido' },
            { label: 'Cancelado', value: 'cancelado' },
          ]}
          value={status}
          onChange={setStatus}
        />

        <Input
          label="Observações"
          value={observacoes}
          onChangeText={setObservacoes}
          placeholder="Detalhes do atendimento"
          multiline
          style={{ marginTop: spacing.md }}
        />

        {!existente && !usarPacote && !sorteio ? (
          <TouchableOpacity style={styles.switchRow} onPress={() => setGerarConta((v) => !v)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Gerar conta a receber</Text>
              <Text style={styles.switchSubtitle}>Cria automaticamente uma conta no Financeiro vinculada</Text>
            </View>
            <Switch
              value={gerarConta}
              onValueChange={setGerarConta}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={gerarConta ? colors.primary : '#fff'}
            />
          </TouchableOpacity>
        ) : !usarPacote && contaVinculada ? (
          <Text style={styles.avisoConta}>
            Este agendamento possui uma conta a receber vinculada no Financeiro.
          </Text>
        ) : null}

        <Button title="Salvar" onPress={handleSalvar} style={{ marginTop: spacing.md }} />
        {existente ? (
          <Button title="Excluir Agendamento" variant="danger" onPress={handleExcluir} style={{ marginTop: spacing.sm }} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 4 },
  semServicos: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  semServicosText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  somaText: {
    color: colors.primaryDark,
    fontWeight: '600',
    fontSize: 13,
    marginTop: -4,
    marginBottom: spacing.sm,
  },
  recalcularWrap: { alignItems: 'center', marginTop: -8, marginBottom: spacing.md },
  recalcular: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  erroText: { color: colors.danger, fontSize: 12, marginTop: -12, marginBottom: spacing.sm },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  switchTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  switchSubtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  avisoConta: {
    fontSize: 12,
    color: colors.textSecondary,
    backgroundColor: colors.surfaceAlt,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
});
