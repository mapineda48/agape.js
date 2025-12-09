import { useMemo, useEffect, useRef, type ReactNode } from "react";
import { useFormReset } from "@/components/form";
import Input from "@/components/form/Input";
import { useNotificacion } from "@/components/ui/notification";
import { getUserByDocument } from "@agape/core/user";
import { useRouter } from "@/components/router/router-hook";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/CheckBox";
import PathProvider from "@/components/form/paths";
import { useSelector } from "@/components/form/hooks";
import ImageClient from "./ImageClient";
import {
  getClientByDocument,
  type UpsertClientPayload,
} from "@agape/crm/client";
import type { ClientType } from "@agape/crm/clientType";
import type { DocumentType } from "@agape/core/documentType";
import DateTime from "@utils/data/DateTime";

interface ClientFormProps {
  clientTypes: ClientType[];
  documentTypes: DocumentType[];
  children?: ReactNode;
  isEdit?: boolean;
  clientId?: number;
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
  const { setAt } = useFormReset();

  // Watch fields for validation
  const documentTypeId = useSelector(
    (state: UpsertClientPayload) => state.user?.documentTypeId
  );
  const documentNumber = useSelector(
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
  }

  const selectedDocumentType = useMemo(
    () => documentTypes.find((d) => d.id === Number(documentTypeId)),
    [documentTypeId, documentTypes]
  );
  const isCompany = selectedDocumentType?.appliesToCompany;
  const expectsPerson = selectedDocumentType?.appliesToPerson;
  const requiresPerson = Boolean(expectsPerson && !isCompany);
  const requiresCompany = Boolean(isCompany && !expectsPerson);

  // Document Validation Effect
  useEffect(() => {
    const timeOutId = setTimeout(async () => {
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

      try {
        const existingClient = await getClientByDocument(
          currentTypeId,
          currentDocNumber
        );

        if (existingClient) {
          if (isEdit && existingClient.id === clientId) {
            return;
          }

          const clientName = existingClient.person
            ? `${existingClient.person.firstName} ${existingClient.person.lastName}`.trim()
            : existingClient.company?.legalName || "cliente";

          notify({
            payload: `Ya existe un cliente registrado con este documento: ${clientName}`,
            type: "warning",
          });
          navigate(`../client/${existingClient.id}`);
          return;
        }

        const user = await getUserByDocument(currentTypeId, currentDocNumber);

        if (user) {
          if (requiresPerson && !user.person) {
            notify({
              payload:
                "El documento ingresado corresponde a una empresa, no a una persona.",
              type: "error",
            });
            return;
          }

          if (requiresCompany && !user.company) {
            notify({
              payload:
                "El documento ingresado corresponde a una persona, no a una empresa.",
              type: "error",
            });
            return;
          }

          setAt(["user", "email"], user.email || undefined);
          setAt(["user", "phone"], user.phone || undefined);
          setAt(["user", "address"], user.address || undefined);

          // Preload person information
          if (user.person) {
            setAt(["user", "person"], {
              firstName: user.person.firstName,
              lastName: user.person.lastName,
              birthdate: user.person.birthdate
                ? user.person.birthdate instanceof DateTime
                  ? user.person.birthdate
                  : new DateTime(user.person.birthdate)
                : undefined,
            });
          }

          // Preload company information
          if (user.company) {
            setAt(["user", "company"], {
              legalName: user.company.legalName,
              tradeName: user.company.tradeName,
            });
          }

          notify({
            payload: "Se ha cargado la información existente.",
            type: "success",
          });
        } else if (isEdit) {
          notify({
            payload:
              "El documento ingresado no corresponde a ningún cliente existente. Redirigiendo a crear nuevo cliente.",
            type: "info",
          });
          navigate("../../client", {
            state: {
              clientTypes,
              documentTypes,
              initialData: {
                user: {
                  documentTypeId: Number(documentTypeId),
                  documentNumber: String(documentNumber),
                },
              },
            },
          });
        }
      } catch (error) {
        console.error("Error searching client/user:", error);
      }
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [
    documentTypeId,
    documentNumber,
    notify,
    setAt,
    isEdit,
    clientId,
    navigate,
    isCompany,
    expectsPerson,
    requiresPerson,
    requiresCompany,
  ]);

  // Filter enabled document types
  const enabledDocumentTypes = useMemo(() => {
    return documentTypes.filter((d) => d.isEnabled);
  }, [documentTypes]);

  return (
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
            <PathProvider value="user" autoCleanup>
              <Select.Int
                path="documentTypeId"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              >
                <option value="">Seleccionar tipo...</option>
                {enabledDocumentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </Select.Int>
              <Input.Text
                path="documentNumber"
                placeholder="Número de documento"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </PathProvider>
          </div>
        </div>

        {/* Common User Information */}
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
                d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Datos Básicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PathProvider value="user" autoCleanup>
              <Input.Text
                path="email"
                email
                placeholder="correo@ejemplo.com"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <Input.Text
                path="phone"
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <Input.Text
                path="address"
                placeholder="Dirección Física"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </PathProvider>
          </div>
        </div>

        {/* Dynamic Personal/Company Information */}
        {isCompany ? (
          <PathProvider key="company" value={["user", "company"]} autoCleanup>
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
                <Input.Text
                  path="legalName"
                  placeholder="Razón Social"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <Input.Text
                  path="tradeName"
                  placeholder="Nombre Comercial"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </PathProvider>
        ) : (
          <PathProvider key="person" value={["user", "person"]} autoCleanup>
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
                <Input.Text
                  path="firstName"
                  placeholder="Juan"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <Input.Text
                  path="lastName"
                  placeholder="Pérez"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <Input.DateTime
                  path="birthdate"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </PathProvider>
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
              <Select.Int
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
              </Select.Int>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="flex items-center pt-2">
                <Checkbox
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
  );
}
