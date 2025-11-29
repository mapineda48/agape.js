import { Action } from "history";
import { createContext, createElement, useContext, type JSX } from "react";
import NoFoundPage from "../../app/NotFound";
import { RouterPathProvider } from "./path-context";
import { RouteRegistry, type ModuleType } from "./route-registry";
import { Navigator } from "./navigator";
import { AuthGuard, type INavigateTo } from "./auth-guard";

/**
 * Context that holds the parent path for nested layouts.
 * This allows child components to use relative paths.
 */
export const HistoryContext = createContext<HistoryManager | null>(null);

export function useHistory() {
  const ctx = useContext(HistoryContext);

  if (!ctx) {
    throw new Error("useHistory must be used within a HistoryProvider");
  }

  return ctx;
}

export class HistoryManager {
  public navigator: Navigator;
  public registry: RouteRegistry;
  public authGuard: AuthGuard;

  private loading = false;

  constructor(pageModules: ModuleType = {}, layoutModules: ModuleType = {}) {
    this.navigator = new Navigator();
    this.registry = new RouteRegistry(pageModules, layoutModules);
    this.authGuard = new AuthGuard();
  }

  get pathname() {
    return this.navigator.pathname;
  }

  public listenPath(cb: (pathname: string) => void) {
    const unlisten = this.navigator.listen((pathname) => {
      cb(pathname);
    });
    return unlisten;
  }

  public listenPage(cb: (page: JSX.Element) => void) {
    const unlisten = this.navigator.listen((pathname, action, state) => {
      const page = this.registry.getPage(pathname);
      console.error(
        `DEBUG: listenPage callback for ${pathname}. page found: ${!!page}, Component: ${!!page?.Component}`
      );

      // Si existe una página registrada, construimos el árbol con layouts
      if (page?.Component) {
        const props = this.navigator.getCleanState(state);

        const element = this.wrapWithLayouts(
          pathname,
          createElement(page.Component, props)
        );

        cb(element);
        return;
      }

      // Si fue un POP a una ruta aún no precargada, re-disparamos navegación
      if (action === Action.Pop) {
        this.navigateTo(pathname);
        return;
      }

      // NotFound (sin layouts para evitar confusiones)
      cb(createElement(NoFoundPage));
    });

    // Primera navegación al path actual
    this.navigateTo(this.navigator.pathname, { replace: true });

    return unlisten;
  }

  public navigateTo(pathname: string, opt: INavigateTo = {}) {
    if (this.loading) return;

    this.loading = true;
    const ctx = structuredClone(opt);

    (async () => {
      // 1) Auth gates
      pathname = await this.authGuard.check(pathname, ctx);

      const page = this.registry.getPage(pathname);

      // 2) Not found: sólo cambia history
      if (!page) {
        this.navigator.updateHistory(pathname, ctx);
        return;
      }

      // 3) Lazy-load de la página
      if (!page.Component) {
        await page();
      }

      // 4) Lazy-load de todos los layouts requeridos por el path
      const needed = this.registry.getLayoutPaths(pathname);
      for (const p of needed) {
        const layout = this.registry.getLayout(p);
        if (layout && !layout.Component) {
          await layout();
        }
      }

      // 5) Ejecutar onInit del primero que lo defina si no hay state:
      //    prioridad página > layout más interno > ... > root
      if (!ctx.state) {
        if (page.onInit) {
          ctx.state = await page.onInit();
        } else {
          for (let i = needed.length - 1; i >= 0; i--) {
            const l = this.registry.getLayout(needed[i]);
            if (l?.onInit) {
              ctx.state = await l.onInit();
              break;
            }
          }
        }
      }

      // 6) Empuja/reemplaza history (el listener renderiza sincrónicamente)
      this.navigator.updateHistory(pathname, ctx);
    })()
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.loading = false;
      });
  }

  /** Envuelve un elemento de página con layouts (root -> más interno) */
  private wrapWithLayouts(pathname: string, element: JSX.Element): JSX.Element {
    const paths = this.registry.getLayoutPaths(pathname);
    let wrapped = element;
    for (let i = paths.length - 1; i >= 0; i--) {
      const L = this.registry.getLayout(paths[i]);
      if (L?.Component) {
        // Wrap the layout component with RouterPathProvider
        const layoutElement = createElement(L.Component, null, wrapped);
        wrapped = createElement(
          RouterPathProvider,
          { path: paths[i] },
          layoutElement
        );
      }
    }
    return createElement(HistoryContext.Provider, { value: this }, wrapped);
  }
}
