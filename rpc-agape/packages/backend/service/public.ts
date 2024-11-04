import db from "../models";
import { Category } from "./inventory/product";

export function getHomeShopProducts() {
  const carouselProducts = [
    {
      title: "Set de Escritura Profesional",
      subtitle: "Calidad y precisión para profesionales",
      content:
        "Este set incluye bolígrafos de gel, lápices mecánicos de alta precisión y marcadores permanentes. Ideal para diseñadores, arquitectos y cualquier profesional que valore la calidad y la durabilidad en sus herramientas de escritura.",
      image: "./assets/img/banner_img_02.jpg",
    },
    {
      title: "Cuadernos Ecológicos",
      subtitle: "Cuida el medio ambiente mientras escribes",
      content:
        "Nuestros cuadernos están hechos con papel reciclado y cubiertas de materiales sostenibles. Disponibles en varios tamaños y diseños, son perfectos para estudiantes y profesionales conscientes del impacto ambiental.",
      image: "./assets/img/banner_img_01.jpg",
    },
    {
      title: "Organizadores de Escritorio",
      subtitle: "Mantén tu espacio de trabajo ordenado",
      content:
        "Explora nuestra variedad de organizadores de escritorio, desde bandejas para documentos hasta estuches para bolígrafos y accesorios. Diseñados para maximizar la eficiencia y mantener un entorno de trabajo ordenado y elegante.",
      image: "./assets/img/banner_img_03.jpg",
    },
  ];

  const categoriesTheMonth = [
    {
      image: "./assets/img/category_img_01.jpg",
      fullName: "Lapicero",
    },
    {
      image: "./assets/img/category_img_02.jpg",
      fullName: "Shoes",
    },
    {
      image: "./assets/img/category_img_03.jpg",
      fullName: "Accessories",
    },
  ];

  const feacturedProducts = [
    {
      image: "./assets/img/feature_prod_01.jpg",
      price: 240.0,
      rating: 3,
      productName: "Gym Weight",
      description:
        "Lorem ipsum dolor sit amet, consectetur adipisicing elit. Sunt in culpa qui officia deserunt.",
      reviews: 24,
    },
    {
      image: "./assets/img/feature_prod_02.jpg",
      price: 480.0,
      rating: 3,
      productName: "Cloud Nike Shoes",
      description:
        "Aenean gravida dignissim finibus. Nullam ipsum diam, posuere vitae pharetra sed, commodo ullamcorper.",
      reviews: 48,
    },
    {
      image: "./assets/img/feature_prod_03.jpg",
      price: 360.0,
      rating: 5,
      productName: "Summer Addides Shoes",
      description:
        "Curabitur ac mi sit amet diam luctus porta. Phasellus pulvinar sagittis diam, et scelerisque ipsum lobortis nec.",
      reviews: 74,
    },
  ];

  const props = { carouselProducts, categoriesTheMonth, feacturedProducts };

  return new Promise<IPropsHome>((res) => res(props));
}

function doFoo(value: any) {

}

export async function getCategories() {
  //const foo = this as any;

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

export type { Category };

/**
 * Types
 */
export interface ICarouselProduct {
  title: string;
  subtitle: string;
  content: string;
  image: string;
}

export interface ICategorieTheMonth {
  image: string;
  fullName: string;
}

export interface IFeacturedProduct {
  image: string;
  price: number;
  rating: number;
  productName: string;
  description: string;
  reviews: number;
}

export interface IPropsHome {
  carouselProducts: ICarouselProduct[];
  categoriesTheMonth: ICategorieTheMonth[];
  feacturedProducts: IFeacturedProduct[];
}
