import { type JSX, createElement } from "react";
import NoFoundPage from "../../app/NotFound";
import type { RouteParams, MatchResult } from "./types";

export type ModuleType = Record<string, () => Promise<unknown>>;

export interface IPage {
  (): Promise<void>;
  Component?: () => JSX.Element;
  onInit?: (args: { params: RouteParams }) => Promise<Record<string, unknown>>;
}

export interface ILayout {
  (): Promise<void>;
  Component?: (props: { children?: JSX.Element }) => JSX.Element;
  onInit?: (args: { params: RouteParams }) => Promise<Record<string, unknown>>;
}

export type IRoute = Record<string, IPage>;
export type ILayouts = Record<string, ILayout>;

/**
 * Matches a pathname against a route pattern and extracts parameters.
 * Pattern uses :param syntax for dynamic segments.
 *
 * @example
 * matchPath('/users/:id', '/users/123') // { id: '123' }
 * matchPath('/posts/:postId/comments/:commentId', '/posts/42/comments/99')
 * // { postId: '42', commentId: '99' }
 * matchPath('/users/:id', '/posts/123') // null
 */
function matchPath(pattern: string, pathname: string): RouteParams | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathnameParts = pathname.split("/").filter(Boolean);

  // Must have same number of segments
  if (patternParts.length !== pathnameParts.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathnamePart = pathnameParts[i];

    // Dynamic segment - extract param
    if (patternPart.startsWith(":")) {
      const paramName = patternPart.slice(1);
      params[paramName] = decodeURIComponent(pathnamePart);
    }
    // Static segment - must match exactly
    else if (patternPart !== pathnamePart) {
      return null;
    }
  }

  return params;
}

export class RouteRegistry {
  private routes: IRoute = {};
  private layouts: ILayouts = {};

  constructor(pageModules: ModuleType, layoutModules: ModuleType) {
    this.initRoutesAndLayouts(pageModules, layoutModules);
  }

  public getPage(pathname: string): IPage | undefined {
    return this.routes[pathname];
  }

  /**
   * Gets a page and extracts route parameters if the route is parameterized.
   * First tries exact match, then searches for parameterized routes.
   *
   * @param pathname - The pathname to match
   * @returns Object with page and params, or null if no match
   */
  public getPageWithParams(
    pathname: string
  ): (MatchResult & { page: IPage }) | null {
    // Try exact match first (for non-parameterized routes)
    const exactPage = this.routes[pathname];
    if (exactPage) {
      return {
        page: exactPage,
        params: {},
        pattern: pathname,
      };
    }

    // Search for parameterized route that matches
    for (const [pattern, page] of Object.entries(this.routes)) {
      // Skip patterns without params
      if (!pattern.includes(":")) {
        continue;
      }

      const params = matchPath(pattern, pathname);
      if (params !== null) {
        return {
          page,
          params,
          pattern,
        };
      }
    }

    return null;
  }

  public getLayout(pathname: string): ILayout | undefined {
    return this.layouts[pathname];
  }

  /** Devuelve rutas de layouts padre de un path: '/', '/a', '/a/b', ... (si existen) */
  public getLayoutPaths(pathname: string): string[] {
    const parts = pathname.split("/").filter(Boolean);
    const acc: string[] = ["/"]; // raíz siempre considerada
    let curr = "";
    for (const p of parts) {
      curr += "/" + p;
      acc.push(curr);
    }

    const foundLayouts: string[] = [];

    for (const pathToCheck of acc) {
      // 1. Exact match
      if (this.layouts[pathToCheck]) {
        foundLayouts.push(pathToCheck);
        continue;
      }

      // 2. Parameterized match
      for (const layoutPattern of Object.keys(this.layouts)) {
        if (layoutPattern.includes(":")) {
          const match = matchPath(layoutPattern, pathToCheck);
          if (match) {
            foundLayouts.push(layoutPattern);
            break;
          }
        }
      }
    }

    return foundLayouts;
  }

  /** Escanea páginas y layouts y los registra como loaders lazy */
  private initRoutesAndLayouts(
    pageModules: ModuleType,
    layoutModules: ModuleType
  ) {
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

  /**
   * Convierte './foo/bar/page.tsx' -> '/foo/bar' (ruta de la página)
   * Convierte './users/[id]/page.tsx' -> '/users/:id' (ruta con parámetros)
   */
  private toPathnameFromPage(filename: string): string {
    const path = filename
      .replace(/^\.\//, "/")
      .replace(/\/page\.tsx?$/, "")
      // Convert [param] to :param
      .replace(/\[([^\]]+)\]/g, ":$1")
      .toLowerCase();
    return path === "" ? "/" : path;
  }

  /** Convierte './foo/_layout.tsx' -> '/foo' (carpeta del layout) */
  private toPathnameFromLayout(filename: string): string {
    const path = filename
      .replace(/^\.\//, "/")
      .replace(/\/_layout\.tsx?$/, "")
      // Convert [param] to :param
      .replace(/\[([^\]]+)\]/g, ":$1")
      .toLowerCase();
    return path === "" ? "/" : path;
  }
}
