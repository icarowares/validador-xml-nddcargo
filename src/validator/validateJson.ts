import type { ValidationError, ValidationResult } from './types';
import { CODIGOS_SH } from '../data/codigoSH';
import { TIPO_CARGA_LISTA } from '../data/codigoTipoCarga';
import { VALID_ATIVIDADE_PRINCIPAL } from '../data/atividadePrincipal';
import { VALID_FORMA_CONSTITUICAO } from '../data/formaConstituicao';

// ─── codigoSH válidos (alimentado via src/data/codigoSH.ts) ──────────────────
const VALID_CODIGO_SH_JSON = new Set(CODIGOS_SH.map(e => e.codigo));

// ─── Enum descriptions (inline help) ─────────────────────────────────────────

const D_TIPO_OPERACAO = '1 – Lotação (Frota Própria), 2 – Fracionado, 3 – TAC-Agregado';
const D_GER_PGTO_FIN  = '1 – Conta digital NDD Cargo, 2 – Conta corrente (externo), 3 – Conta poupança (externo), 4 – Conta pagamento (externo), 5 – Outros (externo), 6 – PIX via NDD Cargo';
const D_TIPO_TRANSP   = '1 – TAC (Autônomo / Pessoa Física), 2 – ETC (Empresa), 3 – CTC (Empresa)';
const D_TIPO_RATEIO   = '1 – Primeira, 2 – Última, 3 – Todas, 4 – Não reter, 5 – Todas com proporção de impostos';
const D_TIPO_PGTO     = '1 – À vista, 2 – A prazo, 3 – Outros';
const D_FINALIDADE    = '1 – Adiantamento, 2 – Saldo';
const D_TIPO_PAGAMENTO = '1 – PIX, 2 – TED ou outros tipos de transferência';
const D_TIPO_CHAVE    = '1 – CPF/CNPJ, 2 – Celular, 3 – E-mail, 4 – Chave aleatória, 5 – Outro';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Obj = Record<string, unknown>;
type Errors = ValidationError[];

function e(errors: Errors, path: string, message: string): void {
  errors.push({ path, message });
}

function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isDigits(v: unknown): boolean {
  return typeof v === 'string' && /^\d+$/.test(v);
}
function isEmail(v: unknown): boolean {
  return typeof v === 'string' && /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(v);
}

// ─── CPF / CNPJ com dígito verificador ────────────────────────────────────────

function validCPF(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(.)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let s = 0;
    for (let i = 0; i < len; i++) s += +cpf[i] * (len + 1 - i);
    const r = (s * 10) % 11;
    return r >= 10 ? 0 : r;
  };
  return calc(9) === +cpf[9] && calc(10) === +cpf[10];
}

function validCNPJ(cnpj: string): boolean {
  if (!/^\d{14}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const w = len === 12
      ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
      : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let s = 0;
    for (let i = 0; i < len; i++) s += +cnpj[i] * w[i];
    const r = s % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === +cnpj[12] && calc(13) === +cnpj[13];
}
function isDate(v: unknown): boolean {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);
}
function isDateOrDatetime(v: unknown): boolean {
  return typeof v === 'string' &&
    (/^\d{4}-\d{2}-\d{2}$/.test(v) || /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v));
}
function isNum(v: unknown): v is number { return typeof v === 'number' && isFinite(v); }
function isCpfCnpj(v: unknown): boolean {
  return typeof v === 'string' && (/^\d{11}$/.test(v) || /^\d{14}$/.test(v));
}
function isTel(v: unknown): boolean { return typeof v === 'string' && /^\d{10,11}$/.test(v); }

// ─── Field validators ─────────────────────────────────────────────────────────

const ERR_EMPTY = 'Não pode ser uma string vazia; omita o campo ou use null';
const ERR_EMPTY_REQ = 'Campo obrigatório não pode ser uma string vazia';

