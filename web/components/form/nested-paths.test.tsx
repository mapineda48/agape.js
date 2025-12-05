import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormProvider from "./index";
import PathProvider from "./paths";
import * as Input from "./Input";
import { Submit } from "./Submit";
import { useInputArray } from "./hooks";
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

  it("should compose PathProvider with useInputArray and submit values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    const Categories = () => {
      const categories = useInputArray<{ name: string }[]>();

      return (
        <div>
          {categories.map((_item, index) => (
            <div key={index}>
              <Input.Text
                path="name"
                data-testid={`category-${index}`}
                aria-label={`Category ${index}`}
              />
            </div>
          ))}
          <button data-testid="add" onClick={() => categories.addItem({ name: "New" })}>
            Add category
          </button>
        </div>
      );
    };

    render(
      <EventEmitter>
        <FormProvider state={{ categories: [{ name: "A" }, { name: "B" }] }}>
          <PathProvider value="categories">
            <Categories />
          </PathProvider>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormProvider>
      </EventEmitter>
    );

    const firstInput = screen.getByTestId("category-0") as HTMLInputElement;
    await user.type(firstInput, "1");

    await user.click(screen.getByTestId("add"));

    const newInput = await screen.findByTestId("category-2");
    await user.type(newInput as HTMLInputElement, " Added");

    await user.click(screen.getByTestId("submit"));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        categories: [
          { name: "A1" },
          { name: "B" },
          { name: "New Added" },
        ],
      });
    });
  });
});
