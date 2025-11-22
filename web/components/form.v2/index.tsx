import FormProvider, { type Props } from "./provider";
import StoreProvider from "./store/provider";

export default function Form(props: Props) {
  return (
    <StoreProvider>
      <FormProvider {...props} />
    </StoreProvider>
  );
}
