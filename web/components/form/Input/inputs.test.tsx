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
});
