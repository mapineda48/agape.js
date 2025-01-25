/* eslint-disable */

import Select from "@/components/form/Select";
import { useMemo } from "react";
import generateUUID from "@/util/generateUUID";
import wrap, { WrapFC } from "@/util/wrap";

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
