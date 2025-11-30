import { configureStore } from "@reduxjs/toolkit";
import dict from "./dictSlice";
import { serializationMiddleware } from "./middleware";
import { applyHelpersToSerialized } from "../../../utils/structuredClone";

export const createStore = (preloadedState?: object | any[]) =>
  configureStore({
    reducer: { form: dict },
    preloadedState: preloadedState
      ? { form: { data: applyHelpersToSerialized(preloadedState) } }
      : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(serializationMiddleware),
  });

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
