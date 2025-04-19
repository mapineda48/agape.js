import history from "history/browser";
import { createElement, JSX } from "react";

let loading = false;
const route: IRoute = {};


export default function listen(cb: (page: JSX.Element) => void) {
    Object.entries(import.meta.glob("./**/index.{ts,tsx}")).forEach(([filename, module]) => {
        const pathname = toPathname(filename);
        const page = toPage(module)

        route[pathname] = page;
    });

    navigateTo(history.location.pathname, { replace: true })

    console.log(route);

    return history.listen(({ location: { pathname, state } }) => {
        const Page = route[pathname].Component;

        if (!Page) {
            return;
        }

        const props = state ?? {};

        cb(createElement(Page, props));
    })
}

export function navigateTo(pathname: string, opt: INavigateTo = {}) {
    if (loading) {
        return;
    }

    const page = route[pathname];

    if (!page) {
        throw new Error("not found page");
    }

    if (!page.Component) {
        page()
            .then(() => {
                loading = false;
                navigateTo(pathname);
            })
            .catch((error: any) => {
                loading = false;
                console.error(error);
            });
        return;
    }

    if (page.onInit && !opt.state) {
        page
            .onInit()
            .then((props: {}) => {
                loading = false;
                navigateTo(pathname, { state: props });
            })
            .catch((error: any) => {
                loading = false;
                console.error(error);
                navigateTo(pathname, { state: {} });
            });

        return;
    }

    history.push(pathname, opt.state ?? {});
}

function toPage(import$: () => Promise<unknown>): IPage {
    const wrapper: any = async () => {
        const module: any = await import$();

        wrapper.Component = module.default;
        wrapper.onInit = module.onInit;
    };

    return wrapper;
}

function toPathname(filename: string) {
    return filename
        .replace("./", "/")
        .replace(/\/index\.tsx?$/, "")
        .toLowerCase() || "/";
}

/**
 * Types
 */
interface IPage {
    (): Promise<void>
    Component?: () => JSX.Element
    onInit?: () => Promise<{}>
}

interface INavigateTo {
    replace?: boolean,
    state?: {}
}

type IRoute = {
    [k: string]: IPage;
}