import type { ValidationError, ValidationResult } from './types';

// ─── Context ──────────────────────────────────────────────────────────────────

function createCtx() {
  const errors: ValidationError[] = [];
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

function valCPF(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{11}$/.test(value))
    ctx.err(path, `CPF inválido: "${value}". Deve conter exatamente 11 dígitos numéricos`);
}

function valData(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))
    ctx.err(path, `Data inválida: "${value}". Use o formato AAAA-MM-DD`);
}

function valDataHora(value: string, path: string, ctx: Ctx) {
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(value))
    ctx.err(path, `Data/hora inválida: "${value}". Use o formato AAAA-MM-DD HH:MM:SS`);
}

function valDecimal(value: string, totalDig: number, fracDig: number, path: string, ctx: Ctx) {
  if (!/^-?[0-9]+(\.[0-9]+)?$/.test(value)) {
    ctx.err(path, `Valor inválido: "${value}". Deve ser um número decimal`);
    return;
  }
  const parts = value.split('.');
  const intStr = parts[0].replace('-', '');
  const frac  = parts[1] ?? '';
  if (frac.length > fracDig)
    ctx.err(path, `Valor "${value}" possui mais de ${fracDig} casa(s) decimal(is)`);
  if (intStr.length + frac.length > totalDig)
    ctx.err(path, `Valor "${value}" excede o máximo de ${totalDig} dígitos`);
}

function valValor(value: string, path: string, ctx: Ctx) { valDecimal(value, 17, 2, path, ctx); }

function valEnum(value: string, allowed: number[], path: string, ctx: Ctx) {
  const num = parseInt(value, 10);
  if (!allowed.includes(num))
    ctx.err(path, `Valor inválido: "${value}". Valores permitidos: ${allowed.join(', ')}`);
}

function valStrLen(value: string, min: number, max: number, path: string, ctx: Ctx) {
  if (value.length < min)
    ctx.err(path, `Campo obrigatório não pode estar vazio (mínimo ${min} caractere(s))`);
  else if (value.length > max)
    ctx.err(path, `Valor excede o limite de ${max} caractere(s) (${value.length} informados)`);
}

function valMaxLen(value: string, max: number, path: string, ctx: Ctx) {
  if (value.length > max)
    ctx.err(path, `Valor excede o limite de ${max} caractere(s) (${value.length} informados)`);
}

// ─── Retencoes (compartilhado) ────────────────────────────────────────────────

function validateRetencoes(el: Element, path: string, ctx: Ctx, withRubrica = false) {
  const irrf = requireChild(el, 'irrf', path, ctx);
  if (irrf) valValor(txt(irrf), `${path}.irrf`, ctx);
  const inss = requireChild(el, 'inss', path, ctx);
  if (inss) valValor(txt(inss), `${path}.inss`, ctx);
  const ss = requireChild(el, 'sestsenat', path, ctx);
  if (ss) valValor(txt(ss), `${path}.sestsenat`, ctx);
  if (withRubrica) {
    const rub = requireChild(el, 'rubrica', path, ctx);
    if (rub) valEnum(txt(rub), [1, 2, 3], `${path}.rubrica`, ctx);
  }
}

// ─── dadosBancarios ───────────────────────────────────────────────────────────

function validateDadosBancarios(el: Element, path: string, ctx: Ctx) {
  const tipoChave = child(el, 'tipoChave');
  if (tipoChave) valEnum(txt(tipoChave), [1, 2, 3, 4, 5], `${path}.tipoChave`, ctx);

  const codigoIF = child(el, 'codigoInstituicaoFinanceira');
  if (codigoIF) valMaxLen(txt(codigoIF), 3, `${path}.codigoInstituicaoFinanceira`, ctx);

  const agencia = child(el, 'numeroAgencia');
  if (agencia) valStrLen(txt(agencia), 1, 6, `${path}.numeroAgencia`, ctx);

  const conta = child(el, 'numeroConta');
  if (conta) valStrLen(txt(conta), 1, 20, `${path}.numeroConta`, ctx);

  const digito = child(el, 'digitoConta');
  if (digito) valMaxLen(txt(digito), 1, `${path}.digitoConta`, ctx);

  const chavePix = child(el, 'chavePix');
  if (chavePix) valStrLen(txt(chavePix), 1, 64, `${path}.chavePix`, ctx);
}

