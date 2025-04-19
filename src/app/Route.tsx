import { JSX, useEffect, useState } from "react";
import history from "./history";

export default function Route() {
  const [state, setState] = useState<null | JSX.Element>(null);

  useEffect(() => history(setState), []);

  return state;
}
