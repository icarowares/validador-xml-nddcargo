import type { ValidationError, ValidationResult } from './types';

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
function reqNum(o: Obj, f: string, base: string, allowed: number[], errs: Errors): void {
  const v = o[f]; const p = `${base}.${f}`;
  if (v === undefined || v === null) { e(errs, p, 'Campo obrigatório não informado'); return; }
  if (!isNum(v) || !allowed.includes(v as number)) e(errs, p, `Valor inválido "${v}"; permitidos: ${allowed.join(', ')}`);
}
function optNum(o: Obj, f: string, base: string, allowed: number[], errs: Errors): void {
  const v = o[f]; if (v === undefined || v === null) return;
  if (!isNum(v) || !allowed.includes(v as number)) e(errs, `${base}.${f}`, `Valor inválido "${v}"; permitidos: ${allowed.join(', ')}`);
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

// ─── Address helpers ──────────────────────────────────────────────────────────

// Endereço com codigoMunicipio + CEP (remetente/destinatário)
function validateEnderecoMunicipio(raw: unknown, path: string, errs: Errors): void {
  if (!isObj(raw)) { e(errs, path, 'Deve ser um objeto'); return; }
  const uf = raw['UF'];
  if (uf === undefined || uf === null) e(errs, `${path}.UF`, 'Campo obrigatório não informado');
  else if (uf === '') e(errs, `${path}.UF`, ERR_EMPTY_REQ);
  else if (typeof uf !== 'string' || uf.length !== 2) e(errs, `${path}.UF`, `Deve ter exatamente 2 caracteres`);
  reqDigits(raw, 'codigoMunicipio', path, 7, errs);
  reqStr(raw, 'bairro', path, 1, 255, errs);
  reqStr(raw, 'logradouro', path, 1, 255, errs);
  reqStr(raw, 'numero', path, 1, 60, errs);
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
  const uf = raw['UF'];
  if (uf === undefined || uf === null) e(errs, `${path}.UF`, 'Campo obrigatório não informado');
  else if (uf === '') e(errs, `${path}.UF`, ERR_EMPTY_REQ);
  else if (typeof uf !== 'string' || uf.length !== 2) e(errs, `${path}.UF`, `Deve ter exatamente 2 caracteres`);
  reqStr(raw, 'cidade', path, 1, 100, errs);
  reqStr(raw, 'bairro', path, 1, 255, errs);
  reqStr(raw, 'logradouro', path, 1, 255, errs);
  optStr(raw, 'numero', path, 1, 8, errs);
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
  reqNum(raw, 'tipoOperacao', path, [1, 2, 3], errs);
  reqStr(raw, 'numero', path, 1, 9, errs);
  reqStr(raw, 'serie', path, 1, 4, errs);
  reqStr(raw, 'ptEmissor', path, 1, 30, errs);
  optDate(raw, 'dtInicio', path, errs);
  optDate(raw, 'dtFim', path, errs);
  optStr(raw, 'contrato', path, 1, 50, errs);
  optNum(raw, 'gerPgtoFin', path, [1, 2, 3, 4, 5, 6], errs);

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

    const qtd = raw['quantidade'];
    if (qtd === undefined || qtd === null) e(errs, `${path}.quantidade`, 'Campo obrigatório não informado');
    else if (!isNum(qtd) || (qtd as number) <= 0) e(errs, `${path}.quantidade`, 'Deve ser um número maior que zero');

    const tipoCarga = raw['CodigoTipoCarga'];
    if (tipoCarga === undefined || tipoCarga === null) e(errs, `${path}.CodigoTipoCarga`, 'Campo obrigatório não informado');
    else if (!isNum(tipoCarga) || (tipoCarga as number) < 1 || (tipoCarga as number) > 12)
      e(errs, `${path}.CodigoTipoCarga`, `Deve ser entre 1 e 12 (recebido: "${tipoCarga}")`);

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
        const cpf = isObj(item) ? item['cpfCnpj'] : item;
        if (!isCpfCnpj(cpf)) e(errs, fp, `Deve ter 11 (CPF) ou 14 (CNPJ) dígitos`);
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

  if (!isObj(raw['cadastro'])) { e(errs, `${path}.cadastro`, 'Campo obrigatório não informado'); return; }
  const c = raw['cadastro'] as Obj;
  const cp = `${path}.cadastro`;

  reqStr(c, 'nomeRazao', cp, 1, 150, errs);
  reqTel(c, 'telefone', cp, errs);
  optStr(c, 'email', cp, 1, 255, errs);
  reqNum(c, 'tipo', cp, [1, 2, 3], errs);
  const tipo = isNum(c['tipo']) ? (c['tipo'] as number) : null;

  if (tipo === 2 || tipo === 3) {
    reqStr(c, 'inscEstadual', cp, 1, 14, errs);
    reqStr(c, 'atividadePrincipal', cp, 1, 100, errs);
    reqStr(c, 'formaConstituicao', cp, 5, 5, errs);
    reqDate(c, 'dataConstituicao', cp, errs);
  } else {
    optStr(c, 'inscEstadual', cp, 1, 14, errs);
  }

  if (isObj(c['endereco'])) validateEnderecoCidade(c['endereco'], `${cp}.endereco`, errs);

  if (tipo === 1) {
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
        optStr(socio, 'email', sp, 1, 255, errs);
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
  let allHaveCadastro = true;

  raw.forEach((veic, i) => {
    const vp = `${path}[${i}]`;
    if (!isObj(veic)) { e(errs, vp, 'Deve ser um objeto'); allHaveCadastro = false; return; }

    const placa = veic['placa'];
    if (placa === undefined || placa === null) e(errs, `${vp}.placa`, 'Campo obrigatório não informado');
    else if (placa === '') e(errs, `${vp}.placa`, ERR_EMPTY_REQ);
    else if (typeof placa !== 'string' || placa.length !== 7) e(errs, `${vp}.placa`, `Deve ter exatamente 7 caracteres (recebido: "${placa}")`);

    reqDigits(veic, 'RNTRCTransportador', vp, 9, errs);

    const eixos = veic['eixos'];
    if (eixos === undefined || eixos === null) e(errs, `${vp}.eixos`, 'Campo obrigatório não informado');
    else if (!isNum(eixos)) e(errs, `${vp}.eixos`, 'Deve ser um número');

    if (isObj(veic['cadastro'])) {
      const c = veic['cadastro'] as Obj;
      const cp = `${vp}.cadastro`;
      reqStr(c, 'modelo', cp, 1, 100, errs);
      const tipo = c['tipo'];
      if (tipo === undefined || tipo === null) e(errs, `${cp}.tipo`, 'Campo obrigatório não informado');
      else if (!isNum(tipo) || ![1, 2].includes(tipo as number)) e(errs, `${cp}.tipo`, `Deve ser 1 (Tração) ou 2 (Reboque) (recebido: "${tipo}")`);
      if (isNum(tipo) && tipo === 1) automotorCount++;
      optDecimal(c, 'kmLitroModelo', cp, errs);
      optDecimal(c, 'kmLitroVeiculo', cp, errs);
    } else {
      allHaveCadastro = false;
    }
  });

  if (allHaveCadastro) {
    if (automotorCount === 0) e(errs, path, 'Ao menos um veículo deve ser do tipo automotor (cadastro.tipo=1)');
    if (automotorCount > 1) e(errs, path, 'Apenas um veículo deve ser do tipo automotor (cadastro.tipo=1)');
  }
}

function validateValores(raw: unknown, errs: Errors): void {
  const path = 'valores';
  if (!isObj(raw)) { e(errs, path, 'Campo obrigatório não informado'); return; }

  const vlrFrete = raw['vlrFrete'];
  if (vlrFrete === undefined || vlrFrete === null) e(errs, `${path}.vlrFrete`, 'Campo obrigatório não informado');
  else if (!isNum(vlrFrete) || (vlrFrete as number) <= 0) e(errs, `${path}.vlrFrete`, 'Deve ser um número maior que zero');

  optDecimal(raw, 'vlrCombustivel', path, errs);
  optDecimal(raw, 'vlrPedagio', path, errs);
  reqNum(raw, 'tipoRateio', path, [1, 2, 3, 4, 5], errs);

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
          reqNum(parc, 'tipoPgto', parcPath, [1, 2, 3], errs);
          reqNum(parc, 'finalidadeParcela', parcPath, [1, 2], errs);
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
      }
    }
  }

  if (isObj(raw['dadosBancarios'])) {
    const db = raw['dadosBancarios'] as Obj; const dbp = `${path}.dadosBancarios`;
    reqNum(db, 'tipoPagamento', dbp, [1, 2, 3, 4, 5, 6], errs);
    optStr(db, 'codigoInstituicaoFinanceira', dbp, 1, 10, errs);
    optStr(db, 'numeroAgencia', dbp, 1, 10, errs);
    optStr(db, 'digitoConta', dbp, 1, 5, errs);
    optStr(db, 'chavepix', dbp, 1, 77, errs);
    optCpfCnpj(db, 'cpfCnpjFavorecido', dbp, errs);
    optNum(db, 'tipoChave', dbp, [1, 2, 3, 4, 5], errs);
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
    const numEnd = end['numero'];
    if (numEnd === undefined || numEnd === null) e(errs, `${ep}.numero`, 'Campo obrigatório não informado');
    else if (numEnd === '') e(errs, `${ep}.numero`, ERR_EMPTY_REQ);
    reqStr(end, 'bairro', ep, 1, 255, errs);
    reqStr(end, 'cidade', ep, 1, 100, errs);
    const uf = end['uf'] ?? end['UF'];
    if (uf === undefined || uf === null) e(errs, `${ep}.uf`, 'Campo obrigatório não informado');
    else if (uf === '') e(errs, `${ep}.uf`, ERR_EMPTY_REQ);
    else if (typeof uf !== 'string' || uf.length !== 2) e(errs, `${ep}.uf`, 'Deve ter exatamente 2 caracteres');
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
