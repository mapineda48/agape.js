# Form System Documentation

This document describes the custom form system used in `web/components/form`, based on the behavior observed in unit tests.

## Core Components

### `FormProvider`
- **Purpose**: Wraps the form and provides the Redux store context.
- **Props**:
  - `state`: Initial state object.
  - `children`: Form content.
- **Behavior**:
  - Initializes the form state.
  - Supports nested objects and arrays in the state.

### `PathProvider`
- **Purpose**: Allows nesting paths for child components.
- **Props**:
  - `value`: The path segment to append (string or number).
- **Behavior**:
  - Concatenates the provided value to the current path context.
  - Supports multiple levels of nesting.
  - Example:
    ```tsx
    <PathProvider value="user">
      <PathProvider value="profile">
        <Input.Text path="name" /> {/* path is ["user", "profile", "name"] */}
      </PathProvider>
    </PathProvider>
    ```

### `Submit`
- **Purpose**: Handles form submission.
- **Props**:
  - `onSubmit`: Async function called with the form data.
- **Behavior**:
  - Passes the current form state to the `onSubmit` callback.
  - Requires `EventEmitter` context (usually wrapped automatically or needs manual wrapping in tests).

## Input Components

All input components accept a `path` prop (string or array of strings/numbers).

### `Input.Text`
- Handles string values.
- Updates state on change.

### `Input.Int`
- Handles integer values.
- Parses input as integer.
- Handles negative numbers and zero.

### `Input.Decimal`
- Handles decimal values using `Decimal` class.
- Parses input as decimal.

### `Input.DateTime`
- Handles date/time values using `DateTime` class.
- Uses `datetime-local` input type.

### `Input.File`
- Handles file uploads.
- Supports `multiple` prop for array of files.
- Stores `File` objects directly in the state.

### `Checkbox`
- Handles boolean values.
- Toggles between `true` and `false`.

## Hooks

### `useInput(path, defaultValue, options)`
- **Purpose**: Low-level hook for creating custom inputs.
- **Arguments**:
  - `path`: Path to the value in the store.
  - `defaultValue`: Value to use if not present in store.
  - `options`: `{ materialize: boolean }`.
- **Behavior**:
  - Returns `[value, setValue]`.
  - `materialize: true` ensures the default value is written to the store on mount.
  - Handles `null` and `undefined` correctly.

### `useInputArray(path)`
- **Purpose**: Manages arrays in the form state.
- **Arguments**:
  - `path`: Path to the array.
- **Returns**: Array-like object with:
  - `length`: Number of items.
  - `map(callback)`: Function to iterate over items. Callback receives `(item, index, itemPath)`.
  - `addItem(...items)`: Adds items to the end.
  - `removeItem(index, count?)`: Removes items at index.
  - `set(array)`: Replaces the entire array.
- **Behavior**:
  - Supports arrays of primitives and objects.
  - Supports arrays at the root of the form state.
  - Provides stable paths for items during iteration.

## Testing Guidelines

- **Wrap with `EventEmitter`**: When testing `Submit` or components that rely on events, wrap `FormProvider` with `<EventEmitter>`.
- **Mock `structuredClone`**: Ensure `structuredClone` is mocked if not available in the test environment, especially for `File` handling.
- **User Event**: Use `userEvent.setup()` for realistic interactions.
- **Async Updates**: Use `waitFor` for assertions on submit callbacks.
