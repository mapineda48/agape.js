import { Sequelize, DataTypes } from "sequelize";
import { toModelName, IModel, IRecord } from "../../lib/models";
import { ModelName as Category } from "./category";

export const ModelName = toModelName(__filename);

export function define(seq: Sequelize) {
  const category = seq.models[Category];

  const subcategory = seq.define<IModel<ISubcategory>>(
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

      // foreignKey
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      //paranoid: true
    }
  );

  category.hasMany(subcategory, {
    foreignKey: "categoryId",
    as: "subcategories",
    onDelete: "RESTRICT", // Evitar la eliminación si hay subcategorías asociadas
  });

  subcategory.belongsTo(category, { foreignKey: "categoryId" });

  return subcategory;
}

/**
 * Types
 */
export type IModelStatic = ReturnType<typeof define>;

export interface ISubcategory extends IRecord {
  fullName: string;
  isEnabled: boolean;
  categoryId: number;
}
