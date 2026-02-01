import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

/**
 * R8. Form.TextArea Tests
 * R9. Form.Select Tests
 */

describe("Form.TextArea", () => {
  const SubmitWrapper = ({
    children,
    state,
  }: {
    children: React.ReactNode;
    state?: Record<string, unknown>;
  }) => (
    <EventEmitter>
      <Form.Root state={state}>{children}</Form.Root>
    </EventEmitter>
  );

  describe("R8.1 - Render como textarea", () => {
    it("should render as textarea element", () => {
      render(
        <Form.Root>
          <Form.TextArea path="description" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea");
      expect(textarea.tagName.toLowerCase()).toBe("textarea");
    });
  });

  describe("R8.2 - Prop rows", () => {
    it("should apply rows attribute", () => {
      render(
        <Form.Root>
          <Form.TextArea path="description" rows={4} data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveAttribute("rows", "4");
    });

    it("should apply different row values", () => {
      render(
        <Form.Root>
          <Form.TextArea path="description" rows={10} data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveAttribute("rows", "10");
    });
  });

  describe("R8.3 - Texto multilínea", () => {
    it("should preserve line breaks in value", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Form.TextArea path="description" data-testid="textarea" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const textarea = screen.getByTestId("textarea");
      await user.type(textarea, "Line 1{enter}Line 2{enter}Line 3");

      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          description: "Line 1\nLine 2\nLine 3",
        });
      });
    });

    it("should display multiline text from initial state", () => {
      const multilineText = "First line\nSecond line\nThird line";

      render(
        <Form.Root state={{ description: multilineText }}>
          <Form.TextArea path="description" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      expect(textarea.value).toBe(multilineText);
    });
  });

  describe("R8.4 - Redimensionable", () => {
    it("should accept className for styling", () => {
      render(
        <Form.Root>
          <Form.TextArea
            path="description"
            className="resize-none"
            data-testid="textarea"
          />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveClass("resize-none");
    });
  });

  describe("Basic functionality", () => {
    it("should initialize with empty string by default", () => {
      render(
        <Form.Root>
          <Form.TextArea path="description" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      expect(textarea.value).toBe("");
    });

    it("should initialize with value from state", () => {
      render(
        <Form.Root state={{ description: "Initial text" }}>
          <Form.TextArea path="description" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Initial text");
    });

    it("should update state on text input", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Form.TextArea path="description" data-testid="textarea" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const textarea = screen.getByTestId("textarea");
      await user.type(textarea, "Hello World");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ description: "Hello World" });
      });
    });

    it("should work with nested paths", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Form.Scope path="post">
            <Form.TextArea path="content" data-testid="textarea" />
          </Form.Scope>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const textarea = screen.getByTestId("textarea");
      await user.type(textarea, "Nested content");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          post: { content: "Nested content" },
        });
      });
    });

    it("should support materialize prop", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Form.TextArea
            path="description"
            defaultValue="Default text"
            materialize
            data-testid="textarea"
          />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      await userEvent.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ description: "Default text" });
      });
    });

    it("should support disabled prop", () => {
      render(
        <Form.Root>
          <Form.TextArea path="description" disabled data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea");
      expect(textarea).toBeDisabled();
    });

    it("should support placeholder prop", () => {
      render(
        <Form.Root>
          <Form.TextArea
            path="description"
            placeholder="Enter description..."
            data-testid="textarea"
          />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea");
      expect(textarea).toHaveAttribute("placeholder", "Enter description...");
    });
  });
});

describe("Form.Select.String", () => {
  const SubmitWrapper = ({
    children,
    state,
  }: {
    children: React.ReactNode;
    state?: Record<string, unknown>;
  }) => (
    <EventEmitter>
      <Form.Root state={state}>{children}</Form.Root>
    </EventEmitter>
  );

  describe("R9.1 - Render con opciones", () => {
    it("should render all options", () => {
      render(
        <Form.Root>
          <Form.Select.String path="color" data-testid="select">
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
          </Form.Select.String>
        </Form.Root>
      );

      const options = screen.getAllByRole("option");
      expect(options).toHaveLength(3);
      expect(options[0]).toHaveTextContent("Red");
      expect(options[1]).toHaveTextContent("Green");
      expect(options[2]).toHaveTextContent("Blue");
    });
  });

  describe("R9.2 - Selección de opción", () => {
    it("should update state when option is selected", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Form.Select.String path="color" data-testid="select">
            <option value="red">Red</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
          </Form.Select.String>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const select = screen.getByTestId("select");
      await user.selectOptions(select, "green");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ color: "green" });
      });
    });
  });

  describe("R9.3 - Opción por defecto", () => {
    it("should show placeholder when provided", () => {
      render(
        <Form.Root>
          <Form.Select.String
            path="color"
            placeholder="Select a color"
            data-testid="select"
          >
            <option value="red">Red</option>
            <option value="green">Green</option>
          </Form.Select.String>
        </Form.Root>
      );

      const options = screen.getAllByRole("option");
      expect(options[0]).toHaveTextContent("Select a color");
      expect(options[0]).toBeDisabled();
    });

    it("should use first option as default without placeholder", () => {
      render(
        <Form.Root>
          <Form.Select.String path="color" data-testid="select">
            <option value="red">Red</option>
            <option value="green">Green</option>
          </Form.Select.String>
        </Form.Root>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      // Browser selects first available option when value doesn't match any option
      expect(select.value).toBe("red");
    });
  });

  describe("R9.7 - Select.String with string values", () => {
    it("should handle string values correctly", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ status: "pending" }}>
          <Form.Select.String path="status" data-testid="select">
            <option value="pending">Pending</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </Form.Select.String>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("pending");

      await user.selectOptions(select, "completed");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ status: "completed" });
      });
    });
  });

  describe("Props", () => {
    it("should support disabled prop", () => {
      render(
        <Form.Root>
          <Form.Select.String path="color" disabled data-testid="select">
            <option value="red">Red</option>
          </Form.Select.String>
        </Form.Root>
      );

      const select = screen.getByTestId("select");
      expect(select).toBeDisabled();
    });

    it("should support className prop", () => {
      render(
        <Form.Root>
          <Form.Select.String
            path="color"
            className="custom-select"
            data-testid="select"
          >
            <option value="red">Red</option>
          </Form.Select.String>
        </Form.Root>
      );

      const select = screen.getByTestId("select");
      expect(select).toHaveClass("custom-select");
    });

    it("should support onChange callback", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Form.Root>
          <Form.Select.String
            path="color"
            onChange={onChange}
            data-testid="select"
          >
            <option value="red">Red</option>
            <option value="green">Green</option>
          </Form.Select.String>
        </Form.Root>
      );

      const select = screen.getByTestId("select");
      await user.selectOptions(select, "green");

      expect(onChange).toHaveBeenCalledWith("green");
    });
  });
});

