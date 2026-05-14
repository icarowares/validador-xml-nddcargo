import { useEffect, useRef, useState } from 'react';
import { XmlInput, type XmlInputHandle } from './components/XmlInput';
import { ValidationResult } from './components/ValidationResult';
import { validate } from './validator/validate';
import { validateTxt } from './validator/validateTxt';
import type { ValidationResult as ValidationResultType } from './validator/types';
import './App.css';

type FileType = 'xml' | 'txt';
type IntegrationType = 'emissao' | 'retificacao' | 'cancelamento' | 'encerramento';

const INTEGRATION_TYPES: { id: IntegrationType; label: string; activeFor: FileType[] }[] = [
  { id: 'emissao',      label: 'Emissão',      activeFor: ['xml', 'txt'] },
  { id: 'retificacao',  label: 'Retificação',  activeFor: []             },
  { id: 'cancelamento', label: 'Cancelamento', activeFor: []             },
  { id: 'encerramento', label: 'Encerramento', activeFor: []             },
];

export default function App() {
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

  function handleFileTypeChange(type: FileType) {
    if (type === fileType) return;
    setFileType(type);
    setContent('');
    setResult(null);
  }

  function handleValidate() {
    setIsValidating(true);
    setTimeout(() => {
      const res = fileType === 'txt' ? validateTxt(content) : validate(content);
      setResult(res);
      setIsValidating(false);
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
              fileType === 'xml' ? 'bg-blue-600' : 'bg-violet-600'
            }`}
          >
            {fileType === 'xml' ? 'XML' : 'TXT'}
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              Validador {fileType === 'xml' ? 'XML' : 'TXT'} · NDD Cargo
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {fileType === 'xml'
                ? 'loteOT_envio · Schema v4.2.12.0'
                : 'Layout de arquivo TXT · loteOT_envio'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setDark(d => !d)}
            className="ml-auto p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
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

      {/* File type selector */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0">
            Tipo de arquivo
          </span>
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {(['xml', 'txt'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => handleFileTypeChange(type)}
                className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide transition-colors ${
                  fileType === type
                    ? type === 'xml'
                      ? 'bg-blue-600 text-white'
                      : 'bg-violet-600 text-white'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>
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
                        : 'bg-violet-600 text-white shadow-sm'
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
              <div className="mb-4 shrink-0">
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Schema
                </p>
                <a
                  href="/loteOT_envio_4_2_12_0.xsd"
                  download="loteOT_envio_4_2_12_0.xsd"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-blue-200 dark:border-blue-800 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                >
                  <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  loteOT_envio_4_2_12_0.xsd
                </a>
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
                      href={`/${file}`}
                      download={file}
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
        <p className="text-center text-xs text-gray-400 dark:text-gray-600">
          Validação local · nenhum dado é enviado ao servidor
        </p>
      </footer>
    </div>
  );
}
