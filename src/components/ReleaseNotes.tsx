import { useState } from 'react';

interface Entry {
  type: 'feat' | 'fix';
  text: string;
}

interface Release {
  date: string;
  entries: Entry[];
}

const RELEASES: Release[] = [
  {
    date: '15 mai 2026',
    entries: [
      { type: 'feat', text: 'Syntax highlighting customizado para TXT NDD Cargo — destaque de código de registro, separadores e campos por tipo' },
      { type: 'feat', text: 'Editor substituído por CodeMirror 6 com highlight estilo VS Code para XML, JSON e TXT (números de linha, folding, bracket matching)' },
      { type: 'feat', text: 'Exemplos XML para download — Carga Lotação, Carga Fracionada, Frota Própria e TAC-Agregado' },
      { type: 'feat', text: 'Validação ajustada conforme layout Notion: suporte a latitude/longitude em pontosParada e totalKm obrigatório para lotação/fracionado' },
      { type: 'feat', text: 'Vercel Analytics — rastreamento de validações, mudanças de tipo de arquivo e downloads' },
      { type: 'fix',  text: 'IndAltoDesempenho, IndRetornoVazio e ComposicaoVeicular passam a aceitar 0 ou 1 (em vez de true/false)' },
      { type: 'fix',  text: 'Exemplos TXT atualizados com valores 0/1 nos campos booleanos' },
    ],
  },
  {
    date: '14 mai 2026',
    entries: [
      { type: 'feat', text: 'Navegar para a linha do código ao clicar em um erro de validação JSON' },
      { type: 'feat', text: 'Validação de JSON para API REST NDD Cargo — layout loteOT_envio novo formato' },
      { type: 'feat', text: 'Modo escuro com toggle no header e persistência via localStorage' },
      { type: 'feat', text: 'Título da página, favicon e logo NDD no header' },
      { type: 'feat', text: 'Validação de TXT loteOT_envio — layout Emissão completo com todas as regras de negócio' },
      { type: 'feat', text: 'Download do XSD movido para dentro do painel XML › Emissão' },
      { type: 'fix',  text: 'Remove suporte a lote de OTs do validador JSON (simplificação da estrutura)' },
      { type: 'fix',  text: 'Botão Validar sempre visível quando há seção de exemplos acima' },
      { type: 'fix',  text: 'Corrige erros de build TypeScript para deploy no Vercel' },
    ],
  },
  {
    date: '12 mai 2026',
    entries: [
      { type: 'feat', text: 'UX/UI — seletor de tipo de integração, gutter de linhas numeradas e navegação por rejeições no painel de resultado' },
      { type: 'feat', text: 'Validador XML NDD Cargo loteOT_envio v4.2.12.0 — versão inicial' },
    ],
  },
];

export function ReleaseNotes() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors underline underline-offset-2"
      >
        Changelog
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg max-h-[80vh] bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Changelog</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Histórico de alterações do validador</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
                aria-label="Fechar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              <div className="flex flex-col gap-6">
                {RELEASES.map(release => (
                  <div key={release.date}>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                      {release.date}
                    </p>
                    <ul className="flex flex-col gap-2">
                      {release.entries.map((entry, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                          <span
                            className={`mt-0.5 shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide leading-none ${
                              entry.type === 'feat'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                : 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {entry.type}
                          </span>
                          {entry.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
