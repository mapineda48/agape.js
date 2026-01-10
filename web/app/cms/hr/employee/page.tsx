import { Fragment, useMemo } from "react";
import Form from "@/components/form";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { upsertEmployee, type UpsertEmployeePayload } from "@agape/hr/employee";
import { listDocumentTypes, type DocumentType } from "@agape/core/documentType";
import { listJobPositions, type JobPositionDto } from "@agape/hr/job_position";
import { listDepartments, type DepartmentDto } from "@agape/hr/department";
import { EmployeeForm } from "./components";
import DateTime from "@utils/data/DateTime";

interface Props {
  documentTypes: DocumentType[];
  jobPositions: JobPositionDto[];
  departments: DepartmentDto[];
  initialData?: UpsertEmployeePayload;
}

export async function onInit() {
  const [documentTypes, jobPositionsResult, departmentsResult] = await Promise.all([
    listDocumentTypes(),
    listJobPositions({ isActive: true }),
    listDepartments({ isActive: true }),
  ]);

  return {
    documentTypes,
    jobPositions: jobPositionsResult.jobPositions,
    departments: departmentsResult.departments,
  };
}

export default function NewEmployeePage(props: Props) {
  const { navigate } = useRouter();
  const notify = useNotificacion();

  // Initial state logic to auto-select Cedula if possible
  const initialData = useMemo(() => {
    if (props.initialData) {
      return props.initialData;
    }

    const cedulaType = props.documentTypes.find(
      (d) =>
        d.code === "CC" ||
        d.name.toLowerCase().includes("cedula") ||
        d.name.toLowerCase().includes("cédula")
    );

    return {
      isActive: true, // Default to active
      user: {
        documentTypeId: cedulaType?.id,
      },
      jobPositionIds: [],
    } as UpsertEmployeePayload;
  }, [props.documentTypes, props.initialData]);

  return (
    <Fragment>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Nuevo Empleado
            </h1>
            <p className="text-gray-600 mt-2">
              Ingresa la información del nuevo empleado
            </p>
          </div>

          {/* Form */}
          <Form.Root<UpsertEmployeePayload> state={initialData}>
            <EmployeeForm
              documentTypes={props.documentTypes}
              jobPositions={props.jobPositions}
              departments={props.departments}
            >
              <button
                type="button"
                onClick={() => navigate("../employees")}
                className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Cancelar
              </button>
              <Submit<UpsertEmployeePayload>
                onSubmit={async (data) => {
                  try {
                    // Check required fields (basic validation, although HTML inputs have required)
                    if (!data.user?.documentTypeId)
                      throw new Error("Tipo de documento no seleccionado");
                    if (!data.user?.person)
                      throw new Error("Falten datos personales");

                    // Ensure date objects are Date instances if they are DateTime
                    const payload = {
                      ...data,
                      ...(data.hireDate
                        ? {
                          hireDate:
                            data.hireDate instanceof DateTime
                              ? data.hireDate
                              : new DateTime(data.hireDate),
                        }
                        : {}),
                      user: {
                        ...data.user,
                        documentTypeId: Number(data.user.documentTypeId),
                        person: {
                          ...data.user.person,
                          birthdate:
                            data.user.person.birthdate instanceof DateTime
                              ? data.user.person.birthdate
                              : data.user.person.birthdate
                                ? new DateTime(data.user.person.birthdate)
                                : undefined,
                        },
                      },
                    };

                    await upsertEmployee(payload);

                    notify({ payload: "Empleado creado exitosamente" });
                    navigate("../employees");
                  } catch (error: any) {
                    notify({
                      payload: error,
                    });
                  }
                }}
                className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Guardar Empleado
              </Submit>
            </EmployeeForm>
          </Form.Root>
        </div>
      </div>
    </Fragment>
  );
}

