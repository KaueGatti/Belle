import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { STORAGE_KEYS, loadItem, saveItem } from '../utils/storage';
import { generateId, todayISO } from '../utils/format';
import {
  Cliente,
  Agendamento,
  Conta,
  CentroCusto,
  Servico,
  Pacote,
  PacoteVendido,
  PacoteItem,
  Produto,
  ProdutoItem,
  Compromisso,
  DadosApp,
} from '../types/entities';

type ClienteInput = Partial<Omit<Cliente, 'id' | 'createdAt' | 'updatedAt'>>;
type AgendamentoInput = Partial<Omit<Agendamento, 'id' | 'createdAt' | 'updatedAt'>>;
type ContaInput = Partial<Omit<Conta, 'id' | 'createdAt' | 'updatedAt'>>;
type CentroCustoInput = Partial<Omit<CentroCusto, 'id' | 'createdAt' | 'updatedAt'>>;
type ServicoInput = Partial<Omit<Servico, 'id' | 'createdAt' | 'updatedAt'>>;
type PacoteInput = Partial<Omit<Pacote, 'id' | 'createdAt' | 'updatedAt'>>;
type ProdutoInput = Partial<Omit<Produto, 'id' | 'createdAt' | 'updatedAt'>>;
export type CompromissoInput = Partial<Omit<Compromisso, 'id' | 'createdAt' | 'updatedAt'>>;

const DataContext = createContext<DataContextValue | null>(null);

