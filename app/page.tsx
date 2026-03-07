"use client";

import { useState, useMemo } from "react";
import { sayHello } from "#services/public";
import socket from "#services/chat";

export default function Home() {
  const [count, setCount] = useState(0);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [files, setFiles] = useState<File[] | undefined>(undefined);

  const chat = useMemo(() => socket.connect(), []);

  return (
    <div>
      <h1>agape.js - Next.js</h1>
      <div>
        <button
          onClick={() => {
            setCount((c) => c + 1);
            sayHello("Juan", file, files);
            chat.emit("message:send", {
              text: "Hello",
              sender: "Juan",
            });
          }}
        >
          count is {count}
        </button>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0])} />
        <input
          type="file"
          multiple
          onChange={(e) =>
            setFiles(e.target.files ? Array.from(e.target.files) : undefined)
          }
        />
      </div>
    </div>
  );
}
