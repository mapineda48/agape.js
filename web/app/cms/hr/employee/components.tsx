import { useEffect, useMemo, useState } from "react";
import { useFormReset } from "@/components/form";
import Input from "@/components/form/Input";
import { useNotificacion } from "@/components/ui/notification";
import { getUserByDocument } from "@agape/core/user";
import Checkbox from "@/components/form/CheckBox";
import PathProvider from "@/components/form/paths";
import { useSelector } from "@/components/form/hooks";
import Image from "@/components/util/image";
import DateTime from "@utils/data/DateTime";
import { type UpsertEmployeePayload } from "@agape/hr/employee";
import { type DocumentType } from "@agape/core/documentType";
import Select from "@/components/form/Select";

function ImageProfile({ initialAvatar }: { initialAvatar?: string | null }) {
  const avatar = useSelector((state: UpsertEmployeePayload) => state.avatar);
  const [preview, setPreview] = useState<string | null>(
    typeof avatar === "string" ? avatar : initialAvatar || null
  );

  useEffect(() => {
    if (avatar instanceof File) {
      const url = URL.createObjectURL(avatar);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (typeof avatar === "string") {
      setPreview(avatar);
    }
  }, [avatar]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {preview ? (
          <Image
            src={preview}
            alt="Vista previa"
            className="h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-xl"
          />
        ) : (
          <div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center ring-4 ring-white shadow-xl">
            <span className="text-white font-bold text-4xl">?</span>
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
  );
}

export function EmployeeForm({
  documentTypes,
  initialAvatar,
  children,
}: {
  documentTypes: DocumentType[];
  initialAvatar?: string | null;
  children?: React.ReactNode;
}) {
  const notify = useNotificacion();
  const { merge, setAt } = useFormReset();

  // Filter document types for persons only
  const personDocumentTypes = useMemo(() => {
    return documentTypes.filter((d) => !d.appliesToCompany && d.isEnabled);
  }, [documentTypes]);

  // Watch fields for validation
  const documentTypeId = useSelector(
    (state: UpsertEmployeePayload) => state.user?.documentTypeId
  );
  const documentNumber = useSelector(
    (state: UpsertEmployeePayload) => state.user?.documentNumber
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
          // Verify if it is a person
          if (!user.person) {
            notify({
              payload:
                "El documento ingresado corresponde a una empresa, no a una persona.",
              type: "error",
            });
            return;
          }

          merge({
            user: {
              email: user.email || undefined,
              phone: user.phone || undefined,
              address: user.address || undefined,
            },
          });

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
        <ImageProfile initialAvatar={initialAvatar} />
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento
                </label>
                <Select.Int
                  path="documentTypeId"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white text-gray-900"
                >
                  <option value="">Seleccionar tipo...</option>
                  {personDocumentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </Select.Int>
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
            </PathProvider>
          </div>
        </div>

        {/* Personal Information */}
        <PathProvider value="user" autoCleanup>
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
              {/* Person-specific fields */}
              <PathProvider value="person">
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
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </PathProvider>
              {/* User-level contact fields */}
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
              <Input.Text
                path="address"
                placeholder="Calle Principal 123"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </PathProvider>

        {/* Work Information */}
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
                <span className="ml-2 text-sm text-gray-700">Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-8 py-4 flex justify-end space-x-3">
        {children}
      </div>
    </div>
  );
}
