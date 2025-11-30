import { configureStore } from "@reduxjs/toolkit";
import dict from "./dictSlice";
import { serializationMiddleware } from "./middleware";
import { applyHelpersToSerialized } from "../../../utils/structuredClone";

/**
 * For internal use only - WebAPI Only Supported - structuredClone
 *
 * IMPORTANTE — SOBRE EL ALCANCE DE ESTA SERIALIZACIÓN
 * ---------------------------------------------------
 * Este mecanismo de serialización NO sigue el estándar estricto de Redux,
 * donde el estado debe ser completamente serializable (JSON-safe) y apto
 * para time-travel, rehidratación, SSR o sincronización entre procesos.
 *
 * Este serializable check está DISEÑADO EXCLUSIVAMENTE para el caso
 * de uso de *formularios en el navegador*, donde:
 *
 *   - El estado del formulario vive únicamente en el entorno del browser.
 *   - Se comparte mediante un contexto de React en el árbol del formulario.
 *   - No se persiste entre sesiones ni se envía por la red.
 *   - No se rehidrata en SSR ni se comparte con otros entornos.
 *   - NO está pensado para time-travel debugging ni reproducción de acciones.
 *   - NO está destinado a ser leído desde Node/SSR/Workers/etc.
 *
 * Debido a estas condiciones, se permiten ciertos valores *no serializables*
 * según Redux tradicional —como `File`, `Decimal` o `DateTime`— porque:
 *
 *   - Permanecen dentro del ámbito estrictamente local del navegador.
 *   - No se serializan fuera del store (ni a JSON ni a mensajes externos).
 *   - Se usan solo para manejo de inputs y estados de UI.
 *
 * ✔ Si este estado fuera utilizado como:
 *      - Estado global compartido entre features,
 *      - Estado persistente (localStorage, indexedDB),
 *      - Estado sincronizado con el backend,
 *      - Estado para SSR (Next.js/Remix),
 *      - Estado para time-travel debugging de Redux DevTools,
 *   entonces **esta solución NO sería válida ni segura**.
 *
 * En resumen:
 * Este serializable-check está pensado únicamente para un *UI Form State Store*
 * dentro del navegador, y NO para un Redux Store tradicional universal o portable.
 */
export const createStore = (preloadedState?: object) =>
  configureStore({
    reducer: { form: dict },
    preloadedState: preloadedState
      ? { form: { data: applyHelpersToSerialized(preloadedState) } }
      : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ["dict/setAtPath", "dict/pushAtPath"],
          // Ignoramos el estado del formulario porque permite valores
          // compatibles con structuredClone pero no con JSON (File, etc.)
          ignoredPaths: ["form.data"],
        },
      }).prepend(serializationMiddleware),
  });

export type AppStore = ReturnType<typeof createStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
