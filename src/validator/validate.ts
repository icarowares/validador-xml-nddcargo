import type { ValidationError, ValidationResult } from './types';
import { applyBusinessRules } from './businessRules';
import { VALID_ATIVIDADE_PRINCIPAL } from '../data/atividadePrincipal';
import { VALID_FORMA_CONSTITUICAO } from '../data/formaConstituicao';

// ─── Context ─────────────────────────────────────────────────────────────────

function createCtx() {
  const errors: ValidationError[] = [];
  return {
    errors,
    err(path: string, message: string) {
      errors.push({ path, message });
    },
  };
}
type Ctx = ReturnType<typeof createCtx>;

// ─── DOM Helpers ──────────────────────────────────────────────────────────────

function child(el: Element, name: string): Element | undefined {
  return Array.from(el.children).find(c => c.localName === name);
}

function children(el: Element, name: string): Element[] {
  return Array.from(el.children).filter(c => c.localName === name);
}

function txt(el: Element | undefined): string {
  return el?.textContent?.trim() ?? '';
}

function requireChild(el: Element, name: string, path: string, ctx: Ctx): Element | undefined {
  const found = child(el, name);
  if (!found) ctx.err(path, `Campo obrigatório "${name}" não encontrado`);
  return found;
}

// ─── Validadores de tipos simples ─────────────────────────────────────────────

function valCNPJ(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{14}$/.test(value))
    ctx.err(path, `CNPJ inválido: "${value}". Deve conter exatamente 14 dígitos numéricos`);
}

function valCPF(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{11}$/.test(value))
    ctx.err(path, `CPF inválido: "${value}". Deve conter exatamente 11 dígitos numéricos`);
}

function valCEP(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{8}$/.test(value))
    ctx.err(path, `CEP inválido: "${value}". Deve conter exatamente 8 dígitos numéricos`);
}

function valUF(value: string, path: string, ctx: Ctx) {
  if (!/^[A-Z]{2}$/.test(value))
    ctx.err(path, `UF inválida: "${value}". Deve conter exatamente 2 letras maiúsculas (ex: SP, RJ)`);
}

function valRNTRC(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{9}$/.test(value))
    ctx.err(path, `RNTRC inválido: "${value}". Deve conter exatamente 9 dígitos numéricos`);
}

function valData(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))
    ctx.err(path, `Data inválida: "${value}". Use o formato AAAA-MM-DD (ex: 2024-01-20)`);
}

function valDataHora(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(value))
    ctx.err(path, `Data/hora inválida: "${value}". Use o formato AAAA-MM-DD HH:MM:SS`);
}

function valDecimal(value: string, totalDig: number, fracDig: number, path: string, ctx: Ctx, minExclusive?: number) {
  if (!/^-?[0-9]+(\.[0-9]+)?$/.test(value)) {
    ctx.err(path, `Valor inválido: "${value}". Deve ser um número decimal`);
    return;
  }
  const num = parseFloat(value);
  if (num < 0) { ctx.err(path, `Valor "${value}" não pode ser negativo`); return; }
  if (minExclusive !== undefined && num <= minExclusive) {
    ctx.err(path, `Valor "${value}" deve ser maior que ${minExclusive}`); return;
  }
  const parts = value.split('.');
  const frac = parts[1] ?? '';
  if (frac.length > fracDig)
    ctx.err(path, `Valor "${value}" possui mais de ${fracDig} casa(s) decimal(is)`);
  const intStr = parts[0].replace('-', '');
  if (intStr.length + frac.length > totalDig)
    ctx.err(path, `Valor "${value}" excede o máximo de ${totalDig} dígitos`);
}

function valValor(value: string, path: string, ctx: Ctx) { valDecimal(value, 17, 2, path, ctx); }
function valValor12v2(value: string, path: string, ctx: Ctx) { valDecimal(value, 14, 2, path, ctx); }
function valQtd9v2(value: string, path: string, ctx: Ctx) { valDecimal(value, 11, 2, path, ctx); }
function valKmLitro4v2(value: string, path: string, ctx: Ctx) { valDecimal(value, 6, 2, path, ctx); }

function valPlaca(value: string, path: string, ctx: Ctx) {
  if (value.length !== 7)
    ctx.err(path, `Placa inválida: "${value}". Deve conter exatamente 7 caracteres`);
}

function valCpfCnpj(value: string, path: string, ctx: Ctx) {
  if (!/^([0-9]{11}|[0-9]{14})$/.test(value))
    ctx.err(path, `CPF/CNPJ inválido: "${value}". Deve conter 11 dígitos (CPF) ou 14 dígitos (CNPJ)`);
}

function valTelefone(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{10,11}$/.test(value))
    ctx.err(path, `Telefone inválido: "${value}". Deve conter 10 ou 11 dígitos numéricos`);
}

function valEnum(value: string, allowed: number[], path: string, ctx: Ctx) {
  const num = parseInt(value, 10);
  if (!allowed.includes(num))
    ctx.err(path, `Valor inválido: "${value}". Valores permitidos: ${allowed.join(', ')}`);
}

function valMaxLen(value: string, max: number, path: string, ctx: Ctx) {
  if (value.length > max)
    ctx.err(path, `Valor excede o limite de ${max} caractere(s) (${value.length} informados)`);
}

function valStrLen(value: string, min: number, max: number, path: string, ctx: Ctx) {
  if (value.length < min)
    ctx.err(path, `Campo obrigatório não pode estar vazio (mínimo ${min} caractere(s))`);
  else if (value.length > max)
    ctx.err(path, `Valor excede o limite de ${max} caractere(s) (${value.length} informados)`);
}

// ─── Verificação de ordenação de tags ─────────────────────────────────────────

/**
 * Verifica se os elementos filho de `el` que constam em `order` aparecem
 * na sequência correta (xs:sequence). Elementos não listados são ignorados.
 */
function checkOrder(el: Element, path: string, order: readonly string[], ctx: Ctx) {
  let lastIdx = -1;
  let lastName = '';
  for (const c of Array.from(el.children)) {
    const name = c.localName;
    const idx = order.indexOf(name);
    if (idx === -1) continue;
    if (idx < lastIdx) {
      ctx.err(
        `${path}.${name}`,
        `Tag <${name}> está fora de ordem — deve aparecer antes de <${lastName}>. ` +
        `Sequência esperada: ${order.join(' → ')}`
      );
    } else {
      lastIdx = idx;
      lastName = name;
    }
  }
}

