interface ValidationStatusProps {
  isValidating: boolean;
  hasError: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * Indicador de estado de validación del documento.
 * Muestra un spinner mientras valida y un mensaje de error con opción de reintentar.
 */
export function ValidationStatus({
  isValidating,
  hasError,
  errorMessage,
  onRetry,
}: ValidationStatusProps) {
  if (!isValidating && !hasError) return null;

  if (isValidating) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm animate-pulse">
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span>Validando documento...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="flex items-center justify-between gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700 text-sm">
          <svg
            className="h-4 w-4 flex-shrink-0"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errorMessage || "No se pudo validar el documento"}</span>
        </div>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 px-3 py-1 text-sm font-medium text-red-700 hover:text-red-800 hover:bg-red-100 rounded-md transition-colors"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return null;
}

export default ValidationStatus;
