import { Fragment } from "react";
import Form from "@/components/form";
import { Submit } from "@/components/form/Submit";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import {
  upsertEmployee,
  getEmployeeById,
  type UpsertEmployeePayload,
} from "@agape/hr/employee";
import { listDocumentTypes, type DocumentType } from "@agape/core/documentType";
import { listJobPositions, type JobPositionDto } from "@agape/hr/job_position";
import { listDepartments, type DepartmentDto } from "@agape/hr/department";
import { EmployeeForm } from "../components";
import DateTime from "@utils/data/DateTime";

type EmployeeData = NonNullable<Awaited<ReturnType<typeof getEmployeeById>>>;

interface Props {
  documentTypes: DocumentType[];
  jobPositions: JobPositionDto[];
  departments: DepartmentDto[];
  employee: EmployeeData;
}

interface PageParams {
  id: string;
}

export async function onInit({ params }: { params: PageParams }) {
  const employeeId = Number(params.id);
  const [documentTypes, employee, jobPositionsResult, departmentsResult] = await Promise.all([
    listDocumentTypes(),
    getEmployeeById(employeeId),
    listJobPositions({ isActive: true }),
    listDepartments({ isActive: true }),
  ]);

  if (!employee) {
    throw new Error("Empleado no encontrado");
  }

  return {
    documentTypes,
    employee,
    jobPositions: jobPositionsResult.jobPositions,
    departments: departmentsResult.departments,
  };
}

export default function EditEmployeePage(props: Props) {
  const { navigate } = useRouter();
  const notify = useNotificacion();

  // Prepare initial form data matching UpsertEmployeePayload structure
  const initialData: UpsertEmployeePayload = {
    id: props.employee.id,
    isActive: props.employee.isActive,
    hireDate: props.employee.hireDate
      ? new DateTime(new Date(props.employee.hireDate as any))
      : undefined,
    departmentId: props.employee.departmentId ?? undefined,
    jobPositionIds: props.employee.jobPositionIds || [],
    contacts: props.employee.contacts || {},
    user: {
      id: props.employee.userId,
      documentTypeId: props.employee.documentTypeId,
      documentNumber: props.employee.documentNumber,
      person: {
        firstName: props.employee.firstName || "",
        lastName: props.employee.lastName || "",
        birthdate: props.employee.birthdate
          ? new DateTime(new Date(props.employee.birthdate as any))
          : undefined,
      },
    },
  };

  return (
    <Fragment>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("../../employees")}
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
              Datos del Empleado
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Actualiza la información personal y laboral
            </p>
          </div>

          {/* Form */}
          <Form.Root<UpsertEmployeePayload> state={initialData}>
            <EmployeeForm
              documentTypes={props.documentTypes}
              jobPositions={props.jobPositions}
              departments={props.departments}
              initialAvatar={props.employee.avatarUrl}
              isEdit
              employeeId={props.employee.id}
            >
              <button
                type="button"
                onClick={() => navigate("../../employees")}
                className="px-6 py-2.5 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Cancelar
              </button>
              <Submit<UpsertEmployeePayload>
                onSubmit={async (data) => {
                  try {
                    // Basic validation
                    if (!data.user?.documentTypeId)
                      throw new Error("Tipo de documento no seleccionado");
                    if (!data.user?.person)
                      throw new Error("Falten datos personales");

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
                    notify({ payload: "Empleado actualizado exitosamente" });
                    navigate("../../employees");
                  } catch (error: any) {
                    notify({
                      payload: error,
                    });
                  }
                }}
                className="px-6 py-2.5 border border-transparent text-sm font-medium rounded-xl shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Guardar Cambios
              </Submit>
            </EmployeeForm>
          </Form.Root>
        </div>
      </div>
    </Fragment>
  );
}

