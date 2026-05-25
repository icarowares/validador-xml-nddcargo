import type { ValidationError, ValidationResult } from './types';

// ─── Field helpers ─────────────────────────────────────────────────────────────

function isDigits(v: string): boolean { return /^\d+$/.test(v); }
function isDecimal(v: string): boolean { return /^\d+(\.\d+)?$/.test(v); }
function isDate(v: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(v); }
function isDatetime(v: string): boolean { return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v); }

// ─── Context ──────────────────────────────────────────────────────────────────

interface Ctx {
  errors: ValidationError[];
  lineNumber: number;
  err(message: string, fieldLabel?: string): void;
}

function makeCtx(lineNumber: number, regCode: string): Ctx {
  const errors: ValidationError[] = [];
  return {
    errors,
    lineNumber,
    err(message: string, fieldLabel?: string) {
      const label = fieldLabel ? ` · Campo: ${fieldLabel}` : '';
      errors.push({ path: `Linha ${lineNumber} · Reg. ${regCode}${label}`, message, lineNumber });
    },
  };
}

// ─── Per-field validators ──────────────────────────────────────────────────────

function reqLen(v: string, min: number, max: number, label: string, ctx: Ctx): void {
  if (v.length < min || v.length > max)
    ctx.err(`"${v}" deve ter entre ${min} e ${max} caractere(s) (possui ${v.length})`, label);
}

function reqExact(v: string, len: number, label: string, ctx: Ctx): void {
  if (!isDigits(v) || v.length !== len)
    ctx.err(`"${v}" deve conter exatamente ${len} dígito(s) numérico(s)`, label);
}

function reqDecimal(v: string, maxLen: number, dec: number, label: string, ctx: Ctx): void {
  if (!isDecimal(v)) { ctx.err(`"${v}" deve ser um número positivo (ex: 100 ou 100.50)`, label); return; }
  const parts = v.split('.');
  const frac = parts[1] ?? '';
  if (frac.length > dec) ctx.err(`"${v}" possui mais de ${dec} casa(s) decimal(is)`, label);
  if (v.replace('.', '').length > maxLen) ctx.err(`"${v}" excede o máximo de ${maxLen} dígito(s)`, label);
}

function reqDate(v: string, label: string, ctx: Ctx): void {
  if (!isDate(v)) ctx.err(`"${v}" deve estar no formato AAAA-MM-DD`, label);
}

function reqDatetime(v: string, label: string, ctx: Ctx): void {
  if (!isDatetime(v)) ctx.err(`"${v}" deve estar no formato AAAA-MM-DD HH:MM:SS`, label);
}

function reqEnum(v: string, allowed: number[], descs: string, label: string, ctx: Ctx): void {
  const n = Number(v);
  if (!Number.isInteger(n) || !allowed.includes(n))
    ctx.err(`"${v}" inválido. Valores aceitos: ${descs}`, label);
}

function optField(v: string | undefined, fn: (v: string) => void): void {
  if (v !== undefined && v.trim() !== '') fn(v.trim());
}

// ─── Parsed line ──────────────────────────────────────────────────────────────

interface ParsedLine { lineNumber: number; code: string; fields: string[]; }

// ─── Whitespace check ─────────────────────────────────────────────────────────

function checkWhitespace(line: ParsedLine): ValidationError[] {
  const errs: ValidationError[] = [];
  for (let i = 1; i < line.fields.length; i++) {
    const v = line.fields[i];
    if (v !== v.trim() && v.trim() !== '')
      errs.push({ path: `Linha ${line.lineNumber} · Reg. ${line.code} · Campo ${i}`, message: `Valor contém espaço no início ou no fim: "${v}"`, lineNumber: line.lineNumber });
  }
  return errs;
}

// ─── Record validators ─────────────────────────────────────────────────────────

function val0000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '0000');
  const f = line.fields;
  const token = f[1]?.trim(); const versao = f[2]?.trim();
  if (!token) ctx.err('token é obrigatório', 'token');
  else reqLen(token, 1, 24, 'token', ctx);
  if (!versao) ctx.err('versao é obrigatória', 'versao');
  else reqLen(versao, 1, 7, 'versao', ctx);
  return ctx.errors;
}

