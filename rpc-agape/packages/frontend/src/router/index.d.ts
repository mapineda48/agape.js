import { BrowserHistory } from "history";

export const routes: PageRoute[];

export function Server(props: {
  children: JSX.Element;
  pathname: string;
}): JSX.Element;

export default function bootApp(
  history: BrowserHistory,
  props: unknown
): Promise<() => JSX.Element>;

export function useRouter(): App;

interface App {
  auth: (cb: any) => any;
  push: (pathname: string) => any;
  replace: (pathname: string, props?: {}) => any;
  onUpdate: (cb: (state: Page) => void) => () => void;
  pathname: string;
}

type PageRoute = [string, () => Promise<PageModule>];

export interface PageModule {
  default: (props?: {}) => JSX.Element;
  OnInit?: (...args: unknown[]) => Promise<{}>;
}
