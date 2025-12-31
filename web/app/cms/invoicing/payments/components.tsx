import { useMemo, useState, useEffect } from "react";
import { Form } from "@/components/form";
import { BanknotesIcon, CalendarIcon, UserIcon, DocumentTextIcon, PlusIcon } from "@heroicons/react/24/outline";
import type { CreatePaymentInput, PaymentStatus } from "@utils/dto/finance/payment";
import type { ClientListItem } from "@utils/dto/crm/client";
import type { SalesInvoiceListItem } from "@utils/dto/finance/sales_invoice";
import type { PaymentMethodDto } from "@utils/dto/finance/payment_method";
import Decimal from "@utils/data/Decimal";
import { listSalesInvoices } from "@agape/finance/sales_invoice";

interface Props {
    clients: ClientListItem[];
    paymentMethods: PaymentMethodDto[];
    initialInvoiceId?: number;
    initialClientId?: number;
    children?: React.ReactNode;
}

export function PaymentForm({
    clients,
    paymentMethods,
    initialInvoiceId,
    initialClientId,
    children
}: Props) {
    const { setAt, getValues } = Form.useForm();
    const [pendingInvoices, setPendingInvoices] = useState<SalesInvoiceListItem[]>([]);
    const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);

    // Watch values from form state
    const userId = Form.useSelector((s: CreatePaymentInput) => s.userId);
    const amount = Form.useSelector((s: CreatePaymentInput) => s.amount);
    const allocations = Form.useSelector((s: CreatePaymentInput) => s.allocations) || [];

    const toNum = (val: any): number => {
        if (val instanceof Decimal) return val.toNumber();
        if (typeof val === 'string') return parseFloat(val) || 0;
        return Number(val) || 0;
    };

    const totalAmount = useMemo(() => toNum(amount), [amount]);
    const allocatedAmount = useMemo(() => {
        return allocations.reduce((sum, acc) => sum + toNum(acc.amount), 0);
    }, [allocations]);

    const unallocatedAmount = useMemo(() => {
        return Math.max(0, totalAmount - allocatedAmount);
    }, [totalAmount, allocatedAmount]);

    // Fetch pending invoices when client changes
    useEffect(() => {
        if (!userId) {
            setPendingInvoices([]);
            return;
        }

        setIsLoadingInvoices(true);
        listSalesInvoices({
            clientId: userId,
            status: "issued", // Also should include partially_paid if service supported multiple, but listSalesInvoices takes one.
            // Wait, does listSalesInvoices support multiple statuses?
        }).then(res => {
            // We search for both issued and partially_paid
            const fetchPartiallyPaid = listSalesInvoices({
                clientId: userId,
                status: "partially_paid"
            });

            fetchPartiallyPaid.then(res2 => {
                setPendingInvoices([...res.invoices, ...res2.invoices]);
                setIsLoadingInvoices(false);
            });
        }).catch(() => setIsLoadingInvoices(false));
    }, [userId]);

    const handleAddAllocation = (invoice: SalesInvoiceListItem) => {
        if (allocations.some(a => a.invoiceId === invoice.id)) return;

        // Suggest amount: min(unallocated, balance)
        const balance = toNum(invoice.balance || invoice.totalAmount);
        const suggested = Math.min(unallocatedAmount, balance);

        setAt(["allocations"], [...allocations, {
            invoiceId: invoice.id,
            amount: suggested,
            _invoiceNumber: invoice.documentNumberFull, // Helper for UI
            _balance: balance
        }]);
    };

    const handleRemoveAllocation = (index: number) => {
        const newAllocations = [...allocations];
        newAllocations.splice(index, 1);
        setAt(["allocations"], newAllocations);
    };

    return (
        <div className="bg-white rounded-3xl shadow-xl border border-indigo-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-white">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Registro de Recaudo</h2>
                        <p className="opacity-80 font-medium">Capture pagos de clientes y asigne a facturas</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Monto del Pago</p>
                        <p className="text-4xl font-black">${totalAmount.toLocaleString("es-CO", { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>
            </div>

            <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Client */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <UserIcon className="h-4 w-4" /> Cliente
                        </label>
                        <Form.Select.Int path="userId" required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold">
                            <option value={0}>Seleccionar cliente...</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.firstName ? `${c.firstName} ${c.lastName || ""}` : c.legalName}
                                </option>
                            ))}
                        </Form.Select.Int>
                    </div>

                    {/* Method */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <BanknotesIcon className="h-4 w-4" /> Método de Pago
                        </label>
                        <Form.Select.Int path="paymentMethodId" required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold">
                            <option value={0}>Seleccionar método...</option>
                            {paymentMethods.map(m => (
                                <option key={m.id} value={m.id}>{m.fullName}</option>
                            ))}
                        </Form.Select.Int>
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4" /> Fecha
                        </label>
                        <Form.DateTime path="paymentDate" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold" />
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 text-emerald-600">
                            Monto a Recibir
                        </label>
                        <Form.Decimal path="amount" required className="w-full px-4 py-3 bg-emerald-50 text-emerald-700 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-black text-xl" />
                    </div>

                    {/* Reference */}
                    <div className="lg:col-span-2 space-y-2">
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Referencia / Observaciones</label>
                        <Form.Text path="reference" className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold" placeholder="Ej: Transferencia #123456" />
                    </div>
                </div>

                {/* Allocations Section */}
                <div className="border-t border-gray-100 pt-8">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Selected Allocations */}
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                                    <DocumentTextIcon className="h-5 w-5 text-indigo-600" /> Facturas Aplicadas
                                </h3>
                                <div className="text-right">
                                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${unallocatedAmount > 0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                        {unallocatedAmount > 0 ? `Por aplicar: $${unallocatedAmount.toLocaleString()}` : "Aplicado totalmente"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {allocations.map((alloc: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 transition-all shadow-sm">
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-gray-400 uppercase">{alloc._invoiceNumber || 'Factura'}</p>
                                            <p className="text-sm font-bold text-gray-600">Saldo: ${alloc._balance?.toLocaleString()}</p>
                                        </div>
                                        <div className="w-32">
                                            <Form.Decimal path={`allocations.${idx}.amount`} className="w-full px-3 py-2 bg-indigo-50 border-none rounded-xl text-right font-black text-indigo-700" />
                                        </div>
                                        <button onClick={() => handleRemoveAllocation(idx)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                ))}

                                {allocations.length === 0 && (
                                    <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/30">
                                        <p className="text-sm font-bold text-gray-400">No hay facturas seleccionadas</p>
                                        <p className="text-[10px] uppercase font-black text-gray-300 mt-1">Seleccione facturas de la lista derecha</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Invoices Side list */}
                        <div className="w-full lg:w-80 bg-gray-50/50 rounded-3xl p-6 space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Facturas Pendientes</h3>

                            {!userId && (
                                <p className="text-xs font-medium text-gray-400 italic">Seleccione un cliente para ver facturas</p>
                            )}

                            {isLoadingInvoices && (
                                <div className="flex justify-center py-4 text-emerald-500">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}

                            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                {pendingInvoices.filter(inv => !allocations.some((a: any) => a.invoiceId === inv.id)).map(inv => (
                                    <button
                                        key={inv.id}
                                        onClick={() => handleAddAllocation(inv)}
                                        className="w-full text-left p-4 bg-white rounded-2xl border border-gray-100 hover:border-emerald-500 hover:shadow-md transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase group-hover:text-emerald-500">{inv.documentNumberFull}</span>
                                            <PlusIcon className="h-4 w-4 text-gray-300 group-hover:text-emerald-500" />
                                        </div>
                                        <p className="text-sm font-black text-gray-800 mb-1">${toNum(inv.balance || inv.totalAmount).toLocaleString()}</p>
                                        <p className="text-[10px] font-medium text-gray-400">Emisión: {new Date(inv.issueDate).toLocaleDateString()}</p>
                                    </button>
                                ))}

                                {userId && !isLoadingInvoices && pendingInvoices.length === 0 && (
                                    <p className="text-xs font-medium text-gray-400 italic">El cliente no tiene facturas pendientes</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            {children && (
                <div className="bg-gray-50 px-8 py-6 flex justify-end gap-4 border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
}
