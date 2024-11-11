import { Sequelize, DataTypes } from "sequelize";
import { toModelName, IModel, IRecord } from "../../lib/models";
import { ModelName as Category } from "./category";
import { ModelName as SubCategory } from "./subcategory";

export const ModelName = toModelName(__filename);

export function define(seq: Sequelize) {
  const category = seq.models[Category];
  const subcategory = seq.models[SubCategory];

  const product = seq.define<IModel<IProduct>>(
    ModelName,
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fullName: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      slogan: {
        type: DataTypes.STRING(80),
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING(500),
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      rating: {
        type: DataTypes.SMALLINT,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2), // 10 dígitos en total, 2 de ellos después del punto decimal
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: category, // Esto es el nombre de la tabla 'Categories'
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      subcategoryId: {
        type: DataTypes.INTEGER,
        references: {
          model: subcategory, // Esto es el nombre de la tabla 'SubCategories'
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      images: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
    },
    {
      //paranoid: true
    }
  );

  product.belongsTo(category, { foreignKey: "categoryId" });
  product.belongsTo(subcategory, { foreignKey: "subcategoryId" });

  return product;
}

/**
 * Types
 */
export type IModelStatic = ReturnType<typeof define>;

export interface IProduct extends IRecord {
  fullName: string;
  description: string;
  slogan: string;
  isEnabled: boolean;

  images: string[];
  rating: number;
  price: number;

  categoryId: number;
  subcategoryId: number;
}
