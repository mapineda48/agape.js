/**
 * Interfaces para Snapshots (Desnormalización Controlada)
 *
 * Estos tipos se usan para preservar el estado histórico de datos
 * en el momento de la transacción. Es CRÍTICO para la integridad legal
 * de documentos como facturas y órdenes de venta/compra.
 */

/**
 * Snapshot de dirección para documentos transaccionales.
 *
 * Sin snapshots, si un cliente cambia de dirección después de emitida
 * una factura, el documento histórico mostraría la dirección nueva,
 * alterando la historia legal.
 *
 * @example
 * ```ts
 * const snapshot: AddressSnapshot = {
 *   street: "Calle 123 #45-67",
 *   city: "Bogotá",
 *   state: "Cundinamarca",
 *   zipCode: "110111",
 *   countryCode: "CO",
 *   label: "Oficina Principal"
 * };
 * ```
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
