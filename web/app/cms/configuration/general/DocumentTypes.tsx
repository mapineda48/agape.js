import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import { Select, SelectItem } from "@/components/ui/select";
import {
    PlusIcon,
    IdentificationIcon,
    FunnelIcon,
} from "@heroicons/react/24/outline";
import {
    listDocumentTypes,
    upsertDocumentType,
    toggleDocumentType,
    type IDocumentType,
} from "@agape/core/documentType";
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

interface DocumentTypeFilters {
    search: string;
    activeOnly: boolean;
    appliesToPerson: "all" | "yes" | "no";
    appliesToCompany: "all" | "yes" | "no";
}

/**
 * Form state interface for DocumentType creation/editing.
 */
interface DocumentTypeFormState {
    id?: number;
    code: string;
    name: string;
    isEnabled: boolean;
    appliesToPerson: boolean;
    appliesToCompany: boolean;
}

// -- Form Modal --
function DocumentTypeModalWrapper(
    props: {
        item: IDocumentType | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={
                props.item
                    ? "Editar tipo de documento"
                    : "Nuevo tipo de documento de identidad"
            }
            size="md"
        >
            <DocumentTypeForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function DocumentTypeForm({
    item,
    onSave,
}: {
    item: IDocumentType | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: DocumentTypeFormState = item
        ? {
            id: item.id,
            code: item.code,
            name: item.name,
            isEnabled: item.isEnabled,
            appliesToPerson: item.appliesToPerson,
            appliesToCompany: item.appliesToCompany,
        }
        : {
            code: "",
            name: "",
            isEnabled: true,
            appliesToPerson: true,
            appliesToCompany: false,
        };

    async function handleSubmit(data: DocumentTypeFormState) {
        try {
            await upsertDocumentType({
                id: data.id,
                code: data.code,
                name: data.name,
                isEnabled: data.isEnabled,
                appliesToPerson: data.appliesToPerson,
                appliesToCompany: data.appliesToCompany,
            });
            await onSave();
            notify({
                payload: isEditing
                    ? "Tipo de documento actualizado"
                    : "Tipo de documento creado",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving document type:", error);
            notify({
                payload: "Error al guardar el tipo de documento",
                type: "error",
            });
            throw error;
        }
    }

    return (
        <Form.Root<DocumentTypeFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código único (ej: CC, NIT, PAS)">
                            <Input.Text
                                path="code"
                                required
                                placeholder="CC"
                                maxLength={10}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Nombre" description="Nombre completo del documento">
                            <Input.Text
                                path="name"
                                required
                                placeholder="Cédula de Ciudadanía"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            Aplica para
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <CheckBox
                                    path="appliesToPerson"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    Personas naturales
                                </span>
                            </label>

                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <CheckBox
                                    path="appliesToCompany"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    Empresas
                                </span>
                            </label>
                        </div>
                    </div>

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
                <Submit<DocumentTypeFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear tipo"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const useDocumentTypeModal = createPortalHook(DocumentTypeModalWrapper);

// -- Filter Modal --
function FilterModalWrapper(
    props: {
        filters: DocumentTypeFilters;
        onApply: (filters: DocumentTypeFilters) => void;
    } & PortalInjectedProps
) {
    return (
        <PortalModal {...props} title="Filtrar tipos de documento" size="sm">
            <FilterForm initialFilters={props.filters} onApply={props.onApply} />
        </PortalModal>
    );
}

function FilterForm({
    initialFilters,
    onApply,
}: {
    initialFilters: DocumentTypeFilters;
    onApply: (filters: DocumentTypeFilters) => void;
}) {
    const [filters, setFilters] = useState(initialFilters);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        onApply(filters);
    }

    return (
        <form onSubmit={handleSubmit}>
            <Modal.Body>
                <div className="space-y-4">
                    <Field label="Buscar">
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) =>
                                setFilters({ ...filters, search: e.target.value })
                            }
                            placeholder="Buscar por nombre o código..."
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <Field label="Aplica para personas">
                        <Select
                            value={filters.appliesToPerson}
                            onChange={(value: "all" | "yes" | "no" | undefined) =>
                                setFilters({
                                    ...filters,
                                    appliesToPerson: value || "all",
                                })
                            }
                        >
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="yes">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                        </Select>
                    </Field>

                    <Field label="Aplica para empresas">
                        <Select
                            value={filters.appliesToCompany}
                            onChange={(value: "all" | "yes" | "no" | undefined) =>
                                setFilters({
                                    ...filters,
                                    appliesToCompany: value || "all",
                                })
                            }
                        >
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="yes">Sí</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                        </Select>
                    </Field>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filters.activeOnly}
                            onChange={(e) =>
                                setFilters({ ...filters, activeOnly: e.target.checked })
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                            Solo activos
                        </span>
                    </label>
                </div>
            </Modal.Body>

            <Modal.Footer>
                <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                    Aplicar filtros
                </button>
            </Modal.Footer>
        </form>
    );
}

const useFilterModal = createPortalHook(FilterModalWrapper);

// -- Main Component --
interface DocumentTypesListProps {
    documentTypes: IDocumentType[];
}

export default function DocumentTypesList({
    documentTypes: initialData,
}: DocumentTypesListProps) {
    const notify = useNotificacion();
    const [documentTypes, setDocumentTypes] =
        useState<IDocumentType[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<DocumentTypeFilters>({
        search: "",
        activeOnly: false,
        appliesToPerson: "all",
        appliesToCompany: "all",
    });

    const showFormModal = useDocumentTypeModal();
    const showFilterModal = useFilterModal();
    const showConfirm = useConfirmModal();

    async function loadData() {
        setLoading(true);
        try {
            const data = await listDocumentTypes({
                activeOnly: filters.activeOnly,
            });
            setDocumentTypes(data);
        } catch (error) {
            console.error("Error loading document types:", error);
            notify({
                payload: "Error al cargar los tipos de documento",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    // Filter data locally
    const filteredData = useMemo(() => {
        let result = [...documentTypes];

        if (filters.search) {
            const term = filters.search.toLowerCase();
            result = result.filter(
                (d) =>
                    d.name.toLowerCase().includes(term) ||
                    d.code.toLowerCase().includes(term)
            );
        }

        if (filters.activeOnly) {
            result = result.filter((d) => d.isEnabled);
        }

        if (filters.appliesToPerson === "yes") {
            result = result.filter((d) => d.appliesToPerson);
        } else if (filters.appliesToPerson === "no") {
            result = result.filter((d) => !d.appliesToPerson);
        }

        if (filters.appliesToCompany === "yes") {
            result = result.filter((d) => d.appliesToCompany);
        } else if (filters.appliesToCompany === "no") {
            result = result.filter((d) => !d.appliesToCompany);
        }

        return result;
    }, [documentTypes, filters]);

    function handleCreate() {
        showFormModal({ item: null, onSave: loadData });
    }

    function handleEdit(item: IDocumentType) {
        showFormModal({ item, onSave: loadData });
    }

    function handleToggle(item: IDocumentType) {
        const action = item.isEnabled ? "deshabilitar" : "habilitar";
        showConfirm({
            title: `${item.isEnabled ? "Deshabilitar" : "Habilitar"} tipo de documento`,
            message: `¿Estás seguro de que deseas ${action} "${item.name}"?`,
            confirmText: item.isEnabled ? "Deshabilitar" : "Habilitar",
            variant: item.isEnabled ? "danger" : "primary",
            onConfirm: async () => {
                try {
                    await toggleDocumentType({
                        id: item.id,
                        isEnabled: !item.isEnabled,
                    });
                    await loadData();
                    notify({
                        payload: `Tipo de documento ${item.isEnabled ? "deshabilitado" : "habilitado"}`,
                        type: "success",
                    });
                } catch (error) {
                    console.error("Error toggling document type:", error);
                    const errorMsg =
                        error instanceof Error ? error.message : "Error desconocido";
                    notify({
                        payload: errorMsg,
                        type: "error",
                    });
                }
            },
        });
    }

    function openFilters() {
        showFilterModal({
            filters,
            onApply: (newFilters) => {
                setFilters(newFilters);
            },
        });
    }

    const hasActiveFilters =
        filters.search ||
        filters.activeOnly ||
        filters.appliesToPerson !== "all" ||
        filters.appliesToCompany !== "all";

    return (
        <Card
            title="Tipos de Documento de Identidad"
            icon={<IdentificationIcon className="w-6 h-6" />}
            action={
                <div className="flex items-center gap-2">
                    <button
                        onClick={openFilters}
                        className={clsx(
                            "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            hasActiveFilters
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        )}
                    >
                        <FunnelIcon className="w-4 h-4" />
                        Filtros
                        {hasActiveFilters && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-indigo-600 text-white rounded-full">
                                !
                            </span>
                        )}
                    </button>
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
                empty="No hay tipos de documento registrados."
                render={(item) => ({
                    title: `${item.code} - ${item.name}`,
                    subtitle: getAppliesLabel(item),
                    badge: item.isEnabled ? "Activo" : "Inactivo",
                    badgeTone: item.isEnabled ? "green" : "gray",
                    onEdit: () => handleEdit(item),
                    onDelete: () => handleToggle(item),
                })}
            />
        </Card>
    );
}

function getAppliesLabel(item: IDocumentType): string {
    const parts: string[] = [];
    if (item.appliesToPerson) parts.push("Personas");
    if (item.appliesToCompany) parts.push("Empresas");
    return parts.length > 0 ? `Aplica para: ${parts.join(", ")}` : "Sin asignar";
}
