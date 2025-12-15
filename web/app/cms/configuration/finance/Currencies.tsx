import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    PlusIcon,
    CurrencyDollarIcon,
    FunnelIcon,
    StarIcon,
} from "@heroicons/react/24/outline";
import {
    listCurrencies,
    upsertCurrency,
    toggleCurrency,
    setBaseCurrency,
    type ICurrency,
} from "@agape/finance/currency";
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
 * Form state interface for Currency creation/editing.
 */
interface CurrencyFormState {
    id?: number;
    code: string;
    fullName: string;
    symbol: string;
    exchangeRate: number;
    isEnabled: boolean;
}

// -- Form Modal --
function CurrencyModalWrapper(
    props: {
        item: ICurrency | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar moneda" : "Nueva moneda"}
            size="md"
        >
            <CurrencyForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function CurrencyForm({
    item,
    onSave,
}: {
    item: ICurrency | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: CurrencyFormState = item
        ? {
            id: item.id,
            code: item.code,
            fullName: item.fullName,
            symbol: item.symbol,
            exchangeRate: Number(item.exchangeRate),
            isEnabled: item.isEnabled,
        }
        : {
            code: "",
            fullName: "",
            symbol: "",
            exchangeRate: 1,
            isEnabled: true,
        };

    async function handleSubmit(data: CurrencyFormState) {
        try {
            await upsertCurrency({
                id: data.id,
                code: data.code,
                fullName: data.fullName,
                symbol: data.symbol,
                isEnabled: data.isEnabled,
            });
            await onSave();
            notify({
                payload: isEditing ? "Moneda actualizada" : "Moneda creada",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving currency:", error);
            notify({
                payload: "Error al guardar la moneda",
                type: "error",
            });
            throw error;
        }
    }

    return (
        <Form.Root<CurrencyFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código ISO" description="Código de 3 letras (ej: COP, USD)">
                            <Input.Text
                                path="code"
                                required
                                placeholder="COP"
                                maxLength={3}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Símbolo" description="Símbolo de la moneda">
                            <Input.Text
                                path="symbol"
                                required
                                placeholder="$"
                                maxLength={5}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Nombre completo">
                        <Input.Text
                            path="fullName"
                            required
                            placeholder="Peso Colombiano"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <Field label="Tasa de cambio" description="Tasa respecto a la moneda base">
                        <Input.Float
                            path="exchangeRate"
                            min={0}
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
                <Submit<CurrencyFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear moneda"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const useCurrencyModal = createPortalHook(CurrencyModalWrapper);

// -- Main Component --
interface CurrenciesListProps {
    currencies: ICurrency[];
}

export default function CurrenciesList({
    currencies: initialData,
}: CurrenciesListProps) {
    const notify = useNotificacion();
    const [currencies, setCurrencies] = useState<ICurrency[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const showFormModal = useCurrencyModal();
    const showConfirm = useConfirmModal();

    async function loadData() {
        setLoading(true);
        try {
            const data = await listCurrencies({ activeOnly: !showInactive });
            setCurrencies(data);
        } catch (error) {
            console.error("Error loading currencies:", error);
            notify({
                payload: "Error al cargar las monedas",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    // Filter data locally
    const filteredData = useMemo(() => {
        if (showInactive) return currencies;
        return currencies.filter((c) => c.isEnabled);
    }, [currencies, showInactive]);

    function handleCreate() {
        showFormModal({ item: null, onSave: loadData });
    }

    function handleEdit(item: ICurrency) {
        showFormModal({ item, onSave: loadData });
    }

    function handleToggle(item: ICurrency) {
        const action = item.isEnabled ? "deshabilitar" : "habilitar";
        showConfirm({
            title: `${item.isEnabled ? "Deshabilitar" : "Habilitar"} moneda`,
            message: `¿Estás seguro de que deseas ${action} "${item.fullName}"?`,
            confirmText: item.isEnabled ? "Deshabilitar" : "Habilitar",
            variant: item.isEnabled ? "danger" : "primary",
            onConfirm: async () => {
                try {
                    await toggleCurrency({
                        id: item.id,
                        isEnabled: !item.isEnabled,
                    });
                    await loadData();
                } catch (error) {
                    console.error("Error toggling currency:", error);
                    const errorMsg =
                        error instanceof Error ? error.message : "Error desconocido";
                    notify({ payload: errorMsg, type: "error" });
                }
            },
        });
    }

    function handleSetBase(item: ICurrency) {
        showConfirm({
            title: "Establecer como moneda base",
            message: `¿Deseas establecer "${item.fullName}" como la moneda base del sistema? La tasa de cambio se establecerá en 1.`,
            confirmText: "Establecer",
            variant: "primary",
            onConfirm: async () => {
                try {
                    await setBaseCurrency({ id: item.id });
                    await loadData();
                    notify({
                        payload: `${item.fullName} es ahora la moneda base`,
                        type: "success",
                    });
                } catch (error) {
                    console.error("Error setting base currency:", error);
                    const errorMsg =
                        error instanceof Error ? error.message : "Error desconocido";
                    notify({ payload: errorMsg, type: "error" });
                }
            },
        });
    }

    return (
        <Card
            title="Monedas"
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
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
                empty="No hay monedas registradas."
                render={(item) => ({
                    title: `${item.code} - ${item.fullName}`,
                    subtitle: `Símbolo: ${item.symbol} | Tasa: ${item.exchangeRate}`,
                    badge: item.isBase ? "Base" : item.isEnabled ? "Activo" : "Inactivo",
                    badgeTone: item.isBase ? "blue" : item.isEnabled ? "green" : "gray",
                    extraChip: item.isBase ? undefined : "★",
                    extraTone: "amber",
                    onEdit: () => handleEdit(item),
                    onDelete: () => (item.isBase ? handleSetBase(item) : handleToggle(item)),
                })}
            />
        </Card>
    );
}
