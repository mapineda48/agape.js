import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormProvider from "./index";
import * as Input from "./Input";
import Checkbox from "./CheckBox";

describe("FormProvider", () => {
  it("should render children", () => {
    render(
      <FormProvider>
        <div data-testid="child">Child</div>
      </FormProvider>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });

  it("should initialize with state", () => {
    render(
      <FormProvider state={{ name: "Initial" }}>
        <Input.Text path="name" data-testid="input" />
      </FormProvider>
    );

    const input = screen.getByTestId("input") as HTMLInputElement;
    expect(input.value).toBe("Initial");
  });

  describe("Text Input", () => {
    it("should handle text input changes", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ name: "" }}>
          <Input.Text path="name" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("");

      await user.type(input, "Hello World");
      expect(input.value).toBe("Hello World");
    });

    it("should handle text input clearing", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ name: "Initial Text" }}>
          <Input.Text path="name" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("Initial Text");

      await user.clear(input);
      expect(input.value).toBe("");
    });

    it("should handle text input with special characters", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ description: "" }}>
          <Input.Text path="description" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      await user.type(input, "Test @#$% 123 ñáéíóú");
      expect(input.value).toBe("Test @#$% 123 ñáéíóú");
    });

    it("should handle nested path text input", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ user: { profile: { name: "John" } } }}>
          <Input.Text path={["user", "profile", "name"]} data-testid="input" />
        </FormProvider>
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
        <FormProvider state={{ firstName: "", lastName: "" }}>
          <Input.Text path="firstName" data-testid="first-name" />
          <Input.Text path="lastName" data-testid="last-name" />
        </FormProvider>
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
        <FormProvider state={{ age: 25 }}>
          <Input.Int path="age" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("25");
    });

    it("should handle number input changes", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ count: 0 }}>
          <Input.Int path="count" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("0");

      await user.clear(input);
      await user.type(input, "42");
      expect(input.value).toBe("42");
    });

    it("should handle negative numbers", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ temperature: 0 }}>
          <Input.Int path="temperature" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      await user.clear(input);
      await user.type(input, "-10");
      expect(input.value).toBe("-10");
    });

    it("should handle large numbers", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ population: 0 }}>
          <Input.Int path="population" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;

      await user.clear(input);
      await user.type(input, "1000000");
      expect(input.value).toBe("1000000");
    });

    it("should handle zero value", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ count: 100 }}>
          <Input.Int path="count" data-testid="input" />
        </FormProvider>
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
        <FormProvider state={{ user: { settings: { notifications: 5 } } }}>
          <Input.Int
            path={["user", "settings", "notifications"]}
            data-testid="input"
          />
        </FormProvider>
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
        <FormProvider state={{ enabled: true }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </FormProvider>
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("should initialize with boolean false", () => {
      render(
        <FormProvider state={{ enabled: false }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </FormProvider>
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);
    });

    it("should handle checkbox toggle from false to true", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ enabled: false }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </FormProvider>
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should handle checkbox toggle from true to false", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ enabled: true }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </FormProvider>
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it("should handle multiple checkbox toggles", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider state={{ enabled: false }}>
          <Checkbox path="enabled" data-testid="checkbox" />
        </FormProvider>
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
        <FormProvider state={{ user: { settings: { notifications: false } } }}>
          <Checkbox
            path={["user", "settings", "notifications"]}
            data-testid="checkbox"
          />
        </FormProvider>
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);
    });

    it("should handle multiple checkboxes independently", async () => {
      const user = userEvent.setup();

      render(
        <FormProvider
          state={{ notifications: false, newsletter: true, updates: false }}
        >
          <Checkbox path="notifications" data-testid="notifications" />
          <Checkbox path="newsletter" data-testid="newsletter" />
          <Checkbox path="updates" data-testid="updates" />
        </FormProvider>
      );

      const notifications = screen.getByTestId(
        "notifications"
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
        <FormProvider
          state={{
            name: "John",
            age: 30,
            active: false,
          }}
        >
          <Input.Text path="name" data-testid="name" />
          <Input.Int path="age" data-testid="age" />
          <Checkbox path="active" data-testid="active" />
        </FormProvider>
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
        <FormProvider
          state={{
            user: {
              profile: { name: "Alice", age: 28 },
              settings: { notifications: true, theme: "dark" },
            },
          }}
        >
          <Input.Text path={["user", "profile", "name"]} data-testid="name" />
          <Input.Int path={["user", "profile", "age"]} data-testid="age" />
          <Checkbox
            path={["user", "settings", "notifications"]}
            data-testid="notifications"
          />
          <Input.Text
            path={["user", "settings", "theme"]}
            data-testid="theme"
          />
        </FormProvider>
      );

      const name = screen.getByTestId("name") as HTMLInputElement;
      const age = screen.getByTestId("age") as HTMLInputElement;
      const notifications = screen.getByTestId(
        "notifications"
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
        <FormProvider>
          <Input.Text path="name" value="Default Name" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("Default Name");
    });

    it("should use default checkbox value when state is empty", () => {
      render(
        <FormProvider>
          <Checkbox path="enabled" checked={true} data-testid="checkbox" />
        </FormProvider>
      );

      const checkbox = screen.getByTestId("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("should use default int value when state is empty", () => {
      render(
        <FormProvider>
          <Input.Int path="count" data-testid="input" />
        </FormProvider>
      );

      const input = screen.getByTestId("input") as HTMLInputElement;
      expect(input.value).toBe("0");
    });
  });
});
