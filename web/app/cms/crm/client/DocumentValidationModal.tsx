import { Fragment, type ReactNode } from "react";
import {
  createPortalHook,
  type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";

/**
 * Tipos de decisiones que el usuario puede tomar cuando hay conflictos de documento.
 */
export type DocumentDecisionType =
  | "existing_client" // El documento ya corresponde a un cliente
  | "existing_user" // Existe usuario pero no cliente
  | "not_found_in_edit" // En edición, el documento no existe
  | "validation_error"; // Error al validar

/**
 * Acciones disponibles para cada tipo de decisión.
 */
export type DocumentDecisionAction =
  | "view_client" // Ver el cliente existente
  | "continue_editing" // Continuar editando el formulario actual
  | "convert_to_client" // Convertir usuario existente a cliente
  | "create_new" // Crear nuevo cliente con este documento
  | "revert_document" // Revertir al documento original
  | "retry" // Reintentar la validación
  | "cancel"; // Cancelar/cerrar modal

interface ExistingClientData {
  id: number;
  name: string;
}

interface ExistingUserData {
  id: number;
  name: string;
  hasPersonData: boolean;
  hasCompanyData: boolean;
}

interface ValidationErrorData {
  message: string;
}

interface NotFoundData {
  documentTypeId: number;
  documentNumber: string;
}

export type DocumentDecisionData =
  | { type: "existing_client"; client: ExistingClientData }
  | { type: "existing_user"; user: ExistingUserData }
  | { type: "not_found_in_edit"; data: NotFoundData }
  | { type: "validation_error"; error: ValidationErrorData };

/**
 * Props para el contenido del modal de decisión de documento.
 */
interface DocumentValidationContentProps {
  decision: DocumentDecisionData;
  onAction: (action: DocumentDecisionAction) => void;
  onClose?: () => void;
}

/**
 * Contenido del modal de decisión para conflictos de documento.
 * Este componente se renderiza dentro del PortalModal.
 */
function DocumentValidationContent({
  decision,
  onAction,
  onClose,
}: DocumentValidationContentProps) {
  const handleAction = (action: DocumentDecisionAction) => {
    onAction(action);
    if (onClose) onClose();
  };

  const { bgColor, iconBgColor, iconColor } = getColorScheme(decision.type);

  return (
    <>
      {/* Header - Clean design matching app palette */}
      <div className={`px-6 py-4 ${bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgColor}`}>
            {getIcon(decision.type, iconColor)}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {getTitle(decision.type)}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-5">{renderContent(decision)}</div>

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700/50 flex flex-wrap gap-3 justify-end">
        {renderActions(decision, handleAction)}
      </div>
    </>
  );
}

/**
 * Color scheme based on app's official palette
 * Primary: blue (info/user), Warning: amber (existing client), Danger: red (error), Secondary: slate (not found)
 */
function getColorScheme(type: DocumentDecisionData["type"]): {
  bgColor: string;
  iconBgColor: string;
  iconColor: string;
} {
  switch (type) {
    case "existing_client":
      return {
        bgColor: "bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50",
        iconBgColor: "bg-amber-100 dark:bg-amber-800/40",
        iconColor: "h-5 w-5 text-amber-600 dark:text-amber-400",
      };
    case "existing_user":
      return {
        bgColor: "bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800/50",
        iconBgColor: "bg-blue-100 dark:bg-blue-800/40",
        iconColor: "h-5 w-5 text-blue-600 dark:text-blue-400",
      };
    case "not_found_in_edit":
      return {
        bgColor: "bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700/50",
        iconBgColor: "bg-slate-100 dark:bg-slate-700/40",
        iconColor: "h-5 w-5 text-slate-600 dark:text-slate-400",
      };
    case "validation_error":
      return {
        bgColor: "bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800/50",
        iconBgColor: "bg-red-100 dark:bg-red-800/40",
        iconColor: "h-5 w-5 text-red-600 dark:text-red-400",
      };
  }
}

function getIcon(type: DocumentDecisionData["type"], iconClass: string): ReactNode {
  switch (type) {
    case "existing_client":
      return (
        <svg
          className={iconClass}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
          />
        </svg>
      );
    case "existing_user":
      return (
        <svg
          className={iconClass}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      );
    case "not_found_in_edit":
      return (
        <svg
          className={iconClass}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
          />
        </svg>
      );
    case "validation_error":
      return (
        <svg
          className={iconClass}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      );
  }
}

function getTitle(type: DocumentDecisionData["type"]): string {
  switch (type) {
    case "existing_client":
      return "Cliente Existente";
    case "existing_user":
      return "Usuario Encontrado";
    case "not_found_in_edit":
      return "Documento No Encontrado";
    case "validation_error":
      return "Error de Validación";
  }
}

function renderContent(decision: DocumentDecisionData): ReactNode {
  switch (decision.type) {
    case "existing_client":
      return (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Ya existe un cliente registrado con este documento:
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-3">
            <p className="font-medium text-amber-900 dark:text-amber-200">{decision.client.name}</p>
            <p className="text-sm text-amber-700 dark:text-amber-400">ID: {decision.client.id}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">¿Qué deseas hacer?</p>
        </div>
      );

    case "existing_user":
      return (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            Este documento corresponde a un usuario existente en el sistema,
            pero aún no está registrado como cliente.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg p-3">
            <p className="font-medium text-blue-900 dark:text-blue-200">{decision.user.name}</p>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Tipo:{" "}
              {decision.user.hasPersonData ? "Persona Natural" : "Empresa"}
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Deseas usar estos datos para crear el cliente?
          </p>
        </div>
      );

    case "not_found_in_edit":
      return (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            El documento ingresado no corresponde a ningún cliente existente en
            el sistema.
          </p>
          <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-lg p-3">
            <p className="text-sm text-slate-700 dark:text-slate-400">
              Documento:{" "}
              <span className="font-mono font-medium">{decision.data.documentNumber}</span>
            </p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            ¿Deseas crear un nuevo cliente con este documento o revertir al
            documento original?
          </p>
        </div>
      );

    case "validation_error":
      return (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            No se pudo verificar si el documento ya existe en el sistema.
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg p-3">
            <p className="text-sm text-red-700 dark:text-red-400">{decision.error.message}</p>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Puedes reintentar la validación o continuar sin verificar.
          </p>
        </div>
      );
  }
}

function renderActions(
  decision: DocumentDecisionData,
  onAction: (action: DocumentDecisionAction) => void
): ReactNode {
  const secondaryBtn =
    "px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-blue-500 transition-colors";

  // Primary buttons using app's color palette (solid colors, no gradients)
  const primaryBtnBase =
    "px-4 py-2.5 text-sm font-semibold text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors";

  const amberBtn = `${primaryBtnBase} bg-amber-600 hover:bg-amber-700 active:bg-amber-800 focus:ring-amber-500`;
  const blueBtn = `${primaryBtnBase} bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring-blue-500`;
  const slateBtn = `${primaryBtnBase} bg-slate-600 hover:bg-slate-700 active:bg-slate-800 focus:ring-slate-500`;
  const redBtn = `${primaryBtnBase} bg-red-600 hover:bg-red-700 active:bg-red-800 focus:ring-red-500`;

  switch (decision.type) {
    case "existing_client":
      return (
        <Fragment>
          <button
            type="button"
            onClick={() => onAction("cancel")}
            className={secondaryBtn}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAction("continue_editing")}
            className={secondaryBtn}
          >
            Continuar Editando
          </button>
          <button
            type="button"
            onClick={() => onAction("view_client")}
            className={amberBtn}
          >
            Ver Cliente
          </button>
        </Fragment>
      );

    case "existing_user":
      return (
        <Fragment>
          <button
            type="button"
            onClick={() => onAction("cancel")}
            className={secondaryBtn}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAction("continue_editing")}
            className={secondaryBtn}
          >
            No, Empezar Vacío
          </button>
          <button
            type="button"
            onClick={() => onAction("convert_to_client")}
            className={blueBtn}
          >
            Sí, Usar Datos
          </button>
        </Fragment>
      );

    case "not_found_in_edit":
      return (
        <Fragment>
          <button
            type="button"
            onClick={() => onAction("cancel")}
            className={secondaryBtn}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onAction("revert_document")}
            className={secondaryBtn}
          >
            Revertir Documento
          </button>
          <button
            type="button"
            onClick={() => onAction("create_new")}
            className={slateBtn}
          >
            Crear Nuevo Cliente
          </button>
        </Fragment>
      );

    case "validation_error":
      return (
        <Fragment>
          <button
            type="button"
            onClick={() => onAction("continue_editing")}
            className={secondaryBtn}
          >
            Continuar Sin Verificar
          </button>
          <button
            type="button"
            onClick={() => onAction("retry")}
            className={redBtn}
          >
            Reintentar
          </button>
        </Fragment>
      );
  }
}

