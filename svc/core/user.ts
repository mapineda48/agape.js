import { db } from "#lib/db";
import { company, type NewCompany } from "#models/core/company";
import { person, type NewPerson } from "#models/core/person";
import { user, type NewUser, type User } from "#models/core/user";
import { eq } from "drizzle-orm";

/**
 * Obtiene un usuario por su ID.
 *
 * @param id - Identificador único del usuario
 * @returns Usuario encontrado o undefined si no existe
 *
 * @example
 * ```ts
 * const user = await getUserById(1);
 * if (user) {
 *   console.log(user.documentNumber);
 * }
 * ```
 */
export async function getUserById(id: number) {
  const [record] = await db.select().from(user).where(eq(user.id, id));
  return record;
}

/**
 * Inserta o actualiza un usuario (persona o compañía).
 *
 * Si el payload incluye `id`, actualiza el usuario existente.
 * Si no incluye `id`, crea un nuevo usuario.
 *
 * El usuario debe ser de tipo persona (con `person`) o compañía (con `company`),
 * pero no puede tener ambos ni ninguno.
 *
 * @param payload - Datos del usuario a insertar o actualizar
 * @returns Usuario creado o actualizado con sus datos relacionados
 * @throws Error si no se proporciona ni `person` ni `company`
 *
 * @example
 * ```ts
 * // Crear usuario persona
 * const newPerson = await upsertUser({
 *   documentTypeId: 1,
 *   documentNumber: "123456",
 *   email: "john@example.com",
 *   person: {
 *     firstName: "John",
 *     lastName: "Doe"
 *   }
 * });
 *
 * // Actualizar usuario
 * const updated = await upsertUser({
 *   id: 1,
 *   documentTypeId: 1,
 *   documentNumber: "123456",
 *   email: "newemail@example.com",
 *   person: {
 *     firstName: "John",
 *     lastName: "Smith"
 *   }
 * });
 * ```
 */
export async function upsertUser(
  payload: IUserPerson
): Promise<IUserRecord & { person: IPerson; company?: never }>;
export async function upsertUser(
  payload: IUserCompany
): Promise<IUserRecord & { company: ICompany; person?: never }>;
export function upsertUser(payload: IUser): Promise<IUserRecord>;
export async function upsertUser(payload: IUser): Promise<IUserRecord> {
  const { id, person: personDto, company: companyDto, ...userDto } = payload;

  // Validar que no vengan ambos
  if (personDto && companyDto) {
    throw new Error(
      "User cannot be both a person and a company. Provide only 'person' or 'company', not both."
    );
  }

  // Validar que venga al menos uno
  if (!personDto && !companyDto) {
    throw new Error(
      "User must be either a person or a company. Please provide either 'person' or 'company' data."
    );
  }

  // Construir el tipo de usuario (kind)
  let kind: UserKind;

  if (personDto) {
    kind = { kind: "person", person: personDto };
  } else if (companyDto) {
    kind = { kind: "company", company: companyDto };
  } else {
    // No deberíamos llegar aquí, pero TS es feliz con este guard
    throw new Error(
      "Invariant violation: neither person nor company provided."
    );
  }

  // Determinar el tipo de usuario (P/C) basado en el kind
  const dto: NewUser = {
    ...userDto,
    type: kind.kind === "person" ? "P" : "C",
  };

  if (typeof id !== "number") {
    return insertUser(dto, kind);
  }

  return updateUser(id, dto, kind);
}

/**
 * Actualiza un usuario existente y sus datos relacionados (persona o compañía).
 *
 * @param id - ID del usuario a actualizar
 * @param userDto - Datos base del usuario (incluye type: "P" | "C")
 * @param kind - Tipo de usuario (persona o compañía) y sus datos específicos
 * @returns Usuario actualizado con sus datos relacionados
 */
async function updateUser(id: number, userDto: NewUser, kind: UserKind) {
  // Actualizar datos base del usuario
  const [record] = await db
    .update(user)
    .set(userDto)
    .where(eq(user.id, id))
    .returning();

  switch (kind.kind) {
    case "person": {
      const [personRecord] = await db
        .update(person)
        .set(kind.person)
        .where(eq(person.id, id))
        .returning({
          firstName: person.firstName,
          lastName: person.lastName,
          birthdate: person.birthdate,
        });

      return { ...record, person: personRecord };
    }

    case "company": {
      const [companyRecord] = await db
        .update(company)
        .set(kind.company)
        .where(eq(company.id, id))
        .returning({
          legalName: company.legalName,
          tradeName: company.tradeName,
        });

      return { ...record, company: companyRecord };
    }

    default: {
      // Exhaustividad a nivel de tipos
      throw new Error("Unsupported user kind in updateUser");
    }
  }
}

/**
 * Inserta un nuevo usuario y sus datos relacionados (persona o compañía).
 *
 * @param userDto - Datos base del usuario (incluye type: "P" | "C")
 * @param kind - Tipo de usuario (persona o compañía) y sus datos específicos
 * @returns Usuario creado con sus datos relacionados
 */
async function insertUser(userDto: NewUser, kind: UserKind) {
  // Insertar datos base del usuario
  const [record] = await db.insert(user).values(userDto).returning();

  switch (kind.kind) {
    case "person": {
      const [personRecord] = await db
        .insert(person)
        .values({ id: record.id, ...kind.person })
        .returning({
          firstName: person.firstName,
          lastName: person.lastName,
          birthdate: person.birthdate,
        });

      return { ...record, person: personRecord };
    }

    case "company": {
      const [companyRecord] = await db
        .insert(company)
        .values({ id: record.id, ...kind.company })
        .returning({
          legalName: company.legalName,
          tradeName: company.tradeName,
        });

      return { ...record, company: companyRecord };
    }

    default: {
      // Exhaustividad a nivel de tipos
      throw new Error("Unsupported user kind in insertUser");
    }
  }
}

/**
 * Datos de persona omitiendo el ID (se genera automáticamente).
 */
type IPerson = Omit<NewPerson, "id">;

/**
 * Datos de compañía omitiendo el ID (se genera automáticamente).
 */
type ICompany = Omit<NewCompany, "id">;

/**
 * Base de usuario sin el tipo "type" (P/C).
 */
type UserBase = Omit<NewUser, "type">;

/**
 * Interfaz para un usuario de tipo persona.
 * Garantiza que los datos de persona estén presentes
 * y que NO se pueda pasar company al mismo tiempo.
 */
export interface IUserPerson extends UserBase {
  person: IPerson;
  company?: never;
}

/**
 * Interfaz para un usuario de tipo compañía.
 * Garantiza que los datos de compañía estén presentes
 * y que NO se pueda pasar person al mismo tiempo.
 */
export interface IUserCompany extends UserBase {
  company: ICompany;
  person?: never;
}

/**
 * Interfaz general de entrada para crear o actualizar un usuario.
 * Debe incluir datos de persona O compañía (no ambos).
 */
export type IUser = IUserPerson | IUserCompany;

/**
 * Interfaz para un registro de usuario leído de la BD.
 * (usa `User` en vez de `NewUser`)
 */
export interface IUserRecord extends Omit<User, "type"> {}

/**
 * Tipo inferido del resultado de upsertUser.
 */
export type IUpsertUser = Awaited<ReturnType<typeof upsertUser>>;

/**
 * Union de tipos para representar un usuario con datos de persona o compañía.
 */
type UserKind =
  | { kind: "person"; person: IPerson }
  | { kind: "company"; company: ICompany };
