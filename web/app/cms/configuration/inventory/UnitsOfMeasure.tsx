import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    PlusIcon,
    ScaleIcon,
} from "@heroicons/react/24/outline";
import {
    listUnitOfMeasures,
    upsertUnitOfMeasure,
    toggleUnitOfMeasure,
    type IUnitOfMeasure,
} from "@agape/inventory/unit_of_measure";
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
import { Card, StackedList, Field } from "./components";

/**
 * Form state interface for UnitOfMeasure creation/editing.
 */
interface UnitOfMeasureFormState {
    id?: number;
    code: string;
    fullName: string;
    description: string;
    isEnabled: boolean;
}

// -- Form Modal --
function UnitOfMeasureModalWrapper(
    props: {
        item: IUnitOfMeasure | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar unidad de medida" : "Nueva unidad de medida"}
            size="md"
        >
            <UnitOfMeasureForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function UnitOfMeasureForm({
    item,
    onSave,
}: {
    item: IUnitOfMeasure | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: UnitOfMeasureFormState = item
        ? {
            id: item.id,
            code: item.code,
            fullName: item.fullName,
            description: item.description || "",
            isEnabled: item.isEnabled,
        }
        : {
            code: "",
            fullName: "",
            description: "",
            isEnabled: true,
        };

    async function handleSubmit(data: UnitOfMeasureFormState) {
        try {
            await upsertUnitOfMeasure({
                id: data.id,
                code: data.code,
                fullName: data.fullName,
                description: data.description || null,
                isEnabled: data.isEnabled,
            });
            await onSave();
            notify({
                payload: isEditing ? "Unidad de medida actualizada" : "Unidad de medida creada",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving unit of measure:", error);
            notify({
                payload: "Error al guardar la unidad de medida",
                type: "error",
            });
            throw error;
        }
    }

    return (
        <Form.Root<UnitOfMeasureFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código corto (ej: UN, KG, LT)">
                            <Input.Text
                                path="code"
                                required
                                placeholder="UN"
                                maxLength={10}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Nombre">
                            <Input.Text
                                path="fullName"
                                required
                                placeholder="Unidad"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Descripción">
                        <Input.TextArea
                            path="description"
                            placeholder="Descripción de la unidad de medida..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <Field label="Estado">
                        <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-fit">
                            <CheckBox
                                path="isEnabled"
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
                <Submit<UnitOfMeasureFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear unidad"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const useUnitOfMeasureModal = createPortalHook(UnitOfMeasureModalWrapper);

// -- Main Component --
interface UnitsOfMeasureListProps {
    unitsOfMeasure: IUnitOfMeasure[];
}

export default function UnitsOfMeasureList({
    unitsOfMeasure: initialData,
}: UnitsOfMeasureListProps) {
    const notify = useNotificacion();
    const [unitsOfMeasure, setUnitsOfMeasure] = useState<IUnitOfMeasure[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const showFormModal = useUnitOfMeasureModal();
    const showConfirm = useConfirmModal();

    async function loadData() {
        setLoading(true);
        try {
            const data = await listUnitOfMeasures({
                activeOnly: !showInactive,
            });
            setUnitsOfMeasure(data);
        } catch (error) {
            console.error("Error loading units of measure:", error);
            notify({
                payload: "Error al cargar las unidades de medida",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    // Filter data locally
    const filteredData = useMemo(() => {
        if (showInactive) return unitsOfMeasure;
        return unitsOfMeasure.filter((u) => u.isEnabled);
    }, [unitsOfMeasure, showInactive]);

    function handleCreate() {
        showFormModal({ item: null, onSave: loadData });
    }

    function handleEdit(item: IUnitOfMeasure) {
        showFormModal({ item, onSave: loadData });
    }

    function handleToggle(item: IUnitOfMeasure) {
        const action = item.isEnabled ? "deshabilitar" : "habilitar";
        showConfirm({
            title: `${item.isEnabled ? "Deshabilitar" : "Habilitar"} unidad de medida`,
            message: `¿Estás seguro de que deseas ${action} "${item.fullName}"?`,
            confirmText: item.isEnabled ? "Deshabilitar" : "Habilitar",
            variant: item.isEnabled ? "danger" : "primary",
            onConfirm: async () => {
                try {
                    await toggleUnitOfMeasure({
                        id: item.id,
                        isEnabled: !item.isEnabled,
                    });
                    await loadData();
                    notify({
                        payload: `Unidad de medida ${item.isEnabled ? "deshabilitada" : "habilitada"}`,
                        type: "success",
                    });
                } catch (error) {
                    console.error("Error toggling unit of measure:", error);
                    const errorMsg =
                        error instanceof Error ? error.message : "Error desconocido";
                    notify({ payload: errorMsg, type: "error" });
                }
            },
        });
    }

    return (
        <Card
            title="Unidades de Medida"
            icon={<ScaleIcon className="w-6 h-6" />}
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
                        Nueva
                    </button>
                </div>
            }
        >
            <StackedList
                items={filteredData}
                loading={loading}
                empty="No hay unidades de medida registradas."
                render={(item) => ({
                    title: `${item.code} - ${item.fullName}`,
                    subtitle: item.description || "Sin descripción",
                    badge: item.isEnabled ? "Activo" : "Inactivo",
                    badgeTone: item.isEnabled ? "green" : "gray",
                    onEdit: () => handleEdit(item),
                    onDelete: () => handleToggle(item),
                })}
            />
        </Card>
    );
}