function reqStr(o: Obj, f: string, base: string, min: number, max: number, errs: Errors): void {
  const v = o[f];
  const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (v === '') { e(errs, p, ERR_EMPTY_REQ); return; }
  if (typeof v !== 'string') { e(errs, p, 'Deve ser uma string'); return; }
  if (v.length < min || v.length > max) e(errs, p, `Deve ter entre ${min} e ${max} caractere(s) (possui ${v.length})`);
}
function optStr(o: Obj, f: string, base: string, min: number, max: number, errs: Errors): void {
  const v = o[f];
  if (v === undefined || v === null) return;
  const p = `${base}.${f}`;
  if (v === '') { e(errs, p, ERR_EMPTY); return; }
  if (typeof v !== 'string') { e(errs, p, 'Deve ser uma string'); return; }
  if (v.length < min || v.length > max) e(errs, p, `Deve ter entre ${min} e ${max} caractere(s) (possui ${v.length})`);
}
const ERR_NUMERO_END = 'Deve conter apenas caracteres numéricos. Caso o endereço não possua número, informe "0"';
function reqNumeroEnd(o: Obj, f: string, base: string, min: number, max: number, errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (v === '') { e(errs, p, ERR_EMPTY_REQ); return; }
  if (typeof v !== 'string') { e(errs, p, 'Deve ser uma string'); return; }
  if (!isDigits(v)) { e(errs, p, ERR_NUMERO_END); return; }
  if (v.length < min || v.length > max) e(errs, p, `Deve ter entre ${min} e ${max} caractere(s) (possui ${v.length})`);
}
function optNumeroEnd(o: Obj, f: string, base: string, min: number, max: number, errs: Errors): void {
  const v = o[f];
  if (v === undefined || v === null) return;
  const p = `${base}.${f}`;
  if (v === '') { e(errs, p, ERR_EMPTY); return; }
  if (typeof v !== 'string') { e(errs, p, 'Deve ser uma string'); return; }
  if (!isDigits(v)) { e(errs, p, ERR_NUMERO_END); return; }
  if (v.length < min || v.length > max) e(errs, p, `Deve ter entre ${min} e ${max} caractere(s) (possui ${v.length})`);
}
function reqDigits(o: Obj, f: string, base: string, len: number, errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (v === '') { e(errs, p, ERR_EMPTY_REQ); return; }
  if (!isDigits(v) || (v as string).length !== len) e(errs, p, `Deve conter exatamente ${len} dígito(s) (recebido: "${v}")`);
}
function optDigits(o: Obj, f: string, base: string, len: number, errs: Errors): void {
  const v = o[f];
  if (v === undefined || v === null) return;
  const p = `${base}.${f}`;
  if (v === '') { e(errs, p, ERR_EMPTY); return; }
  if (!isDigits(v) || (v as string).length !== len) e(errs, p, `Deve conter exatamente ${len} dígito(s) (recebido: "${v}")`);
}
function reqCpfCnpj(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (v === '') { e(errs, p, ERR_EMPTY_REQ); return; }
  if (!isCpfCnpj(v)) e(errs, p, `Deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ) (recebido: "${v}")`);
}
function optCpfCnpj(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f];
  if (v === undefined || v === null) return;
  const p = `${base}.${f}`;
  if (v === '') { e(errs, p, ERR_EMPTY); return; }
  if (!isCpfCnpj(v)) e(errs, p, `Deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ) (recebido: "${v}")`);
}
function reqDate(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (v === '') { e(errs, p, ERR_EMPTY_REQ); return; }
  if (!isDate(v)) e(errs, p, `Deve estar no formato AAAA-MM-DD (recebido: "${v}")`);
}
function optDate(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f];
  if (v === undefined || v === null) return;
  const p = `${base}.${f}`;
  if (v === '') { e(errs, p, ERR_EMPTY); return; }
  if (!isDate(v)) e(errs, p, `Deve estar no formato AAAA-MM-DD (recebido: "${v}")`);
}
function reqDecimal(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (!isNum(v)) e(errs, p, `Deve ser um número decimal (recebido: "${v}")`);
}
function optDecimal(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f]; if (v === undefined || v === null) return;
  if (!isNum(v)) e(errs, `${base}.${f}`, `Deve ser um número decimal (recebido: "${v}")`);
}
function reqNum(o: Obj, f: string, base: string, allowed: number[], errs: Errors, descs?: string): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (!isNum(v) || !allowed.includes(v as number)) {
    const suffix = descs ? `. Valores aceitos: ${descs}` : `; permitidos: ${allowed.join(', ')}`;
    e(errs, p, `Valor inválido "${v}"${suffix}`);
  }
}
function optNum(o: Obj, f: string, base: string, allowed: number[], errs: Errors, descs?: string): void {
  const v = o[f]; if (v === undefined || v === null) return;
  if (!isNum(v) || !allowed.includes(v as number)) {
    const suffix = descs ? `. Valores aceitos: ${descs}` : `; permitidos: ${allowed.join(', ')}`;
    e(errs, `${base}.${f}`, `Valor inválido "${v}"${suffix}`);
  }
}
function reqBool(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (typeof v !== 'boolean') e(errs, p, `Deve ser true ou false (recebido: "${v}")`);
}
function reqTel(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (v === '') { e(errs, p, ERR_EMPTY_REQ); return; }
  if (!isTel(v)) e(errs, p, `Deve ter 10 ou 11 dígitos numéricos (recebido: "${v}")`);
}
function optTel(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f];
  if (v === undefined || v === null) return;
  const p = `${base}.${f}`;
  if (v === '') { e(errs, p, ERR_EMPTY); return; }
  if (!isTel(v)) e(errs, p, `Deve ter 10 ou 11 dígitos numéricos (recebido: "${v}")`);
}
function optEmail(o: Obj, f: string, base: string, errs: Errors): void {
  const v = o[f];
  if (v === undefined || v === null) return;
  const p = `${base}.${f}`;
  if (v === '') { e(errs, p, ERR_EMPTY); return; }
  if (!isEmail(v)) e(errs, p, `Endereço de e-mail inválido: "${v}"`);
}

// ─── UF válidas ───────────────────────────────────────────────────────────────

const UFS_BR = new Set([
  'AC','AL','AM','AP','BA','CE','DF','ES','GO',
  'MA','MG','MS','MT','PA','PB','PE','PI','PR',
  'RJ','RN','RO','RR','RS','SC','SE','SP','TO',
]);

function valUF(uf: unknown, path: string, errs: Errors): void {
  if (uf === undefined || uf === null) { e(errs, path, 'Campo obrigatório não informado'); return; }
  if (uf === '') { e(errs, path, ERR_EMPTY_REQ); return; }
  if (typeof uf !== 'string' || !UFS_BR.has(uf))
    e(errs, path, `UF inválida: "${uf}". Informe a sigla de um estado brasileiro válido (ex: SP, RJ, MG)`);
}

// ─── Address helpers ──────────────────────────────────────────────────────────

// Endereço com codigoMunicipio + CEP (remetente/destinatário)
function validateEnderecoMunicipio(raw: unknown, path: string, errs: Errors): void {
  if (!isObj(raw)) { e(errs, path, 'Deve ser um objeto'); return; }
  valUF(raw['UF'], `${path}.UF`, errs);
  reqDigits(raw, 'codigoMunicipio', path, 7, errs);
  reqStr(raw, 'bairro', path, 1, 255, errs);
  reqStr(raw, 'logradouro', path, 1, 255, errs);
  reqNumeroEnd(raw, 'numero', path, 1, 60, errs);
  reqDigits(raw, 'CEP', path, 8, errs);
  optStr(raw, 'complemento', path, 1, 255, errs);
  const lat = raw['latitude'], lon = raw['longitude'];
  const hasLat = lat !== undefined && lat !== null;
  const hasLon = lon !== undefined && lon !== null;
  if (hasLat || hasLon) {
    if (!hasLat) e(errs, `${path}.latitude`, 'Deve ser informada em conjunto com longitude');
    if (!hasLon) e(errs, `${path}.longitude`, 'Deve ser informada em conjunto com latitude');
    if (hasLat && !isNum(lat)) e(errs, `${path}.latitude`, 'Deve ser um número');
    if (hasLon && !isNum(lon)) e(errs, `${path}.longitude`, 'Deve ser um número');
  }
}

// Endereço com cidade (transportador/condutor/sócio)
function validateEnderecoCidade(raw: unknown, path: string, errs: Errors): void {
  if (!isObj(raw)) { e(errs, path, 'Deve ser um objeto'); return; }
  valUF(raw['UF'], `${path}.UF`, errs);
  reqStr(raw, 'cidade', path, 1, 100, errs);
  reqStr(raw, 'bairro', path, 1, 255, errs);
  reqStr(raw, 'logradouro', path, 1, 255, errs);
  optNumeroEnd(raw, 'numero', path, 1, 8, errs);
  const cep = raw['CEP'];
  if (cep !== undefined && cep !== null) {
    if (cep === '') e(errs, `${path}.CEP`, ERR_EMPTY);
    else if (!isDigits(cep) || (cep as string).length !== 8) e(errs, `${path}.CEP`, `Deve ter exatamente 8 dígitos (recebido: "${cep}")`);
  }
  optStr(raw, 'complemento', path, 1, 255, errs);
}

