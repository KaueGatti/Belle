import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { STORAGE_KEYS, loadItem, saveItem } from '../utils/storage';
import { generateId, todayISO } from '../utils/format';

const DataContext = createContext(null);

const CENTROS_PADRAO = [
  { id: generateId('cc'), nome: 'Serviços', tipo: 'receita', descricao: 'Receita com procedimentos realizados' },
  { id: generateId('cc'), nome: 'Produtos e Materiais', tipo: 'despesa', descricao: 'Esmaltes, acetona, algodão, etc.' },
  { id: generateId('cc'), nome: 'Aluguel / Espaço', tipo: 'despesa', descricao: 'Aluguel do salão ou espaço de trabalho' },
  { id: generateId('cc'), nome: 'Contas de Consumo', tipo: 'despesa', descricao: 'Água, luz, internet' },
  { id: generateId('cc'), nome: 'Outros', tipo: 'ambos', descricao: 'Demais entradas e saídas' },
];

export function DataProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [contas, setContas] = useState([]);
  const [centrosCusto, setCentrosCusto] = useState([]);
  const [servicos, setServicos] = useState([]);
  const [pacotes, setPacotes] = useState([]);
  const [pacotesVendidos, setPacotesVendidos] = useState([]);

  const hasLoaded = useRef(false);

  // Carrega dados persistidos na inicialização
  useEffect(() => {
    (async () => {
      const [c, a, f, cc, seeded, sv, pc, pv] = await Promise.all([
        loadItem(STORAGE_KEYS.CLIENTES, []),
        loadItem(STORAGE_KEYS.AGENDAMENTOS, []),
        loadItem(STORAGE_KEYS.CONTAS, []),
        loadItem(STORAGE_KEYS.CENTROS_CUSTO, []),
        loadItem(STORAGE_KEYS.SEEDED, false),
        loadItem(STORAGE_KEYS.SERVICOS, []),
        loadItem(STORAGE_KEYS.PACOTES, []),
        loadItem(STORAGE_KEYS.PACOTES_VENDIDOS, []),
      ]);

      setClientes(c);
      setAgendamentos(a);
      setContas(f);
      setServicos(sv);
      setPacotes(pc);
      setPacotesVendidos(pv);

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

  // ---------- Clientes ----------
  function addCliente(data) {
    const novo = { id: generateId('cli'), createdAt: Date.now(), updatedAt: Date.now(), ...data };
    setClientes((prev) => [novo, ...prev]);
    return novo;
  }
  function updateCliente(id, data) {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)));
  }
  function deleteCliente(id) {
    setClientes((prev) => prev.filter((c) => c.id !== id));
  }
  function getCliente(id) {
    return clientes.find((c) => c.id === id) || null;
  }

  // ---------- Agendamentos ----------
  function addAgendamento(data) {
    const novo = { id: generateId('ag'), createdAt: Date.now(), updatedAt: Date.now(), ...data };
    setAgendamentos((prev) => [novo, ...prev]);
    return novo;
  }
  function updateAgendamento(id, data) {
    setAgendamentos((prev) => prev.map((a) => (a.id === id ? { ...a, ...data, updatedAt: Date.now() } : a)));
  }
  function deleteAgendamento(id) {
    const alvo = agendamentos.find((a) => a.id === id);
    if (alvo?.pacoteVendaId && Array.isArray(alvo.servicos)) {
      restaurarPacote(alvo.pacoteVendaId, alvo.servicos);
    }
    setAgendamentos((prev) => prev.filter((a) => a.id !== id));
    setContas((prev) => prev.filter((c) => c.agendamentoId !== id));
  }
  function getAgendamento(id) {
    return agendamentos.find((a) => a.id === id) || null;
  }

  // ---------- Contas (a pagar / a receber) ----------
  function addConta(data) {
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
    };
    if (Number(novo.valorPago) > 0) {
      novo.status = Number(novo.valorPago) >= Number(novo.valor || 0) ? 'quitado' : 'pendente';
      if (novo.status === 'quitado') novo.dataPagamento = novo.dataPagamento || todayISO();
    }
    setContas((prev) => [novo, ...prev]);
    return novo;
  }
  function updateConta(id, data) {
    setContas((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)));
  }
  function deleteConta(id) {
    setContas((prev) => prev.filter((c) => c.id !== id));
  }
  // Registra um pagamento parcial/total sobre a conta
  function pagarConta(id, valor) {
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
          dataPagamento: quitado ? todayISO() : null,
          updatedAt: Date.now(),
        };
      })
    );
  }
  function marcarContaStatus(id, status) {
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
  function getConta(id) {
    return contas.find((c) => c.id === id) || null;
  }

  // ---------- Centros de Custo ----------
  function addCentroCusto(data) {
    const novo = { id: generateId('cc'), createdAt: Date.now(), updatedAt: Date.now(), ...data };
    setCentrosCusto((prev) => [novo, ...prev]);
    return novo;
  }
  function updateCentroCusto(id, data) {
    setCentrosCusto((prev) => prev.map((c) => (c.id === id ? { ...c, ...data, updatedAt: Date.now() } : c)));
  }
  function deleteCentroCusto(id) {
    setCentrosCusto((prev) => prev.filter((c) => c.id !== id));
  }
  function getCentroCusto(id) {
    return centrosCusto.find((c) => c.id === id) || null;
  }
  function contaCountForCentro(id) {
    return contas.filter((c) => c.centroCustoId === id).length;
  }

  // ---------- Serviços ----------
  function addServico(data) {
    const novo = { id: generateId('sv'), createdAt: Date.now(), updatedAt: Date.now(), ...data };
    setServicos((prev) => [novo, ...prev]);
    return novo;
  }
  function updateServico(id, data) {
    setServicos((prev) => prev.map((s) => (s.id === id ? { ...s, ...data, updatedAt: Date.now() } : s)));
  }
  function deleteServico(id) {
    setServicos((prev) => prev.filter((s) => s.id !== id));
  }
  function getServico(id) {
    return servicos.find((s) => s.id === id) || null;
  }
  function servicoUsadoCount(id) {
    return agendamentos.filter((a) => Array.isArray(a.servicos) && a.servicos.includes(id)).length;
  }
  // Exibe os serviços de um agendamento como "Manicure + Pedicure".
  // Suporta agendamentos antigos que guardavam um único texto em "servico".
  function formatAgendamentoServicos(agendamento) {
    if (Array.isArray(agendamento.servicos) && agendamento.servicos.length > 0) {
      const nomes = agendamento.servicos.map((id) => getServico(id)?.nome).filter(Boolean);
      return nomes.length ? nomes.join(' + ') : 'Serviço(s) removido(s)';
    }
    return agendamento.servico || 'Sem serviço';
  }

  // ---------- Pacotes ----------
  function addPacote(data) {
    const novo = { id: generateId('pc'), createdAt: Date.now(), updatedAt: Date.now(), ...data };
    setPacotes((prev) => [novo, ...prev]);
    return novo;
  }
  function updatePacote(id, data) {
    setPacotes((prev) => prev.map((p) => (p.id === id ? { ...p, ...data, updatedAt: Date.now() } : p)));
  }
  function deletePacote(id) {
    setPacotes((prev) => prev.filter((p) => p.id !== id));
  }
  function getPacote(id) {
    return pacotes.find((p) => p.id === id) || null;
  }
  function pacoteUsadoCount(id) {
    return pacotesVendidos.filter((v) => v.pacoteId === id).length;
  }

  // ---------- Vendas de Pacote ----------
  function venderPacote(clienteId, pacoteId, desconto = 0) {
    const pacote = getPacote(pacoteId);
    if (!pacote) return null;
    const cliente = clientes.find((c) => c.id === clienteId);
    const descontoNum = Math.max(0, Number(desconto) || 0);
    const valor = Math.max(0, Number(pacote.valor || 0) - descontoNum);
    const novo = {
      id: generateId('pv'),
      pacoteId,
      clienteId,
      vendidoEm: todayISO(),
      valor,
      desconto: descontoNum,
      servicos: pacote.servicos.map((s) => ({ servicoId: s.servicoId, qtd: s.qtd })),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setPacotesVendidos((prev) => [novo, ...prev]);
    addConta({
      tipo: 'receber',
      descricao: `Pacote ${pacote.nome} - ${cliente?.nome || ''}`,
      valor,
      vencimento: todayISO(),
      clienteId,
      valorPago: 0,
      status: 'pendente',
    });
    return novo;
  }
  function getPacoteVenda(id) {
    return pacotesVendidos.find((v) => v.id === id) || null;
  }
  // Quantos agendamentos estão vinculados a esta venda de pacote
  function pacoteVendaUsadoCount(id) {
    return agendamentos.filter((a) => a.pacoteVendaId === id).length;
  }
  // Remove a venda de pacote (apenas quando não há agendamento usando o saldo)
  function deletePacoteVenda(id) {
    setPacotesVendidos((prev) => prev.filter((v) => v.id !== id));
  }
  // Vendas de pacote ainda com saldo (serviços disponíveis)
  function pacotesAtivosDoCliente(clienteId) {
    return pacotesVendidos.filter(
      (v) => v.clienteId === clienteId && v.servicos.some((s) => Number(s.qtd) > 0)
    );
  }
  function totalQtdVenda(venda) {
    return (venda?.servicos || []).reduce((acc, s) => acc + Number(s.qtd || 0), 0);
  }
  // Debita 1 unidade de cada serviço usado do pacote da cliente
  function debitarPacote(pacoteVendaId, servicoIds) {
    if (!Array.isArray(servicoIds)) return;
    setPacotesVendidos((prev) =>
      prev.map((v) => {
        if (v.id !== pacoteVendaId) return v;
        return {
          ...v,
          servicos: v.servicos.map((s) =>
            servicoIds.includes(s.servicoId) && Number(s.qtd) > 0 ? { ...s, qtd: Number(s.qtd) - 1 } : s
          ),
          updatedAt: Date.now(),
        };
      })
    );
  }
  // Devolve as unidades (usado ao editar/excluir agendamento de pacote)
  function restaurarPacote(pacoteVendaId, servicoIds) {
    if (!Array.isArray(servicoIds)) return;
    setPacotesVendidos((prev) =>
      prev.map((v) => {
        if (v.id !== pacoteVendaId) return v;
        return {
          ...v,
          servicos: v.servicos.map((s) =>
            servicoIds.includes(s.servicoId) ? { ...s, qtd: Number(s.qtd) + 1 } : s
          ),
          updatedAt: Date.now(),
        };
      })
    );
  }

  // Substitui todos os dados de uma vez (usado no import de backup e no sync)
  function restoreSnapshot(dados) {
    const fallback = [];
    setClientes(Array.isArray(dados?.clientes) ? dados.clientes : fallback);
    setAgendamentos(Array.isArray(dados?.agendamentos) ? dados.agendamentos : fallback);
    setContas(Array.isArray(dados?.contas) ? dados.contas : fallback);
    setCentrosCusto(Array.isArray(dados?.centrosCusto) ? dados.centrosCusto : fallback);
    setServicos(Array.isArray(dados?.servicos) ? dados.servicos : fallback);
    setPacotes(Array.isArray(dados?.pacotes) ? dados.pacotes : fallback);
    setPacotesVendidos(Array.isArray(dados?.pacotesVendidos) ? dados.pacotesVendidos : fallback);
  }

  const value = {
    loading,
    clientes,
    agendamentos,
    contas,
    centrosCusto,
    servicos,
    pacotes,
    pacotesVendidos,
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
    addServico,
    updateServico,
    deleteServico,
    getServico,
    servicoUsadoCount,
    formatAgendamentoServicos,
    addPacote,
    updatePacote,
    deletePacote,
    getPacote,
    pacoteUsadoCount,
    venderPacote,
    getPacoteVenda,
    pacotesAtivosDoCliente,
    totalQtdVenda,
    pacoteVendaUsadoCount,
    deletePacoteVenda,
    debitarPacote,
    restaurarPacote,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData deve ser usado dentro de um DataProvider');
  return ctx;
}
