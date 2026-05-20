import type { ValidationError, ValidationResult } from './types';
import { CODIGOS_SH } from '../data/codigoSH';
import { TIPO_CARGA_LISTA } from '../data/codigoTipoCarga';
import { VALID_ATIVIDADE_PRINCIPAL } from '../data/atividadePrincipal';
import { VALID_FORMA_CONSTITUICAO } from '../data/formaConstituicao';

// ─── Field helpers ────────────────────────────────────────────────────────────

function isDigits(v: string): boolean { return /^\d+$/.test(v); }
function isDate(v: string): boolean { return /^\d{4}-\d{2}-\d{2}$/.test(v); }
function isDatetime(v: string): boolean { return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v); }
function isDecimal(v: string): boolean { return /^\d+(\.\d+)?$/.test(v); }
function isBit(v: string): boolean { return v === '0' || v === '1'; }
function isCpfCnpj(v: string): boolean { return /^\d{11}$/.test(v) || /^\d{14}$/.test(v); }
function isTel(v: string): boolean { return /^\d{10,11}$/.test(v); }

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
      errors.push({
        path: `Linha ${lineNumber} · Reg. ${regCode}${label}`,
        message,
        lineNumber,
      });
    },
  };
}

// ─── Per-field validators ─────────────────────────────────────────────────────


function reqDate(v: string, label: string, ctx: Ctx): void {
  if (!isDate(v)) ctx.err(`"${v}" deve estar no formato AAAA-MM-DD`, label);
}

function reqDatetime(v: string, label: string, ctx: Ctx): void {
  if (!isDatetime(v)) ctx.err(`"${v}" deve estar no formato AAAA-MM-DD HH:MM:SS`, label);
}

function reqDecimal(v: string, label: string, ctx: Ctx): void {
  if (!isDecimal(v)) ctx.err(`"${v}" deve ser um número (ex: 1000 ou 1000.50)`, label);
}

function reqBit(v: string, label: string, ctx: Ctx): void {
  if (!isBit(v)) ctx.err(`"${v}" deve ser 0 (falso) ou 1 (verdadeiro)`, label);
}

function reqLen(v: string, min: number, max: number, label: string, ctx: Ctx): void {
  if (v.length < min || v.length > max)
    ctx.err(`"${v}" deve ter entre ${min} e ${max} caractere(s) (possui ${v.length})`, label);
}

function reqExact(v: string, len: number, label: string, ctx: Ctx): void {
  if (!isDigits(v) || v.length !== len)
    ctx.err(`"${v}" deve conter exatamente ${len} dígito(s) numérico(s)`, label);
}

function reqCpfCnpj(v: string, label: string, ctx: Ctx): void {
  if (!isCpfCnpj(v)) ctx.err(`"${v}" deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)`, label);
}

function reqTel(v: string, label: string, ctx: Ctx): void {
  if (!isTel(v)) ctx.err(`"${v}" deve conter 10 ou 11 dígitos numéricos`, label);
}

function reqEnum(v: string, allowed: number[], label: string, ctx: Ctx, descs?: string): void {
  const n = Number(v);
  if (!Number.isInteger(n) || !allowed.includes(n)) {
    const suffix = descs ? `. Valores aceitos: ${descs}` : ` (permitidos: ${allowed.join(', ')})`;
    ctx.err(`"${v}" inválido${suffix}`, label);
  }
}

// ─── Enum descriptions (inline help) ─────────────────────────────────────────

const D_GER_PGTO_FIN  = '1 – Conta digital NDD Cargo, 2 – Conta corrente (externo), 3 – Conta poupança (externo), 4 – Conta pagamento (externo), 5 – Outros (externo), 6 – PIX via NDD Cargo';
const D_GER_PGTO_PED  = '1 – Movimentação via conta digital NDD, 2 – Sem movimentação';
const D_SIM_NAO       = '1 – Sim, 2 – Não';
const D_INTEGRAR_ANTT = '1 – Integra, 2 – Não integra';
const D_PROP_CARGA    = '1 – Remetente, 2 – Destinatário, 3 – Consignatário, 4 – Outro';
const D_OT_TIPO       = '2 – Fracionado, 3 – TAC-Agregado, 4 – Lotação';
const D_TIPO_VEIC     = '1 – Tração, 2 – Reboque';
const D_TIPO_ROTA     = '1 – Rápida, 2 – Curta';
const D_TIPO_RATEIO   = '1 – Primeira, 2 – Última, 3 – Todas, 4 – Não reter, 5 – Todas com proporção de impostos';
const D_EFETIVACAO    = '1 – Posto credenciado, 2 – Centro de triagem, 3 – Contratante, 4 – Confirmação eletrônica';
const D_PRAZO_MIN     = '1 – Não utilizar, 2 – Dia fixo da contratante, 3 – Baseado em data prevista';
const D_CAMPO_REST    = '1 – CNPJ do posto credenciado, 2 – Data';
const D_CRITERIO      = '1 – Igual, 2 – Diferente, 3 – Maior, 4 – Maior ou igual, 5 – Menor, 6 – Menor ou igual';
const D_CONECTOR      = '1 – E, 2 – OU';
const D_FINALIDADE    = '1 – Adiantamento, 2 – Saldo';

function optField(v: string | undefined, fn: (v: string) => void): void {
  if (v !== undefined && v.trim() !== '') fn(v.trim());
}

// ─── Parsed line ──────────────────────────────────────────────────────────────

interface ParsedLine {
  lineNumber: number;
  code: string;
  fields: string[]; // fields[0] = code, fields[1..] = data fields
  raw: string;
}

// ─── Address validators (reused across multiple record codes) ─────────────────

// Validates records 2210 / 2310 / 2510 / 4410 style (with codigoMunicipio + CEP)
function validateEnderecoMunicipio(f: string[], ctx: Ctx): void {
  const uf = f[1];
  const codMun = f[2];
  const bairro = f[3];
  const logr = f[4];
  const num = f[5];
  const cep = f[6];
  const comp = f[7];

  if (!uf || uf.trim() === '') ctx.err('UF é obrigatória', 'UF');
  else if (uf.trim().length !== 2) ctx.err(`UF "${uf}" deve conter exatamente 2 caracteres`, 'UF');

  if (!codMun || codMun.trim() === '') ctx.err('codigoMunicipio é obrigatório', 'codigoMunicipio');
  else reqExact(codMun.trim(), 7, 'codigoMunicipio', ctx);

  if (!bairro || bairro.trim() === '') ctx.err('bairro é obrigatório', 'bairro');
  else reqLen(bairro.trim(), 1, 255, 'bairro', ctx);

  if (!logr || logr.trim() === '') ctx.err('logradouro é obrigatório', 'logradouro');
  else reqLen(logr.trim(), 1, 255, 'logradouro', ctx);

  if (!num || num.trim() === '') ctx.err('numero é obrigatório', 'numero');
  else reqLen(num.trim(), 1, 60, 'numero', ctx);

  if (!cep || cep.trim() === '') ctx.err('CEP é obrigatório', 'CEP');
  else reqExact(cep.trim(), 8, 'CEP', ctx);

  optField(comp, v => reqLen(v, 1, 255, 'complemento', ctx));
}

// Validates records 4011 / 4022 / 4023 / 4032 / 4033 / 4111 style (cidade + optional num/CEP)
function validateEnderecoCidade(f: string[], ctx: Ctx): void {
  const uf = f[1];
  const cidade = f[2];
  const bairro = f[3];
  const logr = f[4];
  const num = f[5];
  const cep = f[6];
  const comp = f[7];

  if (!uf || uf.trim() === '') ctx.err('UF é obrigatória', 'UF');
  else if (uf.trim().length !== 2) ctx.err(`UF "${uf}" deve ter exatamente 2 caracteres`, 'UF');

  if (!cidade || cidade.trim() === '') ctx.err('cidade é obrigatória', 'cidade');
  else reqLen(cidade.trim(), 1, 100, 'cidade', ctx);

  if (!bairro || bairro.trim() === '') ctx.err('bairro é obrigatório', 'bairro');
  else reqLen(bairro.trim(), 1, 255, 'bairro', ctx);

  if (!logr || logr.trim() === '') ctx.err('logradouro é obrigatório', 'logradouro');
  else reqLen(logr.trim(), 1, 255, 'logradouro', ctx);

  optField(num, v => reqLen(v, 1, 8, 'numero', ctx));
  optField(cep, v => reqExact(v, 8, 'CEP', ctx));
  optField(comp, v => reqLen(v, 1, 255, 'complemento', ctx));
}

