import mitt from "mitt";
import lodash from "lodash";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";

const Context = createContext<Emitter>(null as unknown as Emitter);

export default function EventEmitter(props: { children: React.ReactNode }) {
  const emitter = useMemo(mitt, []);

  useEffect(() => {
    return () => emitter.all.clear();
  }, [emitter]);

  return <Context.Provider value={emitter}>{props.children}</Context.Provider>;
}

export function useEmitter(): EmitterProxy {
  const emitter = useContext(Context);

  return useMemo(() => {
    const on = (event: string, cb: () => void) => {
      emitter.on(event, cb);

      return () => emitter.off(event, cb);
    };

    const emit$ = (e: string, payload: unknown) => {
      emitter.emit(e, lodash.cloneDeep(payload));
    };

    return new Proxy(
      {},
      {
        get(_, event: string) {
          switch (event) {
            case "emit":
              return emit$;
            case "on":
              return on;
          }

          return (payload: any) => {
            if (typeof payload !== "function") {
              emitter.emit(event, payload);
              return;
            }

            emitter.on(event, payload);

            return () => emitter.off(event, payload);         
          };
        },
      }
    );
  }, [emitter]);
}

/**
 * Types
 */

type EmitterProxy = {
  readonly [K: string]: (...args: unknown[]) => void;
};

type HookEvent = {
  [K: string]: (...args: unknown[]) => void;
};

type Emitter = ReturnType<typeof mitt>;
