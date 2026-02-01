import { createContext, useContext, useMemo, type JSX } from "react";
import { z } from "zod";
import { useEventEmitter } from "#web/utils/components/event-emitter";
import { useFormStoreApi } from "./store/zustand-provider";
import { deepCloneWithOutHelpers } from "#web/utils/clone";
import {
  type ValidationMode,
  type ReValidateMode,
  type FieldErrors,
  useValidationStoreApiOptional,
} from "./validation";

const Context = createContext<EventForm>({
  SUBMIT: Symbol("SUBMIT"),
  SUBMIT_SUCCESS: Symbol("SUBMIT_SUCCESS"),
});

/**
 * Proveedor de formulario controlado.
 *
 * Este componente encapsula la lógica de gestión del estado del formulario,
 * control de inputs y eventos `merge` y `submit` mediante un EventEmitter.
 *
 * @note El prop `state` se usa para inicializar el store y se pasa a StoreProvider,
 * no se utiliza internamente aquí.
 */
export default function FormProvider<T extends object | any[] = object>({
  state: _initialState,
  schema: _schema,
  mode: _mode,
  reValidateMode: _reValidateMode,
  onValidationError,
  children,
  ...formProps
}: Props<T>) {
  const store = useFormStoreApi();
  const validationStore = useValidationStoreApiOptional();
  const emitter = useEventEmitter();

  const evt = useMemo(() => {
    return {
      SUBMIT: Symbol("SUBMIT"),
      SUBMIT_SUCCESS: Symbol("SUBMIT_SUCCESS"),
    };
  }, []);

  return (
    <Context.Provider value={evt}>
      <form
        {...formProps}
        onSubmit={async (e) => {
          e.preventDefault();

          const state = store.getState();
          const payload = deepCloneWithOutHelpers(state.data) as T;

          if (process.env.NODE_ENV === "development") {
            console.log("[Form] Submit payload", payload);
          }

          // If validation is enabled, validate before submitting
          if (validationStore) {
            const validationState = validationStore.getState();
            validationState.incrementSubmitCount();
            validationState.setSubmitting(true);

            try {
              const result = await validationState.validateForm();

              if (!result.isValid) {
                validationState.setSubmitting(false);
                validationState.setSubmitSuccessful(false);

                if (onValidationError) {
                  onValidationError(result.errors);
                }

                if (process.env.NODE_ENV === "development") {
                  console.log("[Form] Validation failed", result.errors);
                }

                return;
              }

              // Emit submit event with validated data
              emitter.emit(evt.SUBMIT, {
                payload: result.data ?? payload,
                submitter:
                  e.nativeEvent instanceof SubmitEvent
                    ? e.nativeEvent.submitter
                    : null,
              });
            } catch (error) {
              validationState.setSubmitting(false);
              validationState.setSubmitSuccessful(false);

              if (process.env.NODE_ENV === "development") {
                console.error("[Form] Validation error", error);
              }
            }
          } else {
            // No validation - just emit submit
            emitter.emit(evt.SUBMIT, {
              payload,
              submitter:
                e.nativeEvent instanceof SubmitEvent
                  ? e.nativeEvent.submitter
                  : null,
            });
          }
        }}
      >
        {children}
      </form>
    </Context.Provider>
  );
}

export function useEvent() {
  return useContext(Context);
}

/**
 * Props for Form and FormProvider components.
 *
 * @property state - Initial state for the form store. Only used on first render.
 * @property schema - Zod schema for validation (optional).
 * @property mode - When to run validation initially (optional).
 * @property reValidateMode - When to re-validate after the first validation (optional).
 * @property onValidationError - Callback when validation fails on submit (optional).
 */
export interface Props<T extends object | any[] = object>
  extends Omit<JSX.IntrinsicElements["form"], "action" | "onSubmit"> {
  /** Initial state for the form store */
  state?: T;
  /** Zod schema for validation */
  schema?: z.ZodType<T>;
  /** When to run validation initially */
  mode?: ValidationMode;
  /** When to re-validate after the first validation */
  reValidateMode?: ReValidateMode;
  /** Callback when validation fails on submit */
  onValidationError?: (errors: FieldErrors) => void;
}

export interface EventForm {
  SUBMIT: symbol;
  SUBMIT_SUCCESS: symbol;
}

export interface SubmitEventPayload<T> {
  payload: T;
  submitter?: HTMLElement | null;
}