// ─── Record validators ────────────────────────────────────────────────────────

function val0000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '0000');
  const f = line.fields;
  const token = f[1]; const versao = f[2];

  if (!token || token.trim() === '') ctx.err('token é obrigatório', 'token');
  else reqLen(token.trim(), 1, 24, 'token', ctx);

  if (!versao || versao.trim() === '') ctx.err('versao é obrigatória', 'versao');
  else reqLen(versao.trim(), 1, 7, 'versao', ctx);

  return ctx.errors;
}

function val1000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '1000');
  const f = line.fields;

  const cnpj = f[1]; const numero = f[2]; const serie = f[3]; const ptEmissor = f[4];
  const dtInicio = f[5]; const dtFim = f[6]; const contrato = f[7];
  const gerPgtoFin = f[8]; const gerPgtoPedagio = f[9]; const impAuto = f[10];
  const utilDir = f[11]; const integrarANTT = f[12]; const tms = f[13];

  if (!cnpj || cnpj.trim() === '') ctx.err('cnpj é obrigatório', 'cnpj');
  else reqExact(cnpj.trim(), 14, 'cnpj', ctx);

  if (!numero || numero.trim() === '') ctx.err('numero é obrigatório', 'numero');
  else reqLen(numero.trim(), 1, 9, 'numero', ctx);

  if (!serie || serie.trim() === '') ctx.err('serie é obrigatória', 'serie');
  else reqLen(serie.trim(), 1, 4, 'serie', ctx);

  if (!ptEmissor || ptEmissor.trim() === '') ctx.err('ptEmissor é obrigatório', 'ptEmissor');
  else reqLen(ptEmissor.trim(), 1, 30, 'ptEmissor', ctx);

  optField(dtInicio, v => reqDate(v, 'dtInicio', ctx));
  optField(dtFim, v => reqDate(v, 'dtFim', ctx));
  optField(contrato, v => reqLen(v, 1, 50, 'contrato', ctx));
  optField(gerPgtoFin, v => reqEnum(v, [1, 2, 3, 4, 5, 6], 'gerPgtoFin', ctx, D_GER_PGTO_FIN));
  optField(gerPgtoPedagio, v => reqEnum(v, [1, 2], 'gerPgtoPedagio', ctx, D_GER_PGTO_PED));
  optField(impAuto, v => reqEnum(v, [1, 2], 'impAuto', ctx, D_SIM_NAO));
  optField(utilDir, v => reqEnum(v, [1, 2], 'utilizaDirecionamentoPedagio', ctx, D_SIM_NAO));
  optField(integrarANTT, v => reqEnum(v, [1, 2], 'integrarANTT', ctx, D_INTEGRAR_ANTT));

  if (!tms || tms.trim() === '') ctx.err('tms é obrigatório', 'tms');
  else reqLen(tms.trim(), 1, 20, 'tms', ctx);

  return ctx.errors;
}

function val2000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2000');
  const f = line.fields;

  const tipo = f[1]; const prop = f[2];

  if (!tipo || tipo.trim() === '') ctx.err('tipo é obrigatório', 'tipo');
  else reqEnum(tipo.trim(), [2, 3, 4], 'tipo', ctx, D_OT_TIPO);

  if (!prop || prop.trim() === '') ctx.err('proprietarioCarga é obrigatório', 'proprietarioCarga');
  else reqEnum(prop.trim(), [1, 2, 3, 4], 'proprietarioCarga', ctx, D_PROP_CARGA);

  return ctx.errors;
}

function val2100(line: ParsedLine, otTipo: number | null): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2100');
  const f = line.fields;

  const codigoSH = f[1]; const qtdPeso = f[2]; const codigoTipoCarga = f[3];
  const indAD = f[4]; const indRV = f[5]; const compVeic = f[6];

  if (!codigoSH || codigoSH.trim() === '') ctx.err('codigoSH é obrigatório', 'codigoSH');
  else {
    reqExact(codigoSH.trim(), 4, 'codigoSH', ctx);
    // Regra: codigoSH deve existir na tabela (ativado quando lista for preenchida)
    if (VALID_CODIGO_SH_TXT.size > 0 && !VALID_CODIGO_SH_TXT.has(codigoSH.trim()))
      ctx.errors.push({
        path: `Linha ${ctx.lineNumber} · Reg. 2100 · Campo: codigoSH`,
        message: `O código da natureza da carga "${codigoSH.trim()}" não existe na tabela de codigoSH`,
        lineNumber: ctx.lineNumber,
        link: { url: '/#/codigos-sh', label: 'Consultar tabela de codigoSH' },
      });
  }

  if (!qtdPeso || qtdPeso.trim() === '') ctx.err('quantidade(peso) é obrigatória', 'quantidade(peso)');
  else {
    const v = qtdPeso.trim();
    if (!isDecimal(v)) ctx.err(`"${v}" deve ser um número (ex: 100 ou 100.50)`, 'quantidade(peso)');
    else if (v.length > 9) ctx.err(`"${v}" excede o máximo de 9 caracteres`, 'quantidade(peso)');
    else {
      const peso = parseFloat(v);
      if (peso <= 0) ctx.err('Peso da carga deve ser maior que 0', 'quantidade(peso)');
      else if (peso >= 9_999_999.99) ctx.err('Peso da carga deve ser menor que 9999999.99', 'quantidade(peso)');
    }
  }

  if (otTipo === 2 || otTipo === 4) {
    if (!codigoTipoCarga || codigoTipoCarga.trim() === '')
      ctx.err('CodigoTipoCarga é obrigatório para tipo 2 e 4', 'CodigoTipoCarga');
    else {
      const n = Number(codigoTipoCarga.trim());
      if (!Number.isInteger(n) || n < 1 || n > 12)
        ctx.err(
          `O código de tipo de carga "${codigoTipoCarga.trim()}" é inválido. Valores aceitos: ${TIPO_CARGA_LISTA}`,
          'CodigoTipoCarga',
        );
    }
  } else {
    optField(codigoTipoCarga, v => {
      const n = Number(v);
      if (!Number.isInteger(n) || n < 1 || n > 12)
        ctx.err(
          `O código de tipo de carga "${v}" é inválido. Valores aceitos: ${TIPO_CARGA_LISTA}`,
          'CodigoTipoCarga',
        );
    });
  }

  if (otTipo === 4) {
    if (!indAD || indAD.trim() === '') ctx.err('IndAltoDesempenho é obrigatório para tipo 4', 'IndAltoDesempenho');
    else reqBit(indAD.trim(), 'IndAltoDesempenho', ctx);

    if (!indRV || indRV.trim() === '') ctx.err('IndRetornoVazio é obrigatório para tipo 4', 'IndRetornoVazio');
    else reqBit(indRV.trim(), 'IndRetornoVazio', ctx);

    if (!compVeic || compVeic.trim() === '') ctx.err('ComposicaoVeicular é obrigatória para tipo 4', 'ComposicaoVeicular');
    else reqBit(compVeic.trim(), 'ComposicaoVeicular', ctx);
  } else {
    optField(indAD, v => reqBit(v, 'IndAltoDesempenho', ctx));
    optField(indRV, v => reqBit(v, 'IndRetornoVazio', ctx));
    optField(compVeic, v => reqBit(v, 'ComposicaoVeicular', ctx));
  }

  return ctx.errors;
}

function val2110(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2110');
  const f = line.fields;
  const v = f[1];
  optField(v, s => {
    if (s.length < 11 || s.length > 14 || !isDigits(s))
      ctx.err(`"${s}" deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)`, 'ContratantesCargaFrac');
  });
  return ctx.errors;
}

function val2200(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2200');
  const f = line.fields;
  const cpfcnpj = f[1]; const nome = f[2];

  if (!cpfcnpj || cpfcnpj.trim() === '') ctx.err('cpf|cnpj é obrigatório', 'cpf|cnpj');
  else reqCpfCnpj(cpfcnpj.trim(), 'cpf|cnpj', ctx);

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 255, 'nome', ctx);

  return ctx.errors;
}

function val2210(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2210');
  validateEnderecoMunicipio(line.fields, ctx);
  return ctx.errors;
}

