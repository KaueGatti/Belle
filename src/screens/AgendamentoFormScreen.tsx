import React, { useLayoutEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Screen from '../components/Screen';
import Input from '../components/Input';
import Button from '../components/Button';
import SelectField from '../components/SelectField';
import SegmentedControl from '../components/SegmentedControl';
import DateField from '../components/DateField';
import TimeField from '../components/TimeField';
import EmptyState from '../components/EmptyState';
import StepperList from '../components/StepperList';
import AppModal from '../components/AppModal';
import { useToast } from '../components/Toast';
import { useData } from '../context/DataContext';
import { colors, spacing, radius } from '../theme/colors';
import {
  formatCurrency,
  formatDateBR,
  maskCurrency,
  maskCurrencyInput,
  parseCurrencyInput,
  todayISO,
  horaParaMin,
  minParaHora,
} from '../utils/format';
import type { StackParamList, TabParamList } from '../types/navigation';
import type { Agendamento, ProdutoItem } from '../types/entities';

type Props = NativeStackScreenProps<StackParamList, 'AgendamentoForm'>;

export default function AgendamentoFormScreen({ route, navigation }: Props) {
  const { agendamentoId, clientePreset } = route.params || {};
  const {
    clientes,
    servicos,
    produtos,
    agendamentos,
    getAgendamento,
    addAgendamento,
    updateAgendamento,
    deleteAgendamento,
    addConta,
    updateConta,
    deleteConta,
    contas,
    centroReceitaPadrao,
    formatAgendamentoServicos,
    pacotesAtivosDoCliente,
    getPacote,
    getPacoteVenda,
    nomePacoteVenda,
    totalQtdVenda,
    debitarPacote,
    restaurarPacote,
    baixarEstoqueProdutos,
    restaurarEstoqueProdutos,
  } = useData();
  const { showToast } = useToast();
  const tabNavigation = navigation.getParent<BottomTabNavigationProp<TabParamList>>();

  const existente = agendamentoId ? getAgendamento(agendamentoId) : null;

  function qtdsIniciais() {
    const map: Partial<Record<string, number>> = {};
    if (Array.isArray(existente?.servicos)) {
      for (const id of existente.servicos) {
        map[id] = Number(existente.servicosQtd?.[id] || 1);
      }
    }
    return map;
  }

  const [clienteId, setClienteId] = useState(existente?.clienteId || clientePreset || null);
  const [data, setData] = useState(existente?.data || todayISO());
  const [hora, setHora] = useState(existente?.hora || '09:00');
  const [qtdsService, setQtdsService] = useState<Partial<Record<string, number>>>(qtdsIniciais);
  const [qtdsProduto, setQtdsProduto] = useState<Partial<Record<string, number>>>(() => {
    const map: Partial<Record<string, number>> = {};
    for (const it of existente?.produtos || []) map[it.produtoId] = Number(it.qtd || 1);
    return map;
  });
  const [adicionalTexto, setAdicionalTexto] = useState(
    existente?.adicional != null && Number(existente.adicional) > 0 ? maskCurrency(existente.adicional) : ''
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
  const [duracao, setDuracao] = useState(existente?.duracao != null ? String(existente.duracao) : '');
  const [duracaoEditado, setDuracaoEditado] = useState(Boolean(existente));
  const [pago, setPago] = useState(
    () => contas.find((c) => c.agendamentoId === existente?.id)?.status === 'quitado'
  );
  const [dataPagamento, setDataPagamento] = useState(
    () => contas.find((c) => c.agendamentoId === existente?.id)?.dataPagamento || todayISO()
  );
  const [erros, setErros] = useState<Partial<Record<string, string>>>({});
  const [conflitoModal, setConflitoModal] = useState<Agendamento | null>(null);
  const [confirmarConta, setConfirmarConta] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: existente ? 'Editar Agendamento' : 'Novo Agendamento',
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.popToTop()} activeOpacity={0.7}>
          <Text style={styles.sairBtn}>Sair</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, existente]);

  const contaVinculada = useMemo(
    () => (existente ? contas.find((c) => c.agendamentoId === existente.id) : null),
    [existente, contas]
  );

  const opcoesClientes = clientes
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map((c) => ({ label: c.nome, value: c.id }));

  const pacotesDisponiveis = clienteId ? pacotesAtivosDoCliente(clienteId) : [];

  const opcoesPacotes = pacotesDisponiveis.map((v) => ({
    label: `${nomePacoteVenda(v)} (${totalQtdVenda(v)} restantes)`,
    value: v.id,
  }));

  const vendaSelecionada = pacoteVendaId ? getPacoteVenda(pacoteVendaId) : null;

  const servicoIds = useMemo(
    () => Object.entries(qtdsService).filter(([, q]) => Number(q) > 0).map(([id]) => id),
    [qtdsService]
  );

  const produtosItens: ProdutoItem[] = useMemo(
    () =>
      Object.entries(qtdsProduto)
        .filter(([, q]) => Number(q) > 0)
        .map(([id, q]) => ({ produtoId: id, qtd: Number(q) || 1 })),
    [qtdsProduto]
  );

  const somaServicos = useMemo(
    () =>
      servicoIds.reduce((acc, id) => {
        const s = servicos.find((x) => x.id === id);
        return acc + Number(s?.preco || 0) * Number(qtdsService[id] || 0);
      }, 0),
    [servicoIds, qtdsService, servicos]
  );

  const duracaoSugerida = useMemo(
    () =>
      servicoIds.reduce((acc, id) => {
        const s = servicos.find((x) => x.id === id);
        return acc + Number(s?.duracao || 0) * Number(qtdsService[id] || 0);
      }, 0),
    [servicoIds, qtdsService, servicos]
  );

  const somaProdutos = useMemo(
    () =>
      produtosItens.reduce((acc, it) => {
        const p = produtos.find((x) => x.id === it.produtoId);
        return acc + Number(p?.preco || 0) * it.qtd;
      }, 0),
    [produtosItens, produtos]
  );

  const adicionalNum = useMemo(() => parseCurrencyInput(adicionalTexto), [adicionalTexto]);
  const totalSugerido = somaServicos + somaProdutos + adicionalNum;

  // Valor total em modo pacote considera apenas produtos/adicional (serviços cobertos)
  function valorAuto() {
    const base = usarPacote ? 0 : somaServicos;
    return base + somaProdutos + adicionalNum;
  }

  function atualizarValorAuto() {
    if (!valorEditado) setValorTexto(maskCurrency(valorAuto()));
  }

  function opcoesServicos() {
    return servicos
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((s) => ({
        value: s.id,
        label: s.nome,
        price: s.preco,
        qtd: qtdsService[s.id] || 0,
        maxQtd: 99,
        icon: 'cut-outline' as const,
      }));
  }

  function opcoesPacoteServicos() {
    if (!vendaSelecionada) return [];
    return vendaSelecionada.servicos
      .map((s) => {
        const serv = servicos.find((x) => x.id === s.servicoId);
        const restam = Number(s.qtd || 0);
        return {
          value: s.servicoId,
          label: serv?.nome || 'Serviço removido',
          subtitle: `Restam ${restam}`,
          price: 0,
          qtd: qtdsService[s.servicoId] || 0,
          maxQtd: restam,
          disabled: restam <= 0,
          disabledReason: restam <= 0 ? 'Saldo esgotado' : undefined,
          icon: 'cut-outline' as const,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  function opcoesProdutos() {
    return produtos
      .slice()
      .sort((a, b) => a.nome.localeCompare(b.nome))
      .map((p) => ({
        value: p.id,
        label: p.nome,
        subtitle: `${p.estoque} em estoque`,
        price: p.preco,
        qtd: qtdsProduto[p.id] || 0,
        maxQtd: Math.max(0, Number(p.estoque || 0)),
        disabled: Number(p.estoque || 0) <= 0,
        disabledReason: Number(p.estoque || 0) <= 0 ? 'Sem estoque' : undefined,
        icon: 'bag-handle-outline' as const,
      }));
  }

  function handleClienteChange(id: string) {
    setClienteId(id);
    setUsarPacote(false);
    setPacoteVendaId(null);
  }

  function handleUsarPacote(value: boolean) {
    setUsarPacote(value);
    setQtdsService({});
    if (value && pacotesDisponiveis.length > 0) {
      setPacoteVendaId(pacotesDisponiveis[0].id);
      setValorTexto('');
      setValorEditado(true);
    } else {
      setPacoteVendaId(null);
      atualizarValorAuto();
    }
  }

  function handlePacoteVenda(id: string) {
    setPacoteVendaId(id);
    setQtdsService({});
    setValorTexto('');
    setValorEditado(true);
  }

  function handleSorteio(value: boolean) {
    setSorteio(value);
    if (value) {
      setValorTexto(formatCurrency(0));
      setValorEditado(true);
      setSinalTexto('');
    }
  }

  function incrementService(id: string) {
    setQtdsService((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setErros((p) => ({ ...p, servicos: undefined }));
    if (!duracaoEditado) setDuracao(String(duracaoSugerida + Number(servicos.find((s) => s.id === id)?.duracao || 0)));
    atualizarValorAuto();
  }
  function decrementService(id: string) {
    setQtdsService((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
    if (!duracaoEditado) {
      const prevQtd = Math.max(0, (qtdsService[id] || 0) - 1);
      const novosIds = Object.entries({ ...qtdsService, [id]: prevQtd })
        .filter(([, q]) => Number(q) > 0)
        .map(([k]) => k);
      const soma = novosIds.reduce((acc, k) => {
        const s = servicos.find((x) => x.id === k);
        return acc + Number(s?.duracao || 0) * Number(qtdsService[k] || 0);
      }, 0);
      setDuracao(soma > 0 ? String(soma) : '');
    }
    atualizarValorAuto();
  }
  function incrementProduto(id: string) {
    setQtdsProduto((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    atualizarValorAuto();
  }
  function decrementProduto(id: string) {
    setQtdsProduto((prev) => ({ ...prev, [id]: Math.max(0, (prev[id] || 0) - 1) }));
    atualizarValorAuto();
  }

  function usarSoma() {
    setValorTexto(maskCurrency(totalSugerido));
    setValorEditado(false);
  }

  function duracaoEfetiva() {
    const d = parseInt(duracao || '0', 10) || 0;
    return d > 0 ? d : duracaoSugerida;
  }

  function achaConflito(dataX: string, horaX: string): Agendamento | null {
    const d = duracaoEfetiva();
    if (d <= 0) return null;
    const inicio = horaParaMin(horaX);
    const fim = inicio + d;
    return (
      agendamentos.find((a) => {
        if (a.id === existente?.id) return false;
        if (a.data !== dataX) return false;
        if (a.status === 'cancelado') return false;
        const ai = horaParaMin(a.hora);
        const af = ai + (Number(a.duracao || 0) || 0);
        return inicio < af && fim > ai;
      }) || null
    );
  }

  function handleDataChange(d: string) {
    setData(d);
    setErros((p) => ({ ...p, hora: undefined }));
    const c = achaConflito(d, hora);
    if (c) setConflitoModal(c);
  }
  function handleHoraChange(h: string) {
    setHora(h);
    setErros((p) => ({ ...p, hora: undefined }));
    const c = achaConflito(data, h);
    if (c) setConflitoModal(c);
  }

  function prepararDados() {
    const cliente = clientes.find((c) => c.id === clienteId);
    const nomesServicos = servicoIds
      .map((id) => {
        const nome = servicos.find((s) => s.id === id)?.nome;
        if (!nome) return null;
        const q = Number(qtdsService[id] || 0);
        return q > 1 ? `${nome} x${q}` : nome;
      })
      .filter(Boolean)
      .join(' + ');
    const resumoProdutos = produtosItens
      .map((it) => {
        const nome = produtos.find((p) => p.id === it.produtoId)?.nome;
        if (!nome) return null;
        return it.qtd > 1 ? `${nome} x${it.qtd}` : nome;
      })
      .filter(Boolean)
      .join(' + ');

    const duracaoNum = duracaoEfetiva();
    const sinalNum = parseCurrencyInput(sinalTexto);
    const valorManual = valorEditado ? parseCurrencyInput(valorTexto) : null;
    const valor = valorManual != null ? valorManual : valorAuto();
    const pagoAtivo = Boolean(pago) || sinalNum >= valor;
    const contaCalc = () => {
      if (status === 'cancelado') return { status: 'pendente' as const, valorPago: 0, dataPagamento: null, vencimento: data };
      if (pagoAtivo) {
        return { status: 'quitado' as const, valorPago: valor, dataPagamento: dataPagamento || todayISO(), vencimento: data };
      }
      return {
        status: 'pendente' as const,
        valorPago: sinalNum,
        dataPagamento: sinalNum > 0 ? dataPagamento || todayISO() : null,
        vencimento: data,
      };
    };
    const descricao = [nomesServicos, resumoProdutos].filter(Boolean).join(' + ') || 'Atendimento';
    return { cliente, nomesServicos, resumoProdutos, descricao, duracaoNum, sinalNum, valor, pagoAtivo, contaCalc };
  }

  function validar() {
    const novosErros: Record<string, string> = {};
    if (!clienteId) novosErros.cliente = 'Selecione a cliente';
    if (duracaoEfetiva() <= 0) novosErros.duracao = 'Informe a duração do atendimento';
    const c = achaConflito(data, hora);
    if (c) novosErros.hora = 'Horário já ocupado';

    if (pago && !usarPacote && !sorteio && (status === 'agendado' || status === 'concluido') && !dataPagamento) {
      novosErros.dataPagamento = 'Informe a data do pagamento';
    }

    if (usarPacote) {
      if (!pacoteVendaId) novosErros.pacote = 'Selecione o pacote';
      if (servicoIds.length === 0) novosErros.servicos = 'Selecione ao menos um serviço do pacote';
      if (vendaSelecionada) {
        const indisponivel = servicoIds.some((sid) => {
          const item = vendaSelecionada.servicos.find((s) => s.servicoId === sid);
          const usado = Number(qtdsService[sid] || 0);
          return !item || usado > Number(item.qtd || 0);
        });
        if (indisponivel) novosErros.servicos = 'A quantidade excede o saldo disponível no pacote';
      }
    } else {
      if (servicoIds.length === 0) novosErros.servicos = 'Selecione ao menos um serviço';
      const valor = prepararDados().valor;
      if (valor < 0) novosErros.valor = 'Informe um valor válido';
      const sinalNum = parseCurrencyInput(sinalTexto);
      if (sinalNum > valor) novosErros.sinal = 'O sinal não pode ser maior que o valor';
    }
    // Valida estoque dos produtos durante a venda
    const semEstoque = produtosItens.some((it) => {
      const p = produtos.find((x) => x.id === it.produtoId);
      return !p || Number(it.qtd) > Number(p.estoque || 0);
    });
    if (semEstoque) novosErros.produtos = 'A quantidade de produtos excede o estoque disponível';
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function handleSalvar() {
    if (!validar()) {
      const c = achaConflito(data, hora);
      if (c) setConflitoModal(c);
      return;
    }
    const { valor, sinalNum } = prepararDados();
    const vaiCriarConta =
      !existente &&
      !sorteio &&
      valor > 0 &&
      (usarPacote ? true : gerarConta || sinalNum > 0);
    if (vaiCriarConta) {
      setConfirmarConta(true);
      return;
    }
    finalizarSalvar(gerarConta && !usarPacote);
  }

  function finalizarSalvar(gerarContaFinal: boolean) {
    // Devolve serviços/produtos do agendamento original (edição)
    if (existente?.pacoteVendaId && Array.isArray(existente.servicos)) {
      restaurarPacote(existente.pacoteVendaId, existente.servicos, existente.servicosQtd);
    }
    if (Array.isArray(existente?.produtos) && existente.produtos.length > 0) {
      restaurarEstoqueProdutos(existente.produtos);
    }

    const { descricao, duracaoNum, sinalNum, valor, contaCalc } = prepararDados();
    const cliente = clientes.find((c) => c.id === clienteId);
    let valorFinal = valor;
    let sinalFinal = sinalNum;
    let pacoteVendaIdFinal = null;

    if (usarPacote) {
      pacoteVendaIdFinal = pacoteVendaId;
      if (pacoteVendaIdFinal && servicoIds.length > 0) {
        debitarPacote(pacoteVendaIdFinal, servicoIds, qtdsService as Record<string, number>);
      }
    } else {
      valorFinal = valor;
      sinalFinal = sinalNum;
    }

    // Registra produtos vendidos (baixa estoque)
    if (produtosItens.length > 0) {
      baixarEstoqueProdutos(produtosItens);
    }

    const dadosAgendamento = {
      clienteId: clienteId as string,
      data,
      hora,
      servicos: servicoIds,
      servicosQtd: Object.fromEntries(
        Object.entries(qtdsService).filter(([, q]) => Number(q) > 0)
      ) as Record<string, number>,
      produtos: produtosItens,
      adicional: adicionalNum || undefined,
      valor: valorFinal,
      sinal: sinalFinal,
      pacoteVendaId: pacoteVendaIdFinal,
      status,
      sorteio: Boolean(sorteio),
      duracao: duracaoNum,
      observacoes: observacoes.trim(),
    };

    if (existente) {
      updateAgendamento(existente.id, dadosAgendamento);
      if (contaVinculada) {
        if (sorteio || valorFinal <= 0) {
          deleteConta(contaVinculada.id);
        } else {
          const cc = contaCalc();
          updateConta(contaVinculada.id, {
            descricao: `${descricao} - ${cliente?.nome || ''}`,
            valor: valorFinal,
            valorPago: cc.valorPago,
            vencimento: cc.vencimento,
            clienteId,
            status: cc.status,
            dataPagamento: cc.dataPagamento,
          });
        }
      }
    } else {
      const novo = addAgendamento(dadosAgendamento);
      const criaConta = gerarContaFinal && valorFinal > 0 && !sorteio;
      if (criaConta) {
        const centro = centroReceitaPadrao();
        const cc = contaCalc();
        addConta({
          tipo: 'receber',
          descricao: `${descricao} - ${cliente?.nome || ''}`,
          valor: valorFinal,
          valorPago: cc.valorPago,
          vencimento: cc.vencimento,
          centroCustoId: centro ? centro.id : null,
          clienteId,
          agendamentoId: novo.id,
          status: cc.status,
          dataPagamento: cc.dataPagamento,
        });
      } else if (!gerarContaFinal && valorFinal > 0 && !sorteio && (sinalFinal > 0)) {
        // Sinal registrado mesmo sem conta? Não: sem conta não há onde registrar sinal.
      }
    }
    showToast(existente ? 'Agendamento atualizado' : 'Agendamento realizado');
    navigation.goBack();
  }

  function handleExcluir() {
    if (!existente) return;
    Alert.alert(
      'Excluir agendamento',
      'Deseja excluir este agendamento? Os serviços usados de um pacote e os produtos serão devolvidos, e a conta financeira vinculada removida.',
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

  function ConflitoModal() {
    if (!conflitoModal) return null;
    const cNome = clientes.find((x) => x.id === conflitoModal.clienteId)?.nome || 'Cliente';
    return (
      <AppModal
        visible={Boolean(conflitoModal)}
        onClose={() => setConflitoModal(null)}
        title="Horário já agendado"
        icon="time-outline"
        iconColor={colors.danger}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Cliente</Text>
            <Text style={styles.modalValue}>{cNome}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Serviço</Text>
            <Text style={styles.modalValue}>{formatAgendamentoServicos(conflitoModal)}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Data</Text>
            <Text style={styles.modalValue}>{formatDateBR(conflitoModal.data)}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Horário</Text>
            <Text style={styles.modalValue}>{conflitoModal.hora}</Text>
          </View>
        </View>
        <Text style={styles.modalHint}>
          Essa cliente já tem atendimento nesse período. Ajuste o horário para continuar.
        </Text>
        <Button title="Entendi" onPress={() => setConflitoModal(null)} style={{ marginTop: spacing.md }} />
      </AppModal>
    );
  }

  function ConfirmarContaModal() {
    return (
      <AppModal
        visible={confirmarConta}
        onClose={() => setConfirmarConta(false)}
        title="Gerar conta a receber?"
        icon="receipt-outline"
        iconColor={colors.primary}
      >
        <View style={styles.modalCard}>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Cliente</Text>
            <Text style={styles.modalValue}>{clientes.find((c) => c.id === clienteId)?.nome || 'Cliente'}</Text>
          </View>
          <View style={styles.modalRow}>
            <Text style={styles.modalLabel}>Valor</Text>
            <Text style={styles.modalValue}>{formatCurrency(prepararDados().valor)}</Text>
          </View>
        </View>
        <Text style={styles.modalHint}>
          Uma conta a receber será criada automaticamente no Financeiro vinculada a este agendamento.
        </Text>
        <View style={styles.modalActions}>
          <Button
            title="Seguir sem conta"
            variant="outline"
            onPress={() => {
              setConfirmarConta(false);
              finalizarSalvar(false);
            }}
            style={{ flex: 1, marginRight: spacing.sm }}
          />
          <Button
            title="Gerar conta"
            onPress={() => {
              setConfirmarConta(false);
              finalizarSalvar(true);
            }}
            style={{ flex: 1 }}
          />
        </View>
      </AppModal>
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
          onPress={() =>
            tabNavigation?.navigate('ClientesTab', { screen: 'ClienteForm', params: { clienteId: null } })
          }
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
            <DateField label="Data" required value={data} onChange={handleDataChange} />
          </View>
          <View style={{ flex: 1 }}>
            <TimeField label="Horário" required value={hora} onChange={handleHoraChange} />
          </View>
        </View>
        {erros.hora ? <Text style={styles.erroText}>{erros.hora}</Text> : null}

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
                <Text style={styles.label}>Serviços do pacote</Text>
                <StepperList
                  options={opcoesPacoteServicos()}
                  emptyMessage="Sem serviços no pacote"
                  onIncrement={incrementService}
                  onDecrement={decrementService}
                />
                {servicoIds.length > 0 ? (
                  <Text style={styles.somaText}>Coberto pelo pacote • Sem cobrança dos serviços</Text>
                ) : null}
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
                  tabNavigation?.navigate('DashboardTab', { screen: 'ServicoForm', params: { servicoId: null } })
                }
                style={{ marginTop: spacing.sm }}
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.label}>Serviços</Text>
            <StepperList
              options={opcoesServicos()}
              emptyMessage="Nenhum serviço disponível"
              onIncrement={incrementService}
              onDecrement={decrementService}
            />
            {servicoIds.length > 0 ? (
              <Text style={styles.somaText}>Soma dos serviços: {formatCurrency(somaServicos)}</Text>
            ) : null}
            {erros.servicos ? <Text style={styles.erroText}>{erros.servicos}</Text> : null}
          </>
        )}

        {/* Adicionais: venda de produtos + valor extra livre */}
        <View style={styles.adicionalHeader}>
          <Ionicons name="bag-handle-outline" size={18} color={colors.primary} />
          <Text style={styles.adicionalTitle}>Adicionais (produtos vendidos)</Text>
        </View>
        <StepperList
          options={opcoesProdutos()}
          emptyMessage={produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Sem produtos com estoque'}
          onIncrement={incrementProduto}
          onDecrement={decrementProduto}
        />
        {erros.produtos ? <Text style={styles.erroText}>{erros.produtos}</Text> : null}
        {somaProdutos > 0 ? (
          <Text style={styles.somaText}>Produtos: {formatCurrency(somaProdutos)}</Text>
        ) : null}

        <Input
          label="Adicional (valor extra)"
          value={adicionalTexto}
          onChangeText={(t) => {
            setAdicionalTexto(maskCurrencyInput(t));
            atualizarValorAuto();
          }}
          placeholder="R$ 0,00"
          keyboardType="decimal-pad"
          style={{ marginTop: spacing.sm }}
        />

        {usarPacote ? (
          <Text style={styles.avisoConta}>
            {servicoIds.length > 0 ? 'Serviços cobertos pelo pacote. ' : ''}
            Produtos e adicionais entram no valor e geram conta a receber quando aplicável.
          </Text>
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
            {!sorteio && valorEditado && (servicoIds.length > 0 || produtosItens.length > 0 || adicionalNum > 0) ? (
              <TouchableOpacity onPress={usarSoma} style={styles.recalcularWrap}>
                <Text style={styles.recalcular}>Usar soma total ({formatCurrency(totalSugerido)})</Text>
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

        <Input
          label="Duração estimada (minutos)"
          required
          value={duracao}
          onChangeText={(t) => {
            setDuracao((t || '').replace(/\D/g, ''));
            setDuracaoEditado(true);
            if (parseInt(t.replace(/\D/g, ''), 10) > 0) setErros((p) => ({ ...p, duracao: undefined }));
          }}
          placeholder="Ex: 45"
          keyboardType="number-pad"
          error={erros.duracao}
          style={{ marginTop: spacing.md }}
        />
        {duracaoSugerida > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setDuracao(String(duracaoSugerida));
              setDuracaoEditado(false);
              setErros((p) => ({ ...p, duracao: undefined }));
            }}
            style={styles.recalcularWrap}
          >
            <Text style={styles.recalcular}>Sugestão: soma dos serviços ({duracaoSugerida} min)</Text>
          </TouchableOpacity>
        ) : null}

        {!usarPacote && !sorteio && (status === 'agendado' || status === 'concluido') ? (
          <TouchableOpacity style={styles.switchRow} onPress={() => setPago((v) => !v)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitle}>Já foi pago</Text>
              <Text style={styles.switchSubtitle}>
                {pago ? 'Conta a receber será marcada como quitada' : 'A conta a receber permanecerá pendente'}
              </Text>
            </View>
            <Switch
              value={pago}
              onValueChange={setPago}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={pago ? colors.primary : '#fff'}
            />
          </TouchableOpacity>
        ) : null}
        {pago && !usarPacote && !sorteio && (status === 'agendado' || status === 'concluido') ? (
          <DateField label="Data do pagamento" value={dataPagamento} onChange={setDataPagamento} />
        ) : null}
        {pago && !usarPacote && !sorteio && (status === 'agendado' || status === 'concluido') && erros.dataPagamento ? (
          <Text style={styles.erroText}>{erros.dataPagamento}</Text>
        ) : null}

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

        {!existente && !sorteio ? (
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

      <ConflitoModal />
      <ConfirmarContaModal />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  sairBtn: { color: colors.primary, fontWeight: '700', fontSize: 15 },
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
  adicionalHeader: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.sm },
  adicionalTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginLeft: 6 },
  modalCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  modalLabel: { fontSize: 13, color: colors.textSecondary },
  modalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  modalHint: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.md, lineHeight: 18 },
  modalActions: { flexDirection: 'row', marginTop: spacing.md },
});