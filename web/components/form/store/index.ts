import { configureStore } from "@reduxjs/toolkit";
import dict from "./dictSlice";

export const createStore = (preloadedState?: object | any[]) =>
  configureStore({
    reducer: { form: dict },
    preloadedState: preloadedState
      ? { form: { data: preloadedState } }
      : undefined,
  });

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