function val2300(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2300');
  const f = line.fields;
  const cpfcnpj = f[1]; const nome = f[2];

  if (!cpfcnpj || cpfcnpj.trim() === '') ctx.err('cpf|cnpj é obrigatório', 'cpf|cnpj');
  else reqCpfCnpj(cpfcnpj.trim(), 'cpf|cnpj', ctx);

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 255, 'nome', ctx);

  return ctx.errors;
}

function val2310(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2310');
  validateEnderecoMunicipio(line.fields, ctx);
  return ctx.errors;
}

function val2400(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2400');
  const f = line.fields;
  const tipo = f[1]; const numero = f[2];

  if (!tipo || tipo.trim() === '') ctx.err('tipo é obrigatório', 'tipo');
  else reqLen(tipo.trim(), 1, 40, 'tipo', ctx);

  if (!numero || numero.trim() === '') ctx.err('numero é obrigatório', 'numero');
  else reqLen(numero.trim(), 1, 44, 'numero', ctx);

  return ctx.errors;
}

function val2500(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2500');
  const f = line.fields;
  const cpfcnpj = f[1]; const nome = f[2];

  if (!cpfcnpj || cpfcnpj.trim() === '') ctx.err('cpf|cnpj é obrigatório', 'cpf|cnpj');
  else reqCpfCnpj(cpfcnpj.trim(), 'cpf|cnpj', ctx);

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 255, 'nome', ctx);

  return ctx.errors;
}

function val2510(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2510');
  validateEnderecoMunicipio(line.fields, ctx);
  return ctx.errors;
}

function val3000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '3000');
  const f = line.fields;
  const nome = f[1]; const contato = f[2];

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 255, 'nome', ctx);

  if (!contato || contato.trim() === '') ctx.err('contato é obrigatório', 'contato');
  else reqLen(contato.trim(), 1, 255, 'contato', ctx);

  return ctx.errors;
}

function val4000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4000');
  const f = line.fields;
  const rntrc = f[1]; const cpfcnpj = f[2]; const gestor = f[3]; const catPedagio = f[4];

  if (!rntrc || rntrc.trim() === '') ctx.err('rntrc é obrigatório', 'rntrc');
  else reqExact(rntrc.trim(), 9, 'rntrc', ctx);

  if (!cpfcnpj || cpfcnpj.trim() === '') ctx.err('cpfTransportador|cnpjTransportador é obrigatório', 'cpfTransportador|cnpjTransportador');
  else reqCpfCnpj(cpfcnpj.trim(), 'cpfTransportador|cnpjTransportador', ctx);

  optField(gestor, v => reqExact(v, 3, 'gestorCartao', ctx));
  optField(catPedagio, v => reqLen(v, 1, 2, 'categoriaPedagio', ctx));

  return ctx.errors;
}

function val4010(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4010');
  const f = line.fields;
  const nomeC = f[1]; const nomeMae = f[2]; const nomePai = f[3];
  const dtNasc = f[4]; const ident = f[5]; const tel = f[6];

  if (!nomeC || nomeC.trim() === '') ctx.err('nomeCompleto é obrigatório', 'nomeCompleto');
  else reqLen(nomeC.trim(), 1, 150, 'nomeCompleto', ctx);

  if (!nomeMae || nomeMae.trim() === '') ctx.err('nomeMae é obrigatório', 'nomeMae');
  else reqLen(nomeMae.trim(), 1, 150, 'nomeMae', ctx);

  optField(nomePai, v => reqLen(v, 1, 150, 'nomePai', ctx));

  if (!dtNasc || dtNasc.trim() === '') ctx.err('dataNascimento é obrigatória', 'dataNascimento');
  else reqDate(dtNasc.trim(), 'dataNascimento', ctx);

  if (!ident || ident.trim() === '') ctx.err('identidade é obrigatória', 'identidade');
  else reqLen(ident.trim(), 1, 20, 'identidade', ctx);

  if (!tel || tel.trim() === '') ctx.err('telefoneCelular é obrigatório', 'telefoneCelular');
  else reqTel(tel.trim(), 'telefoneCelular', ctx);

  return ctx.errors;
}

function val4011(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4011');
  validateEnderecoCidade(line.fields, ctx);
  return ctx.errors;
}

function val4020(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4020');
  const f = line.fields;
  const razao = f[1]; const fantasia = f[2]; const ie = f[3]; const ativ = f[4];
  const forma = f[5]; const dtConst = f[6]; const email = f[7]; const tel = f[8]; const cartao = f[9];

  if (!razao || razao.trim() === '') ctx.err('razaoSocial é obrigatória', 'razaoSocial');
  else reqLen(razao.trim(), 1, 150, 'razaoSocial', ctx);

  if (!fantasia || fantasia.trim() === '') ctx.err('nomeFantasia é obrigatório', 'nomeFantasia');
  else reqLen(fantasia.trim(), 1, 150, 'nomeFantasia', ctx);

  if (!ie || ie.trim() === '') ctx.err('inscricaoEstadual é obrigatória', 'inscricaoEstadual');
  else reqLen(ie.trim(), 1, 14, 'inscricaoEstadual', ctx);

  if (!ativ || ativ.trim() === '') ctx.err('atividadePrincipal é obrigatória', 'atividadePrincipal');
  else {
    reqLen(ativ.trim(), 1, 2, 'atividadePrincipal', ctx);
    if (ativ.trim().length <= 2 && !VALID_ATIVIDADE_PRINCIPAL.has(ativ.trim()))
      ctx.errors.push({
        path: `Linha ${ctx.lineNumber} · Reg. 4020 · Campo: atividadePrincipal`,
        message: `O código de atividade principal "${ativ.trim()}" não é uma divisão CNAE válida`,
        lineNumber: ctx.lineNumber,
        link: { url: '/#/atividade-principal', label: 'Consultar tabela de atividadePrincipal' },
      });
  }

  if (!forma || forma.trim() === '') ctx.err('formaConstituicao é obrigatória', 'formaConstituicao');
  else if (forma.trim().length !== 5) ctx.err(`formaConstituicao "${forma}" deve ter exatamente 5 caracteres (ex: "206-2")`, 'formaConstituicao');
  else if (!VALID_FORMA_CONSTITUICAO.has(forma.trim()))
    ctx.errors.push({
      path: `Linha ${ctx.lineNumber} · Reg. 4020 · Campo: formaConstituicao`,
      message: `A forma de constituição "${forma.trim()}" não é uma natureza jurídica válida`,
      lineNumber: ctx.lineNumber,
      link: { url: '/#/forma-constituicao', label: 'Consultar tabela de formaConstituicao' },
    });

  if (!dtConst || dtConst.trim() === '') ctx.err('dataConstituicao é obrigatória', 'dataConstituicao');
  else reqDate(dtConst.trim(), 'dataConstituicao', ctx);

  optField(email, v => reqLen(v, 1, 255, 'emailTransportador', ctx));

  if (!tel || tel.trim() === '') ctx.err('telefoneTransportador é obrigatório', 'telefoneTransportador');
  else reqTel(tel.trim(), 'telefoneTransportador', ctx);

  optField(cartao, v => reqLen(v, 1, 15, 'cartaoId', ctx));

  return ctx.errors;
}

function val4021(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4021');
  const f = line.fields;
  const cpf = f[1]; const nomeC = f[2]; const nomeMae = f[3]; const nomePai = f[4];
  const ident = f[5]; const dtNasc = f[6]; const email = f[7]; const tel = f[8];

  if (!cpf || cpf.trim() === '') ctx.err('CPF é obrigatório', 'CPF');
  else reqExact(cpf.trim(), 11, 'CPF', ctx);

  if (!nomeC || nomeC.trim() === '') ctx.err('nomeCompleto é obrigatório', 'nomeCompleto');
  else reqLen(nomeC.trim(), 1, 150, 'nomeCompleto', ctx);

  if (!nomeMae || nomeMae.trim() === '') ctx.err('nomeMae é obrigatório', 'nomeMae');
  else reqLen(nomeMae.trim(), 1, 150, 'nomeMae', ctx);

  optField(nomePai, v => reqLen(v, 1, 150, 'nomePai', ctx));

  if (!ident || ident.trim() === '') ctx.err('identidade é obrigatória', 'identidade');
  else reqLen(ident.trim(), 1, 20, 'identidade', ctx);

  if (!dtNasc || dtNasc.trim() === '') ctx.err('dataNascimento é obrigatória', 'dataNascimento');
  else reqDate(dtNasc.trim(), 'dataNascimento', ctx);

  optField(email, v => reqLen(v, 1, 255, 'emailSocio', ctx));

  if (!tel || tel.trim() === '') ctx.err('telefoneSocio é obrigatório', 'telefoneSocio');
  else reqTel(tel.trim(), 'telefoneSocio', ctx);

  return ctx.errors;
}

