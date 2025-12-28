/**
 * Componente PDF de Factura de Venta
 * 
 * Este componente renderiza una factura de venta en formato PDF
 * utilizando @react-pdf/renderer. El diseño es profesional y moderno
 * con soporte para datos de empresa, cliente e items detallados.
 */

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
} from "@react-pdf/renderer";
import type { SalesInvoicePdfData } from "@utils/dto/finance/sales_invoice";
import Decimal from "@utils/data/Decimal";

// Colores del tema (verde/esmeralda para ventas)
const colors = {
    primary: "#059669",      // Emerald-600
    primaryLight: "#A7F3D0", // Emerald-200
    primaryDark: "#047857",  // Emerald-700
    dark: "#1F2937",         // Gray-800
    gray: "#6B7280",         // Gray-500
    lightGray: "#F3F4F6",    // Gray-100
    border: "#E5E7EB",       // Gray-200
    white: "#FFFFFF",
    accent: "#10B981",       // Emerald-500
};

// Estilos del PDF
const styles = StyleSheet.create({
    page: {
        fontFamily: "Helvetica",
        fontSize: 10,
        paddingTop: 30,
        paddingLeft: 40,
        paddingRight: 40,
        paddingBottom: 60,
        backgroundColor: colors.white,
    },
    // Header
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 3,
        borderBottomColor: colors.primary,
    },
    headerLeft: {
        flexDirection: "column",
        maxWidth: "60%",
    },
    companyName: {
        fontSize: 24,
        fontWeight: "bold",
        color: colors.primary,
        marginBottom: 6,
    },
    companyDetails: {
        fontSize: 9,
        color: colors.gray,
        lineHeight: 1.5,
    },
    headerRight: {
        flexDirection: "column",
        alignItems: "flex-end",
    },
    invoiceTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: colors.dark,
        marginBottom: 4,
    },
    invoiceNumber: {
        fontSize: 14,
        fontWeight: "bold",
        color: colors.primary,
        marginBottom: 8,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
        backgroundColor: colors.primaryLight,
    },
    statusText: {
        fontSize: 8,
        fontWeight: "bold",
        color: colors.primaryDark,
        textTransform: "uppercase",
    },
    // Info Cards
    infoSection: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 25,
        gap: 20,
    },
    infoCard: {
        flex: 1,
        backgroundColor: colors.lightGray,
        borderRadius: 8,
        padding: 15,
    },
    infoCardTitle: {
        fontSize: 8,
        fontWeight: "bold",
        color: colors.primary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    infoCardContent: {
        fontSize: 10,
        color: colors.dark,
        lineHeight: 1.6,
    },
    infoCardLabel: {
        fontSize: 8,
        color: colors.gray,
        marginTop: 4,
    },
    infoCardValue: {
        fontSize: 10,
        color: colors.dark,
        fontWeight: "bold",
    },
    // Table
    table: {
        marginTop: 10,
        marginBottom: 20,
    },
    tableHeader: {
        flexDirection: "row",
        backgroundColor: colors.primary,
        color: colors.white,
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    tableHeaderCell: {
        color: colors.white,
        fontSize: 8,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tableRowAlt: {
        backgroundColor: colors.lightGray,
    },
    tableCell: {
        fontSize: 9,
        color: colors.dark,
    },
    tableCellSmall: {
        fontSize: 8,
        color: colors.gray,
    },
    // Column widths
    colLine: { width: "6%" },
    colCode: { width: "10%" },
    colDescription: { width: "34%" },
    colQuantity: { width: "8%", textAlign: "center" as const },
    colUnitPrice: { width: "14%", textAlign: "right" as const },
    colDiscount: { width: "10%", textAlign: "right" as const },
    colTax: { width: "8%", textAlign: "right" as const },
    colTotal: { width: "10%", textAlign: "right" as const },
    // Totals
    totalsSection: {
        flexDirection: "row",
        justifyContent: "flex-end",
        marginTop: 20,
    },
    totalsBox: {
        width: "45%",
        backgroundColor: colors.lightGray,
        borderRadius: 8,
        padding: 15,
        borderWidth: 2,
        borderColor: colors.primary,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 5,
    },
    totalLabel: {
        fontSize: 10,
        color: colors.gray,
    },
    totalValue: {
        fontSize: 10,
        color: colors.dark,
    },
    totalRowMain: {
        borderTopWidth: 2,
        borderTopColor: colors.primaryLight,
        marginTop: 8,
        paddingTop: 10,
    },
    totalLabelMain: {
        fontSize: 14,
        fontWeight: "bold",
        color: colors.dark,
    },
    totalValueMain: {
        fontSize: 16,
        fontWeight: "bold",
        color: colors.primary,
    },
    // Notes
    notesSection: {
        marginTop: 20,
        padding: 15,
        backgroundColor: colors.lightGray,
        borderRadius: 8,
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: "bold",
        color: colors.primary,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 8,
    },
    notesContent: {
        fontSize: 9,
        color: colors.dark,
        lineHeight: 1.5,
    },
    // Footer
    footer: {
        position: "absolute",
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 15,
    },
    footerText: {
        fontSize: 8,
        color: colors.gray,
    },
    footerThankYou: {
        fontSize: 10,
        color: colors.primary,
        fontWeight: "bold",
        marginBottom: 5,
    },
    // Watermark
    watermark: {
        position: "absolute",
        top: "40%",
        left: "20%",
        fontSize: 60,
        color: colors.primaryLight,
        opacity: 0.2,
        transform: "rotate(-30deg)",
    },
});

interface SalesInvoicePdfProps {
    data: SalesInvoicePdfData;
}

/**
 * Formatea un valor Decimal a string con formato de moneda
 */
function formatCurrency(value: Decimal | number | string, currency: string): string {
    const num = value instanceof Decimal ? value.toNumber() : Number(value);

    // Mapeo de símbolos de moneda
    const currencySymbols: Record<string, string> = {
        COP: "$",
        USD: "US$",
        EUR: "€",
        MXN: "MX$",
    };

    const symbol = currencySymbols[currency] || currency + " ";
    return `${symbol}${num.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formatea una fecha ISO a formato legible
 */
function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

/**
 * Obtiene el texto del estado de la factura
 */
function getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
        draft: "Borrador",
        issued: "Emitida",
        partially_paid: "Pago Parcial",
        paid: "Pagada",
        cancelled: "Anulada",
    };
    return statusLabels[status] || status;
}

/**
 * Componente principal del documento PDF
 */
export default function SalesInvoicePdf({ data }: SalesInvoicePdfProps) {
    const { company, client, items, currency } = data;

    return (
        <Document
            title={`Factura de Venta ${data.documentNumberFull}`}
            author={company.name}
            subject="Factura de Venta"
            creator="Agape ERP"
        >
            <Page size="A4" style={styles.page}>
                {/* Watermark */}
                <Text style={styles.watermark}>FACTURA</Text>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.companyName}>{company.name}</Text>
                        <Text style={styles.companyDetails}>
                            {company.nit && `NIT: ${company.nit}\n`}
                            {company.address && `${company.address}\n`}
                            {company.phone && `Tel: ${company.phone}`}
                            {company.email && ` | ${company.email}`}
                        </Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.invoiceTitle}>FACTURA DE VENTA</Text>
                        <Text style={styles.invoiceNumber}>{data.documentNumberFull}</Text>
                        <View style={styles.statusBadge}>
                            <Text style={styles.statusText}>{getStatusLabel(data.status)}</Text>
                        </View>
                    </View>
                </View>

                {/* Info Cards */}
                <View style={styles.infoSection}>
                    {/* Client Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoCardTitle}>Cliente</Text>
                        <Text style={styles.infoCardContent}>{client.name}</Text>
                        {client.documentType && client.documentNumber && (
                            <>
                                <Text style={styles.infoCardLabel}>{client.documentType}</Text>
                                <Text style={styles.infoCardValue}>{client.documentNumber}</Text>
                            </>
                        )}
                    </View>

                    {/* Dates Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoCardTitle}>Fechas</Text>
                        <Text style={styles.infoCardLabel}>Fecha de Emisión</Text>
                        <Text style={styles.infoCardValue}>{formatDate(data.issueDate)}</Text>
                        <Text style={styles.infoCardLabel}>Fecha de Vencimiento</Text>
                        <Text style={styles.infoCardValue}>{formatDate(data.dueDate)}</Text>
                    </View>

                    {/* Currency Card */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoCardTitle}>Moneda</Text>
                        <Text style={styles.infoCardContent}>{currency}</Text>
                        <Text style={styles.infoCardLabel}>Items</Text>
                        <Text style={styles.infoCardValue}>{items.length} líneas</Text>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    {/* Table Header */}
                    <View style={styles.tableHeader}>
                        <Text style={[styles.tableHeaderCell, styles.colLine]}>#</Text>
                        <Text style={[styles.tableHeaderCell, styles.colCode]}>Código</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDescription]}>Descripción</Text>
                        <Text style={[styles.tableHeaderCell, styles.colQuantity]}>Cant.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colUnitPrice]}>P. Unit.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colDiscount]}>Desc.</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTax]}>IVA</Text>
                        <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
                    </View>

                    {/* Table Rows */}
                    {items.map((item, index) => (
                        <View
                            key={item.id}
                            style={[
                                styles.tableRow,
                                index % 2 === 1 ? styles.tableRowAlt : {}
                            ]}
                        >
                            <Text style={[styles.tableCell, styles.colLine]}>
                                {item.lineNumber}
                            </Text>
                            <Text style={[styles.tableCell, styles.colCode]}>
                                {item.itemCode}
                            </Text>
                            <View style={styles.colDescription}>
                                <Text style={styles.tableCell}>{item.itemName}</Text>
                                {item.description && (
                                    <Text style={styles.tableCellSmall}>{item.description}</Text>
                                )}
                            </View>
                            <Text style={[styles.tableCell, styles.colQuantity]}>
                                {item.quantity instanceof Decimal ? item.quantity.toNumber() : item.quantity}
                            </Text>
                            <Text style={[styles.tableCell, styles.colUnitPrice]}>
                                {formatCurrency(item.unitPrice, currency)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colDiscount]}>
                                {formatCurrency(item.discountAmount, currency)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTax]}>
                                {formatCurrency(item.taxAmount, currency)}
                            </Text>
                            <Text style={[styles.tableCell, styles.colTotal]}>
                                {formatCurrency(item.total, currency)}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalsSection}>
                    <View style={styles.totalsBox}>
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Subtotal</Text>
                            <Text style={styles.totalValue}>
                                {formatCurrency(data.subtotal, currency)}
                            </Text>
                        </View>
                        {Number(data.globalDiscountAmount instanceof Decimal ? data.globalDiscountAmount.toNumber() : data.globalDiscountAmount) > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Descuento Global ({Number(data.globalDiscountPercent instanceof Decimal ? data.globalDiscountPercent.toNumber() : data.globalDiscountPercent)}%)</Text>
                                <Text style={styles.totalValue}>
                                    -{formatCurrency(data.globalDiscountAmount, currency)}
                                </Text>
                            </View>
                        )}
                        {Number(data.taxAmount instanceof Decimal ? data.taxAmount.toNumber() : data.taxAmount) > 0 && (
                            <View style={styles.totalRow}>
                                <Text style={styles.totalLabel}>Impuestos</Text>
                                <Text style={styles.totalValue}>
                                    {formatCurrency(data.taxAmount, currency)}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.totalRow, styles.totalRowMain]}>
                            <Text style={styles.totalLabelMain}>TOTAL</Text>
                            <Text style={styles.totalValueMain}>
                                {formatCurrency(data.totalAmount, currency)}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Notes */}
                {data.notes && (
                    <View style={styles.notesSection}>
                        <Text style={styles.notesTitle}>Notas</Text>
                        <Text style={styles.notesContent}>{data.notes}</Text>
                    </View>
                )}

                {/* Footer */}
                <View style={styles.footer} fixed>
                    <Text style={styles.footerThankYou}>¡Gracias por su preferencia!</Text>
                    <Text style={styles.footerText}>
                        Este documento es un comprobante generado electrónicamente por {company.name}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}
