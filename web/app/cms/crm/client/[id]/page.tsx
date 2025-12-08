import { Fragment, useState } from "react";
import FormProvider from "@/components/form";
import Input from "@/components/form/Input";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { upsertClient, getClientById } from "@agape/crm/client";
import { listClientTypes as findAll } from "@agape/crm/clientType";
import DateTime from "@utils/data/DateTime";
import React from "react";
import { listDocumentTypes } from "@agape/core/documentType";
import { getUserByDocument } from "@agape/core/user";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/CheckBox";
import PathProvider from "@/components/form/paths";
import { useFormReset } from "@/components/form";
import useInput from "@/components/form/Input/useInput";

type ClientType = Awaited<ReturnType<typeof findAll>>[number];
type ClientData = NonNullable<Awaited<ReturnType<typeof getClientById>>>;
type DocumentType = Awaited<ReturnType<typeof listDocumentTypes>>[number];

interface Props {
  clientTypes: ClientType[];
  client: ClientData;
  documentTypes: DocumentType[];
}

interface PageParams {
  id: string;
}

export async function onInit({ params }: { params: PageParams }) {
  const clientId = Number(params.id);

  const [clientTypes, client, documentTypes] = await Promise.all([
    findAll(),
    getClientById(clientId),
    listDocumentTypes(),
  ]);

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
  // Prepare initial form data
  const initialData = {
    id: props.client.id,
    person: {
      firstName: props.client.firstName,
      lastName: props.client.lastName,
      email: props.client.email,
      phone: props.client.phone || "",
      address: props.client.address || "",
      birthdate: props.client.birthdate,
    },
    documentTypeId: props.client.documentTypeId,
    documentNumber: props.client.documentNumber,
    typeId: props.client.typeId || 0,
    active: props.client.active,
    photo: props.client.photoUrl || undefined,
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
          <FormProvider state={initialData}>
            <ClientForm
              clientTypes={props.clientTypes}
              documentTypes={props.documentTypes}
              initialPhoto={props.client.photoUrl}
            />
          </FormProvider>
        </div>
      </div>
    </Fragment>
  );
}

function ClientForm({
  clientTypes,
  documentTypes,
  initialPhoto,
}: {
  clientTypes: ClientType[];
  documentTypes: DocumentType[];
  initialPhoto: string | null;
}) {
  const { navigate } = useRouter();
  const notify = useNotificacion();
  const { merge, setAt } = useFormReset();
  const [photoPreview] = useState<string | null>(initialPhoto);

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

  const personDocumentTypes = React.useMemo(() => {
    return documentTypes.filter((d) => d.appliesToPerson && d.isEnabled);
  }, [documentTypes]);

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
                <span className="text-white font-bold text-4xl">
                  {initialPhoto === null ? "?" : "VP"}
                </span>
                {/* Note: In edit mode usually we show initials, but we don't have first/last name easily here without props/watching */}
                {/* However, photoPreview is initialized with URL. If null, showing placeholder.*/}
              </div>
            )}
            {/* Note: The original 'initials' logic was props.client.firstName[0]. 
                 We could watch firstName/lastName inputs to update this, or just show a generic icon if no photo.
                 For now, let's restore the generic 'user' icon if no photo, like in Create page, or try to show initials if we can.
                 Actually, let's just use the generic icon for consistency with Create Page if no photo is available, 
                 or we can try to pass the name. Using generic icon. */}
            {!photoPreview && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
              Cambiar Foto
            </label>
          </div>
        </div>
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
            <Select.Int
              path="documentTypeId"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">Seleccionar tipo...</option>
              {personDocumentTypes.map((type) => (
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

        {/* Personal Information */}
        <PathProvider value="person">
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
        <Submit
          onSubmit={async (data) => {
            try {
              await upsertClient({
                id: Number(data.id),
                typeId: Number(data.typeId),
                active: data.active,
                photo: data.photo,
                user: {
                  documentTypeId: Number(data.person.documentTypeId),
                  documentNumber: String(data.person.documentNumber),
                  email: data.person.email,
                  phone: data.person.phone,
                  address: data.person.address,
                  person: {
                    firstName: data.person.firstName,
                    lastName: data.person.lastName,
                    birthdate: new DateTime(data.person.birthdate),
                  },
                } as any,
              });
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
