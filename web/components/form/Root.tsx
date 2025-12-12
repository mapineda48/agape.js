import { type ReactNode } from "react";
import StoreProvider from "./store/provider";
import FormProvider, { type Props as FormProviderProps } from "./provider";

/**
 * Props for the Form.Root component.
 * @template T The type of the form state object
 */
export interface RootProps<T extends object | unknown[] = object>
  extends FormProviderProps<T> {
  children: ReactNode;
}

/**
 * The root component for forms using the Compound Components pattern.
 * Provides the isolated Redux Store and event context for form handling.
 *
 * @example
 * ```tsx
 * <Form.Root state={{ name: "", email: "" }}>
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
      <FormProvider<T> {...props}>{children}</FormProvider>
    </StoreProvider>
  );
}