/**
 * Props para el modal wrapper que recibe PortalInjectedProps.
 */
interface DocumentValidationModalWrapperProps extends PortalInjectedProps {
  decision: DocumentDecisionData;
  onAction: (action: DocumentDecisionAction) => void;
}

/**
 * Wrapper del modal que integra con el sistema de Portal.
 * Este componente maneja el PortalModal y el contenido.
 */
function DocumentValidationModalWrapper(
  props: DocumentValidationModalWrapperProps
) {
  return (
    <PortalModal {...props} size="md" className="overflow-hidden">
      <DocumentValidationContent
        decision={props.decision}
        onAction={props.onAction}
      />
    </PortalModal>
  );
}

/**
 * Hook para abrir el modal de validación de documento.
 * Usa el sistema de Portal para renderizar en el body.
 *
 * @example
 * ```tsx
 * const showValidationModal = useDocumentValidationModal();
 *
 * // En algún handler:
 * showValidationModal({
 *   decision: { type: "existing_client", client: { id: 1, name: "Juan" } },
 *   onAction: (action) => console.log(action),
 * });
 * ```
 */
export const useDocumentValidationModal = createPortalHook(
  DocumentValidationModalWrapper
);

// Export default para compatibilidad con el código existente
// NOTA: Esta exportación se mantiene temporalmente para compatibilidad,
// pero se recomienda migrar al hook useDocumentValidationModal
export default DocumentValidationModalWrapper;
