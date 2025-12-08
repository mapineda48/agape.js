import React, { Fragment, useState } from "react";
import Form from "@/components/form";
import Input from "@/components/form/Input";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { upsertClient } from "@agape/crm/client";
import { listClientTypes as findAll } from "@agape/crm/clientType";
import DateTime from "@utils/data/DateTime";
import { listDocumentTypes } from "@agape/core/documentType";
import { getUserByDocument } from "@agape/core/user";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/CheckBox";
import PathProvider from "@/components/form/paths";
import { useFormReset } from "@/components/form";
import useInput from "@/components/form/Input/useInput";

type ClientType = Awaited<ReturnType<typeof findAll>>[number];
type DocumentType = Awaited<ReturnType<typeof listDocumentTypes>>[number];

interface Props {
  clientTypes: ClientType[];
  documentTypes: DocumentType[];
}

export async function onInit() {
  const [clientTypes, documentTypes] = await Promise.all([
    findAll(),
    listDocumentTypes(),
  ]);

  return {
    clientTypes,
    documentTypes,
  };
}

/**
 * Form state interface for Client creation.
 */
interface ClientFormState {
  documentTypeId?: number;
  documentNumber?: string;
  typeId?: number;
  active?: boolean;
  photo?: File;
  person?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    birthdate?: any;
  };
  company?: {
    legalName: string;
    tradeName?: string;
    email: string;
    phone?: string;
    address?: string;
  };
}

export default function NewClientPage(props: Props) {
  const { navigate } = useRouter();

  return (
    <Fragment>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("../clients")}
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
              Nuevo Cliente
            </h1>
            <p className="text-gray-600 mt-2">
              Ingresa la información del nuevo cliente
            </p>
          </div>

          {/* Form */}
          <Form<ClientFormState>>
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
  const [photoPreview] = useState<string | null>(null);

  // Watch fields for validation
  const [documentTypeId] = useInput("documentTypeId");
  const [documentNumber] = useInput("documentNumber");

  // Document Validation Effect
  React.useEffect(() => {
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
                ? new DateTime(new Date(user.person.birthdate as any))
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
  const enabledDocumentTypes = React.useMemo(() => {
    return documentTypes.filter((d) => d.isEnabled);
  }, [documentTypes]);

  const isCompany = React.useMemo(() => {
    const type = documentTypes.find((d) => d.id === Number(documentTypeId));
    return type?.appliesToCompany;
  }, [documentTypeId, documentTypes]);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Photo Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
        <div className="flex flex-col items-center">
          <div className="relative">
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Vista previa"
                className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-xl"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white shadow-xl">
                <svg
                  className="h-16 w-16 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="mt-4">
            <Input.File
              path="photo"
              accept="image/*"
              className="hidden"
              id="photo-upload"
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-xl text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-all"
            >
              <svg
                className="mr-2 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                  clipRule="evenodd"
                />
              </svg>
              Seleccionar Foto
            </label>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="px-8 py-6 space-y-6">
        {/* Document Information (Top) */}
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
          </div>
        </div>

        {/* Dynamic Personal/Company Information */}
        {isCompany ? (
          <PathProvider value="company" autoCleanup>
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
                <Input.Text
                  path="email"
                  email
                  placeholder="contacto@empresa.com"
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
                  placeholder="Dirección Fiscal"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>
          </PathProvider>
        ) : (
          <PathProvider value="person" autoCleanup>
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
                <Input.Text
                  path="email"
                  email
                  placeholder="juan.perez@example.com"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <Input.Text
                  path="phone"
                  placeholder="+1 234 567 8900"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <Input.DateTime
                  path="birthdate"
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <Input.Text
                  path="address"
                  placeholder="Calle Principal 123"
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
            <Select.Int
              path="typeId"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Seleccionar tipo...</option>
              {clientTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select.Int>
            <div className="flex items-center pt-8">
              <Checkbox
                path="active"
                materialize
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate("../clients")}
          className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Cancelar
        </button>
        <Submit<ClientFormState>
          onSubmit={async (data) => {
            try {
              await upsertClient({
                typeId: Number(data.typeId),
                active: data.active ?? true,
                photo: data.photo,
                user: {
                  documentTypeId: Number(data.documentTypeId),
                  documentNumber: String(data.documentNumber),
                  // Common fields are inside person or company depending on active path
                  ...(data.person
                    ? {
                        email: data.person.email,
                        phone: data.person.phone,
                        address: data.person.address,
                        person: {
                          firstName: data.person.firstName,
                          lastName: data.person.lastName,
                          birthdate: new DateTime(data.person.birthdate),
                        },
                      }
                    : {}),
                  ...(data.company
                    ? {
                        email: data.company.email,
                        phone: data.company.phone,
                        address: data.company.address,
                        company: {
                          legalName: data.company.legalName,
                          tradeName: data.company.tradeName,
                        },
                      }
                    : {}),
                } as any,
              });
              notify({ payload: "Cliente creado exitosamente" });
              navigate("../clients");
            } catch (error: any) {
              notify({
                payload: error,
              });
            }
          }}
          className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Guardar Cliente
        </Submit>
      </div>
    </div>
  );
}
