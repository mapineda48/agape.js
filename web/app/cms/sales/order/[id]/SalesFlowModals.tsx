import { useMemo } from "react";
import { Form } from "@/components/form";
import { createPortalHook, type PortalInjectedProps } from "@/components/util/portal";
import PortalModal, { Modal } from "@/components/ui/PortalModal";
import type { SalesOrderDetails } from "@utils/dto/crm/order";
import type { DeliverSalesOrderInput, InvoiceSalesOrderInput } from "@utils/dto/sales/flow";
import Decimal from "@utils/data/Decimal";
import { TruckIcon, DocumentTextIcon, MapPinIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface Location {
    id: number;
    name: string;
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

    // Si no hay ítems pendientes, mostrar mensaje de éxito
    if (pendingItems.length === 0) {
        return (
            <Modal.Body className="flex flex-col items-center justify-center py-16 space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-blue-400 blur-3xl opacity-20 animate-pulse"></div>
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                        <CheckCircleIcon className="h-16 w-16 text-white stroke-[2]" />
                    </div>
                </div>
                <div className="text-center space-y-3">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">¡Entregas Completadas!</h3>
                    <p className="text-gray-500 text-base max-w-xs leading-relaxed">
                        Todos los productos de la orden <span className="font-bold text-blue-600">{order.documentNumberFull}</span> han sido entregados exitosamente.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-12 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
                >
                    Entendido
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
            <Modal.Body className="space-y-8">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/30 p-5 rounded-3xl border border-blue-100/50 flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-blue-600">
                        <TruckIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-blue-900">Orden {order.documentNumberFull}</p>
                        <p className="text-xs text-blue-700/70 font-medium">Seleccione los productos y cantidades a entregar.</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
                        <MapPinIcon className="h-3.5 w-3.5 text-blue-500" /> Bodega de Salida
                    </label>
                    <Form.Select.Int
                        path="locationId"
                        required
                        className="w-full px-5 py-4 bg-gray-50 hover:bg-gray-100 focus:bg-white border-2 border-transparent focus:border-blue-500/20 rounded-2xl transition-all font-bold text-gray-700 outline-none"
                    >
                        <option value={0}>Seleccionar bodega...</option>
                        {locations.map(l => (
                            <option key={l.id} value={l.id}>{l.name}</option>
                        ))}
                    </Form.Select.Int>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Productos Pendientes</h4>
                    <div className="space-y-3">
                        {initialQuantities.map((item, idx) => (
                            <div key={item.orderItemId} className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center justify-between gap-6 hover:border-blue-200/50 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{item._name}</p>
                                    <p className="text-xs text-gray-400 mt-1 font-medium">
                                        Pendiente: <span className="text-blue-600 font-bold">{item._total - item._delivered}</span> de {item._total}
                                    </p>
                                </div>
                                <div className="w-28 relative">
                                    <Form.Decimal
                                        path={["items", idx, "quantity"]}
                                        className="w-full px-4 py-3 bg-blue-50 group-hover:bg-blue-100 border-none rounded-2xl text-right font-black text-blue-700 focus:ring-4 focus:ring-blue-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="bg-gray-50/50 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                    Cancelar
                </button>
                <Form.Submit
                    onSubmit={handleSubmit}
                    className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/25 active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                    Confirmar Entrega
                </Form.Submit>
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
            title={isCompleted ? "Entregas Completas" : "Registrar Entrega / Remisión"}
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

    // Si no hay ítems pendientes, mostrar mensaje de éxito
    if (pendingItems.length === 0) {
        return (
            <Modal.Body className="flex flex-col items-center justify-center py-16 space-y-8">
                <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 animate-pulse"></div>
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                        <CheckCircleIcon className="h-16 w-16 text-white stroke-[2]" />
                    </div>
                </div>
                <div className="text-center space-y-3">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight">¡Facturación Completada!</h3>
                    <p className="text-gray-500 text-base max-w-xs leading-relaxed">
                        Todos los productos de la orden <span className="font-bold text-emerald-600">{order.documentNumberFull}</span> han sido facturados exitosamente.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-12 py-4 bg-gray-900 hover:bg-black text-white font-bold rounded-2xl shadow-xl transition-all active:scale-95"
                >
                    Entendido
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
            <Modal.Body className="space-y-8">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/30 p-5 rounded-3xl border border-emerald-100/50 flex items-start gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                        <DocumentTextIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-emerald-900">Orden {order.documentNumberFull}</p>
                        <p className="text-xs text-emerald-700/70 font-medium">Seleccione los productos y cantidades a facturar.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Productos Pendientes</h4>
                    <div className="space-y-3">
                        {initialQuantities.map((item, idx) => (
                            <div key={item.orderItemId} className="p-5 bg-white border border-gray-100 rounded-3xl flex items-center justify-between gap-6 hover:border-emerald-200/50 transition-colors group">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{item._name}</p>
                                    <p className="text-xs text-gray-400 mt-1 font-medium">
                                        Pendiente: <span className="text-emerald-600 font-bold">{item._total - item._invoiced}</span> de {item._total}
                                    </p>
                                </div>
                                <div className="w-28 relative">
                                    <Form.Decimal
                                        path={["items", idx, "quantity"]}
                                        className="w-full px-4 py-3 bg-emerald-50 group-hover:bg-emerald-100 border-none rounded-2xl text-right font-black text-emerald-700 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="bg-gray-50/50 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                >
                    Cancelar
                </button>
                <Form.Submit
                    onSubmit={handleSubmit}
                    className="px-10 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/25 active:scale-95 transition-all text-sm uppercase tracking-wider"
                >
                    Generar Factura
                </Form.Submit>
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
            title={isCompleted ? "Facturación Completa" : "Generar Factura de Venta"}
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
