import { useMemo } from "react";
import { useFormData } from "./store/zustand-provider";
import { deepCloneWithOutHelpers } from "#web/utils/clone";

/**
 * Hook for reactive form state subscription.
 * Use this when you need to read form values reactively.
 *
 * ⚠️ Performance Warning: This hook will cause re-renders on every state change.
 * Use sparingly, prefer `Form.useForm().getValues()` for imperative reads.
 *
 * @example
 * ```tsx
 * function FormPreview() {
 *   const values = Form.useState<UserFormData>();
 *
 *   return <pre>{JSON.stringify(values, null, 2)}</pre>;
 * }
 * ```
 */
export function useFormState<T = unknown>(): T {
  return useFormData<T>();
}

export default useFormState;
