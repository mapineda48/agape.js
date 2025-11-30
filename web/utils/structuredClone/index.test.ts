import { describe, it, expect } from "vitest";
import {
  cloneWithHelpers,
  applyHelpersToSerialized,
  removeHelpersFromSerialized,
} from "./index";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";

describe("structuredClone utilities", () => {
  describe("Primitive Values", () => {
    it("should clone string values", () => {
      const value = "hello world";
      const cloned = cloneWithHelpers(value);
      expect(cloned).toBe(value);
    });

    it("should clone number values", () => {
      const value = 42;
      const cloned = cloneWithHelpers(value);
      expect(cloned).toBe(value);
    });

    it("should clone boolean values", () => {
      const value = true;
      const cloned = cloneWithHelpers(value);
      expect(cloned).toBe(value);
    });

    it("should clone null", () => {
      const value = null;
      const cloned = cloneWithHelpers(value);
      expect(cloned).toBe(value);
    });

    it("should clone undefined", () => {
      const value = undefined;
      const cloned = cloneWithHelpers(value);
      expect(cloned).toBe(value);
    });

    it("should handle special number values", () => {
      expect(cloneWithHelpers(NaN)).toBeNaN();
      expect(cloneWithHelpers(Infinity)).toBe(Infinity);
      expect(cloneWithHelpers(-Infinity)).toBe(-Infinity);
    });
  });

  describe("Arrays", () => {
    it("should clone simple arrays", () => {
      const original = [1, 2, 3, 4, 5];
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone nested arrays", () => {
      const original = [
        [1, 2],
        [3, 4],
        [5, 6],
      ];
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[0]).not.toBe(original[0]);
    });

    it("should clone arrays with mixed types", () => {
      const original = [1, "two", true, null, undefined];
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone empty arrays", () => {
      const original: any[] = [];
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone arrays with undefined values", () => {
      const original = [1, undefined, 3];
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone arrays containing Decimal instances", () => {
      const original = [new Decimal("10.5"), new Decimal("20.75")];
      const cloned = cloneWithHelpers(original);

      expect(cloned).toHaveLength(2);
      expect(cloned[0]).toBeInstanceOf(Decimal);
      expect(cloned[1]).toBeInstanceOf(Decimal);
      expect(cloned[0].toString()).toBe("10.5");
      expect(cloned[1].toString()).toBe("20.75");
      expect(cloned[0]).not.toBe(original[0]);
    });

    it("should clone arrays containing DateTime instances", () => {
      const date1 = new DateTime("2023-01-01T10:00:00Z");
      const date2 = new DateTime("2023-12-31T23:59:59Z");
      const original = [date1, date2];
      const cloned = cloneWithHelpers(original);

      expect(cloned).toHaveLength(2);
      expect(cloned[0]).toBeInstanceOf(DateTime);
      expect(cloned[1]).toBeInstanceOf(DateTime);
      expect(cloned[0].getTime()).toBe(date1.getTime());
      expect(cloned[1].getTime()).toBe(date2.getTime());
      expect(cloned[0]).not.toBe(original[0]);
    });
  });

  describe("Plain Objects", () => {
    it("should clone simple objects", () => {
      const original = { a: 1, b: 2, c: 3 };
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone nested objects", () => {
      const original = {
        user: {
          name: "John",
          address: {
            street: "123 Main St",
            city: "New York",
          },
        },
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.user).not.toBe(original.user);
      expect(cloned.user.address).not.toBe(original.user.address);
    });

    it("should clone empty objects", () => {
      const original = {};
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });

    it("should clone objects with null values", () => {
      const original = { a: null, b: "value" };
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
    });
  });

  describe("Decimal Support", () => {
    it("should clone Decimal instances", () => {
      const original = new Decimal("99.99");
      const cloned = cloneWithHelpers(original);

      expect(cloned).toBeInstanceOf(Decimal);
      expect(cloned.toString()).toBe("99.99");
      expect(cloned).not.toBe(original);
    });

    it("should clone objects containing Decimal values", () => {
      const original = {
        price: new Decimal("19.99"),
        discount: new Decimal("5"),
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned.price).toBeInstanceOf(Decimal);
      expect(cloned.discount).toBeInstanceOf(Decimal);
      expect(cloned.price.toString()).toBe("19.99");
      expect(cloned.discount.toString()).toBe("5");
      expect(cloned.price).not.toBe(original.price);
    });

    it("should clone nested structures with Decimal", () => {
      const original = {
        cart: {
          items: [
            { name: "Item 1", price: new Decimal("10.50") },
            { name: "Item 2", price: new Decimal("20.75") },
          ],
          total: new Decimal("31.25"),
        },
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned.cart.items[0].price).toBeInstanceOf(Decimal);
      expect(cloned.cart.items[1].price).toBeInstanceOf(Decimal);
      expect(cloned.cart.total).toBeInstanceOf(Decimal);
      expect(cloned.cart.items[0].price.toString()).toBe("10.5");
      expect(cloned.cart.total.toString()).toBe("31.25");
    });

    it("should preserve Decimal precision", () => {
      const original = new Decimal("123.456789");
      const cloned = cloneWithHelpers(original);

      expect(cloned.toString()).toBe(original.toString());
    });
  });

  describe("DateTime Support", () => {
    it("should clone DateTime instances", () => {
      const original = new DateTime("2023-10-27T10:30:00Z");
      const cloned = cloneWithHelpers(original);

      expect(cloned).toBeInstanceOf(DateTime);
      expect(cloned.getTime()).toBe(original.getTime());
      expect(cloned).not.toBe(original);
    });

    it("should clone objects containing DateTime values", () => {
      const original = {
        createdAt: new DateTime("2023-01-01T00:00:00Z"),
        updatedAt: new DateTime("2023-12-31T23:59:59Z"),
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned.createdAt).toBeInstanceOf(DateTime);
      expect(cloned.updatedAt).toBeInstanceOf(DateTime);
      expect(cloned.createdAt.getTime()).toBe(original.createdAt.getTime());
      expect(cloned.updatedAt.getTime()).toBe(original.updatedAt.getTime());
      expect(cloned.createdAt).not.toBe(original.createdAt);
    });

    it("should clone nested structures with DateTime", () => {
      const original = {
        event: {
          name: "Conference",
          schedule: [
            { session: "Opening", time: new DateTime("2023-10-27T09:00:00Z") },
            { session: "Closing", time: new DateTime("2023-10-27T17:00:00Z") },
          ],
        },
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned.event.schedule[0].time).toBeInstanceOf(DateTime);
      expect(cloned.event.schedule[1].time).toBeInstanceOf(DateTime);
      expect(cloned.event.schedule[0].time.getTime()).toBe(
        original.event.schedule[0].time.getTime()
      );
    });

    it("should preserve DateTime millisecond precision", () => {
      const original = new DateTime("2023-10-27T10:30:45.123Z");
      const cloned = cloneWithHelpers(original);

      expect(cloned.getTime()).toBe(original.getTime());
      expect(cloned.getMilliseconds()).toBe(original.getMilliseconds());
    });
  });

  describe("Mixed Custom Types", () => {
    it("should clone objects with both Decimal and DateTime", () => {
      const original = {
        amount: new Decimal("100.00"),
        timestamp: new DateTime("2023-10-27T10:00:00Z"),
        items: [
          {
            price: new Decimal("25.5"),
            addedAt: new DateTime("2023-10-27T09:00:00Z"),
          },
        ],
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned.amount).toBeInstanceOf(Decimal);
      expect(cloned.timestamp).toBeInstanceOf(DateTime);
      expect(cloned.items[0].price).toBeInstanceOf(Decimal);
      expect(cloned.items[0].addedAt).toBeInstanceOf(DateTime);
      expect(cloned.amount.toString()).toBe("100");
      expect(cloned.timestamp.getTime()).toBe(original.timestamp.getTime());
    });
  });

  describe("Purity and Immutability", () => {
    it("should not mutate the original object", () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = cloneWithHelpers(original);

      cloned.a = 999;
      cloned.b.c = 888;

      expect(original.a).toBe(1);
      expect(original.b.c).toBe(2);
    });

    it("should not mutate the original array", () => {
      const original = [1, 2, [3, 4]];
      const cloned = cloneWithHelpers(original);

      cloned[0] = 999;
      (cloned[2] as number[])[0] = 888;

      expect(original[0]).toBe(1);
      expect((original[2] as number[])[0]).toBe(3);
    });

    it("should not mutate original Decimal instances", () => {
      const originalDecimal = new Decimal("50");
      const original = { price: originalDecimal };
      const cloned = cloneWithHelpers(original);

      // Change the cloned value
      cloned.price = new Decimal("100.00");

      // Original should be unchanged
      expect(originalDecimal.toString()).toBe("50");
      expect(original.price.toString()).toBe("50");
    });

    it("should not mutate original DateTime instances", () => {
      const originalDate = new DateTime("2023-01-01T00:00:00Z");
      const original = { date: originalDate };
      const cloned = cloneWithHelpers(original);

      // Change the cloned value
      cloned.date = new DateTime("2024-01-01T00:00:00Z");

      // Original should be unchanged
      expect(original.date.getTime()).toBe(originalDate.getTime());
    });

    it("should create independent clones", () => {
      const original = {
        data: {
          values: [1, 2, 3],
        },
      };
      const cloned = cloneWithHelpers(original);

      cloned.data.values.push(4);

      expect(original.data.values).toHaveLength(3);
      expect(cloned.data.values).toHaveLength(4);
    });
  });

  describe("Helper Functions", () => {
    describe("applyHelpersToSerialized", () => {
      it("should transform Decimal to marker object", () => {
        const decimal = new Decimal("99.99");
        const result = applyHelpersToSerialized(decimal);

        expect(result).toEqual({ "__decimal.js__": "99.99" });
      });

      it("should transform DateTime to marker object", () => {
        const date = new DateTime("2023-10-27T10:00:00Z");
        const result = applyHelpersToSerialized(date);

        expect(result).toHaveProperty("__datetime.js__");
        expect(typeof (result as any)["__datetime.js__"]).toBe("string");
      });

      it("should return primitives unchanged", () => {
        expect(applyHelpersToSerialized(42)).toBe(42);
        expect(applyHelpersToSerialized("hello")).toBe("hello");
        expect(applyHelpersToSerialized(true)).toBe(true);
      });
    });

    describe("removeHelpersFromSerialized", () => {
      it("should restore Decimal from marker object", () => {
        const marker = { "__decimal.js__": "99.99" };
        const result = removeHelpersFromSerialized(marker);

        expect(result).toBeInstanceOf(Decimal);
        expect((result as Decimal).toString()).toBe("99.99");
      });

      it("should restore DateTime from marker object", () => {
        const isoString = new DateTime("2023-10-27T10:00:00Z").toJSON();
        const marker = { "__datetime.js__": isoString };
        const result = removeHelpersFromSerialized(marker);

        expect(result).toBeInstanceOf(DateTime);
      });

      it("should return primitives unchanged", () => {
        expect(removeHelpersFromSerialized(42)).toBe(42);
        expect(removeHelpersFromSerialized("hello")).toBe("hello");
        expect(removeHelpersFromSerialized(true)).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle deeply nested structures", () => {
      const original = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: new Decimal("42.42"),
                },
              },
            },
          },
        },
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned.level1.level2.level3.level4.level5.value).toBeInstanceOf(
        Decimal
      );
      expect(cloned.level1.level2.level3.level4.level5.value.toString()).toBe(
        "42.42"
      );
    });

    it("should handle complex mixed structures", () => {
      const original = {
        users: [
          {
            name: "Alice",
            balance: new Decimal("1000.50"),
            lastLogin: new DateTime("2023-10-27T10:00:00Z"),
          },
          {
            name: "Bob",
            balance: new Decimal("2500.75"),
            lastLogin: new DateTime("2023-10-26T15:30:00Z"),
          },
        ],
        metadata: {
          totalBalance: new Decimal("3501.25"),
          updatedAt: new DateTime("2023-10-27T12:00:00Z"),
        },
      };
      const cloned = cloneWithHelpers(original);

      expect(cloned.users[0].balance).toBeInstanceOf(Decimal);
      expect(cloned.users[0].lastLogin).toBeInstanceOf(DateTime);
      expect(cloned.metadata.totalBalance).toBeInstanceOf(Decimal);
      expect(cloned.metadata.updatedAt).toBeInstanceOf(DateTime);
      expect(cloned.users[0].balance.toString()).toBe("1000.5");
    });

    it("should handle objects with many properties", () => {
      const original: Record<string, number> = {};
      for (let i = 0; i < 100; i++) {
        original[`key${i}`] = i;
      }
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(Object.keys(cloned)).toHaveLength(100);
    });

    it("should handle arrays with many elements", () => {
      const original = Array.from({ length: 100 }, (_, i) => i);
      const cloned = cloneWithHelpers(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned).toHaveLength(100);
    });
  });
});
