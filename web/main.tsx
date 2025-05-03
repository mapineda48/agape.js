import { Fragment, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./assets/index.css";
import App from "./app/Router";
import EventEmitter from "./components/event-emiter";


/**
 * https://github.com/facebook/react/issues/24502
 */
const AppMode = process.env.NODE_ENV === "development" ? Fragment : StrictMode;

createRoot(document.getElementById("root")!).render(
  <AppMode>
    <EventEmitter>
      <App />
    </EventEmitter>
  </AppMode>
);
