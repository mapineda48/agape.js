import Decimal from "#utils/data/Decimal";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Nota: Es importante que no se realicen imports en el top de los servicios ya que estos dependen de la DB
 * que se inicializa en el beforeAll. Por lo tanto, se debe importar el servicio dentro de la prueba.
 */

beforeAll(async () => {
  const { default: initDatabase } = await import("#lib/db");
  const uuid = crypto.randomUUID();

  await initDatabase("postgresql://postgres:mypassword@localhost", {
    tenant: `vitest_product_${uuid}`,
    dev: false,
    skipSeeds: true,
  });
});

afterAll(async () => {
  const { deleteSchema } = await import("#lib/db/migrations/applyMigrations");
  const { db } = await import("#lib/db");
  const { default: config } = await import("#lib/db/config");

  await deleteSchema(config.schemaName, db.$client);
  await db.$client.end();
});

describe("product service", () => {
  // Helper para crear una categoría de prueba
  async function createTestCategory(
    categoryName: string,
    subcategoryName: string
  ) {
    const { upsertCategory } = await import("./category");
    return upsertCategory({
      fullName: categoryName,
      isEnabled: true,
      subcategories: [{ fullName: subcategoryName, isEnabled: true }],
    });
  }

  describe("getProductById", () => {
    it("should return a product by id", async () => {
      const { getProductById, upsertProduct } = await import("./product");

      const category = await createTestCategory(
        "Test Category",
        "Test Subcategory"
      );

      const created = await upsertProduct({
        fullName: "Laptop",
        isActive: true,
        price: new Decimal("999.99"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 4,
        slogan: "Best Laptop",
        images: [],
      });

      const result = await getProductById(created.id);

      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
      expect(result?.fullName).toBe("Laptop");
      expect(result?.isActive).toBe(true);
    });

    it("should return undefined for non existent ids", async () => {
      const { getProductById } = await import("./product");

      const result = await getProductById(999999);

      expect(result).toBeUndefined();
    });
  });

  describe("listProducts", () => {
    it("should return products with pagination", async () => {
      const { listProducts, upsertProduct } = await import("./product");

      const category = await createTestCategory(
        "Electronics",
        "Electronics Subcategory"
      );

      await upsertProduct({
        fullName: "Mouse",
        isActive: true,
        price: new Decimal("29.99"),
        slogan: "Best Mouse",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [],
      });

      await upsertProduct({
        fullName: "Keyboard",
        isActive: true,
        price: new Decimal("49.99"),
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 4,
        slogan: "Best Keyboard",
        images: [],
      });

      const result = await listProducts({ pageSize: 10 });

      expect(result.products).toBeInstanceOf(Array);
      expect(result.products.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter by fullName", async () => {
      const { listProducts } = await import("./product");

      const result = await listProducts({ fullName: "Mouse" });

      expect(result.products.every((p) => p.fullName.includes("Mouse"))).toBe(
        true
      );
    });

    it("should filter by isActive", async () => {
      const { listProducts, upsertProduct } = await import("./product");

      const category = await createTestCategory(
        "Inactive Category",
        "Inactive Subcategory"
      );

      await upsertProduct({
        fullName: "Inactive Product",
        isActive: false,
        price: new Decimal("10.00"),
        slogan: "Inactive Product",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
      });

      const result = await listProducts({ isActive: false });

      expect(result.products.some((p) => !p.isActive)).toBe(true);
    });

    it("should include totalCount when requested", async () => {
      const { listProducts } = await import("./product");

      const result = await listProducts({ includeTotalCount: true });

      expect(result.totalCount).toBeDefined();
      expect(typeof result.totalCount).toBe("number");
    });

    it("should not include totalCount by default", async () => {
      const { listProducts } = await import("./product");

      const result = await listProducts({});

      expect(result.totalCount).toBeUndefined();
    });

    it("should return products with category name", async () => {
      const { listProducts } = await import("./product");

      const result = await listProducts({});

      expect(result.products[0]).toHaveProperty("category");
      expect(typeof result.products[0].category).toBe("string");
    });
  });

  describe("upsertProduct", () => {
    it("should create a product when id is missing", async () => {
      const { upsertProduct } = await import("./product");

      const category = await createTestCategory(
        "New Products",
        "New Subcategory"
      );

      const created = await upsertProduct({
        fullName: "New Product",
        isActive: true,
        price: new Decimal("199.99"),
        slogan: "New Product",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [],
      });

      expect(created).toHaveProperty("id");
      expect(created.fullName).toBe("New Product");
      expect(created.isActive).toBe(true);
    });

    it("should update an existing product when id is provided", async () => {
      const { upsertProduct, getProductById } = await import("./product");

      const category = await createTestCategory(
        "Update Category",
        "Update Subcategory"
      );

      const created = await upsertProduct({
        fullName: "Original",
        isActive: true,
        price: new Decimal("100.00"),
        slogan: "Original",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 3,
        images: [],
      });

      const updated = await upsertProduct({
        id: created.id,
        fullName: "Updated",
        isActive: false,
        price: new Decimal("150.00"),
        slogan: "Updated",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 4,
        images: [],
      });

      expect(updated.id).toBe(created.id);
      expect(updated.fullName).toBe("Updated");
      expect(updated.isActive).toBe(false);

      const fromDb = await getProductById(created.id);
      expect(fromDb?.fullName).toBe("Updated");
    });

    it("should create product with string images", async () => {
      const { upsertProduct } = await import("./product");

      const category = await createTestCategory(
        "Images Category",
        "Images Subcategory"
      );

      const created = await upsertProduct({
        fullName: "Product with Images",
        isActive: true,
        price: new Decimal("299.99"),
        slogan: "Product with Images",
        categoryId: category.id,
        subcategoryId: category.subcategories[0].id ?? 0,
        rating: 5,
        images: [
          "https://example.com/image1.jpg",
          "https://example.com/image2.jpg",
        ],
      });

      expect(created.images).toBeInstanceOf(Array);
      expect((created.images as string[]).length).toBe(2);
    });
  });
});
