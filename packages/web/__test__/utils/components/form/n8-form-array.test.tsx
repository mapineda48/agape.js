import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

/**
 * N8. Form.Array Component Tests
 *
 * Tests for the Form.Array component:
 * - Basic array rendering
 * - append, prepend, insert operations
 * - remove, clear operations
 * - move, swap operations
 * - replace, set operations
 * - Array with objects
 * - Metadata access
 * - Validation with arrays
 */

describe("N8. Form.Array Component", () => {
  describe("N8.1 - Basic array rendering", () => {
    it("should render array items", () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ tags: ["one", "two", "three"] }} schema={schema}>
            <Form.Array name="tags">
              {(fields) => (
                <div data-testid="list">
                  {fields.map((field) => (
                    <span key={field.key} data-testid={`item-${field.index}`}>
                      Index: {field.index}
                    </span>
                  ))}
                </div>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("item-0")).toBeInTheDocument();
      expect(screen.getByTestId("item-1")).toBeInTheDocument();
      expect(screen.getByTestId("item-2")).toBeInTheDocument();
    });

    it("should render empty array", () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ tags: [] }} schema={schema}>
            <Form.Array name="tags">
              {(fields, _ops, meta) => (
                <div>
                  <span data-testid="count">{meta.length}</span>
                  <span data-testid="empty">{meta.isEmpty ? "yes" : "no"}</span>
                </div>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("count")).toHaveTextContent("0");
      expect(screen.getByTestId("empty")).toHaveTextContent("yes");
    });

    it("should provide stable keys for items", () => {
      const schema = z.object({
        tags: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ tags: ["a", "b"] }} schema={schema}>
            <Form.Array name="tags">
              {(fields) => (
                <div>
                  {fields.map((field) => (
                    <span key={field.key} data-testid={`key-${field.index}`}>
                      {field.key}
                    </span>
                  ))}
                </div>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      const key0 = screen.getByTestId("key-0").textContent;
      const key1 = screen.getByTestId("key-1").textContent;

      expect(key0).toBeDefined();
      expect(key1).toBeDefined();
      expect(key0).not.toBe(key1);
    });
  });

  describe("N8.2 - append operation", () => {
    it("should add items to the end of the array", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ tags: ["initial"] }} schema={schema}>
            <Form.Array name="tags">
              {(fields, { append }) => (
                <div>
                  <span data-testid="count">{fields.length}</span>
                  <button
                    type="button"
                    data-testid="add"
                    onClick={() => append("new")}
                  >
                    Add
                  </button>
                </div>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("count")).toHaveTextContent("1");

      await user.click(screen.getByTestId("add"));

      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("2");
      });
    });

    it("should add multiple items at once", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ tags: [] }} schema={schema}>
            <Form.Array name="tags">
              {(fields, { append }) => (
                <div>
                  <span data-testid="count">{fields.length}</span>
                  <button
                    type="button"
                    data-testid="add"
                    onClick={() => append("a", "b", "c")}
                  >
                    Add
                  </button>
                </div>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("add"));

      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("3");
      });
    });
  });

  describe("N8.3 - prepend operation", () => {
    it("should add items to the beginning of the array", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["existing"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(fields, { prepend }) => (
                <div>
                  {fields.map((field) => (
                    <Form.Text
                      key={field.key}
                      path={field.path}
                      data-testid={`input-${field.index}`}
                    />
                  ))}
                  <button
                    type="button"
                    data-testid="prepend"
                    onClick={() => prepend("first")}
                  >
                    Prepend
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("prepend"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["first", "existing"],
        });
      });
    });
  });

  describe("N8.4 - insert operation", () => {
    it("should insert item at specific index", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["a", "c"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(fields, { insert }) => (
                <div>
                  <span data-testid="count">{fields.length}</span>
                  <button
                    type="button"
                    data-testid="insert"
                    onClick={() => insert(1, "b")}
                  >
                    Insert at 1
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("insert"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["a", "b", "c"],
        });
      });
    });
  });

  describe("N8.5 - remove operation", () => {
    it("should remove item at specific index", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["a", "b", "c"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(fields, { remove }) => (
                <div>
                  {fields.map((field) => (
                    <div key={field.key}>
                      <button
                        type="button"
                        data-testid={`remove-${field.index}`}
                        onClick={() => remove(field.index)}
                      >
                        Remove {field.index}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      // Remove middle item
      await user.click(screen.getByTestId("remove-1"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["a", "c"],
        });
      });
    });

    it("should remove multiple items at once", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["a", "b", "c", "d"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(fields, { remove }) => (
                <div>
                  <span data-testid="count">{fields.length}</span>
                  <button
                    type="button"
                    data-testid="remove-multi"
                    onClick={() => remove(0, 2)}
                  >
                    Remove 0 and 2
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("remove-multi"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["b", "d"],
        });
      });
    });
  });

  describe("N8.6 - clear operation", () => {
    it("should remove all items from the array", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ tags: ["a", "b", "c"] }} schema={schema}>
            <Form.Array name="tags">
              {(fields, { clear }, meta) => (
                <div>
                  <span data-testid="count">{meta.length}</span>
                  <span data-testid="empty">{meta.isEmpty ? "yes" : "no"}</span>
                  <button type="button" data-testid="clear" onClick={clear}>
                    Clear
                  </button>
                </div>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("count")).toHaveTextContent("3");
      expect(screen.getByTestId("empty")).toHaveTextContent("no");

      await user.click(screen.getByTestId("clear"));

      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("0");
        expect(screen.getByTestId("empty")).toHaveTextContent("yes");
      });
    });
  });

  describe("N8.7 - move operation", () => {
    it("should move item from one index to another", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["a", "b", "c"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(_fields, { move }) => (
                <div>
                  <button
                    type="button"
                    data-testid="move"
                    onClick={() => move(0, 2)}
                  >
                    Move 0 to 2
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("move"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["b", "c", "a"],
        });
      });
    });
  });

  describe("N8.8 - swap operation", () => {
    it("should swap two items by index", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["a", "b", "c"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(_fields, { swap }) => (
                <div>
                  <button
                    type="button"
                    data-testid="swap"
                    onClick={() => swap(0, 2)}
                  >
                    Swap 0 and 2
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("swap"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["c", "b", "a"],
        });
      });
    });
  });

  describe("N8.9 - replace operation", () => {
    it("should replace item at specific index", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["a", "b", "c"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(_fields, { replace }) => (
                <div>
                  <button
                    type="button"
                    data-testid="replace"
                    onClick={() => replace(1, "replaced")}
                  >
                    Replace 1
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("replace"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["a", "replaced", "c"],
        });
      });
    });
  });

  describe("N8.10 - set operation", () => {
    it("should replace entire array", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        tags: z.array(z.string()),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ tags: ["old1", "old2"] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="tags">
              {(_fields, { set }) => (
                <div>
                  <button
                    type="button"
                    data-testid="set"
                    onClick={() => set(["new1", "new2", "new3"])}
                  >
                    Set New
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      await user.click(screen.getByTestId("set"));
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          tags: ["new1", "new2", "new3"],
        });
      });
    });
  });

  describe("N8.11 - Array with objects", () => {
    it("should work with array of objects", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        users: z.array(
          z.object({
            name: z.string().min(1),
            email: z.string().email(),
          })
        ),
      });
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root
            state={{ users: [{ name: "", email: "" }] }}
            schema={schema}
            mode="onSubmit"
          >
            <Form.Array name="users">
              {(fields, { append }) => (
                <div>
                  {fields.map((field) => (
                    <Form.Scope key={field.key} path={field.index}>
                      <Form.Text path="name" data-testid={`name-${field.index}`} />
                      <Form.Text path="email" data-testid={`email-${field.index}`} />
                    </Form.Scope>
                  ))}
                  <button
                    type="button"
                    data-testid="add"
                    onClick={() => append({ name: "", email: "" })}
                  >
                    Add User
                  </button>
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      // Fill first user
      await user.type(screen.getByTestId("name-0"), "John");
      await user.type(screen.getByTestId("email-0"), "john@example.com");

      // Add second user
      await user.click(screen.getByTestId("add"));

      await waitFor(() => {
        expect(screen.getByTestId("name-1")).toBeInTheDocument();
      });

      // Fill second user
      await user.type(screen.getByTestId("name-1"), "Jane");
      await user.type(screen.getByTestId("email-1"), "jane@example.com");

      // Submit
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          users: [
            { name: "John", email: "john@example.com" },
            { name: "Jane", email: "jane@example.com" },
          ],
        });
      });
    });
  });

  describe("N8.12 - Array metadata", () => {
    it("should provide accurate length", () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ items: ["a", "b", "c", "d", "e"] }} schema={schema}>
            <Form.Array name="items">
              {(_fields, _ops, meta) => (
                <span data-testid="length">{meta.length}</span>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("length")).toHaveTextContent("5");
    });

    it("should provide isEmpty flag", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        items: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ items: [] }} schema={schema}>
            <Form.Array name="items">
              {(_fields, ops, meta) => (
                <div>
                  <span data-testid="empty">{meta.isEmpty ? "yes" : "no"}</span>
                  <button type="button" onClick={() => ops.append("item")}>
                    Add
                  </button>
                </div>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      // Initially empty
      expect(screen.getByTestId("empty")).toHaveTextContent("yes");

      // Add an item
      await user.click(screen.getByRole("button", { name: "Add" }));

      // Now not empty
      await waitFor(() => {
        expect(screen.getByTestId("empty")).toHaveTextContent("no");
      });
    });

    it("should provide path", () => {
      const schema = z.object({
        items: z.array(z.string()),
      });

      render(
        <EventEmitter>
          <Form.Root state={{ items: ["a"] }} schema={schema}>
            <Form.Array name="items">
              {(_fields, _ops, meta) => (
                <span data-testid="path">{meta.path}</span>
              )}
            </Form.Array>
          </Form.Root>
        </EventEmitter>
      );

      expect(screen.getByTestId("path")).toHaveTextContent("items");
    });
  });

  describe("N8.13 - Array validation", () => {
    it("should validate array item errors", async () => {
      const user = userEvent.setup();
      const schema = z.object({
        items: z.array(
          z.object({
            value: z.string().min(3, "Must be at least 3 characters"),
          })
        ),
      });

      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <EventEmitter>
          <Form.Root state={{ items: [{ value: "ab" }] }} schema={schema}>
            <Form.Array name="items">
              {(fields) => (
                <div>
                  {fields.map((field) => (
                    <div key={field.key}>
                      <Form.Scope path={String(field.index)}>
                        <Form.Field name="value">
                          <Form.Text data-testid={`input-${field.index}`} />
                          <Form.Error
                            data-testid={`error-${field.index}`}
                            renderEmpty
                          />
                        </Form.Field>
                      </Form.Scope>
                    </div>
                  ))}
                </div>
              )}
            </Form.Array>
            <Submit onSubmit={onSubmit} data-testid="submit">
              Submit
            </Submit>
          </Form.Root>
        </EventEmitter>
      );

      // Initially no error
      expect(screen.getByTestId("error-0")).toBeEmptyDOMElement();

      // Trigger validation via submit
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("error-0")).toHaveTextContent(
          "Must be at least 3 characters"
        );
      });

      // Should not have submitted due to validation error
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