// ─── ANTT ─────────────────────────────────────────────────────────────────────

function validateANTT(el: Element, path: string, ctx: Ctx) {
  const fracionado = child(el, 'fracionado');
  const tacAgregado = child(el, 'TACagregado');

  if (!fracionado && !tacAgregado) {
    ctx.err(path, 'É obrigatório informar "fracionado" ou "TACagregado"');
    return;
  }
  if (fracionado && tacAgregado) {
    ctx.err(path, 'Apenas "fracionado" ou "TACagregado" deve ser informado, não ambos');
    return;
  }

  if (fracionado) {
    const carga = child(fracionado, 'carga');
    if (carga) {
      const cp = `${path}.fracionado.carga`;
      const sh  = child(carga, 'codigoSH');
      const qtd = child(carga, 'quantidade');
      const ctc = child(carga, 'CodigoTipoCarga');

      if (!sh && !qtd && !ctc)
        ctx.err(cp, '[RN-R03] O bloco "carga" deve conter ao menos um campo: "codigoSH", "quantidade" ou "CodigoTipoCarga"');

      if (sh && !/^[0-9]{4}$/.test(txt(sh)))
        ctx.err(`${cp}.codigoSH`, `Código SH inválido: "${txt(sh)}". Deve conter exatamente 4 dígitos numéricos`);

      if (qtd) valDecimal(txt(qtd), 12, 2, `${cp}.quantidade`, ctx);

      if (ctc) {
        const v = parseInt(txt(ctc), 10);
        if (v < 1 || v > 12)
          ctx.err(`${cp}.CodigoTipoCarga`, `Valor inválido: "${txt(ctc)}". Deve ser entre 1 e 12`);
      }
    }
  }

  if (tacAgregado) {
    const dtFim = requireChild(tacAgregado, 'dtFim', `${path}.TACagregado`, ctx);
    if (dtFim) valData(txt(dtFim), `${path}.TACagregado.dtFim`, ctx);
  }
}

// ─── tipoPgto ─────────────────────────────────────────────────────────────────

function validateTipoPgto(el: Element, path: string, ctx: Ctx) {
  const manual    = child(el, 'manual');
  const automatico = child(el, 'automatico');
  const imediato  = child(el, 'imediato');
  const found = [manual, automatico, imediato].filter(Boolean);

  if (found.length === 0) {
    ctx.err(path, 'Deve informar "manual", "automatico" ou "imediato"');
    return;
  }
  if (found.length > 1) {
    ctx.err(path, 'Apenas um tipo de pagamento deve ser informado: "manual", "automatico" ou "imediato"');
    return;
  }

  if (manual) {
    const mp = `${path}.manual`;
    const dtPrev = requireChild(manual, 'dataPrevisao', mp, ctx);
    if (dtPrev) valData(txt(dtPrev), `${mp}.dataPrevisao`, ctx);
    const efet = child(manual, 'efetivacao');
    if (efet) valEnum(txt(efet), [1, 2, 3, 4], `${mp}.efetivacao`, ctx);
  } else if (automatico) {
    const ap = `${path}.automatico`;
    const dh = requireChild(automatico, 'dataHora', ap, ctx);
    if (dh) valDataHora(txt(dh), `${ap}.dataHora`, ctx);
  } else if (imediato) {
    valEnum(txt(imediato), [2], `${path}.imediato`, ctx);
  }
}

// ─── novaParc ─────────────────────────────────────────────────────────────────

