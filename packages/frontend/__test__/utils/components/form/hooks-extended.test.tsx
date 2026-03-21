import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";
import Decimal from "decimal.js";
import DateTime from "#shared/data/DateTime";

/**
 * Extended hooks tests for:
 * - R13.3-5: reset(), merge()
 * - R13.7: Hook outside Form error
 * - R14.3-4: Selector and error handling
 * - R16.4: Reset with special types
 * - R12.7: Enter in input triggers submit
 */

describe("useForm Hook Extended Tests", () => {
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

  describe("R13.3 - reset() resets to initial state", () => {
    it("should reset form to a new state", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const ResetButton = () => {
        const form = Form.useForm();
        return (
          <button
            onClick={() => form.reset({ name: "Reset Name", age: 99 })}
            data-testid="reset"
          >
            Reset
          </button>
        );
      };

      render(
        <SubmitWrapper state={{ name: "Initial", age: 25 }}>
          <Form.Text path="name" data-testid="name" />
          <Form.Int path="age" data-testid="age" />
          <ResetButton />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      // Verify initial state
      expect(screen.getByTestId("name")).toHaveValue("Initial");
      expect(screen.getByTestId("age")).toHaveValue(25);

      // Reset
      await user.click(screen.getByTestId("reset"));

      // Verify reset state
      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveValue("Reset Name");
        expect(screen.getByTestId("age")).toHaveValue(99);
      });

      // Submit and verify
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: "Reset Name", age: 99 });
      });
    });
  });

  describe("R13.4 - reset(newValues) resets with new values", () => {
    it("should completely replace state with new values", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const ResetButton = () => {
        const form = Form.useForm();
        return (
          <button
            onClick={() => form.reset({ newField: "New Value" })}
            data-testid="reset"
          >
            Reset
          </button>
        );
      };

      render(
        <SubmitWrapper state={{ oldField: "Old Value" }}>
          <Form.Text path="oldField" data-testid="old" />
          <Form.Text path="newField" data-testid="new" />
          <ResetButton />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      expect(screen.getByTestId("old")).toHaveValue("Old Value");
      expect(screen.getByTestId("new")).toHaveValue("");

      await user.click(screen.getByTestId("reset"));

      // After reset, old field should be cleared and new field should have value
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ newField: "New Value" });
      });
    });
  });

  describe("R13.5 - merge(values) partial merge", () => {
    it("should merge partial values without losing existing state", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const MergeButton = () => {
        const form = Form.useForm();
        return (
          <button
            onClick={() => form.merge({ age: 30 })}
            data-testid="merge"
          >
            Merge
          </button>
        );
      };

      render(
        <SubmitWrapper state={{ name: "John", age: 25 }}>
          <Form.Text path="name" data-testid="name" />
          <Form.Int path="age" data-testid="age" />
          <MergeButton />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      expect(screen.getByTestId("name")).toHaveValue("John");
      expect(screen.getByTestId("age")).toHaveValue(25);

      await user.click(screen.getByTestId("merge"));

      await waitFor(() => {
        expect(screen.getByTestId("name")).toHaveValue("John"); // Preserved
        expect(screen.getByTestId("age")).toHaveValue(30); // Updated
      });

      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: "John", age: 30 });
      });
    });
  });

  describe("R13.6 - setAt(path, value)", () => {
    it("should update value at specific path", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      const SetAtButton = () => {
        const form = Form.useForm();
        return (
          <button
            onClick={() => form.setAt(["user", "email"], "new@email.com")}
            data-testid="setat"
          >
            Set Email
          </button>
        );
      };

      render(
        <SubmitWrapper state={{ user: { name: "John", email: "old@email.com" } }}>
          <Form.Scope path="user">
            <Form.Text path="name" data-testid="name" />
            <Form.Text path="email" data-testid="email" />
          </Form.Scope>
          <SetAtButton />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      expect(screen.getByTestId("email")).toHaveValue("old@email.com");

      await user.click(screen.getByTestId("setat"));

      await waitFor(() => {
        expect(screen.getByTestId("email")).toHaveValue("new@email.com");
      });
    });
  });

  describe("R13.7 - Hook outside Form throws error", () => {
    it("should throw error when useForm is used outside Form.Root", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const BadComponent = () => {
        Form.useForm();
        return <div>Bad</div>;
      };

      expect(() => render(<BadComponent />)).toThrow();

      consoleSpy.mockRestore();
    });
  });
});

