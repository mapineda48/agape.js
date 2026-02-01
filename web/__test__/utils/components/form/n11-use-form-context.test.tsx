/**
 * N11. useFormContext Hook Tests
 *
 * Tests for form context access using useForm, useFieldContext, and related hooks.
 * These hooks provide access to form state and actions from any component
 * within the Form.Root hierarchy.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

describe("N11. useFormContext Hook", () => {
  describe("N11.1 - Access form with useForm hook", () => {
    it("should provide getValues method", async () => {
      const user = userEvent.setup();
      let capturedValues: any = null;

      function FormReader() {
        const form = Form.useForm();

        const handleClick = () => {
          capturedValues = form.getValues();
        };

        return (
          <button type="button" onClick={handleClick} data-testid="read">
            Read Values
          </button>
        );
      }

      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "John", age: 25 }} schema={schema}>
            <FormReader />
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("read"));

      expect(capturedValues).toEqual({ name: "John", age: 25 });
    });

    it("should provide reset method", async () => {
      const user = userEvent.setup();

      function ResetButton() {
        const form = Form.useForm();

        return (
          <button
            type="button"
            onClick={() => form.reset({ name: "Reset Name", email: "reset@test.com" })}
            data-testid="reset"
          >
            Reset
          </button>
        );
      }

      function ValueDisplay() {
        const values = Form.useState<{ name: string; email: string }>();
        return <div data-testid="display">{values.name} - {values.email}</div>;
      }

      const schema = z.object({
        name: z.string(),
        email: z.string(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Original", email: "original@test.com" }} schema={schema}>
            <ResetButton />
            <ValueDisplay />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("display")).toHaveTextContent("Original - original@test.com");

      await user.click(screen.getByTestId("reset"));

      await waitFor(() => {
        expect(screen.getByTestId("display")).toHaveTextContent("Reset Name - reset@test.com");
      });
    });

    it("should provide merge method", async () => {
      const user = userEvent.setup();

      function MergeButton() {
        const form = Form.useForm();

        return (
          <button
            type="button"
            onClick={() => form.merge({ name: "Merged Name" })}
            data-testid="merge"
          >
            Merge
          </button>
        );
      }

      function ValueDisplay() {
        const values = Form.useState<{ name: string; email: string }>();
        return <div data-testid="display">{values.name} - {values.email}</div>;
      }

      const schema = z.object({
        name: z.string(),
        email: z.string(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Original", email: "keep@test.com" }} schema={schema}>
            <MergeButton />
            <ValueDisplay />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("display")).toHaveTextContent("Original - keep@test.com");

      await user.click(screen.getByTestId("merge"));

      await waitFor(() => {
        // Name should change, email should be preserved
        expect(screen.getByTestId("display")).toHaveTextContent("Merged Name - keep@test.com");
      });
    });

    it("should provide setAt method", async () => {
      const user = userEvent.setup();

      function SetAtButton() {
        const form = Form.useForm();

        return (
          <button
            type="button"
            onClick={() => form.setAt(["user", "name"], "New Name")}
            data-testid="set-at"
          >
            Set At
          </button>
        );
      }

      function ValueDisplay() {
        const values = Form.useState<{ user: { name: string } }>();
        return <div data-testid="display">{values.user?.name}</div>;
      }

      const schema = z.object({
        user: z.object({ name: z.string() }),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ user: { name: "Old Name" } }} schema={schema}>
            <SetAtButton />
            <ValueDisplay />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("display")).toHaveTextContent("Old Name");

      await user.click(screen.getByTestId("set-at"));

      await waitFor(() => {
        expect(screen.getByTestId("display")).toHaveTextContent("New Name");
      });
    });
  });

  describe("N11.2 - Typed access based on schema", () => {
    it("should work with typed getValues", async () => {
      const user = userEvent.setup();
      let typedValues: { email: string; count: number } | null = null;

      function TypedReader() {
        const form = Form.useForm();

        const handleClick = () => {
          typedValues = form.getValues<{ email: string; count: number }>();
        };

        return (
          <button type="button" onClick={handleClick} data-testid="read">
            Read
          </button>
        );
      }

      const schema = z.object({
        email: z.string().email(),
        count: z.number(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "test@example.com", count: 42 }} schema={schema}>
            <TypedReader />
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("read"));

      expect(typedValues).not.toBeNull();
      expect(typedValues!.email).toBe("test@example.com");
      expect(typedValues!.count).toBe(42);
    });
  });

  describe("N11.3 - useFieldContext hook", () => {
    it("should provide field context within Form.Field", () => {
      function FieldContextDisplay() {
        const context = Form.useFieldContext();
        return (
          <div>
            <span data-testid="field-name">{context.name}</span>
            <span data-testid="field-input-id">{context.inputId}</span>
            <span data-testid="field-error-id">{context.errorId}</span>
          </div>
        );
      }

      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <FieldContextDisplay />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("field-name")).toHaveTextContent("email");
      expect(screen.getByTestId("field-input-id")).toBeTruthy();
      expect(screen.getByTestId("field-error-id")).toBeTruthy();
    });

    it("should provide required state from Field", () => {
      function RequiredDisplay() {
        const context = Form.useFieldContext();
        return (
          <span data-testid="required">
            {context.required ? "Required" : "Optional"}
          </span>
        );
      }

      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email" required>
              <RequiredDisplay />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("required")).toHaveTextContent("Required");
    });

    it("should provide disabled state from Field", () => {
      function DisabledDisplay() {
        const context = Form.useFieldContext();
        return (
          <span data-testid="disabled">
            {context.disabled ? "Disabled" : "Enabled"}
          </span>
        );
      }

      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email" disabled>
              <DisabledDisplay />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("disabled")).toHaveTextContent("Disabled");
    });
  });

  describe("N11.4 - useFieldContextOptional hook", () => {
    it("should return context inside Form.Field", () => {
      function SafeContextDisplay() {
        const context = Form.useFieldContextOptional();
        return (
          <span data-testid="has-context">
            {context ? "Has context" : "No context"}
          </span>
        );
      }

      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <SafeContextDisplay />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("has-context")).toHaveTextContent("Has context");
    });

    it("should return null outside Form.Field", () => {
      function SafeContextDisplay() {
        const context = Form.useFieldContextOptional();
        return (
          <span data-testid="has-context">
            {context ? "Has context" : "No context"}
          </span>
        );
      }

      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <SafeContextDisplay />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("has-context")).toHaveTextContent("No context");
    });
  });

  describe("N11.5 - Nested context access", () => {
    it("should access form context from deeply nested components", async () => {
      const user = userEvent.setup();
      let deepValues: any = null;

      function DeepComponent() {
        const form = Form.useForm();
        return (
          <button
            type="button"
            onClick={() => {
              deepValues = form.getValues();
            }}
            data-testid="deep-read"
          >
            Deep Read
          </button>
        );
      }

      function Level3() {
        return <DeepComponent />;
      }

      function Level2() {
        return <Level3 />;
      }

      function Level1() {
        return <Level2 />;
      }

      const schema = z.object({ data: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ data: "deep value" }} schema={schema}>
            <Level1 />
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("deep-read"));

      expect(deepValues).toEqual({ data: "deep value" });
    });
  });

  describe("N11.6 - Multiple form isolation", () => {
    it("should isolate context between multiple Form.Root instances", async () => {
      const user = userEvent.setup();
      let values1: any = null;
      let values2: any = null;

      function FormReader({ id }: { id: number }) {
        const form = Form.useForm();
        return (
          <button
            type="button"
            onClick={() => {
              if (id === 1) values1 = form.getValues();
              else values2 = form.getValues();
            }}
            data-testid={`read-${id}`}
          >
            Read {id}
          </button>
        );
      }

      const schema = z.object({ value: z.string() });

      render(
        <div>
          <EventEmitter>
            <Form.Root state={{ value: "Form 1 Value" }} schema={schema}>
              <FormReader id={1} />
            </Form.Root>
          </EventEmitter>
          <EventEmitter>
            <Form.Root state={{ value: "Form 2 Value" }} schema={schema}>
              <FormReader id={2} />
            </Form.Root>
          </EventEmitter>
        </div>
      );

      await user.click(screen.getByTestId("read-1"));
      await user.click(screen.getByTestId("read-2"));

      expect(values1).toEqual({ value: "Form 1 Value" });
      expect(values2).toEqual({ value: "Form 2 Value" });
    });
  });

  describe("N11.7 - Validation actions access", () => {
    it("should provide setError action", async () => {
      const user = userEvent.setup();

      function ManualErrorSetter() {
        const actions = Form.useValidationActions();
        return (
          <button
            type="button"
            onClick={() => actions.setError("email", "Manual error")}
            data-testid="set-error"
          >
            Set Error
          </button>
        );
      }

      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
              <Form.Error data-testid="error" renderEmpty />
            </Form.Field>
            <ManualErrorSetter />
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("error")).toBeEmptyDOMElement();

      await user.click(screen.getByTestId("set-error"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Manual error");
      });
    });

    it("should provide clearError action", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      function ErrorClearer() {
        const actions = Form.useValidationActions();
        return (
          <button
            type="button"
            onClick={() => actions.clearError("email")}
            data-testid="clear-error"
          >
            Clear Error
          </button>
        );
      }

      const schema = z.object({ email: z.string().email("Invalid email") });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "invalid" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
              <Form.Error data-testid="error" renderEmpty />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
            <ErrorClearer />
          </Form.Root>
        </EventEmitter>
      );

      // Trigger validation
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Invalid email");
      });

      // Clear the error
      await user.click(screen.getByTestId("clear-error"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toBeEmptyDOMElement();
      });
    });

    it("should provide clearAllErrors action", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      function AllErrorClearer() {
        const actions = Form.useValidationActions();
        return (
          <button
            type="button"
            onClick={() => actions.clearErrors()}
            data-testid="clear-all"
          >
            Clear All
          </button>
        );
      }

      const schema = z.object({
        email: z.string().email("Invalid email"),
        name: z.string().min(1, "Name required"),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "invalid", name: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Error data-testid="email-error" renderEmpty />
            </Form.Field>
            <Form.Field name="name">
              <Form.Error data-testid="name-error" renderEmpty />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
            <AllErrorClearer />
          </Form.Root>
        </EventEmitter>
      );

      // Trigger validation
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).not.toBeEmptyDOMElement();
        expect(screen.getByTestId("name-error")).not.toBeEmptyDOMElement();
      });

      // Clear all errors
      await user.click(screen.getByTestId("clear-all"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toBeEmptyDOMElement();
        expect(screen.getByTestId("name-error")).toBeEmptyDOMElement();
      });
    });
  });

  describe("N11.8 - Event access", () => {
    it("should provide event emitter through useForm", async () => {
      const user = userEvent.setup();
      const eventCallback = vi.fn();

      function EventSubscriber() {
        const form = Form.useForm();

        // Subscribe to submit success event
        const handleSubscribe = () => {
          form.emitter.on(form.events.SUBMIT_SUCCESS, eventCallback);
        };

        return (
          <button type="button" onClick={handleSubscribe} data-testid="subscribe">
            Subscribe
          </button>
        );
      }

      const schema = z.object({ name: z.string() });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Test" }} schema={schema}>
            <EventSubscriber />
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      // Subscribe to events
      await user.click(screen.getByTestId("subscribe"));

      // Submit the form
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(eventCallback).toHaveBeenCalled();
      });
    });
  });

  describe("N11.9 - Form state inspection hooks", () => {
    it("should provide useFormIsSubmitting hook", () => {
      function SubmittingDisplay() {
        const isSubmitting = Form.useFormIsSubmitting();
        // The hook should return a boolean
        return (
          <span data-testid="submitting" data-value={typeof isSubmitting}>
            {typeof isSubmitting === "boolean" ? "Valid" : "Invalid"}
          </span>
        );
      }

      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Test" }} schema={schema}>
            <SubmittingDisplay />
          </Form.Root>
        </EventEmitter>
      );

      // The hook should return a boolean type
      expect(screen.getByTestId("submitting")).toHaveTextContent("Valid");
      expect(screen.getByTestId("submitting")).toHaveAttribute("data-value", "boolean");
    });

    it("should provide useFormIsValidating hook", async () => {
      function ValidatingDisplay() {
        const isValidating = Form.useFormIsValidating();
        return (
          <span data-testid="validating">
            {isValidating ? "Validating" : "Not validating"}
          </span>
        );
      }

      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Test" }} schema={schema}>
            <ValidatingDisplay />
          </Form.Root>
        </EventEmitter>
      );

      // Initially not validating
      expect(screen.getByTestId("validating")).toHaveTextContent("Not validating");
    });
  });
});