// ─── Endereços ────────────────────────────────────────────────────────────────

function validateEnderecoMunicipio(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['UF', 'codigoMunicipio', 'bairro', 'logradouro', 'numero', 'CEP', 'complemento'], ctx);
  const uf = requireChild(el, 'UF', path, ctx);
  if (uf) valUF(txt(uf), `${path}.UF`, ctx);

  const cm = requireChild(el, 'codigoMunicipio', path, ctx);
  if (cm && !/^[0-9]{7}$/.test(txt(cm)))
    ctx.err(`${path}.codigoMunicipio`, `Código do município inválido: "${txt(cm)}". Deve conter 7 dígitos numéricos`);

  const bairro = requireChild(el, 'bairro', path, ctx);
  if (bairro) valStrLen(txt(bairro), 1, 255, `${path}.bairro`, ctx);

  const logr = requireChild(el, 'logradouro', path, ctx);
  if (logr) valStrLen(txt(logr), 1, 255, `${path}.logradouro`, ctx);

  const num = requireChild(el, 'numero', path, ctx);
  if (num) valStrLen(txt(num), 1, 60, `${path}.numero`, ctx);

  const cep = requireChild(el, 'CEP', path, ctx);
  if (cep) valCEP(txt(cep), `${path}.CEP`, ctx);

  const comp = child(el, 'complemento');
  if (comp) valStrLen(txt(comp), 1, 255, `${path}.complemento`, ctx);
}

function validateEnderecoCidade(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['UF', 'cidade', 'bairro', 'logradouro', 'numero', 'CEP', 'complemento'], ctx);
  const uf = requireChild(el, 'UF', path, ctx);
  if (uf) valUF(txt(uf), `${path}.UF`, ctx);

  const cidade = requireChild(el, 'cidade', path, ctx);
  if (cidade) valStrLen(txt(cidade), 1, 100, `${path}.cidade`, ctx);

  const bairro = requireChild(el, 'bairro', path, ctx);
  if (bairro) valStrLen(txt(bairro), 1, 255, `${path}.bairro`, ctx);

  const logr = requireChild(el, 'logradouro', path, ctx);
  if (logr) valStrLen(txt(logr), 1, 255, `${path}.logradouro`, ctx);

  const num = child(el, 'numero');
  if (num) valStrLen(txt(num), 1, 8, `${path}.numero`, ctx);

  const cep = child(el, 'CEP');
  if (cep && !/^([0-9]{8}|0)$/.test(txt(cep)))
    ctx.err(`${path}.CEP`, `CEP inválido: "${txt(cep)}". Deve conter 8 dígitos numéricos ou "0"`);

  const comp = child(el, 'complemento');
  if (comp) valStrLen(txt(comp), 1, 255, `${path}.complemento`, ctx);
}

// ─── Pessoa ───────────────────────────────────────────────────────────────────

function validatePessoa(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['cnpj', 'cpf', 'nome', 'endereco'], ctx);
  const cnpj = child(el, 'cnpj');
  const cpf = child(el, 'cpf');

  if (!cnpj && !cpf) ctx.err(path, 'É obrigatório informar "cnpj" ou "cpf"');
  else if (cnpj && cpf) ctx.err(path, 'Informe apenas "cnpj" ou "cpf", não ambos');
  else if (cnpj) valCNPJ(txt(cnpj), `${path}.cnpj`, ctx);
  else if (cpf) valCPF(txt(cpf), `${path}.cpf`, ctx);

  const nome = requireChild(el, 'nome', path, ctx);
  if (nome) valStrLen(txt(nome), 1, 255, `${path}.nome`, ctx);

  const end = requireChild(el, 'endereco', path, ctx);
  if (end) validateEnderecoMunicipio(end, `${path}.endereco`, ctx);
}

// ─── Carga ────────────────────────────────────────────────────────────────────

function validateLotacao(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['codigoSH', 'codigoTipoCarga', 'quantidade', 'IndAltoDesempenho', 'IndRetornoVazio', 'remetente', 'destinatario'], ctx);
  const sh = requireChild(el, 'codigoSH', path, ctx);
  if (sh && !/^[0-9]{4}$/.test(txt(sh)))
    ctx.err(`${path}.codigoSH`, `Código SH inválido: "${txt(sh)}". Deve conter exatamente 4 dígitos numéricos`);

  const ctc = child(el, 'codigoTipoCarga');
  if (ctc) {
    const v = parseInt(txt(ctc), 10);
    if (v < 1 || v > 12)
      ctx.err(`${path}.codigoTipoCarga`, `Valor inválido: "${txt(ctc)}". Deve ser entre 1 e 12`);
  }

  const qtd = requireChild(el, 'quantidade', path, ctx);
  if (qtd) valQtd9v2(txt(qtd), `${path}.quantidade`, ctx);

  const indAD = child(el, 'IndAltoDesempenho');
  if (indAD) valEnum(txt(indAD), [0, 1], `${path}.IndAltoDesempenho`, ctx);

  const indRV = child(el, 'IndRetornoVazio');
  if (indRV) valEnum(txt(indRV), [0, 1], `${path}.IndRetornoVazio`, ctx);

  const rem = requireChild(el, 'remetente', path, ctx);
  if (rem) validatePessoa(rem, `${path}.remetente`, ctx);

  const dest = requireChild(el, 'destinatario', path, ctx);
  if (dest) validatePessoa(dest, `${path}.destinatario`, ctx);
}

