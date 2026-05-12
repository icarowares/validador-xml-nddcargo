import type { ValidationResult } from '../validator/types';

interface Props {
  result: ValidationResult | null;
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

export function ValidationResult({ result }: Props) {
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
          Cole ou faça upload de um XML e clique em <strong>Validar XML</strong>
        </p>
      </div>
    );
  }

  if (result.parseError) {
    return (
      <div className="flex flex-col gap-3">
        <StatusBanner
          type="error"
          title="XML malformado"
          subtitle="Corrija a sintaxe do documento antes de prosseguir"
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
          title="XML válido!"
          subtitle={`${result.otCount} OT${result.otCount !== 1 ? 's' : ''} validada${result.otCount !== 1 ? 's' : ''} com sucesso · Schema loteOT_envio v4.2.12.0`}
        />
      ) : (
        <StatusBanner
          type="error"
          title={`${result.errors.length} erro${result.errors.length !== 1 ? 's' : ''} encontrado${result.errors.length !== 1 ? 's' : ''}`}
          subtitle="Corrija os problemas abaixo e valide novamente"
        />
      )}

      {result.errors.length > 0 && (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-320px)]">
          {result.errors.map((err, i) => (
            <div
              key={i}
              className="p-3 bg-white border border-red-100 rounded-lg hover:border-red-200 transition-colors"
            >
              <PathBreadcrumb path={err.path} />
              <p className="text-sm text-gray-800 leading-snug">{err.message}</p>
            </div>
          ))}
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
