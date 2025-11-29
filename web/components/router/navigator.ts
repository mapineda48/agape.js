import { Action, createBrowserHistory, type History } from "history";
import {
  applyHelpersToSerialized,
  removeHelpersFromSerialized,
} from "@/utils/structuredClone";
import type { INavigateTo } from "./auth-guard";

export class Navigator {
  public history: History;

  constructor() {
    this.history = createBrowserHistory();
  }

  get pathname() {
    return this.history.location.pathname;
  }

  public listen(cb: (pathname: string, action: Action, state: any) => void) {
    return this.history.listen(({ location: { pathname, state }, action }) => {
      cb(pathname, action, state);
    });
  }

  public updateHistory(pathname: string, { state, replace }: INavigateTo) {
    const serializedState = applyHelpersToSerialized(state);
    if (replace) this.history.replace(pathname, serializedState);
    else this.history.push(pathname, serializedState);
  }

  public getCleanState(state: any) {
    return removeHelpersFromSerialized(state);
  }
}
