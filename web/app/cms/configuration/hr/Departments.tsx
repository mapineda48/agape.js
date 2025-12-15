import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    PlusIcon,
    BuildingOfficeIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";
import {
    listDepartments,
    upsertDepartment,
    type DepartmentDto,
} from "@agape/hr/department";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import CheckBox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import Modal from "@/components/ui/Modal";
import {
    createPortalHook,
    type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";
import { useConfirmModal } from "@/components/ui/PortalConfirm";
import { Card, StackedList, Field } from "../inventory/components";

/**
 * Form state interface for Department creation/editing.
 */
interface DepartmentFormState {
    id?: number;
    code: string;
    name: string;
    description: string;
    costCenterCode: string;
    isActive: boolean;
}

// -- Form Modal --
function DepartmentModalWrapper(
    props: {
        item: DepartmentDto | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar departamento" : "Nuevo departamento"}
            size="md"
        >
            <DepartmentForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function DepartmentForm({
    item,
    onSave,
}: {
    item: DepartmentDto | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: DepartmentFormState = item
        ? {
            id: item.id,
            code: item.code,
            name: item.name,
            description: item.description || "",
            costCenterCode: item.costCenterCode || "",
            isActive: item.isActive,
        }
        : {
            code: "",
            name: "",
            description: "",
            costCenterCode: "",
            isActive: true,
        };

    async function handleSubmit(data: DepartmentFormState) {
        try {
            await upsertDepartment({
                id: data.id,
                code: data.code,
                name: data.name,
                description: data.description || null,
                costCenterCode: data.costCenterCode || null,
                isActive: data.isActive,
            });
            await onSave();
            notify({
                payload: isEditing ? "Departamento actualizado" : "Departamento creado",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving department:", error);
            notify({
                payload: "Error al guardar el departamento",
                type: "error",
            });
            throw error;
        }
    }

    return (
        <Form.Root<DepartmentFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código único del departamento">
                            <Input.Text
                                path="code"
                                required
                                placeholder="DEP001"
                                maxLength={20}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Nombre">
                            <Input.Text
                                path="name"
                                required
                                placeholder="Recursos Humanos"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Descripción">
                        <Input.TextArea
                            path="description"
                            placeholder="Descripción del departamento..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <Field label="Centro de costo" description="Código del centro de costo asociado">
                        <Input.Text
                            path="costCenterCode"
                            placeholder="CC001"
                            maxLength={20}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <Field label="Estado">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-fit">
                            <CheckBox
                                path="isActive"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-800 dark:text-gray-200">
                                Activo
                            </span>
                        </label>
                    </Field>
                </div>
            </Modal.Body>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                <Submit<DepartmentFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear departamento"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const useDepartmentModal = createPortalHook(DepartmentModalWrapper);

// -- Main Component --
interface DepartmentsListProps {
    departments: DepartmentDto[];
}

export default function DepartmentsList({
    departments: initialData,
}: DepartmentsListProps) {
    const notify = useNotificacion();
    const [departments, setDepartments] = useState<DepartmentDto[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const showFormModal = useDepartmentModal();

    async function loadData() {
        setLoading(true);
        try {
            const result = await listDepartments({
                isActive: showInactive ? undefined : true,
                includeTotalCount: false,
            });
            setDepartments(result.departments);
        } catch (error) {
            console.error("Error loading departments:", error);
            notify({
                payload: "Error al cargar los departamentos",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    // Filter data locally
    const filteredData = useMemo(() => {
        if (showInactive) return departments;
        return departments.filter((d) => d.isActive);
    }, [departments, showInactive]);

    function handleCreate() {
        showFormModal({ item: null, onSave: loadData });
    }

    function handleEdit(item: DepartmentDto) {
        showFormModal({ item, onSave: loadData });
    }

    function handleToggle(item: DepartmentDto) {
        // Toggle by updating with opposite isActive
        const toggledItem = { ...item, isActive: !item.isActive };
        upsertDepartment({
            id: toggledItem.id,
            code: toggledItem.code,
            name: toggledItem.name,
            description: toggledItem.description,
            costCenterCode: toggledItem.costCenterCode,
            isActive: toggledItem.isActive,
        })
            .then(() => {
                loadData();
                notify({
                    payload: `Departamento ${toggledItem.isActive ? "habilitado" : "deshabilitado"}`,
                    type: "success",
                });
            })
            .catch((error) => {
                console.error("Error toggling department:", error);
                notify({ payload: "Error al cambiar el estado", type: "error" });
            });
    }

    return (
        <Card
            title="Departamentos"
            icon={<BuildingOfficeIcon className="w-6 h-6" />}
            action={
                <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        Mostrar inactivos
                    </label>
                    <button
                        onClick={handleCreate}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-transform hover:-translate-y-0.5"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nuevo
                    </button>
                </div>
            }
        >
            <StackedList
                items={filteredData}
                loading={loading}
                empty="No hay departamentos registrados."
                render={(item) => ({
                    title: `${item.code} - ${item.name}`,
                    subtitle: item.costCenterCode
                        ? `Centro de costo: ${item.costCenterCode}`
                        : "Sin centro de costo",
                    badge: item.isActive ? "Activo" : "Inactivo",
                    badgeTone: item.isActive ? "green" : "gray",
                    onEdit: () => handleEdit(item),
                    onDelete: () => handleToggle(item),
                })}
            />
        </Card>
    );
}
