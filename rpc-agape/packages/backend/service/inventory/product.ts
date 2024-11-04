import db from "../../models";
import { IProduct } from "../../models/inventory/product";
import Storage from "../../lib/storage";
//import { randomRating } from "../../lib/demo/initInventory";

export async function createProduct({ images, id, ...dto }: NewProduct) {
  const folder = id ? id.toString() : "0/" + Date.now().toString();

  const imagesTasks = images.map(async (image) => {
    if (typeof image === "string") {
      return image;
    }

    return await Storage.uploadFile(image, `product/${folder}/${image.name}`);
  });

  const newProduct = {
    ...dto,
    isEnabled: true,
    images: await Promise.all(imagesTasks),
  };

  if (!id) {
    return db.inventory.product.create({
      ...newProduct,
      rating: 0,
      slogan: "Producto sin slogan",
    });
  }

  const current = await db.inventory.product.findOne({ where: { id } });

  return current?.update(newProduct);
}

export async function getCategories() {
  const categories: unknown = await db.inventory.category.findAll({
    attributes: [["fullName", "name"], "id"],
    include: {
      attributes: [["fullName", "name"], "id"],
      model: db.inventory.subcategory,
      as: "subcategories",
    },
  });

  return categories as Category[];
}

export async function getAllProducts() {
  return {
    products: await db.inventory.product.findAll({
      raw: true,
      order: [["updatedAt", "DESC"]],
    }),
  };
}

export function deleteProduct(id: number) {
  return db.inventory.product.destroy({
    where: {
      id,
    },
  });
}

/**
 * Types
 */

export interface NewProduct extends Omit<IProduct, "images" | "rating"> {
  images: (File | string)[];
}

export interface Category {
  name: string;
  id: number;
  subcategories: Subcategory[];
}

export interface Subcategory {
  name: string;
  id: number;
}

export interface AllProduct {
  products: IProduct[];
}
