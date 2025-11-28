import { Action, createBrowserHistory } from "history";
import { createElement, useEffect, useMemo, useState, type JSX } from "react";
import NoFoundPage from "./NotFound";
import { isAuthenticated } from "@agape/access";
import { RouterPathProvider } from "./router-context";

import { encode, decode } from "../../lib/utils/msgpack";
import {
  applyHelpersToSerialized,
  removeHelpersFromSerialized,
} from "@/utils/structuredClone";

export class Router {
  private history = createBrowserHistory();

  get pathname() {
    return this.history.location.pathname;
  }

  private routes: IRoute = {};
  private layouts: ILayouts = {};

  private loading = false;

  constructor() {
    this.initRoutesAndLayouts();
  }

  /** Escanea páginas y layouts y los registra como loaders lazy */
  private initRoutesAndLayouts() {
    const pageModules = import.meta.glob<unknown>("./**/page.{ts,tsx}");
    const layoutModules = import.meta.glob<unknown>("./**/_layout.{ts,tsx}");

    // Páginas
    Object.entries(pageModules).forEach(([filename, loader]) => {
      const pathname = this.toPathnameFromPage(filename);
      this.routes[pathname] = this.toPage(loader);
    });

    // Layouts
    Object.entries(layoutModules).forEach(([filename, loader]) => {
      const dirpath = this.toPathnameFromLayout(filename);
      this.layouts[dirpath] = this.toLayout(loader);
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Registered routes:", this.routes);
      console.log("Registered layouts:", this.layouts);
    }
  }

  public listenPath(cb: (pathname: string) => void) {
    const unlisten = this.history.listen(({ location: { pathname } }) => {
      cb(pathname);
    });

    //cb(this.history.location.pathname);

    return unlisten;
  }

  public listenPage(cb: (page: JSX.Element) => void) {
    const unlisten = this.history.listen(
      ({ location: { pathname, state }, action }) => {
        const page = this.routes[pathname];

        // Si existe una página registrada, construimos el árbol con layouts
        if (page?.Component) {
          const props = removeHelpersFromSerialized(state);

          const element = this.wrapWithLayouts(
            pathname,
            createElement(page.Component, props)
          );

          cb(element);
          return;
        }

        // Si fue un POP a una ruta aún no precargada, re-disparamos navegación
        if (action === Action.Pop) {
          router.navigateTo(pathname);
          return;
        }

        // NotFound (sin layouts para evitar confusiones)
        cb(createElement(NoFoundPage));
      }
    );

    // Primera navegación al path actual
    this.navigateTo(this.history.location.pathname, { replace: true });

    return unlisten;
  }

  public navigateTo(pathname: string, opt: INavigateTo = {}) {
    if (this.loading) return;

    this.loading = true;
    const ctx = structuredClone(opt);

    (async () => {
      // 1) Auth gates
      pathname = await this.isAuthenticated(pathname, ctx);

      const page = this.routes[pathname];

      // 2) Not found: sólo cambia history
      if (!page) {
        this.updateHistory(pathname, ctx);
        return;
      }

      // 3) Lazy-load de la página
      if (!page.Component) {
        await page();
      }

      // 4) Lazy-load de todos los layouts requeridos por el path
      const needed = this.collectLayoutPaths(pathname);
      for (const p of needed) {
        const layout = this.layouts[p];
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
            const l = this.layouts[needed[i]];
            if (l?.onInit) {
              ctx.state = await l.onInit();
              break;
            }
          }
        }
      }

      // 6) Empuja/reemplaza history (el listener renderiza sincrónicamente)
      this.updateHistory(pathname, ctx);
    })()
      .catch((error) => {
        console.error(error);
      })
      .finally(() => {
        this.loading = false;
      });
  }

  private async isAuthenticated(pathname: string, ctx: INavigateTo) {
    if (!pathname.startsWith("/cms") && !pathname.startsWith("/login")) {
      return pathname;
    }

    ctx.replace = true;

    try {
      const { id } = await isAuthenticated();

      if (id && pathname.startsWith("/cms")) return pathname;
      if (!id && pathname.startsWith("/cms")) return "/login";
      if (id && pathname.startsWith("/login")) return "/cms";
      return "/login";
    } catch (error) {
      if (process.env.NODE_ENV === "development") console.error(error);
      return "/";
    }
  }

  private updateHistory(pathname: string, { state, replace }: INavigateTo) {
    const serializedState = applyHelpersToSerialized(state);
    if (replace) this.history.replace(pathname, serializedState);
    else this.history.push(pathname, serializedState);
  }

  /** Crea un IPage lazy que guarda Component/onInit la primera vez */
  private toPage(loader: () => Promise<unknown>): IPage {
    const wrapper: any = async () => {
      const module: any = await loader();
      wrapper.Component = module.default ?? NoFoundPage;
      wrapper.onInit = module.onInit;
    };
    return wrapper as IPage;
  }

  /** Crea un ILayout lazy que guarda Component/onInit la primera vez */
  private toLayout(loader: () => Promise<unknown>): ILayout {
    const wrapper: any = async () => {
      const module: any = await loader();
      wrapper.Component =
        module.default ??
        (({ children }: { children?: JSX.Element }) =>
          createElement("div", null, children));
      wrapper.onInit = module.onInit;
    };
    return wrapper as ILayout;
  }

  /** Convierte './foo/bar/page.tsx' -> '/foo/bar' (ruta de la página) */
  private toPathnameFromPage(filename: string): string {
    const path = filename
      .replace(/^\.\//, "/")
      .replace(/\/page\.tsx?$/, "")
      .toLowerCase();
    return path === "" ? "/" : path;
  }

  /** Convierte './foo/_layout.tsx' -> '/foo' (carpeta del layout) */
  private toPathnameFromLayout(filename: string): string {
    const path = filename
      .replace(/^\.\//, "/")
      .replace(/\/_layout\.tsx?$/, "")
      .toLowerCase();
    return path === "" ? "/" : path;
  }

  /** Devuelve rutas de layouts padre de un path: '/', '/a', '/a/b', ... (si existen) */
  private collectLayoutPaths(pathname: string): string[] {
    const parts = pathname.split("/").filter(Boolean);
    const acc: string[] = ["/"]; // raíz siempre considerada
    let curr = "";
    for (const p of parts) {
      curr += "/" + p;
      acc.push(curr);
    }
    // filtra sólo los que están registrados como layout
    return acc.filter((p) => this.layouts[p]);
  }

  /** Envuelve un elemento de página con layouts (root -> más interno) */
  private wrapWithLayouts(pathname: string, element: JSX.Element): JSX.Element {
    const paths = this.collectLayoutPaths(pathname);
    let wrapped = element;
    for (let i = paths.length - 1; i >= 0; i--) {
      const L = this.layouts[paths[i]];
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
    return wrapped;
  }
}

const router = new Router();

export default router;

/** Tipos */
interface IPage {
  (): Promise<void>;
  Component?: () => JSX.Element;
  onInit?: () => Promise<Record<string, unknown>>;
}

interface ILayout {
  (): Promise<void>;
  Component?: (props: { children?: JSX.Element }) => JSX.Element;
  onInit?: () => Promise<Record<string, unknown>>;
}

interface INavigateTo {
  replace?: boolean;
  state?: Record<string, unknown>;
}

type IRoute = Record<string, IPage>;
type ILayouts = Record<string, ILayout>;
