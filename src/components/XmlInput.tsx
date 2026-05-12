import { useRef } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onValidate: () => void;
  isValidating: boolean;
}

export function XmlInput({ value, onChange, onValidate, isValidating }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => onChange((ev.target?.result as string) ?? '');
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  const lineCount = value ? value.split('\n').length : 0;
  const charCount = value.length;

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
          XML de Entrada
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-600 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload .xml
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={handleFile}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            disabled={!value}
            className="text-xs px-3 py-1.5 rounded-md border border-gray-300 text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Limpar
          </button>
        </div>
      </div>

      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={'Cole o XML aqui...\n\n<loteOT_envio>\n  <versao>4.2.12.0</versao>\n  ...\n</loteOT_envio>'}
        className="flex-1 min-h-96 w-full font-mono text-xs leading-relaxed p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-800 placeholder-gray-300"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {value
            ? `${lineCount.toLocaleString('pt-BR')} linhas · ${charCount.toLocaleString('pt-BR')} caracteres`
            : 'Nenhum conteúdo'}
        </span>
        <button
          type="button"
          onClick={onValidate}
          disabled={!value.trim() || isValidating}
          className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isValidating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Validando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Validar XML
            </>
          )}
        </button>
      </div>
    </div>
  );
}