function val4022(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4022');
  validateEnderecoCidade(line.fields, ctx);
  return ctx.errors;
}

function val4023(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4023');
  validateEnderecoCidade(line.fields, ctx);
  return ctx.errors;
}

// 4030/4031/4032/4033 — CTC mirrors ETC structure
function val4030(line: ParsedLine): ValidationError[] {
  return val4020({ ...line, fields: line.fields }).map(e => ({ ...e, path: e.path.replace('Reg. 4020', 'Reg. 4030') }));
}

function val4031(line: ParsedLine): ValidationError[] {
  return val4021({ ...line, fields: line.fields }).map(e => ({ ...e, path: e.path.replace('Reg. 4021', 'Reg. 4031') }));
}

function val4032(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4032');
  validateEnderecoCidade(line.fields, ctx);
  return ctx.errors;
}

function val4033(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4033');
  validateEnderecoCidade(line.fields, ctx);
  return ctx.errors;
}

function val4100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4100');
  const f = line.fields;
  const cpf = f[1];

  if (!cpf || cpf.trim() === '') ctx.err('cpf é obrigatório', 'cpf');
  else reqExact(cpf.trim(), 11, 'cpf', ctx);

  return ctx.errors;
}

function val4110(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4110');
  const f = line.fields;
  // fields[6],[7] unused (indices 6 and 7); field[9] = celularCondutor per spec (index 9)
  const nomeC = f[1]; const nomeMae = f[2]; const nomePai = f[3];
  const ident = f[4]; const dtNasc = f[5]; const cnh = f[6];
  // f[7] and f[8] skipped (spec uses #6 and #9, indices 6 and 9)
  const celular = f[9];

  if (!nomeC || nomeC.trim() === '') ctx.err('nomeCompleto é obrigatório', 'nomeCompleto');
  else reqLen(nomeC.trim(), 1, 150, 'nomeCompleto', ctx);

  if (!nomeMae || nomeMae.trim() === '') ctx.err('nomeMae é obrigatório', 'nomeMae');
  else reqLen(nomeMae.trim(), 1, 150, 'nomeMae', ctx);

  optField(nomePai, v => reqLen(v, 1, 150, 'nomePai', ctx));

  if (!ident || ident.trim() === '') ctx.err('Identidade é obrigatória', 'Identidade');
  else reqLen(ident.trim(), 1, 20, 'Identidade', ctx);

  if (!dtNasc || dtNasc.trim() === '') ctx.err('dataNascimento é obrigatória', 'dataNascimento');
  else reqDate(dtNasc.trim(), 'dataNascimento', ctx);

  optField(cnh, v => reqLen(v, 1, 15, 'CNH', ctx));

  if (!celular || celular.trim() === '') ctx.err('celularCondutor é obrigatório', 'celularCondutor');
  else reqTel(celular.trim(), 'celularCondutor', ctx);

  return ctx.errors;
}

function val4111(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4111');
  validateEnderecoCidade(line.fields, ctx);
  return ctx.errors;
}

function val4200(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4200');
  const f = line.fields;
  const placa = f[1]; const qtdEixos = f[2];

  if (!placa || placa.trim() === '') ctx.err('placa é obrigatória', 'placa');
  else if (placa.trim().length !== 7) ctx.err(`placa "${placa}" deve ter exatamente 7 caracteres`, 'placa');

  if (!qtdEixos || qtdEixos.trim() === '') ctx.err('qtdEixos é obrigatório', 'qtdEixos');
  else reqLen(qtdEixos.trim(), 1, 4, 'qtdEixos', ctx);

  return ctx.errors;
}

function val4210(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4210');
  const f = line.fields;
  const modelo = f[1]; const tipo = f[3]; const rntrc = f[5];

  if (!modelo || modelo.trim() === '') ctx.err('modelo é obrigatório', 'modelo');
  else reqLen(modelo.trim(), 1, 100, 'modelo', ctx);

  if (!tipo || tipo.trim() === '') ctx.err('tipo é obrigatório', 'tipo');
  else reqEnum(tipo.trim(), [1, 2], 'tipo', ctx, D_TIPO_VEIC);

  if (!rntrc || rntrc.trim() === '') ctx.err('RNTRCTransportador é obrigatório', 'RNTRCTransportador');
  else reqExact(rntrc.trim(), 9, 'RNTRCTransportador', ctx);

  return ctx.errors;
}

function val4300(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4300');
  const f = line.fields;
  const vlrFrete = f[1]; const vlrComb = f[2]; const vlrPedagio = f[3];
  const irrf = f[4]; const inss = f[5]; const sestsenat = f[6]; const tpRateio = f[7];

  if (!vlrFrete || vlrFrete.trim() === '') ctx.err('vlrFrete é obrigatório', 'vlrFrete');
  else {
    reqDecimal(vlrFrete.trim(), 'vlrFrete', ctx);
    const vf = parseFloat(vlrFrete.trim());
    if (isDecimal(vlrFrete.trim()) && vf <= 0)
      ctx.err('O valor do frete deve ser informado e maior que 0', 'vlrFrete');
  }

  optField(vlrComb, v => reqDecimal(v, 'vlrCombustivel', ctx));
  optField(vlrPedagio, v => reqDecimal(v, 'vlrPedagio', ctx));

  if (!irrf || irrf.trim() === '') ctx.err('irrf é obrigatório', 'irrf');
  else reqDecimal(irrf.trim(), 'irrf', ctx);

  if (!inss || inss.trim() === '') ctx.err('inss é obrigatório', 'inss');
  else reqDecimal(inss.trim(), 'inss', ctx);

  if (!sestsenat || sestsenat.trim() === '') ctx.err('sestsenat é obrigatório', 'sestsenat');
  else reqDecimal(sestsenat.trim(), 'sestsenat', ctx);

  if (!tpRateio || tpRateio.trim() === '') ctx.err('tpRateioRetencoes é obrigatório', 'tpRateioRetencoes');
  else reqEnum(tpRateio.trim(), [1, 2, 3, 4, 5], 'tpRateioRetencoes', ctx, D_TIPO_RATEIO);

  return ctx.errors;
}

function val4310(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4310');
  const f = line.fields;
  const nm = f[1]; const vlr = f[2];

  if (!nm || nm.trim() === '') ctx.err('nmDesc é obrigatório', 'nmDesc');
  else reqLen(nm.trim(), 1, 50, 'nmDesc', ctx);

  if (!vlr || vlr.trim() === '') ctx.err('vlrDesc é obrigatório', 'vlrDesc');
  else reqDecimal(vlr.trim(), 'vlrDesc', ctx);

  return ctx.errors;
}

function val4320(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4320');
  const f = line.fields;
  const vlr = f[1]; const desc = f[2];

  if (!vlr || vlr.trim() === '') ctx.err('vlrDespesas é obrigatório', 'vlrDespesas');
  else reqDecimal(vlr.trim(), 'vlrDespesas', ctx);

  if (!desc || desc.trim() === '') ctx.err('descricao é obrigatória', 'descricao');
  else reqLen(desc.trim(), 1, 2000, 'descricao', ctx);

  return ctx.errors;
}

function val4330(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4330');
  const f = line.fields;
  const qtd = f[1]; const vlr = f[2];

  if (!qtd || qtd.trim() === '') ctx.err('quantidadeTotal é obrigatória', 'quantidadeTotal');
  else reqLen(qtd.trim(), 1, 7, 'quantidadeTotal', ctx);

  if (!vlr || vlr.trim() === '') ctx.err('valorTotal é obrigatório', 'valorTotal');
  else reqDecimal(vlr.trim(), 'valorTotal', ctx);

  return ctx.errors;
}

function val4400(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4400');
  const f = line.fields;
  const cpfcnpj = f[1]; const nome = f[2];

  if (!cpfcnpj || cpfcnpj.trim() === '') ctx.err('cpf|cnpj é obrigatório', 'cpf|cnpj');
  else reqCpfCnpj(cpfcnpj.trim(), 'cpf|cnpj', ctx);

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 255, 'nome', ctx);

  return ctx.errors;
}

