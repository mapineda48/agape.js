---
trigger: always_on
---

# Project Conventions & Best Practices

This project (`agape.js`) uses several custom implementations for core functionality. It is critical to follow these conventions to maintain consistency and leverage the built-in optimizations.

## ⚡ RPC System (Remote Procedure Call)

The project uses a custom RPC system to communicate between the frontend and backend, eliminating the need for manual REST API management.

### Conventions

- **Definition**: Define backend logic as exported async functions in the `svc/` directory.
- **Consumption**: Import these functions directly in the frontend using the `@agape/svc/*` alias.

  ```typescript
  // Backend: svc/users.ts
  export async function getUser(id: string) { ... }

  // Frontend: web/some-component.tsx
  import { getUser } from "@agape/svc/users";
  ```

- **Serialization**: Arguments and return values are serialized using MessagePack. Ensure data types are serializable.

### ⛔ Prohibitions

- **DO NOT** create manual API routes (e.g., `app.get('/api/users')`) unless absolutely necessary for external webhooks.
- **DO NOT** use `fetch` or `axios` to call your own backend services. Use the RPC imports.

## 🛣️ Routing System

The project uses a custom router implementation that supports relative navigation and context-aware paths.

### Conventions

- **Hook**: Use `useRouter` from `web/components/router/router-hook.tsx` for navigation and path information.
  ```typescript
  import { useRouter } from "@/components/router/router-hook";
  const { navigate, pathname } = useRouter();
  ```
- **Relative Navigation**: The router supports relative paths. If you are in `/cms/configuration`, calling `navigate('inventory')` will go to `/cms/configuration/inventory`.
- **Structure**: Pages are located in `web/app`. Follow the file-system routing pattern.

### Best Practices

- Use relative paths when navigating within a module to make components more portable.
- Use `navigate(path, { replace: true })` for replacing history entries.

## 📝 Form System

The project uses a custom form system integrated with Redux for state management.

### Conventions

- **Provider**: Always wrap your form in a `FormProvider`.
  ```tsx
  import FormProvider from "@/components/form/provider";
  <FormProvider>...</FormProvider>;
  ```
- **Inputs**: Use the custom input components located in `web/components/form/Input` (e.g., `Input.Text`, `Input.Select`) or the `useInput` hook for custom controls.
  - These components automatically bind to the Redux form state.
- **Submission**: Use the `Submit` component to handle form submission.

  ```tsx
  import { Submit } from "@/components/form/Submit";

  <Submit
    onSubmit={async (data) => {
      /* handle data */
    }}
  >
    Save
  </Submit>;
  ```

  - The `onSubmit` callback receives the current form state (JSON object).

- **Arrays**: Use `useInputArray` for managing lists of items within a form.

### Best Practices

- **Materialization**: If a field needs its default value to be present in the store immediately (e.g., for validation logic that runs on mount), use the `materialize: true` option in `useInput` or the corresponding prop on input components.
- **State Access**: Use `useSelector` from `web/components/form/hooks` to access form state within the form context.

## 🎨 General Development

- **Styling**: Use TailwindCSS for styling.
- **State Management**: Redux Toolkit is used for global state and form state.
- **Imports**: Use the `@/` alias to refer to `web/` directory (e.g., `@/components/...`).
