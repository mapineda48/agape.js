/**
 * N12. Accesibilidad (a11y) Tests
 *
 * Tests for accessibility features of the form components.
 * Ensures proper ARIA attributes, label associations, and keyboard navigation.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

describe("N12. Accesibilidad (a11y)", () => {
  describe("N12.1 - Labels associated with inputs", () => {
    it("should associate label with input via htmlFor", () => {
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Label>Email Address</Form.Label>
              <Form.Text />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const label = screen.getByText("Email Address");
      const input = screen.getByRole("textbox");

      // Label should have htmlFor matching input id
      expect(label).toHaveAttribute("for", input.id);
    });

    it("should allow clicking label to focus input", async () => {
      const user = userEvent.setup();
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Label>Email Address</Form.Label>
              <Form.Text data-testid="email-input" />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const label = screen.getByText("Email Address");

      await user.click(label);

      expect(screen.getByTestId("email-input")).toHaveFocus();
    });
  });

  describe("N12.2 - Error announcements", () => {
    it("should have aria-describedby pointing to error", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({
        email: z.string().email("Invalid email format"),
      });

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
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");
      const errorElement = screen.getByTestId("error");

      // Input should have aria-describedby that includes the error id
      expect(input).toHaveAttribute("aria-describedby");
      const describedBy = input.getAttribute("aria-describedby") || "";
      expect(describedBy).toContain(errorElement.id);
    });

    it("should have role=alert on error element", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({
        email: z.string().email("Invalid email format"),
      });

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
          </Form.Root>
        </EventEmitter>
      );

      const errorElement = screen.getByTestId("error");

      // Error should have role=alert for screen readers
      expect(errorElement).toHaveAttribute("role", "alert");
    });

    it("should have aria-live=polite on error element", () => {
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Error data-testid="error" renderEmpty />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const errorElement = screen.getByTestId("error");

      // aria-live=polite allows screen readers to announce changes
      expect(errorElement).toHaveAttribute("aria-live", "polite");
    });
  });

  describe("N12.3 - Required fields", () => {
    it("should mark required fields with required attribute", () => {
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email" required>
              <Form.Text data-testid="email-input" required />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");
      // HTML required attribute is passed through props
      expect(input).toHaveAttribute("required");
    });

    it("should show required indicator in label", () => {
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email" required>
              <Form.Label>Email</Form.Label>
              <Form.Text />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      // Check for required indicator (typically an asterisk)
      const label = screen.getByText(/Email/);
      expect(label.textContent).toMatch(/\*/);
    });
  });

  describe("N12.4 - Invalid fields", () => {
    it("should mark invalid fields with aria-invalid when error exists", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({
        email: z.string().email("Invalid email"),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "invalid" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
              <Form.Error data-testid="error" />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");

      // Trigger validation
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        // When there's an error, aria-invalid should be set
        expect(input).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should have aria-describedby linking to error container", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({
        email: z.string().email("Invalid email"),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "invalid" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
              <Form.Error data-testid="error" />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");

      // Trigger validation error
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        // Input should have aria-describedby that includes the error container
        expect(input).toHaveAttribute("aria-describedby");
        const describedBy = input.getAttribute("aria-describedby") || "";
        expect(describedBy).toContain("error");
      });
    });
  });

  describe("N12.5 - Keyboard navigation", () => {
    it("should allow tab navigation between fields", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ firstName: "", lastName: "", email: "" }} schema={schema}>
            <Form.Field name="firstName">
              <Form.Text data-testid="first-name" />
            </Form.Field>
            <Form.Field name="lastName">
              <Form.Text data-testid="last-name" />
            </Form.Field>
            <Form.Field name="email">
              <Form.Text data-testid="email" />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      // Focus first field
      screen.getByTestId("first-name").focus();
      expect(screen.getByTestId("first-name")).toHaveFocus();

      // Tab to next field
      await user.tab();
      expect(screen.getByTestId("last-name")).toHaveFocus();

      // Tab to next field
      await user.tab();
      expect(screen.getByTestId("email")).toHaveFocus();
    });

    it("should submit form on Enter in text field", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Test" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      // Focus input and press Enter
      screen.getByTestId("name-input").focus();
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe("N12.6 - Disabled fields", () => {
    it("should have disabled attribute on disabled inputs", () => {
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" disabled />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");
      expect(input).toBeDisabled();
    });

    it("should not allow interaction with disabled inputs", async () => {
      const user = userEvent.setup();
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "initial" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" disabled />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");

      // Try to type (should have no effect)
      await user.type(input, "new text");

      // Value should remain unchanged
      expect(input).toHaveValue("initial");
    });
  });

  describe("N12.7 - Field descriptions", () => {
    it("should link description to input via aria-describedby", () => {
      const schema = z.object({ email: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
              <Form.Description data-testid="description">
                Enter your email address
              </Form.Description>
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");
      const description = screen.getByTestId("description");

      // aria-describedby should include the description id
      const describedBy = input.getAttribute("aria-describedby") || "";
      expect(describedBy).toContain(description.id);
    });

    it("should link both description and error to input", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({
        email: z.string().email("Invalid email"),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ email: "invalid" }} schema={schema}>
            <Form.Field name="email">
              <Form.Text data-testid="email-input" />
              <Form.Description data-testid="description">
                Enter your email
              </Form.Description>
              <Form.Error data-testid="error" renderEmpty />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("email-input");
      const description = screen.getByTestId("description");
      const error = screen.getByTestId("error");

      const describedBy = input.getAttribute("aria-describedby") || "";

      // Should include both description and error IDs
      expect(describedBy).toContain(description.id);
      expect(describedBy).toContain(error.id);
    });
  });

  describe("N12.8 - Submit button accessibility", () => {
    it("should have proper button role", () => {
      const schema = z.object({ name: z.string() });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root state={{ name: "" }} schema={schema}>
            <Submit onSubmit={onSubmit}>Submit</Submit>
          </Form.Root>
        </EventEmitter>
      );

      const button = screen.getByRole("button", { name: "Submit" });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should be disabled during loading", async () => {
      const user = userEvent.setup();
      const schema = z.object({ name: z.string() });
      const onSubmit = vi.fn().mockImplementation(
        () => new Promise((r) => setTimeout(r, 500))
      );

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Test" }} schema={schema}>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const button = screen.getByTestId("submit");

      // Click to start submitting
      await user.click(button);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe("N12.9 - Checkbox accessibility", () => {
    it("should have proper checkbox role", () => {
      const schema = z.object({ agree: z.boolean() });

      render(
        <EventEmitter>
          <Form.Root state={{ agree: false }} schema={schema}>
            <Form.Field name="agree">
              <Form.Checkbox data-testid="checkbox" />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const checkbox = screen.getByTestId("checkbox");
      expect(checkbox).toHaveAttribute("type", "checkbox");
    });

    it("should reflect checked state", async () => {
      const user = userEvent.setup();
      const schema = z.object({ agree: z.boolean() });

      render(
        <EventEmitter>
          <Form.Root state={{ agree: false }} schema={schema}>
            <Form.Field name="agree">
              <Form.Checkbox data-testid="checkbox" />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      const checkbox = screen.getByTestId("checkbox");

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);

      expect(checkbox).toBeChecked();
    });
  });

  describe("N12.10 - Select accessibility", () => {
    it("should render as a select element with combobox semantics", () => {
      const schema = z.object({ country: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ country: "us" }} schema={schema}>
            <Form.Select.String path="country" data-testid="select" placeholder="Select a country">
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
            </Form.Select.String>
          </Form.Root>
        </EventEmitter>
      );

      const select = screen.getByTestId("select");
      expect(select.tagName.toLowerCase()).toBe("select");
      expect(select).toHaveRole("combobox");
    });

    it("should be keyboard navigable with selectOptions", async () => {
      const user = userEvent.setup();
      const schema = z.object({ country: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ country: "us" }} schema={schema}>
            <Form.Select.String path="country" data-testid="select" placeholder="Select a country">
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
            </Form.Select.String>
          </Form.Root>
        </EventEmitter>
      );

      const select = screen.getByTestId("select");

      // Focus the select
      select.focus();
      expect(select).toHaveFocus();

      // Keyboard selection
      await user.selectOptions(select, "uk");
      expect(select).toHaveValue("uk");
    });
  });

  describe("N12.11 - Form-level accessibility", () => {
    it("should render as a form element", () => {
      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
          </Form.Root>
        </EventEmitter>
      );

      // Query by tag name since form role requires accessible name
      const form = document.querySelector("form");
      expect(form).toBeInTheDocument();
      expect(form?.tagName.toLowerCase()).toBe("form");
    });

    it("should prevent default form submission", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const schema = z.object({ name: z.string() });

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Test" }} schema={schema}>
            <Form.Field name="name">
              <Form.Text data-testid="name-input" />
            </Form.Field>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      // Submit via button click
      await user.click(screen.getByTestId("submit"));

      // Our handler should be called (not native form submission)
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });
});
