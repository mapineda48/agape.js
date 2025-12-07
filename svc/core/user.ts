import { db } from "#lib/db";
import { company, type NewCompany } from "#models/core/company";
import { person, type NewPerson } from "#models/core/person";
import {
  user,
  type NewUser,
  type User,
  type UserType,
  USER_TYPE_VALUES,
} from "#models/core/user";
import { and, eq } from "drizzle-orm";

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
 * Busca un usuario por tipo y número de documento.
 * Incluye los datos relacionados (persona o compañía).
 */
export async function getUserByDocument(
  documentTypeId: number,
  documentNumber: string
) {
  const [record] = await db
    .select()
    .from(user)
    .leftJoin(person, eq(user.id, person.id))
    .leftJoin(company, eq(user.id, company.id))
    .where(
      and(
        eq(user.documentTypeId, documentTypeId),
        eq(user.documentNumber, documentNumber)
      )
    );

  if (!record) return null;

  const {
    user: userData,
    core_person: personData,
    core_company: companyData,
  } = record;

  return {
    ...userData,
    person: personData || undefined,
    company: companyData || undefined,
  };
}

/**
 * Inserta o actualiza un usuario (persona o compañía).
 *
 * Si el payload incluye `id`, actualiza el usuario existente.
 * Si no incluye `id`, crea un nuevo usuario.
 *
 * El tipo de usuario se infiere automáticamente de la propiedad presente en el payload:
 * - Si contiene `person`, el tipo será "person"
 * - Si contiene `company`, el tipo será "company"
 *
 * **Importante**: El cliente nunca debe enviar la propiedad `type`, esta se infiere
 * automáticamente de la propiedad de entidad presente en el payload.
 *
 * @param payload - Datos del usuario a insertar o actualizar
 * @returns Usuario creado o actualizado con sus datos relacionados
 * @throws Error si se proporcionan ambas propiedades (person y company)
 * @throws Error si no se proporciona ninguna propiedad de entidad
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
 * // Crear usuario compañía
 * const newCompany = await upsertUser({
 *   documentTypeId: 2,
 *   documentNumber: "900123",
 *   company: {
 *     legalName: "Acme Corp",
 *     tradeName: "Acme"
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

  // Inferir el tipo de usuario basado en las propiedades presentes
  const userType = inferUserType(personDto, companyDto);

  // Construir el DTO con el tipo inferido
  const dto: NewUser = {
    ...userDto,
    type: userType,
  };

  if (typeof id !== "number") {
    return insertUser(dto, userType, personDto, companyDto);
  }

  return updateUser(id, dto, userType, personDto, companyDto);
}

/**
 * Infiere el tipo de usuario basado en las propiedades de entidad presentes.
 *
 * @param personDto - Datos de persona (opcional)
 * @param companyDto - Datos de compañía (opcional)
 * @returns El tipo de usuario inferido ("person" | "company")
 * @throws Error si ambas propiedades están presentes
 * @throws Error si ninguna propiedad está presente
 */
function inferUserType(
  personDto: IPerson | undefined,
  companyDto: ICompany | undefined
): UserType {
  const hasPerson = personDto !== undefined && personDto !== null;
  const hasCompany = companyDto !== undefined && companyDto !== null;

  // Validar que no vengan ambos
  if (hasPerson && hasCompany) {
    throw new Error(
      "User cannot be both a person and a company. Provide only 'person' or 'company', not both."
    );
  }

  // Validar que venga al menos uno
  if (!hasPerson && !hasCompany) {
    throw new Error(
      "User must be either a person or a company. Please provide either 'person' or 'company' data."
    );
  }

  // Retornar el tipo inferido usando el enum
  return hasPerson ? "person" : "company";
}

/**
 * Actualiza un usuario existente y sus datos relacionados (persona o compañía).
 *
 * @param id - ID del usuario a actualizar
 * @param userDto - Datos base del usuario (incluye type)
 * @param userType - Tipo de usuario ("person" | "company")
 * @param personDto - Datos de persona (si aplica)
 * @param companyDto - Datos de compañía (si aplica)
 * @returns Usuario actualizado con sus datos relacionados
 */
async function updateUser(
  id: number,
  userDto: NewUser,
  userType: UserType,
  personDto: IPerson | undefined,
  companyDto: ICompany | undefined
) {
  // Actualizar datos base del usuario
  const [record] = await db
    .update(user)
    .set(userDto)
    .where(eq(user.id, id))
    .returning();

  switch (userType) {
    case "person": {
      const [personRecord] = await db
        .update(person)
        .set(personDto!)
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
        .set(companyDto!)
        .where(eq(company.id, id))
        .returning({
          legalName: company.legalName,
          tradeName: company.tradeName,
        });

      return { ...record, company: companyRecord };
    }

    default: {
      // Exhaustividad a nivel de tipos
      const _exhaustive: never = userType;
      throw new Error(`Unsupported user type: ${_exhaustive}`);
    }
  }
}

/**
 * Inserta un nuevo usuario y sus datos relacionados (persona o compañía).
 *
 * @param userDto - Datos base del usuario (incluye type)
 * @param userType - Tipo de usuario ("person" | "company")
 * @param personDto - Datos de persona (si aplica)
 * @param companyDto - Datos de compañía (si aplica)
 * @returns Usuario creado con sus datos relacionados
 */
async function insertUser(
  userDto: NewUser,
  userType: UserType,
  personDto: IPerson | undefined,
  companyDto: ICompany | undefined
) {
  // Insertar datos base del usuario
  const [record] = await db.insert(user).values(userDto).returning();

  switch (userType) {
    case "person": {
      const [personRecord] = await db
        .insert(person)
        .values({ ...personDto!, id: record.id })
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
        .values({ ...companyDto!, id: record.id })
        .returning({
          legalName: company.legalName,
          tradeName: company.tradeName,
        });

      return { ...record, company: companyRecord };
    }

    default: {
      // Exhaustividad a nivel de tipos
      const _exhaustive: never = userType;
      throw new Error(`Unsupported user type: ${_exhaustive}`);
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
 * Base de usuario sin el tipo "type" (se infiere automáticamente).
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
