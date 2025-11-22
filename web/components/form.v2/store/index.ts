import { configureStore } from "@reduxjs/toolkit";
import dict from "./dictSlice";

export const store = configureStore({
  reducer: { form: dict },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