// ─── Section validators ───────────────────────────────────────────────────────

function validateIde(raw: unknown, errs: Errors): number | null {
  const path = 'ide';
  if (!isObj(raw)) { e(errs, path, 'Campo obrigatório não informado'); return null; }
  optStr(raw, 'tms', path, 1, 20, errs);
  reqDigits(raw, 'cnpj', path, 14, errs);
  reqNum(raw, 'tipoOperacao', path, [1, 2, 3], errs, D_TIPO_OPERACAO);
  reqStr(raw, 'numero', path, 1, 9, errs);
  reqStr(raw, 'serie', path, 1, 4, errs);
  reqStr(raw, 'ptEmissor', path, 1, 30, errs);
  optDate(raw, 'dtInicio', path, errs);
  optDate(raw, 'dtFim', path, errs);
  optStr(raw, 'contrato', path, 1, 50, errs);
  optNum(raw, 'gerPgtoFin', path, [1, 2, 3, 4, 5, 6], errs, D_GER_PGTO_FIN);

  const tipo = isNum(raw['tipoOperacao']) ? (raw['tipoOperacao'] as number) : null;
  if (tipo === 1) {
    reqBool(raw, 'altoDesempenho', path, errs);
    reqBool(raw, 'retornoVazio', path, errs);
    reqBool(raw, 'composicaoVeicular', path, errs);
    if (!raw['dtInicio']) e(errs, `${path}.dtInicio`, 'Obrigatório para carga lotação (tipoOperacao=1)');
  }
  if (tipo === 2) {
    if (!raw['dtInicio']) e(errs, `${path}.dtInicio`, 'Obrigatório para carga fracionada (tipoOperacao=2)');
  }
  // Regra: dtInicio não deve ser informado em TACagregado
  if (tipo === 3 && raw['dtInicio'] !== undefined && raw['dtInicio'] !== null)
    e(errs, `${path}.dtInicio`,
      'A data de início da viagem não deve ser informada em operações TAC-Agregado (tipoOperacao=3)');

  // Regra: dtFim >= dtInicio (quando ambos informados)
  const dtIni = raw['dtInicio'];
  const dtFim = raw['dtFim'];
  if (typeof dtIni === 'string' && typeof dtFim === 'string' && isDate(dtIni) && isDate(dtFim)) {
    const d1 = new Date(dtIni);
    const d2 = new Date(dtFim);
    if (d2 < d1)
      e(errs, `${path}.dtFim`,
        'A data prevista para término da viagem deve ser maior ou igual à data de início da viagem');
  }

  return tipo;
}

function validateCarga(raw: unknown, tipo: number | null, errs: Errors): void {
  const path = 'carga';
  if (!isObj(raw)) {
    e(errs, path, 'Campo obrigatório não informado'); return;
  }

  // Campos obrigatórios apenas para tipoOperacao 1 e 2
  if (tipo !== 3) {
    reqDigits(raw, 'codigoSH', path, 4, errs);

    // Regra: codigoSH deve existir na tabela (ativado quando lista for preenchida)
    if (VALID_CODIGO_SH_JSON.size > 0) {
      const sh = raw['codigoSH'];
      if (typeof sh === 'string' && sh.length === 4 && !VALID_CODIGO_SH_JSON.has(sh))
        errs.push({
          path: `${path}.codigoSH`,
          message: `O código da natureza da carga "${sh}" não existe na tabela de codigoSH`,
          link: { url: '/#/codigos-sh', label: 'Consultar tabela de codigoSH' },
        });
    }

    const qtd = raw['quantidade'];
    if (qtd === undefined || qtd === null) e(errs, `${path}.quantidade`, 'Campo obrigatório não informado');
    else if (!isNum(qtd) || (qtd as number) <= 0) e(errs, `${path}.quantidade`, 'Deve ser um número maior que zero');
    else if ((qtd as number) >= 9_999_999.99) e(errs, `${path}.quantidade`, 'Peso da carga deve ser menor que 9999999.99');

    const tipoCarga = raw['CodigoTipoCarga'];
    if (tipoCarga === undefined || tipoCarga === null) e(errs, `${path}.CodigoTipoCarga`, 'Campo obrigatório não informado');
    else if (!isNum(tipoCarga) || !Number.isInteger(tipoCarga as number) || (tipoCarga as number) < 1 || (tipoCarga as number) > 12)
      e(errs, `${path}.CodigoTipoCarga`,
        `O código de tipo de carga "${tipoCarga}" é inválido. Valores aceitos: ${TIPO_CARGA_LISTA}`);

    const dist = raw['distanciaPercorrida'];
    if (dist === undefined || dist === null) e(errs, `${path}.distanciaPercorrida`, 'Campo obrigatório para tipoOperacao 1 ou 2');
    else if (!isNum(dist) || (dist as number) <= 0) e(errs, `${path}.distanciaPercorrida`, 'Deve ser um número maior que zero');
  }

  if (tipo === 2) {
    const frac = raw['ContratantesCargaFrac'];
    if (!Array.isArray(frac) || frac.length === 0) {
      e(errs, `${path}.ContratantesCargaFrac`, 'Obrigatório para carga fracionada (tipoOperacao=2)');
    } else {
      frac.forEach((item, i) => {
        const fp = `${path}.ContratantesCargaFrac[${i}]`;
        const cpfCnpj = isObj(item) ? item['cpfCnpj'] : item;
        if (!isCpfCnpj(cpfCnpj)) {
          e(errs, fp, `Deve ter 11 (CPF) ou 14 (CNPJ) dígitos`);
        } else {
          const s = String(cpfCnpj);
          // RN-43: dígito verificador
          if (s.length === 11 && !validCPF(s))
            e(errs, fp, `[RN-43] CPF "${s}" possui dígito verificador inválido`);
          else if (s.length === 14 && !validCNPJ(s))
            e(errs, fp, `[RN-43] CNPJ "${s}" possui dígito verificador inválido`);
        }
      });
    }
  }

  // remetente
  if (!isObj(raw['remetente'])) {
    e(errs, `${path}.remetente`, 'Campo obrigatório não informado');
  } else {
    const rem = raw['remetente'] as Obj;
    reqCpfCnpj(rem, 'cpfCnpj', `${path}.remetente`, errs);
    reqStr(rem, 'nome', `${path}.remetente`, 1, 255, errs);
    if (!isObj(rem['endereco'])) e(errs, `${path}.remetente.endereco`, 'Campo obrigatório não informado');
    else validateEnderecoMunicipio(rem['endereco'], `${path}.remetente.endereco`, errs);
  }

  // destinatario — obrigatório apenas para tipoOperacao 1 e 2
  if (!isObj(raw['destinatario'])) {
    if (tipo !== 3) e(errs, `${path}.destinatario`, 'Obrigatório para tipoOperacao 1 ou 2');
  } else {
    const dest = raw['destinatario'] as Obj;
    reqCpfCnpj(dest, 'cpfCnpj', `${path}.destinatario`, errs);
    reqStr(dest, 'nome', `${path}.destinatario`, 1, 255, errs);
    if (!isObj(dest['endereco'])) e(errs, `${path}.destinatario.endereco`, 'Campo obrigatório não informado');
    else validateEnderecoMunicipio(dest['endereco'], `${path}.destinatario.endereco`, errs);
  }

  // documentosOriginarios (optional)
  const docs = raw['documentosOriginarios'];
  if (Array.isArray(docs)) {
    docs.forEach((doc, i) => {
      const dp = `${path}.documentosOriginarios[${i}]`;
      if (!isObj(doc)) { e(errs, dp, 'Deve ser um objeto'); return; }
      reqStr(doc, 'tipo', dp, 1, 40, errs);
      reqStr(doc, 'numero', dp, 1, 44, errs);
    });
  }
}