function validateFracionado(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['codigoSH', 'codigoTipoCarga', 'contratantesCargaFrac', 'quantidade', 'remetente', 'destinatario'], ctx);
  const sh = requireChild(el, 'codigoSH', path, ctx);
  if (sh && !/^[0-9]{4}$/.test(txt(sh)))
    ctx.err(`${path}.codigoSH`, `Código SH inválido: "${txt(sh)}". Deve conter exatamente 4 dígitos numéricos`);

  // codigoTipoCarga é obrigatório em fracionado
  const ctc = requireChild(el, 'codigoTipoCarga', path, ctx);
  if (ctc) {
    const v = parseInt(txt(ctc), 10);
    if (v < 1 || v > 12)
      ctx.err(`${path}.codigoTipoCarga`, `Valor inválido: "${txt(ctc)}". Deve ser entre 1 e 12`);
  }

  const contratantes = requireChild(el, 'contratantesCargaFrac', path, ctx);
  if (contratantes) {
    const cfs = children(contratantes, 'contratanteF');
    if (cfs.length === 0)
      ctx.err(`${path}.contratantesCargaFrac`, 'Deve haver pelo menos um "contratanteF"');
    cfs.forEach((cf, i) => {
      const p = `${path}.contratantesCargaFrac.contratanteF[${i + 1}]`;
      const cpfcnpj = requireChild(cf, 'cpfCnpj', p, ctx);
      if (cpfcnpj) valCpfCnpj(txt(cpfcnpj), `${p}.cpfCnpj`, ctx);
    });
  }

  const qtd = requireChild(el, 'quantidade', path, ctx);
  if (qtd) valQtd9v2(txt(qtd), `${path}.quantidade`, ctx);

  const rem = requireChild(el, 'remetente', path, ctx);
  if (rem) validatePessoa(rem, `${path}.remetente`, ctx);

  const dest = requireChild(el, 'destinatario', path, ctx);
  if (dest) validatePessoa(dest, `${path}.destinatario`, ctx);
}

function validateTACagregado(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['remetente'], ctx);
  const rem = requireChild(el, 'remetente', path, ctx);
  if (!rem) return;

  const rp = `${path}.remetente`;
  checkOrder(rem, rp, ['cnpj', 'cpf', 'nome', 'endereco'], ctx);
  const cnpj = child(rem, 'cnpj');
  const cpf = child(rem, 'cpf');

  if (!cnpj && !cpf) ctx.err(rp, 'É obrigatório informar "cnpj" ou "cpf"');
  else if (cnpj) valCNPJ(txt(cnpj), `${rp}.cnpj`, ctx);
  else if (cpf) valCPF(txt(cpf), `${rp}.cpf`, ctx);

  const nome = requireChild(rem, 'nome', rp, ctx);
  if (nome) valStrLen(txt(nome), 1, 255, `${rp}.nome`, ctx);

  const end = requireChild(rem, 'endereco', rp, ctx);
  if (!end) return;

  const ep = `${rp}.endereco`;
  checkOrder(end, ep, ['UF', 'codigoMunicipio', 'bairro', 'logradouro', 'numero', 'CEP', 'complemento'], ctx);
  const uf = requireChild(end, 'UF', ep, ctx);
  if (uf) valUF(txt(uf), `${ep}.UF`, ctx);

  const cm = requireChild(end, 'codigoMunicipio', ep, ctx);
  if (cm && !/^[0-9]{7}$/.test(txt(cm)))
    ctx.err(`${ep}.codigoMunicipio`, `Código do município inválido: "${txt(cm)}". Deve ter 7 dígitos`);

  const bairro = requireChild(end, 'bairro', ep, ctx);
  if (bairro) valStrLen(txt(bairro), 1, 255, `${ep}.bairro`, ctx);

  const logr = requireChild(end, 'logradouro', ep, ctx);
  if (logr) valStrLen(txt(logr), 1, 255, `${ep}.logradouro`, ctx);

  const num = requireChild(end, 'numero', ep, ctx);
  if (num) valStrLen(txt(num), 1, 8, `${ep}.numero`, ctx);

  const cep = requireChild(end, 'CEP', ep, ctx);
  if (cep) valCEP(txt(cep), `${ep}.CEP`, ctx);

  const comp = child(end, 'complemento');
  if (comp) valStrLen(txt(comp), 1, 255, `${ep}.complemento`, ctx);
}

function validateCarga(el: Element, path: string, ctx: Ctx): string | null {
  checkOrder(el, path, ['lotacao', 'fracionado', 'TACagregado', 'consignatario', 'proprietarioCarga', 'documentosOriginarios'], ctx);
  const lotacao = child(el, 'lotacao');
  const fracionado = child(el, 'fracionado');
  const tacAgregado = child(el, 'TACagregado');
  const found = [lotacao, fracionado, tacAgregado].filter(Boolean);

  if (found.length === 0) {
    ctx.err(path, 'É obrigatório informar o tipo de carga: "lotacao", "fracionado" ou "TACagregado"');
    return null;
  }
  if (found.length > 1) {
    ctx.err(path, 'Apenas um tipo de carga deve ser informado: "lotacao", "fracionado" ou "TACagregado"');
    return null;
  }

  let tipoCarga: string;
  if (lotacao) { validateLotacao(lotacao, `${path}.lotacao`, ctx); tipoCarga = 'lotacao'; }
  else if (fracionado) { validateFracionado(fracionado, `${path}.fracionado`, ctx); tipoCarga = 'fracionado'; }
  else { validateTACagregado(tacAgregado!, `${path}.TACagregado`, ctx); tipoCarga = 'TACagregado'; }

  const consig = child(el, 'consignatario');
  if (consig) {
    const cp = `${path}.consignatario`;
    const cnpj = child(consig, 'cnpj');
    const cpf = child(consig, 'cpf');
    if (!cnpj && !cpf) ctx.err(cp, 'É obrigatório informar "cnpj" ou "cpf"');
    else if (cnpj) valCNPJ(txt(cnpj), `${cp}.cnpj`, ctx);
    else if (cpf) valCPF(txt(cpf), `${cp}.cpf`, ctx);
    const nome = requireChild(consig, 'nome', cp, ctx);
    if (nome) valStrLen(txt(nome), 1, 255, `${cp}.nome`, ctx);
    const end = requireChild(consig, 'endereco', cp, ctx);
    if (end) validateEnderecoMunicipio(end, `${cp}.endereco`, ctx);
  }

  const pc = requireChild(el, 'proprietarioCarga', path, ctx);
  if (pc) valEnum(txt(pc), [1, 2, 3, 4], `${path}.proprietarioCarga`, ctx);

  const docOrig = child(el, 'documentosOriginarios');
  if (docOrig) {
    const docs = children(docOrig, 'documentoOriginario');
    if (docs.length === 0)
      ctx.err(`${path}.documentosOriginarios`, 'Deve haver pelo menos um "documentoOriginario"');
    docs.forEach((d, i) => {
      const dp = `${path}.documentosOriginarios.documentoOriginario[${i + 1}]`;
      const tipo = requireChild(d, 'tipo', dp, ctx);
      if (tipo) valStrLen(txt(tipo), 1, 40, `${dp}.tipo`, ctx);
      const num = requireChild(d, 'numero', dp, ctx);
      if (num) valStrLen(txt(num), 1, 44, `${dp}.numero`, ctx);
    });
  }

  return tipoCarga;
}

