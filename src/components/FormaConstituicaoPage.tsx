import { useState } from 'react';
import { GRUPOS_FORMA, FORMAS_CONSTITUICAO } from '../data/formaConstituicao';

export function FormaConstituicaoPage() {
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q
    ? FORMAS_CONSTITUICAO.filter(
        e => e.codigo.includes(q) || e.descricao.toLowerCase().includes(q)
      )
    : null;

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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                Tabela de Forma de Constituição · formaConstituicao
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {FORMAS_CONSTITUICAO.length} naturezas jurídicas · {GRUPOS_FORMA.length} grupos
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
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 py-3">
          <div className="relative max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500 pointer-events-none"
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Pesquisar por código ou descrição…"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700
                         bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200
                         placeholder:text-gray-400 dark:placeholder:text-gray-500
                         focus:outline-none focus:ring-2 focus:ring-amber-400 dark:focus:ring-amber-600"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1 max-w-screen-lg mx-auto w-full px-4 sm:px-6 py-6 flex flex-col gap-6">

        {filtered !== null ? (
          filtered.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-12">
              Nenhum resultado para <strong>"{query}"</strong>.
            </p>
          ) : (
            <section>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </p>
              <TabelaForma entradas={filtered} />
            </section>
          )
        ) : (
          GRUPOS_FORMA.map(grupo => (
            <section key={grupo.prefixo}>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center px-2 h-6 rounded
                                 bg-amber-100 dark:bg-amber-900/40
                                 text-amber-700 dark:text-amber-400
                                 font-mono text-xs font-bold shrink-0">
                  {grupo.prefixo}
                </span>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {grupo.nome}
                </span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">
                  {grupo.entradas.length} tipo{grupo.entradas.length !== 1 ? 's' : ''}
                </span>
              </div>
              <TabelaForma entradas={grupo.entradas} />
            </section>
          ))
        )}

        <p className="text-xs text-center text-gray-400 dark:text-gray-600 pt-2 pb-4">
          Natureza Jurídica (IBGE / RFB) aceita pelo layout NDD Cargo ·{' '}
          campo <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">formaConstituicao</code>
        </p>
      </main>
    </div>
  );
}

function TabelaForma({ entradas }: { entradas: { codigo: string; descricao: string }[] }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 w-24">
              Código
            </th>
            <th className="px-4 py-2 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Descrição
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {entradas.map((e, i) => (
            <tr
              key={e.codigo}
              className={i % 2 === 0
                ? 'bg-white dark:bg-gray-900'
                : 'bg-gray-50/50 dark:bg-gray-800/30'}
            >
              <td className="px-4 py-2.5 font-mono text-xs font-bold text-amber-600 dark:text-amber-400 whitespace-nowrap select-all">
                {e.codigo}
              </td>
              <td className="px-4 py-2.5 text-xs text-gray-700 dark:text-gray-300">
                {e.descricao}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
