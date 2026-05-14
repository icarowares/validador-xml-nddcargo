import { useMemo } from 'react';
import type { ValidationResult } from '../validator/types';
import { findLineForPath } from '../utils/xmlLineLocator';

interface Props {
  result: ValidationResult | null;
  xml?: string;
  fileType?: 'xml' | 'txt';
  onErrorClick?: (line: number) => void;
}

function PathBreadcrumb({ path }: { path: string }) {
  const parts = path.split('.');
  return (
    <div className="flex flex-wrap items-center gap-0.5 font-mono text-[10px] text-gray-400 mb-1">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-0.5">
          {i > 0 && <span className="text-gray-300">›</span>}
          <span className={i === parts.length - 1 ? 'text-gray-500 font-semibold' : ''}>
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}

export function ValidationResult({ result, xml, fileType = 'xml', onErrorClick }: Props) {
  const errorLines = useMemo(() => {
    if (!result) return [];
    return result.errors.map(err => {
      if (err.lineNumber !== undefined) return err.lineNumber;
      if (!xml) return null;
      return findLineForPath(xml, err.path);
    });
  }, [xml, result]);

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 py-16">
        <svg className="w-14 h-14 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-center max-w-xs">
          Cole ou faça upload de um {fileType === 'xml' ? 'XML' : 'TXT'} e clique em{' '}
          <strong>{fileType === 'xml' ? 'Validar XML' : 'Validar TXT'}</strong>
        </p>
      </div>
    );
  }

  if (result.parseError) {
    return (
      <div className="flex flex-col gap-3">
        <StatusBanner
          type="error"
          title={fileType === 'xml' ? 'XML malformado' : 'Arquivo TXT inválido'}
          subtitle="Corrija os erros antes de prosseguir"
        />
        <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
          <p className="text-xs font-mono text-red-700 whitespace-pre-wrap break-all leading-relaxed">
            {result.parseError}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {result.valid ? (
        <StatusBanner
          type="success"
          title={fileType === 'xml' ? 'XML válido!' : 'TXT válido!'}
          subtitle={`${result.otCount} OT${result.otCount !== 1 ? 's' : ''} validada${result.otCount !== 1 ? 's' : ''} com sucesso · ${fileType === 'xml' ? 'Schema loteOT_envio v4.2.12.0' : 'Layout TXT loteOT_envio'}`}
        />
      ) : (
        <StatusBanner
          type="error"
          title={`${result.errors.length} erro${result.errors.length !== 1 ? 's' : ''} encontrado${result.errors.length !== 1 ? 's' : ''}`}
          subtitle="Clique em um erro para localizar no XML"
        />
      )}

      {result.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          {result.errors.map((err, i) => {
            const line = errorLines[i] ?? null;
            const clickable = line !== null && !!onErrorClick;
            return (
              <div
                key={i}
                onClick={() => { if (clickable) onErrorClick!(line!); }}
                className={`p-3 bg-white border border-red-100 rounded-lg transition-colors ${
                  clickable
                    ? 'cursor-pointer hover:border-red-300 hover:bg-red-50/40'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <PathBreadcrumb path={err.path} />
                    <p className="text-sm text-gray-800 leading-snug">{err.message}</p>
                  </div>
                  {line !== null && (
                    <span className="shrink-0 mt-0.5 inline-flex items-center gap-1 text-[10px] font-mono bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 leading-none">
                      <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      L{line}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatusBanner({
  type,
  title,
  subtitle,
}: {
  type: 'success' | 'error';
  title: string;
  subtitle: string;
}) {
  const isSuccess = type === 'success';
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border ${
        isSuccess
          ? 'bg-green-50 border-green-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <span className={`text-2xl leading-none mt-0.5 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
        {isSuccess ? '✓' : '✗'}
      </span>
      <div>
        <p className={`font-semibold ${isSuccess ? 'text-green-800' : 'text-red-800'}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>{subtitle}</p>
      </div>
    </div>
  );
}
