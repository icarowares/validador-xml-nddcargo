import type { ValidationError, ValidationResult } from './types';

// ─── Field helpers ─────────────────────────────────────────────────────────────

function isDigits(v: string): boolean { return /^\d+$/.test(v); }
function isDecimal(v: string): boolean { return /^\d+(\.\d+)?$/.test(v); }
function isSignedDecimal(v: string): boolean { return /^-?\d+(\.\d+)?$/.test(v); }

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
  if (!isDecimal(v)) {
    ctx.err(`"${v}" deve ser um número positivo (ex: 100 ou 100.50)`, label);
    return;
  }
  const parts = v.split('.');
  const frac = parts[1] ?? '';
  if (frac.length > dec)
    ctx.err(`"${v}" possui mais de ${dec} casa(s) decimal(is)`, label);
  if (v.replace('.', '').length > maxLen)
    ctx.err(`"${v}" excede o máximo de ${maxLen} caractere(s)`, label);
}

function reqSignedDecimal(v: string, maxLen: number, dec: number, label: string, ctx: Ctx): void {
  if (!isSignedDecimal(v)) {
    ctx.err(`"${v}" deve ser um número decimal (ex: -23.550520)`, label);
    return;
  }
  const abs = v.replace('-', '');
  const parts = abs.split('.');
  const frac = parts[1] ?? '';
  if (frac.length > dec)
    ctx.err(`"${v}" possui mais de ${dec} casa(s) decimal(is)`, label);
  if (abs.replace('.', '').length > maxLen)
    ctx.err(`"${v}" excede o máximo de ${maxLen} dígitos`, label);
}

function reqEnum(v: string, allowed: number[], label: string, ctx: Ctx, descs: string): void {
  const n = Number(v);
  if (!Number.isInteger(n) || !allowed.includes(n))
    ctx.err(`"${v}" inválido. Valores aceitos: ${descs}`, label);
}

function optField(v: string | undefined, fn: (v: string) => void): void {
  if (v !== undefined && v.trim() !== '') fn(v.trim());
}

// ─── Parsed line ──────────────────────────────────────────────────────────────

interface ParsedLine {
  lineNumber: number;
  code: string;
  fields: string[];
  raw: string;
}

// ─── Whitespace check ─────────────────────────────────────────────────────────

function checkWhitespace(line: ParsedLine): ValidationError[] {
  const errs: ValidationError[] = [];
  for (let i = 1; i < line.fields.length; i++) {
    const v = line.fields[i];
    if (v !== v.trim() && v.trim() !== '') {
      errs.push({
        path: `Linha ${line.lineNumber} · Reg. ${line.code} · Campo ${i}`,
        message: `Valor contém espaço no início ou no fim: "${v}"`,
        lineNumber: line.lineNumber,
      });
    }
  }
  return errs;
}

// ─── Record validators ─────────────────────────────────────────────────────────

function val0000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '0000');
  const f = line.fields;
  const token = f[1]?.trim();
  const versao = f[2]?.trim();

  if (!token) ctx.err('token é obrigatório', 'token');
  else reqLen(token, 1, 24, 'token', ctx);

  if (!versao) ctx.err('versao é obrigatória', 'versao');
  else reqLen(versao, 1, 7, 'versao', ctx);

  return ctx.errors;
}

function val1000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '1000');
  const cnpj = line.fields[1]?.trim();

  if (!cnpj) ctx.err('cnpj é obrigatório', 'cnpj');
  else reqExact(cnpj, 14, 'cnpj', ctx);

  return ctx.errors;
}

function val1100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '1100');
  const f = line.fields;
  const numero = f[1]?.trim();
  const ciotCod = f[2]?.trim();

  if (!numero) ctx.err('numero é obrigatório', 'numero');
  else reqExact(numero, 12, 'numero', ctx);

  if (!ciotCod) ctx.err('ciotCodVerificador é obrigatório', 'ciotCodVerificador');
  else if (ciotCod.length !== 4)
    ctx.err(`"${ciotCod}" deve conter exatamente 4 caracteres`, 'ciotCodVerificador');

  return ctx.errors;
}