function validateNovaParc(el: Element, path: string, ctx: Ctx) {
  const nome = requireChild(el, 'nome', path, ctx);
  if (nome) valStrLen(txt(nome), 1, 50, `${path}.nome`, ctx);

  const tipoPgto = requireChild(el, 'tipoPgto', path, ctx);
  if (tipoPgto) validateTipoPgto(tipoPgto, `${path}.tipoPgto`, ctx);

  const vlrAplicado = requireChild(el, 'valorAplicado', path, ctx);
  if (vlrAplicado) valValor(txt(vlrAplicado), `${path}.valorAplicado`, ctx);

  const vlrReal = child(el, 'valorReal');
  if (vlrReal) valValor(txt(vlrReal), `${path}.valorReal`, ctx);

  const descontos = child(el, 'descontos');
  if (descontos) {
    const dp = `${path}.descontos`;
    const list = children(descontos, 'desconto');
    if (list.length === 0) ctx.err(dp, 'Deve haver pelo menos um "desconto"');
    list.forEach((d, i) => {
      const p = `${dp}.desconto[${i + 1}]`;
      const nm = requireChild(d, 'nmDesc', p, ctx);
      if (nm) valStrLen(txt(nm), 1, 50, `${p}.nmDesc`, ctx);
      const vlrD = child(d, 'vlrDesc');
      if (vlrD) valStrLen(txt(vlrD), 1, 15, `${p}.vlrDesc`, ctx);
      const dsD = child(d, 'dsDesc');
      if (dsD) valStrLen(txt(dsD), 1, 255, `${p}.dsDesc`, ctx);
    });
  }

  const retencoes = child(el, 'retencoes');
  if (retencoes) validateRetencoes(retencoes, `${path}.retencoes`, ctx, true);

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

// ─── altValores ───────────────────────────────────────────────────────────────

function validateAltValores(el: Element, path: string, ctx: Ctx) {
  const adicional         = child(el, 'adicional');
  const desconto          = child(el, 'desconto');
  const retencoes         = child(el, 'retencoes');
  const descontoRetencoes = child(el, 'descontoRetencoes');
  const found = [adicional, desconto, retencoes, descontoRetencoes].filter(Boolean);

  if (found.length === 0)
    ctx.err(path, '[RN-R04] É obrigatório informar um dos elementos: "adicional", "desconto", "retencoes" ou "descontoRetencoes"');
  else if (found.length > 1)
    ctx.err(path, '[RN-R04] Apenas um dos elementos deve ser informado: "adicional", "desconto", "retencoes" ou "descontoRetencoes"');

  if (adicional) {
    const ap = `${path}.adicional`;
    const valor   = requireChild(adicional, 'valor', ap, ctx);
    if (valor) valValor(txt(valor), `${ap}.valor`, ctx);
    const rubrica = requireChild(adicional, 'rubrica', ap, ctx);
    if (rubrica) valEnum(txt(rubrica), [1, 2, 3, 4], `${ap}.rubrica`, ctx);
  }

  if (desconto) {
    const dp = `${path}.desconto`;
    const nm = requireChild(desconto, 'nmDesc', dp, ctx);
    if (nm) valStrLen(txt(nm), 1, 50, `${dp}.nmDesc`, ctx);
    const vlrD = child(desconto, 'vlrDesc');
    if (vlrD) valStrLen(txt(vlrD), 1, 15, `${dp}.vlrDesc`, ctx);
    const dsD = child(desconto, 'dsDesc');
    if (dsD) valStrLen(txt(dsD), 1, 255, `${dp}.dsDesc`, ctx);
    const rub = child(desconto, 'rubrica');
    if (rub) valEnum(txt(rub), [1, 2, 3, 4], `${dp}.rubrica`, ctx);
  }

  if (retencoes) validateRetencoes(retencoes, `${path}.retencoes`, ctx, false);
  if (descontoRetencoes) validateRetencoes(descontoRetencoes, `${path}.descontoRetencoes`, ctx, false);

  const vlrVal = child(el, 'valorValidacao');
  if (vlrVal) valValor(txt(vlrVal), `${path}.valorValidacao`, ctx);
}

// ─── ajustaParc ───────────────────────────────────────────────────────────────

function validateAjustaParc(el: Element, path: string, ctx: Ctx) {
  const nome = requireChild(el, 'nome', path, ctx);
  if (nome) valStrLen(txt(nome), 1, 50, `${path}.nome`, ctx);

  const altData    = child(el, 'altData');
  const altValores = child(el, 'altValores');
  const prazoMin   = child(el, 'prazoMinimo');
  const confirmar  = child(el, 'confirmarPgto');
  const transauto  = child(el, 'transferenciaAutomatica');
  const dadosBanc  = child(el, 'dadosBancarios');

  if (!altData && !altValores && !prazoMin && !confirmar && !transauto && !dadosBanc)
    ctx.err(path, '[RN-R05] É obrigatório informar ao menos um dos elementos: "altData", "altValores", "prazoMinimo", "confirmarPgto", "transferenciaAutomatica" ou "dadosBancarios"');

  if (altData) {
    const data = requireChild(altData, 'data', `${path}.altData`, ctx);
    if (data) valDataHora(txt(data), `${path}.altData.data`, ctx);
  }

  if (altValores) validateAltValores(altValores, `${path}.altValores`, ctx);

  if (prazoMin) valEnum(txt(prazoMin), [1, 2, 3], `${path}.prazoMinimo`, ctx);

  if (confirmar) valEnum(txt(confirmar), [1, 2], `${path}.confirmarPgto`, ctx);

  if (transauto) {
    const tap = `${path}.transferenciaAutomatica`;
    const novaCfg    = child(transauto, 'novaConfiguracao');
    const removerCfg = child(transauto, 'removerConfiguracao');
    const tfound = [novaCfg, removerCfg].filter(Boolean);

    if (tfound.length === 0)
      ctx.err(tap, 'É obrigatório informar "novaConfiguracao" ou "removerConfiguracao"');
    else if (tfound.length > 1)
      ctx.err(tap, 'Apenas "novaConfiguracao" ou "removerConfiguracao" deve ser informado');

    if (novaCfg) {
      const np = `${tap}.novaConfiguracao`;
      const cpf = requireChild(novaCfg, 'cpfCondutor', np, ctx);
      if (cpf) valCPF(txt(cpf), `${np}.cpfCondutor`, ctx);
      const fin = requireChild(novaCfg, 'finalidadeParcela', np, ctx);
      if (fin) valEnum(txt(fin), [1, 2], `${np}.finalidadeParcela`, ctx);
    }

    if (removerCfg) {
      const rp = `${tap}.removerConfiguracao`;
      const cpf = requireChild(removerCfg, 'cpfCondutor', rp, ctx);
      if (cpf) valCPF(txt(cpf), `${rp}.cpfCondutor`, ctx);
    }
  }

  if (dadosBanc) validateDadosBancarios(dadosBanc, `${path}.dadosBancarios`, ctx);
}

// ─── financeiro ───────────────────────────────────────────────────────────────

function validateFinanceiro(el: Element, path: string, ctx: Ctx) {
  const novaParc   = child(el, 'novaParc');
  const ajustaParc = child(el, 'ajustaParc');

  if (!novaParc && !ajustaParc) {
    ctx.err(path, 'É obrigatório informar "novaParc" ou "ajustaParc"');
    return;
  }
  if (novaParc && ajustaParc) {
    ctx.err(path, 'Apenas "novaParc" ou "ajustaParc" deve ser informado, não ambos');
    return;
  }

  if (novaParc)   validateNovaParc(novaParc, `${path}.novaParc`, ctx);
  if (ajustaParc) validateAjustaParc(ajustaParc, `${path}.ajustaParc`, ctx);
}

// ─── adicionais ───────────────────────────────────────────────────────────────

function validateAdicionais(el: Element, path: string, ctx: Ctx) {
  const campos = children(el, 'campo');
  if (campos.length === 0) {
    ctx.err(path, 'Deve haver pelo menos um "campo" dentro de "adicionais"');
    return;
  }
  campos.forEach((c, i) => {
    const cp = `${path}.campo[${i + 1}]`;
    const nome  = requireChild(c, 'nome', cp, ctx);
    if (nome) valStrLen(txt(nome), 1, 255, `${cp}.nome`, ctx);
    const valor = requireChild(c, 'valor', cp, ctx);
    if (valor) valStrLen(txt(valor), 1, 2000, `${cp}.valor`, ctx);
  });
}

// ─── semMF ────────────────────────────────────────────────────────────────────

function validateSemMF(el: Element, path: string, ctx: Ctx) {
  const valores = requireChild(el, 'valores', path, ctx);
  if (!valores) return;
  const vp = `${path}.valores`;

  const vlrFrete = child(valores, 'vlrFrete');
  if (vlrFrete) valValor(txt(vlrFrete), `${vp}.vlrFrete`, ctx);

  const despesas = child(valores, 'despesas');
  if (despesas) {
    const dp = `${vp}.despesas`;
    const vlrD = requireChild(despesas, 'vlrDespesas', dp, ctx);
    if (vlrD) valValor(txt(vlrD), `${dp}.vlrDespesas`, ctx);
    const desc = requireChild(despesas, 'descricao', dp, ctx);
    if (desc) valStrLen(txt(desc), 1, 2000, `${dp}.descricao`, ctx);
  }

  const retencoes = child(valores, 'retencoes');
  if (retencoes) validateRetencoes(retencoes, `${vp}.retencoes`, ctx, false);

  const vlrComb = child(valores, 'vlrCombustivel');
  if (vlrComb) valValor(txt(vlrComb), `${vp}.vlrCombustivel`, ctx);

  const vlrPed = child(valores, 'vlrPedagio');
  if (vlrPed) valValor(txt(vlrPed), `${vp}.vlrPedagio`, ctx);

  const desconto = child(valores, 'desconto');
  if (desconto) {
    const dp = `${vp}.desconto`;
    const nm  = requireChild(desconto, 'nmDesc', dp, ctx);
    if (nm) valStrLen(txt(nm), 1, 50, `${dp}.nmDesc`, ctx);
    const vlrD = requireChild(desconto, 'vlrDesc', dp, ctx);
    if (vlrD) valStrLen(txt(vlrD), 1, 15, `${dp}.vlrDesc`, ctx);
    const rub = requireChild(desconto, 'rubrica', dp, ctx);
    if (rub) valEnum(txt(rub), [1, 2, 3, 4], `${dp}.rubrica`, ctx);
    const dsD = child(desconto, 'dsDesc');
    if (dsD) valStrLen(txt(dsD), 1, 255, `${dp}.dsDesc`, ctx);
  }

  if (!vlrFrete && !despesas && !retencoes && !vlrComb && !vlrPed && !desconto)
    ctx.err(vp, '[RN-R01] "valores" deve conter ao menos um campo de valor');
}

// ─── alteracao ────────────────────────────────────────────────────────────────

function validateAlteracao(el: Element, path: string, ctx: Ctx) {
  const antt       = child(el, 'ANTT');
  const financeiro = child(el, 'financeiro');
  const adicionais = child(el, 'adicionais');
  const semMF      = child(el, 'semMF');
  const found = [antt, financeiro, adicionais, semMF].filter(Boolean);

  if (found.length === 0)
    ctx.err(path, '[RN-R02] É obrigatório informar exatamente um dos elementos: "ANTT", "financeiro", "adicionais" ou "semMF"');
  else if (found.length > 1)
    ctx.err(path, '[RN-R02] Apenas um dos elementos deve ser informado: "ANTT", "financeiro", "adicionais" ou "semMF"');

  if (antt)       validateANTT(antt, `${path}.ANTT`, ctx);
  if (financeiro) validateFinanceiro(financeiro, `${path}.financeiro`, ctx);
  if (adicionais) validateAdicionais(adicionais, `${path}.adicionais`, ctx);
  if (semMF)      validateSemMF(semMF, `${path}.semMF`, ctx);

  const docOrig = requireChild(el, 'documentoOriginario', path, ctx);
  if (docOrig) {
    const dp = `${path}.documentoOriginario`;
    const tipo = requireChild(docOrig, 'tipo', dp, ctx);
    if (tipo) valStrLen(txt(tipo), 1, 40, `${dp}.tipo`, ctx);
    const num  = requireChild(docOrig, 'numero', dp, ctx);
    if (num)  valStrLen(txt(num), 1, 44, `${dp}.numero`, ctx);
  }
}

// ─── infOT ────────────────────────────────────────────────────────────────────

function validateInfOT(el: Element, path: string, ctx: Ctx) {
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

  const alteracoes = requireChild(el, 'alteracoes', path, ctx);
  if (alteracoes) {
    const altList = children(alteracoes, 'alteracao');
    if (altList.length === 0)
      ctx.err(`${path}.alteracoes`, 'Deve haver pelo menos uma "alteracao"');
    altList.forEach((alt, i) =>
      validateAlteracao(alt, `${path}.alteracoes.alteracao[${i + 1}]`, ctx)
    );
  }

  const motivo = requireChild(el, 'motivo', path, ctx);
  if (motivo) valStrLen(txt(motivo), 1, 1000, `${path}.motivo`, ctx);
}

// ─── OT ───────────────────────────────────────────────────────────────────────

function validateOT(el: Element, index: number, ctx: Ctx) {
  const path  = `OT[${index}]`;
  const infOT = requireChild(el, 'infOT', path, ctx);
  if (infOT) validateInfOT(infOT, `${path}.infOT`, ctx);

  const sigNS = 'http://www.w3.org/2000/09/xmldsig#';
  const sig =
    el.getElementsByTagNameNS(sigNS, 'Signature')[0] ??
    Array.from(el.children).find(c => c.localName === 'Signature');
  if (!sig)
    ctx.err(path, 'Assinatura digital (ds:Signature) não encontrada. Este campo é obrigatório');
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function validateRoot(doc: Document, ctx: Ctx): number {
  const root = doc.documentElement;

  if (root.localName !== 'alterarOT_envio') {
    ctx.err('/', `Elemento raiz inválido: "${root.localName}". Esperado: "alterarOT_envio"`);
    return 0;
  }

  const versao = root.getAttribute('versao');
  if (!versao)
    ctx.err('alterarOT_envio', 'Atributo obrigatório "versao" não encontrado');
  else if (versao.length === 0 || versao.length > 7)
    ctx.err('alterarOT_envio@versao', `Versão inválida: "${versao}". Deve ter entre 1 e 7 caracteres`);

  const token = root.getAttribute('token');
  if (!token)
    ctx.err('alterarOT_envio', 'Atributo obrigatório "token" não encontrado');
  else if (token.length === 0 || token.length > 24)
    ctx.err('alterarOT_envio@token', `Token inválido. Deve ter entre 1 e 24 caracteres`);

  const ots = children(root, 'OT');
  if (ots.length === 0) {
    ctx.err('alterarOT_envio', 'Deve haver pelo menos uma "OT"');
    return 0;
  }

  ots.forEach((ot, i) => validateOT(ot, i + 1, ctx));
  return ots.length;
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function validateRetificacao(xmlString: string): ValidationResult {
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
  return { valid: ctx.errors.length === 0, errors: ctx.errors, otCount };
}
