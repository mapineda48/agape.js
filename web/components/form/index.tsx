import FormProvider, { type Props, useEvent as useForm } from "./provider";
import StoreProvider from "./store/provider";
import Path from "./paths";
import useInput from "./Input/useInput";
import { useInputArray } from "./hooks";
import { useFormReset } from "./useFormReset";

export default function Form<T extends object | any[] = object>(
  props: Props<T>
) {
  return (
    <StoreProvider initialState={props.state}>
      <FormProvider<T> {...props} />
    </StoreProvider>
  );
}

export { Path, useForm, useInputArray, useInput, useFormReset };
export { useAppDispatch } from "./store/hooks";
export { setAtPath, resetState } from "./store/dictSlice";
