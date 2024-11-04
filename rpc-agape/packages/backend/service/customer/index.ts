import db from "../../models";
import type { ICustomer } from "../../models/customer";

export async function createCustomer({ id, ...dto }: ICustomerCreate) {
  if (!id) {
    return db.customer.create(dto);
  }

  const current = await db.customer.findOne({ where: { id } });

  return current?.update(dto);
}

export async function getAllCustomers() {
  return {
    records: await db.customer.findAll({
      raw: true,
      order: [["updatedAt", "DESC"]],
    }),
  };
}

export async function deleteCustomer(id: number) {
  return db.customer.destroy({
    where: {
      id: id,
    },
  });
}

/**
 * Types
 */
export interface ICustomerCreate {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  isEnabled: boolean;
}

export interface IAllCustomer {
  records: ICustomer[];
}
