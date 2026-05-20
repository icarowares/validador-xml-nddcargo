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

// ─── Namespace injection ──────────────────────────────────────────────────────

function injectDsNamespace(xml: string): { xml: string; injected: boolean } {
  if (!xml.includes('ds:') || xml.includes('xmlns:ds')) return { xml, injected: false };
  const patched = xml.replace(
    /(<[A-Za-z_][A-Za-z0-9_]*(?:\s[^>]*?)?)(\s*>)/,
    '$1 xmlns:ds="http://www.w3.org/2000/09/xmldsig#"$2',
  );
  return { xml: patched, injected: true };
}

// ─── infCancOT ────────────────────────────────────────────────────────────────

function validateInfCancOT(el: Element, ctx: Ctx) {
  const path = 'infCancOT';

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

  const motivo = requireChild(el, 'motivo', path, ctx);
  if (motivo) valStrLen(txt(motivo), 1, 500, `${path}.motivo`, ctx);
}

// ─── Root ─────────────────────────────────────────────────────────────────────

function validateRoot(doc: Document, ctx: Ctx) {
  const root = doc.documentElement;

  if (root.localName !== 'cancelarOT_envio') {
    ctx.err('/', `Elemento raiz inválido: "${root.localName}". Esperado: "cancelarOT_envio"`);
    return;
  }

  const versao = root.getAttribute('versao');
  if (!versao)
    ctx.err('cancelarOT_envio', 'Atributo obrigatório "versao" não encontrado');
  else if (versao !== '4.2.12.0')
    ctx.err('cancelarOT_envio@versao', `Versão inválida: "${versao}". O único valor aceito é "4.2.12.0"`);

  const token = root.getAttribute('token');
  if (!token)
    ctx.err('cancelarOT_envio', 'Atributo obrigatório "token" não encontrado');
  else if (token.length === 0 || token.length > 24)
    ctx.err('cancelarOT_envio@token', `Token inválido. Deve ter entre 1 e 24 caracteres`);

  const infCancOT = requireChild(root, 'infCancOT', 'cancelarOT_envio', ctx);
  if (infCancOT) validateInfCancOT(infCancOT, ctx);

  const sigNS = 'http://www.w3.org/2000/09/xmldsig#';
  const sig =
    root.getElementsByTagNameNS(sigNS, 'Signature')[0] ??
    Array.from(root.children).find(c => c.localName === 'Signature');
  if (!sig)
    ctx.err('cancelarOT_envio', 'Assinatura digital (ds:Signature) não encontrada. Este campo é obrigatório');
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export function validateCancelamento(xmlString: string): ValidationResult {
  if (!xmlString.trim())
    return { valid: false, errors: [], parseError: 'O conteúdo do XML está vazio', otCount: 0 };

  const { xml: processedXml, injected } = injectDsNamespace(xmlString);
  const warnings: string[] = [];
  if (injected)
    warnings.push(
      'O namespace "xmlns:ds" não foi encontrado na tag raiz e foi injetado automaticamente para que o parse pudesse ser concluído. ' +
      'Verifique se o seu código declara xmlns:ds="http://www.w3.org/2000/09/xmldsig#" no elemento raiz <cancelarOT_envio>.',
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