function val4410(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4410');
  validateEnderecoMunicipio(line.fields, ctx);
  return ctx.errors;
}

function val4500(line: ParsedLine, otTipo: number | null): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4500');
  const f = line.fields;
  const rotaERP = f[1]; const totalKM = f[2];

  if (!rotaERP || rotaERP.trim() === '') ctx.err('rotaERP é obrigatório', 'rotaERP');
  else reqLen(rotaERP.trim(), 1, 30, 'rotaERP', ctx);

  if (otTipo === 2 || otTipo === 4) {
    if (!totalKM || totalKM.trim() === '') ctx.err('totalKM é obrigatório para tipo 2 e 4', 'totalKM');
    else {
      const v = totalKM.trim();
      if (!isDecimal(v)) ctx.err(`"${v}" deve ser um número`, 'totalKM');
      else if (parseFloat(v) <= 0) ctx.err(`totalKM deve ser maior que zero`, 'totalKM');
      else if (v.length > 8) ctx.err(`totalKM excede 8 caracteres`, 'totalKM');
    }
  } else {
    optField(totalKM, v => {
      if (!isDecimal(v)) ctx.err(`"${v}" deve ser um número`, 'totalKM');
    });
  }

  return ctx.errors;
}

function val4600(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4600');
  const f = line.fields;
  const nome = f[1]; const tipoRota = f[2]; const utilRot = f[3]; const notif = f[5];

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 50, 'nome', ctx);

  optField(tipoRota, v => reqEnum(v, [1, 2], 'tipoRotaPadrao', ctx, D_TIPO_ROTA));
  optField(utilRot, v => reqEnum(v, [1, 2], 'utilizarRoteirizador', ctx, D_SIM_NAO));
  optField(notif, v => reqEnum(v, [1, 2], 'notificarRespContratante', ctx, D_SIM_NAO));

  return ctx.errors;
}

function val4610(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4610');
  const f = line.fields;
  const v = f[1];

  if (!v || v.trim() === '') ctx.err('codigoIBGE|cep é obrigatório', 'codigoIBGE|cep');
  else {
    const s = v.trim();
    if (!isDigits(s) || (s.length !== 7 && s.length !== 8))
      ctx.err(`"${s}" deve ter 7 dígitos (IBGE) ou 8 dígitos (CEP)`, 'codigoIBGE|cep');
  }

  return ctx.errors;
}

function val4620(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4620');
  const f = line.fields;
  const nome = f[1]; const email = f[2];

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 50, 'nome', ctx);

  if (!email || email.trim() === '') ctx.err('email é obrigatório', 'email');
  else reqLen(email.trim(), 1, 255, 'email', ctx);

  return ctx.errors;
}

function val4630(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4630');
  const f = line.fields;
  const cnp = f[1]; const nome = f[2]; const vlr = f[3];

  if (!cnp || cnp.trim() === '') ctx.err('cnp é obrigatório', 'cnp');
  else reqLen(cnp.trim(), 1, 17, 'cnp', ctx);

  if (!nome || nome.trim() === '') ctx.err('nomePraca é obrigatório', 'nomePraca');
  else reqLen(nome.trim(), 1, 255, 'nomePraca', ctx);

  if (!vlr || vlr.trim() === '') ctx.err('valorPraca é obrigatório', 'valorPraca');
  else reqDecimal(vlr.trim(), 'valorPraca', ctx);

  return ctx.errors;
}

function val4700(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4700');
  const f = line.fields;
  const pedagioERP = f[1]; const cpf = f[2]; const valor = f[3]; const cat = f[4];

  if (!pedagioERP || pedagioERP.trim() === '') ctx.err('pedagioERP é obrigatório', 'pedagioERP');
  else reqLen(pedagioERP.trim(), 1, 30, 'pedagioERP', ctx);

  if (!cpf || cpf.trim() === '') ctx.err('cpf é obrigatório', 'cpf');
  else reqExact(cpf.trim(), 11, 'cpf', ctx);

  optField(valor, v => reqDecimal(v, 'valor', ctx));

  if (!cat || cat.trim() === '') ctx.err('categoriaPedagio é obrigatória', 'categoriaPedagio');
  else reqLen(cat.trim(), 1, 2, 'categoriaPedagio', ctx);

  return ctx.errors;
}

function val4710(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4710');
  const f = line.fields;
  const rota = f[1];

  if (!rota || rota.trim() === '') ctx.err('rotaERP é obrigatório', 'rotaERP');
  else reqLen(rota.trim(), 1, 30, 'rotaERP', ctx);

  return ctx.errors;
}

function val4720(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4720');
  const f = line.fields;
  const nome = f[1];

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 50, 'nome', ctx);

  return ctx.errors;
}

function val4721(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4721');
  const f = line.fields;
  const v = f[1];

  if (!v || v.trim() === '') ctx.err('codigoIBGE|cep é obrigatório', 'codigoIBGE|cep');
  else {
    const s = v.trim();
    if (!isDigits(s) || (s.length !== 7 && s.length !== 8))
      ctx.err(`"${s}" deve ter 7 dígitos (IBGE) ou 8 dígitos (CEP)`, 'codigoIBGE|cep');
  }

  return ctx.errors;
}

function val5000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5000');
  const f = line.fields;
  const entrega = f[1];
  optField(entrega, v => reqExact(v, 14, 'entrega', ctx));
  return ctx.errors;
}

function val5100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5100');
  const f = line.fields;
  const tipo = f[1]; const obr = f[2];

  if (!tipo || tipo.trim() === '') ctx.err('tipo é obrigatório', 'tipo');
  else reqLen(tipo.trim(), 1, 255, 'tipo', ctx);

  optField(obr, v => reqEnum(v, [1, 2], 'obrigatorio', ctx, D_SIM_NAO));

  return ctx.errors;
}

function val5110(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '5110');
  const f = line.fields;
  const desc = f[1];

  if (!desc || desc.trim() === '') ctx.err('descrição é obrigatória', 'descrição');
  else reqLen(desc.trim(), 1, 255, 'descrição', ctx);

  return ctx.errors;
}

function val6000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '6000');
  const f = line.fields;
  const nome = f[1]; const valor = f[2];

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 255, 'nome', ctx);

  if (!valor || valor.trim() === '') ctx.err('valor é obrigatório', 'valor');
  else reqLen(valor.trim(), 1, 2000, 'valor', ctx);

  return ctx.errors;
}

function val7000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '7000');
  const f = line.fields;
  const cpfcnpj = f[1];

  if (!cpfcnpj || cpfcnpj.trim() === '') ctx.err('cpf|cnpj é obrigatório', 'cpf|cnpj');
  else reqCpfCnpj(cpfcnpj.trim(), 'cpf|cnpj', ctx);

  return ctx.errors;
}

function val8000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '8000');
  const f = line.fields;
  const reg = f[1];

  if (!reg || reg.trim() === '') ctx.err('regERP é obrigatório', 'regERP');
  else reqLen(reg.trim(), 1, 30, 'regERP', ctx);

  return ctx.errors;
}

function val9000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9000');
  const f = line.fields;
  const nome = f[1]; const vlrApl = f[2]; const vlrReal = f[3];
  const prazo = f[4]; const conf = f[5];

  if (!nome || nome.trim() === '') ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome.trim(), 1, 50, 'nome', ctx);

  if (!vlrApl || vlrApl.trim() === '') ctx.err('valorAplicado é obrigatório', 'valorAplicado');
  else reqDecimal(vlrApl.trim(), 'valorAplicado', ctx);

  optField(vlrReal, v => reqDecimal(v, 'valorReal', ctx));
  optField(prazo, v => reqEnum(v, [1, 2, 3], 'prazoMinimo', ctx, D_PRAZO_MIN));
  optField(conf, v => reqEnum(v, [1, 2], 'confirmarPgto', ctx, D_SIM_NAO));

  return ctx.errors;
}

function val9100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9100');
  const f = line.fields;
  const dh = f[1];

  if (!dh || dh.trim() === '') ctx.err('dataHora é obrigatória', 'dataHora');
  else reqDatetime(dh.trim(), 'dataHora', ctx);

  return ctx.errors;
}

