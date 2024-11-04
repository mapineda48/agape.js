import { Sequelize, DataTypes } from "sequelize";
import { toModelName, IModel, IRecord } from "../../lib/models";

export const ModelName = toModelName(__filename);

export function define(seq: Sequelize) {
  const customers = seq.define<IModel<ICustomer>>(
    ModelName,
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: DataTypes.STRING(15),
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      // Optional settings
      //paranoid: true, // Enables soft delete
      //timestamps: true, // Automatically manage createdAt and updatedAt
    }
  );

  return customers;
}

/**
 * Types
 */
export type IModelStatic = ReturnType<typeof define>;

export interface ICustomer extends IRecord {
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  isEnabled: boolean;
}
