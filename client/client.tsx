import { findBazz } from "@agape/public";

export default function SayHelloMemory() {
  return (
    <button
      onClick={() => {
        findBazz("Miguel Pineda").then(console.log);
      }}
    >
      Say Hello World
    </button>
  );
}
