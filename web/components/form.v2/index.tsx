import FormProvider, { type Props, useEvent as useForm } from "./provider";
import StoreProvider from "./store/provider";
import Path from "./paths";
import useInput from "./Input/useInput";
import { useInputArray } from "./hooks";

export default function Form(props: Props) {
  return (
    <StoreProvider initialState={props.state}>
      <FormProvider {...props} />
    </StoreProvider>
  );
}

export { Path, useForm, useInputArray, useInput };
export { useAppDispatch } from "./store/hooks";
export { setAtPath } from "./store/dictSlice";
