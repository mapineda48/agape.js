import { findAll } from "@agape/cms/inventory/configuration/category";
import { useState } from "react";

export default function CMs() {
  const [state, setState] = useState(0);

  return (
    <button onClick={() => setState((state) => state + 1)}>
      Count {state}
    </button>
  );
}


export function onInit(){
  return findAll();
}