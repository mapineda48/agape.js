import { useState, useMemo } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import { sayHello } from "@services/public";
import socket from "@services/chat";

function App() {
  const [count, setCount] = useState(0);
  const [file, setFile] = useState<File | undefined>(undefined);
  const [files, setFiles] = useState<File[] | undefined>(undefined);

  const chat = useMemo(() => socket.connect(), []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button
          onClick={() => {
            setCount((count) => count + 1);
            sayHello("Juan", file, files);
            console.log(chat);
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
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