function val9200(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9200');
  const f = line.fields;
  const dtPrev = f[1]; const efet = f[2]; const cnpjPosto = f[3];

  if (!dtPrev || dtPrev.trim() === '') ctx.err('dataPrevisao é obrigatória', 'dataPrevisao');
  else reqDate(dtPrev.trim(), 'dataPrevisao', ctx);

  optField(efet, v => reqEnum(v, [1, 2, 3, 4], 'efetivacao', ctx, D_EFETIVACAO));
  optField(cnpjPosto, v => reqExact(v, 14, 'cnpjPostoCredenciado', ctx));

  return ctx.errors;
}

function val9300(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9300');
  const f = line.fields;
  const tipo = f[1];

  if (!tipo || tipo.trim() === '') ctx.err('tipo é obrigatório', 'tipo');
  else reqLen(tipo.trim(), 1, 255, 'tipo', ctx);

  return ctx.errors;
}

function val9310(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9310');
  const f = line.fields;
  const desc = f[1];

  if (!desc || desc.trim() === '') ctx.err('descrição é obrigatória', 'descrição');
  else reqLen(desc.trim(), 1, 255, 'descrição', ctx);

  return ctx.errors;
}

function val9400(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9400');
  const f = line.fields;
  const nm = f[1]; const vlr = f[2];

  if (!nm || nm.trim() === '') ctx.err('nmDesc é obrigatório', 'nmDesc');
  else reqLen(nm.trim(), 1, 50, 'nmDesc', ctx);

  if (!vlr || vlr.trim() === '') ctx.err('vlrDesc é obrigatório', 'vlrDesc');
  else reqDecimal(vlr.trim(), 'vlrDesc', ctx);

  return ctx.errors;
}

function val9500(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9500');
  const f = line.fields;
  const campo = f[1]; const valor = f[2]; const criterio = f[3]; const conector = f[4];

  if (!campo || campo.trim() === '') ctx.err('campo é obrigatório', 'campo');
  else reqEnum(campo.trim(), [1, 2], 'campo', ctx, D_CAMPO_REST);

  if (!valor || valor.trim() === '') ctx.err('valor é obrigatório', 'valor');
  else reqLen(valor.trim(), 1, 15, 'valor', ctx);

  optField(criterio, v => reqEnum(v, [1, 2, 3, 4, 5, 6], 'criterio', ctx, D_CRITERIO));
  optField(conector, v => reqEnum(v, [1, 2], 'conector', ctx, D_CONECTOR));

  return ctx.errors;
}

function val9600(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9600');
  const f = line.fields;
  const qtd = f[1]; const unid = f[2]; const dtPrev = f[3];

  if (!qtd || qtd.trim() === '') ctx.err('quantidade é obrigatória', 'quantidade');
  else reqDecimal(qtd.trim(), 'quantidade', ctx);

  if (!unid || unid.trim() === '') ctx.err('unidadeMedida é obrigatória', 'unidadeMedida');
  else reqLen(unid.trim(), 1, 20, 'unidadeMedida', ctx);

  if (!dtPrev || dtPrev.trim() === '') ctx.err('dataPrevisaoEntrega é obrigatória', 'dataPrevisaoEntrega');
  else reqDate(dtPrev.trim(), 'dataPrevisaoEntrega', ctx);

  return ctx.errors;
}

function val9700(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '9700');
  const f = line.fields;
  const cpf = f[1]; const finalidade = f[2];

  if (!cpf || cpf.trim() === '') ctx.err('cpfCondutor é obrigatório', 'cpfCondutor');
  else reqExact(cpf.trim(), 11, 'cpfCondutor', ctx);

  if (!finalidade || finalidade.trim() === '') ctx.err('finalidadeParcela é obrigatória', 'finalidadeParcela');
  else reqEnum(finalidade.trim(), [1, 2], 'finalidadeParcela', ctx, D_FINALIDADE);

  return ctx.errors;
}

// ─── codigoSH válidos (alimentado via src/data/codigoSH.ts) ──────────────────
const VALID_CODIGO_SH_TXT = new Set(CODIGOS_SH.map(e => e.codigo));

// ─── Known codes set ─────────────────────────────────────────────────────────

const KNOWN_CODES = new Set([
  '0000', '1000',
  '2000', '2100', '2110', '2200', '2210', '2300', '2310', '2400', '2500', '2510',
  '3000',
  '4000', '4010', '4011', '4020', '4021', '4022', '4023',
  '4030', '4031', '4032', '4033',
  '4100', '4110', '4111',
  '4200', '4210', '4300', '4310', '4320', '4330',
  '4400', '4410', '4500', '4600', '4610', '4620', '4630',
  '4700', '4710', '4720', '4721',
  '5000', '5100', '5110',
  '6000', '7000', '8000',
  '9000', '9100', '9200', '9300', '9310', '9400', '9500', '9600', '9700', '9800',
]);

// ─── OT state tracker ────────────────────────────────────────────────────────

interface OTState {
  tipo: number | null;
  has2000: boolean;
  has2100: boolean;
  has2200: boolean;
  has2210: boolean;
  has2300: boolean;
  has2310: boolean;
  has2500: boolean;
  has2510: boolean;
  has4000: boolean;
  has4010: boolean;
  has4011: boolean;
  has4020: boolean;
  has4030: boolean;
  has4021: boolean;
  has4022: boolean;
  has4023: boolean;
  has4031: boolean;
  has4032: boolean;
  has4033: boolean;
  has4300: boolean;
  has4330: boolean;
  has4400: boolean;
  has4410: boolean;
  has4500: boolean;
  has4700: boolean;
  has4710: boolean;
  has4600: boolean;
  has4720: boolean;
  has4721Count: number;
  has4610Count: number;
  has4100: boolean;
  has4110: boolean;
  veiculoCount: number;
  has8000: boolean;
  has9000: boolean;
  has9100: boolean;
  has9200: boolean;
  has9800: boolean;
  has5000: boolean;
  has5100: boolean;
  has5110: boolean;
  has9300: boolean;
  has9310: boolean;
  // line numbers for structural errors
  line1000: number;
  // campos para regras de negócio cruzadas
  dtInicio: string | null;
  dtFim: string | null;
  tracaoCount: number;
  seenPlacas: Set<string>;
}

function newOTState(line1000: number): OTState {
  return {
    tipo: null, has2000: false, has2100: false, has2200: false, has2210: false,
    has2300: false, has2310: false, has2500: false, has2510: false,
    has4000: false, has4010: false, has4011: false, has4020: false, has4030: false,
    has4021: false, has4022: false, has4023: false,
    has4031: false, has4032: false, has4033: false,
    has4300: false, has4330: false,
    has4400: false, has4410: false, has4500: false,
    has4700: false, has4710: false, has4600: false, has4720: false, has4721Count: 0, has4610Count: 0,
    has4100: false, has4110: false,
    veiculoCount: 0, has8000: false, has9000: false, has9100: false, has9200: false,
    has9800: false, has5000: false, has5100: false, has5110: false,
    has9300: false, has9310: false,
    line1000,
    dtInicio: null, dtFim: null, tracaoCount: 0, seenPlacas: new Set(),
  };
}