function val1000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '1000');
  const f = line.fields;
  const cnpj = f[1]?.trim(); const motivo = f[2]?.trim();
  if (!cnpj) ctx.err('cnpj é obrigatório', 'cnpj');
  else reqExact(cnpj, 14, 'cnpj', ctx);
  if (!motivo) ctx.err('motivo é obrigatório', 'motivo');
  else reqLen(motivo, 1, 1000, 'motivo', ctx);
  return ctx.errors;
}

function val1100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '1100');
  const f = line.fields;
  const ciot = f[1]?.trim(); const ciotCod = f[2]?.trim();
  if (!ciot) ctx.err('ciot é obrigatório', 'ciot');
  else reqExact(ciot, 12, 'ciot', ctx);
  if (!ciotCod) ctx.err('ciotCodVerificador é obrigatório', 'ciotCodVerificador');
  else if (ciotCod.length !== 4) ctx.err(`"${ciotCod}" deve conter exatamente 4 caracteres`, 'ciotCodVerificador');
  return ctx.errors;
}

const D_TIPO_OP = '1 – Lotação, 2 – Fracionado, 3 – TAC Agregado';
function val2000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2000');
  const tipo = line.fields[1]?.trim();
  if (!tipo) ctx.err('tipoOperação é obrigatório', 'tipoOperação');
  else reqEnum(tipo, [1, 2, 3], D_TIPO_OP, 'tipoOperação', ctx);
  return ctx.errors;
}

function val2200(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2200');
  const dataFim = line.fields[1]?.trim();
  if (!dataFim) ctx.err('dataFim é obrigatória', 'dataFim');
  else reqDate(dataFim, 'dataFim', ctx);
  return ctx.errors;
}

const D_TIPO_CARGA = '1–Granel sólido, 2–Granel líquido, 3–Frigorificada/Aquecida, 4–Conteinerizada, 5–Carga Geral, 6–Neogranel, 7–Perigosa(granel sólido), 8–Perigosa(granel líquido), 9–Perigosa(frig/aquec), 10–Perigosa(cont), 11–Perigosa(geral), 12–Granel Pressurizada';
function val2300(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2300');
  const f = line.fields;
  const codigoSH = f[1]?.trim(); const qtd = f[2]?.trim(); const tipoCarga = f[3]?.trim();
  // All fields are optional (N in Obr.)
  optField(codigoSH, v => reqExact(v, 4, 'codigoSH', ctx));
  optField(qtd, v => reqDecimal(v, 9, 2, 'quantidade', ctx));
  optField(tipoCarga, v => {
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1 || n > 12) ctx.err(`"${v}" inválido. Valores aceitos: ${D_TIPO_CARGA}`, 'codigoTipoCarga');
  });
  return ctx.errors;
}

const D_RUBRICA  = '1 – Frete, 2 – Combustível, 3 – Despesa, 4 – Valor de Tarifa';
const D_PRAZO    = '1 – Não utilizar, 2 – Dia fixo da contratante, 3 – Data prevista';
const D_SIM_NAO  = '1 – Sim, 2 – Não';
const D_EFET     = '1 – Posto Credenciado, 2 – Centro de Triagem, 3 – Contratante, 4 – Confirmação eletrônica';
const D_CRITERIO = '1 – Igual, 2 – Diferente, 3 – Maior, 4 – Maior ou igual, 5 – Menor, 6 – Menor ou igual';
const D_CONECTOR = '1 – E, 2 – OU';

