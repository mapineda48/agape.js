import { useState, useMemo } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    PlusIcon,
    CreditCardIcon,
} from "@heroicons/react/24/outline";
import {
    listPaymentMethods,
    upsertPaymentMethod,
    type PaymentMethodDto,
} from "@agape/finance/payment_method";
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
 * Form state interface for PaymentMethod creation/editing.
 */
interface PaymentMethodFormState {
    id?: number;
    code: string;
    fullName: string;
    description: string;
    requiresReference: boolean;
    requiresBankAccount: boolean;
    isEnabled: boolean;
}

// -- Form Modal --
function PaymentMethodModalWrapper(
    props: {
        item: PaymentMethodDto | null;
        onSave: () => Promise<void>;
    } & PortalInjectedProps
) {
    return (
        <PortalModal
            {...props}
            title={props.item ? "Editar método de pago" : "Nuevo método de pago"}
            size="md"
        >
            <PaymentMethodForm item={props.item} onSave={props.onSave} />
        </PortalModal>
    );
}

function PaymentMethodForm({
    item,
    onSave,
}: {
    item: PaymentMethodDto | null;
    onSave: () => Promise<void>;
}) {
    const notify = useNotificacion();
    const isEditing = !!item;

    const initialState: PaymentMethodFormState = item
        ? {
            id: item.id,
            code: item.code,
            fullName: item.fullName,
            description: item.description || "",
            requiresReference: item.requiresReference,
            requiresBankAccount: item.requiresBankAccount,
            isEnabled: item.isEnabled,
        }
        : {
            code: "",
            fullName: "",
            description: "",
            requiresReference: false,
            requiresBankAccount: false,
            isEnabled: true,
        };

    async function handleSubmit(data: PaymentMethodFormState) {
        try {
            await upsertPaymentMethod({
                id: data.id,
                code: data.code,
                fullName: data.fullName,
                description: data.description || null,
                requiresReference: data.requiresReference,
                requiresBankAccount: data.requiresBankAccount,
                isEnabled: data.isEnabled,
            });
            await onSave();
            notify({
                payload: isEditing
                    ? "Método de pago actualizado"
                    : "Método de pago creado",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving payment method:", error);
            notify({
                payload: "Error al guardar el método de pago",
                type: "error",
            });
            throw error;
        }
    }

    return (
        <Form.Root<PaymentMethodFormState> state={initialState}>
            <Modal.Body>
                <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Código" description="Código único">
                            <Input.Text
                                path="code"
                                required
                                placeholder="EFE"
                                maxLength={10}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white uppercase"
                            />
                        </Field>

                        <Field label="Nombre">
                            <Input.Text
                                path="fullName"
                                required
                                placeholder="Efectivo"
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </Field>
                    </div>

                    <Field label="Descripción">
                        <Input.TextArea
                            path="description"
                            placeholder="Descripción del método de pago..."
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </Field>

                    <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                            Requisitos
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <CheckBox
                                    path="requiresReference"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    Requiere referencia
                                </span>
                            </label>

                            <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <CheckBox
                                    path="requiresBankAccount"
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm text-gray-800 dark:text-gray-200">
                                    Requiere cuenta bancaria
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
                <Submit<PaymentMethodFormState>
                    onSubmit={handleSubmit}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                    {isEditing ? "Guardar cambios" : "Crear método"}
                </Submit>
            </div>
        </Form.Root>
    );
}

const usePaymentMethodModal = createPortalHook(PaymentMethodModalWrapper);

// -- Main Component --
interface PaymentMethodsListProps {
    paymentMethods: PaymentMethodDto[];
}

export default function PaymentMethodsList({
    paymentMethods: initialData,
}: PaymentMethodsListProps) {
    const notify = useNotificacion();
    const [paymentMethods, setPaymentMethods] =
        useState<PaymentMethodDto[]>(initialData);
    const [loading, setLoading] = useState(false);
    const [showInactive, setShowInactive] = useState(false);

    const showFormModal = usePaymentMethodModal();

    async function loadData() {
        setLoading(true);
        try {
            const result = await listPaymentMethods({
                isEnabled: showInactive ? undefined : true,
                includeTotalCount: false,
            });
            setPaymentMethods(result.paymentMethods);
        } catch (error) {
            console.error("Error loading payment methods:", error);
            notify({
                payload: "Error al cargar los métodos de pago",
                type: "error",
            });
        } finally {
            setLoading(false);
        }
    }

    // Filter data locally
    const filteredData = useMemo(() => {
        if (showInactive) return paymentMethods;
        return paymentMethods.filter((p) => p.isEnabled);
    }, [paymentMethods, showInactive]);

    function handleCreate() {
        showFormModal({ item: null, onSave: loadData });
    }

    function handleEdit(item: PaymentMethodDto) {
        showFormModal({ item, onSave: loadData });
    }

    function handleToggle(item: PaymentMethodDto) {
        // Since there's no toggle endpoint, we'll just edit with isEnabled flipped
        const toggledItem = { ...item, isEnabled: !item.isEnabled };
        upsertPaymentMethod({
            id: toggledItem.id,
            code: toggledItem.code,
            fullName: toggledItem.fullName,
            description: toggledItem.description,
            requiresReference: toggledItem.requiresReference,
            requiresBankAccount: toggledItem.requiresBankAccount,
            isEnabled: toggledItem.isEnabled,
        })
            .then(() => {
                loadData();
                notify({
                    payload: `Método de pago ${toggledItem.isEnabled ? "habilitado" : "deshabilitado"}`,
                    type: "success",
                });
            })
            .catch((error) => {
                console.error("Error toggling payment method:", error);
                notify({ payload: "Error al cambiar el estado", type: "error" });
            });
    }

    function getRequirements(item: PaymentMethodDto): string {
        const reqs: string[] = [];
        if (item.requiresReference) reqs.push("Referencia");
        if (item.requiresBankAccount) reqs.push("Cuenta bancaria");
        return reqs.length > 0 ? reqs.join(", ") : "Sin requisitos";
    }

    return (
        <Card
            title="Métodos de Pago"
            icon={<CreditCardIcon className="w-6 h-6" />}
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
                empty="No hay métodos de pago registrados."
                render={(item) => ({
                    title: `${item.code} - ${item.fullName}`,
                    subtitle: getRequirements(item),
                    badge: item.isEnabled ? "Activo" : "Inactivo",
                    badgeTone: item.isEnabled ? "green" : "gray",
                    onEdit: () => handleEdit(item),
                    onDelete: () => handleToggle(item),
                })}
            />
        </Card>
    );
}
