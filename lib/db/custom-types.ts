import { customType } from "drizzle-orm/pg-core";
import Decimal from "../../shared/data/Decimal";
import DateTime from "../../shared/data/DateTime";

// ============================================================================
// Interfaces para Snapshots (Desnormalización Controlada)
// ============================================================================

/**
 * Snapshot de dirección para documentos transaccionales.
 *
 * Este tipo se usa para preservar el estado histórico de una dirección
 * en el momento de la transacción. Es CRÍTICO para la integridad legal
 * de documentos como facturas y órdenes de venta/compra.
 *
 * Sin snapshots, si un cliente cambia de dirección después de emitida
 * una factura, el documento histórico mostraría la dirección nueva,
 * alterando la historia legal.
 *
 */
export interface AddressSnapshot {
  /** Línea principal de la dirección */
  street: string;
  /** Línea adicional (apartamento, suite, etc.) */
  streetLine2?: string;
  /** Ciudad */
  city: string;
  /** Estado, departamento o provincia */
  state?: string;
  /** Código postal */
  zipCode?: string;
  /** Código ISO 3166-1 alpha-2 del país */
  countryCode: string;
  /** Referencia o punto de referencia */
  reference?: string;
  /** Etiqueta identificadora (ej: "Oficina Principal") */
  label?: string;
}

export const decimal = customType<{ data: Decimal; driverData: string }>({
  dataType() {
    return "numeric(10, 2)";
  },
  toDriver(value: Decimal): string {
    return value.toString();
  },
  fromDriver(value: string): Decimal {
    return new Decimal(value);
  },
});

export const dateTime = customType<{ data: DateTime; driverData: string }>({
  dataType() {
    return "timestamp with time zone";
  },
  toDriver(value: DateTime): string {
    return value.toISOString();
  },
  fromDriver(value: string): DateTime {
    return new DateTime(value);
  },
});
