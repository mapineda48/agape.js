import { Fragment, useState } from "react";
import FormProvider from "@/components/form/provider";
import Input from "@/components/form/Input";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { upsertClient, getClient } from "@agape/cms/crm/client";
import { listClientTypes as findAll } from "@agape/crm/client_type";
import DateTime from "@utils/data/DateTime";

type ClientType = Awaited<ReturnType<typeof findAll>>[number];
type ClientData = Awaited<ReturnType<typeof getClient>>;

interface Props {
  clientTypes: ClientType[];
  client: ClientData;
}

interface PageParams {
  id: string;
}

export async function onInit({ params }: { params: PageParams }) {
  const clientId = Number(params.id);

  const [clientTypes, client] = await Promise.all([
    findAll(),
    getClient(clientId),
  ]);

  if (!client) {
    throw new Error("Cliente no encontrado");
  }

  return {
    clientTypes,
    client,
  };
}

export default function EditClientPage(props: Props) {
  const { navigate } = useRouter();
  const notify = useNotificacion();
  const [photoPreview, setPhotoPreview] = useState<string | null>(
    props.client.photoUrl
  );

  // Prepare initial form data
  const initialData = {
    id: props.client.id,
    personId: props.client.personId,
    personData: {
      firstName: props.client.firstName,
      lastName: props.client.lastName,
      email: props.client.email,
      phone: props.client.phone || "",
      address: props.client.address || "",
      birthdate: props.client.birthdate.toISOString().split("T")[0],
    },
    typeId: props.client.typeId?.toString() || "",
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
          <FormProvider initialData={initialData}>
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
                          {props.client.firstName[0]}
                          {props.client.lastName[0]}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <Input.File
                      name="photo"
                      accept="image/*"
                      onChange={(file) => {
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhotoPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setPhotoPreview(props.client.photoUrl);
                        }
                      }}
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
                {/* Hidden fields for ID */}
                <Input.Text name="id" type="hidden" />
                <Input.Text name="personId" type="hidden" />

                {/* Personal Information */}
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
                      name="personData.firstName"
                      label="Nombre"
                      placeholder="Juan"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <Input.Text
                      name="personData.lastName"
                      label="Apellido"
                      placeholder="Pérez"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <Input.Text
                      name="personData.email"
                      label="Email"
                      type="email"
                      placeholder="juan.perez@example.com"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <Input.Text
                      name="personData.phone"
                      label="Teléfono"
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <Input.DateTime
                      name="personData.birthdate"
                      label="Fecha de Nacimiento"
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                    <Input.Text
                      name="personData.address"
                      label="Dirección"
                      placeholder="Calle Principal 123"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

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
                    <Input.Select
                      name="typeId"
                      label="Tipo de Cliente"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="">Seleccionar tipo...</option>
                      {props.clientTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.fullName}
                        </option>
                      ))}
                    </Input.Select>
                    <div className="flex items-center pt-8">
                      <Input.Checkbox
                        name="active"
                        label="Cliente Activo"
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
                  onClick={() => navigate("../../clients")}
                  className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  Cancelar
                </button>
                <Submit
                  onSubmit={async (data) => {
                    try {
                      // Convert birthdate string to DateTime
                      const formData = {
                        ...data,
                        id: Number(data.id),
                        personId: Number(data.personId),
                        personData: {
                          ...data.personData,
                          birthdate: new DateTime(data.personData.birthdate),
                        },
                        typeId: data.typeId ? Number(data.typeId) : undefined,
                      };

                      await upsertClient(formData);
                      notify({
                        payload: {
                          message: "Cliente actualizado exitosamente",
                          type: "success",
                        },
                      });
                      navigate("../../clients");
                    } catch (error) {
                      notify({
                        payload: error,
                      });
                    }
                  }}
                  className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
                >
                  Guardar Cambios
                </Submit>
              </div>
            </div>
          </FormProvider>
        </div>
      </div>
    </Fragment>
  );
}
