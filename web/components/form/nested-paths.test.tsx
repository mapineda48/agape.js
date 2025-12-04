import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormProvider from "./index";
import PathProvider from "./paths";
import * as Input from "./Input";
import { Submit } from "./Submit";
import EventEmitter from "@/components/util/event-emitter";

describe("PathProvider Nested Paths", () => {
  it("should handle nested paths using PathProvider", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EventEmitter>
        <FormProvider>
          <PathProvider value="person">
            <Input.Text path="firstName" data-testid="input" />
          </PathProvider>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormProvider>
      </EventEmitter>
    );

    const input = screen.getByTestId("input") as HTMLInputElement;
    const submitButton = screen.getByTestId("submit");

    await user.type(input, "foo");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        person: {
          firstName: "foo",
        },
      });
    });
  });

  it("should handle deeply nested paths using multiple PathProviders", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EventEmitter>
        <FormProvider>
          <PathProvider value="user">
            <PathProvider value="profile">
              <Input.Text path="name" data-testid="input" />
            </PathProvider>
          </PathProvider>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormProvider>
      </EventEmitter>
    );

    const input = screen.getByTestId("input") as HTMLInputElement;
    const submitButton = screen.getByTestId("submit");

    await user.type(input, "Alice");
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        user: {
          profile: {
            name: "Alice",
          },
        },
      });
    });
  });
});
