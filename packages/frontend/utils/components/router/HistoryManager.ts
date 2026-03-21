import { Action } from "history";
import { createElement, type JSX } from "react";
import NotFoundPage from "#web/components/NotFound";
import Unauthorized from "#web/components/Unauthorized";
import { RouterPathProvider } from "./path-context";
import { RouteRegistry, type ModuleType } from "./registry";
import { Navigator } from "./navigator";
import {
  AuthGuard,
  type IAuthService,
  type IPermissionService,
  type AuthGuardConfig,
} from "./auth-guard";
import type { RouteParams, INavigateTo } from "./types";
import type { SSRPageData } from "#shared/ssr";
import { checkError } from "#web/utils/error";
import { isAuthenticated, session } from "#services/security/session";
import { canAccessRoute, getRoutePermission } from "#web/utils/rbca";

/**
 * Default authentication service using the session module.
 */
const defaultAuthService: IAuthService = {
  isAuthenticated,
};

/**
 * Default permission service using the RBAC module.
 */
const defaultPermissionService: IPermissionService = {
  getPermissions: () => session?.permissions ?? [],
  canAccessRoute,
  getRoutePermission,
};

/**
 * Options for configuring HistoryManager.
 */
export interface HistoryManagerOptions {
  /** Custom authentication service for testing */
  authService?: IAuthService;
  /** Custom permission service for testing */
  permissionService?: IPermissionService;
  /** AuthGuard configuration */
  authGuardConfig?: AuthGuardConfig;
}

export default class HistoryManager {
  public navigator: Navigator;
  public registry: RouteRegistry;
  public authGuard: AuthGuard;

  private loading = false;
  private currentParams: RouteParams = {};

  constructor(
    pageModules: ModuleType = {},
    layoutModules: ModuleType = {},
    options: HistoryManagerOptions = {},
  ) {
    this.navigator = new Navigator();
    this.registry = new RouteRegistry(pageModules, layoutModules);

    // Use provided services or defaults
    const authService = options.authService ?? defaultAuthService;
    const permissionService =
      options.permissionService ?? defaultPermissionService;

    this.authGuard = new AuthGuard(
      authService,
      permissionService,
      options.authGuardConfig,
    );
  }

  get pathname() {
    return this.navigator.pathname;
  }

  get params(): RouteParams {
    return { ...this.currentParams };
  }

  public listenPath(cb: (pathname: string) => void) {
    const unlisten = this.navigator.listen((pathname) => {
      cb(pathname);
    });
    return unlisten;
  }

  public listenParams(cb: (params: RouteParams) => void) {
    const unlisten = this.navigator.listen(() => {
      cb(this.params);
    });
    return unlisten;
  }

