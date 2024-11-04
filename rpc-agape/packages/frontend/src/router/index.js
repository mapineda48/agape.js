import {
  createContext,
  useContext,
  useState,
  useEffect,
  Fragment,
  StrictMode,
} from "react";
import EventEmitter from "components/EventEmitter";
import paths from "./paths";
import PortalProvider from "../components/Portals";
import PageManager from "./PageManager";
import HistoryManager from "./HistoryManager";
import { isAuthenticated } from "backend/service/auth";

export const routes = paths;

export const Context = createContext(null);

/**
 * Server
 */
export function Server(props) {
  return (
    <Context.Provider value={{ ...props, auth: () => {} }}>
      {props.children}
    </Context.Provider>
  );
}

/**
 * Browser Boot
 */

/**
 * https://github.com/facebook/react/issues/24502
 */
const AppMode = process.env.NODE_ENV === "development" ? Fragment : StrictMode;

/**
 * Not found Index
 */

export default async function bootApp(history, initProps = null) {
  await isAuthenticated().catch(() => {});

  const pages = paths.map((path, index) => new PageManager(path, index));
  const app = new HistoryManager(history, pages);

  const state = await app.sync(initProps);

  const History = () => {
    const [{ Page }, setPage] = useState(state);

    useEffect(() => app.onUpdate(setPage), []);

    return (
      <Context.Provider value={app}>
        <Page />
      </Context.Provider>
    );
  };

  return () => (
    <AppMode>
      <EventEmitter>
        <PortalProvider>
          <History />
        </PortalProvider>
      </EventEmitter>
    </AppMode>
  );
}

export function useRouter() {
  return useContext(Context);
}
