import { Fragment, StrictMode } from "react";
import { createRoot } from "react-dom/client";
import EventEmitter from "@/components/util/event-emitter";
import PortalProvider from "@/components/util/portal.tsx";
import App from "@/app";
import "@/utils/error";
import "./index.css";


/**
 * https://github.com/facebook/react/issues/24502
 */
const Enviroment =
  process.env.NODE_ENV === "development" ? Fragment : StrictMode;

createRoot(document.getElementById("root")!).render(
  <Enviroment>
    <EventEmitter>
      <PortalProvider>
        <App />
      </PortalProvider>
    </EventEmitter>
  </Enviroment>
);