// ─── IDE ──────────────────────────────────────────────────────────────────────

function validateIde(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['cnpj', 'numero', 'serie', 'ptEmissor', 'dtInicio', 'dtFim', 'contrato'], ctx);
  const cnpj = requireChild(el, 'cnpj', path, ctx);
  if (cnpj) valCNPJ(txt(cnpj), `${path}.cnpj`, ctx);

  const numero = requireChild(el, 'numero', path, ctx);
  if (numero) {
    const v = parseInt(txt(numero), 10);
    if (isNaN(v) || v < 1)
      ctx.err(`${path}.numero`, `Número da OT inválido: "${txt(numero)}". Deve ser um inteiro positivo`);
  }

  const serie = requireChild(el, 'serie', path, ctx);
  if (serie) {
    const v = parseInt(txt(serie), 10);
    if (isNaN(v) || v < 1 || v > 9999)
      ctx.err(`${path}.serie`, `Série inválida: "${txt(serie)}". Deve ser entre 1 e 9999`);
  }

  const ptEmissor = requireChild(el, 'ptEmissor', path, ctx);
  if (ptEmissor) valStrLen(txt(ptEmissor), 1, 30, `${path}.ptEmissor`, ctx);

  const dtInicio = child(el, 'dtInicio');
  if (dtInicio) valData(txt(dtInicio), `${path}.dtInicio`, ctx);

  const dtFim = child(el, 'dtFim');
  if (dtFim) valData(txt(dtFim), `${path}.dtFim`, ctx);

  const contrato = child(el, 'contrato');
  if (contrato) valStrLen(txt(contrato), 1, 50, `${path}.contrato`, ctx);
}

// ─── Transp ───────────────────────────────────────────────────────────────────

function validateCondutores(el: Element, path: string, ctx: Ctx) {
  const condutores = children(el, 'condutor');
  if (condutores.length === 0) {
    ctx.err(path, 'Deve haver pelo menos um "condutor"');
    return;
  }

  condutores.forEach((cond, i) => {
    const cp = `${path}.condutor[${i + 1}]`;

    const cpf = requireChild(cond, 'cpf', cp, ctx);
    if (cpf) valCPF(txt(cpf), `${cp}.cpf`, ctx);

    checkOrder(cond, cp, ['cpf', 'informacoes'], ctx);
    const info = child(cond, 'informacoes');
    if (!info) return;

    const ip = `${cp}.informacoes`;
    checkOrder(info, ip, ['nomeCompleto', 'nomeMae', 'nomePai', 'dataNascimento', 'identidade', 'RNTRCTransportador', 'cpfTransportador', 'cnpjTransportador', 'endereco', 'CNH', 'dataEmissaoCNH', 'dataRenovacaoCNH', 'telefone', 'cartaoId'], ctx);

    const nomeCompleto = requireChild(info, 'nomeCompleto', ip, ctx);
    if (nomeCompleto) valStrLen(txt(nomeCompleto), 1, 150, `${ip}.nomeCompleto`, ctx);

    const nomeMae = requireChild(info, 'nomeMae', ip, ctx);
    if (nomeMae) valStrLen(txt(nomeMae), 1, 150, `${ip}.nomeMae`, ctx);

    const nomePai = child(info, 'nomePai');
    if (nomePai) valStrLen(txt(nomePai), 1, 150, `${ip}.nomePai`, ctx);

    const dataNasc = requireChild(info, 'dataNascimento', ip, ctx);
    if (dataNasc) valData(txt(dataNasc), `${ip}.dataNascimento`, ctx);

    const identidade = requireChild(info, 'identidade', ip, ctx);
    if (identidade) valStrLen(txt(identidade), 1, 20, `${ip}.identidade`, ctx);

    const rntrcT = child(info, 'RNTRCTransportador');
    if (rntrcT) valRNTRC(txt(rntrcT), `${ip}.RNTRCTransportador`, ctx);

    const cpfT = child(info, 'cpfTransportador');
    const cnpjT = child(info, 'cnpjTransportador');
    if (cpfT && cnpjT) ctx.err(ip, 'Informe apenas "cpfTransportador" ou "cnpjTransportador", não ambos');
    else if (cpfT) valCPF(txt(cpfT), `${ip}.cpfTransportador`, ctx);
    else if (cnpjT) valCNPJ(txt(cnpjT), `${ip}.cnpjTransportador`, ctx);

    const end = requireChild(info, 'endereco', ip, ctx);
    if (end) validateEnderecoCidade(end, `${ip}.endereco`, ctx);

    const cnh = child(info, 'CNH');
    if (cnh) valStrLen(txt(cnh), 1, 15, `${ip}.CNH`, ctx);

    const dtEmissaoCNH = child(info, 'dataEmissaoCNH');
    if (dtEmissaoCNH) valData(txt(dtEmissaoCNH), `${ip}.dataEmissaoCNH`, ctx);

    const dtRenovacaoCNH = child(info, 'dataRenovacaoCNH');
    if (dtRenovacaoCNH) valData(txt(dtRenovacaoCNH), `${ip}.dataRenovacaoCNH`, ctx);

    const telefone = requireChild(info, 'telefone', ip, ctx);
    if (telefone) valTelefone(txt(telefone), `${ip}.telefone`, ctx);

    const cartaoId = child(info, 'cartaoId');
    if (cartaoId) valStrLen(txt(cartaoId), 1, 15, `${ip}.cartaoId`, ctx);
  });
}

