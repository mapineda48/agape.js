import { useMemo } from "react";
import { useAppSelector } from "./store/hooks";
import { deepCloneWithOutHelpers } from "@/utils/structuredClone";

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
  const rawData = useAppSelector((state) => state.form.data);

  return useMemo(() => deepCloneWithOutHelpers(rawData) as T, [rawData]);
}

export default useFormState;
