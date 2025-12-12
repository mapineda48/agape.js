import { useMemo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import { Form } from "@/components/form";
import { useNotificacion } from "@/components/ui/notification";
import { getUserByDocument } from "@agape/core/user";
import { useRouter } from "@/components/router/router-hook";
import ImageClient from "./ImageClient";
import {
  getClientByDocument,
  type UpsertClientPayload,
} from "@agape/crm/client";
import type { ClientType } from "@agape/crm/clientType";
import type { DocumentType } from "@agape/core/documentType";
import DateTime from "@utils/data/DateTime";
import DocumentValidationModal, {
  type DocumentDecisionData,
  type DocumentDecisionAction,
} from "./DocumentValidationModal";
import ValidationStatus from "./ValidationStatus";

interface ClientFormProps {
  clientTypes: ClientType[];
  documentTypes: DocumentType[];
  children?: ReactNode;
  isEdit?: boolean;
  clientId?: number;
}

/**
 * Estado de validación del documento.
 */
interface ValidationState {
  isValidating: boolean;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * Datos del usuario encontrado para precargar.
 */
interface FoundUserData {
  id: number;
  person?: {
    firstName: string;
    lastName: string;
    birthdate?: DateTime | Date | null;
  };
  company?: {
    legalName: string;
    tradeName?: string | null;
  };
}

export function ClientForm({
  clientTypes,
  documentTypes,
  children,
  isEdit = false,
  clientId,
}: ClientFormProps) {
  const notify = useNotificacion();
  const { navigate } = useRouter();
  const { setAt, getValues } = Form.useForm();

  // Estado para el modal de decisión
  const [modalDecision, setModalDecision] = useState<DocumentDecisionData | null>(null);
  
  // Estado de validación
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    hasError: false,
  });

  // Datos pendientes de usuario encontrado (para cargar después de confirmación)
  const pendingUserDataRef = useRef<FoundUserData | null>(null);

  // Datos originales del documento (para revertir en edición)
  const originalDocumentRef = useRef<{
    documentTypeId: number | undefined;
    documentNumber: string | undefined;
  } | null>(null);

  // Watch fields for validation
  const documentTypeId = Form.useSelector(
    (state: UpsertClientPayload) => state.user?.documentTypeId
  );
  const documentNumber = Form.useSelector(
    (state: UpsertClientPayload) => state.user?.documentNumber
  );

  const initialValuesRef = useRef<{
    documentTypeId: number | undefined;
    documentNumber: string | undefined;
    captured: boolean;
    hasRun: boolean;
  } | null>(null);

  if (initialValuesRef.current === null) {
    initialValuesRef.current = {
      documentTypeId: documentTypeId ? Number(documentTypeId) : undefined,
      documentNumber: documentNumber ? String(documentNumber) : undefined,
      captured: !!(documentTypeId && documentNumber),
      hasRun: false,
    };
    // Guardar documento original para revertir
    if (isEdit) {
      originalDocumentRef.current = {
        documentTypeId: documentTypeId ? Number(documentTypeId) : undefined,
        documentNumber: documentNumber ? String(documentNumber) : undefined,
      };
    }
  }

  const selectedDocumentType = useMemo(
    () => documentTypes.find((d) => d.id === Number(documentTypeId)),
    [documentTypeId, documentTypes]
  );
  const isCompany = selectedDocumentType?.appliesToCompany;
  const expectsPerson = selectedDocumentType?.appliesToPerson;
  const requiresPerson = Boolean(expectsPerson && !isCompany);
  const requiresCompany = Boolean(isCompany && !expectsPerson);

  /**
   * Valida el documento y muestra el modal apropiado.
   */
  const validateDocument = useCallback(async () => {
    if (!documentTypeId || !documentNumber) return;

    const currentTypeId = Number(documentTypeId);
    const currentDocNumber = String(documentNumber);

    const ref = initialValuesRef.current!;
    const isFirstRun = !ref.hasRun;
    const hadInitialData = ref.captured;
    const valuesUnchanged =
      ref.documentTypeId === currentTypeId &&
      ref.documentNumber === currentDocNumber;

    ref.hasRun = true;

    if (isFirstRun && hadInitialData && valuesUnchanged) {
      return;
    }

    setValidationState({ isValidating: true, hasError: false });

    try {
      // Buscar cliente existente
      const existingClient = await getClientByDocument(
        currentTypeId,
        currentDocNumber
      );

      if (existingClient) {
        // En edición, si es el mismo cliente, no mostrar nada
        if (isEdit && existingClient.id === clientId) {
          setValidationState({ isValidating: false, hasError: false });
          return;
        }

        // Mostrar modal en lugar de navegar automáticamente
        const clientName = existingClient.person
          ? `${existingClient.person.firstName} ${existingClient.person.lastName}`.trim()
          : existingClient.company?.legalName || "Cliente";

        setModalDecision({
          type: "existing_client",
          client: {
            id: existingClient.id,
            name: clientName,
          },
        });
        setValidationState({ isValidating: false, hasError: false });
        return;
      }

      // Buscar usuario existente (no cliente)
      const user = await getUserByDocument(currentTypeId, currentDocNumber);

      if (user) {
        // Verificar compatibilidad de tipo
        if (requiresPerson && !user.person) {
          notify({
            payload:
              "El documento ingresado corresponde a una empresa, no a una persona.",
            type: "error",
          });
          setValidationState({ isValidating: false, hasError: false });
          return;
        }

        if (requiresCompany && !user.company) {
          notify({
            payload:
              "El documento ingresado corresponde a una persona, no a una empresa.",
            type: "error",
          });
          setValidationState({ isValidating: false, hasError: false });
          return;
        }

        // Guardar datos para cargar después de confirmación
        pendingUserDataRef.current = {
          id: user.id,
          person: user.person
            ? {
                firstName: user.person.firstName,
                lastName: user.person.lastName,
                birthdate: user.person.birthdate,
              }
            : undefined,
          company: user.company
            ? {
                legalName: user.company.legalName,
                tradeName: user.company.tradeName,
              }
            : undefined,
        };

        // Construir nombre para el modal
        const userName = user.person
          ? `${user.person.firstName} ${user.person.lastName}`.trim()
          : user.company?.legalName || "Usuario";

        // Mostrar modal para decidir si usar los datos
        setModalDecision({
          type: "existing_user",
          user: {
            id: user.id,
            name: userName,
            hasPersonData: !!user.person,
            hasCompanyData: !!user.company,
          },
        });
        setValidationState({ isValidating: false, hasError: false });
      } else if (isEdit) {
        // En edición, el documento no existe - mostrar modal de confirmación
        setModalDecision({
          type: "not_found_in_edit",
          data: {
            documentTypeId: currentTypeId,
            documentNumber: currentDocNumber,
          },
        });
        setValidationState({ isValidating: false, hasError: false });
      } else {
        // En creación, documento disponible - todo bien
        setValidationState({ isValidating: false, hasError: false });
      }
    } catch (error) {
      // Mostrar error en lugar de solo console.error
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Error de conexión. Intenta de nuevo.";
      
      setValidationState({
        isValidating: false,
        hasError: true,
        errorMessage,
      });

      // También mostrar modal para decisión
      setModalDecision({
        type: "validation_error",
        error: { message: errorMessage },
      });
    }
  }, [
    documentTypeId,
    documentNumber,
    isEdit,
    clientId,
    notify,
    requiresPerson,
    requiresCompany,
  ]);

  /**
   * Maneja las acciones del modal de decisión.
   */
  const handleModalAction = useCallback(
    (action: DocumentDecisionAction) => {
      const decision = modalDecision;
      setModalDecision(null);

      switch (action) {
        case "view_client":
          // Navegar al cliente existente
          if (decision?.type === "existing_client") {
            navigate(`../client/${decision.client.id}`);
          }
          break;

        case "continue_editing":
          // Solo cerrar el modal, permitir continuar
          pendingUserDataRef.current = null;
          break;

        case "convert_to_client":
          // Cargar datos del usuario existente
          if (pendingUserDataRef.current) {
            const userData = pendingUserDataRef.current;
            
            if (userData.person) {
              setAt(["user", "person"], {
                firstName: userData.person.firstName,
                lastName: userData.person.lastName,
                birthdate: userData.person.birthdate
                  ? userData.person.birthdate instanceof DateTime
                    ? userData.person.birthdate
                    : new DateTime(userData.person.birthdate)
                  : undefined,
              });
            }

            if (userData.company) {
              setAt(["user", "company"], {
                legalName: userData.company.legalName,
                tradeName: userData.company.tradeName,
              });
            }

            notify({
              payload: "Se han cargado los datos del usuario existente.",
              type: "success",
            });
            pendingUserDataRef.current = null;
          }
          break;

        case "create_new":
          // Navegar a crear nuevo cliente con los datos actuales
          if (decision?.type === "not_found_in_edit") {
            navigate("../../client", {
              state: {
                clientTypes,
                documentTypes,
                initialData: {
                  user: {
                    documentTypeId: decision.data.documentTypeId,
                    documentNumber: decision.data.documentNumber,
                  },
                },
              },
            });
          }
          break;

        case "revert_document":
          // Revertir al documento original
          if (originalDocumentRef.current) {
            setAt(["user", "documentTypeId"], originalDocumentRef.current.documentTypeId);
            setAt(["user", "documentNumber"], originalDocumentRef.current.documentNumber);
          }
          break;

        case "retry":
          // Reintentar la validación
          setValidationState({ isValidating: false, hasError: false });
          // Usar setTimeout para permitir que se cierre el modal primero
          setTimeout(() => validateDocument(), 100);
          break;

        case "cancel":
          // Solo cerrar el modal
          pendingUserDataRef.current = null;
          break;
      }
    },
    [modalDecision, navigate, setAt, notify, clientTypes, documentTypes, validateDocument]
  );

  /**
   * Handler para el evento onBlur del campo de documento.
   * Solo valida si hay valores completos y son diferentes a los iniciales.
   */
  const handleDocumentBlur = useCallback(() => {
    if (!documentTypeId || !documentNumber) return;

    const currentTypeId = Number(documentTypeId);
    const currentDocNumber = String(documentNumber).trim();

    // No validar si está vacío
    if (!currentDocNumber) return;

    const ref = initialValuesRef.current!;
    const valuesUnchanged =
      ref.documentTypeId === currentTypeId &&
      ref.documentNumber === currentDocNumber;

    // En edición, no validar si los valores no han cambiado
    if (isEdit && valuesUnchanged && ref.captured) {
      return;
    }

    // Marcar que ya corrió al menos una vez
    ref.hasRun = true;

    validateDocument();
  }, [documentTypeId, documentNumber, isEdit, validateDocument]);

  /**
   * Handler para cuando cambia el tipo de documento.
   * Si ya existe un número de documento, valida automáticamente.
   */
  const handleDocumentTypeChange = useCallback(() => {
    // Solo validar si ya hay un número de documento ingresado
    if (documentNumber && String(documentNumber).trim()) {
      // Usar setTimeout para que el estado se actualice primero
      setTimeout(() => {
        validateDocument();
      }, 100);
    }
  }, [documentNumber, validateDocument]);

  // Filter enabled document types
  const enabledDocumentTypes = useMemo(() => {
    return documentTypes.filter((d) => d.isEnabled);
  }, [documentTypes]);

  return (
    <>
      {/* Modal de decisión */}
      <DocumentValidationModal
        isOpen={modalDecision !== null}
        decision={modalDecision}
        onAction={handleModalAction}
      />

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Photo Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
          <ImageClient />
        </div>

        {/* Form Fields */}
        <div className="px-8 py-6 space-y-6">
          {/* Document Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z"
                />
              </svg>
              Identificación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Form.Scope path="user" autoCleanup>
                <Form.Select.Int
                  path="documentTypeId"
                  required
                  onChange={handleDocumentTypeChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="">Seleccionar tipo...</option>
                  {enabledDocumentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Form.Select.Int>
                <Form.Text
                  path="documentNumber"
                  placeholder="Número de documento"
                  required
                  onBlur={handleDocumentBlur}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </Form.Scope>
            </div>
            
            {/* Indicador de validación */}
            <div className="mt-3">
              <ValidationStatus
                isValidating={validationState.isValidating}
                hasError={validationState.hasError}
                errorMessage={validationState.errorMessage}
                onRetry={() => validateDocument()}
              />
            </div>

            {/* Microcopy sobre el tipo de documento seleccionado */}
            {selectedDocumentType && (
              <div className="mt-3 text-sm text-gray-600">
                {isCompany && !expectsPerson && (
                  <span className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-1 rounded">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                    Este tipo de documento requiere datos de empresa
                  </span>
                )}
                {expectsPerson && !isCompany && (
                  <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded">
                    <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                    Este tipo de documento requiere datos de persona
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Dynamic Personal/Company Information */}
          {isCompany ? (
            <Form.Scope key="company" path={["user", "company"]} autoCleanup>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M5.223 2.25c-.497 0-.974.198-1.322.55l-1.9 1.9a1.875 1.875 0 000 2.652l1.9 1.9c.348.352.825.55 1.322.55H6.5v3c0 .828.672 1.5 1.5 1.5h9c.828 0 1.5-.672 1.5-1.5v-3h1.277c.497 0 .974-.198 1.322-.55l1.9-1.9a1.875 1.875 0 000-2.652l-1.9-1.9A1.875 1.875 0 0019.777 2.25H5.223zM9 13.5v-2h6v2H9z" />
                  </svg>
                  Información de Empresa
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Text
                    path="legalName"
                    placeholder="Razón Social"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <Form.Text
                    path="tradeName"
                    placeholder="Nombre Comercial"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </Form.Scope>
          ) : (
            <Form.Scope key="person" path={["user", "person"]} autoCleanup>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="h-5 w-5 mr-2 text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Form.Text
                    path="firstName"
                    placeholder="Juan"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <Form.Text
                    path="lastName"
                    placeholder="Pérez"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <Form.DateTime
                    path="birthdate"
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>
            </Form.Scope>
          )}

          {/* Client Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg
                className="h-5 w-5 mr-2 text-purple-600"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              Información de Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cliente
                </label>
                <Form.Select.Int
                  path="typeId"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-900 hover:border-gray-400"
                >
                  <option value={0} className="text-gray-500 bg-white py-2">
                    Seleccionar tipo...
                  </option>
                  {clientTypes.map((type) => (
                    <option
                      key={type.id}
                      value={type.id}
                      className="text-gray-900 bg-white py-2 hover:bg-blue-50"
                    >
                      {type.name}
                    </option>
                  ))}
                </Form.Select.Int>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <div className="flex items-center pt-2">
                  <Form.Checkbox
                    path="active"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Cliente Activo
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {children && (
          <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
            {children}
          </div>
        )}
      </div>
    </>
  );
}
