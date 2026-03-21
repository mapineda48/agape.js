import { type ReactNode, useMemo } from "react";
import StoreProvider from "./store/provider";
import { useFormStoreApi } from "./store/zustand-provider";
import FormProvider, { type Props as FormProviderProps } from "./provider";
import { ValidationStoreProvider } from "./validation";

/**
 * Props for the Form.Root component.
 * @template T The type of the form state object
 */
export interface RootProps<
  T extends object | unknown[] = object,
> extends FormProviderProps<T> {
  children?: ReactNode;
}

/**
 * Internal component that sets up validation after store is available.
 */
function FormWithValidation<T extends object | unknown[]>({
  children,
  schema,
  mode = "onSubmit",
  reValidateMode = "onChange",
  ...props
}: RootProps<T>) {
  const formStore = useFormStoreApi();

  // Create validation store options that reference the form store
  const validationOptions = useMemo(
    () => ({
      schema,
      mode,
      reValidateMode,
      getFormData: () => formStore.getState().data,
      getInitialData: () => props.state ?? {},
    }),
    [schema, mode, reValidateMode, formStore, props.state],
  );

  // If schema is provided, wrap with validation provider
  if (schema) {
    return (
      <ValidationStoreProvider options={validationOptions}>
        <FormProvider<T>
          {...props}
          schema={schema}
          mode={mode}
          reValidateMode={reValidateMode}
        >
          {children}
        </FormProvider>
      </ValidationStoreProvider>
    );
  }

  // No schema - just render without validation
  return <FormProvider<T> {...props}>{children}</FormProvider>;
}

/**
 * The root component for forms using the Compound Components pattern.
 * Provides the isolated Zustand Store and event context for form handling.
 *
 * @example
 * Basic usage without validation:
 * ```tsx
 * <Form.Root state={{ name: "", email: "" }}>
 *   <Form.Text path="name" placeholder="Name" />
 *   <Form.Text path="email" placeholder="Email" />
 *   <Form.Submit onSubmit={handleSubmit}>Save</Form.Submit>
 * </Form.Root>
 * ```
 *
 * @example
 * With Zod validation:
 * ```tsx
 * import { z } from "zod";
 *
 * const userSchema = z.object({
 *   name: z.string().min(2, "Name too short"),
 *   email: z.string().email("Invalid email"),
 * });
 *
 * <Form.Root
 *   state={{ name: "", email: "" }}
 *   schema={userSchema}
 *   mode="onBlur"
 *   onValidationError={(errors) => console.log(errors)}
 * >
 *   <Form.Text path="name" placeholder="Name" />
 *   <Form.Text path="email" placeholder="Email" />
 *   <Form.Submit onSubmit={handleSubmit}>Save</Form.Submit>
 * </Form.Root>
 * ```
 *
 * @note The `state` prop is only used on initial render. Changing it after
 * mount will NOT recreate the store to avoid losing form state during re-renders.
 */
export default function Root<T extends object | unknown[]>({
  children,
  ...props
}: RootProps<T>) {
  return (
    <StoreProvider initialState={props.state}>
      <FormWithValidation<T> {...props}>{children}</FormWithValidation>
    </StoreProvider>
  );
}