  public listenPage(cb: (page: JSX.Element) => void, ssrData?: SSRPageData) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unlisten = this.navigator.listen((pathname, action, state: any) => {
      // Check if this navigation was denied by RBAC
      if (state?.deniedPermission) {
        this.currentParams = {};
        cb(
          createElement(Unauthorized, {
            requiredPermission: state.deniedPermission,
          }),
        );
        return;
      }

      const result = this.registry.getPageWithParams(pathname);

      // Si existe una página registrada, construimos el árbol con layouts
      if (result?.page.Component) {
        // Update current params
        this.currentParams = result.params;

        const props = {
          ...state,
          params: result.params,
        };

        const element = this.wrapWithLayouts(
          pathname,
          createElement(result.page.Component, props),
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
      this.currentParams = {};
      cb(createElement(NotFoundPage));
    });

    if (ssrData) {
      // SSR hydration: the page was already rendered on the server.
      // Build the initial element using SSR data so it matches the server HTML,
      // then do a full navigateTo to load lazy modules for subsequent navigation.
      this.hydrateFromSSR(cb, ssrData);
    } else {
      // SPA: primera navegación al path actual
      const initialPath =
        this.navigator.pathname + this.navigator.history.location.search;
      this.navigateTo(initialPath, { replace: true });
    }

    return unlisten;
  }

  /**
   * Handles SSR hydration: renders the initial page from server data,
   * then eagerly loads modules so subsequent SPA navigation works.
   */
  private hydrateFromSSR(cb: (page: JSX.Element) => void, ssrData: SSRPageData) {
    const { pathname, params, props } = ssrData;

    // Find the page in the registry (it's a lazy loader at this point)
    const result = this.registry.getPageWithParams(pathname);
    if (!result) {
      // Fallback to normal SPA navigation if page not found
      this.navigateTo(pathname, { replace: true });
      return;
    }

    // Load page and layout modules eagerly, then render with SSR props
    (async () => {
      const { page } = result;

      // Lazy-load the page module
      if (!page.Component) {
        await page();
      }

      // Lazy-load all required layouts
      const layoutMatches = this.registry.getLayoutPaths(pathname);
      for (const { pattern } of layoutMatches) {
        const layout = this.registry.getLayout(pattern);
        if (layout && !layout.Component) {
          await layout();
        }
      }

      // Build element with server props (matches server render)
      this.currentParams = params;
      const pageProps = { ...props, params };
      const element = this.wrapWithLayouts(
        pathname,
        createElement(page.Component!, pageProps),
      );

      cb(element);

      // Replace history state with SSR props so POP navigation works
      this.navigator.updateHistory(
        pathname + this.navigator.history.location.search,
        { state: props, replace: true },
      );
    })().catch((error) => {
      checkError(error);
      // Fallback to normal SPA navigation
      this.navigateTo(pathname, { replace: true });
    });
  }

  public navigateTo(pathname: string, opt: INavigateTo = {}) {
    if (this.loading) return;

    this.loading = true;
    const ctx = opt;

    (async () => {
      // 1) Auth gates (authentication + RBAC)
      const authResult = await this.authGuard.check(pathname, ctx);
      pathname = authResult.pathname;

      // 1.1) Permission denied - pass through state for listenPage to handle
      if (authResult.deniedPermission) {
        this.currentParams = {};
        ctx.state = { deniedPermission: authResult.deniedPermission };
        this.navigator.updateHistory(pathname, ctx);
        return;
      }

      // Parse actual path and query from the pathname string
      // Use a dummy base because pathname might be relative or just absolute path
      const url = new URL(pathname, "http://dummy");
      const cleanPath = url.pathname;
      const query = Object.fromEntries(url.searchParams);

      const result = this.registry.getPageWithParams(cleanPath);

      // 2) Not found: sólo cambia history y limpia params
      if (!result) {
        this.currentParams = {};
        this.navigator.updateHistory(pathname, ctx);
        return;
      }

      const { page, params } = result;

      // 3) Lazy-load de la página
      if (!page.Component) {
        await page();
      }

      // 4) Lazy-load all required layouts for the path
      const layoutMatches = this.registry.getLayoutPaths(cleanPath);
      for (const { pattern } of layoutMatches) {
        const layout = this.registry.getLayout(pattern);
        if (layout && !layout.Component) {
          await layout();
        }
      }

      // 5) Execute onInit from the first one that defines it (no state provided):
      //    priority: page > innermost layout > ... > root
      if (!ctx.state) {
        if (page.onInit) {
          ctx.state = await page.onInit({ params, query });
        } else {
          for (let i = layoutMatches.length - 1; i >= 0; i--) {
            const l = this.registry.getLayout(layoutMatches[i].pattern);
            if (l?.onInit) {
              ctx.state = await l.onInit({ params, query });
              break;
            }
          }
        }
      }

      // 6) Update current params before history update
      this.currentParams = params;

      // 7) Push/replace history (the listener renders synchronously)
      this.navigator.updateHistory(pathname, ctx);
    })()
      .catch((error) => {
        checkError(error);
        // Navigate to show error page instead of leaving blank
        this.currentParams = {};
        this.navigator.updateHistory(pathname, { replace: true });
      })
      .finally(() => {
        this.loading = false;
      });
  }

  /**
   * Wraps a page element with layout components (root -> innermost).
   * Uses concretePath for RouterPathProvider to enable proper relative navigation
   * even for dynamic layouts with parameters.
   *
   * If a layout exports `root: true`, it becomes the new root and all
   * parent layouts before it are ignored. If multiple layouts have `root: true`,
   * the innermost (closest to page) takes precedence.
   */
  private wrapWithLayouts(pathname: string, element: JSX.Element): JSX.Element {
    const layoutMatches = this.registry.getLayoutPaths(pathname);

    // Find the last (innermost) layout with root: true
    // All layouts before this index will be ignored
    let rootIndex = 0;
    for (let i = layoutMatches.length - 1; i >= 0; i--) {
      const { pattern } = layoutMatches[i];
      const L = this.registry.getLayout(pattern);
      if (L?.root) {
        rootIndex = i;
        break;
      }
    }

    let wrapped = element;
    for (let i = layoutMatches.length - 1; i >= rootIndex; i--) {
      const { pattern, concretePath } = layoutMatches[i];
      const L = this.registry.getLayout(pattern);
      if (L?.Component) {
        // Wrap the layout component with RouterPathProvider
        // Use concretePath (e.g., "/users/123") not pattern (e.g., "/users/:id")
        // This ensures relative navigation works correctly in dynamic layouts
        const layoutElement = createElement(L.Component, null, wrapped);
        wrapped = createElement(
          RouterPathProvider,
          { path: concretePath },
          layoutElement,
        );
      }
    }
    return wrapped;
  }
}