function val2000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2000');
  const qtdeCarga = line.fields[1]?.trim();

  if (!qtdeCarga) ctx.err('qtdeCarga é obrigatória', 'qtdeCarga');
  else reqDecimal(qtdeCarga, 9, 2, 'qtdeCarga', ctx);

  return ctx.errors;
}

function val2400(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '2400');
  const encerrar = line.fields[1]?.trim();

  if (!encerrar) ctx.err('encerrar é obrigatório', 'encerrar');
  else if (encerrar !== '1')
    ctx.err(
      `[RN-E02] O campo "encerrar" deve ser 1 (verdadeiro) para confirmar o encerramento (recebido: "${encerrar}")`,
      'encerrar',
    );

  return ctx.errors;
}

function val3000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '3000');
  const f = line.fields;
  const codigoSH  = f[1]?.trim();
  const qtdeCarga = f[2]?.trim();
  const qtdeViagens = f[3]?.trim();
  const rotaERP   = f[4]?.trim();

  if (!codigoSH) ctx.err('codigoSH é obrigatório', 'codigoSH');
  else reqExact(codigoSH, 4, 'codigoSH', ctx);

  if (!qtdeCarga) ctx.err('qtdeCarga (peso total da viagem em KG) é obrigatória', 'qtdeCarga');
  else reqDecimal(qtdeCarga, 9, 2, 'qtdeCarga', ctx);

  if (!qtdeViagens) ctx.err('qtdeViagens é obrigatório', 'qtdeViagens');
  else {
    if (!isDigits(qtdeViagens) || qtdeViagens.length > 5)
      ctx.err(`"${qtdeViagens}" deve ser um inteiro com no máximo 5 dígitos`, 'qtdeViagens');
    else if (parseInt(qtdeViagens, 10) < 1)
      ctx.err('qtdeViagens deve ser maior que 0', 'qtdeViagens');
  }

  if (!rotaERP) ctx.err('rotaERP é obrigatório', 'rotaERP');
  else reqLen(rotaERP, 1, 30, 'rotaERP', ctx);

  return ctx.errors;
}

function val3100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '3100');
  const f = line.fields;
  const nome    = f[1]?.trim();
  const tipoRota = f[2]?.trim();
  const utilRot = f[3]?.trim();
  const totalKm = f[4]?.trim();
  const notif   = f[5]?.trim();

  if (!nome) ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome, 1, 50, 'nome', ctx);

  optField(tipoRota, v => reqEnum(v, [1, 2], 'tipoRotaPadrao', ctx, '1 – Rota rápida, 2 – Rota curta'));
  optField(utilRot,  v => reqEnum(v, [1, 2], 'utilizarRoteirizador', ctx, '1 – Sim, 2 – Não'));

  if (!totalKm) ctx.err('totalKm é obrigatório', 'totalKm');
  else reqDecimal(totalKm, 15, 2, 'totalKm', ctx);

  optField(notif, v => reqEnum(v, [1, 2], 'notificarRespContratante', ctx, '1 – Sim, 2 – Não'));

  return ctx.errors;
}

function val3110(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '3110');
  const f = line.fields;
  const codigoIBGE = f[1]?.trim() ?? '';
  const cep        = f[2]?.trim() ?? '';
  const lat        = f[3]?.trim() ?? '';
  const lon        = f[4]?.trim() ?? '';

  const hasIBGE  = codigoIBGE !== '';
  const hasCEP   = cep !== '';
  const hasLat   = lat !== '';
  const hasLon   = lon !== '';
  const hasLatLon = hasLat || hasLon;

  const methods = [hasIBGE, hasCEP, hasLatLon].filter(Boolean).length;

  if (methods === 0) {
    ctx.err('[RN-E03] É obrigatório informar "codigoIBGE", "cep" ou o par "latitude + longitude"');
    return ctx.errors;
  }
  if (methods > 1)
    ctx.err('[RN-E03] "codigoIBGE", "cep" e "latitude/longitude" são mutuamente exclusivos no mesmo ponto de parada');

  if (hasIBGE) reqExact(codigoIBGE, 7, 'codigoIBGE', ctx);
  if (hasCEP)  reqExact(cep, 8, 'cep', ctx);

  if (hasLat && !hasLon)
    ctx.err('[RN-E03] "longitude" é obrigatória quando "latitude" é informada', 'longitude');
  if (hasLon && !hasLat)
    ctx.err('[RN-E03] "latitude" é obrigatória quando "longitude" é informada', 'latitude');
  if (hasLat) reqSignedDecimal(lat, 10, 6, 'latitude', ctx);
  if (hasLon) reqSignedDecimal(lon, 10, 6, 'longitude', ctx);

  return ctx.errors;
}

