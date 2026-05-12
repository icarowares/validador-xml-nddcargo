import { useState } from 'react';
import { XmlInput } from './components/XmlInput';
import { ValidationResult } from './components/ValidationResult';
import { validate } from './validator/validate';
import type { ValidationResult as ValidationResultType } from './validator/types';
import './App.css';

export default function App() {
  const [xml, setXml] = useState('');
  const [result, setResult] = useState<ValidationResultType | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  function handleValidate() {
    setIsValidating(true);
    // setTimeout allows the spinner to render before the synchronous validation runs
    setTimeout(() => {
      const res = validate(xml);
      setResult(res);
      setIsValidating(false);
    }, 16);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 shadow-sm">
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

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 h-full">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
            <XmlInput
              value={xml}
              onChange={v => { setXml(v); setResult(null); }}
              onValidate={handleValidate}
              isValidating={isValidating}
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4 shrink-0">
              Resultado da Validação
            </h2>
            <div className="flex-1">
              <ValidationResult result={result} />
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-3">
        <p className="text-center text-xs text-gray-400">
          Validação local · nenhum dado é enviado ao servidor
        </p>
      </footer>
    </div>
  );
}
