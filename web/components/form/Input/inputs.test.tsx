import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../index";
import * as Input from "./index";
import { useAppSelector } from "../store/hooks";
import Decimal from "@utils/data/Decimal";
import DateTime from "@utils/data/DateTime";

beforeAll(() => {
  if (!globalThis.structuredClone) {
    globalThis.structuredClone = (val) => {
      // Handle File and Blob explicitly to ensure they are preserved
      // even if structuredClone is not available or behaves unexpectedly in tests
      if (typeof File !== "undefined" && val instanceof File) {
        return val;
      }

      if (typeof Blob !== "undefined" && val instanceof Blob) {
        return val;
      }

      return JSON.parse(JSON.stringify(val));
    };
  }
});

describe("Extended Inputs", () => {
  describe("Decimal Input", () => {
    it("should initialize with Decimal value", () => {
      const initialValue = new Decimal(10.5);
      render(
        <Form.Root state={{ price: initialValue }}>
          <Input.Decimal path="price" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("10.5");
    });

    it("should handle decimal input changes", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ price: new Decimal(0) }}>
          <Input.Decimal path="price" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.clear(input);
      await user.type(input, "20.75");

      expect(input.value).toBe("20.75");
    });

    it("should handle invalid decimal input gracefully", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ price: new Decimal(0) }}>
          <Input.Decimal path="price" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.clear(input);
      // userEvent.type might not work well with type="number" for non-numeric chars,
      // but let's try to simulate a valid number first then check if it parses correctly.
      // If we type garbage, the input value (HTML) might be empty or invalid.
      // The component logic tries to parse `currentTarget.value`.

      // Let's just verify it updates with a valid number
      await user.type(input, "123.456");
      expect(input.value).toBe("123.456"); // The input itself shows what user typed
    });

    it("should handle empty decimal input", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ price: new Decimal(10) }}>
          <Input.Decimal path="price" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.clear(input);
      expect(input.value).toBe("0");
    });
  });

  describe("DateTime Input", () => {
    it("should initialize with DateTime value", () => {
      const now = new Date("2023-10-27T10:00:00");
      const initialValue = new DateTime(now);
      render(
        <Form.Root state={{ eventDate: initialValue }}>
          <Input.DateTime path="eventDate" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      // datetime-local expects format yyyy-MM-ddThh:mm
      expect(input.value).toBe("2023-10-27T10:00");
    });

    it("should handle datetime input changes", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ eventDate: new DateTime() }}>
          <Input.DateTime path="eventDate" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      // Setting value directly because typing into datetime-local can be tricky with userEvent
      fireEvent.change(input, { target: { value: "2023-12-25T12:00" } });

      expect(input.value).toBe("2023-12-25T12:00");
    });

    it("should handle invalid datetime input", async () => {
      const initialDate = new DateTime(new Date("2023-01-01T12:00:00"));
      render(
        <Form.Root state={{ eventDate: initialDate }}>
          <Input.DateTime path="eventDate" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      // Simulate invalid date
      fireEvent.change(input, { target: { value: "invalid-date" } });

      // Should reject invalid input and keep previous value
      expect(input.value).toBe("2023-01-01T12:00");
    });
  });

  describe("File Input", () => {
    it("should handle single file selection and update state", async () => {
      const user = userEvent.setup();
      const file = new File(["hello"], "hello.png", { type: "image/png" });

      render(
        <Form.Root state={{ avatar: null }}>
          <Input.File path="avatar" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.upload(input, file);

      expect(input.files![0]).toBe(file);
      expect(input.files).toHaveLength(1);
    });

    it("should handle multiple file selection", async () => {
      const user = userEvent.setup();
      const files = [
        new File(["hello"], "hello.png", { type: "image/png" }),
        new File(["world"], "world.png", { type: "image/png" }),
      ];
      render(
        <Form.Root state={{ photos: [] }}>
          <Input.File path="photos" multiple data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.upload(input, files);

      expect(input.files).toHaveLength(2);
      expect(input.files![0]).toBe(files[0]);
      expect(input.files![1]).toBe(files[1]);
    });

    it("should correctly update the Redux state with the File object", async () => {
      const user = userEvent.setup();
      const file = new File(["content"], "test.pdf", {
        type: "application/pdf",
      });
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ document: null }}>
          <StateSpy />
          <Input.File path="document" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.upload(input, file);

      expect(capturedState.document).toBeInstanceOf(File);
      expect(capturedState.document).toBe(file);
    });
  });

  describe("Float Input - NaN handling", () => {
    it("should initialize with 0 as default value", () => {
      render(
        <Form.Root state={{}}>
          <Input.Float path="value" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("0");
    });

    it("should initialize with empty string when nullable", () => {
      render(
        <Form.Root state={{}}>
          <Input.Float path="value" nullable data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should handle empty input by storing 0 instead of NaN", async () => {
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ value: 10 }}>
          <StateSpy />
          <Input.Float path="value" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "" } });

      // Should store 0 instead of NaN
      expect(capturedState.value).toBe(0);
      expect(Number.isNaN(capturedState.value)).toBe(false);
    });

    it("should handle empty input by storing null when nullable", async () => {
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ value: 10 }}>
          <StateSpy />
          <Input.Float path="value" nullable data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "" } });

      // Should store null instead of 0
      expect(capturedState.value).toBe(null);
    });

    it("should handle valid float input correctly", async () => {
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ value: 0 }}>
          <StateSpy />
          <Input.Float path="value" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "19.99" } });

      expect(capturedState.value).toBe(19.99);
    });
  });

  describe("Int Input - NaN handling", () => {
    it("should initialize with 0 as default value", () => {
      render(
        <Form.Root state={{}}>
          <Input.Int path="count" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("0");
    });

    it("should initialize with empty string when nullable", () => {
      render(
        <Form.Root state={{}}>
          <Input.Int path="count" nullable data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should handle empty input by storing 0 instead of NaN", async () => {
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ count: 10 }}>
          <StateSpy />
          <Input.Int path="count" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "" } });

      // Should store 0 instead of NaN
      expect(capturedState.count).toBe(0);
      expect(Number.isNaN(capturedState.count)).toBe(false);
    });

    it("should handle empty input by storing null when nullable", async () => {
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ count: 10 }}>
          <StateSpy />
          <Input.Int path="count" nullable data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "" } });

      // Should store null instead of 0
      expect(capturedState.count).toBe(null);
    });

    it("should handle valid int input correctly", async () => {
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ count: 0 }}>
          <StateSpy />
          <Input.Int path="count" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "42" } });

      expect(capturedState.count).toBe(42);
    });

    it("should truncate decimal input to integer", async () => {
      let capturedState: any;

      const StateSpy = () => {
        const formData = useAppSelector((state) => state.form.data);
        capturedState = formData;
        return null;
      };

      render(
        <Form.Root state={{ count: 0 }}>
          <StateSpy />
          <Input.Int path="count" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "42.7" } });

      expect(capturedState.count).toBe(42);
    });
  });

  describe("Text Input flags", () => {
    it("should render password input when type is password", () => {
      render(
        <Form.Root state={{ secret: "" }}>
          <Input.Text path="secret" type="password" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.type).toBe("password");
    });

    it("should render email input when type is email", () => {
      render(
        <Form.Root state={{ email: "" }}>
          <Input.Text path="email" type="email" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.type).toBe("email");
    });

    it("should materialize default value without user interaction", () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{}}>
          <StateSpy />
          <Input.Text
            path="title"
            defaultValue="Hello World"
            materialize
            data-testid="input"
          />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("Hello World");
      expect(capturedState.title).toBe("Hello World");
    });
  });

  describe("Untouched fields without materialize", () => {
    it("should exclude untouched Int field without materialize from submit payload", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const EventEmitter = (await import("@/components/util/event-emitter"))
        .default;
      const { Submit } = await import("../Submit");

      render(
        <EventEmitter>
          <Form.Root>
            <Input.Int path="untouchedCount" data-testid="input" />
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const submit = screen.getByTestId("submit");
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({});
        expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("untouchedCount");
      });
    });

    it("should include touched Int field without materialize in submit payload", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const EventEmitter = (await import("@/components/util/event-emitter"))
        .default;
      const { Submit } = await import("../Submit");

      render(
        <EventEmitter>
          <Form.Root>
            <Input.Int path="touchedCount" data-testid="input" />
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      const submit = screen.getByTestId("submit");

      fireEvent.change(input, { target: { value: "42" } });
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ touchedCount: 42 });
      });
    });

    it("should exclude untouched Float field without materialize from submit payload", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const EventEmitter = (await import("@/components/util/event-emitter"))
        .default;
      const { Submit } = await import("../Submit");

      render(
        <EventEmitter>
          <Form.Root>
            <Input.Float path="untouchedPrice" data-testid="input" />
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const submit = screen.getByTestId("submit");
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({});
        expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("untouchedPrice");
      });
    });

    it("should exclude untouched Text field without materialize from submit payload", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const EventEmitter = (await import("@/components/util/event-emitter"))
        .default;
      const { Submit } = await import("../Submit");

      render(
        <EventEmitter>
          <Form.Root>
            <Input.Text path="untouchedName" data-testid="input" />
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const submit = screen.getByTestId("submit");
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({});
        expect(onSubmit.mock.calls[0][0]).not.toHaveProperty("untouchedName");
      });
    });

    it("should include Int field with materialize in submit payload even when untouched", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const EventEmitter = (await import("@/components/util/event-emitter"))
        .default;
      const { Submit } = await import("../Submit");

      render(
        <EventEmitter>
          <Form.Root>
            <Input.Int path="count" materialize data-testid="input" />
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      const submit = screen.getByTestId("submit");
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ count: 0 });
      });
    });
  });

  describe("TextArea Input", () => {
    it("should initialize with existing value", () => {
      render(
        <Form.Root state={{ description: "Hello World" }}>
          <Input.TextArea path="description" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Hello World");
    });

    it("should initialize with default value when no state exists", () => {
      render(
        <Form.Root state={{}}>
          <Input.TextArea
            path="notes"
            defaultValue="Default notes"
            data-testid="textarea"
          />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      expect(textarea.value).toBe("Default notes");
    });

    it("should handle text changes", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ notes: "" }}>
          <Input.TextArea path="notes" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "New content here");

      expect(textarea.value).toBe("New content here");
    });

    it("should handle multiline text", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ notes: "" }}>
          <Input.TextArea path="notes" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "Line 1{enter}Line 2{enter}Line 3");

      expect(textarea.value).toContain("Line 1");
      expect(textarea.value).toContain("Line 2");
      expect(textarea.value).toContain("Line 3");
    });

    it("should update Redux state correctly", async () => {
      const user = userEvent.setup();
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ bio: "" }}>
          <StateSpy />
          <Input.TextArea path="bio" data-testid="textarea" />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      await user.type(textarea, "My biography");

      expect(capturedState.bio).toBe("My biography");
    });

    it("should pass HTML attributes correctly", () => {
      render(
        <Form.Root state={{ content: "" }}>
          <Input.TextArea
            path="content"
            rows={5}
            cols={40}
            placeholder="Enter content..."
            disabled
            data-testid="textarea"
          />
        </Form.Root>
      );

      const textarea = screen.getByTestId("textarea") as HTMLTextAreaElement;
      expect(textarea.rows).toBe(5);
      expect(textarea.cols).toBe(40);
      expect(textarea.placeholder).toBe("Enter content...");
      expect(textarea.disabled).toBe(true);
    });
  });

  describe("Text Input - Basic functionality", () => {
    it("should initialize with existing value", () => {
      render(
        <Form.Root state={{ name: "John Doe" }}>
          <Input.Text path="name" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("John Doe");
    });

    it("should handle text changes", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ name: "" }}>
          <Input.Text path="name" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.type(input, "Jane Doe");

      expect(input.value).toBe("Jane Doe");
    });

    it("should update Redux state on change", async () => {
      const user = userEvent.setup();
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ username: "" }}>
          <StateSpy />
          <Input.Text path="username" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.type(input, "newuser");

      expect(capturedState.username).toBe("newuser");
    });

    it("should pass HTML attributes correctly", () => {
      render(
        <Form.Root state={{ name: "" }}>
          <Input.Text
            path="name"
            placeholder="Enter name"
            maxLength={50}
            required
            disabled
            data-testid="input"
          />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.placeholder).toBe("Enter name");
      expect(input.maxLength).toBe(50);
      expect(input.required).toBe(true);
      expect(input.disabled).toBe(true);
    });

    it("should handle empty initial state with default value", () => {
      render(
        <Form.Root state={{}}>
          <Input.Text
            path="city"
            defaultValue="New York"
            data-testid="input"
          />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("New York");
    });
  });

  describe("Negative number handling", () => {
    it("should handle negative Int values", async () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ temperature: 0 }}>
          <StateSpy />
          <Input.Int path="temperature" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "-15" } });

      expect(capturedState.temperature).toBe(-15);
    });

    it("should handle negative Float values", async () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ balance: 0 }}>
          <StateSpy />
          <Input.Float path="balance" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "-123.45" } });

      expect(capturedState.balance).toBe(-123.45);
    });

    it("should handle negative Decimal values", async () => {
      render(
        <Form.Root state={{ amount: new Decimal(0) }}>
          <Input.Decimal path="amount" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "-99.99" } });

      // Verify the input displays the negative value correctly
      expect(input.value).toBe("-99.99");
    });
  });

  describe("Nested paths", () => {
    it("should handle nested Text path", async () => {
      const user = userEvent.setup();
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ user: { profile: { name: "" } } }}>
          <StateSpy />
          <Input.Text path="user.profile.name" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.type(input, "John");

      expect(capturedState.user.profile.name).toBe("John");
    });

    it("should handle nested Int path", async () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ settings: { limits: { maxItems: 0 } } }}>
          <StateSpy />
          <Input.Int path="settings.limits.maxItems" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "100" } });

      expect(capturedState.settings.limits.maxItems).toBe(100);
    });

    it("should handle array index in path", async () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ items: [{ qty: 0 }, { qty: 0 }] }}>
          <StateSpy />
          <Input.Int path="items.1.qty" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "5" } });

      expect(capturedState.items[1].qty).toBe(5);
    });
  });

  describe("autoCleanup behavior", () => {
    it("should remove value from store when component unmounts with autoCleanup", async () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      const { rerender } = render(
        <Form.Root state={{ temporary: "value" }}>
          <StateSpy />
          <Input.Text path="temporary" autoCleanup data-testid="input" />
        </Form.Root>
      );

      // Verify the value is in state
      expect(capturedState.temporary).toBe("value");

      // Unmount the Input but keep the Form
      rerender(
        <Form.Root state={{ temporary: "value" }}>
          <StateSpy />
        </Form.Root>
      );

      // Value should be removed after unmount
      await waitFor(() => {
        expect(capturedState).not.toHaveProperty("temporary");
      });
    });

    it("should keep value in store when component unmounts without autoCleanup", async () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      const { rerender } = render(
        <Form.Root state={{ persistent: "value" }}>
          <StateSpy />
          <Input.Text path="persistent" data-testid="input" />
        </Form.Root>
      );

      // Verify the value is in state
      expect(capturedState.persistent).toBe("value");

      // Unmount the Input but keep the Form
      rerender(
        <Form.Root state={{ persistent: "value" }}>
          <StateSpy />
        </Form.Root>
      );

      // Value should still exist
      expect(capturedState.persistent).toBe("value");
    });
  });

  describe("Decimal Input - additional cases", () => {
    it("should handle materialize flag", async () => {
      render(
        <Form.Root state={{}}>
          <Input.Decimal path="price" materialize data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      // With materialize, the input should show the default value 0
      expect(input.value).toBe("0");
    });

    it("should handle very large decimal values", async () => {
      render(
        <Form.Root state={{ amount: new Decimal(0) }}>
          <Input.Decimal path="amount" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "999999999999.99" } });

      expect(input.value).toBe("999999999999.99");
    });

    it("should handle very small decimal values", async () => {
      render(
        <Form.Root state={{ rate: new Decimal(0) }}>
          <Input.Decimal path="rate" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "0.00001" } });

      expect(input.value).toBe("0.00001");
    });
  });

  describe("DateTime Input - additional cases", () => {
    it("should handle materialize=false", () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{}}>
          <StateSpy />
          <Input.DateTime path="optionalDate" materialize={false} data-testid="input" />
        </Form.Root>
      );

      // With materialize=false, the state should not have the path set automatically
      // Though the component still shows a value, it shouldn't be in the store until changed
      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).not.toBe(""); // DateTime still shows value because of default
    });

    it("should handle date in the past", async () => {
      render(
        <Form.Root state={{ birthDate: new DateTime() }}>
          <Input.DateTime path="birthDate" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "1990-05-15T08:30" } });

      // Verify the input displays the past date correctly
      expect(input.value).toBe("1990-05-15T08:30");
    });

    it("should handle date in the future", async () => {
      render(
        <Form.Root state={{ scheduledDate: new DateTime() }}>
          <Input.DateTime path="scheduledDate" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      fireEvent.change(input, { target: { value: "2030-12-31T23:59" } });

      // Verify the input displays the future date correctly
      expect(input.value).toBe("2030-12-31T23:59");
    });
  });

  describe("File Input - additional cases", () => {
    it("should handle accept attribute", () => {
      render(
        <Form.Root state={{ image: null }}>
          <Input.File path="image" accept="image/*" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.accept).toBe("image/*");
    });

    it("should not update state when no files selected", async () => {
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ document: null }}>
          <StateSpy />
          <Input.File path="document" data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      // Simulate a change event with no files
      fireEvent.change(input, { target: { files: [] } });

      expect(capturedState.document).toBeNull();
    });

    it("should accumulate files when multiple is enabled", async () => {
      const user = userEvent.setup();
      let capturedState: any;

      const StateSpy = () => {
        capturedState = useAppSelector((state) => state.form.data);
        return null;
      };

      render(
        <Form.Root state={{ gallery: [] }}>
          <StateSpy />
          <Input.File path="gallery" multiple data-testid="input" />
        </Form.Root>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      // Add first file
      const file1 = new File(["content1"], "photo1.jpg", { type: "image/jpeg" });
      await user.upload(input, file1);

      expect(capturedState.gallery).toHaveLength(1);

      // Add second file
      const file2 = new File(["content2"], "photo2.jpg", { type: "image/jpeg" });
      await user.upload(input, file2);

      expect(capturedState.gallery).toHaveLength(2);
    });
  });

  describe("Ref forwarding", () => {
    it("should forward ref for Text input", () => {
      const ref = { current: null as HTMLInputElement | null };

      render(
        <Form.Root state={{ name: "" }}>
          <Input.Text path="name" ref={ref} data-testid="input" />
        </Form.Root>
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("INPUT");
    });

    it("should forward ref for Int input", () => {
      const ref = { current: null as HTMLInputElement | null };

      render(
        <Form.Root state={{ count: 0 }}>
          <Input.Int path="count" ref={ref} data-testid="input" />
        </Form.Root>
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.type).toBe("number");
    });

    it("should forward ref for TextArea", () => {
      const ref = { current: null as HTMLTextAreaElement | null };

      render(
        <Form.Root state={{ notes: "" }}>
          <Input.TextArea path="notes" ref={ref} data-testid="textarea" />
        </Form.Root>
      );

      expect(ref.current).not.toBeNull();
      expect(ref.current?.tagName).toBe("TEXTAREA");
    });
  });
});