function val4000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4000');
  const f = line.fields;
  const nome = f[1]?.trim(); const vlrApl = f[2]?.trim(); const vlrReal = f[3]?.trim();
  const rubrica = f[4]?.trim(); const prazo = f[5]?.trim(); const conf = f[6]?.trim();
  if (!nome) ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome, 1, 50, 'nome', ctx);
  if (!vlrApl) ctx.err('valorAplicado é obrigatório', 'valorAplicado');
  else reqDecimal(vlrApl, 15, 2, 'valorAplicado', ctx);
  optField(vlrReal, v => reqDecimal(v, 15, 2, 'valorReal', ctx));
  if (!rubrica) ctx.err('rubrica é obrigatória', 'rubrica');
  else reqEnum(rubrica, [1, 2, 3, 4], D_RUBRICA, 'rubrica', ctx);
  optField(prazo, v => reqEnum(v, [1, 2, 3], D_PRAZO, 'prazoMinimo', ctx));
  optField(conf, v => reqEnum(v, [1, 2], D_SIM_NAO, 'confirmarPgto', ctx));
  return ctx.errors;
}

function val4100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4100');
  const dh = line.fields[1]?.trim();
  if (!dh) ctx.err('dataHora é obrigatória', 'dataHora');
  else reqDatetime(dh, 'dataHora', ctx);
  return ctx.errors;
}

function val4200(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4200');
  const f = line.fields;
  const dtPrev = f[1]?.trim(); const efet = f[2]?.trim(); const cnpjPosto = f[3]?.trim();
  if (!dtPrev) ctx.err('dataPrevisao é obrigatória', 'dataPrevisao');
  else reqDate(dtPrev, 'dataPrevisao', ctx);
  optField(efet, v => reqEnum(v, [1, 2, 3, 4], D_EFET, 'efetivacao', ctx));
  optField(cnpjPosto, v => reqExact(v, 14, 'cnpjPostoCredenciado', ctx));
  return ctx.errors;
}

function val4300(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4300');
  const f = line.fields;
  const tipo = f[1]?.trim(); const obr = f[2]?.trim();
  if (!tipo) ctx.err('tipo é obrigatório', 'tipo');
  else reqLen(tipo, 1, 255, 'tipo', ctx);
  optField(obr, v => reqEnum(v, [1, 2], D_SIM_NAO, 'obrigatorio', ctx));
  return ctx.errors;
}

function val4310(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4310');
  const desc = line.fields[1]?.trim();
  if (!desc) ctx.err('descricao é obrigatória', 'descricao');
  else reqLen(desc, 1, 255, 'descricao', ctx);
  return ctx.errors;
}

function val4400(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4400');
  const f = line.fields;
  const nm = f[1]?.trim(); const vlr = f[2]?.trim(); const ds = f[3]?.trim();
  if (!nm) ctx.err('nmDesc é obrigatório', 'nmDesc');
  else reqLen(nm, 1, 50, 'nmDesc', ctx);
  if (!vlr) ctx.err('vlrDesc é obrigatório', 'vlrDesc');
  else reqDecimal(vlr, 15, 2, 'vlrDesc', ctx);
  optField(ds, v => reqLen(v, 1, 255, 'dsDesc', ctx));
  return ctx.errors;
}

function val4500(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4500');
  const f = line.fields;
  const campo = f[1]?.trim(); const valor = f[2]?.trim(); const crit = f[3]?.trim(); const con = f[4]?.trim();
  if (!campo) ctx.err('campo é obrigatório', 'campo');
  else reqEnum(campo, [1, 2], '1 – CNPJ do posto credenciado, 2 – Data', 'campo', ctx);
  if (!valor) ctx.err('valor é obrigatório', 'valor');
  else reqLen(valor, 1, 15, 'valor', ctx);
  optField(crit, v => reqEnum(v, [1, 2, 3, 4, 5, 6], D_CRITERIO, 'criterio', ctx));
  optField(con, v => reqEnum(v, [1, 2], D_CONECTOR, 'conector', ctx));
  return ctx.errors;
}

