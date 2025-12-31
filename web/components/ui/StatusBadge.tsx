import clsx from "clsx";

export type StatusType =
    | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" // Sales Order
    | "draft" | "issued" | "partially_paid" | "paid" | "voided"      // Invoice
    | "active" | "inactive";                                         // Common

interface StatusBadgeProps {
    status: string;
    className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string; dotClass?: string }> = {
    // Sales Order
    pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800", dotClass: "bg-yellow-400" },
    confirmed: { label: "Confirmada", className: "bg-blue-100 text-blue-800", dotClass: "bg-blue-400" },
    shipped: { label: "Enviada", className: "bg-purple-100 text-purple-800", dotClass: "bg-purple-400" },
    delivered: { label: "Entregada", className: "bg-green-100 text-green-800", dotClass: "bg-green-400" },
    cancelled: { label: "Cancelada", className: "bg-gray-100 text-gray-800", dotClass: "bg-gray-400" },

    // Invoice
    draft: { label: "Borrador", className: "bg-gray-100 text-gray-800" },
    issued: { label: "Emitida", className: "bg-blue-100 text-blue-800" },
    partially_paid: { label: "Pago Parcial", className: "bg-yellow-100 text-yellow-800" },
    paid: { label: "Pagada", className: "bg-emerald-100 text-emerald-800" },
    voided: { label: "Anulada", className: "bg-red-100 text-red-800" },

    // Common
    active: { label: "Activo", className: "bg-green-100 text-green-800" },
    inactive: { label: "Inactivo", className: "bg-red-100 text-red-800" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status.toLowerCase()] || {
        label: status,
        className: "bg-gray-100 text-gray-800"
    };

    return (
        <span className={clsx(
            "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
            config.className,
            className
        )}>
            {config.dotClass && (
                <span className={clsx("h-2 w-2 rounded-full mr-2", config.dotClass)} />
            )}
            {config.label}
        </span>
    );
}
