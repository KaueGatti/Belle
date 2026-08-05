// Formata número para moeda BRL (ex: 1234.5 -> "R$ 1.234,50")
export function formatCurrency(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

// Converte texto digitado (aceita "1.234,56", "1234,56", "R$ 50,00" etc.) para número
export function parseCurrencyInput(text) {
  if (typeof text !== 'string') return Number(text) || 0;
  const cleaned = text.replace(/[^\d,.-]/g, '');
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  let normalized;
  if (lastComma === -1 && lastDot === -1) {
    normalized = cleaned;
  } else if (lastComma > lastDot) {
    normalized = cleaned.slice(0, lastComma).replace(/\./g, '') + '.' + cleaned.slice(lastComma + 1).replace(/\D/g, '');
  } else {
    normalized = cleaned.slice(0, lastDot).replace(/[.,]/g, '') + '.' + cleaned.slice(lastDot + 1).replace(/\D/g, '');
  }
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

// Formata um valor para texto mascarado de moeda: 1234.5 -> "R$ 1.234,50"
export function maskCurrency(value) {
  const num = parseCurrencyInput(value);
  if (!num) return '';
  return formatCurrency(num);
}

// Máscara de moeda aplicada enquanto digita (baseada em centavos): "12" -> "R$ 0,12"
export function maskCurrencyInput(text) {
  const digits = (text || '').replace(/\D/g, '').slice(0, 13);
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  return formatCurrency(cents / 100);
}

// Máscara de porcentagem (0 a 100): "12" -> "12%"
export function maskPercent(text) {
  const digits = (text || '').replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  const num = Math.min(100, parseInt(digits, 10));
  return `${num}%`;
}

// Máscara de telefone brasileiro: "(11) 99999-9999" ou "(11) 9999-9999"
export function maskPhone(text) {
  const digits = (text || '').replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Data no formato ISO 'YYYY-MM-DD' -> 'DD/MM/AAAA'
export function formatDateBR(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

// Converte Date object -> 'YYYY-MM-DD'
export function dateToISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Converte 'YYYY-MM-DD' -> Date object (meia-noite local)
export function isoToDate(isoDate) {
  if (!isoDate) return new Date();
  const [y, m, d] = isoDate.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Formata Date -> 'HH:mm'
export function timeToString(date) {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

export function todayISO() {
  return dateToISO(new Date());
}

// Retorna nome do dia da semana + data por extenso curta (ex: "Seg, 05/08")
export function formatDateShortWeekday(isoDate) {
  const date = isoToDate(isoDate);
  const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dia = dias[date.getDay()];
  return `${dia}, ${formatDateBR(isoDate)}`;
}

export function isPast(isoDate) {
  return isoDate < todayISO();
}

// Retorna o intervalo de datas { start, end } (ISO) para um preset de período.
// key: hoje | ontem | amanha | semana | mes | custom | (null = todos)
// start/end são 'YYYY-MM-DD' e comparáveis lexicograficamente.
export function periodRange(key, customStart, customEnd) {
  const hoje = new Date();
  const iso = (d) => dateToISO(d);
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  switch (key) {
    case 'hoje':
    case 'ontem':
    case 'amanha': {
      const offset = key === 'hoje' ? 0 : key === 'ontem' ? -1 : 1;
      const d = iso(addDays(hoje, offset));
      return { start: d, end: d };
    }
    case 'semana': {
      const dow = (hoje.getDay() + 6) % 7; // 0 = segunda-feira
      const start = addDays(hoje, -dow);
      return { start: iso(start), end: iso(addDays(start, 6)) };
    }
    case 'mes': {
      const start = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      const end = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
      return { start: iso(start), end: iso(end) };
    }
    case 'custom': {
      const s = customStart || iso(addDays(hoje, -7));
      const e = customEnd || iso(hoje);
      return { start: s, end: e };
    }
    default:
      return null; // todos
  }
}

// Verifica se uma conta pertence ao período (por vencimento ou data de pagamento)
export function contaInPeriodo(conta, range) {
  if (!range) return true;
  const v = conta.vencimento || '';
  const p = conta.dataPagamento || '';
  return (v >= range.start && v <= range.end) || (p >= range.start && p <= range.end);
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
