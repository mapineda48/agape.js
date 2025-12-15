import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    PlusIcon,
    ReceiptPercentIcon,
    ChevronDownIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
    listTaxGroups,
    listTaxes,
    upsertTax,
    upsertTaxGroup,
    toggleTax,
    toggleTaxGroup,
    type ITax,
    type ITaxGroupWithTaxes,
} from "@agape/finance/tax_group";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import CheckBox from "@/components/form/CheckBox";
import Submit from "@/components/ui/submit";
import Modal from "@/components/ui/Modal";
import Decimal from "@utils/data/Decimal";
import {
    createPortalHook,
    type PortalInjectedProps,
} from "@/components/util/portal";
import PortalModal from "@/components/ui/PortalModal";
import { useConfirmModal } from "@/components/ui/PortalConfirm";
import { Card, Field } from "../inventory/components";

// ============================================================================
// Tax Individual Form
// ============================================================================

interface TaxFormState {
    id?: number;
    code: string;
    fullName: string;
    rate: number;
    isEnabled: boolean;
}

function TaxModalWrapper(
    props: {
        item: ITax | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar impuesto" : "Nuevo impuesto"}
            size="md"
        >
            <TaxForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function TaxForm({
    item,
    onSave,
}: {
    item: ITax | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: TaxFormState = item
        ? {
            id: item.id,
            code: item.code,
            fullName: item.fullName,
            rate: Number(item.rate),
            isEnabled: item.isEnabled,
        }
        : {
            code: "",
            fullName: "",
            rate: 0,
            isEnabled: true,
        };

    async function handleSubmit(data: TaxFormState) {
        try {
            await upsertTax({
                id: data.id,
                code: data.code,
                fullName: data.fullName,
                rate: new Decimal(data.rate),
                isEnabled: data.isEnabled,
            });
            await onSave();
            notify({
                payload: isEditing ? "Impuesto actualizado" : "Impuesto creado",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving tax:", error);
            notify({ payload: "Error al guardar el impuesto", type: "error" });
            throw error;
        }
    }

    return (
        <Form.Root<TaxFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código único (ej: IVA19)">
                            <Input.Text
                                path="code"
                                required
                                placeholder="IVA19"
                                maxLength={20}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Tasa %" description="Porcentaje del impuesto">
                            <Input.Float
                                path="rate"
                                min={0}
                                max={100}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Nombre completo">
                        <Input.Text
                            path="fullName"
                            required
                            placeholder="Impuesto al Valor Agregado 19%"
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
                <Submit<TaxFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear impuesto"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const useTaxModal = createPortalHook(TaxModalWrapper);

// ============================================================================
// Tax Group Form
// ============================================================================

interface TaxGroupFormState {
    id?: number;
    code: string;
    fullName: string;
    taxIds: number[];
    isEnabled: boolean;
}

function TaxGroupModalWrapper(
    props: {
        item: ITaxGroupWithTaxes | null;
        allTaxes: ITax[];
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar grupo de impuestos" : "Nuevo grupo de impuestos"}
            size="md"
        >
            <TaxGroupForm item={props.item} allTaxes={props.allTaxes} onSave={props.onSave} />
        </PortalModal>
    );
}

function TaxGroupForm({
    item,
    allTaxes,
    onSave,
}: {
    item: ITaxGroupWithTaxes | null;
    allTaxes: ITax[];
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;
    const [selectedTaxIds, setSelectedTaxIds] = useState<number[]>(
        item?.taxes.map((t) => t.id) || []
    );

    const initialState: TaxGroupFormState = item
        ? {
            id: item.id,
            code: item.code,
            fullName: item.fullName,
            taxIds: item.taxes.map((t) => t.id),
            isEnabled: item.isEnabled,
        }
        : {
            code: "",
            fullName: "",
            taxIds: [],
            isEnabled: true,
        };

    async function handleSubmit(data: TaxGroupFormState) {
        if (selectedTaxIds.length === 0) {
            notify({
                payload: "Debes seleccionar al menos un impuesto",
                type: "error",
            });
            return;
        }

        try {
            await upsertTaxGroup({
                id: data.id,
                code: data.code,
                fullName: data.fullName,
                taxIds: selectedTaxIds,
                isEnabled: data.isEnabled,
            });
            await onSave();
            notify({
                payload: isEditing ? "Grupo actualizado" : "Grupo creado",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving tax group:", error);
            notify({ payload: "Error al guardar el grupo", type: "error" });
            throw error;
        }
    }

    function toggleTaxSelection(taxId: number) {
        setSelectedTaxIds((prev) =>
            prev.includes(taxId)
                ? prev.filter((id) => id !== taxId)
                : [...prev, taxId]
        );
    }

    const activeTaxes = allTaxes.filter((t) => t.isEnabled);

    return (
        <Form.Root<TaxGroupFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código único del grupo">
                            <Input.Text
                                path="code"
                                required
                                placeholder="GRAVADO19"
                                maxLength={20}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Nombre">
                            <Input.Text
                                path="fullName"
                                required
                                placeholder="Productos Gravados 19%"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            Impuestos incluidos
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Selecciona los impuestos que componen este grupo.
                        </p>
                        <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700">
                            {activeTaxes.length === 0 ? (
                                <p className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                                    No hay impuestos activos disponibles.
                                </p>
                            ) : (
                                activeTaxes.map((tax) => (
                                    <label
                                        key={tax.id}
                                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTaxIds.includes(tax.id)}
                                            onChange={() => toggleTaxSelection(tax.id)}
                                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                {tax.code} - {tax.fullName}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Tasa: {String(tax.rate)}%
                                            </p>
                                        </div>
                                    </label>
                                ))
                            )}
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
                <Submit<TaxGroupFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear grupo"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const useTaxGroupModal = createPortalHook(TaxGroupModalWrapper);

// ============================================================================
// Main Component
// ============================================================================

interface TaxesListProps {
    taxes: ITax[];
    taxGroups: ITaxGroupWithTaxes[];
}

export default function TaxesList({
    taxes: initialTaxes,
    taxGroups: initialGroups,
}: TaxesListProps) {
    const notify = useNotificacion();
    const [taxes, setTaxes] = useState<ITax[]>(initialTaxes);
    const [taxGroups, setTaxGroups] = useState<ITaxGroupWithTaxes[]>(initialGroups);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    const showTaxModal = useTaxModal();
    const showTaxGroupModal = useTaxGroupModal();
    const showConfirm = useConfirmModal();

    async function loadData() {
        setLoading(true);
        try {
            const [taxData, groupData] = await Promise.all([
                listTaxes({ activeOnly: !showInactive }),
                listTaxGroups({ activeOnly: !showInactive }),
            ]);
            setTaxes(taxData);
            setTaxGroups(groupData);
        } catch (error) {
            console.error("Error loading taxes:", error);
            notify({ payload: "Error al cargar impuestos", type: "error" });
        } finally {
            setLoading(false);
        }
    }

    function handleCreateTax() {
        showTaxModal({ item: null, onSave: loadData });
    }

    function handleEditTax(item: ITax) {
        showTaxModal({ item, onSave: loadData });
    }

    function handleToggleTax(item: ITax) {
        const action = item.isEnabled ? "deshabilitar" : "habilitar";
        showConfirm({
            title: `${item.isEnabled ? "Deshabilitar" : "Habilitar"} impuesto`,
            message: `¿Estás seguro de que deseas ${action} "${item.fullName}"?`,
            confirmText: item.isEnabled ? "Deshabilitar" : "Habilitar",
            variant: item.isEnabled ? "danger" : "primary",
            onConfirm: async () => {
                try {
                    await toggleTax({ id: item.id, isEnabled: !item.isEnabled });
                    await loadData();
                } catch (error) {
                    console.error("Error toggling tax:", error);
                    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
                    notify({ payload: errorMsg, type: "error" });
                }
            },
        });
    }

    function handleCreateGroup() {
        showTaxGroupModal({ item: null, allTaxes: taxes, onSave: loadData });
    }

    function handleEditGroup(item: ITaxGroupWithTaxes) {
        showTaxGroupModal({ item, allTaxes: taxes, onSave: loadData });
    }

    function handleToggleGroup(item: ITaxGroupWithTaxes) {
        const action = item.isEnabled ? "deshabilitar" : "habilitar";
        showConfirm({
            title: `${item.isEnabled ? "Deshabilitar" : "Habilitar"} grupo`,
            message: `¿Estás seguro de que deseas ${action} "${item.fullName}"?`,
            confirmText: item.isEnabled ? "Deshabilitar" : "Habilitar",
            variant: item.isEnabled ? "danger" : "primary",
            onConfirm: async () => {
                try {
                    await toggleTaxGroup({ id: item.id, isEnabled: !item.isEnabled });
                    await loadData();
                } catch (error) {
                    console.error("Error toggling tax group:", error);
                    const errorMsg = error instanceof Error ? error.message : "Error desconocido";
                    notify({ payload: errorMsg, type: "error" });
                }
            },
        });
    }

    function toggleGroupExpand(groupId: number) {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    }

    // Filter data
    const filteredTaxes = useMemo(() => {
        if (showInactive) return taxes;
        return taxes.filter((t) => t.isEnabled);
    }, [taxes, showInactive]);

    const filteredGroups = useMemo(() => {
        if (showInactive) return taxGroups;
        return taxGroups.filter((g) => g.isEnabled);
    }, [taxGroups, showInactive]);

    return (
        <div className="space-y-6">
            <Card
                title="Impuestos Individuales"
                icon={<ReceiptPercentIcon className="w-6 h-6" />}
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
                            onClick={handleCreateTax}
                            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-transform hover:-translate-y-0.5"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Nuevo
                        </button>
                    </div>
                }
            >
                {loading ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        Cargando...
                    </div>
                ) : filteredTaxes.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No hay impuestos registrados.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredTaxes.map((tax) => (
                            <div
                                key={tax.id}
                                className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                        {tax.code} - {tax.fullName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Tasa: {String(tax.rate)}%
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={clsx(
                                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                                            tax.isEnabled
                                                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                        )}
                                    >
                                        {tax.isEnabled ? "Activo" : "Inactivo"}
                                    </span>
                                    <button
                                        onClick={() => handleEditTax(tax)}
                                        className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleToggleTax(tax)}
                                        className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                                        title={tax.isEnabled ? "Deshabilitar" : "Habilitar"}
                                    >
                                        {tax.isEnabled ? "🚫" : "✅"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            <Card
                title="Grupos de Impuestos"
                icon={<ReceiptPercentIcon className="w-6 h-6" />}
                action={
                    <button
                        onClick={handleCreateGroup}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-transform hover:-translate-y-0.5"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Nuevo grupo
                    </button>
                }
            >
                {loading ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        Cargando...
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                        No hay grupos de impuestos registrados.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredGroups.map((group) => {
                            const isExpanded = expandedGroups.has(group.id);
                            const totalRate = group.taxes.reduce(
                                (sum, t) => sum + Number(t.rate),
                                0
                            );
                            return (
                                <div key={group.id}>
                                    <div
                                        className="flex items-center justify-between gap-3 px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                        onClick={() => toggleGroupExpand(group.id)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            {isExpanded ? (
                                                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                                            )}
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {group.code} - {group.fullName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {group.taxes.length} impuesto(s) | Total: {totalRate}%
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={clsx(
                                                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                                                    group.isEnabled
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200"
                                                        : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                                )}
                                            >
                                                {group.isEnabled ? "Activo" : "Inactivo"}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditGroup(group);
                                                }}
                                                className="rounded-md p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/40 transition-colors"
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleGroup(group);
                                                }}
                                                className="rounded-md p-2 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/40 transition-colors"
                                                title={group.isEnabled ? "Deshabilitar" : "Habilitar"}
                                            >
                                                {group.isEnabled ? "🚫" : "✅"}
                                            </button>
                                        </div>
                                    </div>
                                    {isExpanded && group.taxes.length > 0 && (
                                        <div className="bg-gray-50 dark:bg-gray-800/30 px-6 py-3 space-y-1">
                                            {group.taxes.map((tax) => (
                                                <div
                                                    key={tax.id}
                                                    className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400"
                                                >
                                                    <span>
                                                        {tax.code} - {tax.fullName}
                                                    </span>
                                                    <span>{String(tax.rate)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
