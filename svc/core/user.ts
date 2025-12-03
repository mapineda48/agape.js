import { db } from "#lib/db";
import { company, type NewCompany } from "#models/core/company";
import { person, type NewPerson } from "#models/core/person";
import { user, type NewUser } from "#models/core/user";
import { eq } from "drizzle-orm";

export async function getUserById(id: number) {
  const [record] = await db.select().from(user).where(eq(user.id, id));
  return record;
}

export async function upsertUser(payload: IUser) {
  const { id, person: personDto, company: companyDto, ...userDto } = payload;

  if (!personDto && !companyDto) {
    throw new Error("missing type user");
  }

  const dto = { ...userDto, type: personDto ? "P" : "C" };

  if (typeof id !== "number") {
    return insertUser(dto, personDto, companyDto);
  } 

  return updateUser(id, dto, personDto, companyDto);
}

async function updateUser(
  id: number,
  userDto: NewUser,
  personDto?: IPerson,
  companyDto?: ICompany
) {
  const [record] = await db
    .update(user)
    .set(userDto)
    .where(eq(user.id, id))
    .returning();

  if (personDto) {
    const [personRecord] = await db.update(person).set(personDto).where(eq(person.id, id)).returning();

    return { ...record, person: personRecord };
  }

  if (companyDto) {
    const [companyRecord] = await db
      .update(company)
      .set(companyDto)
      .where(eq(company.id, id))
      .returning();

     return { ...record, company: companyRecord }; 
  }

  return record;
}

async function insertUser(
  userDto: NewUser,
  personDto?: IPerson,
  companyDto?: ICompany
) {
  const [record] = await db.insert(user).values(userDto).returning();

  if (personDto) {
    const [personRecord] = await db
      .insert(person)
      .values({ id: record.id, ...personDto })
      .returning();

    return { ...record, person: personRecord };
  }

  if (companyDto) {
    const [companyRecord] = await db
      .insert(company)
      .values({ id: record.id, ...companyDto })
      .returning();

    return { ...record, company: companyRecord };
  }

  return record;
}

type IPerson = Omit<NewPerson, "id">;
type ICompany = Omit<NewCompany, "id">;

export interface IUser extends Omit<NewUser, "type"> {
  person?: IPerson;
  company?: ICompany;
}

export interface IUserPerson extends Omit<NewUser, "type">{
  person: IPerson;
}

export interface IUserCompany extends Omit<NewUser, "type">{
  company: ICompany;
}


export type IUpsertUser = Awaited<ReturnType<typeof upsertUser>>;

