import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormProvider from "../index";
import * as Select from "./index";
import { Submit } from "../Submit";
import EventEmitter from "@/components/util/event-emitter";

describe("Select Components", () => {
  // Helper wrapper that provides EventEmitter context for Submit
  const SubmitWrapper = ({
    children,
    ...props
  }: React.ComponentProps<typeof FormProvider>) => (
    <EventEmitter>
      <FormProvider {...props}>{children}</FormProvider>
    </EventEmitter>
  );

  describe("Select.Boolean", () => {
    it("should initialize with default value (false)", () => {
      render(
        <FormProvider state={{ isActive: false }}>
          <Select.Boolean path="isActive" data-testid="select" />
        </FormProvider>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("false");
    });

    it("should initialize with true value", () => {
      render(
        <FormProvider state={{ isActive: true }}>
          <Select.Boolean path="isActive" data-testid="select" />
        </FormProvider>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("true");
    });

    it("should update state on change", async () => {
      const user = userEvent.setup();
      render(
        <FormProvider state={{ isActive: false }}>
          <Select.Boolean path="isActive" data-testid="select" />
        </FormProvider>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      await user.selectOptions(select, "true");
      expect(select.value).toBe("true");
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

      const select = screen.getByTestId("select") as HTMLSelectElement;
      const submit = screen.getByTestId("submit");

      await user.selectOptions(select, "true");
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
        <FormProvider state={{ count: 0 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="1">One</option>
          </Select.Int>
        </FormProvider>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("0");
    });

    it("should initialize with provided value", () => {
      render(
        <FormProvider state={{ count: 1 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="1">One</option>
          </Select.Int>
        </FormProvider>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      expect(select.value).toBe("1");
    });

    it("should update state on change", async () => {
      const user = userEvent.setup();
      render(
        <FormProvider state={{ count: 0 }}>
          <Select.Int path="count" data-testid="select">
            <option value="0">Zero</option>
            <option value="5">Five</option>
          </Select.Int>
        </FormProvider>
      );

      const select = screen.getByTestId("select") as HTMLSelectElement;
      await user.selectOptions(select, "5");
      expect(select.value).toBe("5");
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

      const select = screen.getByTestId("select") as HTMLSelectElement;
      const submit = screen.getByTestId("submit");

      await user.selectOptions(select, "10");
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
  });
});