function val4600(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4600');
  const f = line.fields;
  const irrf = f[1]?.trim(); const inss = f[2]?.trim(); const sest = f[3]?.trim();
  if (!irrf) ctx.err('irrf é obrigatório', 'irrf');
  else reqDecimal(irrf, 15, 2, 'irrf', ctx);
  if (!inss) ctx.err('inss é obrigatório', 'inss');
  else reqDecimal(inss, 15, 2, 'inss', ctx);
  if (!sest) ctx.err('sestsenat é obrigatório', 'sestsenat');
  else reqDecimal(sest, 15, 2, 'sestsenat', ctx);
  return ctx.errors;
}

function val5000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5000');
  const nome = line.fields[1]?.trim();
  if (!nome) ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome, 1, 50, 'nome', ctx);
  return ctx.errors;
}

function val5100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5100');
  const data = line.fields[1]?.trim();
  if (!data) ctx.err('data é obrigatória', 'data');
  else reqDatetime(data, 'data', ctx);
  return ctx.errors;
}

function val5200(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5200');
  const f = line.fields;
  const valor = f[1]?.trim(); const rubrica = f[2]?.trim(); const valVal = f[3]?.trim();
  if (!valor) ctx.err('valor é obrigatório', 'valor');
  else reqDecimal(valor, 15, 2, 'valor', ctx);
  if (!rubrica) ctx.err('rubrica é obrigatória', 'rubrica');
  else reqEnum(rubrica, [1, 2, 3, 4], D_RUBRICA, 'rubrica', ctx);
  optField(valVal, v => reqDecimal(v, 15, 2, 'valorValidacao', ctx));
  return ctx.errors;
}

function val5300(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5300');
  const f = line.fields;
  const irrf = f[1]?.trim(); const inss = f[2]?.trim(); const sest = f[3]?.trim(); const valVal = f[4]?.trim();
  if (!irrf) ctx.err('irrf é obrigatório', 'irrf');
  else reqDecimal(irrf, 15, 2, 'irrf', ctx);
  if (!inss) ctx.err('inss é obrigatório', 'inss');
  else reqDecimal(inss, 15, 2, 'inss', ctx);
  if (!sest) ctx.err('sestsenat é obrigatório', 'sestsenat');
  else reqDecimal(sest, 15, 2, 'sestsenat', ctx);
  optField(valVal, v => reqDecimal(v, 15, 2, 'valorValidacao', ctx));
  return ctx.errors;
}

function val5400(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5400');
  const f = line.fields;
  const nm = f[1]?.trim(); const vlr = f[2]?.trim(); const ds = f[3]?.trim();
  const rub = f[4]?.trim(); const valVal = f[5]?.trim();
  if (!nm) ctx.err('nmDesc é obrigatório', 'nmDesc');
  else reqLen(nm, 1, 50, 'nmDesc', ctx);
  if (!vlr) ctx.err('vlrDesc é obrigatório', 'vlrDesc');
  else reqDecimal(vlr, 15, 2, 'vlrDesc', ctx);
  optField(ds, v => reqLen(v, 1, 255, 'dsDesc', ctx));
  optField(rub, v => reqEnum(v, [1, 2, 3, 4], D_RUBRICA, 'rubrica', ctx));
  optField(valVal, v => reqDecimal(v, 15, 2, 'valorValidacao', ctx));
  return ctx.errors;
}

function val5500(line: ParsedLine): ValidationError[] {
  return val5300(line).map(e => ({ ...e, path: e.path.replace('Reg. 5300', 'Reg. 5500') }));
}

function val5600(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5600');
  const prazo = line.fields[1]?.trim();
  optField(prazo, v => reqEnum(v, [1, 2, 3], D_PRAZO, 'prazoMinimo', ctx));
  return ctx.errors;
}

function val9000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9000');
  const f = line.fields;
  optField(f[1]?.trim(), v => reqDecimal(v, 15, 2, 'vlrFrete', ctx));
  optField(f[2]?.trim(), v => reqDecimal(v, 15, 2, 'vlrCombustivel', ctx));
  optField(f[3]?.trim(), v => reqDecimal(v, 15, 2, 'vlrPedagio', ctx));
  return ctx.errors;
}

