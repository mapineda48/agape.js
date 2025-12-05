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
          <button
            data-testid="add"
            onClick={() => categories.addItem({ name: "New" })}
          >
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
        categories: [{ name: "A1" }, { name: "B" }, { name: "New Added" }],
      });
    });
  });

  describe("PathProvider autoCleanup", () => {
    it("should NOT remove values when PathProvider unmounts by default", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      let showSection = true;

      const { rerender } = render(
        <EventEmitter>
          <FormProvider state={{ main: { value: "main" } }}>
            {showSection && (
              <PathProvider value="section">
                <Input.Text
                  path="field"
                  value="test"
                  materialize
                  data-testid="field"
                />
              </PathProvider>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </FormProvider>
        </EventEmitter>
      );

      // Submit to verify initial state
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          main: { value: "main" },
          section: { field: "test" },
        });
      });

      onSubmit.mockClear();
      showSection = false;

      // Rerender without the section
      rerender(
        <EventEmitter>
          <FormProvider state={{ main: { value: "main" } }}>
            {showSection && (
              <PathProvider value="section">
                <Input.Text
                  path="field"
                  value="test"
                  materialize
                  data-testid="field"
                />
              </PathProvider>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </FormProvider>
        </EventEmitter>
      );

      // Section should STILL be in state (default behavior)
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          main: { value: "main" },
          section: { field: "test" },
        });
      });
    });

    it("should remove entire subtree when PathProvider unmounts with autoCleanup", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      let showSection = true;

      const { rerender } = render(
        <EventEmitter>
          <FormProvider state={{ main: { value: "main" } }}>
            {showSection && (
              <PathProvider value="section" autoCleanup>
                <Input.Text
                  path="field1"
                  value="one"
                  materialize
                  data-testid="field1"
                />
                <Input.Text
                  path="field2"
                  value="two"
                  materialize
                  data-testid="field2"
                />
              </PathProvider>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </FormProvider>
        </EventEmitter>
      );

      // Submit to verify initial state includes section
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          main: { value: "main" },
          section: { field1: "one", field2: "two" },
        });
      });

      onSubmit.mockClear();
      showSection = false;

      // Rerender without the section (with autoCleanup)
      rerender(
        <EventEmitter>
          <FormProvider state={{ main: { value: "main" } }}>
            {showSection && (
              <PathProvider value="section" autoCleanup>
                <Input.Text
                  path="field1"
                  value="one"
                  materialize
                  data-testid="field1"
                />
                <Input.Text
                  path="field2"
                  value="two"
                  materialize
                  data-testid="field2"
                />
              </PathProvider>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </FormProvider>
        </EventEmitter>
      );

      // Section should be cleaned up
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          main: { value: "main" },
        });
      });
    });

    it("should handle nested PathProviders with autoCleanup", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      let showNested = true;

      const { rerender } = render(
        <EventEmitter>
          <FormProvider>
            <PathProvider value="parent">
              <Input.Text
                path="parentField"
                value="parent"
                materialize
                data-testid="parent"
              />
              {showNested && (
                <PathProvider value="child" autoCleanup>
                  <Input.Text
                    path="childField"
                    value="child"
                    materialize
                    data-testid="child"
                  />
                </PathProvider>
              )}
            </PathProvider>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </FormProvider>
        </EventEmitter>
      );

      // Verify initial state
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          parent: {
            parentField: "parent",
            child: { childField: "child" },
          },
        });
      });

      onSubmit.mockClear();
      showNested = false;

      // Remove nested section
      rerender(
        <EventEmitter>
          <FormProvider>
            <PathProvider value="parent">
              <Input.Text
                path="parentField"
                value="parent"
                materialize
                data-testid="parent"
              />
              {showNested && (
                <PathProvider value="child" autoCleanup>
                  <Input.Text
                    path="childField"
                    value="child"
                    materialize
                    data-testid="child"
                  />
                </PathProvider>
              )}
            </PathProvider>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </FormProvider>
        </EventEmitter>
      );

      // Child should be cleaned up, parent remains
      await user.click(screen.getByTestId("submit"));
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          parent: {
            parentField: "parent",
          },
        });
      });
    });
  });
});
