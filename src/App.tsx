import { useEffect, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import { XmlInput, type XmlInputHandle } from './components/XmlInput';
import { ValidationResult } from './components/ValidationResult';
import { ReleaseNotes } from './components/ReleaseNotes';
import { CodigoSHPage } from './components/CodigoSHPage';
import { AtividadePrincipalPage } from './components/AtividadePrincipalPage';
import { FormaConstituicaoPage } from './components/FormaConstituicaoPage';
import { ComoUsarPage } from './components/ComoUsarPage';
import { validate } from './validator/validate';
import { validateRetificacao } from './validator/validateRetificacao';
import { validateCancelamento } from './validator/validateCancelamento';
import { validateEncerramento } from './validator/validateEncerramento';
import { validateTxt } from './validator/validateTxt';
import { validateJson } from './validator/validateJson';
import type { ValidationResult as ValidationResultType } from './validator/types';
import './App.css';

type FileType = 'xml' | 'txt' | 'json';
type IntegrationType = 'emissao' | 'retificacao' | 'cancelamento' | 'encerramento';

const INTEGRATION_TYPES: { id: IntegrationType; label: string; activeFor: FileType[] }[] = [
  { id: 'emissao',      label: 'Emissão',      activeFor: ['xml', 'txt', 'json'] },
  { id: 'retificacao',  label: 'Retificação',  activeFor: ['xml']                },
  { id: 'cancelamento', label: 'Cancelamento', activeFor: ['xml']                },
  { id: 'encerramento', label: 'Encerramento', activeFor: ['xml']                },
];

function useHashPage(): string {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  return hash;
}

export default function App() {
  const hash = useHashPage();
  const [fileType, setFileType] = useState<FileType>('xml');
  const [content, setContent] = useState('');
  const [result, setResult] = useState<ValidationResultType | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [integrationType, setIntegrationType] = useState<IntegrationType>('emissao');
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem('theme');
    if (stored) return stored === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const inputRef = useRef<XmlInputHandle>(null);
  const resultPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // ── Sub-pages (após todos os hooks) ──────────────────────────────────────
  if (hash === '#/codigos-sh') return <CodigoSHPage />;
  if (hash === '#/atividade-principal') return <AtividadePrincipalPage />;
  if (hash === '#/forma-constituicao') return <FormaConstituicaoPage />;
  if (hash === '#/como-usar') return <ComoUsarPage />;

  function handleFileTypeChange(type: FileType) {
    if (type === fileType) return;
    track('file_type_change', { from: fileType, to: type });
    setFileType(type);
    setContent('');
    setResult(null);
  }

  function handleValidate() {
    setIsValidating(true);
    setTimeout(() => {
      const res = fileType === 'txt'
        ? validateTxt(content)
        : fileType === 'json'
          ? validateJson(content)
          : integrationType === 'retificacao'
            ? validateRetificacao(content)
            : integrationType === 'cancelamento'
              ? validateCancelamento(content)
              : integrationType === 'encerramento'
                ? validateEncerramento(content)
                : validate(content);
      res.errors.sort((a, b) => (a.lineNumber ?? Infinity) - (b.lineNumber ?? Infinity));
      setResult(res);
      setIsValidating(false);
      track('validate', {
        fileType,
        integrationType,
        result: res.valid ? 'valid' : 'invalid',
        errorCount: res.errors.length,
      });
      setTimeout(() => {
        resultPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }, 16);
  }

  function handleContentChange(v: string) {
    setContent(v);
    setResult(null);
  }

  function handleErrorClick(line: number) {
    inputRef.current?.scrollToLine(line);
  }

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 dark:bg-gray-950 flex flex-col lg:overflow-hidden transition-colors">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div
            className={`flex items-center justify-center w-9 h-9 rounded-lg text-white font-bold text-sm shrink-0 transition-colors ${
              fileType === 'xml' ? 'bg-blue-600' : fileType === 'txt' ? 'bg-violet-600' : 'bg-emerald-600'
            }`}
          >
            {fileType === 'xml' ? 'XML' : fileType === 'txt' ? 'TXT' : 'JSON'}
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              Validador {fileType === 'xml' ? 'XML' : fileType === 'txt' ? 'TXT' : 'JSON'} · NDD Cargo
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {fileType === 'xml'
                ? 'loteOT_envio · Schema v4.2.12.0'
                : fileType === 'txt'
                  ? 'Layout de arquivo TXT · loteOT_envio'
                  : 'API REST loteOT_envio · Novo layout'}
            </p>
          </div>

          <img
            src="/ndd-logo.svg"
            alt="NDD"
            className="ml-auto h-6 dark:invert opacity-80"
          />

          {/* Como usar? — texto no desktop, só ícone no mobile */}
          <a
            href="#/como-usar"
            aria-label="Como usar?"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg
                       border border-indigo-200 dark:border-indigo-700
                       bg-indigo-50 dark:bg-indigo-950/50
                       text-xs font-semibold text-indigo-700 dark:text-indigo-300
                       hover:bg-indigo-100 dark:hover:bg-indigo-900/60
                       hover:border-indigo-300 dark:hover:border-indigo-600
                       transition-colors"
          >
            <svg className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Como usar?</span>
          </a>

          <button
            type="button"
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
            aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
          >
            {dark ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m8.66-9h-1M4.34 12h-1m15.07-6.36-.7.7M6.34 17.66l-.7.7m12.73 0-.7-.7M6.34 6.34l-.7-.7M12 7a5 5 0 100 10A5 5 0 0012 7z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* File type selector + Materiais de Apoio */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
          {/* Tipo de arquivo */}
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
            Tipo de arquivo
          </span>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(['xml', 'txt', 'json'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleFileTypeChange(type)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  fileType === type
                    ? type === 'xml'
                      ? 'bg-blue-600 text-white'
                      : type === 'txt'
                        ? 'bg-violet-600 text-white'
                        : 'bg-emerald-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Separador */}
          <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Materiais de Apoio */}
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
            Materiais de apoio
          </span>
          <a
            href="#/codigos-sh"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                       border-amber-200 dark:border-amber-800/60
                       bg-amber-50 dark:bg-amber-950/30
                       text-xs font-medium text-amber-700 dark:text-amber-400
                       hover:bg-amber-100 dark:hover:bg-amber-900/40
                       hover:border-amber-300 dark:hover:border-amber-700
                       transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Tabela codigoSH
          </a>
          <a
            href="#/atividade-principal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                       border-amber-200 dark:border-amber-800/60
                       bg-amber-50 dark:bg-amber-950/30
                       text-xs font-medium text-amber-700 dark:text-amber-400
                       hover:bg-amber-100 dark:hover:bg-amber-900/40
                       hover:border-amber-300 dark:hover:border-amber-700
                       transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Tabela atividadePrincipal
          </a>
          <a
            href="#/forma-constituicao"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border
                       border-amber-200 dark:border-amber-800/60
                       bg-amber-50 dark:bg-amber-950/30
                       text-xs font-medium text-amber-700 dark:text-amber-400
                       hover:bg-amber-100 dark:hover:bg-amber-900/40
                       hover:border-amber-300 dark:hover:border-amber-700
                       transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Tabela formaConstituicao
          </a>

        </div>
      </div>

      {/* Integration type selector */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mr-1 shrink-0">
            Tipo de integração
          </span>
          {INTEGRATION_TYPES.map(type => {
            const active = type.activeFor.includes(fileType);
            return (
              <button
                key={type.id}
                type="button"
                disabled={!active}
                onClick={() => active && setIntegrationType(type.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  active
                    ? integrationType === type.id
                      ? fileType === 'xml'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : fileType === 'txt'
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
              >
                {type.label}
                {!active && (
                  <span className="text-[9px] font-semibold uppercase tracking-wide bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded px-1 py-0.5 leading-none">
                    em breve
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 min-h-0 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-5 lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-full">
          {/* Input panel */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex flex-col lg:min-h-0 lg:overflow-hidden">
            {fileType === 'xml' && integrationType === 'emissao' && (
              <div className="mb-4 shrink-0 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Schema
                  </p>
                  <a
                    href="/schemas/loteOT_envio_4_2_12_0.xsd"
                    download="loteOT_envio_4_2_12_0.xsd"
                    onClick={() => track('download_xsd', { file: 'loteOT_envio_4_2_12_0.xsd' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    loteOT_envio_4_2_12_0.xsd
                  </a>
                </div>
                <div className="flex flex-col gap-3">
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Exemplos de arquivo
                  </p>
                  {([
                    {
                      group: 'Sem pagamento',
                      items: [
                        { label: 'TAC · Conta Corrente',       file: 'ex_emissao_lotacao_tac_contacorrente.xml'      },
                        { label: 'ETC · Conta Corrente',       file: 'ex_emissao_lotacao_etc_contacorrente.xml'      },
                        { label: 'TAC-Agr. C.Corr. TAC',      file: 'ex_emissao_tacagregado_tac_contacorrente.xml'  },
                        { label: 'TAC-Agr. · ETC · Outros',   file: 'ex_emissao_tacagregado_etc_outros.xml'         },
                      ],
                    },
                    {
                      group: 'Com pagamento',
                      items: [
                        { label: 'TAC · PIX',                file: 'ex_emissao_lotacao_tac_pix.xml'         },
                        { label: 'ETC · PIX',                file: 'ex_emissao_lotacao_etc_pix.xml'         },
                        { label: 'TAC · NDD Cargo',          file: 'ex_emissao_lotacao_tac_ndd.xml'         },
                        { label: 'ETC · NDD Cargo',          file: 'ex_emissao_lotacao_etc_ndd.xml'         },
                        { label: 'TAC-Agregado · NDD Cargo', file: 'ex_emissao_tacagregado_tac_ndd.xml'     },
                      ],
                    },
                    {
                      group: 'Frota Própria',
                      items: [
                        { label: 'Lotação',    file: 'ex_emissao_lotacao_frota_propria.xml'    },
                        { label: 'Fracionado', file: 'ex_emissao_fracionado_frota_propria.xml' },
                      ],
                    },
                  ] as { group: string; items: { label: string; file: string }[] }[]).map(({ group, items }) => (
                    <div key={group}>
                      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                        {group}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {items.map(({ label, file }) => (
                          <a
                            key={file}
                            href={`/exemplos/emissao/${file}`}
                            download={file}
                            onClick={() => track('download_example', { file, fileType: 'xml' })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                          >
                            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            {label}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {fileType === 'xml' && integrationType === 'retificacao' && (
              <div className="mb-4 shrink-0 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Schema
                  </p>
                  <a
                    href="/schemas/alterarOT_envio_4_2_12_0.xsd"
                    download="alterarOT_envio_4_2_12_0.xsd"
                    onClick={() => track('download_xsd', { file: 'alterarOT_envio_4_2_12_0.xsd' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    alterarOT_envio_4_2_12_0.xsd
                  </a>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Exemplos de arquivo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Fracionado',      file: 'ex_retif_fracionado.xml'    },
                      { label: 'TAC-Agregado',    file: 'ex_retif_agregado.xml'      },
                      { label: 'Com pagamento',   file: 'ex_retif_pagamento.xml'     },
                      { label: 'Sem pagamento',   file: 'ex_retif_semPagamento.xml'  },
                    ].map(({ label, file }) => (
                      <a
                        key={file}
                        href={`/exemplos/retificacao/${file}`}
                        download={file}
                        onClick={() => track('download_example', { file, fileType: 'xml' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {fileType === 'xml' && integrationType === 'cancelamento' && (
              <div className="mb-4 shrink-0 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Schema
                  </p>
                  <a
                    href="/schemas/cancelarOT_envio_4_2_12_0.xsd"
                    download="cancelarOT_envio_4_2_12_0.xsd"
                    onClick={() => track('download_xsd', { file: 'cancelarOT_envio_4_2_12_0.xsd' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    cancelarOT_envio_4_2_12_0.xsd
                  </a>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Exemplos de arquivo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href="/exemplos/cancelamento/ex_cancelamento.xml"
                      download="ex_cancelamento.xml"
                      onClick={() => track('download_example', { file: 'ex_cancelamento.xml', fileType: 'xml' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Cancelamento
                    </a>
                  </div>
                </div>
              </div>
            )}
            {fileType === 'xml' && integrationType === 'encerramento' && (
              <div className="mb-4 shrink-0 flex flex-col gap-3">
                <div>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Schema
                  </p>
                  <a
                    href="/schemas/encerrarOT_envio_4_2_12_0.xsd"
                    download="encerrarOT_envio_4_2_12_0.xsd"
                    onClick={() => track('download_xsd', { file: 'encerrarOT_envio_4_2_12_0.xsd' })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  >
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    encerrarOT_envio_4_2_12_0.xsd
                  </a>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Exemplos de arquivo
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Carga Lotação',  file: 'ex_encerra_lotacao.xml'   },
                      { label: 'Fracionado',     file: 'ex_encerra_fracionado.xml' },
                      { label: 'TAC-Agregado',   file: 'ex_encerra_agregado.xml'  },
                    ].map(({ label, file }) => (
                      <a
                        key={file}
                        href={`/exemplos/encerramento/${file}`}
                        download={file}
                        onClick={() => track('download_example', { file, fileType: 'xml' })}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                      >
                        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        {label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {fileType === 'txt' && integrationType === 'emissao' && (
              <div className="mb-4 shrink-0">
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Exemplos de arquivo
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Carga Fracionada', file: 'ex_emissao_fracionado.txt' },
                    { label: 'TAC-Agregado',     file: 'ex_emissao_agregado.txt'   },
                    { label: 'Carga Lotação',    file: 'ex_emissao_lotacao.txt'    },
                    { label: 'Frota',            file: 'ex_emissao_frota.txt'      },
                  ].map(({ label, file }) => (
                    <a
                      key={file}
                      href={`/exemplos/emissao/${file}`}
                      download={file}
                      onClick={() => track('download_example', { file, fileType: 'txt' })}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-violet-200 dark:border-violet-800 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                    >
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      {label}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {fileType === 'json' && integrationType === 'emissao' && (
              <div className="mb-4 shrink-0 flex flex-col gap-3">
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Exemplos de payload
                </p>
                {([
                  {
                    group: 'Sem pagamento',
                    items: [
                      { label: 'TAC · Conta Corrente',       file: 'ex_emissao_lotacao_tac_contacorrente.json'       },
                      { label: 'ETC · Conta Corrente',       file: 'ex_emissao_lotacao_etc_contacorrente.json'       },
                      { label: 'TAC-Agr. · Conta Corrente', file: 'ex_emissao_tacagregado_tac_contacorrente.json'   },
                    ],
                  },
                  {
                    group: 'Com pagamento',
                    items: [
                      { label: 'TAC · PIX',              file: 'ex_emissao_lotacao_tac_pix.json'     },
                      { label: 'ETC · PIX',              file: 'ex_emissao_lotacao_etc_pix.json'     },
                      { label: 'TAC · NDD Cargo',        file: 'ex_emissao_lotacao_tac_ndd.json'     },
                      { label: 'ETC · NDD Cargo',        file: 'ex_emissao_lotacao_etc_ndd.json'     },
                      { label: 'TAC-Agregado · NDD Cargo', file: 'ex_emissao_tacagregado_ndd.json'   },
                    ],
                  },
                  {
                    group: 'Frota Própria',
                    items: [
                      { label: 'Lotação',    file: 'ex_emissao_lotacao_frota_propria.json'    },
                      { label: 'Fracionado', file: 'ex_emissao_fracionado_frota_propria.json' },
                    ],
                  },
                ] as { group: string; items: { label: string; file: string }[] }[]).map(({ group, items }) => (
                  <div key={group}>
                    <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                      {group}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {items.map(({ label, file }) => (
                        <a
                          key={file}
                          href={`/exemplos/emissao/${file}`}
                          download={file}
                          onClick={() => track('download_example', { file, fileType: 'json' })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                        >
                          <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          {label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <XmlInput
              ref={inputRef}
              fileType={fileType}
              value={content}
              onChange={handleContentChange}
              onValidate={handleValidate}
              isValidating={isValidating}
            />
          </div>

          {/* Result panel */}
          <div
            ref={resultPanelRef}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex flex-col lg:min-h-0 lg:overflow-hidden"
          >
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-4 shrink-0">
              Resultado da Validação
            </h2>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ValidationResult
                result={result}
                xml={content}
                fileType={fileType}
                onErrorClick={handleErrorClick}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-3 shrink-0">
        <div className="flex items-center justify-center gap-3 text-xs text-gray-400 dark:text-gray-600">
          <span>Validação local · nenhum dado é enviado ao servidor</span>
          <span aria-hidden>·</span>
          <ReleaseNotes />
        </div>
      </footer>
    </div>
  );
}
