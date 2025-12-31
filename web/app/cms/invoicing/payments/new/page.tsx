import { listClients } from "@agape/crm/client";
import { listPaymentMethods } from "@agape/finance/payment_method";
import { createPayment } from "@agape/finance/payment";
import { useRouter } from "@/components/router/router-hook";
import { useNotificacion } from "@/components/ui/notification";
import { Form } from "@/components/form";
import { PaymentForm } from "../components";
import type { CreatePaymentInput } from "@utils/dto/finance/payment";
import type { ClientListItem } from "@utils/dto/crm/client";
import type { PaymentMethodDto } from "@utils/dto/finance/payment_method";

interface Props {
    clients: ClientListItem[];
    paymentMethods: PaymentMethodDto[];
}

export async function onInit(): Promise<Props> {
    const [clientsRes, methodsRes] = await Promise.all([
        listClients({ isActive: true, pageSize: 100 }),
        listPaymentMethods({ isEnabled: true })
    ]);

    return {
        clients: clientsRes.clients,
        paymentMethods: methodsRes.paymentMethods
    };
}

export default function NewPaymentPage({ clients, paymentMethods }: Props) {
    const { navigate } = useRouter();
    const notify = useNotificacion();

    const handleSubmit = async (data: CreatePaymentInput) => {
        try {
            if (!data.userId || data.userId === 0) {
                throw new Error("Debe seleccionar un cliente");
            }
            if (!data.paymentMethodId || data.paymentMethodId === 0) {
                throw new Error("Debe seleccionar un método de pago");
            }
            if (!data.amount || Number(data.amount) <= 0) {
                throw new Error("El monto debe ser mayor a cero");
            }

            // Clean allocations (remove UI helpers)
            const cleanAllocations = (data.allocations || []).map(a => ({
                invoiceId: a.invoiceId,
                amount: a.amount
            }));

            const result = await createPayment({
                ...data,
                type: "receipt", // We only handle receipts for now in this UI
                allocations: cleanAllocations
            });

            notify({
                payload: `Recaudo ${result.documentNumberFull} registrado exitosamente`,
                type: "success"
            });

            navigate("..");
        } catch (error: any) {
            notify({
                payload: error instanceof Error ? error.message : "Error al registrar el pago",
                type: "error"
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <button
                    onClick={() => navigate("..")}
                    className="group mb-8 flex items-center gap-2 text-sm font-black text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest"
                >
                    <svg className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver a Pagos
                </button>

                <Form.Root<CreatePaymentInput>
                    state={{
                        type: "receipt",
                        userId: 0,
                        paymentMethodId: 0,
                        amount: 0,
                        allocations: []
                    }}
                >
                    <PaymentForm
                        clients={clients}
                        paymentMethods={paymentMethods}
                    >
                        <Form.Submit
                            onSubmit={handleSubmit}
                            className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-lg"
                        >
                            Registrar Recaudo
                        </Form.Submit>
                    </PaymentForm>
                </Form.Root>
            </div>
        </div>
    );
}
