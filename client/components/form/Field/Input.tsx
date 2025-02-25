/* eslint-disable */

import Input from "@client/components/form/Input";
import { useMemo } from "react";
import generateUUID from "@client/components/util/generateUUID";
import wrap, { WrapFC } from "@client/components/util/wrap";

const Res = wrap<FieldInput>(Input, (Type: any) => {
  return ({ label, ...props }: any) => {
    const id = useMemo(generateUUID, []);

    return (
      <>
        <label htmlFor={id} className="form-label">
          {label}
        </label>
        <Type {...props} className="form-control" id={id} />
      </>
    );
  };
});

export default Res;

/**
 * Types
 */
type FieldInput = WrapFC<typeof Input, { label: string }>;
