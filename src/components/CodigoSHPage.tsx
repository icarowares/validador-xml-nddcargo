import { CODIGOS_SH } from '../data/codigoSH';

// Agrupa os códigos pelo prefixo de 2 dígitos (capítulo SH)
function groupByChapter(entries: typeof CODIGOS_SH) {
  const map = new Map<string, string[]>();
  for (const e of entries) {
    const chapter = e.codigo.slice(0, 2);
    const list = map.get(chapter) ?? [];
    list.push(e.codigo);
    map.set(chapter, list);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export function CodigoSHPage() {
  const chapters = groupByChapter(CODIGOS_SH);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <a
            href="/"
            onClick={e => { e.preventDefault(); window.location.hash = ''; }}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            aria-label="Voltar ao validador"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </a>

          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />

          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-amber-500 text-white shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Tabela de Natureza de Cargas · codigoSH
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {CODIGOS_SH.length.toLocaleString('pt-BR')} códigos · agrupados por capítulo
              </p>
            </div>
          </div>

          <img
            src="/ndd-logo.svg"
            alt="NDD"
            className="ml-auto h-6 dark:invert opacity-80"
          />
        </div>
      </header>

      {/* Aviso temporário */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Exibição temporária — as descrições dos códigos serão adicionadas em breve.
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-5">
        {chapters.map(([chapter, codes]) => (
          <section key={chapter}>
            {/* Cabeçalho do capítulo */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center justify-center min-w-[2.5rem] h-6 px-2 rounded
                               bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400
                               font-mono text-xs font-bold">
                {chapter}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {codes.length} código{codes.length !== 1 ? 's' : ''}
              </span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>

            {/* Grade de códigos */}
            <div className="flex flex-wrap gap-1.5">
              {codes.map(codigo => (
                <span
                  key={codigo}
                  className="inline-flex items-center px-2.5 py-1 rounded-md
                             bg-white dark:bg-gray-800
                             border border-gray-200 dark:border-gray-700
                             font-mono text-xs font-medium
                             text-gray-700 dark:text-gray-300
                             select-all"
                >
                  {codigo}
                </span>
              ))}
            </div>
          </section>
        ))}

        <p className="text-xs text-center text-gray-400 dark:text-gray-600 pt-2 pb-4">
          Tabela de Natureza de Cargas conforme especificação NDD Cargo ·{' '}
          campo <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">codigoSH</code>
        </p>
      </main>
    </div>
  );
}