function validateTransp(raw: unknown, errs: Errors): void {
  const path = 'transp';
  if (!isObj(raw)) { e(errs, path, 'Campo obrigatório não informado'); return; }
  reqDigits(raw, 'rntrc', path, 9, errs);
  reqCpfCnpj(raw, 'cpfCnpj', path, errs);

  // Resolve comprimento do cpfCnpj para validações cruzadas com cadastro.tipo
  const cpfCnpjVal = raw['cpfCnpj'];
  const isCnpj = typeof cpfCnpjVal === 'string' && cpfCnpjVal.length === 14;
  const isCpf  = typeof cpfCnpjVal === 'string' && cpfCnpjVal.length === 11;

  if (!isObj(raw['cadastro'])) { e(errs, `${path}.cadastro`, 'Campo obrigatório não informado'); return; }
  const c = raw['cadastro'] as Obj;
  const cp = `${path}.cadastro`;

  reqStr(c, 'nomeRazao', cp, 1, 150, errs);
  reqTel(c, 'telefone', cp, errs);
  optEmail(c, 'email', cp, errs);
  reqNum(c, 'tipo', cp, [1, 2, 3], errs, D_TIPO_TRANSP);
  const tipo = isNum(c['tipo']) ? (c['tipo'] as number) : null;

  // Regra: CNPJ (14 dígitos) → cadastro.tipo deve ser 2 (ETC) ou 3 (CTC)
  if (isCnpj && tipo === 1)
    e(errs, `${cp}.tipo`,
      'O "cpfCnpj" informado é um CNPJ (14 dígitos), portanto o tipo do transportador deve ser 2 (ETC) ou 3 (CTC), não 1 (TAC/Pessoa Física)');

  // Regra: CPF (11 dígitos) → cadastro.tipo deve ser 1 (TAC)
  if (isCpf && (tipo === 2 || tipo === 3))
    e(errs, `${cp}.tipo`,
      'O "cpfCnpj" informado é um CPF (11 dígitos), portanto o tipo do transportador deve ser 1 (TAC/Pessoa Física), não 2 (ETC) ou 3 (CTC)');

  if (tipo === 2 || tipo === 3) {
    reqStr(c, 'inscEstadual', cp, 1, 14, errs);
    reqStr(c, 'atividadePrincipal', cp, 1, 2, errs);
    const atPrinc = c['atividadePrincipal'];
    if (typeof atPrinc === 'string' && atPrinc.trim() !== '' && !VALID_ATIVIDADE_PRINCIPAL.has(atPrinc.trim()))
      errs.push({
        path: `${cp}.atividadePrincipal`,
        message: `O código de atividade principal "${atPrinc}" não é uma divisão CNAE válida`,
        link: { url: '/#/atividade-principal', label: 'Consultar tabela de atividadePrincipal' },
      });
    reqStr(c, 'formaConstituicao', cp, 5, 5, errs);
    const formaConst = c['formaConstituicao'];
    if (typeof formaConst === 'string' && formaConst.trim().length === 5 && !VALID_FORMA_CONSTITUICAO.has(formaConst.trim()))
      errs.push({
        path: `${cp}.formaConstituicao`,
        message: `A forma de constituição "${formaConst}" não é uma natureza jurídica válida`,
        link: { url: '/#/forma-constituicao', label: 'Consultar tabela de formaConstituicao' },
      });
    reqDate(c, 'dataConstituicao', cp, errs);
  } else {
    optStr(c, 'inscEstadual', cp, 1, 14, errs);
  }

  if (!isObj(c['endereco'])) e(errs, `${cp}.endereco`, 'Campo obrigatório não informado');
  else {
    validateEnderecoCidade(c['endereco'], `${cp}.endereco`, errs);
    const end = c['endereco'] as Obj;
    reqNumeroEnd(end, 'numero', `${cp}.endereco`, 1, 8, errs);
    if (end['CEP'] === undefined || end['CEP'] === null)
      e(errs, `${cp}.endereco.CEP`, 'Campo obrigatório não informado');
  }

  if (tipo === 1) {
    if (c['dadosPJ'] !== undefined && c['dadosPJ'] !== null)
      e(errs, `${cp}.dadosPJ`, 'Proibido para transportador TAC (tipo=1) — informe apenas dadosPF');
    if (!isObj(c['dadosPF'])) {
      e(errs, `${cp}.dadosPF`, 'Obrigatório para transportador TAC (tipo=1)');
    } else {
      const pf = c['dadosPF'] as Obj;
      const pfp = `${cp}.dadosPF`;
      reqStr(pf, 'identidade', pfp, 1, 20, errs);
      reqStr(pf, 'nomeMae', pfp, 1, 150, errs);
      optStr(pf, 'nomePai', pfp, 1, 150, errs);
      reqDate(pf, 'dataNascimento', pfp, errs);
    }
  }

  if (tipo === 2 || tipo === 3) {
    if (c['dadosPF'] !== undefined && c['dadosPF'] !== null)
      e(errs, `${cp}.dadosPF`, 'Proibido para transportador ETC/CTC (tipo=2 ou 3) — informe apenas dadosPJ');
    const pj = c['dadosPJ'];
    if (!Array.isArray(pj) || pj.length === 0) {
      e(errs, `${cp}.dadosPJ`, 'Obrigatório para transportador ETC/CTC (tipo=2 ou 3)');
    } else {
      pj.forEach((socio, i) => {
        const sp = `${cp}.dadosPJ[${i}]`;
        if (!isObj(socio)) { e(errs, sp, 'Deve ser um objeto'); return; }
        reqDigits(socio, 'cpf', sp, 11, errs);
        reqStr(socio, 'identidade', sp, 1, 20, errs);
        reqStr(socio, 'nomeCompleto', sp, 1, 150, errs);
        reqStr(socio, 'nomeMae', sp, 1, 150, errs);
        optStr(socio, 'nomePai', sp, 1, 150, errs);
        reqDate(socio, 'dataNascimento', sp, errs);
        reqTel(socio, 'telefone', sp, errs);
        optEmail(socio, 'email', sp, errs);
        if (!isObj(socio['endereco'])) e(errs, `${sp}.endereco`, 'Campo obrigatório não informado');
        else validateEnderecoCidade(socio['endereco'], `${sp}.endereco`, errs);
      });
    }
  }
}

