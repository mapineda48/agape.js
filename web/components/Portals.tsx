import ReactDOM from "react-dom";
import React, { Fragment, JSX, useCallback, useContext, useEffect } from "react";
import lodash from "lodash";

const Context = React.createContext<PushToPortal>(() => {});

/**
 * If you wonder why I just don't use ReactDOM.createPortal,
 * it's because this way I can nested zindex and allow push
 * a function component with a callback
 */
export function withPortalToRoot(Element: any) {
  return function useShow() {
    const pushToBody = useContext(Context);

    return useCallback(
      function pushModal(payload: any = {}) {
        const props = lodash.cloneDeep(payload);
        pushToBody((portal) => <Element {...props} {...portal} />);
      },
      [pushToBody]
    );
  };
}

export default function PortalProvider(props: { children: React.ReactNode }) {
  const [state, setState] = React.useState<StateProvider>({ push: () => {} });

  const setPush = useCallback((push: PushToPortal) => setState({ push }), []);

  return (
    <Context.Provider value={state.push}>
      {props.children}
      <PortalFactory setPush={setPush} />
    </Context.Provider>
  );
}

/**
 * Prevent render all tree on update state
 */
export function PortalFactory(props: PortalFactoryProps) {
  const { setPush } = props;

  const [state, setState] = React.useState<State>([]);

  useEffect(
    () => setPush((el) => setState((state) => [...state, el])),
    [setPush]
  );

  if (!state.length) {
    return null;
  }

  if (state.length === 1) {
    const [Item] = state;

    return (
      <Item
        key={generateUUID()}
        style={{ zIndex: 1500 }}
        remove={() => setState([])}
      />
    );
  }

  const Elements = (
    <Fragment>
      {state.map((Element, index) => (
        <Element
          key={generateUUID()}
          style={{ zIndex: 1500 + index * 100 }}
          remove={() =>
            setState((current) => {
              const state = [...current];
              state.splice(index, 1);
              return state;
            })
          }
        />
      ))}
    </Fragment>
  );

  return ReactDOM.createPortal(Elements, document.body);
}

export function generateUUID() {
    // Concatenar piezas para formar un UUID
    return (
      hex4() +
      hex4() +
      "-" +
      hex4() +
      "-" +
      "4" +
      hex4().substr(0, 3) +
      "-" +
      (Math.random() > 0.5 ? "8" : "a") +
      hex4().substr(0, 3) +
      "-" +
      hex4() +
      hex4() +
      hex4()
    );
  }
  
  // Función para generar un número hexadecimal aleatorio de 4 dígitos
  function hex4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }

/**
 * Types
 */
type State = FunctionComponent[];

export type FunctionComponent<T extends Props = Props> = (
  props: T
) => JSX.Element;

export interface Props {
  style: React.CSSProperties;
  remove: () => void;
}

interface PortalFactoryProps {
  setPush: (push: PushToPortal) => void;
}

interface StateProvider {
  push: PushToPortal;
}

type PushToPortal = (Element: FunctionComponent) => void;