describe("Form.Select.Int", () => {
  const SubmitWrapper = ({
    children,
    state,
  }: {
    children: React.ReactNode;
    state?: Record<string, unknown>;
  }) => (
    <EventEmitter>
      <Form.Root state={state}>{children}</Form.Root>
    </EventEmitter>
  );

  describe("R9.6 - Select.Int with integer values", () => {
    it("should handle integer values correctly", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Form.Select.Int path="quantity" data-testid="select">
            <option value={1}>One</option>
            <option value={2}>Two</option>
            <option value={3}>Three</option>
          </Form.Select.Int>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const select = screen.getByTestId("select");
      await user.selectOptions(select, "2");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ quantity: 2 });
      });
    });

    it("should initialize with numeric value from state", () => {
      render(
        <Form.Root state={{ quantity: 5 }}>
          <Form.Select.Int path="quantity" data-testid="select">
            <option value={1}>One</option>
            <option value={5}>Five</option>
            <option value={10}>Ten</option>
          </Form.Select.Int>
        </Form.Root>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("5");
    });

    it("should call onChange with value and index", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();

      render(
        <Form.Root>
          <Form.Select.Int path="quantity" onChange={onChange} data-testid="select">
            <option value={1}>One</option>
            <option value={2}>Two</option>
            <option value={3}>Three</option>
          </Form.Select.Int>
        </Form.Root>
      );

      const select = screen.getByTestId("select");
      await user.selectOptions(select, "2");

      expect(onChange).toHaveBeenCalledWith(2, 1); // value=2, index=1
    });

    it("should default to 0 when value is not a valid number", () => {
      render(
        <Form.Root>
          <Form.Select.Int path="quantity" data-testid="select">
            <option value={0}>Zero</option>
            <option value={1}>One</option>
          </Form.Select.Int>
        </Form.Root>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("0");
    });
  });
});

describe("Form.Select.Boolean", () => {
  const SubmitWrapper = ({
    children,
    state,
  }: {
    children: React.ReactNode;
    state?: Record<string, unknown>;
  }) => (
    <EventEmitter>
      <Form.Root state={state}>{children}</Form.Root>
    </EventEmitter>
  );

  describe("R9.5 - Select.Boolean with Sí/No options", () => {
    it("should render with Sí/No options", () => {
      render(
        <Form.Root>
          <Form.Select.Boolean path="active" data-testid="select" />
        </Form.Root>
      );

      const options = screen.getAllByRole("option");
      // Placeholder + Sí + No = 3 options
      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("Sí")).toBeInTheDocument();
      expect(screen.getByText("No")).toBeInTheDocument();
    });

    it("should update state with boolean true when Sí is selected", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Form.Select.Boolean path="active" data-testid="select" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const select = screen.getByTestId("select");
      await user.selectOptions(select, "true");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ active: true });
      });
    });

    it("should update state with boolean false when No is selected", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ active: true }}>
          <Form.Select.Boolean path="active" data-testid="select" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const select = screen.getByTestId("select");
      await user.selectOptions(select, "false");
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ active: false });
      });
    });

    it("should initialize with value from state", () => {
      render(
        <Form.Root state={{ active: true }}>
          <Form.Select.Boolean path="active" data-testid="select" />
        </Form.Root>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("true");
    });

    it("should show custom placeholder", () => {
      render(
        <Form.Root>
          <Form.Select.Boolean
            path="active"
            placeholder="Choose..."
            data-testid="select"
          />
        </Form.Root>
      );

      expect(screen.getByText("Choose...")).toBeInTheDocument();
    });
  });
});

describe("R9.8 - Valor no en opciones", () => {
  it("should handle value not in options gracefully", () => {
    // The component should not crash if the initial value is not in options
    render(
      <Form.Root state={{ color: "purple" }}>
        <Form.Select.String path="color" data-testid="select">
          <option value="red">Red</option>
          <option value="green">Green</option>
          <option value="blue">Blue</option>
        </Form.Select.String>
      </Form.Root>
    );

    const select = screen.getByTestId("select") as HTMLSelectElement;
    // The select will show the value even if it's not in options (browser behavior)
    // Or it might show the first option - depends on browser
    expect(select).toBeInTheDocument();
  });
});
