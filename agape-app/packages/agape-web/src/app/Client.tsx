"use client";

import { doFoo } from "agape-backend/service/public";

export default function Client() {
  return (
    <button
      onClick={() => {
        doFoo().then((res) => console.log({ res }));
      }}
    >
      Do Foooooss
    </button>
  );
}
