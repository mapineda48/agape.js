import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    PlusIcon,
    TagIcon,
    StarIcon,
} from "@heroicons/react/24/outline";
import {
    listPriceLists,
    upsertPriceList,
    togglePriceList,
    setDefaultPriceList,
    type IPriceList,
    type IPriceListWithUsage,
} from "@agape/catalogs/price_list";
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
 * Form state interface for PriceList creation/editing.
 */
interface PriceListFormState {
    id?: number;
    code: string;
    fullName: string;
    description: string;
    isDefault: boolean;
    isEnabled: boolean;
}

// -- Form Modal --
function PriceListModalWrapper(
    props: {
        item: IPriceList | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar lista de precios" : "Nueva lista de precios"}
            size="md"
        >
            <PriceListForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function PriceListForm({
    item,
    onSave,
}: {
    item: IPriceList | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: PriceListFormState = item
        ? {
            id: item.id,
            code: item.code,
            fullName: item.fullName,
            description: item.description || "",
            isDefault: item.isDefault,
            isEnabled: item.isEnabled,
        }
        : {
            code: "",
            fullName: "",
            description: "",
            isDefault: false,
            isEnabled: true,
        };

    async function handleSubmit(data: PriceListFormState) {
        try {
            await upsertPriceList({
                id: data.id,
                code: data.code,
                fullName: data.fullName,
                description: data.description || null,
                isDefault: data.isDefault,
                isEnabled: data.isEnabled,
            });
            await onSave();
            notify({
                payload: isEditing ? "Lista de precios actualizada" : "Lista de precios creada",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving price list:", error);
            notify({
                payload: "Error al guardar la lista de precios",
                type: "error",
            });
            throw error;
        }
    }

    return (
        <Form.Root<PriceListFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código único de la lista">
                            <Input.Text
                                path="code"
                                required
                                placeholder="RETAIL"
                                maxLength={20}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Nombre">
                            <Input.Text
                                path="fullName"
                                required
                                placeholder="Precio Retail"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Descripción">
                        <Input.TextArea
                            path="description"
                            placeholder="Descripción de la lista de precios..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <div className="flex flex-wrap gap-4">
                        <Field label="Configuración">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <CheckBox
                                    path="isDefault"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    Lista por defecto
                                </span>
                            </label>
                        </Field>

                        <Field label="Estado">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
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
                </div>
            </Modal.Body>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                <Submit<PriceListFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear lista"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const usePriceListModal = createPortalHook(PriceListModalWrapper);

// -- Main Component --
interface PriceListsProps {
    priceLists: IPriceListWithUsage[];
}

export default function PriceListsList({
    priceLists: initialData,
}: PriceListsProps) {
    const notify = useNotificacion();
    const [priceLists, setPriceLists] = useState<IPriceListWithUsage[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const showFormModal = usePriceListModal();
    const showConfirm = useConfirmModal();

    async function loadData() {
        setLoading(true);
        try {
            const data = await listPriceLists({
                activeOnly: !showInactive,
                includeUsageInfo: true,
            });
            setPriceLists(data);
        } catch (error) {
            console.error("Error loading price lists:", error);
            notify({
                payload: "Error al cargar las listas de precios",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    // Filter data locally
    const filteredData = useMemo(() => {
        if (showInactive) return priceLists;
        return priceLists.filter((p) => p.isEnabled);
    }, [priceLists, showInactive]);

    function handleCreate() {
        showFormModal({ item: null, onSave: loadData });
    }

    function handleEdit(item: IPriceListWithUsage) {
        showFormModal({ item, onSave: loadData });
    }

    function handleToggle(item: IPriceListWithUsage) {
        if (item.isDefault && item.isEnabled) {
            notify({
                payload: "No se puede deshabilitar la lista por defecto",
                type: "error",
            });
            return;
        }

        const action = item.isEnabled ? "deshabilitar" : "habilitar";
        showConfirm({
            title: `${item.isEnabled ? "Deshabilitar" : "Habilitar"} lista de precios`,
            message: `¿Estás seguro de que deseas ${action} "${item.fullName}"?`,
            confirmText: item.isEnabled ? "Deshabilitar" : "Habilitar",
            variant: item.isEnabled ? "danger" : "primary",
            onConfirm: async () => {
                try {
                    await togglePriceList({
                        id: item.id,
                        isEnabled: !item.isEnabled,
                    });
                    await loadData();
                    notify({
                        payload: `Lista de precios ${item.isEnabled ? "deshabilitada" : "habilitada"}`,
                        type: "success",
                    });
                } catch (error) {
                    console.error("Error toggling price list:", error);
                    const errorMsg =
                        error instanceof Error ? error.message : "Error desconocido";
                    notify({ payload: errorMsg, type: "error" });
                }
            },
        });
    }

    function handleSetDefault(item: IPriceListWithUsage) {
        if (item.isDefault) return;

        showConfirm({
            title: "Establecer como lista por defecto",
            message: `¿Deseas establecer "${item.fullName}" como la lista de precios por defecto?`,
            confirmText: "Establecer",
            variant: "primary",
            onConfirm: async () => {
                try {
                    await setDefaultPriceList({ id: item.id });
                    await loadData();
                    notify({
                        payload: `${item.fullName} es ahora la lista por defecto`,
                        type: "success",
                    });
                } catch (error) {
                    console.error("Error setting default price list:", error);
                    const errorMsg =
                        error instanceof Error ? error.message : "Error desconocido";
                    notify({ payload: errorMsg, type: "error" });
                }
            },
        });
    }

    return (
        <Card
            title="Listas de Precios"
            icon={<TagIcon className="w-6 h-6" />}
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
                empty="No hay listas de precios registradas."
                render={(item) => ({
                    title: `${item.code} - ${item.fullName}`,
                    subtitle: item.itemsCount !== undefined
                        ? `${item.itemsCount} productos, ${item.clientsCount || 0} clientes`
                        : item.description || "Sin descripción",
                    badge: item.isDefault ? "Por defecto" : item.isEnabled ? "Activo" : "Inactivo",
                    badgeTone: item.isDefault ? "blue" : item.isEnabled ? "green" : "gray",
                    onEdit: () => handleEdit(item),
                    onDelete: item.isDefault ? () => handleSetDefault(item) : () => handleToggle(item),
                })}
            />
        </Card>
    );
}