function validateVeiculos(el: Element, path: string, ctx: Ctx) {
  const veics = children(el, 'veiculo');
  if (veics.length === 0) {
    ctx.err(path, 'Deve haver pelo menos 1 veículo');
    return;
  }
  if (veics.length > 5)
    ctx.err(path, `Máximo de 5 veículos permitidos (${veics.length} informados)`);

  veics.forEach((v, i) => {
    const vp = `${path}.veiculo[${i + 1}]`;

    checkOrder(v, vp, ['placa', 'informacoes'], ctx);
    const placa = requireChild(v, 'placa', vp, ctx);
    if (placa) valPlaca(txt(placa), `${vp}.placa`, ctx);

    const info = requireChild(v, 'informacoes', vp, ctx);
    if (!info) return;

    const ip = `${vp}.informacoes`;
    checkOrder(info, ip, ['modelo', 'kmLitroModelo', 'tipo', 'kmLitroVeiculo', 'RNTRCTransportador', 'qtdEixos', 'ComposicaoVeicular'], ctx);

    const modelo = requireChild(info, 'modelo', ip, ctx);
    if (modelo) valStrLen(txt(modelo), 1, 100, `${ip}.modelo`, ctx);

    const kmLitroModelo = child(info, 'kmLitroModelo');
    if (kmLitroModelo) valKmLitro4v2(txt(kmLitroModelo), `${ip}.kmLitroModelo`, ctx);

    const tipo = requireChild(info, 'tipo', ip, ctx);
    if (tipo) valEnum(txt(tipo), [1, 2], `${ip}.tipo`, ctx);

    const kmLitroVeiculo = child(info, 'kmLitroVeiculo');
    if (kmLitroVeiculo) valKmLitro4v2(txt(kmLitroVeiculo), `${ip}.kmLitroVeiculo`, ctx);

    const rntrc = requireChild(info, 'RNTRCTransportador', ip, ctx);
    if (rntrc) valRNTRC(txt(rntrc), `${ip}.RNTRCTransportador`, ctx);

    const qtdEixos = requireChild(info, 'qtdEixos', ip, ctx);
    if (qtdEixos) {
      const val = parseInt(txt(qtdEixos), 10);
      if (isNaN(val) || val < 1 || val > 4)
        ctx.err(`${ip}.qtdEixos`, `Quantidade de eixos inválida: "${txt(qtdEixos)}". Deve ser entre 1 e 4`);
    }

    const comp = child(info, 'ComposicaoVeicular');
    if (comp) valEnum(txt(comp), [0, 1], `${ip}.ComposicaoVeicular`, ctx);
  });
}

function validateParcela(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['nome', 'tipoPgto', 'valorAplicado', 'valorReal', 'documentos', 'descontos', 'restricoes', 'prazoMinimo', 'carga', 'confirmarPgto', 'transferenciaAutomatica'], ctx);
  const nome = requireChild(el, 'nome', path, ctx);
  if (nome) valStrLen(txt(nome), 1, 50, `${path}.nome`, ctx);

  const tipoPgto = requireChild(el, 'tipoPgto', path, ctx);
  if (tipoPgto) {
    const manual = child(tipoPgto, 'manual');
    const automatico = child(tipoPgto, 'automatico');
    const imediato = child(tipoPgto, 'imediato');
    const tp = `${path}.tipoPgto`;

    if (!manual && !automatico && !imediato) {
      ctx.err(tp, 'Deve informar o tipo de pagamento: "manual", "automatico" ou "imediato"');
    } else if (manual) {
      const dtPrev = requireChild(manual, 'dataPrevisao', `${tp}.manual`, ctx);
      if (dtPrev) valData(txt(dtPrev), `${tp}.manual.dataPrevisao`, ctx);
      const efet = child(manual, 'efetivacao');
      if (efet) valEnum(txt(efet), [1, 2, 3, 4], `${tp}.manual.efetivacao`, ctx);
      const cnpjPosto = child(manual, 'cnpjPostoCredenciado');
      if (cnpjPosto) valCNPJ(txt(cnpjPosto), `${tp}.manual.cnpjPostoCredenciado`, ctx);
    } else if (automatico) {
      const dh = requireChild(automatico, 'dataHora', `${tp}.automatico`, ctx);
      if (dh) valDataHora(txt(dh), `${tp}.automatico.dataHora`, ctx);
    } else if (imediato) {
      valEnum(txt(imediato), [2], `${tp}.imediato`, ctx);
    }
  }

  const vlrAplicado = requireChild(el, 'valorAplicado', path, ctx);
  if (vlrAplicado) valValor12v2(txt(vlrAplicado), `${path}.valorAplicado`, ctx);

  const vlrReal = child(el, 'valorReal');
  if (vlrReal) valValor12v2(txt(vlrReal), `${path}.valorReal`, ctx);

  const prazoMin = child(el, 'prazoMinimo');
  if (prazoMin) valEnum(txt(prazoMin), [1, 2, 3], `${path}.prazoMinimo`, ctx);

  const confirmarPgto = child(el, 'confirmarPgto');
  if (confirmarPgto) valEnum(txt(confirmarPgto), [1, 2], `${path}.confirmarPgto`, ctx);

  const transauto = child(el, 'transferenciaAutomatica');
  if (transauto) {
    const tap = `${path}.transferenciaAutomatica`;
    const cpfCond = requireChild(transauto, 'cpfCondutor', tap, ctx);
    if (cpfCond) valCPF(txt(cpfCond), `${tap}.cpfCondutor`, ctx);
    const finalidade = requireChild(transauto, 'finalidadeParcela', tap, ctx);
    if (finalidade) valEnum(txt(finalidade), [1, 2], `${tap}.finalidadeParcela`, ctx);
  }
}

