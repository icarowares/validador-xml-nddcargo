import type { ValidationResult } from './types';

// ─── Context ──────────────────────────────────────────────────────────────────

function createCtx() {
  const errors: { path: string; message: string }[] = [];
  return {
    errors,
    err(path: string, message: string) { errors.push({ path, message }); },
  };
}
type Ctx = ReturnType<typeof createCtx>;

// ─── DOM helpers ──────────────────────────────────────────────────────────────

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

function valStrLen(value: string, min: number, max: number, path: string, ctx: Ctx) {
  if (value.length < min)
    ctx.err(path, `Campo obrigatório não pode estar vazio (mínimo ${min} caractere(s))`);
  else if (value.length > max)
    ctx.err(path, `Valor excede o limite de ${max} caractere(s) (${value.length} informados)`);
}

function valDecimal(value: string, totalDig: number, fracDig: number, path: string, ctx: Ctx) {
  if (!/^-?[0-9]+(\.[0-9]+)?$/.test(value)) {
    ctx.err(path, `Valor inválido: "${value}". Deve ser um número decimal`);
    return;
  }
  const parts  = value.split('.');
  const intStr = parts[0].replace('-', '');
  const frac   = parts[1] ?? '';
  if (frac.length > fracDig)
    ctx.err(path, `Valor "${value}" possui mais de ${fracDig} casa(s) decimal(is)`);
  if (intStr.length + frac.length > totalDig)
    ctx.err(path, `Valor "${value}" excede o máximo de ${totalDig} dígitos`);
}

function valEnum(value: string, allowed: number[], path: string, ctx: Ctx) {
  const num = parseInt(value, 10);
  if (!allowed.includes(num))
    ctx.err(path, `Valor inválido: "${value}". Valores permitidos: ${allowed.join(', ')}`);
}

function valInt(value: string, min: number, max: number, path: string, ctx: Ctx) {
  const n = parseInt(value, 10);
  if (isNaN(n) || String(n) !== value.trim())
    ctx.err(path, `Valor inválido: "${value}". Deve ser um número inteiro`);
  else if (n < min || n > max)
    ctx.err(path, `Valor "${value}" fora do intervalo permitido (${min}–${max})`);
}

// ─── Namespace injection ──────────────────────────────────────────────────────

function injectDsNamespace(xml: string): { xml: string; injected: boolean } {
  if (!xml.includes('ds:') || xml.includes('xmlns:ds')) return { xml, injected: false };
  const patched = xml.replace(
    /(<[A-Za-z_][A-Za-z0-9_]*(?:\s[^>]*?)?)(\s*>)/,
    '$1 xmlns:ds="http://www.w3.org/2000/09/xmldsig#"$2',
  );
  return { xml: patched, injected: true };
}

// ─── pontoParada ──────────────────────────────────────────────────────────────

function validatePontoParada(el: Element, path: string, ctx: Ctx) {
  const ibge = child(el, 'codigoIBGE');
  const cep  = child(el, 'cep');
  const lat  = child(el, 'latitude');
  const lon  = child(el, 'longitude');

  const methods = [!!ibge, !!cep, !!(lat || lon)].filter(Boolean).length;

  if (methods === 0) {
    ctx.err(path, '[RN-E03] É obrigatório informar "codigoIBGE", "cep" ou o par "latitude + longitude"');
    return;
  }
  if (methods > 1) {
    ctx.err(path, '[RN-E03] "codigoIBGE", "cep" e "latitude/longitude" são mutuamente exclusivos no mesmo pontoParada');
  }

  if (ibge && !/^[0-9]{7}$/.test(txt(ibge)))
    ctx.err(`${path}.codigoIBGE`, `Código IBGE inválido: "${txt(ibge)}". Deve conter exatamente 7 dígitos numéricos`);

  if (cep && !/^[0-9]{8}$/.test(txt(cep)))
    ctx.err(`${path}.cep`, `CEP inválido: "${txt(cep)}". Deve conter exatamente 8 dígitos numéricos`);

  if (lat && !lon)
    ctx.err(`${path}.longitude`, '[RN-E03] "longitude" é obrigatória quando "latitude" é informada');
  if (lon && !lat)
    ctx.err(`${path}.latitude`, '[RN-E03] "latitude" é obrigatória quando "longitude" é informada');

  if (lat) valDecimal(txt(lat), 10, 6, `${path}.latitude`, ctx);
  if (lon) valDecimal(txt(lon), 10, 6, `${path}.longitude`, ctx);
}

