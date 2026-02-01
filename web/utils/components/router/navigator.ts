import { Action, createBrowserHistory, type History } from "history";
import { encode, decode } from "#shared/msgpackr";
import type { INavigateTo } from "./types";

export class Navigator {
  public history: History;

  constructor() {
    this.history = createBrowserHistory();
  }

  get pathname() {
    return this.history.location.pathname;
  }

  /**
   * Obtiene el estado actual decodificado directamente de la ubicación actual.
   * Útil si necesitas leer el estado sin esperar a un cambio de ruta.
   */
  get state() {
    return this.safeDecode(this.history.location.state);
  }

  public listen(
    cb: (pathname: string, action: Action, state: unknown) => void,
  ) {
    return this.history.listen(({ location: { pathname, state }, action }) => {
      // Decodificamos el binario a objeto JS antes de pasarlo al callback
      const decodedState = this.safeDecode(state);
      cb(pathname, action, decodedState);
    });
  }

  public updateHistory(pathname: string, { state, replace }: INavigateTo) {
    if (process.env.NODE_ENV === "development") {
      console.log("updateHistory", pathname, state);
    }

    // Serializamos el objeto JS a Uint8Array usando msgpackr
    // Si el estado es null/undefined, pasamos null para no codificar "nada"
    const binaryState = state ? encode(state) : null;

    if (replace) this.history.replace(pathname, binaryState);
    else this.history.push(pathname, binaryState);
  }

  /**
   * Helper privado para decodificar de forma segura.
   * Maneja casos donde el estado es null o (importante para migraciones)
   * si el estado antiguo todavía es un objeto plano JSON y no un Uint8Array.
   */
  private safeDecode(state: unknown) {
    if (!state) return null;

    // Verificamos si es un Uint8Array (formato msgpack)
    if (state instanceof Uint8Array) {
      try {
        return decode(state);
      } catch (e) {
        console.error("Error decoding state with msgpack:", e);
        return null;
      }
    }

    // Si no es binario, devolvemos el estado tal cual (retrocompatibilidad)
    return state;
  }
}