function validateValores(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['vlrFrete', 'despesas', 'parcelamento', 'retencoes', 'tipoRateio', 'descontos', 'vlrCombustivel', 'vlrPedagio', 'direcionamentosPedagio', 'dadosBancarios'], ctx);
  const vlrFrete = requireChild(el, 'vlrFrete', path, ctx);
  if (vlrFrete) valValor(txt(vlrFrete), `${path}.vlrFrete`, ctx);

  const despesas = child(el, 'despesas');
  if (despesas) {
    const dp = `${path}.despesas`;
    const vlrDesp = requireChild(despesas, 'vlrDespesas', dp, ctx);
    if (vlrDesp) valValor(txt(vlrDesp), `${dp}.vlrDespesas`, ctx);
    const desc = requireChild(despesas, 'descricao', dp, ctx);
    if (desc) valStrLen(txt(desc), 1, 2000, `${dp}.descricao`, ctx);
  }

  const parcelamento = child(el, 'parcelamento');
  if (parcelamento) {
    const pp = `${path}.parcelamento`;
    const regraERP = child(parcelamento, 'regraERP');
    const informacoes = child(parcelamento, 'informacoes');

    if (!regraERP && !informacoes) {
      ctx.err(pp, 'Parcelamento deve conter "regraERP" ou "informacoes"');
    } else if (regraERP && informacoes) {
      ctx.err(pp, 'Informe apenas "regraERP" ou "informacoes", não ambos');
    } else if (regraERP) {
      valStrLen(txt(regraERP), 1, 30, `${pp}.regraERP`, ctx);
    } else if (informacoes) {
      const parcelas = child(informacoes, 'parcelas');
      if (!parcelas) {
        ctx.err(`${pp}.informacoes`, 'Campo obrigatório "parcelas" não encontrado');
      } else {
        const parcelaList = children(parcelas, 'parcela');
        if (parcelaList.length === 0)
          ctx.err(`${pp}.informacoes.parcelas`, 'Deve haver pelo menos uma "parcela"');
        parcelaList.forEach((p, i) =>
          validateParcela(p, `${pp}.informacoes.parcelas.parcela[${i + 1}]`, ctx)
        );
      }
    }
  }

  const retencoes = child(el, 'retencoes');
  if (retencoes) {
    const rp = `${path}.retencoes`;
    checkOrder(retencoes, rp, ['irrf', 'inss', 'sestsenat'], ctx);
    const irrf = requireChild(retencoes, 'irrf', rp, ctx);
    if (irrf) valValor(txt(irrf), `${rp}.irrf`, ctx);
    const inss = requireChild(retencoes, 'inss', rp, ctx);
    if (inss) valValor(txt(inss), `${rp}.inss`, ctx);
    const sestsenat = requireChild(retencoes, 'sestsenat', rp, ctx);
    if (sestsenat) valValor(txt(sestsenat), `${rp}.sestsenat`, ctx);
  }

  const tipoRateio = requireChild(el, 'tipoRateio', path, ctx);
  if (tipoRateio) valEnum(txt(tipoRateio), [1, 2, 3, 4, 5], `${path}.tipoRateio`, ctx);

  const vlrComb = child(el, 'vlrCombustivel');
  if (vlrComb) valValor(txt(vlrComb), `${path}.vlrCombustivel`, ctx);

  const vlrPedagio = child(el, 'vlrPedagio');
  const dirPedagio = child(el, 'direcionamentosPedagio');
  if (vlrPedagio && dirPedagio)
    ctx.err(path, 'Informe apenas "vlrPedagio" ou "direcionamentosPedagio", não ambos');
  if (vlrPedagio) valValor(txt(vlrPedagio), `${path}.vlrPedagio`, ctx);
  if (dirPedagio) {
    const dp = `${path}.direcionamentosPedagio`;
    const catPedagio = requireChild(dirPedagio, 'categoriaPedagio', dp, ctx);
    if (catPedagio) valStrLen(txt(catPedagio), 1, 2, `${dp}.categoriaPedagio`, ctx);
  }

  const db = child(el, 'dadosBancarios');
  if (db) {
    const dbp = `${path}.dadosBancarios`;
    const codigoIF = child(db, 'codigoInstituicaoFinanceira');
    if (codigoIF) valStrLen(txt(codigoIF), 1, 3, `${dbp}.codigoInstituicaoFinanceira`, ctx);

    const agencia = child(db, 'numeroAgencia');
    if (agencia) valStrLen(txt(agencia), 1, 6, `${dbp}.numeroAgencia`, ctx);

    const conta = child(db, 'numeroConta');
    if (conta) valStrLen(txt(conta), 1, 20, `${dbp}.numeroConta`, ctx);

    const digito = child(db, 'digitoConta');
    if (digito) valMaxLen(txt(digito), 1, `${dbp}.digitoConta`, ctx);

    const chavePix = child(db, 'chavePix');
    if (chavePix) valStrLen(txt(chavePix), 1, 64, `${dbp}.chavePix`, ctx);

    const cpfCnpjFav = child(db, 'cpfCnpjFavorecido');
    if (cpfCnpjFav) valCpfCnpj(txt(cpfCnpjFav), `${dbp}.cpfCnpjFavorecido`, ctx);

    const tipoChave = child(db, 'tipoChave');
    if (tipoChave) valEnum(txt(tipoChave), [1, 2, 3, 4, 5], `${dbp}.tipoChave`, ctx);

    const tipoPgto = child(db, 'tipoPagamento');
    if (tipoPgto) valEnum(txt(tipoPgto), [2], `${dbp}.tipoPagamento`, ctx);
  }

}

