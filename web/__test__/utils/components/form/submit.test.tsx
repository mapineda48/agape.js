import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useEffect } from "react";
import { Form } from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import { useEvent } from "#web/utils/components/form/provider";
import EventEmitter, {
  useEventEmitter,
} from "#web/utils/components/event-emitter";

describe("Submit component", () => {
  it("should disable the button and notify loading state during submit", async () => {
    const user = userEvent.setup();
    let resolveSubmit!: () => void;

    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );
    const onLoadingChange = vi.fn();

    render(
      <EventEmitter>
        <Form.Root>
          <Submit
            data-testid="submit"
            onSubmit={onSubmit}
            onLoadingChange={onLoadingChange}
          >
            Submit
          </Submit>
        </Form.Root>
      </EventEmitter>,
    );

    const button = screen.getByTestId("submit");

    await user.click(button);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(button).toBeDisabled();
    expect(onLoadingChange).toHaveBeenCalledWith(true);

    resolveSubmit();

    await waitFor(() => expect(button).not.toBeDisabled());
    expect(onLoadingChange).toHaveBeenCalledWith(false);
  });

  it("should recover from submit errors and avoid emitting success", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(undefined);
    const onLoadingChange = vi.fn();
    const onSuccess = vi.fn();

    // Suppress console.error for this test since we're testing error handling
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const SuccessListener = () => {
      const emitter = useEventEmitter();
      const event = useEvent();

      useEffect(() => {
        return emitter.on(event.SUBMIT_SUCCESS, onSuccess);
      }, [emitter, event]);

      return null;
    };

    render(
      <EventEmitter>
        <Form.Root>
          <SuccessListener />
          <Submit
            data-testid="submit"
            onSubmit={onSubmit}
            onLoadingChange={onLoadingChange}
          >
            Submit
          </Submit>
        </Form.Root>
      </EventEmitter>,
    );

    const button = screen.getByTestId("submit");

    await user.click(button);
    await waitFor(() => expect(button).not.toBeDisabled());

    expect(onSuccess).not.toHaveBeenCalled();
    expect(onLoadingChange).toHaveBeenCalledWith(false);

    await user.click(button);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledTimes(2);

    consoleSpy.mockRestore();
  });
});
