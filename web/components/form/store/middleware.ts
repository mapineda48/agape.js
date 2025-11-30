import type { Middleware } from "@reduxjs/toolkit";
import { applyHelpersToSerialized } from "../../../utils/structuredClone";

export const serializationMiddleware: Middleware =
  () => (next) => (action: any) => {
    if (action.type === "dict/setAtPath" || action.type === "dict/pushAtPath") {
      // Clone action to avoid mutating the original
      const newAction = { ...action };
      newAction.payload = { ...action.payload };

      if (newAction.payload.value !== undefined) {
        newAction.payload.value = applyHelpersToSerialized(
          newAction.payload.value
        );
      }

      return next(newAction);
    }

    return next(action);
  };