function validateInfTransportador(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['ide', 'endereco', 'telefone', 'cartaoId', 'email'], ctx);
  const idePath = `${path}.ide`;
  const ide = requireChild(el, 'ide', path, ctx);
  if (!ide) return;

  const tac = child(ide, 'tac');
  const etc = child(ide, 'etc');
  const ctc = child(ide, 'ctc');
  const found = [tac, etc, ctc].filter(Boolean);

  if (found.length === 0)
    ctx.err(idePath, 'É obrigatório informar o tipo de cadastro do transportador: "tac", "etc" ou "ctc"');
  else if (found.length > 1)
    ctx.err(idePath, 'Apenas um tipo de cadastro deve ser informado: "tac", "etc" ou "ctc"');

  // ── tac ──────────────────────────────────────────────────────────────────────
  if (tac) {
    const tp = `${idePath}.tac`;
    checkOrder(tac, tp, ['nomeCompleto', 'nomeMae', 'nomePai', 'dataNascimento', 'identidade'], ctx);
    const nomeC = requireChild(tac, 'nomeCompleto', tp, ctx);
    if (nomeC) valStrLen(txt(nomeC), 1, 150, `${tp}.nomeCompleto`, ctx);
    const nomeMae = requireChild(tac, 'nomeMae', tp, ctx);
    if (nomeMae) valStrLen(txt(nomeMae), 1, 150, `${tp}.nomeMae`, ctx);
    const nomePai = child(tac, 'nomePai');
    if (nomePai) valStrLen(txt(nomePai), 1, 150, `${tp}.nomePai`, ctx);
    const dtNasc = requireChild(tac, 'dataNascimento', tp, ctx);
    if (dtNasc) valData(txt(dtNasc), `${tp}.dataNascimento`, ctx);
    const ident = requireChild(tac, 'identidade', tp, ctx);
    if (ident) valStrLen(txt(ident), 1, 20, `${tp}.identidade`, ctx);
  }

  // ── etc / ctc (mesma estrutura) ───────────────────────────────────────────────
  for (const [tag, el2] of [['etc', etc], ['ctc', ctc]] as [string, Element | undefined][]) {
    if (!el2) continue;
    const ep = `${idePath}.${tag}`;
    checkOrder(el2, ep, ['razaoSocial', 'nomeFantasia', 'inscEstadual', 'atividadePrincipal', 'formaConstituicao', 'dataConstituicao', 'socio'], ctx);

    const razao = requireChild(el2, 'razaoSocial', ep, ctx);
    if (razao) valStrLen(txt(razao), 1, 150, `${ep}.razaoSocial`, ctx);

    const fantasia = requireChild(el2, 'nomeFantasia', ep, ctx);
    if (fantasia) valStrLen(txt(fantasia), 1, 150, `${ep}.nomeFantasia`, ctx);

    const inscE = requireChild(el2, 'inscEstadual', ep, ctx);
    if (inscE) valStrLen(txt(inscE), 1, 14, `${ep}.inscEstadual`, ctx);

    const ativEl = requireChild(el2, 'atividadePrincipal', ep, ctx);
    if (ativEl) {
      const ativ = txt(ativEl);
      valStrLen(ativ, 1, 2, `${ep}.atividadePrincipal`, ctx);
      if (ativ.length > 0 && ativ.length <= 2 && !VALID_ATIVIDADE_PRINCIPAL.has(ativ))
        ctx.errors.push({
          path: `${ep}.atividadePrincipal`,
          message: `O código de atividade principal "${ativ}" não é uma divisão CNAE válida`,
          link: { url: '/#/atividade-principal', label: 'Consultar tabela de atividadePrincipal' },
        });
    }

    const forma = requireChild(el2, 'formaConstituicao', ep, ctx);
    if (forma) {
      valStrLen(txt(forma), 5, 5, `${ep}.formaConstituicao`, ctx);
      const formaVal = txt(forma);
      if (formaVal.length === 5 && !VALID_FORMA_CONSTITUICAO.has(formaVal))
        ctx.errors.push({
          path: `${ep}.formaConstituicao`,
          message: `A forma de constituição "${formaVal}" não é uma natureza jurídica válida`,
          link: { url: '/#/forma-constituicao', label: 'Consultar tabela de formaConstituicao' },
        });
    }

    const dtConst = requireChild(el2, 'dataConstituicao', ep, ctx);
    if (dtConst) valData(txt(dtConst), `${ep}.dataConstituicao`, ctx);
  }

  // ── campos comuns de infTransportador ────────────────────────────────────────
  const end = child(el, 'endereco');
  if (end) validateEnderecoCidade(end, `${path}.endereco`, ctx);

  const tel = requireChild(el, 'telefone', path, ctx);
  if (tel) valTelefone(txt(tel), `${path}.telefone`, ctx);

  const cartao = child(el, 'cartaoId');
  if (cartao) valStrLen(txt(cartao), 1, 15, `${path}.cartaoId`, ctx);

  const email = child(el, 'email');
  if (email) valStrLen(txt(email), 1, 255, `${path}.email`, ctx);
}

function validateTransp(el: Element, path: string, ctx: Ctx) {
  checkOrder(el, path, ['rntrc', 'cpfTransportador', 'cnpjTransportador', 'infTransportador', 'gestoraCartao', 'subcontratado', 'rota', 'condutores', 'veiculos', 'valores', 'categoriaPedagio'], ctx);
  const rntrc = requireChild(el, 'rntrc', path, ctx);
  if (rntrc) valRNTRC(txt(rntrc), `${path}.rntrc`, ctx);

  const cpfT = child(el, 'cpfTransportador');
  const cnpjT = child(el, 'cnpjTransportador');
  if (!cpfT && !cnpjT) ctx.err(path, 'É obrigatório informar "cpfTransportador" ou "cnpjTransportador"');
  if (cpfT) valCPF(txt(cpfT), `${path}.cpfTransportador`, ctx);
  if (cnpjT) valCNPJ(txt(cnpjT), `${path}.cnpjTransportador`, ctx);

  const infTransp = child(el, 'infTransportador');
  if (infTransp) validateInfTransportador(infTransp, `${path}.infTransportador`, ctx);

  const gc = child(el, 'gestoraCartao');
  if (gc) valMaxLen(txt(gc), 3, `${path}.gestoraCartao`, ctx);

  const sub = child(el, 'subcontratado');
  if (sub) {
    const sp = `${path}.subcontratado`;
    checkOrder(sub, sp, ['cnpj', 'cpf', 'nome', 'endereco'], ctx);
    const cnpj = child(sub, 'cnpj');
    const cpf = child(sub, 'cpf');
    if (!cnpj && !cpf) ctx.err(sp, 'É obrigatório informar "cnpj" ou "cpf"');
    if (cnpj) valCNPJ(txt(cnpj), `${sp}.cnpj`, ctx);
    if (cpf) valCpfCnpj(txt(cpf), `${sp}.cpf`, ctx);
    const nome = requireChild(sub, 'nome', sp, ctx);
    if (nome) valStrLen(txt(nome), 1, 150, `${sp}.nome`, ctx);
    const end = requireChild(sub, 'endereco', sp, ctx);
    if (end) validateEnderecoMunicipio(end, `${sp}.endereco`, ctx);
  }

  const condutores = child(el, 'condutores');
  if (condutores) validateCondutores(condutores, `${path}.condutores`, ctx);

  const veiculos = requireChild(el, 'veiculos', path, ctx);
  if (veiculos) validateVeiculos(veiculos, `${path}.veiculos`, ctx);

  const valores = requireChild(el, 'valores', path, ctx);
  if (valores) validateValores(valores, `${path}.valores`, ctx);

  const catPedagio = child(el, 'categoriaPedagio');
  if (catPedagio) valMaxLen(txt(catPedagio), 2, `${path}.categoriaPedagio`, ctx);
}

// ─── infOT ────────────────────────────────────────────────────────────────────