function val4000(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4000');
  const qt = line.fields[1]?.trim();

  if (!qt) ctx.err('quantidadeTotal é obrigatório', 'quantidadeTotal');
  else if (!isDigits(qt) || qt.length > 7)
    ctx.err(`"${qt}" deve ser um inteiro com no máximo 7 dígitos`, 'quantidadeTotal');
  else if (parseInt(qt, 10) < 1)
    ctx.err('quantidadeTotal deve ser maior que 0', 'quantidadeTotal');

  return ctx.errors;
}

function val4100(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4100');
  const nome = line.fields[1]?.trim();

  if (!nome) ctx.err('nome é obrigatório', 'nome');
  else reqLen(nome, 1, 50, 'nome', ctx);

  return ctx.errors;
}

function val4110(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4110');
  const f = line.fields;
  const valor          = f[1]?.trim();
  const rubrica        = f[2]?.trim();
  const valorValidacao = f[3]?.trim();

  if (!valor) ctx.err('valor é obrigatório', 'valor');
  else reqDecimal(valor, 15, 2, 'valor', ctx);

  if (!rubrica) ctx.err('rubrica é obrigatória', 'rubrica');
  else if (rubrica !== '4')
    ctx.err(
      `"${rubrica}" inválido. Para encerramento, apenas o tipo 4 (Valor de Tarifa) é permitido`,
      'rubrica',
    );

  optField(valorValidacao, v => reqDecimal(v, 15, 2, 'valorValidacao', ctx));

  return ctx.errors;
}

function val4120(line: ParsedLine): ValidationError[] {
  const ctx = makeCtx(line.lineNumber, '4120');
  const f = line.fields;
  const nmDesc         = f[1]?.trim();
  const vlrDesc        = f[2]?.trim();
  const dsDesc         = f[3]?.trim();
  const rubrica        = f[4]?.trim();
  const valorValidacao = f[5]?.trim();

  if (!nmDesc) ctx.err('nmDesc é obrigatório', 'nmDesc');
  else reqLen(nmDesc, 1, 50, 'nmDesc', ctx);

  if (!vlrDesc) ctx.err('vlrDesc é obrigatório', 'vlrDesc');
  else reqDecimal(vlrDesc, 15, 2, 'vlrDesc', ctx);

  optField(dsDesc, v => reqLen(v, 1, 255, 'dsDesc', ctx));
  optField(rubrica, v => {
    if (v !== '4')
      ctx.err(`"${v}" inválido. Para encerramento, apenas o tipo 4 (Valor de Tarifa) é permitido`, 'rubrica');
  });
  optField(valorValidacao, v => reqDecimal(v, 15, 2, 'valorValidacao', ctx));

  return ctx.errors;
}

// ─── Known codes ──────────────────────────────────────────────────────────────

