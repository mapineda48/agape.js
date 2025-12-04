import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormProvider from "../index";
import Checkbox from "./index";
import { Submit } from "../Submit";
import EventEmitter from "@/components/util/event-emitter";

describe("Checkbox Component", () => {
  const SubmitWrapper = ({
    children,
    ...props
  }: React.ComponentProps<typeof FormProvider>) => (
    <EventEmitter>
      <FormProvider {...props}>{children}</FormProvider>
    </EventEmitter>
  );

  it("should initialize with default value (false)", () => {
    render(
      <FormProvider state={{ isActive: false }}>
        <Checkbox path="isActive" data-testid="checkbox" />
      </FormProvider>
    );

    const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
  });

  it("should initialize with true value", () => {
    render(
      <FormProvider state={{ isActive: true }}>
        <Checkbox path="isActive" data-testid="checkbox" />
      </FormProvider>
    );

    const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it("should update state on toggle", async () => {
    const user = userEvent.setup();
    render(
      <FormProvider state={{ isActive: false }}>
        <Checkbox path="isActive" data-testid="checkbox" />
      </FormProvider>
    );

    const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
    await user.click(checkbox);
    expect(checkbox.checked).toBe(true);

    await user.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it("should submit with correct boolean value", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <SubmitWrapper state={{ isActive: false }}>
        <Checkbox path="isActive" data-testid="checkbox" />
        <Submit onSubmit={onSubmit} data-testid="submit">
          Submit
        </Submit>
      </SubmitWrapper>
    );

    const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
    const submit = screen.getByTestId("submit");

    await user.click(checkbox);
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
        <Checkbox path="isActive" materialize data-testid="checkbox" />
        <Submit onSubmit={onSubmit} data-testid="submit">
          Submit
        </Submit>
      </SubmitWrapper>
    );

    const submit = screen.getByTestId("submit");
    await user.click(submit);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ isActive: false });
    });
  });

  it("should submit without initialization (default true)", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <SubmitWrapper>
        <Checkbox
          path="isActive"
          checked={true}
          materialize
          data-testid="checkbox"
        />
        <Submit onSubmit={onSubmit} data-testid="submit">
          Submit
        </Submit>
      </SubmitWrapper>
    );

    const submit = screen.getByTestId("submit");
    await user.click(submit);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ isActive: true });
    });
  });
});