const CENTROS_PADRAO: CentroCusto[] = [
  { id: generateId('cc'), nome: 'Serviços', tipo: 'receita', descricao: 'Receita com procedimentos realizados', createdAt: Date.now() },
  { id: generateId('cc'), nome: 'Produtos e Materiais', tipo: 'despesa', descricao: 'Esmaltes, acetona, algodão, etc.', createdAt: Date.now() },
  { id: generateId('cc'), nome: 'Aluguel / Espaço', tipo: 'despesa', descricao: 'Aluguel do salão ou espaço de trabalho', createdAt: Date.now() },
  { id: generateId('cc'), nome: 'Contas de Consumo', tipo: 'despesa', descricao: 'Água, luz, internet', createdAt: Date.now() },
  { id: generateId('cc'), nome: 'Outros', tipo: 'ambos', descricao: 'Demais entradas e saídas', createdAt: Date.now() },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [pacotes, setPacotes] = useState<Pacote[]>([]);
  const [pacotesVendidos, setPacotesVendidos] = useState<PacoteVendido[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [compromissos, setCompromissos] = useState<Compromisso[]>([]);

  const hasLoaded = useRef(false);

  // Carrega dados persistidos na inicialização
  useEffect(() => {
    (async () => {
      const [c, a, f, cc, seeded, sv, pc, pv, pr, cp] = await Promise.all([
        loadItem<Cliente[]>(STORAGE_KEYS.CLIENTES, []),
        loadItem<Agendamento[]>(STORAGE_KEYS.AGENDAMENTOS, []),
        loadItem<Conta[]>(STORAGE_KEYS.CONTAS, []),
        loadItem<CentroCusto[]>(STORAGE_KEYS.CENTROS_CUSTO, []),
        loadItem<boolean>(STORAGE_KEYS.SEEDED, false),
        loadItem<Servico[]>(STORAGE_KEYS.SERVICOS, []),
        loadItem<Pacote[]>(STORAGE_KEYS.PACOTES, []),
        loadItem<PacoteVendido[]>(STORAGE_KEYS.PACOTES_VENDIDOS, []),
        loadItem<Produto[]>(STORAGE_KEYS.PRODUTOS, []),
        loadItem<Compromisso[]>(STORAGE_KEYS.COMPROMISSOS, []),
      ]);

      setClientes(c);
      setAgendamentos(a);
      setContas(f);
      setServicos(sv);
      setPacotes(pc);
      setPacotesVendidos(pv);
      setProdutos(pr);
      setCompromissos(cp);

      if (!seeded && cc.length === 0) {
        setCentrosCusto(CENTROS_PADRAO);
        await saveItem(STORAGE_KEYS.CENTROS_CUSTO, CENTROS_PADRAO);
        await saveItem(STORAGE_KEYS.SEEDED, true);
      } else {
        setCentrosCusto(cc);
      }

      hasLoaded.current = true;
      setLoading(false);
    })();
  }, []);

  // Persiste sempre que os dados mudarem (após o carregamento inicial)
  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.CLIENTES, clientes);
  }, [clientes]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.AGENDAMENTOS, agendamentos);
  }, [agendamentos]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.CONTAS, contas);
  }, [contas]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.CENTROS_CUSTO, centrosCusto);
  }, [centrosCusto]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.SERVICOS, servicos);
  }, [servicos]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.PACOTES, pacotes);
  }, [pacotes]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.PACOTES_VENDIDOS, pacotesVendidos);
  }, [pacotesVendidos]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.PRODUTOS, produtos);
  }, [produtos]);

  useEffect(() => {
    if (hasLoaded.current) saveItem(STORAGE_KEYS.COMPROMISSOS, compromissos);
  }, [compromissos]);

  // ---------- Clientes ----------
  function addCliente(data: ClienteInput): Cliente {
    const novo = { id: generateId('cli'), createdAt: Date.now(), updatedAt: Date.now(), ...data } as Cliente;
    setClientes((prev) => [novo, ...prev]);
    return novo;
  }
  function updateCliente(id: string, data: ClienteInput) {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)));
  }
  function deleteCliente(id: string) {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }
  function getCliente(id: string): Cliente | null {
    return clientes.find((c) => c.id === id) || null;
  }

  // ---------- Agendamentos ----------
  function addAgendamento(data: AgendamentoInput): Agendamento {
    const novo = { id: generateId('ag'), createdAt: Date.now(), updatedAt: Date.now(), ...data } as Agendamento;
    setAgendamentos((prev) => [novo, ...prev]);
    return novo;
  }
  function updateAgendamento(id: string, data: AgendamentoInput) {
    setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a)));
  }
  function deleteAgendamento(id: string) {
    const alvo = agendamentos.find((a) => a.id === id);
    if (alvo?.pacoteVendaId && Array.isArray(alvo.servicos)) {
      restaurarPacote(alvo.pacoteVendaId, alvo.servicos, alvo.servicosQtd);
    }
    if (Array.isArray(alvo?.produtos)) {
      restaurarEstoqueProdutos(alvo.produtos);
    }
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
    setContas((prev) => prev.filter((c) => c.agendamentoId !== id));
  }
  function getAgendamento(id: string): Agendamento | null {
    return agendamentos.find((a) => a.id === id) || null;
  }

  // ---------- Contas (a pagar / a receber) ----------
  function addConta(data: ContaInput): Conta {
    const novo = {
      id: generateId('ct'),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: 'pendente',
      valorPago: 0,
      dataPagamento: null,
      agendamentoId: null,
      clienteId: null,
      ...data,
    } as Conta;
    if (Number(novo.valorPago) > 0) {
      novo.status = Number(novo.valorPago) >= Number(novo.valor || 0) ? 'quitado' : 'pendente';
      if (novo.status === 'quitado') novo.dataPagamento = novo.dataPagamento || todayISO();
    }
    setContas((prev) => [novo, ...prev]);
    return novo;
  }
  function updateConta(id: string, data: ContaInput) {
    setContas((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)));
  }
  function deleteConta(id: string) {
    setContas((prev) => prev.filter((c) => c.id !== id));
  }
  // Registra um pagamento parcial/total sobre a conta
  // data: data do pagamento (retroativa ou atual); gravada em todo pagamento
  function pagarConta(id: string, valor: number, data?: string) {
    setContas((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const total = Number(c.valor || 0);
        const valorPago = Math.min(total, Number(c.valorPago || 0) + Number(valor || 0));
        const quitado = valorPago >= total;
        return {
          ...c,
          valorPago,
          status: quitado ? 'quitado' : 'pendente',
          dataPagamento: data || todayISO(),
          updatedAt: Date.now(),
        };
      })
    );
  }
  function marcarContaStatus(id: string, status: 'pendente' | 'quitado') {
    setContas((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (status === 'quitado') {
          return { ...c, status, valorPago: Number(c.valor || 0), dataPagamento: todayISO(), updatedAt: Date.now() };
        }
        return { ...c, status, valorPago: 0, dataPagamento: null, updatedAt: Date.now() };
      })
    );
  }
  function getConta(id: string): Conta | null {
    return contas.find((c) => c.id === id) || null;
  }

  // ---------- Centros de Custo ----------
  function addCentroCusto(data: CentroCustoInput): CentroCusto {
    const novo = { id: generateId('cc'), createdAt: Date.now(), updatedAt: Date.now(), ...data } as CentroCusto;
    setCentrosCusto((prev) => [novo, ...prev]);
    return novo;
  }
  function updateCentroCusto(id: string, data: CentroCustoInput) {
    setCentrosCusto((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)));
  }
  function deleteCentroCusto(id: string) {
    setCentrosCusto((prev) => prev.filter((c) => c.id !== id));
  }
  function getCentroCusto(id: string): CentroCusto | null {
    return centrosCusto.find((c) => c.id === id) || null;
  }
  function contaCountForCentro(id: string): number {
    return contas.filter((c) => c.centroCustoId === id).length;
  }

  // ---------- Serviços ----------
  function addServico(data: ServicoInput): Servico {
    const novo = { id: generateId('sv'), createdAt: Date.now(), updatedAt: Date.now(), ...data } as Servico;
    setServicos((prev) => [novo, ...prev]);
    return novo;
  }
  function updateServico(id: string, data: ServicoInput) {
    setServicos((prev) => prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: Date.now() } : s)));
  }
  function deleteServico(id: string) {
    setServicos((prev) => prev.filter((s) => s.id !== id));
  }
  function getServico(id: string): Servico | null {
    return servicos.find((s) => s.id === id) || null;
  }
  function servicoUsadoCount(id: string): number {
    return agendamentos.filter((a) => Array.isArray(a.servicos) && a.servicos.includes(id)).length;
  }
  // Exibe os serviços de um agendamento como "Manicure x2 + Pedicure".
  // Suporta agendamentos antigos que guardavam um único texto em "servico".
  function formatAgendamentoServicos(agendamento: Agendamento): string {
    if (Array.isArray(agendamento.servicos) && agendamento.servicos.length > 0) {
      const partes = agendamento.servicos
        .map((id) => {
          const nome = getServico(id)?.nome;
          if (!nome) return null;
          const qtd = Number(agendamento.servicosQtd?.[id] || 0);
          return qtd > 1 ? `${nome} x${qtd}` : nome;
        })
        .filter(Boolean);
      return partes.length ? partes.join(' + ') : 'Serviço(s) removido(s)';
    }
    return agendamento.servico || 'Sem serviço';
  }

  // Resumo dos produtos vendidos em um agendamento: "Esmalte x1 + Lixa x2"
  function formatAgendamentoProdutos(agendamento: Agendamento): string {
    const itens = agendamento.produtos || [];
    if (itens.length === 0) return '';
    const partes = itens
      .map((it) => {
        const nome = getProduto(it.produtoId)?.nome;
        if (!nome) return null;
        return Number(it.qtd) > 1 ? `${nome} x${it.qtd}` : nome;
      })
      .filter(Boolean);
    return partes.join(' + ');
  }

  // ---------- Pacotes ----------
  function addPacote(data: PacoteInput): Pacote {
    const novo = { id: generateId('pc'), createdAt: Date.now(), updatedAt: Date.now(), ...data } as Pacote;
    setPacotes((prev) => [novo, ...prev]);
    return novo;
  }
  function updatePacote(id: string, data: PacoteInput) {
    setPacotes((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p)));
  }
  function deletePacote(id: string) {
    setPacotes((prev) => prev.filter((p) => p.id !== id));
  }
  function getPacote(id: string): Pacote | null {
    return pacotes.find((p) => p.id === id) || null;
  }
  function pacoteUsadoCount(id: string): number {
    return pacotesVendidos.filter((v) => v.pacoteId === id).length;
  }

  // ---------- Vendas de Pacote ----------
  interface OpcoesVenda {
    dataVenda?: string;
    valorPago?: number;
    dataRecebimento?: string;
  }
  function registrarContaPacote(novo: PacoteVendido, clienteId: string, descricao: string, valor: number, dataVenda: string, opcoes: OpcoesVenda) {
    const cliente = clientes.find((c) => c.id === clienteId);
    const valorPago = Math.max(0, Number(opcoes.valorPago) || 0);
    const statusConta: Conta['status'] = valorPago >= valor ? 'quitado' : 'pendente';
    addConta({
      tipo: 'receber',
      descricao: `${descricao} ${cliente?.nome || ''}`.trim(),
      valor,
      vencimento: dataVenda,
      clienteId,
      pacoteVendaId: novo.id,
      valorPago,
      status: statusConta,
      dataPagamento: valorPago > 0 ? opcoes.dataRecebimento || todayISO() : null,
    });
  }
  // opcoes: { dataVenda, valorPago, dataRecebimento }
  function venderPacote(clienteId: string, pacoteId: string, desconto = 0, opcoes: OpcoesVenda = {}): PacoteVendido | null {
    const pacote = getPacote(pacoteId);
    if (!pacote) return null;
    const descontoNum = Math.max(0, Number(desconto) || 0);
    const valor = Math.max(0, Number(pacote.valor || 0) - descontoNum);
    const dataVenda = opcoes.dataVenda || todayISO();
    const novo: PacoteVendido = {
      id: generateId('pv'),
      pacoteId,
      clienteId,
      vendidoEm: dataVenda,
      valor,
      desconto: descontoNum,
      servicos: pacote.servicos.map((s) => ({ servicoId: s.servicoId, qtd: s.qtd })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPacotesVendidos((prev) => [novo, ...prev]);
    registrarContaPacote(novo, clienteId, `Pacote ${pacote.nome} -`, valor, dataVenda, opcoes);
    return novo;
  }
  // Venda de pacote personalizado (montado na hora, sem catálogo)
  function venderPacotePersonalizado(
    clienteId: string,
    nome: string,
    itens: PacoteItem[],
    desconto = 0,
    opcoes: OpcoesVenda = {}
  ): PacoteVendido | null {
    if (!nome || !Array.isArray(itens) || itens.length === 0) return null;
    const descontoNum = Math.max(0, Number(desconto) || 0);
    const valorBase = itens.reduce((acc, s) => {
      const serv = servicos.find((x) => x.id === s.servicoId);
      return acc + Number(serv?.preco || 0) * Number(s.qtd || 0);
    }, 0);
    const valor = Math.max(0, valorBase - descontoNum);
    const dataVenda = opcoes.dataVenda || todayISO();
    const novo: PacoteVendido = {
      id: generateId('pv'),
      pacoteId: null,
      nome,
      clienteId,
      vendidoEm: dataVenda,
      valor,
      desconto: descontoNum,
      servicos: itens.map((s) => ({ servicoId: s.servicoId, qtd: s.qtd })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPacotesVendidos((prev) => [novo, ...prev]);
    registrarContaPacote(novo, clienteId, `Pacote ${nome} -`, valor, dataVenda, opcoes);
    return novo;
  }
  function getPacoteVenda(id: string): PacoteVendido | null {
    return pacotesVendidos.find((v) => v.id === id) || null;
  }
  function nomePacoteVenda(venda: PacoteVendido): string {
    const cat = venda.pacoteId ? getPacote(venda.pacoteId) : null;
    return cat?.nome || venda.nome || 'Pacote';
  }
  // Quantos agendamentos estão vinculados a esta venda de pacote
  function pacoteVendaUsadoCount(id: string): number {
    return agendamentos.filter((a) => a.pacoteVendaId === id).length;
  }
  // Remove a venda de pacote (apenas quando não há agendamento usando o saldo).
  // Exclui também a conta a receber vinculada ao pacote.
  function deletePacoteVenda(id: string) {
    const venda = pacotesVendidos.find((v) => v.id === id);
    setPacotesVendidos((prev) => prev.filter((v) => v.id !== id));
    setContas((prev) =>
      prev.filter((c) => {
        if (c.pacoteVendaId === id) return false;
        const legacy =
          venda != null &&
          c.pacoteVendaId == null &&
          c.tipo === 'receber' &&
          c.agendamentoId == null &&
          c.clienteId === venda.clienteId &&
          typeof c.descricao === 'string' &&
          c.descricao.startsWith('Pacote ');
        return !legacy;
      })
    );
  }
  // Vendas de pacote ainda com saldo (serviços disponíveis)
  function pacotesAtivosDoCliente(clienteId: string): PacoteVendido[] {
    return pacotesVendidos.filter(
      (v) => v.clienteId === clienteId && v.servicos.some((s) => Number(s.qtd) > 0)
    );
  }
  function totalQtdVenda(venda: PacoteVendido | null | undefined): number {
    return (venda?.servicos || []).reduce((acc, s) => acc + Number(s.qtd || 0), 0);
  }
  // Debita a quantidade usada de cada serviço do pacote da cliente
  function debitarPacote(pacoteVendaId: string, servicoIds: string[], quantidades?: Record<string, number>) {
    if (!Array.isArray(servicoIds)) return;
    setPacotesVendidos((prev) =>
      prev.map((v) => {
        if (v.id !== pacoteVendaId) return v;
        return {
          ...v,
          servicos: v.servicos.map((s) => {
            if (!servicoIds.includes(s.servicoId) || Number(s.qtd) <= 0) return s;
            const q = Math.max(1, Number(quantidades?.[s.servicoId]) || 1);
            return { ...s, qtd: Math.max(0, Number(s.qtd) - q) };
          }),
          updatedAt: Date.now(),
        };
      })
    );
  }
  // Devolve as unidades (usado ao editar/excluir agendamento de pacote)
  function restaurarPacote(pacoteVendaId: string, servicoIds: string[], quantidades?: Record<string, number>) {
    if (!Array.isArray(servicoIds)) return;
    setPacotesVendidos((prev) =>
      prev.map((v) => {
        if (v.id !== pacoteVendaId) return v;
        return {
          ...v,
          servicos: v.servicos.map((s) => {
            if (!servicoIds.includes(s.servicoId)) return s;
            const q = Math.max(1, Number(quantidades?.[s.servicoId]) || 1);
            return { ...s, qtd: Number(s.qtd) + q };
          }),
          updatedAt: Date.now(),
        };
      })
    );
  }

  // ---------- Produtos ----------
  function addProduto(data: ProdutoInput): Produto {
    const novo = { id: generateId('pr'), createdAt: Date.now(), updatedAt: Date.now(), estoque: 0, ...data } as Produto;
    setProdutos((prev) => [novo, ...prev]);
    return novo;
  }
  function updateProduto(id: string, data: ProdutoInput) {
    setProdutos((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p)));
  }
  function deleteProduto(id: string) {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  }
  function getProduto(id: string): Produto | null {
    return produtos.find((p) => p.id === id) || null;
  }
  function produtoUsadoCount(id: string): number {
    return agendamentos.filter((a) =>
      Array.isArray(a.produtos) && a.produtos.some((p) => p.produtoId === id)
    ).length;
  }
  function itemProdutoQuantidade(itens: ProdutoItem[], id: string): number {
    return (itens || []).find((p) => p.produtoId === id)?.qtd || 0;
  }
  // Baixa o estoque ao vender produtos (usa o mínimo entre a qtd solicitada e o estoque)
  function baixarEstoqueProdutos(itens: ProdutoItem[]) {
    if (!Array.isArray(itens) || itens.length === 0) return;
    const totais: Record<string, number> = {};
    for (const it of itens) totais[it.produtoId] = (totais[it.produtoId] || 0) + Number(it.qtd || 0);
    setProdutos((prev) =>
      prev.map((p) => {
        const q = totais[p.id];
        if (!q) return p;
        return { ...p, estoque: Math.max(0, Number(p.estoque || 0) - q), updatedAt: Date.now() };
      })
    );
  }
  // Devolve o estoque (ao editar/excluir agendamento ou venda)
  function restaurarEstoqueProdutos(itens: ProdutoItem[]) {
    if (!Array.isArray(itens) || itens.length === 0) return;
    const totais: Record<string, number> = {};
    for (const it of itens) totais[it.produtoId] = (totais[it.produtoId] || 0) + Number(it.qtd || 0);
    setProdutos((prev) =>
      prev.map((p) => {
        const q = totais[p.id];
        if (!q) return p;
        return { ...p, estoque: Number(p.estoque || 0) + q, updatedAt: Date.now() };
      })
    );
  }
  // Centro de custo padrão para receitas de serviços/produtos
  function centroReceitaPadrao(): CentroCusto | null {
    return (
      centrosCusto.find((c) => c.nome.toLowerCase().includes('serviç')) ||
      centrosCusto.find((c) => c.tipo === 'receita') ||
      centrosCusto[0] ||
      null
    );
  }
  // Venda de produtos para uma cliente: baixa estoque + gera conta a receber
  function venderProduto(clienteId: string, itens: ProdutoItem[], opcoes: OpcoesVenda = {}): boolean {
    if (!clienteId || !Array.isArray(itens) || itens.length === 0) return false;
    const cliente = clientes.find((c) => c.id === clienteId);
    const totais: Record<string, number> = {};
    for (const it of itens) totais[it.produtoId] = (totais[it.produtoId] || 0) + Number(it.qtd || 0);
    const valor = Object.entries(totais).reduce((acc, [id, qtd]) => {
      const p = produtos.find((x) => x.id === id);
      return acc + Number(p?.preco || 0) * qtd;
    }, 0);
    if (valor <= 0) return false;
    const dataVenda = opcoes.dataVenda || todayISO();
    const valorPago = Math.max(0, Number(opcoes.valorPago) || 0);
    const statusConta: Conta['status'] = valorPago >= valor ? 'quitado' : 'pendente';
    const descricao = itens
      .map((it) => {
        const p = produtos.find((x) => x.id === it.produtoId);
        const nome = p?.nome || 'Produto';
        return Number(it.qtd) > 1 ? `${nome} x${it.qtd}` : nome;
      })
      .join(' + ');
    addConta({
      tipo: 'receber',
      descricao: `${descricao} - ${cliente?.nome || ''}`,
      valor,
      vencimento: dataVenda,
      centroCustoId: centroReceitaPadrao()?.id || null,
      clienteId,
      valorPago,
      status: statusConta,
      dataPagamento: valorPago > 0 ? opcoes.dataRecebimento || todayISO() : null,
    });
    baixarEstoqueProdutos(itens);
    return true;
  }

  // ---------- Compromissos ----------
  function addCompromisso(data: CompromissoInput): Compromisso {
    const novo = { id: generateId('cp'), createdAt: Date.now(), updatedAt: Date.now(), ...data } as Compromisso;
    setCompromissos((prev) => [novo, ...prev]);
    return novo;
  }
  function updateCompromisso(id: string, data: CompromissoInput) {
    setCompromissos((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)));
  }
  function deleteCompromisso(id: string) {
    setCompromissos((prev) => prev.filter((c) => c.id !== id));
  }
  function getCompromisso(id: string): Compromisso | null {
    return compromissos.find((c) => c.id === id) || null;
  }

  // Substitui todos os dados de uma vez (usado no import de backup e no sync)
  function restoreSnapshot(dados: Partial<DadosApp> | null | undefined) {
    const fallback: [] = [];
    setClientes(Array.isArray(dados?.clientes) ? dados.clientes : fallback);
    setAgendamentos(Array.isArray(dados?.agendamentos) ? dados.agendamentos : fallback);
    setContas(Array.isArray(dados?.contas) ? dados.contas : fallback);
    setCentrosCusto(Array.isArray(dados?.centrosCusto) ? dados.centrosCusto : fallback);
    setServicos(Array.isArray(dados?.servicos) ? dados.servicos : fallback);
    setPacotes(Array.isArray(dados?.pacotes) ? dados.pacotes : fallback);
    setPacotesVendidos(Array.isArray(dados?.pacotesVendidos) ? dados.pacotesVendidos : fallback);
    setProdutos(Array.isArray(dados?.produtos) ? dados.produtos : fallback);
    setCompromissos(Array.isArray(dados?.compromissos) ? dados.compromissos : fallback);
  }

  const value: DataContextValue = {
    loading,
    clientes,
    agendamentos,
    contas,
    centrosCusto,
    servicos,
    pacotes,
    pacotesVendidos,
    produtos,
    compromissos,
    restoreSnapshot,
    addCliente,
    updateCliente,
    deleteCliente,
    getCliente,
    addAgendamento,
    updateAgendamento,
    deleteAgendamento,
    getAgendamento,
    addConta,
    updateConta,
    deleteConta,
    pagarConta,
    marcarContaStatus,
    getConta,
    addCentroCusto,
    updateCentroCusto,
    deleteCentroCusto,
    getCentroCusto,
    contaCountForCentro,
    centroReceitaPadrao,
    addServico,
    updateServico,
    deleteServico,
    getServico,
    servicoUsadoCount,
    formatAgendamentoServicos,
    formatAgendamentoProdutos,
    addPacote,
    updatePacote,
    deletePacote,
    getPacote,
    pacoteUsadoCount,
    venderPacote,
    venderPacotePersonalizado,
    getPacoteVenda,
    nomePacoteVenda,
    pacotesAtivosDoCliente,
    totalQtdVenda,
    pacoteVendaUsadoCount,
    deletePacoteVenda,
    debitarPacote,
    restaurarPacote,
    addProduto,
    updateProduto,
    deleteProduto,
    getProduto,
    produtoUsadoCount,
    itemProdutoQuantidade,
    baixarEstoqueProdutos,
    restaurarEstoqueProdutos,
    venderProduto,
    addCompromisso,
    updateCompromisso,
    deleteCompromisso,
    getCompromisso,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export interface DataContextValue {
  loading: boolean;
  clientes: Cliente[];
  agendamentos: Agendamento[];
  contas: Conta[];
  centrosCusto: CentroCusto[];
  servicos: Servico[];
  pacotes: Pacote[];
  pacotesVendidos: PacoteVendido[];
  produtos: Produto[];
  compromissos: Compromisso[];
  restoreSnapshot: (dados: Partial<DadosApp> | null | undefined) => void;
  addCliente: (data: ClienteInput) => Cliente;
  updateCliente: (id: string, data: ClienteInput) => void;
  deleteCliente: (id: string) => void;
  getCliente: (id: string) => Cliente | null;
  addAgendamento: (data: AgendamentoInput) => Agendamento;
  updateAgendamento: (id: string, data: AgendamentoInput) => void;
  deleteAgendamento: (id: string) => void;
  getAgendamento: (id: string) => Agendamento | null;
  addConta: (data: ContaInput) => Conta;
  updateConta: (id: string, data: ContaInput) => void;
  deleteConta: (id: string) => void;
  pagarConta: (id: string, valor: number, data?: string) => void;
  marcarContaStatus: (id: string, status: 'pendente' | 'quitado') => void;
  getConta: (id: string) => Conta | null;
  addCentroCusto: (data: CentroCustoInput) => CentroCusto;
  updateCentroCusto: (id: string, data: CentroCustoInput) => void;
  deleteCentroCusto: (id: string) => void;
  getCentroCusto: (id: string) => CentroCusto | null;
  contaCountForCentro: (id: string) => number;
  centroReceitaPadrao: () => CentroCusto | null;
  addServico: (data: ServicoInput) => Servico;
  updateServico: (id: string, data: ServicoInput) => void;
  deleteServico: (id: string) => void;
  getServico: (id: string) => Servico | null;
  servicoUsadoCount: (id: string) => number;
  formatAgendamentoServicos: (agendamento: Agendamento) => string;
  formatAgendamentoProdutos: (agendamento: Agendamento) => string;
  addPacote: (data: PacoteInput) => Pacote;
  updatePacote: (id: string, data: PacoteInput) => void;
  deletePacote: (id: string) => void;
  getPacote: (id: string) => Pacote | null;
  pacoteUsadoCount: (id: string) => number;
  venderPacote: (clienteId: string, pacoteId: string, desconto?: number, opcoes?: { dataVenda?: string; valorPago?: number; dataRecebimento?: string }) => PacoteVendido | null;
  venderPacotePersonalizado: (clienteId: string, nome: string, itens: PacoteItem[], desconto?: number, opcoes?: { dataVenda?: string; valorPago?: number; dataRecebimento?: string }) => PacoteVendido | null;
  getPacoteVenda: (id: string) => PacoteVendido | null;
  nomePacoteVenda: (venda: PacoteVendido) => string;
  pacotesAtivosDoCliente: (clienteId: string) => PacoteVendido[];
  totalQtdVenda: (venda: PacoteVendido | null | undefined) => number;
  pacoteVendaUsadoCount: (id: string) => number;
  deletePacoteVenda: (id: string) => void;
  debitarPacote: (pacoteVendaId: string, servicoIds: string[], quantidades?: Record<string, number>) => void;
  restaurarPacote: (pacoteVendaId: string, servicoIds: string[], quantidades?: Record<string, number>) => void;
  addProduto: (data: ProdutoInput) => Produto;
  updateProduto: (id: string, data: ProdutoInput) => void;
  deleteProduto: (id: string) => void;
  getProduto: (id: string) => Produto | null;
  produtoUsadoCount: (id: string) => number;
  itemProdutoQuantidade: (itens: ProdutoItem[], id: string) => number;
  baixarEstoqueProdutos: (itens: ProdutoItem[]) => void;
  restaurarEstoqueProdutos: (itens: ProdutoItem[]) => void;
  venderProduto: (clienteId: string, itens: ProdutoItem[], opcoes?: { dataVenda?: string; valorPago?: number; dataRecebimento?: string }) => boolean;
  addCompromisso: (data: CompromissoInput) => Compromisso;
  updateCompromisso: (id: string, data: CompromissoInput) => void;
  deleteCompromisso: (id: string) => void;
  getCompromisso: (id: string) => Compromisso | null;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de um DataProvider');
  return ctx;
}