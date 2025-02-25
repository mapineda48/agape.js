import Select from "@client/components/form/Select";
import { useMemo } from "react";
import generateUUID from "@client/components/util/generateUUID";
import wrap, { WrapFC } from "@client/components/util/wrap";

const Res = wrap<FieldInput>(Select, (Type: any) => {
  return ({ label, ...props }: any) => {
    const id = useMemo(generateUUID, []);

    return (
      <>
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        <Type
          {...props}
          id={id}
          aria-label={label}
          className="form-select"
        />
      </>
    );
  };
});

export default Res;

/**
 * Types
 */
type FieldInput = WrapFC<typeof Select, { label: string }>;
