import { useRef, useState } from 'react';
import { XmlInput, type XmlInputHandle } from './components/XmlInput';
import { ValidationResult } from './components/ValidationResult';
import { validate } from './validator/validate';
import type { ValidationResult as ValidationResultType } from './validator/types';
import './App.css';

type IntegrationType = 'emissao' | 'retificacao' | 'cancelamento' | 'encerramento';

const INTEGRATION_TYPES: { id: IntegrationType; label: string; active: boolean }[] = [
  { id: 'emissao',      label: 'Emissão',      active: true  },
  { id: 'retificacao',  label: 'Retificação',  active: false },
  { id: 'cancelamento', label: 'Cancelamento', active: false },
  { id: 'encerramento', label: 'Encerramento', active: false },
];

export default function App() {
  const [xml, setXml] = useState('');
  const [result, setResult] = useState<ValidationResultType | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [integrationType, setIntegrationType] = useState<IntegrationType>('emissao');
  const xmlInputRef = useRef<XmlInputHandle>(null);
  const resultPanelRef = useRef<HTMLDivElement>(null);

  function handleValidate() {
    setIsValidating(true);
    setTimeout(() => {
      const res = validate(xml);
      setResult(res);
      setIsValidating(false);
      // On mobile (stacked layout) scroll to result panel after render
      setTimeout(() => {
        resultPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }, 16);
  }

  function handleXmlChange(v: string) {
    setXml(v);
    setResult(null);
  }

  function handleErrorClick(line: number) {
    xmlInputRef.current?.scrollToLine(line);
  }

  return (
    <div className="min-h-screen lg:h-screen bg-slate-50 flex flex-col lg:overflow-hidden">
      <header className="bg-white border-b border-gray-200 shadow-sm shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 text-white font-bold text-sm shrink-0">
            XML
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              Validador XML · NDD Cargo
            </h1>
            <p className="text-xs text-gray-500">
              loteOT_envio · Schema v4.2.12.0
            </p>
          </div>

          <a
            href="/loteOT_envio_4_2_12_0.xsd"
            download="loteOT_envio_4_2_12_0.xsd"
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Baixar XSD
          </a>
        </div>
      </header>

      {/* Integration type selector */}
      <div className="bg-white border-b border-gray-100 shrink-0">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mr-1 shrink-0">
            Tipo de integração
          </span>
          {INTEGRATION_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              disabled={!type.active}
              onClick={() => type.active && setIntegrationType(type.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                type.active
                  ? integrationType === type.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-gray-50 text-gray-300 cursor-not-allowed'
              }`}
            >
              {type.label}
              {!type.active && (
                <span className="text-[9px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-400 rounded px-1 py-0.5 leading-none">
                  em breve
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 min-h-0 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-5 lg:overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:h-full">
          {/* Input panel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col lg:min-h-0 lg:overflow-hidden">
            <XmlInput
              ref={xmlInputRef}
              value={xml}
              onChange={handleXmlChange}
              onValidate={handleValidate}
              isValidating={isValidating}
            />
          </div>

          {/* Result panel */}
          <div
            ref={resultPanelRef}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col lg:min-h-0 lg:overflow-hidden"
          >
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4 shrink-0">
              Resultado da Validação
            </h2>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ValidationResult
                result={result}
                xml={xml}
                onErrorClick={handleErrorClick}
              />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-3 shrink-0">
        <p className="text-center text-xs text-gray-400">
          Validação local · nenhum dado é enviado ao servidor
        </p>
      </footer>
    </div>
  );
}
