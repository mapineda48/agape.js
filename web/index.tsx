import { Fragment, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal.tsx";
import { ThemeProvider } from "@/components/ThemeProvider";
import App from "@/app";
import "@/utils/error";
import "./index.css";
import socket, { sendMessage } from "@agape/demo.socket";

// Demo: Socket.IO RPC usage
// In a real app, this should be in a React hook with proper cleanup
const demoSocket = async () => {
  const { disconnect, on, sendMessage, ping } = socket.connect();

  // Subscribe to events
  on("onMessage", (data) => {
    console.log("Received onMessage event:", data);
  });

  // Call RPC methods
  setInterval(async () => {
    try {
      const pingResult = await ping();
      console.log("Ping result:", pingResult);

      const sendResult = await sendMessage("hola");
      //console.log("SendMessage result:", sendResult);
    } catch (error) {
      console.error("Socket RPC error:", error);
    }
  }, 5000);

  // Return disconnect for cleanup
  return disconnect;
};

// Run demo and store cleanup function
const cleanupSocket = demoSocket();

// Cleanup on page unload (demo only - in React use useEffect cleanup)
window.addEventListener("beforeunload", async () => {
  const disconnect = await cleanupSocket;
  disconnect();
});

/**
 * https://github.com/facebook/react/issues/24502
 */
const Enviroment =
  process.env.NODE_ENV === "development" ? Fragment : StrictMode;

createRoot(document.getElementById("root")!).render(
  <Enviroment>
    <EventEmitter>
      <PortalProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </PortalProvider>
    </EventEmitter>
  </Enviroment>
);
