import { vi } from "vitest";

export const getUserById = vi.fn();
export const getUserByDocument = vi.fn();
export const upsertUser = vi.fn();

export interface IPerson {
  firstName: string;
  lastName: string;
  birthdate?: Date;
}

export interface ICompany {
  legalName: string;
  tradeName?: string;
}

export interface UserBase {
  id?: number;
  documentTypeId: number;
  documentNumber: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface IUserPerson extends UserBase {
  person: IPerson;
  company?: never;
}

export interface IUserCompany extends UserBase {
  company: ICompany;
  person?: never;
}

export type IUser = IUserPerson | IUserCompany;
