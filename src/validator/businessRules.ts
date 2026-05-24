import type { ValidationError } from './types';
import { CODIGOS_SH } from '../data/codigoSH';
import { CODIGOS_TIPO_CARGA, TIPO_CARGA_LISTA } from '../data/codigoTipoCarga';

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function child(el: Element | undefined, name: string): Element | undefined {
  if (!el) return undefined;
  return Array.from(el.children).find(c => c.localName === name);
}

function children(el: Element | undefined, name: string): Element[] {
  if (!el) return [];
  return Array.from(el.children).filter(c => c.localName === name);
}

function txt(el: Element | undefined): string {
  return el?.textContent?.trim() ?? '';
}

// ─── Dígitos verificadores ────────────────────────────────────────────────────

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

// ─── codigoSH válidos (alimentado via src/data/codigoSH.ts) ──────────────────
const VALID_CODIGO_SH = new Set(CODIGOS_SH.map(e => e.codigo));

// ─── codigoTipoCarga válidos (1–12) ──────────────────────────────────────────
const VALID_CODIGO_TIPO_CARGA = new Set(CODIGOS_TIPO_CARGA.map(e => e.codigo));

// ─── Entry point ──────────────────────────────────────────────────────────────

export function applyBusinessRules(doc: Document): { errors: ValidationError[]; warnings: string[] } {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  const err = (path: string, msg: string) => errors.push({ path, message: msg });

  const operacoes = child(doc.documentElement, 'operacoes');
  if (!operacoes) return { errors, warnings };

  children(operacoes, 'OT').forEach((ot, i) => {
    const idx = i + 1;
    const infOT = child(ot, 'infOT');
    if (!infOT) return;

    const ip = `OT[${idx}].infOT`;
    const gpf = parseInt(infOT.getAttribute('gerPgtoFin') ?? '', 10);

    const ide        = child(infOT, 'ide');
    const carga      = child(infOT, 'carga');
    const transp     = child(infOT, 'transp');
    const confirmador = child(infOT, 'confirmador');

    const lotacao    = child(carga, 'lotacao');
    const fracionado = child(carga, 'fracionado');
    const tacEl      = child(carga, 'TACagregado');
    const isLotFrac  = !!(lotacao || fracionado);
    const isTAC      = !!tacEl;

    const tp  = `${ip}.transp`;
    const cp  = `${ip}.carga`;
    const vp  = `${tp}.valores`;
    const valEl = child(transp, 'valores');
    const dbEl  = child(valEl, 'dadosBancarios');
    const dbp   = `${vp}.dadosBancarios`;

    // Parcelas
    const parcelaList = children(child(child(child(valEl, 'parcelamento'), 'informacoes'), 'parcelas'), 'parcela');
    const parcBase    = `${vp}.parcelamento.informacoes.parcelas`;

    // ── RN-03 ─────────────────────────────────────────────────────────────────
    const dtInicio = child(ide, 'dtInicio');
    if (isLotFrac && !dtInicio)
      err(`${ip}.ide.dtInicio`, '[RN-03] "dtInicio" é obrigatório para operações de lotação ou fracionado');
    if (isTAC && dtInicio)
      err(`${ip}.ide.dtInicio`, '[RN-03] "dtInicio" não deve ser informado em operações TACagregado');

    // ── RN-04 ─────────────────────────────────────────────────────────────────
    if (isLotFrac && transp && !child(transp, 'rota'))
      err(`${tp}.rota`, '[RN-04] "rota" é obrigatória para operações de lotação ou fracionado');

    // Regra: gerPgtoFin=5 não pode ser usado com transportador TAC (Pessoa Física)
    if (gpf === 5 && transp && child(transp, 'cpfTransportador'))
      err(`${ip}.infOT`,
        'gerPgtoFin=5 (Outros) não é permitido para transportador TAC (Pessoa Física). ' +
        'Apenas transportadores ETC ou CTC (Pessoa Jurídica) podem utilizar pagamento externo ao NDD Cargo.');

    // ── RN-05 ─────────────────────────────────────────────────────────────────
    if ([1, 6].includes(gpf) && transp && !child(transp, 'condutores'))
      err(`${tp}.condutores`, '[RN-05] "condutores" é obrigatório quando gerPgtoFin indica movimentação financeira via NDD Cargo (1 ou 6)');

    // ── RN-06 ─────────────────────────────────────────────────────────────────
    if (transp && !child(transp, 'cpfTransportador') && !child(transp, 'cnpjTransportador'))
      err(tp, '[RN-06] É obrigatório informar "cpfTransportador" ou "cnpjTransportador" em transp');

    // ── RN-07 ─────────────────────────────────────────────────────────────────
    if (isTAC && tacEl) {
      const tacPath = `${cp}.TACagregado`;
      if (child(tacEl, 'codigoSH'))
        err(`${tacPath}.codigoSH`,   '[RN-07] "codigoSH" não deve ser informado em operações TACagregado');
      if (child(tacEl, 'quantidade'))
        err(`${tacPath}.quantidade`, '[RN-07] "quantidade" não deve ser informado em operações TACagregado');
      if (child(tacEl, 'destinatario'))
        err(`${tacPath}.destinatario`, '[RN-07] "destinatario" não deve ser informado em operações TACagregado');
    }

    // ── RN-17 ─────────────────────────────────────────────────────────────────
    const veicList = children(child(transp, 'veiculos'), 'veiculo');
    const tracaoCount = veicList.filter(v => txt(child(child(v, 'informacoes'), 'tipo')) === '1').length;
    if (veicList.length > 0) {
      if (tracaoCount === 0)
        err(`${tp}.veiculos`, '[RN-17] Deve haver exatamente 1 veículo de tração (tipo=1)');
      else if (tracaoCount > 1)
        err(`${tp}.veiculos`, `[RN-17] Apenas 1 veículo de tração (tipo=1) é permitido (${tracaoCount} informados)`);
    }

    // ── RN-18 ─────────────────────────────────────────────────────────────────
    {
      const seen = new Set<string>();
      veicList.forEach(v => {
        const placa = txt(child(v, 'placa'));
        if (!placa) return;
        if (seen.has(placa))
          err(`${tp}.veiculos`, `[RN-18] Placa duplicada na mesma OT: "${placa}"`);
        else
          seen.add(placa);
      });
    }

    // ── RN-21 ─────────────────────────────────────────────────────────────────
    veicList.forEach((v, vi) => {
      const info  = child(v, 'informacoes');
      const tipo  = parseInt(txt(child(info, 'tipo')), 10);
      const eixos = parseInt(txt(child(info, 'qtdEixos')), 10);
      if (isNaN(tipo) || isNaN(eixos)) return;
      const qp = `${tp}.veiculos.veiculo[${vi + 1}].informacoes.qtdEixos`;
      if (tipo === 1 && ![2, 3, 4].includes(eixos))
        err(qp, `[RN-21] Veículo de tração (tipo=1) deve ter 2, 3 ou 4 eixos (informado: ${eixos})`);
      else if (tipo === 2 && ![1, 2, 3, 4].includes(eixos))
        err(qp, `[RN-21] Reboque (tipo=2) deve ter 1, 2, 3 ou 4 eixos (informado: ${eixos})`);
    });

    // ── RN-29 ─────────────────────────────────────────────────────────────────
    if ([3, 4, 6].includes(gpf) && valEl && !dbEl)
      err(dbp, `[RN-29] "dadosBancarios" é obrigatório quando gerPgtoFin=${gpf}`);

    // ── RN-30 ─────────────────────────────────────────────────────────────────
    if (gpf === 6 && dbEl) {
      const tc       = parseInt(txt(child(dbEl, 'tipoChave')), 10);
      const chavePix = child(dbEl, 'chavePix');
      if (!isNaN(tc) && tc === 5 && chavePix)
        err(`${dbp}.chavePix`, '[RN-30] "chavePix" não deve ser informado quando tipoChave=5 (dados bancários)');
      else if ((isNaN(tc) || tc !== 5) && !chavePix)
        err(`${dbp}.chavePix`, '[RN-30] "chavePix" é obrigatório quando gerPgtoFin=6 e tipoChave ≠ 5');
    }
    if (gpf !== 6 && dbEl && child(dbEl, 'tipoChave'))
      err(`${dbp}.tipoChave`, '[RN-30] "tipoChave" só deve ser informado quando gerPgtoFin=6');

    // ── RN-31 ─────────────────────────────────────────────────────────────────
    if (dbEl) {
      const tc = parseInt(txt(child(dbEl, 'tipoChave')), 10);
      if ([2, 3, 4].includes(gpf) || tc === 5) {
        for (const f of ['codigoInstituicaoFinanceira', 'numeroAgencia', 'numeroConta', 'cpfCnpjFavorecido']) {
          if (!child(dbEl, f))
            err(`${dbp}.${f}`, `[RN-31] "${f}" é obrigatório quando gerPgtoFin IN (2,3,4) ou tipoChave=5`);
        }
      }
    }

    // RN-32 removida — TED (tipoPagamento=1) volta a ser aceito

    // tipoPagamento não deve ser informado quando gerPgtoFin ∈ {2,3,4,5}
    if ([2, 3, 4, 5].includes(gpf) && dbEl && child(dbEl, 'tipoPagamento'))
      err(`${dbp}.tipoPagamento`,
        `"tipoPagamento" não deve ser informado quando gerPgtoFin=${gpf} — o pagamento é gerenciado externamente ao NDD Cargo`);

    // ── RN-35 ─────────────────────────────────────────────────────────────────
    if (valEl && parcelaList.length > 0) {
      const vlrFrete = parseFloat(txt(child(valEl, 'vlrFrete')));
      if (!isNaN(vlrFrete)) {
        const soma = parcelaList.reduce((s, p) => {
          const v = parseFloat(txt(child(p, 'valorAplicado')));
          return isNaN(v) ? s : s + v;
        }, 0);
        if (Math.abs(soma - vlrFrete) > 0.005)
          err(vp, `[RN-35] Soma dos valorAplicado (${soma.toFixed(2)}) difere do vlrFrete (${vlrFrete.toFixed(2)})`);
      }
    }

    // ── RN-37 ─────────────────────────────────────────────────────────────────
    parcelaList.forEach((p, pi) => {
      if (txt(child(child(child(p, 'tipoPgto'), 'manual'), 'efetivacao')) === '4' && !confirmador)
        err(`${ip}.confirmador`, `[RN-37] "confirmador" é obrigatório quando efetivacao=4 (parcela ${pi + 1})`);
    });

    // ── RN-38 ─────────────────────────────────────────────────────────────────
    parcelaList.forEach((p, pi) => {
      if (txt(child(p, 'confirmarPgto')) === '1' && !confirmador)
        err(`${ip}.confirmador`, `[RN-38] "confirmador" é obrigatório quando confirmarPgto=1 (parcela ${pi + 1})`);
    });

    // ── RN-39 ─────────────────────────────────────────────────────────────────
    const cpfsCondutores = children(child(transp, 'condutores'), 'condutor')
      .map(c => txt(child(c, 'cpf')))
      .filter(Boolean);
    parcelaList.forEach((p, pi) => {
      const cpfCond = txt(child(child(p, 'transferenciaAutomatica'), 'cpfCondutor'));
      if (cpfCond && !cpfsCondutores.includes(cpfCond))
        err(
          `${parcBase}.parcela[${pi + 1}].transferenciaAutomatica.cpfCondutor`,
          `[RN-39] CPF "${cpfCond}" não corresponde a nenhum condutor listado em transp/condutores`,
        );
    });

    // ── RN-40 ─────────────────────────────────────────────────────────────────
    if (carga && txt(child(carga, 'proprietarioCarga')) === '3' && !child(carga, 'consignatario'))
      err(`${cp}.consignatario`, '[RN-40] "consignatario" é obrigatório quando proprietarioCarga=3');

    // ── RN-41 ─────────────────────────────────────────────────────────────────
    {
      const consig = child(carga, 'consignatario');
      if (consig && child(consig, 'cnpj') && child(consig, 'cpf'))
        err(`${cp}.consignatario`, '[RN-41] Informe apenas "cnpj" ou "cpf" no consignatário, não ambos');
    }

    // ── RN-42 ─────────────────────────────────────────────────────────────────
    if (fracionado && ide) {
      const ideCnpj = txt(child(ide, 'cnpj'));
      children(child(fracionado, 'ContratantesCargaFrac'), 'ContratanteF').forEach((cf, ci) => {
        const v = txt(child(cf, 'cpfCnpj'));
        if (ideCnpj && v === ideCnpj)
          err(
            `${cp}.fracionado.ContratantesCargaFrac.ContratanteF[${ci + 1}].cpfCnpj`,
            `[RN-42] cpfCnpj do ContratanteF não pode ser igual ao CNPJ da contratante principal (${ideCnpj})`,
          );
      });
    }

    // ── RN-43 ─────────────────────────────────────────────────────────────────
    if (fracionado) {
      children(child(fracionado, 'ContratantesCargaFrac'), 'ContratanteF').forEach((cf, ci) => {
        const v = txt(child(cf, 'cpfCnpj'));
        const pp = `${cp}.fracionado.ContratantesCargaFrac.ContratanteF[${ci + 1}].cpfCnpj`;
        if (v.length === 11 && !validCPF(v))
          err(pp, `[RN-43] CPF "${v}" possui dígito verificador inválido`);
        else if (v.length === 14 && !validCNPJ(v))
          err(pp, `[RN-43] CNPJ "${v}" possui dígito verificador inválido`);
      });
    }

    // ── RN-44 ─────────────────────────────────────────────────────────────────
    if (isLotFrac && transp) {
      const rotaInf = child(child(transp, 'rota'), 'informacoes');
      if (rotaInf && !child(rotaInf, 'totalKm'))
        err(`${tp}.rota.informacoes.totalKm`, '[RN-44] "totalKm" é obrigatório para operações de lotação ou fracionado quando "informacoes" da rota é informado');
    }

    // ── RN-46 ─────────────────────────────────────────────────────────────────
    {
      const rota   = child(transp, 'rota');
      const pontos = children(child(child(rota, 'informacoes'), 'pontosParada'), 'pontoParada');
      if (rota && pontos.length > 0) {
        if (pontos.length < 2)
          err(`${tp}.rota.informacoes.pontosParada`, `[RN-46] A rota deve ter no mínimo 2 pontos de parada (${pontos.length} informado(s))`);
        pontos.forEach((pp, pi) => {
          const pPath = `${tp}.rota.informacoes.pontosParada.pontoParada[${pi + 1}]`;
          const hasIBGE = !!child(pp, 'codigoIBGE');
          const hasCep  = !!child(pp, 'cep');
          const hasLat  = !!child(pp, 'latitude');
          const hasLon  = !!child(pp, 'longitude');
          const methods = [hasIBGE, hasCep, hasLat || hasLon].filter(Boolean).length;
          if (methods > 1)
            err(pPath, '[RN-46] "codigoIBGE", "cep" e "latitude/longitude" são mutuamente exclusivos no mesmo pontoParada');
          if (hasLat && !hasLon)
            err(`${pPath}.longitude`, '[RN-46] "longitude" é obrigatória quando "latitude" é informada');
          if (hasLon && !hasLat)
            err(`${pPath}.latitude`, '[RN-46] "latitude" é obrigatória quando "longitude" é informada');
        });
      }
    }

    // ── RN-47: dtFim >= dtInicio ───────────────────────────────────────────────
    if (isLotFrac && ide) {
      const dtInicioStr = txt(child(ide, 'dtInicio'));
      const dtFimStr    = txt(child(ide, 'dtFim'));
      if (dtInicioStr && dtFimStr) {
        const d1 = new Date(dtInicioStr);
        const d2 = new Date(dtFimStr);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 < d1)
          err(`${ip}.ide.dtFim`,
            '[RN-47] A data prevista para término da viagem deve ser maior ou igual à data de início da viagem');
      }
    }

    // ── RN-48: Peso da carga > 0 e < 9999999.99 ───────────────────────────────
    {
      const cargaTipoNome = lotacao ? 'lotacao' : (fracionado ? 'fracionado' : null);
      const cargaTipoEl   = lotacao ?? fracionado ?? null;
      if (cargaTipoNome && cargaTipoEl) {
        const qtdEl = child(cargaTipoEl, 'quantidade');
        if (qtdEl) {
          const peso = parseFloat(txt(qtdEl));
          if (!isNaN(peso)) {
            const qPath = `${cp}.${cargaTipoNome}.quantidade`;
            if (peso <= 0)
              err(qPath, '[RN-48] Peso da carga deve ser maior que 0');
            else if (peso >= 9_999_999.99)
              err(qPath, '[RN-48] Peso da carga deve ser menor que 9999999.99');
          }
        }
      }
    }

    // ── RN-49: Intervalo máximo de 90 dias (lotação ou fracionado) ─────────────
    if (isLotFrac && ide) {
      const dtInicioStr = txt(child(ide, 'dtInicio'));
      const dtFimStr    = txt(child(ide, 'dtFim'));
      if (dtInicioStr && dtFimStr) {
        const d1 = new Date(dtInicioStr);
        const d2 = new Date(dtFimStr);
        if (!isNaN(d1.getTime()) && !isNaN(d2.getTime()) && d2 >= d1) {
          const diffDays = (d2.getTime() - d1.getTime()) / 86_400_000;
          if (diffDays > 90)
            err(`${ip}.ide`,
              `[RN-49] O intervalo entre a data de início e a data de fim da viagem não pode ser superior a 90 dias (${Math.round(diffDays)} dias informados)`);
        }
      }
    }

    // ── RN-50: Transportador deve ser Pessoa Física (TAC) em TACagregado ───────
    // TODO: regra desativada — possível erro de interpretação da legislação; revisar antes de reativar
    // if (isTAC && transp) {
    //   const cnpjT = child(transp, 'cnpjTransportador');
    //   if (cnpjT)
    //     err(`${tp}.cnpjTransportador`,
    //       '[RN-50] O transportador informado deve ser do tipo Pessoa Física (TAC): utilize "cpfTransportador" em operações TACagregado');
    // }

    // ── RN-51: vlrFrete deve ser maior que 0 ──────────────────────────────────
    if (valEl) {
      const vlrFreteEl = child(valEl, 'vlrFrete');
      if (vlrFreteEl) {
        const vlrFrete = parseFloat(txt(vlrFreteEl));
        if (!isNaN(vlrFrete) && vlrFrete <= 0)
          err(`${vp}.vlrFrete`, '[RN-51] O valor do frete deve ser informado e maior que 0');
      }
    }

    // ── RN-52: codigoSH deve existir na tabela de natureza de cargas ──────────
    // (validação ativada automaticamente quando src/data/codigoSH.ts for preenchido)
    if (VALID_CODIGO_SH.size > 0) {
      const shEl = child(lotacao, 'codigoSH') ?? child(fracionado, 'codigoSH');
      if (shEl) {
        const sh = txt(shEl);
        const cargaTipo = lotacao ? 'lotacao' : 'fracionado';
        if (sh && !VALID_CODIGO_SH.has(sh))
          errors.push({
            path: `${cp}.${cargaTipo}.codigoSH`,
            message: `[RN-52] O código da natureza da carga "${sh}" não existe na tabela de codigoSH`,
            link: { url: '/#/codigos-sh', label: 'Consultar tabela de codigoSH' },
          });
        else if (sh === '0001')
          warnings.push(
            'codigoSH "0001" (Diversos) é um código genérico que pode ser ocasionalmente rejeitado pela ANTT. ' +
            'Recomenda-se utilizar o código SH específico da mercadoria.',
          );
      }
    }

    // ── RN-53: codigoTipoCarga deve estar entre 1 e 12 ────────────────────────
    {
      const tcEl = child(lotacao, 'codigoTipoCarga') ?? child(fracionado, 'codigoTipoCarga');
      if (tcEl) {
        const val = txt(tcEl);
        const n = parseInt(val, 10);
        const cargaTipo = lotacao ? 'lotacao' : 'fracionado';
        if (isNaN(n) || !VALID_CODIGO_TIPO_CARGA.has(n))
          err(
            `${cp}.${cargaTipo}.codigoTipoCarga`,
            `[RN-53] O código de tipo de carga "${val}" é inválido. Valores aceitos: ${TIPO_CARGA_LISTA}`,
          );
      }
    }

    // ── RN-54: despesas obrigatório em valores ─────────────────────────────────
    if (valEl) {
      const despEl = child(valEl, 'despesas');
      if (!despEl) {
        err(`${vp}.despesas`,
          '[RN-54] "despesas" é obrigatório em valores. ' +
          'Informe vlrDespesas=0.00 e descricao="NAO INFORMADO" quando não houver despesas.');
      } else {
        if (!child(despEl, 'vlrDespesas'))
          err(`${vp}.despesas.vlrDespesas`, '[RN-54] "vlrDespesas" é obrigatório dentro de despesas');
        if (!child(despEl, 'descricao'))
          err(`${vp}.despesas.descricao`, '[RN-54] "descricao" é obrigatório dentro de despesas');
      }
    }

    // ── RN-55: tarifas obrigatório em valores ──────────────────────────────────
    if (valEl) {
      const tarifEl = child(valEl, 'tarifas');
      if (!tarifEl) {
        err(`${vp}.tarifas`,
          '[RN-55] "tarifas" é obrigatório em valores. ' +
          'Informe quantidadeTotal=0 e valorTotal=0.00 quando não houver tarifas.');
      } else {
        if (!child(tarifEl, 'quantidadeTotal'))
          err(`${vp}.tarifas.quantidadeTotal`, '[RN-55] "quantidadeTotal" é obrigatório dentro de tarifas');
        if (!child(tarifEl, 'valorTotal'))
          err(`${vp}.tarifas.valorTotal`, '[RN-55] "valorTotal" é obrigatório dentro de tarifas');
      }
    }
  });

  return { errors, warnings };
}
