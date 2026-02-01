import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import EventEmitter from "#web/utils/components/event-emitter";

/**
 * N6. Form.Label Component Tests
 *
 * Tests for the Form.Label component:
 * - Automatic htmlFor association with inputs
 * - Required indicator display
 * - Custom required indicators
 * - Standalone usage
 * - Accessibility attributes
 */

describe("N6. Form.Label Component", () => {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FormWrapper = ({
    children,
    state,
  }: {
    children: React.ReactNode;
    state?: any;
  }) => (
    <EventEmitter>
      <Form.Root state={state} schema={schema} mode="onBlur">
        {children}
      </Form.Root>
    </EventEmitter>
  );

  describe("N6.1 - Basic label rendering", () => {
    it("should render label text correctly", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label">Email Address</Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("label")).toHaveTextContent("Email Address");
    });

    it("should render as a label element", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label">Email</Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("label").tagName).toBe("LABEL");
    });

    it("should pass through additional props", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label" className="custom-class" id="my-label">
              Email
            </Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveClass("custom-class");
      expect(label).toHaveAttribute("id", "my-label");
    });
  });

  describe("N6.2 - Automatic htmlFor association", () => {
    it("should automatically set htmlFor when inside Form.Field", () => {
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

      expect(label).toHaveAttribute("for");
      expect(input).toHaveAttribute("id");
      expect(label.getAttribute("for")).toBe(input.getAttribute("id"));
    });

    it("should use explicit htmlFor when provided", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Label data-testid="label" htmlFor="custom-input-id">
            Email
          </Form.Label>
          <input id="custom-input-id" data-testid="input" />
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveAttribute("for", "custom-input-id");
    });

    it("should have no htmlFor when used standalone without explicit prop", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Label data-testid="label">Standalone Label</Form.Label>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      // When no htmlFor and no fieldContext, it should be undefined
      expect(label.getAttribute("for")).toBeNull();
    });
  });

  describe("N6.3 - Required indicator from Field context", () => {
    it("should show required indicator when Field is required", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label data-testid="label">Email</Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveTextContent("Email *");
    });

    it("should NOT show required indicator when Field is not required", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label">Email</Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveTextContent("Email");
      expect(label).not.toHaveTextContent("*");
    });

    it("should NOT show required indicator when used standalone", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Label data-testid="label">Standalone</Form.Label>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).not.toHaveTextContent("*");
    });
  });

  describe("N6.4 - showRequired prop override", () => {
    it("should show required indicator when showRequired=true even if Field is not required", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label" showRequired>
              Email
            </Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveTextContent("Email *");
    });

    it("should hide required indicator when showRequired=false even if Field is required", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label data-testid="label" showRequired={false}>
              Email
            </Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveTextContent("Email");
      expect(label).not.toHaveTextContent("*");
    });

    it("should show required indicator in standalone mode with showRequired=true", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Label data-testid="label" showRequired>
            Standalone
          </Form.Label>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveTextContent("Standalone *");
    });
  });

  describe("N6.5 - Custom required indicator", () => {
    it("should render custom string required indicator", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label data-testid="label" requiredIndicator=" (required)">
              Email
            </Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveTextContent("Email (required)");
    });

    it("should render custom React node required indicator", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label
              data-testid="label"
              requiredIndicator={<span data-testid="indicator" className="text-red-500">*</span>}
            >
              Email
            </Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      expect(screen.getByTestId("indicator")).toBeInTheDocument();
      expect(screen.getByTestId("indicator")).toHaveClass("text-red-500");
    });

    it("should render emoji as required indicator", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label data-testid="label" requiredIndicator=" ⭐">
              Email
            </Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      const label = screen.getByTestId("label");
      expect(label).toHaveTextContent("Email ⭐");
    });
  });

  describe("N6.6 - Accessibility", () => {
    it("should have aria-hidden on required indicator", () => {
      const { container } = render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email" required>
            <Form.Label data-testid="label">Email</Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      // The required indicator span should have aria-hidden
      const requiredSpan = container.querySelector(".form-label-required");
      expect(requiredSpan).toHaveAttribute("aria-hidden", "true");
    });

    it("should clicking label focus the associated input", async () => {
      const user = userEvent.setup();

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

      await user.click(label);

      // Input should be focused
      expect(document.activeElement).toBe(input);
    });
  });

  describe("N6.7 - Multiple labels in same Field", () => {
    it("should all labels associate with the same input", () => {
      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label data-testid="label1">Primary Label</Form.Label>
            <Form.Label data-testid="label2">Secondary Label</Form.Label>
            <Form.Text data-testid="input" />
          </Form.Field>
        </FormWrapper>
      );

      const label1 = screen.getByTestId("label1");
      const label2 = screen.getByTestId("label2");
      const input = screen.getByTestId("input");

      // Both labels should have the same htmlFor
      expect(label1.getAttribute("for")).toBe(input.getAttribute("id"));
      expect(label2.getAttribute("for")).toBe(input.getAttribute("id"));
    });
  });

  describe("N6.8 - Ref forwarding", () => {
    it("should forward ref to the label element", () => {
      const ref = { current: null as HTMLLabelElement | null };

      render(
        <FormWrapper state={{ email: "" }}>
          <Form.Field name="email">
            <Form.Label ref={ref} data-testid="label">
              Email
            </Form.Label>
            <Form.Text />
          </Form.Field>
        </FormWrapper>
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("LABEL");
    });
  });
});