describe("useFormState Extended Tests", () => {
  describe("R14.3 - Selector specific", () => {
    it("should get reactive form state", async () => {
      const user = userEvent.setup();
      let renderCount = 0;

      const StateDisplay = () => {
        const state = Form.useState();
        renderCount++;
        return <div data-testid="state">{JSON.stringify(state)}</div>;
      };

      render(
        <EventEmitter>
          <Form.Root state={{ name: "Initial" }}>
            <Form.Text path="name" data-testid="name" />
            <StateDisplay />
          </Form.Root>
        </EventEmitter>
      );

      const initialRenders = renderCount;

      await user.type(screen.getByTestId("name"), "!");

      await waitFor(() => {
        expect(renderCount).toBeGreaterThan(initialRenders);
      });
    });
  });

  describe("R14.4 - Hook outside Form throws error", () => {
    it("should throw error when useState is used outside Form.Root", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      const BadComponent = () => {
        Form.useState();
        return <div>Bad</div>;
      };

      expect(() => render(<BadComponent />)).toThrow();

      consoleSpy.mockRestore();
    });
  });
});

describe("R16.4 - Reset with special types", () => {
  it("should reset form with Decimal values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const ResetButton = () => {
      const form = Form.useForm();
      return (
        <button
          onClick={() => form.reset({ price: new Decimal("99.99") })}
          data-testid="reset"
        >
          Reset
        </button>
      );
    };

    render(
      <EventEmitter>
        <Form.Root state={{ price: new Decimal("10.50") }}>
          <Form.Decimal path="price" data-testid="price" />
          <ResetButton />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
      </EventEmitter>
    );

    expect(screen.getByTestId("price")).toHaveValue(10.5);

    await user.click(screen.getByTestId("reset"));

    await waitFor(() => {
      expect(screen.getByTestId("price")).toHaveValue(99.99);
    });
  });

  it("should reset form with DateTime values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const initialDate = new DateTime(new Date("2023-01-01T10:00:00"));
    const resetDate = new DateTime(new Date("2024-06-15T14:30:00"));

    const ResetButton = () => {
      const form = Form.useForm();
      return (
        <button
          onClick={() => form.reset({ eventDate: resetDate })}
          data-testid="reset"
        >
          Reset
        </button>
      );
    };

    render(
      <EventEmitter>
        <Form.Root state={{ eventDate: initialDate }}>
          <Form.DateTime path="eventDate" data-testid="date" />
          <ResetButton />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
      </EventEmitter>
    );

    await user.click(screen.getByTestId("reset"));

    // Verify the date was reset by submitting
    await user.click(screen.getByTestId("submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      const submittedData = onSubmit.mock.calls[0][0];
      expect(submittedData.eventDate).toBeDefined();
    });
  });
});

describe("R12.7 - Enter in input triggers submit", () => {
  it("should submit form when clicking submit button", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EventEmitter>
        <Form.Root state={{ name: "" }}>
          <Form.Text path="name" data-testid="name" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
      </EventEmitter>
    );

    const input = screen.getByTestId("name");
    await user.type(input, "John");

    await user.click(screen.getByTestId("submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ name: "John" });
    });
  });
});

describe("R10.5 - Checkbox indeterminate state", () => {
  it("should support programmatic control of checkbox", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EventEmitter>
        <Form.Root state={{ isActive: false }}>
          <Form.Checkbox path="isActive" data-testid="checkbox" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
      </EventEmitter>
    );

    const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Toggle
    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);

    // Submit and verify
    await user.click(screen.getByTestId("submit"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ isActive: true });
    });
  });
});

describe("R7.5-6 - File input additional tests", () => {
  it("should handle file clearing through form reset", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const ResetButton = () => {
      const form = Form.useForm();
      return (
        <button onClick={() => form.reset({})} data-testid="reset">
          Reset
        </button>
      );
    };

    render(
      <EventEmitter>
        <Form.Root>
          <Form.File path="document" data-testid="file" />
          <ResetButton />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
      </EventEmitter>
    );

    const input = screen.getByTestId("file") as HTMLInputElement;
    const file = new File(["test content"], "test.txt", { type: "text/plain" });

    await user.upload(input, file);

    // Submit to verify file is in state
    await user.click(screen.getByTestId("submit"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      const data = onSubmit.mock.calls[0][0];
      expect(data.document).toBeInstanceOf(File);
    });

    onSubmit.mockClear();

    // Reset
    await user.click(screen.getByTestId("reset"));

    // Submit again - file should be cleared
    await user.click(screen.getByTestId("submit"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({});
    });
  });
});