function validateCondutores(raw: unknown, errs: Errors): void {
  if (raw === undefined || raw === null) return;
  if (!Array.isArray(raw)) { e(errs, 'condutores', 'Deve ser um array'); return; }
  raw.forEach((cond, i) => {
    const path = `condutores[${i}]`;
    if (!isObj(cond)) { e(errs, path, 'Deve ser um objeto'); return; }
    reqDigits(cond, 'cpf', path, 11, errs);
    reqStr(cond, 'nomeCompleto', path, 1, 150, errs);
    optStr(cond, 'nomeMae', path, 1, 150, errs);
    optStr(cond, 'nomePai', path, 1, 150, errs);
    optDate(cond, 'dataNascimento', path, errs);
    optStr(cond, 'identidade', path, 1, 20, errs);
    optStr(cond, 'CNH', path, 1, 15, errs);
    optDate(cond, 'dataEmissaoCNH', path, errs);
    optDate(cond, 'dataRenovacaoCNH', path, errs);
    optTel(cond, 'telefone', path, errs);
    optDigits(cond, 'RNTRCTransportador', path, 9, errs);
    reqCpfCnpj(cond, 'cpfCnpjTransportador', path, errs);
    if (isObj(cond['endereco'])) validateEnderecoCidade(cond['endereco'], `${path}.endereco`, errs);
  });
}

function validateVeiculos(raw: unknown, errs: Errors): void {
  const path = 'veiculos';
  if (!Array.isArray(raw) || raw.length === 0) { e(errs, path, 'Obrigatório — deve conter ao menos 1 veículo'); return; }
  if (raw.length > 5) e(errs, path, `Máximo de 5 veículos por OT (informado: ${raw.length})`);

  let automotorCount = 0;
  const seenPlacas = new Set<string>();

  raw.forEach((veic, i) => {
    const vp = `${path}[${i}]`;
    if (!isObj(veic)) { e(errs, vp, 'Deve ser um objeto'); return; }

    const placa = veic['placa'];
    if (placa === undefined || placa === null) e(errs, `${vp}.placa`, 'Campo obrigatório não informado');
    else if (placa === '') e(errs, `${vp}.placa`, ERR_EMPTY_REQ);
    else if (typeof placa !== 'string' || placa.length !== 7) e(errs, `${vp}.placa`, `Deve ter exatamente 7 caracteres (recebido: "${placa}")`);
    else if (seenPlacas.has(placa)) e(errs, `${vp}.placa`, `Existe duplicidade de placa na lista informada: "${placa}"`);
    else seenPlacas.add(placa);

    reqDigits(veic, 'RNTRCTransportador', vp, 9, errs);

    const eixos = veic['eixos'];
    if (eixos === undefined || eixos === null) e(errs, `${vp}.eixos`, 'Campo obrigatório não informado');
    else if (!isNum(eixos)) e(errs, `${vp}.eixos`, 'Deve ser um número');

    if (!isObj(veic['cadastro'])) {
      e(errs, `${vp}.cadastro`, 'Campo obrigatório não informado');
    } else {
      const c = veic['cadastro'] as Obj;
      const cp = `${vp}.cadastro`;
      reqStr(c, 'modelo', cp, 1, 100, errs);
      const tipo = c['tipo'];
      if (tipo === undefined || tipo === null) e(errs, `${cp}.tipo`, 'Campo obrigatório não informado');
      else if (!isNum(tipo) || ![1, 2].includes(tipo as number)) e(errs, `${cp}.tipo`, `Deve ser 1 (Tração) ou 2 (Reboque) (recebido: "${tipo}")`);
      if (isNum(tipo) && tipo === 1) automotorCount++;
      // Regra: 999999999 é placeholder para reboque sem RNTRC — proibido para tração
      if (isNum(tipo) && (tipo as number) === 1 && veic['RNTRCTransportador'] === '999999999')
        e(errs, `${vp}.RNTRCTransportador`,
          'O valor "999999999" é reservado exclusivamente para reboques (tipo=2) sem RNTRC. ' +
          'Veículos de tração (tipo=1) devem informar um RNTRC válido');
      // RN-21: eixos válidos por tipo de veículo
      if (isNum(tipo) && isNum(eixos)) {
        if ((tipo as number) === 1 && ![2, 3, 4].includes(eixos as number))
          e(errs, `${vp}.eixos`, `[RN-21] Veículo de tração (tipo=1) deve ter 2, 3 ou 4 eixos (informado: ${eixos})`);
        else if ((tipo as number) === 2 && ![1, 2, 3, 4].includes(eixos as number))
          e(errs, `${vp}.eixos`, `[RN-21] Reboque (tipo=2) deve ter entre 1 e 4 eixos (informado: ${eixos})`);
      }
      optDecimal(c, 'kmLitroModelo', cp, errs);
      optDecimal(c, 'kmLitroVeiculo', cp, errs);
    }
  });

  if (automotorCount === 0) e(errs, path, 'Ao menos um veículo deve ser do tipo automotor (cadastro.tipo=1)');
  if (automotorCount > 1) e(errs, path, 'Apenas um veículo deve ser do tipo automotor (cadastro.tipo=1)');
}