// ─── informacoes da rota ──────────────────────────────────────────────────────

function validateRotaInformacoes(el: Element, path: string, ctx: Ctx) {
  const nome = requireChild(el, 'nome', path, ctx);
  if (nome) valStrLen(txt(nome), 1, 50, `${path}.nome`, ctx);

  const tipoRota = child(el, 'tipoRotaPadrao');
  if (tipoRota) valEnum(txt(tipoRota), [1, 2], `${path}.tipoRotaPadrao`, ctx);

  const pontosParada = requireChild(el, 'pontosParada', path, ctx);
  if (!pontosParada) return;

  const pontos = children(pontosParada, 'pontoParada');
  if (pontos.length < 2)
    ctx.err(`${path}.pontosParada`, `[RN-E04] "pontosParada" deve conter ao menos 2 "pontoParada" (${pontos.length} informado(s))`);

  pontos.forEach((pp, i) =>
    validatePontoParada(pp, `${path}.pontosParada.pontoParada[${i + 1}]`, ctx)
  );
}

// ─── viagem (TACagregado) ────────────────────────────────────────────────────

function validateViagem(el: Element, path: string, ctx: Ctx) {
  const rota = requireChild(el, 'rota', path, ctx);
  if (rota) {
    const rp = `${path}.rota`;
    const rotaERP = requireChild(rota, 'rotaERP', rp, ctx);
    if (rotaERP) valStrLen(txt(rotaERP), 1, 30, `${rp}.rotaERP`, ctx);

    const info = child(rota, 'informacoes');
    if (info) validateRotaInformacoes(info, `${rp}.informacoes`, ctx);
  }

  const totalKM = requireChild(el, 'totalKM', path, ctx);
  if (totalKM) {
    const v = txt(totalKM);
    if (!/^[0-9]+$/.test(v) || v.length > 8)
      ctx.err(`${path}.totalKM`, `Valor inválido: "${v}". Deve ser um inteiro com no máximo 8 dígitos`);
  }

  const qtdeViagens = requireChild(el, 'qtdeViagens', path, ctx);
  if (qtdeViagens) valInt(txt(qtdeViagens), 1, 99999, `${path}.qtdeViagens`, ctx);
}

// ─── encerramento ────────────────────────────────────────────────────────────

function validateEncerramentoEl(el: Element, path: string, ctx: Ctx) {
  const lotacao    = child(el, 'lotacao');
  const fracionado = child(el, 'fracionado');
  const tacAgregado = child(el, 'TACagregado');
  const found = [lotacao, fracionado, tacAgregado].filter(Boolean);

  if (found.length === 0) {
    ctx.err(path, '[RN-E01] É obrigatório informar exatamente um dos elementos: "lotacao", "fracionado" ou "TACagregado"');
    return;
  }
  if (found.length > 1) {
    ctx.err(path, '[RN-E01] Apenas um dos elementos deve ser informado: "lotacao", "fracionado" ou "TACagregado"');
    return;
  }

  if (lotacao) {
    const qtdeCarga = requireChild(lotacao, 'qtdeCarga', `${path}.lotacao`, ctx);
    if (qtdeCarga) valDecimal(txt(qtdeCarga), 12, 2, `${path}.lotacao.qtdeCarga`, ctx);
  }

  if (fracionado) {
    const encerrar = requireChild(fracionado, 'encerrar', `${path}.fracionado`, ctx);
    if (encerrar && txt(encerrar) !== '1')
      ctx.err(`${path}.fracionado.encerrar`, `[RN-E02] O campo "encerrar" deve ter valor 1 (recebido: "${txt(encerrar)}")`);
  }

  if (tacAgregado) {
    const tp = `${path}.TACagregado`;
    const viagens = requireChild(tacAgregado, 'viagens', tp, ctx);
    if (viagens) {
      const vp = `${tp}.viagens`;
      const viagemList = children(viagens, 'viagem');
      if (viagemList.length === 0)
        ctx.err(vp, 'Deve haver pelo menos uma "viagem"');
      viagemList.forEach((v, i) =>
        validateViagem(v, `${vp}.viagem[${i + 1}]`, ctx)
      );
    }
  }
}

