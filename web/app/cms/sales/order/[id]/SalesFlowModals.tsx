import { useMemo } from "react";
import { Form } from "@/components/form";
import { createPortalHook, type PortalInjectedProps } from "@/components/util/portal";
import PortalModal, { Modal } from "@/components/ui/PortalModal";
import type { SalesOrderDetails } from "@utils/dto/crm/order";
import type { DeliverSalesOrderInput, InvoiceSalesOrderInput } from "@utils/dto/sales/flow";
import Decimal from "@utils/data/Decimal";
import { TruckIcon, DocumentTextIcon, MapPinIcon, CheckCircleIcon, CubeIcon } from "@heroicons/react/24/outline";

interface Location {
    id: number;
    name: string;
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function ProgressBar({ current, total, colorClass }: { current: number, total: number, colorClass: string }) {
    const percentage = Math.min(100, Math.max(0, (current / total) * 100));

    return (
        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mt-2">
            <div
                className={`h-full rounded-full ${colorClass} transition-all duration-500 ease-out`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
}

// ----------------------------------------------------------------------
// DELIVERY MODAL
// ----------------------------------------------------------------------

interface DeliveryModalProps {
    order: SalesOrderDetails;
    locations: Location[];
    onConfirm: (data: DeliverSalesOrderInput) => Promise<void>;
}

function DeliveryModalContent({ order, locations, onConfirm, onClose }: DeliveryModalProps & { onClose?: () => void }) {
    const pendingItems = useMemo(() => {
        return order.items.filter(item => {
            const qty = toNum(item.quantity);
            const dev = toNum(item.deliveredQuantity);
            return qty > dev;
        });
    }, [order.items]);

    const initialQuantities = useMemo(() => {
        return pendingItems.map(item => ({
            orderItemId: item.id,
            quantity: toNum(item.quantity) - toNum(item.deliveredQuantity),
            _name: item.itemName,
            _total: toNum(item.quantity),
            _delivered: toNum(item.deliveredQuantity)
        }));
    }, [pendingItems]);

    const handleSubmit = async (data: any) => {
        const items = (data.items || [])
            .filter((i: any) => i.quantity > 0)
            .map((i: any) => ({
                orderItemId: i.orderItemId,
                quantity: i.quantity
            }));

        if (items.length === 0) {
            throw new Error("Debe seleccionar al menos un ítem con cantidad mayor a cero");
        }

        await onConfirm({
            orderId: order.id,
            locationId: data.locationId,
            items,
            userId: 0 // Will be set by parent
        });

        onClose?.();
    };

    // Success State
    if (pendingItems.length === 0) {
        return (
            <Modal.Body className="flex flex-col items-center justify-center py-12 px-4 space-y-8 min-h-[400px]">
                <div className="relative group">
                    <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 animate-pulse"></div>
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 transform group-hover:scale-105 transition-transform duration-500">
                        <CheckCircleIcon className="h-16 w-16 text-white stroke-[2]" />
                    </div>
                </div>
                <div className="text-center space-y-3 max-w-sm mx-auto">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">¡Entregas Completadas!</h3>
                    <p className="text-gray-500 text-base leading-relaxed">
                        Todos los productos de la orden <span className="font-bold text-blue-600 whitespace-nowrap">{order.documentNumberFull}</span> han sido entregados.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-10 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-gray-900/20 transition-all active:scale-95 hover:-translate-y-0.5"
                >
                    Cerrar Ventana
                </button>
            </Modal.Body>
        );
    }

    return (
        <Form.Root
            state={{
                locationId: locations[0]?.id || 0,
                items: initialQuantities
            }}
        >
            <Modal.Body className="space-y-8 pb-8 px-6">
                {/* Header Info Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white p-6 rounded-3xl border border-blue-100/60 shadow-sm flex items-start gap-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="p-3.5 bg-white rounded-2xl shadow-sm text-blue-600 ring-1 ring-blue-50">
                        <TruckIcon className="h-7 w-7" />
                    </div>
                    <div className="relative z-10 pt-0.5">
                        <p className="text-sm font-black text-blue-900 uppercase tracking-wide opacity-80 mb-0.5">Entregar Pedido</p>
                        <p className="text-lg font-bold text-gray-900">Orden {order.documentNumberFull}</p>
                        <p className="text-sm text-blue-700/70 font-medium mt-1">Seleccione bodega y confirmee las cantidades.</p>
                    </div>
                </div>

                {/* Warehouse Selector */}
                <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                        <MapPinIcon className="h-3.5 w-3.5 text-blue-500" /> Bodega de Salida
                    </label>
                    <div className="relative">
                        <Form.Select.Int
                            path="locationId"
                            required
                            className="w-full pl-5 pr-10 py-4 bg-white hover:bg-gray-50/80 focus:bg-white border-2 border-gray-100 focus:border-blue-500/30 rounded-2xl transition-all font-bold text-gray-700 outline-none appearance-none shadow-sm focus:shadow-md focus:shadow-blue-500/10 cursor-pointer"
                        >
                            <option value={0}>Seleccionar bodega...</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </Form.Select.Int>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <CubeIcon className="h-3.5 w-3.5" /> Productos Pendientes
                        </h4>
                        <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{initialQuantities.length} Items</span>
                    </div>

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 -mr-2 custom-scrollbar">
                        {initialQuantities.map((item, idx) => (
                            <div
                                key={item.orderItemId}
                                className="group p-4 bg-white border border-gray-100 rounded-3xl flex items-center gap-5 hover:border-blue-300/50 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400/50"
                            >
                                <div className="flex-1 min-w-0 py-1">
                                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-700 transition-colors">{item._name}</p>
                                    <div className="mt-2">
                                        <div className="flex items-end justify-between text-xs mb-1">
                                            <span className="text-gray-400 font-medium">Progreso de entrega</span>
                                            <span className="text-blue-600 font-bold">{item._delivered} <span className="text-gray-300">/</span> {item._total}</span>
                                        </div>
                                        <ProgressBar current={item._delivered} total={item._total} colorClass="bg-blue-500" />
                                    </div>
                                </div>
                                <div className="w-28 relative">
                                    <Form.Decimal
                                        path={["items", idx, "quantity"]}
                                        className="w-full px-4 py-3 bg-gray-50 group-hover:bg-blue-50 focus:bg-white border border-transparent focus:border-blue-200 rounded-xl text-right font-black text-lg text-gray-800 focus:text-blue-700 focus:ring-0 transition-all placeholder-gray-300"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-0 -mt-2 text-[10px] font-bold text-gray-300 pointer-events-none">CANT</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="bg-white border-t border-gray-100 px-6 py-5">
                <div className="flex items-center justify-end gap-3 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3.5 text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <Form.Submit
                        onSubmit={handleSubmit}
                        className="px-8 py-3.5 bg-gray-900 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-gray-900/20 hover:shadow-blue-500/30 active:scale-95 transition-all text-sm flex items-center gap-2"
                    >
                        <TruckIcon className="h-5 w-5" />
                        <span>Confirmar Entrega</span>
                    </Form.Submit>
                </div>
            </Modal.Footer>
        </Form.Root>
    );
}

function DeliveryModalWrapper(props: DeliveryModalProps & PortalInjectedProps) {
    const isCompleted = useMemo(() => {
        return props.order.items.every(item => toNum(item.deliveredQuantity) >= toNum(item.quantity));
    }, [props.order.items]);

    return (
        <PortalModal
            {...props}
            title={null} // Hide default title to use custom header
            size="md"
        >
            <DeliveryModalContent {...props} />
        </PortalModal>
    );
}

export const useDeliveryModal = createPortalHook(DeliveryModalWrapper);


// ----------------------------------------------------------------------
// INVOICING MODAL
// ----------------------------------------------------------------------

interface InvoicingModalProps {
    order: SalesOrderDetails;
    onConfirm: (data: InvoiceSalesOrderInput) => Promise<void>;
}

function InvoicingModalContent({ order, onConfirm, onClose }: InvoicingModalProps & { onClose?: () => void }) {
    const pendingItems = useMemo(() => {
        return order.items.filter(item => {
            const qty = toNum(item.quantity);
            const inv = toNum(item.invoicedQuantity);
            return qty > inv;
        });
    }, [order.items]);

    const initialQuantities = useMemo(() => {
        return pendingItems.map(item => ({
            orderItemId: item.id,
            quantity: toNum(item.quantity) - toNum(item.invoicedQuantity),
            _name: item.itemName,
            _total: toNum(item.quantity),
            _invoiced: toNum(item.invoicedQuantity)
        }));
    }, [pendingItems]);

    const handleSubmit = async (data: any) => {
        const items = (data.items || [])
            .filter((i: any) => i.quantity > 0)
            .map((i: any) => ({
                orderItemId: i.orderItemId,
                quantity: i.quantity
            }));

        if (items.length === 0) {
            throw new Error("Debe seleccionar al menos un ítem con cantidad mayor a cero");
        }

        await onConfirm({
            orderId: order.id,
            items
        });

        onClose?.();
    };

    // Success State
    if (pendingItems.length === 0) {
        return (
            <Modal.Body className="flex flex-col items-center justify-center py-12 px-4 space-y-8 min-h-[400px]">
                <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700 animate-pulse"></div>
                    <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40 transform group-hover:scale-105 transition-transform duration-500">
                        <CheckCircleIcon className="h-16 w-16 text-white stroke-[2]" />
                    </div>
                </div>
                <div className="text-center space-y-3 max-w-sm mx-auto">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">¡Facturación Completada!</h3>
                    <p className="text-gray-500 text-base leading-relaxed">
                        Todos los productos de la orden <span className="font-bold text-emerald-600 whitespace-nowrap">{order.documentNumberFull}</span> han sido facturados.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-10 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl shadow-gray-900/20 transition-all active:scale-95 hover:-translate-y-0.5"
                >
                    Cerrar
                </button>
            </Modal.Body>
        );
    }

    return (
        <Form.Root
            state={{
                items: initialQuantities
            }}
        >
            <Modal.Body className="space-y-8 pb-8 px-6">
                {/* Header Info Card */}
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-6 rounded-3xl border border-emerald-100/60 shadow-sm flex items-start gap-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="p-3.5 bg-white rounded-2xl shadow-sm text-emerald-600 ring-1 ring-emerald-50">
                        <DocumentTextIcon className="h-7 w-7" />
                    </div>
                    <div className="relative z-10 pt-0.5">
                        <p className="text-sm font-black text-emerald-900 uppercase tracking-wide opacity-80 mb-0.5">Generar Factura</p>
                        <p className="text-lg font-bold text-gray-900">Orden {order.documentNumberFull}</p>
                        <p className="text-sm text-emerald-700/70 font-medium mt-1">Seleccione las cantidades a facturar.</p>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <CubeIcon className="h-3.5 w-3.5" /> Productos Pendientes
                        </h4>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{initialQuantities.length} Items</span>
                    </div>

                    <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1 -mr-2 custom-scrollbar">
                        {initialQuantities.map((item, idx) => (
                            <div
                                key={item.orderItemId}
                                className="group p-4 bg-white border border-gray-100 rounded-3xl flex items-center gap-5 hover:border-emerald-300/50 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-400/50"
                            >
                                <div className="flex-1 min-w-0 py-1">
                                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">{item._name}</p>
                                    <div className="mt-2">
                                        <div className="flex items-end justify-between text-xs mb-1">
                                            <span className="text-gray-400 font-medium">Progreso de facturación</span>
                                            <span className="text-emerald-600 font-bold">{item._invoiced} <span className="text-gray-300">/</span> {item._total}</span>
                                        </div>
                                        <ProgressBar current={item._invoiced} total={item._total} colorClass="bg-emerald-500" />
                                    </div>
                                </div>
                                <div className="w-28 relative">
                                    <Form.Decimal
                                        path={["items", idx, "quantity"]}
                                        className="w-full px-4 py-3 bg-gray-50 group-hover:bg-emerald-50 focus:bg-white border border-transparent focus:border-emerald-200 rounded-xl text-right font-black text-lg text-gray-800 focus:text-emerald-700 focus:ring-0 transition-all placeholder-gray-300"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-3 top-0 -mt-2 text-[10px] font-bold text-gray-300 pointer-events-none">CANT</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="bg-white border-t border-gray-100 px-6 py-5">
                <div className="flex items-center justify-end gap-3 w-full">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3.5 text-sm font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <Form.Submit
                        onSubmit={handleSubmit}
                        className="px-8 py-3.5 bg-gray-900 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-gray-900/20 hover:shadow-emerald-500/30 active:scale-95 transition-all text-sm flex items-center gap-2"
                    >
                        <DocumentTextIcon className="h-5 w-5" />
                        <span>Generar Factura</span>
                    </Form.Submit>
                </div>
            </Modal.Footer>
        </Form.Root>
    );
}

function InvoicingModalWrapper(props: InvoicingModalProps & PortalInjectedProps) {
    const isCompleted = useMemo(() => {
        return props.order.items.every(item => toNum(item.invoicedQuantity) >= toNum(item.quantity));
    }, [props.order.items]);

    return (
        <PortalModal
            {...props}
            title={null} // Hide default title
            size="md"
        >
            <InvoicingModalContent {...props} />
        </PortalModal>
    );
}

export const useInvoicingModal = createPortalHook(InvoicingModalWrapper);


// ----------------------------------------------------------------------
// UTILS
// ----------------------------------------------------------------------

function toNum(val: any): number {
    if (val instanceof Decimal) return val.toNumber();
    if (typeof val === 'string') return parseFloat(val) || 0;
    return Number(val) || 0;
}