function validateValores(raw: unknown, errs: Errors): void {
  const path = 'valores';
  if (!isObj(raw)) { e(errs, path, 'Campo obrigatório não informado'); return; }

  const vlrFrete = raw['vlrFrete'];
  if (vlrFrete === undefined || vlrFrete === null) e(errs, `${path}.vlrFrete`, 'Campo obrigatório não informado');
  else if (!isNum(vlrFrete) || (vlrFrete as number) <= 0) e(errs, `${path}.vlrFrete`, 'Deve ser um número maior que zero');
  else {
    const frac = String(vlrFrete).split('.')[1];
    if (frac && frac.length > 2) e(errs, `${path}.vlrFrete`, `Máximo de 2 casas decimais permitidas (recebido: "${vlrFrete}")`);
  }

  optDecimal(raw, 'vlrCombustivel', path, errs);
  optDecimal(raw, 'vlrPedagio', path, errs);
  reqNum(raw, 'tipoRateio', path, [1, 2, 3, 4, 5], errs, D_TIPO_RATEIO);

  if (isObj(raw['despesas'])) {
    const d = raw['despesas'] as Obj; const dp = `${path}.despesas`;
    reqDecimal(d, 'vlrDespesas', dp, errs);
    reqStr(d, 'descricao', dp, 1, 2000, errs);
  }

  const descontos = raw['descontos'];
  if (Array.isArray(descontos)) {
    descontos.forEach((desc, i) => {
      const dp = `${path}.descontos[${i}]`;
      if (!isObj(desc)) { e(errs, dp, 'Deve ser um objeto'); return; }
      reqStr(desc, 'nmDesc', dp, 1, 50, errs);
      reqDecimal(desc, 'vlrDesc', dp, errs);
      optStr(desc, 'dsDesc', dp, 1, 255, errs);
    });
  }

  if (isObj(raw['retencoes'])) {
    const r = raw['retencoes'] as Obj; const rp = `${path}.retencoes`;
    reqDecimal(r, 'irrf', rp, errs);
    reqDecimal(r, 'inss', rp, errs);
    reqDecimal(r, 'sestsenat', rp, errs);
  }

  if (isObj(raw['parcelamento'])) {
    const p = raw['parcelamento'] as Obj; const pp = `${path}.parcelamento`;
    const hasRegraERP = p['regraERP'] !== undefined && p['regraERP'] !== null;
    const hasInfo = isObj(p['informacoes']);
    if (!hasRegraERP && !hasInfo) e(errs, pp, 'Deve informar regraERP ou informacoes');
    if (hasRegraERP && hasInfo) e(errs, pp, 'Informe apenas regraERP ou informacoes, não ambos');
    if (hasRegraERP) optStr(p, 'regraERP', pp, 1, 30, errs);
    if (hasInfo) {
      const parcelas = (p['informacoes'] as Obj)['parcelas'];
      if (Array.isArray(parcelas)) {
        parcelas.forEach((parc, i) => {
          const parcPath = `${pp}.informacoes.parcelas[${i}]`;
          if (!isObj(parc)) { e(errs, parcPath, 'Deve ser um objeto'); return; }
          reqStr(parc, 'nome', parcPath, 1, 50, errs);
          reqNum(parc, 'tipoPgto', parcPath, [1, 2, 3], errs, D_TIPO_PGTO);
          reqNum(parc, 'finalidadeParcela', parcPath, [1, 2], errs, D_FINALIDADE);
          const dp = parc['dataPrevisao'];
          if (dp === undefined || dp === null) e(errs, `${parcPath}.dataPrevisao`, 'Campo obrigatório não informado');
          else if (dp === '') e(errs, `${parcPath}.dataPrevisao`, ERR_EMPTY_REQ);
          else if (!isDateOrDatetime(dp)) e(errs, `${parcPath}.dataPrevisao`, `Deve estar no formato AAAA-MM-DD ou AAAA-MM-DD HH:MM:SS`);
          reqDecimal(parc, 'valorAplicado', parcPath, errs);
          optDecimal(parc, 'valorReal', parcPath, errs);
          if (isObj(parc['transferenciaAutomatica'])) {
            reqDigits(parc['transferenciaAutomatica'] as Obj, 'cpfCondutor', `${parcPath}.transferenciaAutomatica`, 11, errs);
          }
          const pDesconto = parc['descontos'];
          if (Array.isArray(pDesconto)) {
            pDesconto.forEach((d, j) => {
              const dPath = `${parcPath}.descontos[${j}]`;
              if (!isObj(d)) { e(errs, dPath, 'Deve ser um objeto'); return; }
              reqStr(d, 'nmDesc', dPath, 1, 50, errs);
              reqDecimal(d, 'vlrDesc', dPath, errs);
              optStr(d, 'dsDesc', dPath, 1, 255, errs);
            });
          }
        });
        // RN-35: soma dos valorAplicado deve igualar vlrFrete
        const vf = raw['vlrFrete'];
        if (isNum(vf) && (vf as number) > 0) {
          const soma = parcelas.reduce((s: number, parc: unknown) => {
            if (!isObj(parc)) return s;
            const v = (parc as Obj)['valorAplicado'];
            return isNum(v) ? s + (v as number) : s;
          }, 0);
          if (Math.abs(soma - (vf as number)) > 0.005)
            e(errs, `${path}.parcelamento`,
              `[RN-35] Soma dos valorAplicado (${soma.toFixed(2)}) difere do vlrFrete (${(vf as number).toFixed(2)})`);
        }
      }
    }
  }

  if (isObj(raw['dadosBancarios'])) {
    const db = raw['dadosBancarios'] as Obj; const dbp = `${path}.dadosBancarios`;
    optNum(db, 'tipoPagamento', dbp, [1, 2], errs, D_TIPO_PAGAMENTO);
    optStr(db, 'codigoInstituicaoFinanceira', dbp, 1, 10, errs);
    optStr(db, 'numeroAgencia', dbp, 1, 10, errs);
    optStr(db, 'digitoConta', dbp, 1, 5, errs);
    optStr(db, 'chavepix', dbp, 1, 77, errs);
    optCpfCnpj(db, 'cpfCnpjFavorecido', dbp, errs);
    optNum(db, 'tipoChave', dbp, [1, 2, 3, 4, 5], errs, D_TIPO_CHAVE);
  }
}

