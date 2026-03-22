import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "#web/utils/components/form";
import * as Input from "#web/utils/components/form/Input";
import Checkbox from "#web/utils/components/form/CheckBox";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";

describe("Form.Root", () => {
  it("should render children", () => {
    render(
      <Form.Root>
        <div data-testid="child">Child</div>
      </Form.Root>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should initialize with state", () => {
    render(
      <Form.Root state={{ name: "Initial" }}>
        <Input.Text path="name" data-testid="input" />
      </Form.Root>,
    );

    const input = screen.getByTestId("input") as HTMLInputElement;
    expect(input.value).toBe("Initial");
  });

  describe("Text Input", () => {
    it("should handle text input changes", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ name: "" }}>
          <Input.Text path="name" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("");

      await user.type(input, "Hello World");
      expect(input.value).toBe("Hello World");
    });

    it("should handle text input clearing", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ name: "Initial Text" }}>
          <Input.Text path="name" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("Initial Text");

      await user.clear(input);
      expect(input.value).toBe("");
    });

    it("should handle text input with special characters", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ description: "" }}>
          <Input.Text path="description" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.type(input, "Test @#$% 123 ñáéíóú");
      expect(input.value).toBe("Test @#$% 123 ñáéíóú");
    });

    it("should handle nested path text input", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ user: { profile: { name: "John" } } }}>
          <Input.Text path="user.profile.name" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("John");

      await user.clear(input);
      await user.type(input, "Jane");
      expect(input.value).toBe("Jane");
    });

    it("should handle multiple text inputs independently", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ firstName: "", lastName: "" }}>
          <Input.Text path="firstName" data-testid="first-name" />
          <Input.Text path="lastName" data-testid="last-name" />
        </Form.Root>,
      );

      const firstName = screen.getByTestId("first-name") as HTMLInputElement;
      const lastName = screen.getByTestId("last-name") as HTMLInputElement;

      await user.type(firstName, "John");
      await user.type(lastName, "Doe");

      expect(firstName.value).toBe("John");
      expect(lastName.value).toBe("Doe");
    });
  });

  describe("Int Input", () => {
    it("should initialize with number value", () => {
      render(
        <Form.Root state={{ age: 25 }}>
          <Input.Int path="age" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("25");
    });

    it("should handle number input changes", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ count: 0 }}>
          <Input.Int path="count" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("0");

      await user.clear(input);
      await user.type(input, "42");
      expect(input.value).toBe("42");
    });

    it("should handle negative numbers", async () => {
      render(
        <Form.Root state={{ temperature: 0 }}>
          <Input.Int path="temperature" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      // Use fireEvent.change for number inputs with negative values
      // userEvent.type types character by character, which doesn't work well
      // with type="number" inputs and the minus sign
      fireEvent.change(input, { target: { value: "-10" } });
      expect(input.value).toBe("-10");
    });

    it("should handle large numbers", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ population: 0 }}>
          <Input.Int path="population" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      await user.clear(input);
      await user.type(input, "1000000");
      expect(input.value).toBe("1000000");
    });

    it("should handle zero value", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ count: 100 }}>
          <Input.Int path="count" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("100");

      await user.clear(input);
      await user.type(input, "0");
      expect(input.value).toBe("0");
    });

    it("should handle nested path number input", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ user: { settings: { notifications: 5 } } }}>
          <Input.Int path="user.settings.notifications" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("5");

      await user.clear(input);
      await user.type(input, "10");
      expect(input.value).toBe("10");
    });
  });

  describe("Checkbox Input", () => {
    it("should initialize with boolean true", () => {
      render(
        <Form.Root state={{ enabled: true }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </Form.Root>,
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("should initialize with boolean false", () => {
      render(
        <Form.Root state={{ enabled: false }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </Form.Root>,
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("should handle checkbox toggle from false to true", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ enabled: false }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </Form.Root>,
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should handle checkbox toggle from true to false", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ enabled: true }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </Form.Root>,
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it("should handle multiple checkbox toggles", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ enabled: false }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </Form.Root>,
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should handle nested path checkbox", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root state={{ user: { settings: { notifications: false } } }}>
          <Checkbox path="user.settings.notifications" data-testid="checkbox" />
        </Form.Root>,
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should handle multiple checkboxes independently", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root
          state={{ notifications: false, newsletter: true, updates: false }}
        >
          <Checkbox path="notifications" data-testid="notifications" />
          <Checkbox path="newsletter" data-testid="newsletter" />
          <Checkbox path="updates" data-testid="updates" />
        </Form.Root>,
      );

      const notifications = screen.getByTestId(
        "notifications",
      ) as HTMLInputElement;
      const newsletter = screen.getByTestId("newsletter") as HTMLInputElement;
      const updates = screen.getByTestId("updates") as HTMLInputElement;

      expect(notifications.checked).toBe(false);
      expect(newsletter.checked).toBe(true);
      expect(updates.checked).toBe(false);

      await user.click(notifications);
      await user.click(newsletter);

      expect(notifications.checked).toBe(true);
      expect(newsletter.checked).toBe(false);
      expect(updates.checked).toBe(false);
    });
  });

  describe("Mixed Input Types", () => {
    it("should handle text, number, and checkbox together", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root
          state={{
            name: "John",
            age: 30,
            active: false,
          }}
        >
          <Input.Text path="name" data-testid="name" />
          <Input.Int path="age" data-testid="age" />
          <Checkbox path="active" data-testid="active" />
        </Form.Root>,
      );

      const nameInput = screen.getByTestId("name") as HTMLInputElement;
      const ageInput = screen.getByTestId("age") as HTMLInputElement;
      const activeCheckbox = screen.getByTestId("active") as HTMLInputElement;

      expect(nameInput.value).toBe("John");
      expect(ageInput.value).toBe("30");
      expect(activeCheckbox.checked).toBe(false);

      await user.clear(nameInput);
      await user.type(nameInput, "Jane");
      await user.clear(ageInput);
      await user.type(ageInput, "25");
      await user.click(activeCheckbox);

      expect(nameInput.value).toBe("Jane");
      expect(ageInput.value).toBe("25");
      expect(activeCheckbox.checked).toBe(true);
    });

    it("should handle complex nested state with mixed types", async () => {
      const user = userEvent.setup();

      render(
        <Form.Root
          state={{
            user: {
              profile: { name: "Alice", age: 28 },
              settings: { notifications: true, theme: "dark" },
            },
          }}
        >
          <Input.Text path="user.profile.name" data-testid="name" />
          <Input.Int path="user.profile.age" data-testid="age" />
          <Checkbox
            path="user.settings.notifications"
            data-testid="notifications"
          />
          <Input.Text path="user.settings.theme" data-testid="theme" />
        </Form.Root>,
      );

      const name = screen.getByTestId("name") as HTMLInputElement;
      const age = screen.getByTestId("age") as HTMLInputElement;
      const notifications = screen.getByTestId(
        "notifications",
      ) as HTMLInputElement;
      const theme = screen.getByTestId("theme") as HTMLInputElement;

      expect(name.value).toBe("Alice");
      expect(age.value).toBe("28");
      expect(notifications.checked).toBe(true);
      expect(theme.value).toBe("dark");

      await user.clear(name);
      await user.type(name, "Bob");
      await user.clear(age);
      await user.type(age, "32");
      await user.click(notifications);
      await user.clear(theme);
      await user.type(theme, "light");

      expect(name.value).toBe("Bob");
      expect(age.value).toBe("32");
      expect(notifications.checked).toBe(false);
      expect(theme.value).toBe("light");
    });
  });

  describe("Default Values", () => {
    it("should use default text value when state is empty", () => {
      render(
        <Form.Root>
          <Input.Text
            path="name"
            defaultValue="Default Name"
            data-testid="input"
          />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("Default Name");
    });

    it("should use default checkbox value when state is empty", () => {
      render(
        <Form.Root>
          <Checkbox
            path="enabled"
            defaultChecked={true}
            data-testid="checkbox"
          />
        </Form.Root>,
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("should use default int value when state is empty", () => {
      render(
        <Form.Root>
          <Input.Int path="count" data-testid="input" />
        </Form.Root>,
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("0");
    });
  });

  describe("Submit", () => {
    // Helper wrapper that provides EventEmitter context
    const SubmitWrapper = ({
      children,
      ...props
    }: React.ComponentProps<typeof Form.Root>) => (
      <EventEmitter>
        <Form.Root {...props}>{children}</Form.Root>
      </EventEmitter>
    );

    it("should submit form with state initialized in provider", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ name: "John", age: 30 }}>
          <Input.Text path="name" data-testid="name" />
          <Input.Int path="age" data-testid="age" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>,
      );

      const submitButton = screen.getByTestId("submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({ name: "John", age: 30 });
      });
    });

    it("should submit form with state initialized by inputs", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ name: "Jane", age: 0, active: true }}>
          <Input.Text path="name" data-testid="name" />
          <Input.Int path="age" data-testid="age" />
          <Checkbox path="active" data-testid="active" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>,
      );

      const submitButton = screen.getByTestId("submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: "Jane",
          age: 0,
          active: true,
        });
      });
    });

    it("should submit form after updating input values", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ name: "", count: 0 }}>
          <Input.Text path="name" data-testid="name" />
          <Input.Int path="count" data-testid="count" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>,
      );

      const nameInput = screen.getByTestId("name") as HTMLInputElement;
      const countInput = screen.getByTestId("count") as HTMLInputElement;
      const submitButton = screen.getByTestId("submit");

      await user.type(nameInput, "Updated Name");
      await user.clear(countInput);
      await user.type(countInput, "42");

      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: "Updated Name",
          count: 42,
        });
      });
    });

    it("should submit form with boolean values", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper state={{ notifications: false, newsletter: true }}>
          <Checkbox path="notifications" data-testid="notifications" />
          <Checkbox path="newsletter" data-testid="newsletter" />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>,
      );

      const notificationsCheckbox = screen.getByTestId("notifications");
      const newsletterCheckbox = screen.getByTestId("newsletter");
      const submitButton = screen.getByTestId("submit");

      await user.click(notificationsCheckbox); // toggle to true
      await user.click(newsletterCheckbox); // toggle to false

      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          notifications: true,
          newsletter: false,
        });
      });
    });

    it("should submit empty form", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      render(
        <SubmitWrapper>
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </SubmitWrapper>,
      );

      const submitButton = screen.getByTestId("submit");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({});
      });
    });
  });
});
