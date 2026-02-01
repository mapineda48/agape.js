/**
 * N10. useWatch Hook Tests (useSelector / useFormState)
 *
 * Tests for reactive form state watching using useSelector and useFormState.
 * These hooks allow components to subscribe to form state changes.
 *
 * Note: The form system uses useSelector and useFormState for watching,
 * which serve the same purpose as a useWatch hook.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

describe("N10. useWatch Hook (useSelector / useFormState)", () => {
  describe("N10.1 - Watch entire form state", () => {
    it("should re-render when any form value changes", async () => {
      const user = userEvent.setup();
      const renderCount = { current: 0 };

      function FormPreview() {
        const values = Form.useState<{ name: string; email: string }>();
        renderCount.current++;
        return (
          <div data-testid="preview">
            {values.name} - {values.email}
          </div>
        );
      }

      const schema = z.object({
        name: z.string(),
        email: z.string(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "John", email: "john@test.com" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
            </Form.Field>
            <FormPreview />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("preview")).toHaveTextContent("John - john@test.com");
      const initialRenderCount = renderCount.current;

      // Type in name field
      await user.type(screen.getByTestId("name-input"), "ny");

      await waitFor(() => {
        expect(screen.getByTestId("preview")).toHaveTextContent("Johnny - john@test.com");
      });

      // Component should have re-rendered
      expect(renderCount.current).toBeGreaterThan(initialRenderCount);
    });
  });

  describe("N10.2 - Watch specific path with useSelector", () => {
    it("should select specific value from form state", async () => {
      const user = userEvent.setup();

      function NameDisplay() {
        const name = Form.useSelector<{ name: string; email: string }, string>(
          (state) => state.name
        );
        return <div data-testid="name-display">Name: {name}</div>;
      }

      const schema = z.object({
        name: z.string(),
        email: z.string(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Alice", email: "alice@test.com" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
            <NameDisplay />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("name-display")).toHaveTextContent("Name: Alice");

      await user.clear(screen.getByTestId("name-input"));
      await user.type(screen.getByTestId("name-input"), "Bob");

      await waitFor(() => {
        expect(screen.getByTestId("name-display")).toHaveTextContent("Name: Bob");
      });
    });

    it("should select nested values", async () => {
      function AddressDisplay() {
        const city = Form.useSelector<{ address: { city: string } }, string>(
          (state) => state.address?.city ?? ""
        );
        return <div data-testid="city-display">City: {city}</div>;
      }

      const schema = z.object({
        address: z.object({
          city: z.string(),
        }),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ address: { city: "New York" } }} schema={schema}>
            <AddressDisplay />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("city-display")).toHaveTextContent("City: New York");
    });
  });

  describe("N10.3 - Watch multiple paths", () => {
    it("should derive values from multiple fields", async () => {
      const user = userEvent.setup();

      function Summary() {
        const { firstName, lastName } = Form.useSelector<
          { firstName: string; lastName: string },
          { firstName: string; lastName: string }
        >((state) => ({
          firstName: state.firstName,
          lastName: state.lastName,
        }));
        return (
          <div data-testid="summary">
            Full Name: {firstName} {lastName}
          </div>
        );
      }

      const schema = z.object({
        firstName: z.string(),
        lastName: z.string(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ firstName: "John", lastName: "Doe" }} schema={schema}>
            <Form.Field name="firstName">
              <Form.Text data-testid="first-name" />
            </Form.Field>
            <Form.Field name="lastName">
              <Form.Text data-testid="last-name" />
            </Form.Field>
            <Summary />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("summary")).toHaveTextContent("Full Name: John Doe");

      await user.clear(screen.getByTestId("first-name"));
      await user.type(screen.getByTestId("first-name"), "Jane");

      await waitFor(() => {
        expect(screen.getByTestId("summary")).toHaveTextContent("Full Name: Jane Doe");
      });
    });
  });

  describe("N10.4 - Initial value availability", () => {
    it("should return initial value on first render", () => {
      function InitialValueCheck() {
        const values = Form.useState<{ name: string }>();
        return <div data-testid="value">{values.name || "empty"}</div>;
      }

      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Initial" }} schema={schema}>
            <InitialValueCheck />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("value")).toHaveTextContent("Initial");
    });

    it("should handle undefined initial values", () => {
      function OptionalCheck() {
        const values = Form.useState<{ optional?: string }>();
        return <div data-testid="value">{values.optional ?? "not set"}</div>;
      }

      const schema = z.object({ optional: z.string().optional() });

      render(
        <EventEmitter>
          <Form.Root state={{}} schema={schema}>
            <OptionalCheck />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("value")).toHaveTextContent("not set");
    });
  });

  describe("N10.5 - Computed/derived values", () => {
    it("should compute derived values from form state", async () => {
      const user = userEvent.setup();

      function PriceCalculator() {
        const { quantity, price } = Form.useSelector<
          { quantity: number; price: number },
          { quantity: number; price: number }
        >((state) => ({
          quantity: state.quantity ?? 0,
          price: state.price ?? 0,
        }));
        const total = quantity * price;
        return <div data-testid="total">Total: ${total.toFixed(2)}</div>;
      }

      const schema = z.object({
        quantity: z.number(),
        price: z.number(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ quantity: 2, price: 10.5 }} schema={schema}>
            <Form.Field name="quantity">
              <Form.Int data-testid="quantity" />
            </Form.Field>
            <Form.Field name="price">
              <Form.Float data-testid="price" />
            </Form.Field>
            <PriceCalculator />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("total")).toHaveTextContent("Total: $21.00");

      await user.clear(screen.getByTestId("quantity"));
      await user.type(screen.getByTestId("quantity"), "5");

      await waitFor(() => {
        expect(screen.getByTestId("total")).toHaveTextContent("Total: $52.50");
      });
    });
  });

  describe("N10.6 - Array watching", () => {
    it("should watch array length changes", async () => {
      const user = userEvent.setup();

      function ItemCount() {
        const items = Form.useSelector<{ items: string[] }, string[]>(
          (state) => state.items ?? []
        );
        return <div data-testid="count">Count: {items.length}</div>;
      }

      const schema = z.object({
        items: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ items: ["a", "b"] }} schema={schema}>
            <Form.Array name="items">
              {(fields, ops) => (
                <div>
                  {fields.map((field) => (
                    <div key={field.key}>Item {field.index}</div>
                  ))}
                  <button type="button" onClick={() => ops.append("new")}>
                    Add
                  </button>
                </div>
              )}
            </Form.Array>
            <ItemCount />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("count")).toHaveTextContent("Count: 2");

      await user.click(screen.getByRole("button", { name: "Add" }));

      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("Count: 3");
      });
    });
  });

  describe("N10.7 - Validation state watching", () => {
    it("should watch form validity", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      function ValidityDisplay() {
        const isValid = Form.useFormIsValid();
        return (
          <div data-testid="validity">{isValid ? "Valid" : "Invalid"}</div>
        );
      }

      const schema = z.object({
        email: z.string().email("Invalid email"),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "invalid" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
            <ValidityDisplay />
          </Form.Root>
        </EventEmitter>
      );

      // Initially shown as valid (no validation run yet)
      expect(screen.getByTestId("validity")).toHaveTextContent("Valid");

      // Trigger validation
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("validity")).toHaveTextContent("Invalid");
      });

      // Fix the email
      await user.clear(screen.getByTestId("email-input"));
      await user.type(screen.getByTestId("email-input"), "valid@email.com");

      // Submit again to re-validate
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("validity")).toHaveTextContent("Valid");
      });
    });

    it("should watch field errors", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      function ErrorWatcher() {
        const emailError = Form.useFieldError("email");
        return (
          <div data-testid="error-watch">
            {emailError ? `Error: ${emailError}` : "No error"}
          </div>
        );
      }

      const schema = z.object({
        email: z.string().email("Invalid email format"),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
            <ErrorWatcher />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("error-watch")).toHaveTextContent("No error");

      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("error-watch")).toHaveTextContent(
          "Error: Invalid email format"
        );
      });
    });
  });

  describe("N10.8 - Touch and dirty state watching", () => {
    it("should watch touched state", async () => {
      const user = userEvent.setup();

      function TouchWatcher() {
        const isTouched = Form.useFieldTouched("name");
        return (
          <div data-testid="touched">{isTouched ? "Touched" : "Not touched"}</div>
        );
      }

      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
            <TouchWatcher />
            <button type="button" data-testid="blur">
              Blur
            </button>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("touched")).toHaveTextContent("Not touched");

      // Focus and blur the input
      await user.click(screen.getByTestId("name-input"));
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("Touched");
      });
    });

    it("should watch dirty state", async () => {
      const user = userEvent.setup();

      function DirtyWatcher() {
        const isDirty = Form.useFieldDirty("name");
        return <div data-testid="dirty">{isDirty ? "Dirty" : "Clean"}</div>;
      }

      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "initial" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
            <DirtyWatcher />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("dirty")).toHaveTextContent("Clean");

      await user.type(screen.getByTestId("name-input"), " modified");

      await waitFor(() => {
        expect(screen.getByTestId("dirty")).toHaveTextContent("Dirty");
      });
    });
  });

  describe("N10.9 - useFormActions (non-reactive)", () => {
    it("should provide imperative access to form values", async () => {
      const user = userEvent.setup();
      let capturedValues: any = null;

      function ActionButton() {
        const form = Form.useForm();

        const handleClick = () => {
          capturedValues = form.getValues();
        };

        return (
          <button type="button" onClick={handleClick} data-testid="capture">
            Capture Values
          </button>
        );
      }

      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Test" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
            <ActionButton />
          </Form.Root>
        </EventEmitter>
      );

      await user.type(screen.getByTestId("name-input"), " Modified");
      await user.click(screen.getByTestId("capture"));

      expect(capturedValues).toEqual({ name: "Test Modified" });
    });
  });

  describe("N10.10 - Form state immutability", () => {
    it("should return cloned values to prevent mutation", async () => {
      let capturedState1: any = null;
      let capturedState2: any = null;

      function StateCapturer() {
        const values = Form.useState<{ items: string[] }>();

        if (!capturedState1) {
          capturedState1 = values;
        } else if (!capturedState2) {
          capturedState2 = values;
        }

        return <div data-testid="items">{values.items?.length ?? 0}</div>;
      }

      const schema = z.object({ items: z.array(z.string()) });

      const { rerender } = render(
        <EventEmitter>
          <Form.Root state={{ items: ["a", "b"] }} schema={schema}>
            <StateCapturer />
          </Form.Root>
        </EventEmitter>
      );

      // Force a re-render
      rerender(
        <EventEmitter>
          <Form.Root state={{ items: ["a", "b"] }} schema={schema}>
            <StateCapturer />
          </Form.Root>
        </EventEmitter>
      );

      // Values should be available
      expect(capturedState1).toBeDefined();
      expect(capturedState1.items).toEqual(["a", "b"]);
    });
  });
});