// ─── infEnceOT ────────────────────────────────────────────────────────────────

function validateInfEnceOT(el: Element, ctx: Ctx) {
  const path = 'infEnceOT';

  const cnpj = requireChild(el, 'cnpj', path, ctx);
  if (cnpj) valCNPJ(txt(cnpj), `${path}.cnpj`, ctx);

  const autorizacao = requireChild(el, 'autorizacao', path, ctx);
  if (autorizacao) {
    const ap   = `${path}.autorizacao`;
    const ciot = requireChild(autorizacao, 'ciot', ap, ctx);
    if (ciot) {
      const cp  = `${ap}.ciot`;
      const num = requireChild(ciot, 'numero', cp, ctx);
      if (num && !/^[0-9]{12}$/.test(txt(num)))
        ctx.err(`${cp}.numero`, `Número CIOT inválido: "${txt(num)}". Deve conter exatamente 12 dígitos numéricos`);

      const cod = requireChild(ciot, 'ciotCodVerificador', cp, ctx);
      if (cod && txt(cod).length !== 4)
        ctx.err(`${cp}.ciotCodVerificador`, `Código verificador inválido: "${txt(cod)}". Deve conter exatamente 4 caracteres (ou "XXXX" para contingência)`);
    }
  }

  const encerramento = requireChild(el, 'encerramento', path, ctx);
  if (encerramento) validateEncerramentoEl(encerramento, `${path}.encerramento`, ctx);
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function validateRoot(doc: Document, ctx: Ctx) {
  const root = doc.documentElement;

  if (root.localName !== 'encerrarOT_envio') {
    ctx.err('/', `Elemento raiz inválido: "${root.localName}". Esperado: "encerrarOT_envio"`);
    return;
  }

  const versao = root.getAttribute('versao');
  if (!versao)
    ctx.err('encerrarOT_envio', 'Atributo obrigatório "versao" não encontrado');
  else if (versao !== '4.2.12.0')
    ctx.err('encerrarOT_envio@versao', `Versão inválida: "${versao}". O único valor aceito é "4.2.12.0"`);

  const token = root.getAttribute('token');
  if (!token)
    ctx.err('encerrarOT_envio', 'Atributo obrigatório "token" não encontrado');
  else if (token.length === 0 || token.length > 24)
    ctx.err('encerrarOT_envio@token', `Token inválido. Deve ter entre 1 e 24 caracteres`);

  const infEnceOT = requireChild(root, 'infEnceOT', 'encerrarOT_envio', ctx);
  if (infEnceOT) validateInfEnceOT(infEnceOT, ctx);

  const sigNS = 'http://www.w3.org/2000/09/xmldsig#';
  const sig =
    root.getElementsByTagNameNS(sigNS, 'Signature')[0] ??
    Array.from(root.children).find(c => c.localName === 'Signature');
  if (!sig)
    ctx.err('encerrarOT_envio', 'Assinatura digital (ds:Signature) não encontrada. Este campo é obrigatório');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function validateEncerramento(xmlString: string): ValidationResult {
  if (!xmlString.trim())
    return { valid: false, errors: [], parseError: 'O conteúdo do XML está vazio', otCount: 0 };

  const { xml: processedXml, injected } = injectDsNamespace(xmlString);
  const warnings: string[] = [];
  if (injected)
    warnings.push(
      'O namespace "xmlns:ds" não foi encontrado na tag raiz e foi injetado automaticamente para que o parse pudesse ser concluído. ' +
      'Verifique se o seu código declara xmlns:ds="http://www.w3.org/2000/09/xmldsig#" no elemento raiz <encerrarOT_envio>.',
    );

  const parser = new DOMParser();
  const doc = parser.parseFromString(processedXml, 'application/xml');

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
  validateRoot(doc, ctx);
  return { valid: ctx.errors.length === 0, errors: ctx.errors, otCount: ctx.errors.length === 0 ? 1 : 0, warnings };
}
