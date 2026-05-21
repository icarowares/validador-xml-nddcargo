import { useState, useMemo } from 'react';
import { CAPITULOS_SH, CODIGOS_SH } from '../data/codigoSH';

export function CodigoSHPage() {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CAPITULOS_SH;

    return CAPITULOS_SH.map(cap => ({
      ...cap,
      entradas: cap.entradas.filter(
        e => e.codigo.includes(q) || e.descricao.toLowerCase().includes(q),
      ),
    })).filter(cap => cap.entradas.length > 0);
  }, [query]);

  const totalFiltrado = filtered.reduce((n, c) => n + c.entradas.length, 0);

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
                {CODIGOS_SH.length.toLocaleString('pt-BR')} posições SH · {CAPITULOS_SH.length} capítulos
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

      {/* Search bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Pesquisar por código ou descrição…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                         bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                         placeholder-gray-400 dark:placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-500 focus:border-transparent
                         transition-colors"
            />
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
            {query
              ? `${totalFiltrado.toLocaleString('pt-BR')} resultado${totalFiltrado !== 1 ? 's' : ''}`
              : `${CODIGOS_SH.length.toLocaleString('pt-BR')} códigos`}
          </span>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Nenhum código encontrado</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Tente outro código ou descrição</p>
          </div>
        ) : (
          filtered.map(cap => (
            <section key={cap.numero}>
              {/* Cabeçalho do capítulo */}
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center min-w-[2.5rem] h-6 px-2 rounded
                                 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400
                                 font-mono text-xs font-bold">
                  {cap.numero === '00' ? '—' : cap.numero}
                </span>
                {cap.numero === '00'
                  ? <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Código especial</span>
                  : <span className="text-xs text-gray-400 dark:text-gray-500">
                      {cap.entradas.length} posição{cap.entradas.length !== 1 ? 'ões' : ''}
                    </span>
                }
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>

              {/* Tabela de entradas */}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cap.entradas.map((entry, idx) => (
                      <tr
                        key={entry.codigo}
                        className={idx % 2 === 0
                          ? 'bg-white dark:bg-gray-900'
                          : 'bg-gray-50/60 dark:bg-gray-800/40'}
                      >
                        <td className="px-3 py-2 whitespace-nowrap w-16">
                          <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400 select-all">
                            {entry.codigo}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                          {entry.descricao}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}

        <p className="text-xs text-center text-gray-400 dark:text-gray-600 pt-2 pb-4">
          Tabela de Natureza de Cargas conforme especificação NDD Cargo ·{' '}
          campo <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">codigoSH</code>
        </p>
      </main>
    </div>
  );
}
