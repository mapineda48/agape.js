/**
 * Tipo de cliente (entidad de solo lectura para dropdowns).
 */
export interface ClientType {
  id: number;
  name: string;
  isEnabled: boolean;
}

/**
 * Payload para crear/actualizar tipos de cliente.
 */
export interface NewClientType {
  id?: number;
  name: string;
  isEnabled: boolean;
}
