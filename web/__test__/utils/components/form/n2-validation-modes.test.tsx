import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

/**
 * N2. Validation Modes
 *
 * Tests for different validation trigger modes:
 * - onSubmit: Validate only on form submission
 * - onBlur: Validate when field loses focus
 * - onChange: Validate on every value change
 * - onTouched: Validate on first blur, then on every change
 */

describe("N2. Validation Modes", () => {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FormWrapper = ({
    children,
    state,
    mode,
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

  describe("N2.1 - onSubmit mode (default)", () => {
    it("should NOT validate on blur when mode is onSubmit", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onSubmit">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            {/* Use renderEmpty to keep element in DOM for testing */}
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="other">Other</button>
        </FormWrapper>
      );

      // Type invalid email
      await user.type(screen.getByTestId("email"), "invalid");
      // Blur by clicking elsewhere (button is type="button", won't submit)
      await user.click(screen.getByTestId("other"));

      // No error should appear - mode is onSubmit, so blur doesn't trigger validation
      // Form.Error with renderEmpty renders an empty span
      expect(screen.getByTestId("email-error")).toHaveTextContent("");
    });

    it("should validate on form submit", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <FormWrapper state={{ email: "invalid" }} mode="onSubmit">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormWrapper>
      );

      // Submit the form
      await user.click(screen.getByTestId("submit"));

      // Error should appear after submit
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe("N2.2 - onBlur mode", () => {
    it("should validate when field loses focus", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onBlur">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="other">Other</button>
        </FormWrapper>
      );

      // Type invalid email
      await user.type(screen.getByTestId("email"), "invalid");
      // Blur by clicking elsewhere
      await user.click(screen.getByTestId("other"));

      // Error should appear after blur
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should NOT validate on typing (before blur)", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onBlur">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
        </FormWrapper>
      );

      // Type invalid email but keep focus
      await user.type(screen.getByTestId("email"), "invalid");

      // No error yet since blur hasn't happened
      expect(screen.getByTestId("email-error")).toHaveTextContent("");
    });

    it("should clear error when value becomes valid and field is blurred again", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onBlur">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="other">Other</button>
        </FormWrapper>
      );

      // Type invalid email and blur
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("other"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });

      // Clear and type valid email, then blur
      await user.clear(screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "valid@example.com");
      await user.click(screen.getByTestId("other"));

      // Error should be cleared after re-validation
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("");
      });
    });
  });

  describe("N2.3 - onChange mode", () => {
    it("should validate on every change", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onChange">
          <Form.Field name="email">
            {/* Enable validateOnChange to trigger validation */}
            <Form.Text data-testid="email" validateOnChange />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
        </FormWrapper>
      );

      // Type one character
      await user.type(screen.getByTestId("email"), "a");

      // Error should appear immediately (after typing)
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should clear error when value becomes valid on change", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onChange">
          <Form.Field name="email">
            <Form.Text data-testid="email" validateOnChange />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
        </FormWrapper>
      );

      // Type valid email
      await user.type(screen.getByTestId("email"), "test@example.com");

      // Error should be cleared when email becomes valid
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("");
      });
    });
  });

  describe("N2.4 - onTouched mode", () => {
    it("should NOT validate on typing before first blur", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onTouched">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
        </FormWrapper>
      );

      // Type invalid email but don't blur
      await user.type(screen.getByTestId("email"), "invalid");

      // No error should appear yet
      expect(screen.getByTestId("email-error")).toHaveTextContent("");
    });

    it("should validate on first blur", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onTouched">
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="other">Other</button>
        </FormWrapper>
      );

      // Type invalid email and blur
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("other"));

      // Error should appear after first blur
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should validate on change after field is touched", async () => {
      const user = userEvent.setup();

      render(
        <FormWrapper state={{ email: "" }} mode="onTouched">
          <Form.Field name="email">
            {/* Need validateOnChange to trigger on change after touched */}
            <Form.Text data-testid="email" validateOnChange />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="other">Other</button>
        </FormWrapper>
      );

      // Type invalid email and blur to mark as touched
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("other"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });

      // Now clear and type valid email (onChange should re-validate since touched)
      await user.clear(screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "valid@example.com");

      // Error should clear due to onChange validation after touched
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("");
      });
    });
  });

  describe("N2.5 - reValidateMode", () => {
    it("should revalidate on change after first submit (default reValidateMode)", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <FormWrapper state={{ email: "invalid" }} mode="onSubmit">
          <Form.Field name="email">
            {/* Need validateOnChange for revalidation to trigger */}
            <Form.Text data-testid="email" validateOnChange />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormWrapper>
      );

      // First submit to trigger validation
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });

      // Now clear and type valid email - should revalidate on change
      await user.clear(screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "valid@example.com");

      // Error should be cleared due to revalidation
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent("");
      });
    });
  });

  describe("N2.6 - Per-field validation options", () => {
    it("validateOnChange triggers validation call but mode controls if it runs", async () => {
      const user = userEvent.setup();

      render(
        // Form mode is onChange - validation will run on change events
        <FormWrapper state={{ email: "" }} mode="onChange">
          <Form.Field name="email">
            {/* validateOnChange=true tells the input to call triggerValidation on change */}
            <Form.Text data-testid="email" validateOnChange />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
        </FormWrapper>
      );

      // Type invalid email
      await user.type(screen.getByTestId("email"), "invalid");

      // Error should appear because mode="onChange" allows change-triggered validation
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
      });
    });

    it("should NOT validate on blur when validateOnBlur is false", async () => {
      const user = userEvent.setup();

      render(
        // Form mode is onBlur
        <FormWrapper state={{ email: "" }} mode="onBlur">
          <Form.Field name="email">
            {/* Disable blur validation for this field */}
            <Form.Text data-testid="email" validateOnBlur={false} />
            <Form.Error data-testid="email-error" renderEmpty />
          </Form.Field>
          <button type="button" data-testid="other">Other</button>
        </FormWrapper>
      );

      // Type invalid email and blur
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("other"));

      // Error should NOT appear because validateOnBlur is false
      expect(screen.getByTestId("email-error")).toHaveTextContent("");
    });
  });
});