function finishOT(ot: OTState, otIndex: number, errors: ValidationError[]): void {
  const ref = (msg: string) =>
    errors.push({ path: `OT[${otIndex}] · (iniciada na linha ${ot.line1000})`, message: msg, lineNumber: ot.line1000 });

  if (!ot.has2000) ref('Registro 2000 (Tipo da OT) é obrigatório');
  if (!ot.has2200) ref('Registro 2200 (Remetente) é obrigatório');
  if (ot.has2200 && !ot.has2210) ref('Registro 2210 (Endereço do Remetente) é obrigatório quando 2200 está presente');
  if (!ot.has4000) ref('Registro 4000 (Transporte) é obrigatório');
  if (!ot.has4300) ref('Registro 4300 (Valores) é obrigatório');
  if (!ot.has4330) ref('Registro 4330 (Tarifas) é obrigatório');
  if (ot.veiculoCount === 0) ref('Ao menos um registro 4200 (Veículo) é obrigatório');
  if (ot.veiculoCount > 5) ref(`Máximo de 5 veículos (4200) por OT; encontrado(s) ${ot.veiculoCount}`);

  const tipo = ot.tipo;
  if (tipo === 2 || tipo === 4) {
    if (!ot.has2100) ref(`Registro 2100 (Cargas) é obrigatório para tipo ${tipo}`);
    if (!ot.has4500) ref(`Registro 4500 (Rota) é obrigatório para tipo ${tipo}`);
  }
  if (tipo === 3 && ot.has2100) ref('Registro 2100 não deve ser informado para tipo 3 (TAC-Agregado)');
  if (tipo === 4 && !ot.has2300) ref('Registro 2300 (Destinatário) é obrigatório para tipo 4 (Lotação)');
  if (tipo === 3 && ot.has2300) ref('Registro 2300 não deve ser informado para tipo 3 (TAC-Agregado)');
  if (ot.has2300 && !ot.has2310) ref('Registro 2310 (Endereço do Destinatário) é obrigatório quando 2300 está presente');
  if (ot.has2500 && !ot.has2510) ref('Registro 2510 (Endereço do Consignatário) é obrigatório quando 2500 está presente');

  // Transportador: 4010 XOR 4020 XOR 4030
  const transpCount = [ot.has4010, ot.has4020, ot.has4030].filter(Boolean).length;
  if (transpCount > 1) ref('Apenas um tipo de transportador deve ser informado: 4010 (TAC), 4020 (ETC) ou 4030 (CTC)');
  if (ot.has4010 && !ot.has4011) ref('Registro 4011 (Endereço TAC) é obrigatório quando 4010 está presente');
  if (ot.has4020 && !ot.has4021) ref('Registro 4021 (Sócio ETC) é obrigatório quando 4020 está presente');
  if (ot.has4020 && !ot.has4023) ref('Registro 4023 (Endereço ETC) é obrigatório quando 4020 está presente');
  if (ot.has4021 && !ot.has4022) ref('Registro 4022 (Endereço Sócio ETC) é obrigatório quando 4021 está presente');
  if (ot.has4030 && !ot.has4031) ref('Registro 4031 (Sócio CTC) é obrigatório quando 4030 está presente');
  if (ot.has4030 && !ot.has4033) ref('Registro 4033 (Endereço CTC) é obrigatório quando 4030 está presente');
  if (ot.has4031 && !ot.has4032) ref('Registro 4032 (Endereço Sócio CTC) é obrigatório quando 4031 está presente');

  if (ot.has4400 && !ot.has4410) ref('Registro 4410 (Endereço Subcontratado) é obrigatório quando 4400 está presente');
  if (ot.has4700 && !ot.has4710) ref('Registro 4710 (Rota Direcionamento) é obrigatório quando 4700 está presente');

  if (ot.has4600 && ot.has4610Count < 2)
    ref(`Registro 4610 requer ao menos 2 pontos de parada quando 4600 está presente (encontrado(s): ${ot.has4610Count})`);
  if (ot.has4720 && ot.has4721Count < 2)
    ref(`Registro 4721 requer ao menos 2 pontos de parada quando 4720 está presente (encontrado(s): ${ot.has4721Count})`);

  // 8000 XOR 9000
  if (ot.has8000 && ot.has9000) ref('Registros 8000 e 9000 são mutuamente exclusivos — use apenas um');

  // 9100 XOR 9200 (within 9000), 9800 XOR (9100|9200)
  if (ot.has9100 && ot.has9200) ref('Registros 9100 e 9200 são mutuamente exclusivos');
  if (ot.has9800 && (ot.has9100 || ot.has9200)) ref('Registro 9800 é exclusivo com 9100 e 9200 — use apenas um tipo de pagamento');

  if (ot.has5000 && !ot.has5100) ref('Registro 5100 (Documentos) é obrigatório quando 5000 está presente');
  if (ot.has5100 && !ot.has5110) ref('Registro 5110 (Dependência) é obrigatório quando 5100 está presente');
  if (ot.has9300 && !ot.has9310) ref('Registro 9310 (Dependência) é obrigatório quando 9300 está presente');

  // ── Regras de negócio cruzadas ─────────────────────────────────────────────

  // Regra: dtInicio não deve ser informado em TAC-Agregado (tipo=3)
  if (ot.tipo === 3 && ot.dtInicio)
    ref('A data de início da viagem não deve ser informada em operações TAC-Agregado (tipo=3)');

  // Regra: transportador deve ser Pessoa Física (reg. 4010) em TAC-Agregado
  if (ot.tipo === 3 && !ot.has4010 && (ot.has4020 || ot.has4030))
    ref('O transportador informado deve ser do tipo Pessoa Física (TAC — registro 4010) para operações TAC-Agregado (tipo=3)');

  // Regra: dtFim >= dtInicio (quando ambas informadas e válidas)
  if (ot.dtInicio && ot.dtFim && isDate(ot.dtInicio) && isDate(ot.dtFim)) {
    const d1 = new Date(ot.dtInicio);
    const d2 = new Date(ot.dtFim);
    if (d2 < d1) {
      ref('A data prevista para término da viagem deve ser maior ou igual à data de início da viagem');
    } else if (ot.tipo === 2 || ot.tipo === 4) {
      // Regra: intervalo máximo de 90 dias (fracionado=2 ou lotação=4)
      const diffDays = (d2.getTime() - d1.getTime()) / 86_400_000;
      if (diffDays > 90)
        ref(`O intervalo entre a data de início e a data de fim da viagem não pode ser superior a 90 dias (${Math.round(diffDays)} dias informados)`);
    }
  }

  // Regra: ao menos 1 veículo de tração e exatamente 1
  if (ot.veiculoCount > 0) {
    if (ot.tracaoCount === 0)
      ref('É necessário informar ao menos um veículo do tipo Tração (tipo=1 no registro 4210)');
    else if (ot.tracaoCount > 1)
      ref(`Somente um veículo deve ser do tipo Tração (tipo=1 no registro 4210); ${ot.tracaoCount} informados`);
  }
}

