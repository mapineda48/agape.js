---
trigger: glob
globs: web/**/*.tsx
---

# Agape.js Form System Rules

## 1. System Overview

The project uses a custom form engine based on **Zustand** (state) and **Zod** (validation).

- **Import Path:** `#web/utils/components/form`
- **Wrapper Requirement:** All forms must be wrapped in `<EventEmitter>` to handle submit events correctly.

## 2. Canonical Form Structure

Every form must follow this hierarchy:

```tsx
import Form from "#web/utils/components/form";
import EventEmitter from "#web/utils/components/event-emitter";
import { z } from "zod";

// 1. Define Schema
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export function MyForm() {
  const handleSubmit = async (data: z.infer<typeof schema>) => {
    // data is fully typed
  };

  // 2. Wrap in EventEmitter -> Form.Root
  return (
    <EventEmitter>
      <Form.Root
        state={{ name: "", email: "" }}
        schema={schema}
        mode="onBlur" // "onSubmit" | "onBlur" | "onChange"
      >
        {/* 3. Field Wrapper (Context for Label/Error) */}
        <Form.Field name="name" required>
          <Form.Label>Name</Form.Label>
          <Form.Text placeholder="Enter name" />
          <Form.Error />
        </Form.Field>

        {/* 4. Submit Button */}
        <Form.Submit onSubmit={handleSubmit}>Save</Form.Submit>
      </Form.Root>
    </EventEmitter>
  );
}
```

## 3. Input Component Reference

**STRICT RULE:** Do not use HTML `<input>` or `<select>` tags. Use the `Form.*` components.

| Data Type     | Component       | Props                         | Notes                            |
| ------------- | --------------- | ----------------------------- | -------------------------------- |
| **String**    | `Form.Text`     | `path`, `placeholder`, `type` | For text, email, password.       |
| **Long Text** | `Form.TextArea` | `path`, `rows`                |                                  |
| **Integer**   | `Form.Int`      | `path`, `min`, `max`          | Enforces integer values.         |
| **Float**     | `Form.Float`    | `path`, `step`                | For standard JS floats.          |
| **Money**     | `Form.Decimal`  | `path`                        | **REQUIRED** for financial data. |
| **Date**      | `Form.DateTime` | `path`                        | **REQUIRED** for dates.          |
| **Boolean**   | `Form.Checkbox` | `path`                        |                                  |
| **File**      | `Form.File`     | `path`, `accept`, `multiple`  |                                  |

### Select Components

**Special Rule:** Select components are **NOT** wrapped in `Form.Field`. They are self-contained.

```tsx
// String Select
<Form.Select.String path="role">
  <option value="admin">Admin</option>
  <option value="user">User</option>
</Form.Select.String>

// Boolean Select (Yes/No)
<Form.Select.Boolean path="isActive" trueLabel="Active" falseLabel="Inactive" />

// Int Select
<Form.Select.Int path="qty">
  <option value={1}>1</option>
</Form.Select.Int>

```

## 4. Complex Data Structures

### Scopes (Nested Objects)

Use `Form.Scope` to avoid repetitive dot notation for nested objects.

```tsx
// State: { user: { address: { city: "" } } }
<Form.Scope path="user.address">
  <Form.Text path="city" /> {/* writes to user.address.city */}
</Form.Scope>
```

### Arrays (Dynamic Lists)

Use `Form.Array` with a render function.

```tsx
<Form.Array path="items">
  {(fields, { append, remove }) => (
    <div>
      {fields.map((field, index) => (
        <div key={field.key}>
          {" "}
          {/* MUST use field.key */}
          <Form.Text path={`${index}.name`} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}
      <button onClick={() => append({ name: "" })}>Add Item</button>
    </div>
  )}
</Form.Array>
```

## 5. Hooks & Logic

| Hook               | Purpose                                                   | Example                                          |
| ------------------ | --------------------------------------------------------- | ------------------------------------------------ |
| `Form.useSelector` | **Preferred.** Reads value with performance optimization. | `const val = Form.useSelector(s => s.user.name)` |
| `Form.useForm`     | Actions (reset, set value) without re-rendering.          | `const { setAt, reset } = Form.useForm()`        |
| `Form.useArray`    | Logic for arrays without UI wrapper.                      | `const { append } = Form.useArray("items")`      |

## 6. Development Checklist

1. **Wrapper:** Did I wrap everything in `<EventEmitter>`?
2. **Types:** Am I using `Form.Decimal` for money and `Form.DateTime` for dates? (Matches Backend Rules).
3. **Hierarchy:** \* Standard Inputs -> Inside `Form.Field`.

- Selects -> Standalone (Outside `Form.Field`).

4. **Keys:** In arrays, am I using `field.key`? (Do not use `index` as key).
5. **Access:** Am I using `Form.useSelector` instead of `Form.useState` to prevent lag?
