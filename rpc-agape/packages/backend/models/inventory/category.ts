import { Sequelize, DataTypes } from "sequelize";
import { toModelName, IModel, IRecord } from "../../lib/models";

export const ModelName = toModelName(__filename);

export function define(seq: Sequelize) {
  const category = seq.define<IModel<ICategory>>(
    ModelName,
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
    },
    {
      //paranoid: true
    }
  );

  return category;
}

/**
 * Types
 */
export type IModelStatic = ReturnType<typeof define>;

export interface ICategory extends IRecord {
  fullName: string;
  isEnabled: boolean;
}