function val9100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9100');
  const f = line.fields;
  const irrf = f[1]?.trim(); const inss = f[2]?.trim(); const sest = f[3]?.trim();
  if (!irrf) ctx.err('irrf é obrigatório (informe 0.00 se não houver retenção)', 'irrf');
  else reqDecimal(irrf, 13, 2, 'irrf', ctx);
  if (!inss) ctx.err('inss é obrigatório (informe 0.00 se não houver retenção)', 'inss');
  else reqDecimal(inss, 13, 2, 'inss', ctx);
  if (!sest) ctx.err('sestsenat é obrigatório (informe 0.00 se não houver retenção)', 'sestsenat');
  else reqDecimal(sest, 13, 2, 'sestsenat', ctx);
  return ctx.errors;
}

function val9200(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9200');
  const f = line.fields;
  const vlr = f[1]?.trim(); const desc = f[2]?.trim();
  if (!vlr) ctx.err('vlrDespesas é obrigatório (informe 0.00 se não houver despesas)', 'vlrDespesas');
  else reqDecimal(vlr, 15, 2, 'vlrDespesas', ctx);
  if (!desc) ctx.err('descricao é obrigatória', 'descricao');
  else reqLen(desc, 1, 2000, 'descricao', ctx);
  return ctx.errors;
}

function val9300(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9300');
  const f = line.fields;
  const nm = f[1]?.trim(); const vlr = f[2]?.trim(); const rub = f[3]?.trim(); const ds = f[4]?.trim();
  if (!nm) ctx.err('nmDesc é obrigatório', 'nmDesc');
  else reqLen(nm, 1, 2000, 'nmDesc', ctx);
  if (!vlr) ctx.err('vlrDesc é obrigatório', 'vlrDesc');
  else reqDecimal(vlr, 15, 2, 'vlrDesc', ctx);
  if (!rub) ctx.err('rubrica é obrigatória', 'rubrica');
  else reqEnum(rub, [1, 2, 3, 4], D_RUBRICA, 'rubrica', ctx);
  optField(ds, v => reqLen(v, 1, 4000, 'dsDesc', ctx));
  return ctx.errors;
}

function val9400(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9400');
  const f = line.fields;
  const qt = f[1]?.trim(); const vlr = f[2]?.trim();
  if (!qt) ctx.err('quantidadeTotal é obrigatório', 'quantidadeTotal');
  else if (!isDigits(qt) || qt.length > 7) ctx.err(`"${qt}" deve ser um inteiro com no máximo 7 dígitos`, 'quantidadeTotal');
  if (!vlr) ctx.err('valorTotal é obrigatório', 'valorTotal');
  else reqDecimal(vlr, 10, 2, 'valorTotal', ctx);
  return ctx.errors;
}

// ─── Known codes ──────────────────────────────────────────────────────────────

const KNOWN_CODES = new Set([
  '0000', '1000', '1100',
  '2000', '2200', '2300',
  '4000', '4100', '4200', '4300', '4310', '4400', '4500', '4600', '4900',
  '5000', '5100', '5200', '5300', '5400', '5500', '5600',
  '9000', '9100', '9200', '9300', '9400',
]);


// ─── Helpers ──────────────────────────────────────────────────────────────────

function parentErr(line: ParsedLine, parentCode: string): ValidationError {
  return {
    path: `Linha ${line.lineNumber} · Reg. ${line.code}`,
    message: `Registro ${line.code} depende do registro ${parentCode} — insira ${parentCode} antes ou remova-o`,
    lineNumber: line.lineNumber,
  };
}

function structErr(ln: number, msg: string): ValidationError {
  return { path: `Arquivo`, message: msg, lineNumber: ln };
}

// ─── 4000-block state ─────────────────────────────────────────────────────────

interface Block4000 {
  lineNumber: number;
  paymentType: string | null; // '4100' | '4200' | '4900'
  has4600: boolean;
  current4300: boolean;
  current4300Line: number;
  current4310Count: number;
  all4310Issues: string[];
}

function new4000Block(lineNumber: number): Block4000 {
  return { lineNumber, paymentType: null, has4600: false, current4300: false, current4300Line: 0, current4310Count: 0, all4310Issues: [] };
}

