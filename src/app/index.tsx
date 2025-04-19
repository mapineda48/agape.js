import { useState } from "react";
import history from "../history";
import sayhello from "virtual:agape";

export default function AgapeLanding(props: { message: string }) {
  console.log(props);
  return (
    <div>
      {props.message}
      <button
        onClick={() => {
          history.push("/cms");
        }}
      >
        go to cms
      </button>
    </div>
  );
}

