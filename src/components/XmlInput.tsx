import { forwardRef, useRef, useImperativeHandle, useState, useEffect } from 'react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { EditorView, placeholder } from '@codemirror/view';
import { xml } from '@codemirror/lang-xml';
import { json } from '@codemirror/lang-json';
import { nddTxt } from '../lib/nddTxtLang';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';

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

// Prevent CodeMirror from handling file drops — outer container handles them.
const dropInterceptor = EditorView.domEventHandlers({
  drop: () => true,
});

// ── XML formatter ────────────────────────────────────────────────────────────
function escapeXmlAttr(v: string) {
  return v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
function escapeXmlText(v: string) {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function serializeXmlNode(node: Node, depth: number): string {
  const pad = '  '.repeat(depth);

  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent?.trim() ?? '';
    return t ? `${pad}${escapeXmlText(t)}` : '';
  }
  if (node.nodeType === Node.COMMENT_NODE) {
    return `${pad}<!--${node.textContent}-->`;
  }
  if (node.nodeType === Node.CDATA_SECTION_NODE) {
    return `${pad}<![CDATA[${node.textContent}]]>`;
  }
  if (node.nodeType === Node.PROCESSING_INSTRUCTION_NODE) {
    const pi = node as ProcessingInstruction;
    return `${pad}<?${pi.target} ${pi.data}?>`;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as Element;
  const attrs = Array.from(el.attributes)
    .map(a => ` ${a.name}="${escapeXmlAttr(a.value)}"`)
    .join('');

  // significant children (ignore whitespace-only text nodes)
  const children = Array.from(el.childNodes).filter(
    n => n.nodeType !== Node.TEXT_NODE || (n.textContent?.trim() ?? '') !== '',
  );

  if (children.length === 0) return `${pad}<${el.tagName}${attrs}/>`;

  if (
    children.length === 1 &&
    children[0].nodeType === Node.TEXT_NODE
  ) {
    const text = escapeXmlText(children[0].textContent?.trim() ?? '');
    return `${pad}<${el.tagName}${attrs}>${text}</${el.tagName}>`;
  }

  const inner = children.map(c => serializeXmlNode(c, depth + 1)).filter(Boolean).join('\n');
  return `${pad}<${el.tagName}${attrs}>\n${inner}\n${pad}</${el.tagName}>`;
}

function formatXml(raw: string): string {
  const trimmed = raw.trim();
  const doc = new DOMParser().parseFromString(trimmed, 'application/xml');
  if (doc.querySelector('parseerror')) throw new Error('invalid xml');

  const declMatch = trimmed.match(/^<\?xml[^?]*\?>/i);
  const decl = declMatch ? declMatch[0] + '\n' : '';

  const bodyLines = Array.from(doc.childNodes)
    .filter(n => !(n.nodeType === Node.PROCESSING_INSTRUCTION_NODE && (n as ProcessingInstruction).target === 'xml'))
    .map(n => serializeXmlNode(n, 0))
    .filter(Boolean)
    .join('\n');

  return decl + bodyLines;
}

// When pasting into a JSON editor, auto-format valid JSON with 2-space indentation.
const jsonPasteFormatter = EditorView.domEventHandlers({
  paste(e, view) {
    const text = e.clipboardData?.getData('text');
    if (!text) return false;
    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      if (formatted === text) return false; // already formatted, let default paste run
      e.preventDefault();
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: formatted },
        selection: { anchor: from + formatted.length },
      });
      return true;
    } catch {
      return false; // not valid JSON — let default paste run
    }
  },
});

// When pasting into an XML editor, auto-format valid XML with 2-space indentation.
const xmlPasteFormatter = EditorView.domEventHandlers({
  paste(e, view) {
    const text = e.clipboardData?.getData('text');
    if (!text) return false;
    try {
      const formatted = formatXml(text);
      if (formatted === text) return false; // already formatted, let default paste run
      e.preventDefault();
      const { from, to } = view.state.selection.main;
      view.dispatch({
        changes: { from, to, insert: formatted },
        selection: { anchor: from + formatted.length },
      });
      return true;
    } catch {
      return false; // not valid XML — let default paste run
    }
  },
});

// Base editor styles: monospace font + size matching the previous textarea
const editorTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '12px',
    lineHeight: '1.625',
    overflow: 'auto',
  },
  '.cm-placeholder': { color: '#9ca3af' },
});

