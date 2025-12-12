import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "./index";
import * as Input from "./Input";
import { Submit } from "./Submit";
import { useInputArray } from "./hooks";
import EventEmitter from "@/components/util/event-emitter";

describe("Form.Scope Nested Paths", () => {
  it("should handle nested paths using Form.Scope", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EventEmitter>
        <Form.Root>
          <Form.Scope path="person">
            <Input.Text path="firstName" data-testid="input" />
          </Form.Scope>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
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

  it("should handle deeply nested paths using multiple Form.Scope", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <EventEmitter>
        <Form.Root>
          <Form.Scope path="user">
            <Form.Scope path="profile">
              <Input.Text path="name" data-testid="input" />
            </Form.Scope>
          </Form.Scope>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
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

  it("should compose Form.Scope with useInputArray and submit values", async () => {
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
        <Form.Root state={{ categories: [{ name: "A" }, { name: "B" }] }}>
          <Form.Scope path="categories">
            <Categories />
          </Form.Scope>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </Form.Root>
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

  describe("Form.Scope autoCleanup", () => {
    it("should NOT remove values when Form.Scope unmounts by default", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      let showSection = true;

      const { rerender } = render(
        <EventEmitter>
          <Form.Root state={{ main: { value: "main" } }}>
            {showSection && (
              <Form.Scope path="section">
                <Input.Text
                  path="field"
                  defaultValue="test"
                  materialize
                  data-testid="field"
                />
              </Form.Scope>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
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
          <Form.Root state={{ main: { value: "main" } }}>
            {showSection && (
              <Form.Scope path="section">
                <Input.Text
                  path="field"
                  defaultValue="test"
                  materialize
                  data-testid="field"
                />
              </Form.Scope>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
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

    it("should remove entire subtree when Form.Scope unmounts with autoCleanup", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      let showSection = true;

      const { rerender } = render(
        <EventEmitter>
          <Form.Root state={{ main: { value: "main" } }}>
            {showSection && (
              <Form.Scope path="section" autoCleanup>
                <Input.Text
                  path="field1"
                  defaultValue="one"
                  materialize
                  data-testid="field1"
                />
                <Input.Text
                  path="field2"
                  defaultValue="two"
                  materialize
                  data-testid="field2"
                />
              </Form.Scope>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
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
          <Form.Root state={{ main: { value: "main" } }}>
            {showSection && (
              <Form.Scope path="section" autoCleanup>
                <Input.Text
                  path="field1"
                  defaultValue="one"
                  materialize
                  data-testid="field1"
                />
                <Input.Text
                  path="field2"
                  defaultValue="two"
                  materialize
                  data-testid="field2"
                />
              </Form.Scope>
            )}
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
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

    it("should handle nested Form.Scope with autoCleanup", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      let showNested = true;

      const { rerender } = render(
        <EventEmitter>
          <Form.Root>
            <Form.Scope path="parent">
              <Input.Text
                path="parentField"
                defaultValue="parent"
                materialize
                data-testid="parent"
              />
              {showNested && (
                <Form.Scope path="child" autoCleanup>
                  <Input.Text
                    path="childField"
                    defaultValue="child"
                    materialize
                    data-testid="child"
                  />
                </Form.Scope>
              )}
            </Form.Scope>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
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
          <Form.Root>
            <Form.Scope path="parent">
              <Input.Text
                path="parentField"
                defaultValue="parent"
                materialize
                data-testid="parent"
              />
              {showNested && (
                <Form.Scope path="child" autoCleanup>
                  <Input.Text
                    path="childField"
                    defaultValue="child"
                    materialize
                    data-testid="child"
                  />
                </Form.Scope>
              )}
            </Form.Scope>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
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
