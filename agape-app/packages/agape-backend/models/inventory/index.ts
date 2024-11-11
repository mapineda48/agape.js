import { Sequelize } from "sequelize";
import * as category from "./category";
import * as subcategory from "./subcategory";
import * as product from "./product";

export function define(sequelize: Sequelize) {
  category.define(sequelize);
  subcategory.define(sequelize);
  product.define(sequelize);
}

/**
 * Types
 */
export interface IModelStatic {
  category: category.IModelStatic;
  subcategory: subcategory.IModelStatic;
  product: product.IModelStatic;
}