function validateAdicionais(raw: unknown, errs: Errors): void {
  if (raw === undefined || raw === null) return;
  if (!Array.isArray(raw)) { e(errs, 'adicionais', 'Deve ser um array'); return; }
  raw.forEach((item, i) => {
    const path = `adicionais[${i}]`;
    if (!isObj(item)) { e(errs, path, 'Deve ser um objeto'); return; }
    reqStr(item, 'nome', path, 1, 255, errs);
    reqStr(item, 'valor', path, 1, 255, errs);
  });
}

function validateCiotFrotaPropria(raw: unknown, errs: Errors): void {
  if (raw === undefined || raw === null) return;
  const path = 'ciotFrotaPropria';
  if (!isObj(raw)) { e(errs, path, 'Deve ser um objeto'); return; }
  reqCpfCnpj(raw, 'CnpjCpfContratante', path, errs);
  reqDigits(raw, 'RntrcContratante', path, 9, errs);
  reqStr(raw, 'NomeContratante', path, 1, 255, errs);
  if (isObj(raw['endereco'])) {
    const end = raw['endereco'] as Obj; const ep = `${path}.endereco`;
    reqStr(end, 'logradouro', ep, 1, 255, errs);
    reqNumeroEnd(end, 'numero', ep, 1, 10, errs);
    reqStr(end, 'bairro', ep, 1, 255, errs);
    reqStr(end, 'cidade', ep, 1, 100, errs);
    valUF(end['uf'] ?? end['UF'], `${ep}.uf`, errs);
  }
}

function validateRota(raw: unknown, errs: Errors): void {
  if (raw === undefined || raw === null) return;
  const path = 'rota';
  if (!isObj(raw)) { e(errs, path, 'Deve ser um objeto'); return; }

  const municipios = raw['municipios'];
  const ceps       = raw['ceps'];
  const latLong    = raw['latLong'];

  const informed = [municipios, ceps, latLong].filter(v => v !== undefined && v !== null);
  if (informed.length === 0) {
    e(errs, path, 'Deve informar exatamente um dos arrays: "municipios", "ceps" ou "latLong"');
    return;
  }
  if (informed.length > 1)
    e(errs, path, 'Apenas um dos arrays deve ser informado: "municipios", "ceps" ou "latLong"');

  // municipios
  if (municipios !== undefined && municipios !== null) {
    if (!Array.isArray(municipios) || municipios.length < 2) {
      e(errs, `${path}.municipios`, 'Deve ser um array com pelo menos 2 itens (par origem–destino)');
    } else {
      municipios.forEach((m, i) => {
        const mp = `${path}.municipios[${i}]`;
        if (!isObj(m)) { e(errs, mp, 'Deve ser um objeto'); return; }
        const cod = m['codigoIbge'];
        if (cod === undefined || cod === null) e(errs, `${mp}.codigoIbge`, 'Campo obrigatório não informado');
        else if (!isNum(cod) || !Number.isInteger(cod as number) || String(cod).length !== 7)
          e(errs, `${mp}.codigoIbge`, `Deve ser um número inteiro de 7 dígitos (recebido: "${cod}")`);
      });
    }
  }

  // ceps
  if (ceps !== undefined && ceps !== null) {
    if (!Array.isArray(ceps) || ceps.length < 2) {
      e(errs, `${path}.ceps`, 'Deve ser um array com pelo menos 2 itens (par origem–destino)');
    } else {
      ceps.forEach((c, i) => {
        const cp = `${path}.ceps[${i}]`;
        if (!isObj(c)) { e(errs, cp, 'Deve ser um objeto'); return; }
        reqDigits(c, 'cep', cp, 8, errs);
      });
    }
  }

  // latLong
  if (latLong !== undefined && latLong !== null) {
    if (!Array.isArray(latLong) || latLong.length < 2) {
      e(errs, `${path}.latLong`, 'Deve ser um array com pelo menos 2 itens (par origem–destino)');
    } else {
      latLong.forEach((ll, i) => {
        const lp = `${path}.latLong[${i}]`;
        if (!isObj(ll)) { e(errs, lp, 'Deve ser um objeto'); return; }
        const lat = ll['latitude'], lon = ll['longitude'];
        if (lat === undefined || lat === null) e(errs, `${lp}.latitude`, 'Campo obrigatório não informado');
        else if (!isNum(lat)) e(errs, `${lp}.latitude`, 'Deve ser um número (Float)');
        if (lon === undefined || lon === null) e(errs, `${lp}.longitude`, 'Campo obrigatório não informado');
        else if (!isNum(lon)) e(errs, `${lp}.longitude`, 'Deve ser um número (Float)');
      });
    }
  }
}

// ─── Single OT ────────────────────────────────────────────────────────────────

