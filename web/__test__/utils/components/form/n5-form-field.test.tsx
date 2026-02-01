import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";
import { useFieldContext, useFieldContextOptional } from "#web/utils/components/form/Field/context";

/**
 * N5. Form.Field Component Tests
 *
 * Tests for the Form.Field wrapper component:
 * - Path context propagation
 * - Field context (IDs for accessibility)
 * - Required/disabled state
 * - Label association
 * - Error display within Field
 */

describe("N5. Form.Field Component", () => {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FormWrapper = ({
    children,
    state,
    mode = "onBlur",
  }: {
    children: React.ReactNode;
    state?: any;
    mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched";
  }) => (
    <EventEmitter>
      <Form.Root state={state} schema={schema} mode={mode}>
        {children}
      </Form.Root>
    </EventEmitter>
  );

  describe("N5.1 - Basic Form.Field rendering", () => {
    it("should render children correctly", () => {
      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <span data-testid="child">Child content</span>
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("child")).toHaveTextContent("Child content");
    });

    it("should add data-field attribute with field name", () => {
      const { container } = render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
        </FormWrapper>
      );

      expect(container.querySelector("[data-field='email']")).toBeInTheDocument();
    });

    it("should support className prop", () => {
      const { container } = render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email" className="custom-field-class">
            <Form.Text data-testid="email" />
          </Form.Field>
        </FormWrapper>
      );

      expect(container.querySelector(".custom-field-class")).toBeInTheDocument();
    });

    it("should support 'as' prop for different elements", () => {
      const { container } = render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email" as="fieldset">
            <Form.Text data-testid="email" />
          </Form.Field>
        </FormWrapper>
      );

      expect(container.querySelector("fieldset[data-field='email']")).toBeInTheDocument();
    });
  });

  describe("N5.2 - Path context propagation", () => {
    it("should provide path context to child inputs", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("email"), "test@example.com");

      expect(screen.getByTestId("email")).toHaveValue("test@example.com");
    });

    it("should NOT require path prop on inputs when inside Form.Field", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <FormWrapper state={{ email: "", name: "" }} mode="onSubmit">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <Form.Field name="name">
            <Form.Text data-testid="name" />
          </Form.Field>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("email"), "test@example.com");
      await user.type(screen.getByTestId("name"), "John Doe");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          email: "test@example.com",
          name: "John Doe",
        });
      });
    });

    it("should work with nested Form.Scope", async () => {
      const user = userEvent.setup();
      const nestedSchema = z.object({
        user: z.object({
          email: z.string().email("Invalid email"),
        }),
      });

      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ user: { email: "" } }}
            schema={nestedSchema}
            mode="onSubmit"
          >
            <Form.Scope path="user">
              <Form.Field name="email">
                <Form.Text data-testid="email" />
              </Form.Field>
            </Form.Scope>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.type(screen.getByTestId("email"), "nested@example.com");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          user: { email: "nested@example.com" },
        });
      });
    });
  });

  describe("N5.3 - Field context (accessibility IDs)", () => {
    it("should provide inputId to Form.Label for association", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label">Email</Form.Label>
            <Form.Text data-testid="input" />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      const input = screen.getByTestId("input");

      // Label's htmlFor should match input's id
      expect(label).toHaveAttribute("for");
      expect(input).toHaveAttribute("id");
      expect(label.getAttribute("for")).toBe(input.getAttribute("id"));
    });

    it("should provide errorId for aria-describedby", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" />
          </Form.Field>
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        const error = screen.getByTestId("error");
        expect(error).toBeInTheDocument();
        expect(error).toHaveAttribute("id");
      });
    });

    it("should throw error when useFieldContext is used outside Form.Field", () => {
      function TestComponent() {
        try {
          useFieldContext();
          return <span data-testid="result">no error</span>;
        } catch (e) {
          return <span data-testid="result">error thrown</span>;
        }
      }

      render(
        <FormWrapper state={{ email: "" }}>
          <TestComponent />
        </FormWrapper>
      );

      expect(screen.getByTestId("result")).toHaveTextContent("error thrown");
    });

    it("should return null from useFieldContextOptional outside Form.Field", () => {
      function TestComponent() {
        const context = useFieldContextOptional();
        return (
          <span data-testid="result">
            {context === null ? "null" : "has context"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "" }}>
          <TestComponent />
        </FormWrapper>
      );

      expect(screen.getByTestId("result")).toHaveTextContent("null");
    });
  });

  describe("N5.4 - Required state", () => {
    it("should pass required state to Form.Label", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label data-testid="label">Email</Form.Label>
            <Form.Text data-testid="input" />
          </Form.Field>
        </FormWrapper>
      );

      // Form.Label should show required indicator
      expect(screen.getByTestId("label")).toHaveTextContent("Email *");
    });

    it("should not show required indicator when not required", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label">Email</Form.Label>
            <Form.Text data-testid="input" />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("label")).toHaveTextContent("Email");
      expect(screen.getByTestId("label")).not.toHaveTextContent("*");
    });

    it("should allow custom required indicator", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label 
              data-testid="label" 
              requiredIndicator={<span data-testid="indicator">(required)</span>}
            >
              Email
            </Form.Label>
            <Form.Text data-testid="input" />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("indicator")).toHaveTextContent("(required)");
    });
  });

  describe("N5.5 - Disabled state", () => {
    it("should have disabled available in Field context", () => {
      function DisabledDisplay() {
        const context = useFieldContextOptional();
        return (
          <span data-testid="disabled">
            {context?.disabled ? "disabled" : "enabled"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" disabled>
            <DisabledDisplay />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("disabled")).toHaveTextContent("disabled");
    });

    it("should allow explicit disabled prop on input", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" disabled />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("input")).toBeDisabled();
    });

    it("should not disable when disabled prop is false on Field", () => {
      function DisabledDisplay() {
        const context = useFieldContextOptional();
        return (
          <span data-testid="disabled">
            {context?.disabled ? "disabled" : "enabled"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" disabled={false}>
            <DisabledDisplay />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("disabled")).toHaveTextContent("enabled");
    });
  });

  describe("N5.6 - Error display within Field", () => {
    it("should display errors through Form.Error inside Field", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" />
          </Form.Field>
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should clear errors when value becomes valid", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      // First trigger error
      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid email address"
        );
      });

      // Fix the value
      await user.clear(screen.getByTestId("input"));
      await user.type(screen.getByTestId("input"), "valid@example.com");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("");
      });
    });
  });

  describe("N5.7 - Multiple inputs in same Field", () => {
    it("should work with multiple inputs using path prop", async () => {
      const user = userEvent.setup();
      const nestedSchema = z.object({
        address: z.object({
          street: z.string().min(1, "Street required"),
          city: z.string().min(1, "City required"),
        }),
      });

      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ address: { street: "", city: "" } }}
            schema={nestedSchema}
            mode="onSubmit"
          >
            <Form.Field name="address" as="fieldset">
              <Form.Label>Address</Form.Label>
              <Form.Text path="street" data-testid="street" placeholder="Street" />
              <Form.Text path="city" data-testid="city" placeholder="City" />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.type(screen.getByTestId("street"), "123 Main St");
      await user.type(screen.getByTestId("city"), "New York");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          address: { street: "123 Main St", city: "New York" },
        });
      });
    });
  });

  describe("N5.8 - Description component within Field", () => {
    it("should render Form.Description correctly", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label>Email</Form.Label>
            <Form.Text data-testid="input" />
            <Form.Description data-testid="description">
              Enter your email address
            </Form.Description>
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("description")).toHaveTextContent(
        "Enter your email address"
      );
    });
  });
});
