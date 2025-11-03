import ReactDOM from "react-dom";
import React, {
  Fragment,
  useCallback,
  useContext,
  useEffect,
  type JSX,
} from "react";

const Context = React.createContext<PushToPortal>(() => {});

/**
 * If you wonder why I just don't use ReactDOM.createPortal,
 * it's because this way I can nested zindex and allow push
 * a function component with a callback
 */
export function withPortalToRoot<P>(Element: React.ComponentType<P>) {
  return function useShow() {
    const pushToBody = useContext(Context);

    return useCallback(
      function pushModal(props: Omit<P, keyof PropsPortal>) {
        pushToBody((portal) => <Element {...(props as any)} {...portal} />);
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
    () =>
      setPush((Item) =>
        setState((state) => [...state, { Item, key: crypto.randomUUID() }])
      ),
    [setPush]
  );

  if (!state.length) {
    return null;
  }

  const Elements = (
    <Fragment>
      {state.map(({ Item, key }, index) => (
        <Item
          key={key}
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

/**
 * Types
 */
type State = { Item: FunctionComponent; key: string }[];

export type FunctionComponent<T extends PropsPortal = PropsPortal> = (
  props: T
) => JSX.Element;

export interface PropsPortal {
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