function parentErr(line: ParsedLine, parentCode: string): ValidationError {
  return {
    path: `Linha ${line.lineNumber} · Reg. ${line.code}`,
    message: `Registro ${line.code} depende do registro ${parentCode} — insira ${parentCode} antes deste registro ou remova-o`,
    lineNumber: line.lineNumber,
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export function validateTxt(content: string): ValidationResult {
  if (!content.trim())
    return { valid: false, errors: [], parseError: 'O conteúdo do arquivo TXT está vazio', otCount: 0 };

  const rawLines = content.split(/\r?\n/);
  const lines: ParsedLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (raw.trim() === '') continue;
    const fields = raw.split(';');
    const code = fields[0].trim();
    lines.push({ lineNumber: i + 1, code, fields, raw });
  }

  if (lines.length === 0)
    return { valid: false, errors: [], parseError: 'O arquivo não contém registros válidos', otCount: 0 };

  const errors: ValidationError[] = [];

  // 0000 must be the first record
  const firstLine = lines[0];
  if (firstLine.code !== '0000') {
    errors.push({
      path: `Linha ${firstLine.lineNumber} · Reg. ${firstLine.code}`,
      message: 'O primeiro registro do arquivo deve ser 0000 (Cabeçalho)',
      lineNumber: firstLine.lineNumber,
    });
  } else {
    errors.push(...val0000(firstLine));
  }

  let otCount = 0;
  let currentOT: OTState | null = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const code = line.code;

    if (!KNOWN_CODES.has(code)) {
      errors.push({
        path: `Linha ${line.lineNumber} · Reg. ${code}`,
        message: `Código de registro desconhecido: "${code}"`,
        lineNumber: line.lineNumber,
      });
      continue;
    }

    if (code === '0000') {
      errors.push({
        path: `Linha ${line.lineNumber} · Reg. 0000`,
        message: 'O registro 0000 (Cabeçalho) deve aparecer somente uma vez, como primeiro registro',
        lineNumber: line.lineNumber,
      });
      continue;
    }

    if (code === '1000') {
      if (currentOT) {
        finishOT(currentOT, otCount, errors);
      }
      otCount++;
      currentOT = newOTState(line.lineNumber);
      // Capturar datas para regras de negócio cruzadas
      const fi = line.fields;
      currentOT.dtInicio = (fi[5]?.trim()) || null;
      currentOT.dtFim    = (fi[6]?.trim()) || null;
      errors.push(...val1000(line));
      continue;
    }

    // All records below require an active OT (1000 already seen)
    if (!currentOT) {
      errors.push({
        path: `Linha ${line.lineNumber} · Reg. ${code}`,
        message: `Registro ${code} encontrado fora de uma OT — esperava registro 1000 antes deste`,
        lineNumber: line.lineNumber,
      });
      continue;
    }

    switch (code) {
      case '2000':
        currentOT.has2000 = true;
        currentOT.tipo = (() => {
          const v = line.fields[1]?.trim();
          const n = Number(v);
          return Number.isInteger(n) ? n : null;
        })();
        errors.push(...val2000(line));
        break;

      case '2100':
        if (currentOT.tipo === 3) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 2100`,
            message: 'Registro 2100 não deve ser informado para tipo 3 (TAC-Agregado)',
            lineNumber: line.lineNumber,
          });
        }
        currentOT.has2100 = true;
        errors.push(...val2100(line, currentOT.tipo));
        break;

      case '2110':
        if (currentOT.tipo !== 2) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 2110`,
            message: 'Registro 2110 é válido apenas para tipo 2 (Carga fracionada)',
            lineNumber: line.lineNumber,
          });
        }
        errors.push(...val2110(line));
        break;

      case '2200': currentOT.has2200 = true; errors.push(...val2200(line)); break;
      case '2210':
        if (!currentOT.has2200) errors.push(parentErr(line, '2200'));
        currentOT.has2210 = true; errors.push(...val2210(line)); break;
      case '2300': currentOT.has2300 = true; errors.push(...val2300(line)); break;
      case '2310':
        if (!currentOT.has2300) errors.push(parentErr(line, '2300'));
        currentOT.has2310 = true; errors.push(...val2310(line)); break;
      case '2400': errors.push(...val2400(line)); break;
      case '2500': currentOT.has2500 = true; errors.push(...val2500(line)); break;
      case '2510':
        if (!currentOT.has2500) errors.push(parentErr(line, '2500'));
        currentOT.has2510 = true; errors.push(...val2510(line)); break;
      case '3000': errors.push(...val3000(line)); break;
      case '4000': currentOT.has4000 = true; errors.push(...val4000(line)); break;
      case '4010': currentOT.has4010 = true; errors.push(...val4010(line)); break;
      case '4011':
        if (!currentOT.has4010) errors.push(parentErr(line, '4010'));
        currentOT.has4011 = true; errors.push(...val4011(line)); break;
      case '4020': currentOT.has4020 = true; errors.push(...val4020(line)); break;
      case '4021':
        if (!currentOT.has4020) errors.push(parentErr(line, '4020'));
        currentOT.has4021 = true; errors.push(...val4021(line)); break;
      case '4022':
        if (!currentOT.has4021) errors.push(parentErr(line, '4021'));
        currentOT.has4022 = true; errors.push(...val4022(line)); break;
      case '4023':
        if (!currentOT.has4020) errors.push(parentErr(line, '4020'));
        currentOT.has4023 = true; errors.push(...val4023(line)); break;
      case '4030': currentOT.has4030 = true; errors.push(...val4030(line)); break;
      case '4031':
        if (!currentOT.has4030) errors.push(parentErr(line, '4030'));
        currentOT.has4031 = true; errors.push(...val4031(line)); break;
      case '4032':
        if (!currentOT.has4031) errors.push(parentErr(line, '4031'));
        currentOT.has4032 = true; errors.push(...val4032(line)); break;
      case '4033':
        if (!currentOT.has4030) errors.push(parentErr(line, '4030'));
        currentOT.has4033 = true; errors.push(...val4033(line)); break;
      case '4100': currentOT.has4100 = true; errors.push(...val4100(line)); break;
      case '4110':
        if (!currentOT.has4100) errors.push(parentErr(line, '4100'));
        currentOT.has4110 = true; errors.push(...val4110(line)); break;
      case '4111':
        if (!currentOT.has4110) errors.push(parentErr(line, '4110'));
        errors.push(...val4111(line)); break;
      case '4200': {
        currentOT.veiculoCount++;
        // Regra: duplicidade de placa
        const placa4200 = line.fields[1]?.trim() ?? '';
        if (placa4200.length === 7) {
          if (currentOT.seenPlacas.has(placa4200)) {
            errors.push({
              path: `Linha ${line.lineNumber} · Reg. 4200 · Campo: placa`,
              message: `Existe duplicidade de placa na lista informada: "${placa4200}"`,
              lineNumber: line.lineNumber,
            });
          } else {
            currentOT.seenPlacas.add(placa4200);
          }
        }
        errors.push(...val4200(line));
        break;
      }
      case '4210': {
        // Regra: rastrear veículos de tração para validação posterior
        const tipoVeic = parseInt(line.fields[3]?.trim() ?? '', 10);
        if (tipoVeic === 1) currentOT.tracaoCount++;
        errors.push(...val4210(line));
        break;
      }
      case '4300': currentOT.has4300 = true; errors.push(...val4300(line)); break;
      case '4310':
        if (!currentOT.has4300) errors.push(parentErr(line, '4300'));
        errors.push(...val4310(line)); break;
      case '4320':
        if (!currentOT.has4300) errors.push(parentErr(line, '4300'));
        errors.push(...val4320(line)); break;
      case '4330': currentOT.has4330 = true; errors.push(...val4330(line)); break;
      case '4400': currentOT.has4400 = true; errors.push(...val4400(line)); break;
      case '4410':
        if (!currentOT.has4400) errors.push(parentErr(line, '4400'));
        currentOT.has4410 = true; errors.push(...val4410(line)); break;
      case '4500': currentOT.has4500 = true; errors.push(...val4500(line, currentOT.tipo)); break;
      case '4600': currentOT.has4600 = true; errors.push(...val4600(line)); break;
      case '4610':
        if (!currentOT.has4600) errors.push(parentErr(line, '4600'));
        currentOT.has4610Count++; errors.push(...val4610(line)); break;
      case '4620':
        if (!currentOT.has4600) errors.push(parentErr(line, '4600'));
        errors.push(...val4620(line)); break;
      case '4630':
        if (!currentOT.has4600) errors.push(parentErr(line, '4600'));
        errors.push(...val4630(line)); break;
      case '4700': currentOT.has4700 = true; errors.push(...val4700(line)); break;
      case '4710':
        if (!currentOT.has4700) errors.push(parentErr(line, '4700'));
        currentOT.has4710 = true; errors.push(...val4710(line)); break;
      case '4720':
        if (!currentOT.has4700) errors.push(parentErr(line, '4700'));
        currentOT.has4720 = true; errors.push(...val4720(line)); break;
      case '4721':
        if (!currentOT.has4720) errors.push(parentErr(line, '4720'));
        currentOT.has4721Count++; errors.push(...val4721(line)); break;
      case '5000': currentOT.has5000 = true; errors.push(...val5000(line)); break;
      case '5100':
        if (!currentOT.has5000) errors.push(parentErr(line, '5000'));
        currentOT.has5100 = true; errors.push(...val5100(line)); break;
      case '5110':
        if (!currentOT.has5100) errors.push(parentErr(line, '5100'));
        currentOT.has5110 = true; errors.push(...val5110(line)); break;
      case '6000': errors.push(...val6000(line)); break;
      case '7000': errors.push(...val7000(line)); break;
      case '8000': currentOT.has8000 = true; errors.push(...val8000(line)); break;
      case '9000': currentOT.has9000 = true; errors.push(...val9000(line)); break;
      case '9100':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        currentOT.has9100 = true; errors.push(...val9100(line)); break;
      case '9200':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        currentOT.has9200 = true; errors.push(...val9200(line)); break;
      case '9300':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        currentOT.has9300 = true; errors.push(...val9300(line)); break;
      case '9310':
        if (!currentOT.has9300) errors.push(parentErr(line, '9300'));
        currentOT.has9310 = true; errors.push(...val9310(line)); break;
      case '9400':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        errors.push(...val9400(line)); break;
      case '9500':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        errors.push(...val9500(line)); break;
      case '9600':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        errors.push(...val9600(line)); break;
      case '9700':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        errors.push(...val9700(line)); break;
      case '9800':
        if (!currentOT.has9000) errors.push(parentErr(line, '9000'));
        currentOT.has9800 = true; break;
    }
  }

  // close last OT
  if (currentOT) {
    finishOT(currentOT, otCount, errors);
  }

  if (otCount === 0) {
    errors.push({
      path: 'Arquivo',
      message: 'Nenhuma OT encontrada. O arquivo deve conter ao menos um registro 1000',
      lineNumber: undefined,
    });
  }

  return { valid: errors.length === 0, errors, otCount };
}
