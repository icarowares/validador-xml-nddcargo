/**
 * check-examples.ts
 * Runs every example file in public/exemplos through the corresponding validator.
 * Usage: npx tsx scripts/check-examples.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Window } from 'happy-dom';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─── Polyfill DOM globals para os validators XML ──────────────────────────────
const window = new Window();
(globalThis as unknown as Record<string, unknown>)['DOMParser'] = window.DOMParser;

// ─── Import validators (após o polyfill) ─────────────────────────────────────
import { validate }               from '../src/validator/validate';
import { validateJson }           from '../src/validator/validateJson';
import { validateTxt }            from '../src/validator/validateTxt';
import { validateCancelamento }   from '../src/validator/validateCancelamento';
import { validateRetificacao }    from '../src/validator/validateRetificacao';
import { validateEncerramento }   from '../src/validator/validateEncerramento';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EXEMPLOS_DIR = join(__dirname, '..', 'public', 'exemplos');

function walk(dir: string): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) result.push(...walk(full));
    else result.push(full);
  }
  return result.sort();
}

function pickValidator(filePath: string) {
  const name = basename(filePath).toLowerCase();
  const ext  = extname(filePath).toLowerCase();

  if (ext === '.json') return validateJson;
  if (ext === '.txt')  return validateTxt;

  // XML — escolhe pelo padrão de nome/pasta
  if (name.includes('cancel'))  return validateCancelamento;
  if (name.includes('retif') || name.includes('alterar')) return validateRetificacao;
  if (name.includes('encerra')) return validateEncerramento;
  return validate; // default: emissão XML
}

// ─── Execução ─────────────────────────────────────────────────────────────────

const files = walk(EXEMPLOS_DIR);
let allOk = true;

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

console.log(`\n${BOLD}Verificando ${files.length} arquivo(s) de exemplo...${RESET}\n`);

for (const file of files) {
  const rel     = file.replace(EXEMPLOS_DIR + '/', '');
  const content = readFileSync(file, 'utf-8');
  const fn      = pickValidator(file);

  const result = fn(content);

  if (result.valid) {
    console.log(`${GREEN}✓${RESET} ${rel}`);
  } else if (result.parseError) {
    allOk = false;
    console.log(`${RED}✗${RESET} ${BOLD}${rel}${RESET}`);
    console.log(`  ${YELLOW}parse error:${RESET} ${result.parseError}`);
  } else {
    allOk = false;
    console.log(`${RED}✗${RESET} ${BOLD}${rel}${RESET}  (${result.errors.length} erro(s))`);
    for (const err of result.errors) {
      console.log(`  ${YELLOW}[${err.path}]${RESET} ${err.message}`);
    }
  }
}

console.log(
  `\n${allOk
    ? GREEN + '✓ Todos os arquivos passaram.' + RESET
    : RED   + '✗ Há arquivo(s) com erros.' + RESET
  }\n`
);
process.exit(allOk ? 0 : 1);