function close4000Block(b: Block4000, errors: ValidationError[]) {
  // Close any open 4300
  if (b.current4300 && b.current4310Count === 0)
    errors.push({ path: `Reg. 4310 (filho de 4300 na linha ${b.current4300Line})`, message: 'O registro 4300 deve conter ao menos um registro 4310', lineNumber: b.current4300Line });
  b.all4310Issues.forEach(msg => errors.push({ path: 'Arquivo', message: msg, lineNumber: undefined }));
  // Must have exactly one payment type
  if (!b.paymentType)
    errors.push(structErr(b.lineNumber, `Reg. 4000 (linha ${b.lineNumber}): deve conter exatamente um dos registros de pagamento: 4100 (automático), 4200 (manual) ou 4900 (imediato)`));
}

// ─── 5000-block state ─────────────────────────────────────────────────────────

interface Block5000 {
  lineNumber: number;
  subType: string | null;
}

function new5000Block(lineNumber: number): Block5000 {
  return { lineNumber, subType: null };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function validateRetificacaoTxt(content: string): ValidationResult {
  if (!content.trim())
    return { valid: false, errors: [], parseError: 'O conteúdo do arquivo TXT está vazio', otCount: 0 };

  const rawLines = content.split(/\r?\n/);
  const lines: ParsedLine[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (raw.trim() === '') continue;
    const fields = raw.split(';');
    lines.push({ lineNumber: i + 1, code: fields[0].trim(), fields });
  }

  if (lines.length === 0)
    return { valid: false, errors: [], parseError: 'O arquivo não contém registros válidos', otCount: 0 };

  const errors: ValidationError[] = [];

  // ── Espaços em todos os campos ─────────────────────────────────────────────
  for (const line of lines) errors.push(...checkWhitespace(line));

  // ── 0000 deve ser o primeiro ───────────────────────────────────────────────
  const firstLine = lines[0];
  if (firstLine.code !== '0000') {
    errors.push({ path: `Linha ${firstLine.lineNumber} · Reg. ${firstLine.code}`, message: 'O primeiro registro do arquivo deve ser 0000 (Cabeçalho)', lineNumber: firstLine.lineNumber });
  } else {
    errors.push(...val0000(firstLine));
  }

  // ── Estado global ──────────────────────────────────────────────────────────
  let has1000 = false;
  let has1100 = false;
  let has9000 = false;
  let has2000 = false;
  let tipoOperacao: number | null = null; // 1=Lotação, 2=Fracionado, 3=TAC Agregado
  let has2200 = false;
  let has2300 = false;

  let current4000: Block4000 | null = null;
  let current5000: Block5000 | null = null;

  function closeCurrent4000() {
    if (current4000) { close4000Block(current4000, errors); current4000 = null; }
  }
  function closeCurrent5000() { current5000 = null; }
  function closeAll() { closeCurrent4000(); closeCurrent5000(); }

  // ── Processamento linha a linha ────────────────────────────────────────────
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const code = line.code;

    if (!KNOWN_CODES.has(code)) {
      errors.push({ path: `Linha ${line.lineNumber} · Reg. ${code}`, message: `Código de registro desconhecido: "${code}"`, lineNumber: line.lineNumber });
      continue;
    }

    if (code === '0000') {
      errors.push({ path: `Linha ${line.lineNumber} · Reg. 0000`, message: 'O registro 0000 deve aparecer somente uma vez, como primeiro registro', lineNumber: line.lineNumber });
      continue;
    }

    switch (code) {

      // ── 1000 ────────────────────────────────────────────────────────────────
      case '1000':
        if (has1000) { errors.push({ path: `Linha ${line.lineNumber} · Reg. 1000`, message: 'O registro 1000 deve aparecer somente uma vez', lineNumber: line.lineNumber }); }
        else { has1000 = true; errors.push(...val1000(line)); }
        break;

      // ── 1100 ────────────────────────────────────────────────────────────────
      case '1100':
        if (!has1000) errors.push(parentErr(line, '1000'));
        if (has1100) { errors.push({ path: `Linha ${line.lineNumber} · Reg. 1100`, message: 'O registro 1100 deve aparecer somente uma vez', lineNumber: line.lineNumber }); }
        else { has1100 = true; errors.push(...val1100(line)); }
        break;

      // ── 9000 (filho de 1100) ────────────────────────────────────────────────
      case '9000':
        if (!has1100) errors.push(parentErr(line, '1100'));
        if (has9000) { errors.push({ path: `Linha ${line.lineNumber} · Reg. 9000`, message: 'O registro 9000 deve aparecer no máximo uma vez', lineNumber: line.lineNumber }); }
        else { has9000 = true; errors.push(...val9000(line)); }
        break;

      case '9100':
        if (!has9000) errors.push(parentErr(line, '9000'));
        else errors.push(...val9100(line));
        break;
      case '9200':
        if (!has9000) errors.push(parentErr(line, '9000'));
        else errors.push(...val9200(line));
        break;
      case '9300':
        if (!has9000) errors.push(parentErr(line, '9000'));
        else errors.push(...val9300(line));
        break;
      case '9400':
        if (!has9000) errors.push(parentErr(line, '9000'));
        else errors.push(...val9400(line));
        break;

      // ── 2000 ────────────────────────────────────────────────────────────────
      case '2000':
        if (!has1100) errors.push(parentErr(line, '1100'));
        if (has2000) { errors.push({ path: `Linha ${line.lineNumber} · Reg. 2000`, message: 'O registro 2000 deve aparecer no máximo uma vez', lineNumber: line.lineNumber }); }
        else {
          has2000 = true;
          errors.push(...val2000(line));
          tipoOperacao = parseInt(line.fields[1]?.trim() ?? '', 10) || null;
        }
        break;

      // ── 2200 — proibido para Lotação ────────────────────────────────────────
      case '2200':
        if (!has2000) errors.push(parentErr(line, '2000'));
        else if (tipoOperacao === 1)
          errors.push({ path: `Linha ${line.lineNumber} · Reg. 2200`, message: '[RN-R01] O registro 2200 (Validade) é proibido para Carga Lotação (tipoOperação=1). Permitido apenas para Fracionado (2) e TAC Agregado (3)', lineNumber: line.lineNumber });
        else if (has2200)
          errors.push({ path: `Linha ${line.lineNumber} · Reg. 2200`, message: 'O registro 2200 deve aparecer no máximo uma vez', lineNumber: line.lineNumber });
        else { has2200 = true; errors.push(...val2200(line)); }
        break;

      // ── 2300 — proibido para Lotação ────────────────────────────────────────
      case '2300':
        if (!has2000) errors.push(parentErr(line, '2000'));
        else if (tipoOperacao === 1)
          errors.push({ path: `Linha ${line.lineNumber} · Reg. 2300`, message: '[RN-R01] O registro 2300 (Carga) é proibido para Carga Lotação (tipoOperação=1). Permitido apenas para Fracionado (2) e TAC Agregado (3)', lineNumber: line.lineNumber });
        else if (has2300)
          errors.push({ path: `Linha ${line.lineNumber} · Reg. 2300`, message: 'O registro 2300 deve aparecer no máximo uma vez', lineNumber: line.lineNumber });
        else { has2300 = true; errors.push(...val2300(line)); }
        break;

      // ── 4000 ────────────────────────────────────────────────────────────────
      case '4000':
        if (!has1100) errors.push(parentErr(line, '1100'));
        closeCurrent4000();
        closeCurrent5000();
        current4000 = new4000Block(line.lineNumber);
        errors.push(...val4000(line));
        break;

      // ── 4100 / 4200 / 4900 — pagamentos (exclusivos) ────────────────────────
      case '4100':
      case '4200':
      case '4900': {
        if (!current4000) { errors.push(parentErr(line, '4000')); break; }
        if (current4000.paymentType) {
          errors.push({ path: `Linha ${line.lineNumber} · Reg. ${code}`, message: `[RN-R02] Os registros 4100 (automático), 4200 (manual) e 4900 (imediato) são mutuamente exclusivos — já foi informado ${current4000.paymentType}`, lineNumber: line.lineNumber });
        } else {
          current4000.paymentType = code;
          if (code === '4100') errors.push(...val4100(line));
          else if (code === '4200') errors.push(...val4200(line));
          // 4900 has no fields
        }
        break;
      }

      // ── 4300 + 4310 ─────────────────────────────────────────────────────────
      case '4300':
        if (!current4000) { errors.push(parentErr(line, '4000')); break; }
        // Close previous 4300 if any
        if (current4000.current4300 && current4000.current4310Count === 0)
          current4000.all4310Issues.push(`Reg. 4300 (linha ${current4000.current4300Line}): deve conter ao menos um registro 4310`);
        current4000.current4300 = true;
        current4000.current4300Line = line.lineNumber;
        current4000.current4310Count = 0;
        errors.push(...val4300(line));
        break;

      case '4310':
        if (!current4000 || !current4000.current4300) { errors.push(parentErr(line, '4300')); break; }
        current4000.current4310Count++;
        errors.push(...val4310(line));
        break;

      // ── 4400 / 4500 ─────────────────────────────────────────────────────────
      case '4400':
        if (!current4000) { errors.push(parentErr(line, '4000')); break; }
        errors.push(...val4400(line));
        break;
      case '4500':
        if (!current4000) { errors.push(parentErr(line, '4000')); break; }
        errors.push(...val4500(line));
        break;

      // ── 4600 ─────────────────────────────────────────────────────────────────
      case '4600':
        if (!current4000) { errors.push(parentErr(line, '4000')); break; }
        if (current4000.has4600)
          errors.push({ path: `Linha ${line.lineNumber} · Reg. 4600`, message: 'O registro 4600 deve aparecer no máximo uma vez por parcela (4000)', lineNumber: line.lineNumber });
        else { current4000.has4600 = true; errors.push(...val4600(line)); }
        break;

      // ── 5000 ────────────────────────────────────────────────────────────────
      case '5000':
        if (!has1100) errors.push(parentErr(line, '1100'));
        closeCurrent4000();
        closeCurrent5000();
        current5000 = new5000Block(line.lineNumber);
        errors.push(...val5000(line));
        break;

      // ── 5100–5600 (sub-tipos exclusivos de 5000) ─────────────────────────────
      case '5100':
      case '5200':
      case '5300':
      case '5400':
      case '5500':
      case '5600': {
        if (!current5000) { errors.push(parentErr(line, '5000')); break; }
        if (current5000.subType) {
          errors.push({ path: `Linha ${line.lineNumber} · Reg. ${code}`, message: `[RN-R03] Os registros 5100–5600 são mutuamente exclusivos por parcela (5000) — já foi informado ${current5000.subType}`, lineNumber: line.lineNumber });
        } else {
          current5000.subType = code;
          if (code === '5100') errors.push(...val5100(line));
          else if (code === '5200') errors.push(...val5200(line));
          else if (code === '5300') errors.push(...val5300(line));
          else if (code === '5400') errors.push(...val5400(line));
          else if (code === '5500') errors.push(...val5500(line));
          else if (code === '5600') errors.push(...val5600(line));
        }
        break;
      }
    }
  }

  // ── Fechar blocos abertos ──────────────────────────────────────────────────
  closeAll();

  // ── Validações pós-leitura ─────────────────────────────────────────────────
  if (!has1000) errors.push({ path: 'Arquivo', message: 'Registro 1000 (Alteração) é obrigatório', lineNumber: undefined });
  if (has1000 && !has1100) errors.push({ path: 'Arquivo', message: 'Registro 1100 (Autorização CIOT) é obrigatório quando 1000 está presente', lineNumber: undefined });

  return { valid: errors.length === 0, errors, otCount: errors.length === 0 ? 1 : 0 };
}
