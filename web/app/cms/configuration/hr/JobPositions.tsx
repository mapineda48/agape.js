import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    PlusIcon,
    BriefcaseIcon,
} from "@heroicons/react/24/outline";
import {
    listJobPositions,
    upsertJobPosition,
    type JobPositionDto,
} from "@agape/hr/job_position";
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
import { Card, StackedList, Field } from "../inventory/components";

/**
 * Form state interface for JobPosition creation/editing.
 */
interface JobPositionFormState {
    id?: number;
    code: string;
    name: string;
    description: string;
    level: number | null;
    isActive: boolean;
}

// -- Form Modal --
function JobPositionModalWrapper(
    props: {
        item: JobPositionDto | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar puesto de trabajo" : "Nuevo puesto de trabajo"}
            size="md"
        >
            <JobPositionForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function JobPositionForm({
    item,
    onSave,
}: {
    item: JobPositionDto | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: JobPositionFormState = item
        ? {
            id: item.id,
            code: item.code,
            name: item.name,
            description: item.description || "",
            level: item.level ?? null,
            isActive: item.isActive,
        }
        : {
            code: "",
            name: "",
            description: "",
            level: null,
            isActive: true,
        };

    async function handleSubmit(data: JobPositionFormState) {
        try {
            await upsertJobPosition({
                id: data.id,
                code: data.code,
                name: data.name,
                description: data.description || null,
                level: data.level,
                isActive: data.isActive,
            });
            await onSave();
            notify({
                payload: isEditing ? "Puesto actualizado" : "Puesto creado",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving job position:", error);
            notify({
                payload: "Error al guardar el puesto",
                type: "error",
            });
            throw error;
        }
    }

    return (
        <Form.Root<JobPositionFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código único del puesto">
                            <Input.Text
                                path="code"
                                required
                                placeholder="POS001"
                                maxLength={20}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Nombre">
                            <Input.Text
                                path="name"
                                required
                                placeholder="Gerente de Ventas"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Descripción">
                        <Input.TextArea
                            path="description"
                            placeholder="Descripción del puesto de trabajo..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <Field label="Nivel jerárquico" description="Nivel dentro de la organización (1 = más alto)">
                        <Input.Int
                            path="level"
                            min={1}
                            max={10}
                            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                <Submit<JobPositionFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear puesto"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const useJobPositionModal = createPortalHook(JobPositionModalWrapper);

// -- Main Component --
interface JobPositionsListProps {
    jobPositions: JobPositionDto[];
}

export default function JobPositionsList({
    jobPositions: initialData,
}: JobPositionsListProps) {
    const notify = useNotificacion();
    const [jobPositions, setJobPositions] = useState<JobPositionDto[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const showFormModal = useJobPositionModal();

    async function loadData() {
        setLoading(true);
        try {
            const result = await listJobPositions({
                isActive: showInactive ? undefined : true,
                includeTotalCount: false,
            });
            setJobPositions(result.jobPositions);
        } catch (error) {
            console.error("Error loading job positions:", error);
            notify({
                payload: "Error al cargar los puestos",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    // Filter data locally
    const filteredData = useMemo(() => {
        if (showInactive) return jobPositions;
        return jobPositions.filter((j) => j.isActive);
    }, [jobPositions, showInactive]);

    function handleCreate() {
        showFormModal({ item: null, onSave: loadData });
    }

    function handleEdit(item: JobPositionDto) {
        showFormModal({ item, onSave: loadData });
    }

    function handleToggle(item: JobPositionDto) {
        // Toggle by updating with opposite isActive
        const toggledItem = { ...item, isActive: !item.isActive };
        upsertJobPosition({
            id: toggledItem.id,
            code: toggledItem.code,
            name: toggledItem.name,
            description: toggledItem.description,
            level: toggledItem.level,
            isActive: toggledItem.isActive,
        })
            .then(() => {
                loadData();
                notify({
                    payload: `Puesto ${toggledItem.isActive ? "habilitado" : "deshabilitado"}`,
                    type: "success",
                });
            })
            .catch((error) => {
                console.error("Error toggling job position:", error);
                notify({ payload: "Error al cambiar el estado", type: "error" });
            });
    }

    return (
        <Card
            title="Puestos de Trabajo"
            icon={<BriefcaseIcon className="w-6 h-6" />}
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
                empty="No hay puestos de trabajo registrados."
                render={(item) => ({
                    title: `${item.code} - ${item.name}`,
                    subtitle: item.level ? `Nivel: ${item.level}` : "Sin nivel asignado",
                    badge: item.isActive ? "Activo" : "Inactivo",
                    badgeTone: item.isActive ? "green" : "gray",
                    onEdit: () => handleEdit(item),
                    onDelete: () => handleToggle(item),
                })}
            />
        </Card>
    );
}