const KNOWN_CODES = new Set([
  '0000', '1000', '1100',
  '2000', '2400',
  '3000', '3100', '3110',
  '4000', '4100', '4110', '4120',
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parentErr(line: ParsedLine, parentCode: string): ValidationError {
  return {
    path: `Linha ${line.lineNumber} · Reg. ${line.code}`,
    message: `Registro ${line.code} depende do registro ${parentCode} — insira ${parentCode} antes deste registro ou remova-o`,
    lineNumber: line.lineNumber,
  };
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function validateEncerramentoTxt(content: string): ValidationResult {
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

  // ── Verificação de espaços em todos os campos ──────────────────────────────
  for (const line of lines) errors.push(...checkWhitespace(line));

  // ── 0000 deve ser o primeiro registro ──────────────────────────────────────
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

  // ── Estado ────────────────────────────────────────────────────────────────
  let has1000 = false;
  let has1100 = false;
  let operationType: 'lotacao' | 'fracionado' | 'tacAgregado' | null = null;
  let viagemCount = 0;
  let current3100 = false;
  let current3110Count = 0;
  const viagem3110Counts: { viagemIdx: number; count: number; lineNumber: number }[] = [];
  let has4000 = false;
  let has4100 = false;
  let has4110 = false;
  let has4120 = false;

  // Linha do 3100 atual, para referência em erros
  let current3100Line = 0;

  function close3100() {
    if (current3100) {
      viagem3110Counts.push({ viagemIdx: viagemCount, count: current3110Count, lineNumber: current3100Line });
      current3100 = false;
      current3110Count = 0;
    }
  }

  // ── Processamento linha a linha (começa do índice 1, 0000 já tratado) ─────
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

    switch (code) {
      // ── 1000 ─────────────────────────────────────────────────────────────
      case '1000':
        if (has1000) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 1000`,
            message: 'O registro 1000 deve aparecer somente uma vez por arquivo de encerramento',
            lineNumber: line.lineNumber,
          });
        } else {
          has1000 = true;
          errors.push(...val1000(line));
        }
        break;

      // ── 1100 ─────────────────────────────────────────────────────────────
      case '1100':
        if (!has1000) errors.push(parentErr(line, '1000'));
        if (has1100) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 1100`,
            message: 'O registro 1100 deve aparecer somente uma vez por arquivo de encerramento',
            lineNumber: line.lineNumber,
          });
        } else {
          has1100 = true;
          errors.push(...val1100(line));
        }
        break;

      // ── 2000 — Lotação ────────────────────────────────────────────────────
      case '2000':
        if (!has1100) errors.push(parentErr(line, '1100'));
        if (operationType !== null) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 2000`,
            message:
              '[RN-E01] Apenas um tipo de operação deve ser informado: ' +
              '2000 (Lotação), 2400 (Fracionado) ou 3000 (TAC-Agregado)',
            lineNumber: line.lineNumber,
          });
        } else {
          operationType = 'lotacao';
          errors.push(...val2000(line));
        }
        break;

      // ── 2400 — Fracionado ─────────────────────────────────────────────────
      case '2400':
        if (!has1100) errors.push(parentErr(line, '1100'));
        if (operationType !== null) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 2400`,
            message:
              '[RN-E01] Apenas um tipo de operação deve ser informado: ' +
              '2000 (Lotação), 2400 (Fracionado) ou 3000 (TAC-Agregado)',
            lineNumber: line.lineNumber,
          });
        } else {
          operationType = 'fracionado';
          errors.push(...val2400(line));
        }
        break;

      // ── 3000 — Viagem (TAC-Agregado) ──────────────────────────────────────
      case '3000':
        if (!has1100) errors.push(parentErr(line, '1100'));
        if (operationType !== null && operationType !== 'tacAgregado') {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 3000`,
            message:
              '[RN-E01] Apenas um tipo de operação deve ser informado: ' +
              '2000 (Lotação), 2400 (Fracionado) ou 3000 (TAC-Agregado)',
            lineNumber: line.lineNumber,
          });
        } else {
          close3100(); // fecha o 3100 da viagem anterior se existir
          operationType = 'tacAgregado';
          viagemCount++;
          errors.push(...val3000(line));
        }
        break;

      // ── 3100 — Informação de Rota (filho de 3000) ─────────────────────────
      case '3100':
        if (operationType !== 'tacAgregado' || viagemCount === 0) {
          errors.push(parentErr(line, '3000'));
        } else if (current3100) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 3100`,
            message: 'O registro 3100 deve aparecer no máximo uma vez por viagem (3000)',
            lineNumber: line.lineNumber,
          });
        } else {
          current3100 = true;
          current3100Line = line.lineNumber;
          current3110Count = 0;
          errors.push(...val3100(line));
        }
        break;

      // ── 3110 — Ponto de Parada (filho de 3100) ────────────────────────────
      case '3110':
        if (!current3100) {
          errors.push(parentErr(line, '3100'));
        } else {
          current3110Count++;
          errors.push(...val3110(line));
        }
        break;

      // ── 4000 — Tarifas (comMF) ────────────────────────────────────────────
      case '4000':
        close3100();
        if (has4000) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 4000`,
            message: 'O registro 4000 deve aparecer no máximo uma vez por arquivo',
            lineNumber: line.lineNumber,
          });
        } else {
          has4000 = true;
          errors.push(...val4000(line));
        }
        break;

      // ── 4100 — Selecionar Parcela (filho de 4000) ─────────────────────────
      case '4100':
        if (!has4000) errors.push(parentErr(line, '4000'));
        if (has4100) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 4100`,
            message: 'O registro 4100 deve aparecer no máximo uma vez por arquivo',
            lineNumber: line.lineNumber,
          });
        } else {
          has4100 = true;
          errors.push(...val4100(line));
        }
        break;

      // ── 4110 — Ajuste Parcela (filho de 4100, exclusivo com 4120) ─────────
      case '4110':
        if (!has4100) errors.push(parentErr(line, '4100'));
        if (has4120) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 4110`,
            message: '[RN-E05] Os registros 4110 (Ajuste) e 4120 (Desconto) são mutuamente exclusivos — use apenas um',
            lineNumber: line.lineNumber,
          });
        } else {
          has4110 = true;
          errors.push(...val4110(line));
        }
        break;

      // ── 4120 — Desconto Parcela (filho de 4100, exclusivo com 4110) ───────
      case '4120':
        if (!has4100) errors.push(parentErr(line, '4100'));
        if (has4110) {
          errors.push({
            path: `Linha ${line.lineNumber} · Reg. 4120`,
            message: '[RN-E05] Os registros 4110 (Ajuste) e 4120 (Desconto) são mutuamente exclusivos — use apenas um',
            lineNumber: line.lineNumber,
          });
        } else {
          has4120 = true;
          errors.push(...val4120(line));
        }
        break;
    }
  }

  // Fecha o último 3100 pendente
  close3100();

  // ── Validações pós-leitura ─────────────────────────────────────────────────

  if (!has1000)
    errors.push({ path: 'Arquivo', message: 'Registro 1000 (Contratante) é obrigatório', lineNumber: undefined });

  if (has1000 && !has1100)
    errors.push({ path: 'Arquivo', message: 'Registro 1100 (Autorização CIOT) é obrigatório quando 1000 está presente', lineNumber: undefined });

  if (!operationType)
    errors.push({
      path: 'Arquivo',
      message:
        '[RN-E01] Nenhum tipo de operação encontrado. ' +
        'Informe exatamente um dos registros: 2000 (Lotação), 2400 (Fracionado) ou 3000 (TAC-Agregado)',
      lineNumber: undefined,
    });

  // 3110 mínimo de 2 pontos quando 3100 presente
  for (const { viagemIdx, count, lineNumber } of viagem3110Counts) {
    if (count > 0 && count < 2) {
      errors.push({
        path: `Reg. 3110 (Viagem ${viagemIdx})`,
        message: `[RN-E04] O registro 3100 deve conter ao menos 2 registros 3110 (pontos de parada). Encontrado(s): ${count}`,
        lineNumber,
      });
    }
  }

  // 4000 exige 4100
  if (has4000 && !has4100)
    errors.push({ path: 'Arquivo', message: 'Registro 4100 (Selecionar Parcela) é obrigatório quando 4000 está presente', lineNumber: undefined });

  // 4100 exige 4110 ou 4120
  if (has4100 && !has4110 && !has4120)
    errors.push({ path: 'Arquivo', message: 'Registro 4110 (Ajuste) ou 4120 (Desconto) é obrigatório quando 4100 está presente', lineNumber: undefined });

  return {
    valid: errors.length === 0,
    errors,
    otCount: errors.length === 0 ? 1 : 0,
  };
}
