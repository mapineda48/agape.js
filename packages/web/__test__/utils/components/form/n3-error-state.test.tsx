import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";
import {
  useValidationActions,
  useFormErrors,
  useFieldError,
  useFormIsValid,
} from "#web/utils/components/form/validation";

/**
 * N3. Error State Management
 *
 * Tests for error state management:
 * - Form.Error component display
 * - setError / clearError / clearErrors actions
 * - formState.errors access
 * - Error persistence and clearing
 */

describe("N3. Error State Management", () => {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
  });

  const FormWrapper = ({
    children,
    state,
    mode = "onBlur",
  }: {
    children: React.ReactNode;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    state?: any;
    mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched";
  }) => (
    <EventEmitter>
      <Form.Root state={state} schema={schema} mode={mode}>
        {children}
      </Form.Root>
    </EventEmitter>
  );

  describe("N3.1 - Form.Error component", () => {
    it("should display error message when validation fails", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" />
          </Form.Field>
          <button type="button" data-testid="blur">Blur</button>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should hide error when field becomes valid", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="blur">Blur</button>
        </FormWrapper>
      );

      // First trigger error
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });

      // Then fix it
      await user.clear(screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "valid@example.com");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("");
      });
    });

    it("should support render prop for custom error display", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error">
              {(error) => <span data-testid="custom-error">Error: {error}</span>}
            </Form.Error>
          </Form.Field>
          <button type="button" data-testid="blur">Blur</button>
        </FormWrapper>
      );

      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("custom-error")).toHaveTextContent(
          "Error: Invalid email address"
        );
      });
    });

    it("should render empty with renderEmpty prop when no error", () => {
      render(
        <FormWrapper state={{ email: "valid@example.com", name: "John" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
        </FormWrapper>
      );

      // Element should exist but be empty
      expect(screen.getByTestId("email-error")).toBeInTheDocument();
      expect(screen.getByTestId("email-error")).toHaveTextContent("");
    });

    it("should NOT render without renderEmpty when no error", () => {
      render(
        <FormWrapper state={{ email: "valid@example.com", name: "John" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" />
          </Form.Field>
        </FormWrapper>
      );

      // Element should not exist
      expect(screen.queryByTestId("email-error")).not.toBeInTheDocument();
    });
  });

  describe("N3.2 - setError action", () => {
    it("should allow setting custom error messages", async () => {
      // Component that exposes setError action
      function TestComponent() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="set-error"
            onClick={() => actions.setError("email", "Custom error message")}
          >
            Set Error
          </button>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" />
          </Form.Field>
          <TestComponent />
        </FormWrapper>
      );

      const user = userEvent.setup();
      await user.click(screen.getByTestId("set-error"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Custom error message"
        );
      });
    });

    it("should override schema validation errors with setError", async () => {
      function TestComponent() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="set-error"
            onClick={() => actions.setError("email", "Server says: email taken")}
          >
            Set Error
          </button>
        );
      }

      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" />
          </Form.Field>
          <button type="button" data-testid="blur">Blur</button>
          <TestComponent />
        </FormWrapper>
      );

      // First trigger schema error
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });

      // Then override with custom error
      await user.click(screen.getByTestId("set-error"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Server says: email taken"
        );
      });
    });
  });

  describe("N3.3 - clearError action", () => {
    it("should clear error for a specific field", async () => {
      function TestComponent() {
        const actions = useValidationActions();
        return (
          <>
            <button
              type="button"
              data-testid="set-error"
              onClick={() => actions.setError("email", "Error")}
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
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <TestComponent />
        </FormWrapper>
      );

      // Set error
      await user.click(screen.getByTestId("set-error"));
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("Error");
      });

      // Clear error
      await user.click(screen.getByTestId("clear-error"));
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("");
      });
    });
  });

  describe("N3.4 - clearErrors action", () => {
    it("should clear all errors at once", async () => {
      function TestComponent() {
        const actions = useValidationActions();
        return (
          <>
            <button
              type="button"
              data-testid="set-errors"
              onClick={() => {
                actions.setError("email", "Email error");
                actions.setError("name", "Name error");
              }}
            >
              Set Errors
            </button>
            <button
              type="button"
              data-testid="clear-all"
              onClick={() => actions.clearErrors()}
            >
              Clear All
            </button>
          </>
        );
      }

      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <Form.Field name="name">
            <Form.Text data-testid="name" />
            <Form.Error data-testid="name-error" renderEmpty />
          </Form.Field>
          <TestComponent />
        </FormWrapper>
      );

      // Set both errors
      await user.click(screen.getByTestId("set-errors"));
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("Email error");
        expect(screen.getByTestId("name-error")).toHaveTextContent("Name error");
      });

      // Clear all
      await user.click(screen.getByTestId("clear-all"));
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("");
        expect(screen.getByTestId("name-error")).toHaveTextContent("");
      });
    });
  });

  describe("N3.5 - useFormErrors hook", () => {
    it("should provide access to all form errors", async () => {
      function ErrorDisplay() {
        const errors = useFormErrors();
        return (
          <div data-testid="all-errors">
            {Object.entries(errors).map(([key, value]) => (
              <span key={key} data-testid={`error-${key}`}>
                {key}: {value}
              </span>
            ))}
          </div>
        );
      }

      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <FormWrapper state={{ email: "invalid", name: "a" }} mode="onSubmit">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <Form.Field name="name">
            <Form.Text data-testid="name" />
          </Form.Field>
          <ErrorDisplay />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormWrapper>
      );

      // Submit to trigger validation
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("error-email")).toBeInTheDocument();
        expect(screen.getByTestId("error-name")).toBeInTheDocument();
      });
    });
  });

  describe("N3.6 - useFormIsValid hook", () => {
    it("should return true when form is valid", () => {
      function ValidityDisplay() {
        const isValid = useFormIsValid();
        return <span data-testid="is-valid">{isValid ? "valid" : "invalid"}</span>;
      }

      render(
        <FormWrapper state={{ email: "test@example.com", name: "John" }}>
          <ValidityDisplay />
        </FormWrapper>
      );

      // Initially valid (no validation has run yet)
      expect(screen.getByTestId("is-valid")).toHaveTextContent("valid");
    });

    it("should return false when form has errors", async () => {
      function ValidityDisplay() {
        const isValid = useFormIsValid();
        return <span data-testid="is-valid">{isValid ? "valid" : "invalid"}</span>;
      }

      function SetErrorButton() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="set-error"
            onClick={() => actions.setError("email", "Error")}
          >
            Set Error
          </button>
        );
      }

      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <ValidityDisplay />
          <SetErrorButton />
        </FormWrapper>
      );

      // Initially valid
      expect(screen.getByTestId("is-valid")).toHaveTextContent("valid");

      // Set error
      await user.click(screen.getByTestId("set-error"));

      await waitFor(() => {
        expect(screen.getByTestId("is-valid")).toHaveTextContent("invalid");
      });
    });
  });

  describe("N3.7 - useFieldError hook", () => {
    it("should return error for specific field", async () => {
      function FieldErrorDisplay() {
        const emailError = useFieldError("email");
        const nameError = useFieldError("name");
        return (
          <>
            <span data-testid="email-err">{emailError ?? "none"}</span>
            <span data-testid="name-err">{nameError ?? "none"}</span>
          </>
        );
      }

      function SetErrorButton() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="set-error"
            onClick={() => actions.setError("email", "Email error only")}
          >
            Set Email Error
          </button>
        );
      }

      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <FieldErrorDisplay />
          <SetErrorButton />
        </FormWrapper>
      );

      // Initially no errors
      expect(screen.getByTestId("email-err")).toHaveTextContent("none");
      expect(screen.getByTestId("name-err")).toHaveTextContent("none");

      // Set email error only
      await user.click(screen.getByTestId("set-error"));

      await waitFor(() => {
        expect(screen.getByTestId("email-err")).toHaveTextContent("Email error only");
        expect(screen.getByTestId("name-err")).toHaveTextContent("none");
      });
    });
  });

  describe("N3.8 - Error persistence", () => {
    it("should persist errors across re-renders", async () => {
      function Counter() {
        const [count, setCount] = React.useState(0);
        return (
          <button data-testid="counter" onClick={() => setCount((c) => c + 1)}>
            Count: {count}
          </button>
        );
      }

      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" />
          </Form.Field>
          <button type="button" data-testid="blur">Blur</button>
          <Counter />
        </FormWrapper>
      );

      // Trigger error
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });

      // Trigger re-render
      await user.click(screen.getByTestId("counter"));
      await user.click(screen.getByTestId("counter"));

      // Error should persist
      expect(screen.getByTestId("email-error")).toHaveTextContent(
        "Invalid email address"
      );
    });
  });
});

// Need React import for the Counter component
import React from "react";
