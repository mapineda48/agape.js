import { Fragment } from "react";
import Form from "@/components/form";
import Submit from "@/components/ui/submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
  upsertClient,
  getClientById,
  type GetClientByIdResult,
  type UpsertClientPayload,
} from "@agape/crm/client";
import { listClientTypes, type ClientType } from "@agape/crm/clientType";
import { listDocumentTypes, type DocumentType } from "@agape/core/documentType";
import { ClientForm } from "../components";

interface Props {
  clientTypes: ClientType[];
  client: NonNullable<GetClientByIdResult>;
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
  const notify = useNotificacion();

  // Prepare initial form data
  const initialData = {
    id: props.client.id,
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
  } as UpsertClientPayload;

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
          <Form.Root<UpsertClientPayload> state={initialData}>
            <ClientForm
              clientTypes={props.clientTypes}
              documentTypes={props.documentTypes}
              isEdit
              clientId={props.client.id}
            >
              <button
                type="button"
                onClick={() => navigate("../../clients")}
                className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Cancelar
              </button>
              <Submit<UpsertClientPayload>
                onSubmit={upsertClient}
                onSuccess={() => {
                  navigate("../../clients");
                  notify({
                    payload: "Cliente actualizado exitosamente",
                  });
                }}
                className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
              >
                Guardar Cambios
              </Submit>
            </ClientForm>
          </Form.Root>
        </div>
      </div>
    </Fragment>
  );
}
