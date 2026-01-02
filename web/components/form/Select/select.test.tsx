import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "../index";
import * as Select from "./index";
import { Submit } from "../Submit";
import EventEmitter from "@/components/util/event-emitter";

describe("Select Components", () => {
  // Helper wrapper that provides EventEmitter context for Submit
  const SubmitWrapper = ({
    children,
    ...props
  }: React.ComponentProps<typeof Form.Root>) => (
    <EventEmitter>
      <Form.Root {...props}>{children}</Form.Root>
    </EventEmitter>
  );

  const selectOption = async (user: any, testId: string, optionText: string) => {
    const button = screen.getByTestId(testId);
    await user.click(button);
    // As it uses a Portal, we look in document.body or the whole screen
    const option = await screen.findByText(optionText);
    await user.click(option);
  };

  const getSelectValue = (testId: string) => {
    const hiddenInput = screen.getByTestId(`${testId}-hidden`) as HTMLInputElement;
    return hiddenInput.value;
  };

  describe("Select.Boolean", () => {
    it("should initialize with default value (false)", () => {
      render(
        <Form.Root state={{ isActive: false }}>
          <Select.Boolean path="isActive" data-testid="select" />
        </Form.Root>
      );

      expect(getSelectValue("select")).toBe("false");
    });

    it("should initialize with true value", () => {
      render(
        <Form.Root state={{ isActive: true }}>
          <Select.Boolean path="isActive" data-testid="select" />
        </Form.Root>
      );

      expect(getSelectValue("select")).toBe("true");
    });

    it("should update state on change", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ isActive: false }}>
          <Select.Boolean path="isActive" data-testid="select" />
        </Form.Root>
      );

      await selectOption(user, "select", "Sí");
      expect(getSelectValue("select")).toBe("true");
    });

    it("should submit with correct boolean value", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ isActive: false }}>
          <Select.Boolean path="isActive" data-testid="select" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const submit = screen.getByTestId("submit");

      await selectOption(user, "select", "Sí");
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ isActive: true });
      });
    });

    it("should submit without initialization (default false)", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Select.Boolean path="isActive" materialize data-testid="select" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const submit = screen.getByTestId("submit");
      await user.click(submit);

      await waitFor(() => {
        // useInput initializes with false for Select.Boolean if undefined
        expect(onSubmit).toHaveBeenCalledWith({ isActive: false });
      });
    });
  });

  describe("Select.Int", () => {
    it("should initialize with default value (0)", () => {
      render(
        <Form.Root state={{ count: 0 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="1">One</option>
          </Select.Int>
        </Form.Root>
      );

      expect(getSelectValue("select")).toBe("0");
    });

    it("should initialize with provided value", () => {
      render(
        <Form.Root state={{ count: 1 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="1">One</option>
          </Select.Int>
        </Form.Root>
      );

      expect(getSelectValue("select")).toBe("1");
    });

    it("should update state on change", async () => {
      const user = userEvent.setup();
      render(
        <Form.Root state={{ count: 0 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="5">Five</option>
          </Select.Int>
        </Form.Root>
      );

      await selectOption(user, "select", "Five");
      expect(getSelectValue("select")).toBe("5");
    });

    it("should submit with correct integer value", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ count: 0 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="10">Ten</option>
          </Select.Int>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const submit = screen.getByTestId("submit");

      await selectOption(user, "select", "Ten");
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ count: 10 });
      });
    });

    it("should submit without initialization (default 0)", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Select.Int path="count" materialize data-testid="select">
            <option value="0">Zero</option>
            <option value="1">One</option>
          </Select.Int>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>
      );

      const submit = screen.getByTestId("submit");
      await user.click(submit);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ count: 0 });
      });
    });

    it("should fallback to 0 when option value is not a number", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ count: 5 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="abc">Invalid</option>
          </Select.Int>
        </Form.Root>
      );

      const button = screen.getByTestId("select");
      await user.click(button);
      const option = await screen.findByText("Invalid");
      await user.click(option);

      expect(getSelectValue("select")).toBe("0");
    });

    it("should call onChange with parsed number and option index", async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();

      render(
        <Form.Root state={{ count: 0 }}>
          <Select.Int path="count" onChange={handleChange} data-testid="select">
            <option value="0">Zero</option>
            <option value="10">Ten</option>
          </Select.Int>
        </Form.Root>
      );

      await selectOption(user, "select", "Ten");

      expect(handleChange).toHaveBeenCalledWith(10, 1);
    });
  });
});
