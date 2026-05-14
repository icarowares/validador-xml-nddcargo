import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react';

export interface XmlInputHandle {
  scrollToLine: (line: number) => void;
}

interface Props {
  fileType: 'xml' | 'txt' | 'json';
  value: string;
  onChange: (value: string) => void;
  onValidate: () => void;
  isValidating: boolean;
}

export const XmlInput = forwardRef<XmlInputHandle, Props>(
  function XmlInput({ fileType, value, onChange, onValidate, isValidating }, ref) {
    const fileRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const validateBtnRef = useRef<HTMLButtonElement>(null);
    const [activeLine, setActiveLine] = useState<number | null>(null);
    const [btnGlow, setBtnGlow] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounterRef = useRef(0);
    const prevValueRef = useRef(value);

    useEffect(() => {
      const wasEmpty = !prevValueRef.current.trim();
      const isNowFilled = !!value.trim();
      prevValueRef.current = value;

      if (wasEmpty && isNowFilled) {
        validateBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setBtnGlow(true);
        const t = setTimeout(() => setBtnGlow(false), 1400);
        return () => clearTimeout(t);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    useImperativeHandle(ref, () => ({
      scrollToLine(line: number) {
        const ta = textareaRef.current;
        if (!ta) return;
        const lines = ta.value.split('\n');
        if (line < 1 || line > lines.length) return;

        const lineStart =
          lines.slice(0, line - 1).join('\n').length + (line > 1 ? 1 : 0);
        const lineEnd = lineStart + (lines[line - 1]?.length ?? 0);

        ta.focus();
        ta.setSelectionRange(lineStart, lineEnd);

        const lh =
          parseFloat(window.getComputedStyle(ta).lineHeight) || 19.5;
        ta.scrollTop = Math.max(0, (line - 1) * lh - ta.clientHeight / 3);

        if (gutterRef.current) {
          gutterRef.current.scrollTop = ta.scrollTop;
        }
        setActiveLine(line);
      },
    }));

    const isXml = fileType === 'xml';
    const isJson = fileType === 'json';

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      loadFile(file);
      e.target.value = '';
    }

    function handleScroll() {
      if (gutterRef.current && textareaRef.current) {
        gutterRef.current.scrollTop = textareaRef.current.scrollTop;
      }
    }

    function loadFile(file: File) {
      const reader = new FileReader();
      reader.onload = ev => {
        onChange((ev.target?.result as string) ?? '');
        setActiveLine(null);
      };
      reader.readAsText(file, 'UTF-8');
    }

    function handleDragEnter(e: React.DragEvent) {
      e.preventDefault();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) setIsDragging(true);
    }

    function handleDragLeave(e: React.DragEvent) {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) setIsDragging(false);
    }

    function handleDragOver(e: React.DragEvent) {
      e.preventDefault();
    }

    function handleDrop(e: React.DragEvent) {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    }

    const lines = value ? value.split('\n') : [];
    const lineCount = lines.length;
    const charCount = value.length;
    const gutterWidth =
      lineCount >= 10000
        ? '3.75rem'
        : lineCount >= 1000
          ? '3.25rem'
          : lineCount >= 100
            ? '2.75rem'
            : '2.25rem';

    return (
      <div className="flex flex-col flex-1 min-h-0 gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {isXml ? 'XML de Entrada' : isJson ? 'JSON de Entrada' : 'TXT de Entrada'}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              {isXml ? 'Upload .xml' : isJson ? 'Upload .json' : 'Upload .txt'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept={isXml ? '.xml,text/xml,application/xml' : isJson ? '.json,application/json' : '.txt,text/plain'}
              className="hidden"
              onChange={handleFile}
            />
            <button
              type="button"
              onClick={() => {
                onChange('');
                setActiveLine(null);
              }}
              disabled={!value}
              className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        <div
          className={`relative flex flex-1 min-h-96 lg:min-h-0 rounded-lg border overflow-hidden focus-within:ring-2 focus-within:border-transparent transition-colors ${
            isDragging
              ? isXml
                ? 'border-blue-400 ring-2 ring-blue-300 bg-blue-50/40 dark:bg-blue-950/20'
                : isJson
                  ? 'border-emerald-400 ring-2 ring-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
                  : 'border-violet-400 ring-2 ring-violet-300 bg-violet-50/40 dark:bg-violet-950/20'
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 focus-within:ring-blue-500'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <svg className={`w-10 h-10 ${isXml ? 'text-blue-400' : isJson ? 'text-emerald-400' : 'text-violet-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className={`text-sm font-medium ${isXml ? 'text-blue-500' : isJson ? 'text-emerald-500' : 'text-violet-500'}`}>
                Solte o arquivo aqui
              </span>
            </div>
          )}
          {value && (
            <div
              ref={gutterRef}
              className="py-3 font-mono text-xs leading-relaxed text-right select-none bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden shrink-0"
              style={{ width: gutterWidth }}
              aria-hidden="true"
            >
              {lines.map((_, i) => (
                <div
                  key={i}
                  className={`px-2 ${
                    activeLine === i + 1
                      ? 'bg-amber-200 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-semibold'
                      : 'text-gray-400 dark:text-gray-600'
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => {
              onChange(e.target.value);
              setActiveLine(null);
            }}
            onScroll={handleScroll}
            placeholder={
              isXml
                ? 'Cole ou arraste um XML aqui...\n\n<loteOT_envio>\n  <versao>4.2.12.0</versao>\n  ...\n</loteOT_envio>'
                : isJson
                  ? 'Cole ou arraste um JSON aqui...\n\n{\n  "ide": { "cnpj": "...", "tipoOperacao": 1, ... },\n  "transp": { ... },\n  "veiculos": [ ... ],\n  "valores": { ... }\n}'
                  : 'Cole ou arraste um arquivo TXT aqui...\n\nLOTEOT|VERSAO|...'
            }
            wrap="off"
            className="flex-1 py-3 px-3 font-mono text-xs leading-relaxed resize-none focus:outline-none bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-300 dark:placeholder-gray-600"
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </div>

        <div className="flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {value
              ? `${lineCount.toLocaleString('pt-BR')} linhas · ${charCount.toLocaleString('pt-BR')} caracteres`
              : 'Nenhum conteúdo'}
          </span>
          <button
            ref={validateBtnRef}
            type="button"
            onClick={onValidate}
            disabled={!value.trim() || isValidating}
            className={`inline-flex items-center gap-2 px-5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${
              isXml
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : isJson
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                  : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800'
            } ${btnGlow ? (isXml ? 'ring-4 ring-blue-300 ring-offset-1' : isJson ? 'ring-4 ring-emerald-300 ring-offset-1' : 'ring-4 ring-violet-300 ring-offset-1') : ''}`}
          >
            {isValidating ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Validando...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {isXml ? 'Validar XML' : isJson ? 'Validar JSON' : 'Validar TXT'}
              </>
            )}
          </button>
        </div>
      </div>
    );
  },
);
