import { Action, createBrowserHistory } from "history";
import { createElement, JSX, useEffect, useState } from "react";
import NoFoundPage from "./NotFound";
import { isAuthenticated, session } from "@agape/access";

/**
 * Router class to manage dynamic page loading, navigation,
 * and history listening in a React application.
 */
export class Router {
    // History instance from the history library for navigation control
    private history = createBrowserHistory();

    get pathname() {
        return this.history.location.pathname;
    }

    // Map of route paths to their corresponding lazy-loaded pages
    private routes: IRoute = {};

    // Flag to prevent concurrent navigation or loading
    private loading = false;

    /**
     * Constructor initializes routes and performs first navigation
     */
    constructor() {
        // Load all page modules into the routes map
        this.initRoutes();
    }

    /**
     * Scan for all index.ts and index.tsx files under this directory,
     * create lazy loaders, and store them under their URL paths.
     */
    private initRoutes() {
        const modules = import.meta.glob<unknown>("./**/index.{ts,tsx}");

        Object.entries(modules).forEach(([filename, loader]) => {
            // Convert filename to URL-friendly pathname
            const pathname = this.toPathname(filename);

            // Wrap the dynamic import loader into our IPage structure
            this.routes[pathname] = this.toPage(loader);
        });

        // Log the routes map for debugging purposes
        if (process.env.NODE_ENV === "development") {
            console.log("Registered routes:", this.routes);
        }
    }

    /**
     * Subscribe to history changes. On each navigation, create the new
     * React element and pass it to the provided callback.
     * @param cb - Callback receiving the rendered page element
     */
    public listen(cb: (page: JSX.Element) => void) {
        const unlisten = this.history.listen(({ location: { pathname, state }, action }) => {
            const { Component } = this.routes[pathname] ?? {};

            if (Component) {
                // Use navigation state as component props, if provided
                const props = (state as Record<string, unknown>) ?? {};

                // Create and pass the React element
                cb(createElement(Component, props));
                return
            }

            if (action === Action.Pop) {
                router.navigateTo(pathname);
                return
            }

            // show not found page
            cb(createElement(NoFoundPage));
            return;
        });

        // Navigate to the current browser location on startup
        this.navigateTo(this.history.location.pathname, { replace: true });

        return unlisten;
    }

    private isAuthenticated(pathname: string, opt: INavigateTo) {
        console.log(session);
        if ((!pathname.startsWith("/cms") && pathname !== "/login") || opt.isAuthenticated) {
            return;
        }

        if (session === null) {
            this.loading = true;

            isAuthenticated()
                .finally(() => {
                    this.loading = false;
                    this.navigateTo(pathname, opt);
                });
        } else {

            this.navigateTo((session.id ? pathname.startsWith("/cms") ? pathname : "/cms" : "/login"), { ...opt, isAuthenticated: true })
        }


        return true;
    }

    /**
     * Navigate to a given pathname. Handles lazy loading of modules,
     * optional onInit logic, and pushes or replaces history entries.
     * @param pathname - URL path to navigate to
     * @param options - Options for replace and initial state
     */
    public navigateTo(pathname: string, options: INavigateTo = {}) {
        console.log({ pathname, loading: this.loading, session })
        if (this.loading) return;

        if (this.isAuthenticated(pathname, options)) {
            return;
        }

        const page = this.routes[pathname];

        // show not found page
        if (!page) {
            this.updateHistory(pathname, options);
            return;
        }

        // If the component isn't loaded yet, load it first
        if (!page.Component) {
            this.loading = true;
            page()
                .then(() => {
                    this.loading = false;
                    // Retry navigation after module loads
                    this.navigateTo(pathname, options);
                })
                .catch((err) => {
                    this.loading = false;
                    console.error("Failed to load module for route:", err);
                });
            return;
        }

        // If an onInit hook is provided and no state passed, run it
        if (page.onInit && !options.state) {
            this.loading = true;
            page.onInit()
                .then((props) => {
                    this.loading = false;
                    // Navigate again with the props from onInit
                    this.navigateTo(pathname, { ...options, state: props });
                })
                .catch((error) => {
                    this.loading = false;
                    console.error("onInit error:", error);
                    // Proceed with empty state on failure
                    this.navigateTo(pathname, { ...options, state: {} });
                });
            return;
        }

        this.updateHistory(pathname, options);
    }

    private updateHistory(pathname: string, { state, replace }: INavigateTo) {
        if (replace) {
            this.history.replace(pathname, state);
        } else {
            this.history.push(pathname, state);
        }
    }

    /**
     * Wraps a dynamic import loader to asynchronously load a module,
     * then extract its default component and optional onInit function.
     * @param loader - Function returning the dynamic import promise
     */
    private toPage(loader: () => Promise<unknown>): IPage {
        const wrapper: any = async () => {
            const module: any = await loader();

            // Save component and onInit for future navigations
            wrapper.Component = module.default ?? NoFoundPage;
            wrapper.onInit = module.onInit;
        };
        return wrapper as IPage;
    }

    /**
     * Convert a glob filename into a URL pathname:
     * - Remove leading './'
     * - Strip '/index.ts' or '/index.tsx'
     * - Convert to lowercase
     * - Map empty string to '/'
     */
    private toPathname(filename: string): string {
        const path = filename
            .replace(/^\.\//, "/")
            .replace(/\/index\.tsx?$/, "")
            .toLowerCase();
        return path === "" ? "/" : path;
    }
}

// Create and export a singleton router instance
export const router = new Router();

/**
 * Routes component for React apps. Subscribes to router events
 * and updates local state with the current page element.
 */
export default function Routes() {
    const [state, setState] = useState<null | JSX.Element>(null);

    // Start listening for route changes
    useEffect(() => router.listen(setState), []);

    // Render the current page, or null until first route executes
    return state;
}

/**
 * Types (moved to bottom for readability)
 */
interface IPage {
    (): Promise<void>;
    Component?: () => JSX.Element;
    onInit?: () => Promise<{}>;
}

interface INavigateTo {
    replace?: boolean;
    state?: Record<string, unknown>;
    isAuthenticated?: boolean
}

type IRoute = Record<string, IPage>;
