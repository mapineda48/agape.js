import { db } from "#lib/db";
import { address, userAddress } from "#models/core/address";
import { and, eq, ne } from "drizzle-orm";
import type {
  IAddress,
  IUserAddress,
  IUpsertUserAddress,
  IUserAddressRecord,
  ListUserAddressesParams,
  AddressType,
} from "#utils/dto/core/address";

// ============================================================================
// Errores de Negocio
// ============================================================================

/**
 * Error cuando la dirección especificada no existe.
 */
export class AddressNotFoundError extends Error {
  constructor(addressId: number) {
    super(`La dirección con ID ${addressId} no existe.`);
    this.name = "AddressNotFoundError";
  }
}

/**
 * Error cuando la asociación usuario-dirección no existe.
 */
export class UserAddressNotFoundError extends Error {
  constructor(id: number) {
    super(`La asociación usuario-dirección con ID ${id} no existe.`);
    this.name = "UserAddressNotFoundError";
  }
}

// ============================================================================
// Funciones de Servicio
// ============================================================================

/**
 * Obtiene una dirección física por su ID.
 *
 * @param id - Identificador único de la dirección
 * @returns Dirección encontrada o undefined si no existe
 * @permission core.address.read
 */
export async function getAddressById(id: number) {
  const [record] = await db.select().from(address).where(eq(address.id, id));
  return record;
}

/**
 * Crea o actualiza una dirección física.
 *
 * @param payload - Datos de la dirección
 * @returns Dirección creada o actualizada
 * @permission core.address.manage
 */
export async function upsertAddress(payload: IAddress) {
  const { id, ...data } = payload;

  if (typeof id !== "number") {
    // Insertar nueva dirección
    const [record] = await db.insert(address).values(data).returning();
    return record;
  }

  // Actualizar dirección existente
  const [record] = await db
    .update(address)
    .set(data)
    .where(eq(address.id, id))
    .returning();

  if (!record) {
    throw new AddressNotFoundError(id);
  }

  return record;
}

/**
 * Lista las direcciones de un usuario.
 *
 * @param params - Parámetros de filtrado
 * @returns Lista de direcciones del usuario
 * @permission core.address.read
 */
export async function listUserAddresses(
  params: ListUserAddressesParams
): Promise<IUserAddressRecord[]> {
  const { userId, type, isActive } = params;

  const conditions = [eq(userAddress.userId, userId)];

  if (type !== undefined) {
    conditions.push(eq(userAddress.type, type));
  }

  const results = await db
    .select({
      id: userAddress.id,
      userId: userAddress.userId,
      type: userAddress.type,
      isDefault: userAddress.isDefault,
      label: userAddress.label,
      createdAt: userAddress.createdAt,
      address: {
        id: address.id,
        street: address.street,
        streetLine2: address.streetLine2,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        countryCode: address.countryCode,
        reference: address.reference,
        notes: address.notes,
        isActive: address.isActive,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
      },
    })
    .from(userAddress)
    .innerJoin(address, eq(userAddress.addressId, address.id))
    .where(and(...conditions));

  // Filtrar por isActive de la dirección si se especifica
  if (isActive !== undefined) {
    return results.filter((r) => r.address.isActive === isActive);
  }

  return results;
}

/**
 * Crea o actualiza una asociación usuario-dirección.
 *
 * **Lógica de "Single Default"**: Al marcar una dirección como principal (isDefault: true),
 * automáticamente desmarca las demás direcciones del mismo usuario y tipo.
 *
 * @param payload - Datos de la asociación
 * @returns Asociación creada o actualizada
 * @permission core.address.manage
 */
export async function upsertUserAddress(payload: IUserAddress) {
  const { id, ...data } = payload;

  return await db.transaction(async (tx) => {
    // Lógica de "Single Default":
    // Si isDefault = true, desmarcar las demás del mismo usuario y tipo
    if (data.isDefault) {
      const conditions = [
        eq(userAddress.userId, data.userId),
        eq(userAddress.type, data.type),
      ];

      // Si es update, excluir el registro actual
      if (typeof id === "number") {
        conditions.push(ne(userAddress.id, id));
      }

      await tx
        .update(userAddress)
        .set({ isDefault: false })
        .where(and(...conditions));
    }

    if (typeof id !== "number") {
      // Insertar nueva asociación
      const [record] = await tx
        .insert(userAddress)
        .values({ ...data, isDefault: data.isDefault ?? false })
        .returning();
      return record;
    }

    // Actualizar asociación existente
    const [record] = await tx
      .update(userAddress)
      .set(data)
      .where(eq(userAddress.id, id))
      .returning();

    if (!record) {
      throw new UserAddressNotFoundError(id);
    }

    return record;
  });
}

/**
 * Crea dirección física + asociación en una sola operación transaccional.
 * Simplifica la creación de direcciones desde el frontend.
 *
 * @param payload - Datos de la dirección y asociación
 * @returns Asociación creada con la dirección
 * @permission core.address.manage
 */
export async function createUserAddressWithAddress(
  payload: IUpsertUserAddress
): Promise<IUserAddressRecord> {
  const { userId, type, isDefault, label, address: addressData } = payload;

  return await db.transaction(async (tx) => {
    // 1. Crear la dirección física
    const [newAddress] = await tx
      .insert(address)
      .values(addressData)
      .returning();

    // 2. Lógica de "Single Default"
    if (isDefault) {
      await tx
        .update(userAddress)
        .set({ isDefault: false })
        .where(and(eq(userAddress.userId, userId), eq(userAddress.type, type)));
    }

    // 3. Crear la asociación
    const [newUserAddress] = await tx
      .insert(userAddress)
      .values({
        userId,
        addressId: newAddress.id,
        type,
        isDefault: isDefault ?? false,
        label,
      })
      .returning();

    // 4. Retornar el resultado completo
    return {
      id: newUserAddress.id,
      userId: newUserAddress.userId,
      type: newUserAddress.type as AddressType,
      isDefault: newUserAddress.isDefault,
      label: newUserAddress.label,
      createdAt: newUserAddress.createdAt,
      address: newAddress,
    };
  });
}

/**
 * Elimina una asociación usuario-dirección.
 * Opcionalmente también elimina la dirección física.
 *
 * @param id - ID de la asociación
 * @param deleteAddress - Si es true, también elimina la dirección física
 * @permission core.address.manage
 */
export async function deleteUserAddress(
  id: number,
  deleteAddress = false
): Promise<void> {
  await db.transaction(async (tx) => {
    // Obtener la asociación para conocer el addressId
    const [association] = await tx
      .select({ addressId: userAddress.addressId })
      .from(userAddress)
      .where(eq(userAddress.id, id));

    if (!association) {
      throw new UserAddressNotFoundError(id);
    }

    // Eliminar la asociación
    await tx.delete(userAddress).where(eq(userAddress.id, id));

    // Opcionalmente eliminar la dirección física
    if (deleteAddress) {
      await tx.delete(address).where(eq(address.id, association.addressId));
    }
  });
}

// Re-exportar DTOs compartidos con frontend
export type {
  IAddress,
  IUserAddress,
  IUpsertUserAddress,
  IUserAddressRecord,
  ListUserAddressesParams,
  AddressType,
} from "#utils/dto/core/address";

export { ADDRESS_TYPE_VALUES } from "#utils/dto/core/address";