function validateSingleOT(payload: Obj, errs: Errors): void {
  const tipo = validateIde(payload['ide'], errs);
  validateCarga(payload['carga'], tipo, errs);
  validateTransp(payload['transp'], errs);
  validateCondutores(payload['condutores'], errs);
  validateVeiculos(payload['veiculos'], errs);
  validateValores(payload['valores'], errs);
  validateAdicionais(payload['adicionais'], errs);
  validateCiotFrotaPropria(payload['ciotFrotaPropria'], errs);
  validateRota(payload['rota'], errs);

  // ── Regras cruzadas ──────────────────────────────────────────────────────

  // Regra: intervalo máximo de 90 dias (tipoOperacao 1 ou 2)
  if ((tipo === 1 || tipo === 2) && isObj(payload['ide'])) {
    const ide = payload['ide'] as Obj;
    const dtIni = ide['dtInicio'];
    const dtFim = ide['dtFim'];
    if (typeof dtIni === 'string' && typeof dtFim === 'string' && isDate(dtIni) && isDate(dtFim)) {
      const d1 = new Date(dtIni);
      const d2 = new Date(dtFim);
      if (d2 >= d1) {
        const diffDays = (d2.getTime() - d1.getTime()) / 86_400_000;
        if (diffDays > 90)
          e(errs, 'ide',
            `O intervalo entre a data de início e a data de fim da viagem não pode ser superior a 90 dias (${Math.round(diffDays)} dias informados)`);
      }
    }
  }

  // Regra: condutores só podem ser informados quando gerPgtoFin = 1 ou 6
  if (isObj(payload['ide'])) {
    const gerPgto = (payload['ide'] as Obj)['gerPgtoFin'];
    const hasCondutores = Array.isArray(payload['condutores']) && payload['condutores'].length > 0;
    if (hasCondutores && gerPgto !== 1 && gerPgto !== 6)
      e(errs, 'condutores',
        `Condutores só podem ser informados quando gerPgtoFin = 1 (Módulo Financeiro NDD) ou 6 (Gestora de Cartão). ` +
        `Valor informado: "${gerPgto ?? 'não informado'}"`);
  }

  // Regra: tipoPagamento em dadosBancarios deve ser omitido quando gerPgtoFin = 2, 3, 4 ou 5
  if (isObj(payload['ide']) && isObj(payload['valores'])) {
    const gpf = (payload['ide'] as Obj)['gerPgtoFin'];
    const valores = payload['valores'] as Obj;
    if (isObj(valores['dadosBancarios'])) {
      const db = valores['dadosBancarios'] as Obj;
      if ([2, 3, 4, 5].includes(gpf as number) && db['tipoPagamento'] !== undefined && db['tipoPagamento'] !== null)
        e(errs, 'valores.dadosBancarios.tipoPagamento',
          `"tipoPagamento" não deve ser informado quando gerPgtoFin=${gpf} — o pagamento é gerenciado externamente ao NDD Cargo`);
    }
  }

  // RN-42: cpfCnpj de ContratantesCargaFrac não pode ser igual ao CNPJ da contratante principal
  if (isObj(payload['ide']) && isObj(payload['carga'])) {
    const ideCnpj = (payload['ide'] as Obj)['cnpj'];
    const frac = (payload['carga'] as Obj)['ContratantesCargaFrac'];
    if (typeof ideCnpj === 'string' && Array.isArray(frac)) {
      frac.forEach((item, i) => {
        const cpfCnpj = isObj(item) ? item['cpfCnpj'] : item;
        if (cpfCnpj === ideCnpj)
          e(errs, `carga.ContratantesCargaFrac[${i}]`,
            `[RN-42] cpfCnpj "${ideCnpj}" não pode ser igual ao CNPJ da contratante principal (ide.cnpj)`);
      });
    }
  }

  // RN-30: chavePix e tipoChave — regras cruzadas com gerPgtoFin=6
  if (isObj(payload['ide']) && isObj(payload['valores'])) {
    const gpf30 = (payload['ide'] as Obj)['gerPgtoFin'];
    const db30  = ((payload['valores'] as Obj)['dadosBancarios']);
    if (isObj(db30)) {
      const tipoChave = (db30 as Obj)['tipoChave'];
      const chavePix  = (db30 as Obj)['chavepix'];
      if (gpf30 === 6) {
        if (isNum(tipoChave) && (tipoChave as number) === 5 && chavePix !== undefined && chavePix !== null)
          e(errs, 'valores.dadosBancarios.chavepix',
            '[RN-30] "chavepix" não deve ser informado quando tipoChave=5 (dados bancários)');
        else if ((!isNum(tipoChave) || (tipoChave as number) !== 5) && (chavePix === undefined || chavePix === null))
          e(errs, 'valores.dadosBancarios.chavepix',
            '[RN-30] "chavepix" é obrigatória quando gerPgtoFin=6 e tipoChave ≠ 5');
      }
      if (gpf30 !== 6 && tipoChave !== undefined && tipoChave !== null)
        e(errs, 'valores.dadosBancarios.tipoChave',
          '[RN-30] "tipoChave" só deve ser informado quando gerPgtoFin=6');
    }
  }

  // RN-31: dados bancários obrigatórios quando gerPgtoFin ∈ {2,3,4} ou tipoChave=5
  if (isObj(payload['ide']) && isObj(payload['valores'])) {
    const gpf31 = (payload['ide'] as Obj)['gerPgtoFin'];
    const db31  = ((payload['valores'] as Obj)['dadosBancarios']);
    if (isObj(db31)) {
      const tipoChave = (db31 as Obj)['tipoChave'];
      if ([2, 3, 4].includes(gpf31 as number) || (isNum(tipoChave) && (tipoChave as number) === 5)) {
        for (const f of ['codigoInstituicaoFinanceira', 'numeroAgencia', 'cpfCnpjFavorecido']) {
          if ((db31 as Obj)[f] === undefined || (db31 as Obj)[f] === null)
            e(errs, `valores.dadosBancarios.${f}`,
              `[RN-31] "${f}" é obrigatório quando gerPgtoFin ∈ {2,3,4} ou tipoChave=5`);
        }
      }
    }
  }

  // Regra: transportador deve ser Pessoa Física (CPF) em TACagregado
  // TODO: regra desativada — possível erro de interpretação da legislação; revisar antes de reativar
  // if (tipo === 3 && isObj(payload['transp'])) {
  //   const transp = payload['transp'] as Obj;
  //   const cpfCnpj = transp['cpfCnpj'];
  //   if (typeof cpfCnpj === 'string' && cpfCnpj.length === 14)
  //     e(errs, 'transp.cpfCnpj',
  //       'O transportador informado deve ser do tipo Pessoa Física (TAC) para operações TAC-Agregado — "cpfCnpj" deve ser um CPF (11 dígitos)');
  // }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function validateJson(content: string): ValidationResult {
  if (!content.trim())
    return { valid: false, errors: [], parseError: 'O conteúdo JSON está vazio', otCount: 0 };

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (ex) {
    return { valid: false, errors: [], parseError: `JSON inválido: ${(ex as Error).message}`, otCount: 0 };
  }

  const errors: ValidationError[] = [];

  if (!isObj(parsed))
    return { valid: false, errors: [], parseError: 'O payload deve ser um objeto JSON com uma única OT', otCount: 0 };

  if (parsed['loteOT'] !== undefined) {
    errors.push({
      path: 'loteOT',
      message: 'Envio via lote não é permitido. Envie apenas a OT diretamente.'
    });
    return { valid: false, errors, otCount: 0 };
  }

  validateSingleOT(parsed, errors);
  return { valid: errors.length === 0, errors, otCount: 1 };
}
