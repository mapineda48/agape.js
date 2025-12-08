import React, { Fragment, useState } from "react";
import Form from "@/components/form";
import Input from "@/components/form/Input";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { upsertEmployee } from "@agape/hr/employee";
import DateTime from "@utils/data/DateTime";
import { listDocumentTypes } from "@agape/core/documentType";
import { getUserByDocument } from "@agape/core/user";

import Checkbox from "@/components/form/CheckBox";
import PathProvider from "@/components/form/paths";
import { useFormReset } from "@/components/form";
import useInput from "@/components/form/Input/useInput";

type DocumentType = Awaited<ReturnType<typeof listDocumentTypes>>[number];

interface Props {
  documentTypes: DocumentType[];
}

export async function onInit() {
  const [documentTypes] = await Promise.all([listDocumentTypes()]);

  return {
    documentTypes,
  };
}

/**
 * Form state interface for Employee creation.
 */
interface EmployeeFormState {
  documentTypeId?: number;
  documentNumber?: string;
  isActive?: boolean;
  avatar?: File;
  hireDate?: any;
  person?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    birthdate?: any;
  };
}

export default function NewEmployeePage(props: Props) {
  const { navigate } = useRouter();

  return (
    <Fragment>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("../employees")}
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
              Volver a Empleados
            </button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Nuevo Empleado
            </h1>
            <p className="text-gray-600 mt-2">
              Ingresa la información del nuevo empleado
            </p>
          </div>

          {/* Form */}
          <Form<EmployeeFormState>>
            <EmployeeForm documentTypes={props.documentTypes} />
          </Form>
        </div>
      </div>
    </Fragment>
  );
}

function EmployeeForm({ documentTypes }: { documentTypes: DocumentType[] }) {
  const { navigate } = useRouter();
  const notify = useNotificacion();
  const { merge, setAt } = useFormReset();
  const [photoPreview] = useState<string | null>(null);

  // Auto-select Cedula document type
  const cedulaType = React.useMemo(() => {
    return documentTypes.find(
      (d) =>
        d.name.toLowerCase().includes("cedula") ||
        d.name.toLowerCase().includes("cédula") ||
        d.code === "CC"
    );
  }, [documentTypes]);

  // Set default document type
  const [, setDocumentTypeId] = useInput("documentTypeId");

  React.useEffect(() => {
    if (cedulaType) {
      setDocumentTypeId(cedulaType.id);
    }
  }, [cedulaType, setDocumentTypeId]);

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
            person: {
              email: user.email || undefined,
              phone: user.phone || undefined,
              address: user.address || undefined,
            },
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
              path="avatar"
              accept="image/*"
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
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
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Documento
              </label>
              <input
                type="text"
                value={cedulaType?.name || "Cédula"}
                disabled
                className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
              />
              <input
                type="hidden"
                name="documentTypeId"
                value={cedulaType?.id}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Documento
              </label>
              <Input.Text
                path="documentNumber"
                placeholder="Número de documento"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

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

        {/* Employee Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg
              className="h-5 w-5 mr-2 text-purple-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.67.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.67-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z"
              />
            </svg>
            Información Laboral
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Contratación
              </label>
              <Input.DateTime
                path="hireDate"
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <div className="flex items-center pt-2">
                <Checkbox
                  path="isActive"
                  materialize
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => navigate("../employees")}
          className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Cancelar
        </button>
        <Submit<EmployeeFormState>
          onSubmit={async (data) => {
            try {
              if (!data.documentTypeId)
                throw new Error("Tipo de documento no seleccionado");
              if (!data.person) throw new Error("Falten datos personales");

              await upsertEmployee({
                isActive: data.isActive ?? true,
                avatar: data.avatar,
                hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
                user: {
                  documentTypeId: Number(data.documentTypeId),
                  documentNumber: String(data.documentNumber),
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
              notify({ payload: "Empleado creado exitosamente" });
              navigate("../employees");
            } catch (error: any) {
              notify({
                payload: error,
              });
            }
          }}
          className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          Guardar Empleado
        </Submit>
      </div>
    </div>
  );
}
