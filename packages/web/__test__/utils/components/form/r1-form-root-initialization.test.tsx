/**
 * R1. Form.Root - Inicialización
 *
 * Tests de regresión para la inicialización del componente Form.Root.
 * Basado en TEST_PLAN.md sección R1.
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "#web/utils/components/form";
import * as Input from "#web/utils/components/form/Input";
import Checkbox from "#web/utils/components/form/CheckBox";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";
import Decimal from "@mapineda48/agape-rpc/data/Decimal";

describe("R1. Form.Root - Inicialización", () => {
  /**
   * R1.1 Render sin estado inicial
   * Form se monta correctamente con estado vacío {}
   */
  describe("R1.1 Render sin estado inicial", () => {
    it("should mount correctly with empty state {}", () => {
      render(
        <Form.Root>
          <div data-testid="child">Child</div>
        </Form.Root>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
    });

    it("should allow inputs without initial state", () => {
      render(
        <Form.Root>
          <Input.Text path="name" data-testid="name-input" />
        </Form.Root>
      );

      const input = screen.getByTestId("name-input") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      // Sin estado inicial, el valor debe ser vacío o el defaultValue del input
      expect(input.value).toBe("");
    });
  });

  /**
   * R1.2 Render con estado inicial
   * El estado inicial se propaga a todos los inputs hijos
   */
  describe("R1.2 Render con estado inicial", () => {
    it("should propagate initial state to child inputs", () => {
      render(
        <Form.Root state={{ name: "John", email: "john@example.com" }}>
          <Input.Text path="name" data-testid="name-input" />
          <Input.Text path="email" data-testid="email-input" />
        </Form.Root>
      );

      const nameInput = screen.getByTestId("name-input") as HTMLInputElement;
      const emailInput = screen.getByTestId("email-input") as HTMLInputElement;

      expect(nameInput.value).toBe("John");
      expect(emailInput.value).toBe("john@example.com");
    });

    it("should propagate number values correctly", () => {
      render(
        <Form.Root state={{ age: 25, score: 100 }}>
          <Input.Int path="age" data-testid="age-input" />
          <Input.Int path="score" data-testid="score-input" />
        </Form.Root>
      );

      const ageInput = screen.getByTestId("age-input") as HTMLInputElement;
      const scoreInput = screen.getByTestId("score-input") as HTMLInputElement;

      expect(ageInput.value).toBe("25");
      expect(scoreInput.value).toBe("100");
    });

    it("should propagate boolean values correctly", () => {
      render(
        <Form.Root state={{ active: true, premium: false }}>
          <Checkbox path="active" data-testid="active-checkbox" />
          <Checkbox path="premium" data-testid="premium-checkbox" />
        </Form.Root>
      );

      const activeCheckbox = screen.getByTestId(
        "active-checkbox"
      ) as HTMLInputElement;
      const premiumCheckbox = screen.getByTestId(
        "premium-checkbox"
      ) as HTMLInputElement;

      expect(activeCheckbox.checked).toBe(true);
      expect(premiumCheckbox.checked).toBe(false);
    });
  });

  /**
   * R1.3 Estado inicial con objetos anidados
   * Los campos anidados reciben sus valores correctos
   */
  describe("R1.3 Estado inicial con objetos anidados", () => {
    it("should propagate nested object values using dot notation path", () => {
      render(
        <Form.Root
          state={{
            user: {
              profile: {
                firstName: "Alice",
                lastName: "Smith",
              },
            },
          }}
        >
          <Input.Text path="user.profile.firstName" data-testid="first-name" />
          <Input.Text path="user.profile.lastName" data-testid="last-name" />
        </Form.Root>
      );

      const firstName = screen.getByTestId("first-name") as HTMLInputElement;
      const lastName = screen.getByTestId("last-name") as HTMLInputElement;

      expect(firstName.value).toBe("Alice");
      expect(lastName.value).toBe("Smith");
    });

    it("should propagate nested values using Form.Scope", () => {
      render(
        <Form.Root
          state={{
            user: {
              profile: {
                name: "Bob",
                age: 30,
              },
            },
          }}
        >
          <Form.Scope path="user">
            <Form.Scope path="profile">
              <Input.Text path="name" data-testid="name" />
              <Input.Int path="age" data-testid="age" />
            </Form.Scope>
          </Form.Scope>
        </Form.Root>
      );

      const name = screen.getByTestId("name") as HTMLInputElement;
      const age = screen.getByTestId("age") as HTMLInputElement;

      expect(name.value).toBe("Bob");
      expect(age.value).toBe("30");
    });

    it("should handle deeply nested objects (4+ levels)", () => {
      render(
        <Form.Root
          state={{
            company: {
              department: {
                team: {
                  member: {
                    name: "Deep Nested",
                  },
                },
              },
            },
          }}
        >
          <Input.Text
            path="company.department.team.member.name"
            data-testid="deep-input"
          />
        </Form.Root>
      );

      const input = screen.getByTestId("deep-input") as HTMLInputElement;
      expect(input.value).toBe("Deep Nested");
    });
  });

  /**
   * R1.4 Estado inicial con arrays
   * Los arrays se inicializan correctamente
   */
  describe("R1.4 Estado inicial con arrays", () => {
    it("should initialize array values with index paths", () => {
      render(
        <Form.Root state={{ items: ["first", "second", "third"] }}>
          <Input.Text path="items.0" data-testid="item-0" />
          <Input.Text path="items.1" data-testid="item-1" />
          <Input.Text path="items.2" data-testid="item-2" />
        </Form.Root>
      );

      expect(
        (screen.getByTestId("item-0") as HTMLInputElement).value
      ).toBe("first");
      expect(
        (screen.getByTestId("item-1") as HTMLInputElement).value
      ).toBe("second");
      expect(
        (screen.getByTestId("item-2") as HTMLInputElement).value
      ).toBe("third");
    });

    it("should initialize array of objects", () => {
      render(
        <Form.Root
          state={{
            users: [
              { name: "Alice", age: 25 },
              { name: "Bob", age: 30 },
            ],
          }}
        >
          <Input.Text path="users.0.name" data-testid="user-0-name" />
          <Input.Int path="users.0.age" data-testid="user-0-age" />
          <Input.Text path="users.1.name" data-testid="user-1-name" />
          <Input.Int path="users.1.age" data-testid="user-1-age" />
        </Form.Root>
      );

      expect(
        (screen.getByTestId("user-0-name") as HTMLInputElement).value
      ).toBe("Alice");
      expect(
        (screen.getByTestId("user-0-age") as HTMLInputElement).value
      ).toBe("25");
      expect(
        (screen.getByTestId("user-1-name") as HTMLInputElement).value
      ).toBe("Bob");
      expect(
        (screen.getByTestId("user-1-age") as HTMLInputElement).value
      ).toBe("30");
    });

    it("should handle empty arrays", () => {
      render(
        <Form.Root state={{ items: [] }}>
          <div data-testid="container">Empty array form</div>
        </Form.Root>
      );

      expect(screen.getByTestId("container")).toBeInTheDocument();
    });
  });

  /**
   * R1.5 Estado inicial con tipos especiales
   * Decimal, DateTime, File se inicializan correctamente
   */
  describe("R1.5 Estado inicial con tipos especiales", () => {
    it("should initialize Decimal values correctly", () => {
      const decimalValue = new Decimal("123.456");

      render(
        <Form.Root state={{ price: decimalValue }}>
          <Input.Decimal path="price" data-testid="price-input" />
        </Form.Root>
      );

      const input = screen.getByTestId("price-input") as HTMLInputElement;
      expect(input.value).toBe("123.456");
    });

    it("should initialize Float values correctly", () => {
      render(
        <Form.Root state={{ temperature: 36.6 }}>
          <Input.Float path="temperature" data-testid="temp-input" />
        </Form.Root>
      );

      const input = screen.getByTestId("temp-input") as HTMLInputElement;
      expect(input.value).toBe("36.6");
    });

    it("should initialize DateTime values correctly", () => {
      // Use a fixed date for testing
      const testDate = new Date("2024-06-15T10:30:00");

      render(
        <Form.Root state={{ appointmentDate: testDate }}>
          <Input.DateTime path="appointmentDate" data-testid="date-input" />
        </Form.Root>
      );

      const input = screen.getByTestId("date-input") as HTMLInputElement;
      // datetime-local format: YYYY-MM-DDTHH:MM
      expect(input.value).toContain("2024-06-15");
    });
  });

  /**
   * R1.6 Múltiples Form.Root en misma página
   * Cada formulario tiene estado independiente (aislamiento)
   */
  describe("R1.6 Múltiples Form.Root en misma página", () => {
    it("should isolate state between multiple Form.Root instances", async () => {
      const user = userEvent.setup();

      render(
        <div>
          <Form.Root state={{ name: "Form 1" }}>
            <Input.Text path="name" data-testid="form1-input" />
          </Form.Root>
          <Form.Root state={{ name: "Form 2" }}>
            <Input.Text path="name" data-testid="form2-input" />
          </Form.Root>
        </div>
      );

      const form1Input = screen.getByTestId("form1-input") as HTMLInputElement;
      const form2Input = screen.getByTestId("form2-input") as HTMLInputElement;

      expect(form1Input.value).toBe("Form 1");
      expect(form2Input.value).toBe("Form 2");

      // Update form 1 should not affect form 2
      await user.clear(form1Input);
      await user.type(form1Input, "Updated Form 1");

      expect(form1Input.value).toBe("Updated Form 1");
      expect(form2Input.value).toBe("Form 2"); // Should remain unchanged
    });

    it("should allow independent submissions", async () => {
      const user = userEvent.setup();
      const onSubmit1 = vi.fn().mockResolvedValue(undefined);
      const onSubmit2 = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root state={{ value: "A" }}>
            <Input.Text path="value" data-testid="input1" />
            <Submit onSubmit={onSubmit1} data-testid="submit1">
              Submit 1
            </Submit>
          </Form.Root>
          <Form.Root state={{ value: "B" }}>
            <Input.Text path="value" data-testid="input2" />
            <Submit onSubmit={onSubmit2} data-testid="submit2">
              Submit 2
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("submit1"));
      await waitFor(() => {
        expect(onSubmit1).toHaveBeenCalledWith({ value: "A" });
      });
      expect(onSubmit2).not.toHaveBeenCalled();

      await user.click(screen.getByTestId("submit2"));
      await waitFor(() => {
        expect(onSubmit2).toHaveBeenCalledWith({ value: "B" });
      });
    });
  });

  /**
   * R1.7 Form.Root sin children
   * No arroja error, renderiza fragmento vacío
   */
  describe("R1.7 Form.Root sin children", () => {
    it("should render without children and not throw error", () => {
      expect(() => {
        render(<Form.Root state={{}} />);
      }).not.toThrow();
    });

    it("should render with undefined children", () => {
      expect(() => {
        render(<Form.Root state={{}}>{undefined}</Form.Root>);
      }).not.toThrow();
    });

    it("should render with null children", () => {
      expect(() => {
        render(<Form.Root state={{}}>{null}</Form.Root>);
      }).not.toThrow();
    });

    it("should render with empty fragment", () => {
      expect(() => {
        render(
          <Form.Root state={{}}>
            <></>
          </Form.Root>
        );
      }).not.toThrow();
    });
  });
});