function validateInfOT(el: Element, path: string, ctx: Ctx) {
  // Campos de controle são atributos XML do elemento infOT
  const gerPgtoFin = el.getAttribute('gerPgtoFin');
  if (gerPgtoFin !== null) valEnum(gerPgtoFin, [1, 2, 3, 4, 5, 6], `${path}@gerPgtoFin`, ctx);

  const gerPgtoPedagio = el.getAttribute('gerPgtoPedagio');
  if (gerPgtoPedagio !== null) valEnum(gerPgtoPedagio, [1, 2], `${path}@gerPgtoPedagio`, ctx);

  const impAuto = el.getAttribute('impAuto');
  if (impAuto !== null) valEnum(impAuto, [1, 2], `${path}@impAuto`, ctx);

  const utilizaDirecionamento = el.getAttribute('utilizaDirecionamentoPedagio');
  if (utilizaDirecionamento !== null)
    valEnum(utilizaDirecionamento, [1, 2], `${path}@utilizaDirecionamentoPedagio`, ctx);

  const integrarANTT = el.getAttribute('integrarANTT');
  if (integrarANTT !== null) valEnum(integrarANTT, [1, 2], `${path}@integrarANTT`, ctx);

  checkOrder(el, path, ['ide', 'carga', 'contatos', 'transp', 'quitacao', 'adicionais', 'confirmador'], ctx);

  const ide = requireChild(el, 'ide', path, ctx);
  if (ide) validateIde(ide, `${path}.ide`, ctx);

  const carga = requireChild(el, 'carga', path, ctx);
  if (carga) validateCarga(carga, `${path}.carga`, ctx);

  const contatos = child(el, 'contatos');
  if (contatos) {
    const cp = `${path}.contatos`;
    const contatoList = children(contatos, 'contato');
    if (contatoList.length === 0) ctx.err(cp, 'Deve haver pelo menos um "contato"');
    contatoList.forEach((c, i) => {
      const p = `${cp}.contato[${i + 1}]`;
      const nome = requireChild(c, 'nome', p, ctx);
      if (nome) valStrLen(txt(nome), 1, 255, `${p}.nome`, ctx);
      const contato = requireChild(c, 'contato', p, ctx);
      if (contato) valStrLen(txt(contato), 1, 255, `${p}.contato`, ctx);
    });
  }

  const transp = requireChild(el, 'transp', path, ctx);
  if (transp) validateTransp(transp, `${path}.transp`, ctx);

  const conf = child(el, 'confirmador');
  if (conf) {
    const cp = `${path}.confirmador`;
    const cnpj = child(conf, 'cnpj');
    const cpf = child(conf, 'cpf');
    if (!cnpj && !cpf) ctx.err(cp, 'É obrigatório informar "cnpj" ou "cpf"');
    else if (cnpj) valCNPJ(txt(cnpj), `${cp}.cnpj`, ctx);
    else if (cpf) valCPF(txt(cpf), `${cp}.cpf`, ctx);
  }
}

// ─── OT ───────────────────────────────────────────────────────────────────────

function validateOT(el: Element, index: number, ctx: Ctx) {
  const path = `OT[${index}]`;

  const infOT = requireChild(el, 'infOT', path, ctx);
  if (infOT) validateInfOT(infOT, `${path}.infOT`, ctx);

  const sigNS = 'http://www.w3.org/2000/09/xmldsig#';
  const sig =
    el.getElementsByTagNameNS(sigNS, 'Signature')[0] ??
    Array.from(el.children).find(c => c.localName === 'Signature');

  if (!sig)
    ctx.err(path, 'Assinatura digital (ds:Signature) não encontrada. Este campo é obrigatório');
}

// ─── Raiz ─────────────────────────────────────────────────────────────────────

function validateRoot(doc: Document, ctx: Ctx): number {
  const root = doc.documentElement;

  if (root.localName !== 'loteOT_envio') {
    ctx.err('/', `Elemento raiz inválido: "${root.localName}". Esperado: "loteOT_envio"`);
    return 0;
  }

  // versao, tms e token são atributos XML do elemento loteOT_envio
  const versao = root.getAttribute('versao');
  if (!versao) {
    ctx.err('loteOT_envio', 'Atributo obrigatório "versao" não encontrado');
  } else if (versao !== '4.2.12.0') {
    ctx.err('loteOT_envio@versao', `Versão inválida: "${versao}". O único valor aceito é "4.2.12.0"`);
  }

  const tms = root.getAttribute('tms');
  if (tms !== null) {
    if (tms.length === 0)
      ctx.err('loteOT_envio@tms', `Atributo "tms" não pode estar vazio quando informado`);
    else if (tms.length > 20)
      ctx.err('loteOT_envio@tms', `Atributo "tms" excede o limite de 20 caracteres`);
  }

  const token = root.getAttribute('token');
  if (!token) {
    ctx.err('loteOT_envio', 'Atributo obrigatório "token" não encontrado');
  } else if (token.length === 0 || token.length > 24) {
    ctx.err('loteOT_envio@token', `Token inválido. Deve ter entre 1 e 24 caracteres`);
  }

  const operacoes = requireChild(root, 'operacoes', 'loteOT_envio', ctx);
  if (!operacoes) return 0;

  const ots = children(operacoes, 'OT');
  if (ots.length === 0) {
    ctx.err('loteOT_envio.operacoes', 'Deve haver pelo menos uma OT em "operacoes"');
    return 0;
  }

  ots.forEach((ot, i) => validateOT(ot, i + 1, ctx));
  return ots.length;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function validate(xmlString: string): ValidationResult {
  if (!xmlString.trim())
    return { valid: false, errors: [], parseError: 'O conteúdo do XML está vazio', otCount: 0 };

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');

  const parseErr = doc.querySelector('parsererror');
  if (parseErr) {
    const raw = parseErr.textContent?.trim() ?? '';
    const friendly = raw.replace(/\n/g, ' ').substring(0, 300);
    return {
      valid: false,
      errors: [],
      parseError: `XML malformado — verifique a sintaxe do documento. Detalhe: ${friendly}`,
      otCount: 0,
    };
  }

  const ctx = createCtx();
  const otCount = validateRoot(doc, ctx);
  const businessErrors = applyBusinessRules(doc);
  const allErrors: ValidationError[] = [...ctx.errors, ...businessErrors];

  return { valid: allErrors.length === 0, errors: allErrors, otCount };
}