export const XmlInput = forwardRef<XmlInputHandle, Props>(
  function XmlInput({ fileType, value, onChange, onValidate, isValidating }, ref) {
    const fileRef = useRef<HTMLInputElement>(null);
    const editorRef = useRef<ReactCodeMirrorRef>(null);
    const validateBtnRef = useRef<HTMLButtonElement>(null);
    const [btnGlow, setBtnGlow] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const dragCounterRef = useRef(0);
    const prevValueRef = useRef(value);

    const [isDark, setIsDark] = useState(() =>
      document.documentElement.classList.contains('dark'),
    );

    useEffect(() => {
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
      return () => observer.disconnect();
    }, []);

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
        const view = editorRef.current?.view;
        if (!view) return;
        const target = Math.max(1, Math.min(line, view.state.doc.lines));
        const docLine = view.state.doc.line(target);
        view.dispatch({
          selection: { anchor: docLine.from, head: docLine.to },
          effects: EditorView.scrollIntoView(docLine.from, { y: 'center' }),
        });
        view.focus();
      },
    }));

    const isXml  = fileType === 'xml';
    const isJson = fileType === 'json';

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (!file) return;
      loadFile(file);
      e.target.value = '';
    }

    function loadFile(file: File) {
      const reader = new FileReader();
      reader.onload = ev => onChange((ev.target?.result as string) ?? '');
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

    function handleDrop(e: React.DragEvent) {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    }

    const lineCount = value ? value.split('\n').length : 0;
    const charCount = value.length;

    const extensions = [
      ...(isXml ? [xml(), xmlPasteFormatter] : isJson ? [json(), jsonPasteFormatter] : [nddTxt]),
      placeholder(
        isXml
          ? 'Cole ou arraste um XML aqui...'
          : isJson
            ? 'Cole ou arraste um JSON aqui...'
            : 'Cole ou arraste um arquivo TXT aqui...',
      ),
      editorTheme,
      dropInterceptor,
    ];

    const dragBorder = isXml
      ? 'border-blue-400 ring-2 ring-blue-300 bg-blue-50/40 dark:bg-blue-950/20'
      : isJson
        ? 'border-emerald-400 ring-2 ring-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20'
        : 'border-violet-400 ring-2 ring-violet-300 bg-violet-50/40 dark:bg-violet-950/20';

    const dragIconColor = isXml ? 'text-blue-400' : isJson ? 'text-emerald-400' : 'text-violet-400';
    const dragTextColor = isXml ? 'text-blue-500' : isJson ? 'text-emerald-500' : 'text-violet-500';

    const btnBase = isXml
      ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
      : isJson
        ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
        : 'bg-violet-600 hover:bg-violet-700 active:bg-violet-800';

    const btnGlowClass = btnGlow
      ? isXml
        ? 'ring-4 ring-blue-300 ring-offset-1'
        : isJson
          ? 'ring-4 ring-emerald-300 ring-offset-1'
          : 'ring-4 ring-violet-300 ring-offset-1'
      : '';

    return (
      <div className="flex flex-col flex-1 min-h-0 gap-3">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between shrink-0">
          <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            {isXml ? 'XML de Entrada' : isJson ? 'JSON de Entrada' : 'TXT de Entrada'}
          </h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
              onClick={() => onChange('')}
              disabled={!value}
              className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Limpar
            </button>
          </div>
        </div>

        {/* ── Editor ─────────────────────────────────────────────────────── */}
        <div
          className={`relative flex-1 min-h-96 lg:min-h-0 rounded-lg border overflow-hidden transition-colors ${
            isDragging
              ? dragBorder
              : 'border-gray-200 dark:border-gray-700'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <svg className={`w-10 h-10 ${dragIconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span className={`text-sm font-medium ${dragTextColor}`}>Solte o arquivo aqui</span>
            </div>
          )}
          <CodeMirror
            ref={editorRef}
            value={value}
            onChange={onChange}
            theme={isDark ? vscodeDark : vscodeLight}
            extensions={extensions}
            height="100%"
            style={{ height: '100%' }}
            basicSetup={{
              lineNumbers: true,
              foldGutter: !isJson ? true : true,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              bracketMatching: true,
              closeBrackets: false,
              autocompletion: false,
              searchKeymap: true,
            }}
          />
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
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
            className={`inline-flex items-center gap-2 px-5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm ${btnBase} ${btnGlowClass}`}
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
