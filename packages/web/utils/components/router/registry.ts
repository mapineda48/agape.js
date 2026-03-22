import { type JSX, createElement } from "react";
import type { RouteParams, MatchResult, LayoutMatch } from "./types";
import {
  matchPath,
  filePathToPageRoute,
  filePathToLayoutRoute,
} from "./path-utils";
import NotFoundPage from "#web/components/NotFound";

export type ModuleType = Record<string, () => Promise<unknown>>;

export interface IPage {
  (): Promise<void>;
  Component?: () => JSX.Element;
  onInit?: (args: {
    params: RouteParams;
    query: Record<string, string>;
  }) => Promise<Record<string, unknown>>;
}

export interface ILayout {
  (): Promise<void>;
  Component?: (props: { children?: JSX.Element }) => JSX.Element;
  onInit?: (args: {
    params: RouteParams;
    query: Record<string, string>;
  }) => Promise<Record<string, unknown>>;
  /**
   * If true, this layout becomes the new root, ignoring all parent layouts.
   * This can be overridden by child layouts that also have root: true.
   */
  root?: boolean;
}

export type IRoute = Record<string, IPage>;
export type ILayouts = Record<string, ILayout>;

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
    pathname: string,
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

  /**
   * Finds all parent layouts for a given pathname.
   * Returns both the pattern (to look up the layout) and the concrete path
   * (to set as context for relative navigation).
   *
   * @example
   * // For pathname "/users/123/profile"
   * getLayoutPaths("/users/123/profile")
   * // Returns:
   * // [
   * //   { pattern: "/", concretePath: "/" },
   * //   { pattern: "/users/:id", concretePath: "/users/123" },
   * //   { pattern: "/users/:id/profile", concretePath: "/users/123/profile" }
   * // ]
   */
  public getLayoutPaths(pathname: string): LayoutMatch[] {
    const parts = pathname.split("/").filter(Boolean);
    const acc: string[] = ["/"]; // root is always considered
    let curr = "";
    for (const p of parts) {
      curr += "/" + p;
      acc.push(curr);
    }

    const foundLayouts: LayoutMatch[] = [];

    for (const pathToCheck of acc) {
      // 1. Exact match - pattern and concretePath are the same
      if (this.layouts[pathToCheck]) {
        foundLayouts.push({
          pattern: pathToCheck,
          concretePath: pathToCheck,
        });
        continue;
      }

      // 2. Parameterized match - pattern differs from concretePath
      for (const layoutPattern of Object.keys(this.layouts)) {
        if (layoutPattern.includes(":")) {
          const match = matchPath(layoutPattern, pathToCheck);
          if (match) {
            foundLayouts.push({
              pattern: layoutPattern,
              concretePath: pathToCheck, // Use the actual path, not the pattern!
            });
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
    layoutModules: ModuleType,
  ) {
    // Páginas
    Object.entries(pageModules).forEach(([filename, loader]) => {
      const pathname = filePathToPageRoute(filename);
      this.routes[pathname] = this.toPage(loader);
    });

    // Layouts
    Object.entries(layoutModules).forEach(([filename, loader]) => {
      const dirpath = filePathToLayoutRoute(filename);
      this.layouts[dirpath] = this.toLayout(loader);
    });

    if (process.env.NODE_ENV === "development") {
      console.log("Registered routes:", this.routes);
      console.log("Registered layouts:", this.layouts);
    }
  }

  /** Crea un IPage lazy que guarda Component/onInit la primera vez */
  private toPage(loader: () => Promise<unknown>): IPage {
    const wrapper = (async () => {
      const mod = await loader() as Record<string, unknown>;
      const Component = (mod.default as (() => JSX.Element)) ?? NotFoundPage;
      const onInit = mod.onInit as IPage["onInit"];
      wrapper.Component = Component;
      wrapper.onInit = onInit;
    }) as unknown as IPage;
    return wrapper;
  }

  /** Creates a lazy ILayout that stores Component/onInit/root on first load */
  private toLayout(loader: () => Promise<unknown>): ILayout {
    const wrapper = (async () => {
      const mod = await loader() as Record<string, unknown>;
      wrapper.Component =
        (mod.default as ILayout["Component"]) ??
        (({ children }: { children?: JSX.Element }) =>
          createElement("div", null, children));
      wrapper.onInit = mod.onInit as ILayout["onInit"];
      // Capture root property if exported
      wrapper.root = (mod.root as boolean) ?? false;
    }) as unknown as ILayout;
    return wrapper;
  }
}
