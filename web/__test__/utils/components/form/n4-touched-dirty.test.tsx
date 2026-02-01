import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import Form from "#web/utils/components/form";
import { Submit } from "#web/utils/components/form/Submit";
import EventEmitter from "#web/utils/components/event-emitter";
import {
  useValidationActions,
  useFieldTouched,
  useFieldDirty,
  useFieldState,
  useFormSubmitCount,
  useFormErrors,
} from "#web/utils/components/form/validation";

/**
 * N4. Touched/Dirty State Management
 *
 * Tests for tracking field interaction states:
 * - touched: field has been focused and blurred
 * - dirty: field value differs from initial value
 * - Form-level tracking of touched/dirty fields
 */

describe("N4. Touched/Dirty State Management", () => {
  const schema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters"),
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FormWrapper = ({
    children,
    state,
    mode = "onBlur",
  }: {
    children: React.ReactNode;
    state?: any;
    mode?: "onSubmit" | "onBlur" | "onChange" | "onTouched";
  }) => (
    <EventEmitter>
      <Form.Root state={state} schema={schema} mode={mode}>
        {children}
      </Form.Root>
    </EventEmitter>
  );

  describe("N4.1 - useFieldTouched hook", () => {
    it("should be false initially", () => {
      function TouchedDisplay() {
        const isTouched = useFieldTouched("email");
        return (
          <span data-testid="touched">
            {isTouched ? "touched" : "not touched"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <TouchedDisplay />
        </FormWrapper>
      );

      expect(screen.getByTestId("touched")).toHaveTextContent("not touched");
    });

    it("should become true after blur", async () => {
      const user = userEvent.setup();

      function TouchedDisplay() {
        const isTouched = useFieldTouched("email");
        return (
          <span data-testid="touched">
            {isTouched ? "touched" : "not touched"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <TouchedDisplay />
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      // Initially not touched
      expect(screen.getByTestId("touched")).toHaveTextContent("not touched");

      // Focus and blur
      await user.click(screen.getByTestId("email"));
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("touched");
      });
    });

    it("should remain touched after multiple interactions", async () => {
      const user = userEvent.setup();

      function TouchedDisplay() {
        const isTouched = useFieldTouched("email");
        return (
          <span data-testid="touched">
            {isTouched ? "touched" : "not touched"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <TouchedDisplay />
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      // Touch the field
      await user.click(screen.getByTestId("email"));
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("touched");
      });

      // Interact again
      await user.click(screen.getByTestId("email"));
      await user.type(screen.getByTestId("email"), "test");
      await user.click(screen.getByTestId("blur"));

      // Should still be touched
      expect(screen.getByTestId("touched")).toHaveTextContent("touched");
    });
  });

  describe("N4.2 - useFieldDirty hook", () => {
    it("should be false initially", () => {
      function DirtyDisplay() {
        const isDirty = useFieldDirty("email");
        return (
          <span data-testid="dirty">{isDirty ? "dirty" : "not dirty"}</span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <DirtyDisplay />
        </FormWrapper>
      );

      expect(screen.getByTestId("dirty")).toHaveTextContent("not dirty");
    });

    it("should become true after value change", async () => {
      const user = userEvent.setup();

      function DirtyDisplay() {
        const isDirty = useFieldDirty("email");
        return (
          <span data-testid="dirty">{isDirty ? "dirty" : "not dirty"}</span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <DirtyDisplay />
        </FormWrapper>
      );

      // Initially not dirty
      expect(screen.getByTestId("dirty")).toHaveTextContent("not dirty");

      // Type something
      await user.type(screen.getByTestId("email"), "test@example.com");

      await waitFor(() => {
        expect(screen.getByTestId("dirty")).toHaveTextContent("dirty");
      });
    });
  });

  describe("N4.3 - setTouched action", () => {
    it("should allow programmatic setting of touched state", async () => {
      const user = userEvent.setup();

      function SetTouchedButton() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="set-touched"
            onClick={() => actions.setTouched("email", true)}
          >
            Set Touched
          </button>
        );
      }

      function TouchedDisplay() {
        const isTouched = useFieldTouched("email");
        return (
          <span data-testid="touched">
            {isTouched ? "touched" : "not touched"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <TouchedDisplay />
          <SetTouchedButton />
        </FormWrapper>
      );

      // Initially not touched
      expect(screen.getByTestId("touched")).toHaveTextContent("not touched");

      // Programmatically set touched
      await user.click(screen.getByTestId("set-touched"));

      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("touched");
      });
    });

    it("should allow clearing touched state", async () => {
      const user = userEvent.setup();

      function TouchedButtons() {
        const actions = useValidationActions();
        return (
          <>
            <button
              type="button"
              data-testid="set-touched"
              onClick={() => actions.setTouched("email", true)}
            >
              Set Touched
            </button>
            <button
              type="button"
              data-testid="clear-touched"
              onClick={() => actions.setTouched("email", false)}
            >
              Clear Touched
            </button>
          </>
        );
      }

      function TouchedDisplay() {
        const isTouched = useFieldTouched("email");
        return (
          <span data-testid="touched">
            {isTouched ? "touched" : "not touched"}
          </span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <TouchedDisplay />
          <TouchedButtons />
        </FormWrapper>
      );

      // Set touched
      await user.click(screen.getByTestId("set-touched"));
      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("touched");
      });

      // Clear touched
      await user.click(screen.getByTestId("clear-touched"));
      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("not touched");
      });
    });
  });

  describe("N4.4 - setDirty action", () => {
    it("should allow programmatic setting of dirty state", async () => {
      const user = userEvent.setup();

      function SetDirtyButton() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="set-dirty"
            onClick={() => actions.setDirty("email", true)}
          >
            Set Dirty
          </button>
        );
      }

      function DirtyDisplay() {
        const isDirty = useFieldDirty("email");
        return (
          <span data-testid="dirty">{isDirty ? "dirty" : "not dirty"}</span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <DirtyDisplay />
          <SetDirtyButton />
        </FormWrapper>
      );

      // Initially not dirty
      expect(screen.getByTestId("dirty")).toHaveTextContent("not dirty");

      // Programmatically set dirty
      await user.click(screen.getByTestId("set-dirty"));

      await waitFor(() => {
        expect(screen.getByTestId("dirty")).toHaveTextContent("dirty");
      });
    });

    it("should allow clearing dirty state", async () => {
      const user = userEvent.setup();

      function DirtyButtons() {
        const actions = useValidationActions();
        return (
          <>
            <button
              type="button"
              data-testid="set-dirty"
              onClick={() => actions.setDirty("email", true)}
            >
              Set Dirty
            </button>
            <button
              type="button"
              data-testid="clear-dirty"
              onClick={() => actions.setDirty("email", false)}
            >
              Clear Dirty
            </button>
          </>
        );
      }

      function DirtyDisplay() {
        const isDirty = useFieldDirty("email");
        return (
          <span data-testid="dirty">{isDirty ? "dirty" : "not dirty"}</span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <DirtyDisplay />
          <DirtyButtons />
        </FormWrapper>
      );

      // Set dirty
      await user.click(screen.getByTestId("set-dirty"));
      await waitFor(() => {
        expect(screen.getByTestId("dirty")).toHaveTextContent("dirty");
      });

      // Clear dirty
      await user.click(screen.getByTestId("clear-dirty"));
      await waitFor(() => {
        expect(screen.getByTestId("dirty")).toHaveTextContent("not dirty");
      });
    });
  });

  describe("N4.5 - useFieldState hook", () => {
    it("should provide combined field state", async () => {
      const user = userEvent.setup();

      function FieldStateDisplay() {
        const state = useFieldState("email");
        return (
          <div>
            <span data-testid="error">{state.error ?? "no error"}</span>
            <span data-testid="touched">
              {state.isTouched ? "touched" : "not touched"}
            </span>
            <span data-testid="dirty">
              {state.isDirty ? "dirty" : "not dirty"}
            </span>
            <span data-testid="has-error">
              {state.hasError ? "has error" : "no error flag"}
            </span>
          </div>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <FieldStateDisplay />
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      // Initially all default
      expect(screen.getByTestId("error")).toHaveTextContent("no error");
      expect(screen.getByTestId("touched")).toHaveTextContent("not touched");
      expect(screen.getByTestId("dirty")).toHaveTextContent("not dirty");
      expect(screen.getByTestId("has-error")).toHaveTextContent("no error flag");

      // Type invalid value and blur
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("error")).toHaveTextContent(
          "Invalid email address"
        );
        expect(screen.getByTestId("touched")).toHaveTextContent("touched");
        expect(screen.getByTestId("dirty")).toHaveTextContent("dirty");
        expect(screen.getByTestId("has-error")).toHaveTextContent("has error");
      });
    });
  });

  describe("N4.6 - Form-level touched/dirty tracking", () => {
    it("should track touched fields at form level", async () => {
      const user = userEvent.setup();

      function FormStateDisplay() {
        const emailTouched = useFieldTouched("email");
        const nameTouched = useFieldTouched("name");
        const touchedCount = (emailTouched ? 1 : 0) + (nameTouched ? 1 : 0);
        return (
          <span data-testid="touched-count">{touchedCount}</span>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <Form.Field name="name">
            <Form.Text data-testid="name" />
          </Form.Field>
          <FormStateDisplay />
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      // Initially no touched fields
      expect(screen.getByTestId("touched-count")).toHaveTextContent("0");

      // Touch email
      await user.click(screen.getByTestId("email"));
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("touched-count")).toHaveTextContent("1");
      });

      // Touch name
      await user.click(screen.getByTestId("name"));
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("touched-count")).toHaveTextContent("2");
      });
    });

    it("should track dirty fields at form level", async () => {
      const user = userEvent.setup();

      function FormStateDisplay() {
        const emailDirty = useFieldDirty("email");
        const nameDirty = useFieldDirty("name");
        const dirtyCount = (emailDirty ? 1 : 0) + (nameDirty ? 1 : 0);
        return <span data-testid="dirty-count">{dirtyCount}</span>;
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <Form.Field name="name">
            <Form.Text data-testid="name" />
          </Form.Field>
          <FormStateDisplay />
        </FormWrapper>
      );

      // Initially no dirty fields
      expect(screen.getByTestId("dirty-count")).toHaveTextContent("0");

      // Modify email
      await user.type(screen.getByTestId("email"), "test");

      await waitFor(() => {
        expect(screen.getByTestId("dirty-count")).toHaveTextContent("1");
      });

      // Modify name
      await user.type(screen.getByTestId("name"), "John");

      await waitFor(() => {
        expect(screen.getByTestId("dirty-count")).toHaveTextContent("2");
      });
    });
  });

  describe("N4.7 - Nested field touched/dirty", () => {
    const nestedSchema = z.object({
      user: z.object({
        profile: z.object({
          firstName: z.string().min(1, "First name required"),
          lastName: z.string().min(1, "Last name required"),
        }),
      }),
    });

    const NestedFormWrapper = ({
      children,
      state,
    }: {
      children: React.ReactNode;
      state?: any;
    }) => (
      <EventEmitter>
        <Form.Root state={state} schema={nestedSchema} mode="onBlur">
          {children}
        </Form.Root>
      </EventEmitter>
    );

    it("should track touched state for nested paths", async () => {
      const user = userEvent.setup();

      function TouchedDisplay() {
        const isTouched = useFieldTouched("user.profile.firstName");
        return (
          <span data-testid="touched">
            {isTouched ? "touched" : "not touched"}
          </span>
        );
      }

      render(
        <NestedFormWrapper
          state={{ user: { profile: { firstName: "", lastName: "" } } }}
        >
          <Form.Scope path="user">
            <Form.Scope path="profile">
              <Form.Field name="firstName">
                <Form.Text data-testid="firstName" />
              </Form.Field>
            </Form.Scope>
          </Form.Scope>
          <TouchedDisplay />
          <button type="button" data-testid="blur">
            Blur
          </button>
        </NestedFormWrapper>
      );

      // Initially not touched
      expect(screen.getByTestId("touched")).toHaveTextContent("not touched");

      // Touch the nested field
      await user.click(screen.getByTestId("firstName"));
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("touched")).toHaveTextContent("touched");
      });
    });

    it("should track dirty state for nested paths", async () => {
      const user = userEvent.setup();

      function DirtyDisplay() {
        const isDirty = useFieldDirty("user.profile.firstName");
        return (
          <span data-testid="dirty">{isDirty ? "dirty" : "not dirty"}</span>
        );
      }

      render(
        <NestedFormWrapper
          state={{ user: { profile: { firstName: "", lastName: "" } } }}
        >
          <Form.Scope path="user">
            <Form.Scope path="profile">
              <Form.Field name="firstName">
                <Form.Text data-testid="firstName" />
              </Form.Field>
            </Form.Scope>
          </Form.Scope>
          <DirtyDisplay />
        </NestedFormWrapper>
      );

      // Initially not dirty
      expect(screen.getByTestId("dirty")).toHaveTextContent("not dirty");

      // Modify the nested field
      await user.type(screen.getByTestId("firstName"), "John");

      await waitFor(() => {
        expect(screen.getByTestId("dirty")).toHaveTextContent("dirty");
      });
    });
  });

  describe("N4.8 - Array field touched/dirty", () => {
    const arraySchema = z.object({
      items: z.array(
        z.object({
          name: z.string().min(1, "Item name required"),
        })
      ),
    });

    const ArrayFormWrapper = ({
      children,
      state,
    }: {
      children: React.ReactNode;
      state?: any;
    }) => (
      <EventEmitter>
        <Form.Root state={state} schema={arraySchema} mode="onBlur">
          {children}
        </Form.Root>
      </EventEmitter>
    );

    it("should track touched state for array item paths", async () => {
      const user = userEvent.setup();

      function TouchedDisplay() {
        const isTouched0 = useFieldTouched("items.0.name");
        const isTouched1 = useFieldTouched("items.1.name");
        return (
          <>
            <span data-testid="touched-0">
              {isTouched0 ? "touched" : "not touched"}
            </span>
            <span data-testid="touched-1">
              {isTouched1 ? "touched" : "not touched"}
            </span>
          </>
        );
      }

      render(
        <ArrayFormWrapper
          state={{ items: [{ name: "" }, { name: "" }] }}
        >
          <Form.Scope path="items">
            <Form.Scope path={0}>
              <Form.Field name="name">
                <Form.Text data-testid="item-0" />
              </Form.Field>
            </Form.Scope>
            <Form.Scope path={1}>
              <Form.Field name="name">
                <Form.Text data-testid="item-1" />
              </Form.Field>
            </Form.Scope>
          </Form.Scope>
          <TouchedDisplay />
          <button type="button" data-testid="blur">
            Blur
          </button>
        </ArrayFormWrapper>
      );

      // Initially not touched
      expect(screen.getByTestId("touched-0")).toHaveTextContent("not touched");
      expect(screen.getByTestId("touched-1")).toHaveTextContent("not touched");

      // Touch only item 0
      await user.click(screen.getByTestId("item-0"));
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(screen.getByTestId("touched-0")).toHaveTextContent("touched");
        expect(screen.getByTestId("touched-1")).toHaveTextContent("not touched");
      });
    });

    it("should track dirty state for array item paths", async () => {
      const user = userEvent.setup();

      function DirtyDisplay() {
        const isDirty0 = useFieldDirty("items.0.name");
        const isDirty1 = useFieldDirty("items.1.name");
        return (
          <>
            <span data-testid="dirty-0">
              {isDirty0 ? "dirty" : "not dirty"}
            </span>
            <span data-testid="dirty-1">
              {isDirty1 ? "dirty" : "not dirty"}
            </span>
          </>
        );
      }

      render(
        <ArrayFormWrapper
          state={{ items: [{ name: "" }, { name: "" }] }}
        >
          <Form.Scope path="items">
            <Form.Scope path={0}>
              <Form.Field name="name">
                <Form.Text data-testid="item-0" />
              </Form.Field>
            </Form.Scope>
            <Form.Scope path={1}>
              <Form.Field name="name">
                <Form.Text data-testid="item-1" />
              </Form.Field>
            </Form.Scope>
          </Form.Scope>
          <DirtyDisplay />
        </ArrayFormWrapper>
      );

      // Initially not dirty
      expect(screen.getByTestId("dirty-0")).toHaveTextContent("not dirty");
      expect(screen.getByTestId("dirty-1")).toHaveTextContent("not dirty");

      // Modify only item 0
      await user.type(screen.getByTestId("item-0"), "Item A");

      await waitFor(() => {
        expect(screen.getByTestId("dirty-0")).toHaveTextContent("dirty");
        expect(screen.getByTestId("dirty-1")).toHaveTextContent("not dirty");
      });
    });
  });

  describe("N4.9 - Submit count tracking", () => {
    it("should track submit attempts", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      function SubmitCountDisplay() {
        const submitCount = useFormSubmitCount();
        return (
          <span data-testid="submit-count">{submitCount}</span>
        );
      }

      render(
        <FormWrapper
          state={{ email: "test@example.com", name: "John" }}
          mode="onSubmit"
        >
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <SubmitCountDisplay />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormWrapper>
      );

      // Initially 0
      expect(screen.getByTestId("submit-count")).toHaveTextContent("0");

      // Submit once
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("submit-count")).toHaveTextContent("1");
      });

      // Submit again
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        expect(screen.getByTestId("submit-count")).toHaveTextContent("2");
      });
    });

    it("should increment submit count even on failed validation", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);

      function SubmitCountDisplay() {
        const submitCount = useFormSubmitCount();
        return (
          <span data-testid="submit-count">{submitCount}</span>
        );
      }

      render(
        <FormWrapper
          state={{ email: "invalid", name: "" }}
          mode="onSubmit"
        >
          <Form.Field name="email">
            <Form.Text data-testid="email" />
            <Form.Error data-testid="email-error" />
          </Form.Field>
          <SubmitCountDisplay />
          <Submit onSubmit={onSubmit} data-testid="submit">
            Submit
          </Submit>
        </FormWrapper>
      );

      // Initially 0
      expect(screen.getByTestId("submit-count")).toHaveTextContent("0");

      // Submit with invalid data
      await user.click(screen.getByTestId("submit"));

      await waitFor(() => {
        // Submit count should still increment
        expect(screen.getByTestId("submit-count")).toHaveTextContent("1");
        // But validation should have failed
        expect(screen.getByTestId("email-error")).toHaveTextContent(
          "Invalid email address"
        );
        // onSubmit should not have been called
        expect(onSubmit).not.toHaveBeenCalled();
      });
    });
  });

  describe("N4.10 - resetValidation action", () => {
    it("should reset all validation state including touched/dirty", async () => {
      const user = userEvent.setup();

      function ResetButton() {
        const actions = useValidationActions();
        return (
          <button
            type="button"
            data-testid="reset"
            onClick={() => actions.resetValidation()}
          >
            Reset
          </button>
        );
      }

      function StateDisplay() {
        const emailTouched = useFieldTouched("email");
        const nameTouched = useFieldTouched("name");
        const emailDirty = useFieldDirty("email");
        const nameDirty = useFieldDirty("name");
        const errors = useFormErrors();
        
        const touchedCount = (emailTouched ? 1 : 0) + (nameTouched ? 1 : 0);
        const dirtyCount = (emailDirty ? 1 : 0) + (nameDirty ? 1 : 0);
        const errorCount = Object.keys(errors).length;

        return (
          <div>
            <span data-testid="touched-count">{touchedCount}</span>
            <span data-testid="dirty-count">{dirtyCount}</span>
            <span data-testid="error-count">{errorCount}</span>
          </div>
        );
      }

      render(
        <FormWrapper state={{ email: "", name: "" }}>
          <Form.Field name="email">
            <Form.Text data-testid="email" />
          </Form.Field>
          <Form.Field name="name">
            <Form.Text data-testid="name" />
          </Form.Field>
          <StateDisplay />
          <ResetButton />
          <button type="button" data-testid="blur">
            Blur
          </button>
        </FormWrapper>
      );

      // Initially all 0
      expect(screen.getByTestId("touched-count")).toHaveTextContent("0");
      expect(screen.getByTestId("dirty-count")).toHaveTextContent("0");
      expect(screen.getByTestId("error-count")).toHaveTextContent("0");

      // Make fields dirty and touched (and trigger errors)
      await user.type(screen.getByTestId("email"), "invalid");
      await user.click(screen.getByTestId("blur"));
      await user.type(screen.getByTestId("name"), "a");
      await user.click(screen.getByTestId("blur"));

      await waitFor(() => {
        expect(Number(screen.getByTestId("touched-count").textContent)).toBeGreaterThan(0);
        expect(Number(screen.getByTestId("dirty-count").textContent)).toBeGreaterThan(0);
        expect(Number(screen.getByTestId("error-count").textContent)).toBeGreaterThan(0);
      });

      // Reset
      await user.click(screen.getByTestId("reset"));

      await waitFor(() => {
        expect(screen.getByTestId("touched-count")).toHaveTextContent("0");
        expect(screen.getByTestId("dirty-count")).toHaveTextContent("0");
        expect(screen.getByTestId("error-count")).toHaveTextContent("0");
      });
    });
  });
});
