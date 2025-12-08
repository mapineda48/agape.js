import { Fragment, useMemo, useEffect } from "react";
import Form, { useFormReset } from "@/components/form";
import Input from "@/components/form/Input";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
  upsertClient,
  getClientById,
  type GetClientByIdResult,
  type UpsertClientPayload,
} from "@agape/crm/client";
import { listClientTypes, type ClientType } from "@agape/crm/clientType";
import DateTime from "@utils/data/DateTime";
import { listDocumentTypes, type DocumentType } from "@agape/core/documentType";
import { getUserByDocument } from "@agape/core/user";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/CheckBox";
import PathProvider from "@/components/form/paths";
import ImageClient from "./ImageClient";
import { useSelector } from "@/components/form/hooks";

interface Props {
  clientTypes: ClientType[];
  client: GetClientByIdResult;
  documentTypes: DocumentType[];
}

interface PageParams {
  id: string;
}

export async function onInit({ params }: { params: PageParams }) {
  const clientId = Number(params.id);

  const [clientTypes, client, documentTypes] = await Promise.all([
    listClientTypes(),
    getClientById(clientId),
    listDocumentTypes(),
  ] as const);

  if (!client) {
    throw new Error("Cliente no encontrado");
  }

  return {
    clientTypes,
    client,
    documentTypes,
  };
}

export default function EditClientPage(props: Props) {
  const { navigate } = useRouter();

  // Prepare initial form data
  const initialData = {
    typeId: props.client.typeId || 0,
    active: props.client.active,
    photo: props.client.photo || undefined,
    user: {
      id: props.client.id,
      documentTypeId: props.client.user.documentTypeId,
      documentNumber: props.client.user.documentNumber,
      email: props.client.user.email || "",
      phone: props.client.user.phone || "",
      address: props.client.user.address || "",
      ...(props.client.person
        ? {
            person: {
              firstName: props.client.person.firstName,
              lastName: props.client.person.lastName,
              birthdate: props.client.person.birthdate,
            },
          }
        : {}),
      ...(props.client.company
        ? {
            company: {
              legalName: props.client.company.legalName,
              tradeName: props.client.company.tradeName ?? undefined,
            },
          }
        : {}),
    },
  };

  return (
    <Fragment>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("../../clients")}
              className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Volver a Clientes
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Editar Cliente
            </h1>
            <p className="text-gray-600 mt-2">
              Actualiza la información del cliente
            </p>
          </div>

          {/* Form */}
          <Form<UpsertClientPayload> state={initialData}>
            <ClientForm
              clientTypes={props.clientTypes}
              documentTypes={props.documentTypes}
            />
          </Form>
        </div>
      </div>
    </Fragment>
  );
}

function ClientForm({
  clientTypes,
  documentTypes,
}: {
  clientTypes: ClientType[];
  documentTypes: DocumentType[];
}) {
  const { navigate } = useRouter();
  const notify = useNotificacion();
  const { merge, setAt } = useFormReset();

  // Watch fields for validation
  const documentTypeId = useSelector(
    (state: UpsertClientPayload) => state.user.documentTypeId
  );
  const documentNumber = useSelector(
    (state: UpsertClientPayload) => state.user.documentNumber
  );

  // Document Validation Effect
  useEffect(() => {
    const timeOutId = setTimeout(async () => {
      if (!documentTypeId || !documentNumber) return;

      try {
        const user = await getUserByDocument(
          Number(documentTypeId),
          String(documentNumber)
        );

        if (user) {
          // Preload common information
          merge({
            email: user.email || undefined,
            phone: user.phone || undefined,
            address: user.address || undefined,
          });

          // Preload person information
          if (user.person) {
            setAt(["person"], {
              firstName: user.person.firstName,
              lastName: user.person.lastName,
              birthdate: user.person.birthdate
                ? user.person.birthdate
                : undefined,
            });
          }

          // Preload company information
          if (user.company) {
            setAt(["company"], {
              legalName: user.company.legalName,
              tradeName: user.company.tradeName,
            });
          }

          notify({
            payload: "Se ha cargado la información existente.",
            type: "success",
          });
        }
      } catch (error) {
        console.error("Error searching user:", error);
      }
    }, 500);

    return () => clearTimeout(timeOutId);
  }, [documentTypeId, documentNumber, merge, setAt, notify]);

  // Filter enabled document types
  const enabledDocumentTypes = useMemo(() => {
    return documentTypes.filter((d) => d.isEnabled);
  }, [documentTypes]);

  const isCompany = useMemo(() => {
    const type = documentTypes.find((d) => d.id === Number(documentTypeId));
    return type?.appliesToCompany;
  }, [documentTypeId, documentTypes]);

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
          <PathProvider value={["user", "company"]} autoCleanup>
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
          <PathProvider value={["user", "person"]} autoCleanup>
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

      {/* Actions */}
      <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate("../../clients")}
          className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Cancelar
        </button>
        <Submit<UpsertClientPayload>
          onSubmit={async (data) => {
            try {
              await upsertClient(data);
              notify({
                payload: "Cliente actualizado exitosamente",
              });
              navigate("../../clients");
            } catch (error) {
              notify({
                payload: error as Error,
              });
            }
          }}
          className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Guardar Cambios
        </Submit>
      </div>
    </div>
  );
}
