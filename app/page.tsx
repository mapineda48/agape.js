import SayHelloMemory from "./client";
import { login } from "@agape/access";
import { findFoo } from "@agape/public";

export default async function Home() {
  const message = await findFoo("Fooo");
  return (
    <div>
      {message}
      <br />
      <SayHelloMemory />
    </div>
  );
}
