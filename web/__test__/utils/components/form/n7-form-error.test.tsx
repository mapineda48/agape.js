import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";
import { useValidationActions } from "#web/utils/components/form/validation";

/**
 * N7. Form.Error Component Tests
 *
 * Tests for the Form.Error component:
 * - Basic error display
 * - renderEmpty prop behavior
 * - Render prop for custom display
 * - Accessibility attributes
 * - Standalone usage with name prop
 * - Association with Field context
 */

describe("N7. Form.Error Component", () => {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    age: z.number().min(18, "Must be at least 18"),
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

  describe("N7.1 - Basic error display", () => {
    it("should display error message when field has error", async () => {
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

      // Initially no error
      expect(screen.queryByTestId("error")).not.toBeInTheDocument();

      // Type invalid value and blur to trigger validation
      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should not render when there's no error", () => {
      render(
        <FormWrapper state={{ email: "valid@example.com" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.queryByTestId("error")).not.toBeInTheDocument();
    });

    it("should render as span element", async () => {
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
        expect(screen.getByTestId("error").tagName).toBe("SPAN");
      });
    });
  });

  describe("N7.2 - renderEmpty prop", () => {
    it("should render empty element when renderEmpty is true and no error", () => {
      render(
        <FormWrapper state={{ email: "valid@example.com" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" renderEmpty />
          </Form.Field>
        </FormWrapper>
      );

      const error = screen.getByTestId("error");
      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent("");
    });

    it("should maintain layout with renderEmpty className", () => {
      render(
        <FormWrapper state={{ email: "valid@example.com" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" renderEmpty className="h-5" />
          </Form.Field>
        </FormWrapper>
      );

      const error = screen.getByTestId("error");
      expect(error).toHaveClass("h-5");
    });

    it("should show error and still render with renderEmpty when error exists", async () => {
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

      // Initially empty
      expect(screen.getByTestId("error")).toHaveTextContent("");

      // Trigger error
      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should clear error content when field becomes valid", async () => {
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

      // Trigger error
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

  describe("N7.3 - Render prop for custom display", () => {
    it("should call render function with error message", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error">
              {(error) => <strong data-testid="custom">Error: {error}</strong>}
            </Form.Error>
          </Form.Field>
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("custom")).toHaveTextContent(
          "Error: Invalid email address"
        );
      });
    });

    it("should not call render function when no error", () => {
      const renderFn = vi.fn();

      render(
        <FormWrapper state={{ email: "valid@example.com" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error>{renderFn}</Form.Error>
          </Form.Field>
        </FormWrapper>
      );

      expect(renderFn).not.toHaveBeenCalled();
    });

    it("should render custom content with styling", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error>
              {(error) => (
                <div data-testid="custom-error" className="text-red-500 flex items-center">
                  <span className="mr-1">⚠️</span>
                  {error}
                </div>
              )}
            </Form.Error>
          </Form.Field>
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        const customError = screen.getByTestId("custom-error");
        expect(customError).toHaveClass("text-red-500");
        expect(customError).toHaveTextContent("⚠️");
      });
    });
  });

  describe("N7.4 - Accessibility attributes", () => {
    it("should have role=alert", async () => {
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
        expect(screen.getByTestId("error")).toHaveAttribute("role", "alert");
      });
    });

    it("should have aria-live=polite", async () => {
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
        expect(screen.getByTestId("error")).toHaveAttribute(
          "aria-live",
          "polite"
        );
      });
    });

    it("should have id for aria-describedby association", async () => {
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
        expect(screen.getByTestId("error")).toHaveAttribute("id");
      });
    });

    it("should set data-error attribute based on error state", async () => {
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

      // Initially no error
      expect(screen.getByTestId("error")).toHaveAttribute("data-error", "false");

      // Trigger error
      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveAttribute("data-error", "true");
      });
    });
  });

  describe("N7.5 - Standalone usage with name prop", () => {
    it("should display error for specified field when using name prop", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <FormWrapper state={{ email: "invalid", name: "" }} mode="onSubmit">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <Form.Field name="name">
            <Form.Text data-testid="name" />
          </Form.Field>
          {/* Standalone error display for email */}
          <Form.Error name="email" data-testid="email-error" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormWrapper>
      );

      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should allow showing errors outside of Field context", async () => {
      function ErrorButton() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="set-error"
            onClick={() => actions.setError("email", "Custom error")}
          >
            Set Error
          </button>
        );
      }

      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Text path="email" data-testid="input" />
          <Form.Error name="email" data-testid="error" />
          <ErrorButton />
        </FormWrapper>
      );

      // Initially no error
      expect(screen.queryByTestId("error")).not.toBeInTheDocument();

      // Set error programmatically
      await user.click(screen.getByTestId("set-error"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Custom error");
      });
    });
  });

  describe("N7.6 - Nested field errors", () => {
    it("should display error for nested path in Form.Field + Form.Scope", async () => {
      const user = userEvent.setup();
      const nestedSchema = z.object({
        user: z.object({
          email: z.string().email("Invalid user email"),
        }),
      });

      render(
        <EventEmitter>
          <Form.Root
            state={{ user: { email: "" } }}
            schema={nestedSchema}
            mode="onBlur"
          >
            <Form.Scope path="user">
              <Form.Field name="email">
                <Form.Text data-testid="input" />
                <Form.Error data-testid="error" />
              </Form.Field>
            </Form.Scope>
            <button type="button" data-testid="blur">
              Blur
            </button>
          </Form.Root>
        </EventEmitter>
      );

      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid user email"
        );
      });
    });

    it("should display error for deeply nested paths", async () => {
      const user = userEvent.setup();
      const deepSchema = z.object({
        company: z.object({
          department: z.object({
            manager: z.object({
              email: z.string().email("Invalid manager email"),
            }),
          }),
        }),
      });

      render(
        <EventEmitter>
          <Form.Root
            state={{ company: { department: { manager: { email: "" } } } }}
            schema={deepSchema}
            mode="onBlur"
          >
            <Form.Scope path="company">
              <Form.Scope path="department">
                <Form.Scope path="manager">
                  <Form.Field name="email">
                    <Form.Text data-testid="input" />
                    <Form.Error data-testid="error" />
                  </Form.Field>
                </Form.Scope>
              </Form.Scope>
            </Form.Scope>
            <button type="button" data-testid="blur">
              Blur
            </button>
          </Form.Root>
        </EventEmitter>
      );

      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid manager email"
        );
      });
    });
  });

  describe("N7.7 - Props forwarding", () => {
    it("should forward className prop", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" className="text-red-500 text-sm" />
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
        expect(error).toHaveClass("text-red-500");
        expect(error).toHaveClass("text-sm");
      });
    });

    it("should forward ref to span element", async () => {
      const user = userEvent.setup();
      const ref = { current: null as HTMLSpanElement | null };

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error ref={ref} data-testid="error" />
          </Form.Field>
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("input"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(ref.current).not.toBeNull();
        expect(ref.current?.tagName).toBe("SPAN");
      });
    });
  });

  describe("N7.8 - Error clearing", () => {
    it("should clear error when clearError action is called", async () => {
      function ErrorButtons() {
        const actions = useValidationActions();
        return (
          <>
            <button
              type="button"
              data-testid="set-error"
              onClick={() => actions.setError("email", "Manual error")}
            >
              Set
            </button>
            <button
              type="button"
              data-testid="clear-error"
              onClick={() => actions.clearError("email")}
            >
              Clear
            </button>
          </>
        );
      }

      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="input" />
            <Form.Error data-testid="error" renderEmpty />
          </Form.Field>
          <ErrorButtons />
        </FormWrapper>
      );

      // Set error
      await user.click(screen.getByTestId("set-error"));
      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("Manual error");
      });

      // Clear error
      await user.click(screen.getByTestId("clear-error"));
      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent("");
      });
    });
  });
});
