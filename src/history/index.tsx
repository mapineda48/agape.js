import history from "history/browser";
import { JSX, useEffect, useState } from "react";

const route = Object.fromEntries(
  Object.entries(import.meta.glob("../app/**/index.tsx")).map(
    ([filename, import$]: any) => {
      const pathname =
        filename
          .replace("../app", "")
          .replace(/\/index\.tsx$/, "")
          .toLowerCase() || "/";

      const wrapper: any = async () => {
        const module: any = await import$();

        wrapper.Component = module.default;
        wrapper.onInit = module.default.onInit;
      };

      return [pathname, wrapper];
    }
  )
);

let loading = false;

const History = () => {
  const [state, setState] = useState<any>(null);

  useEffect(() => {
    setTimeout(() => History.push(history.location.pathname), 0);

    return history.listen(({ location: { pathname, state } }) => {
      const Page = route[pathname].Component;
      const props: any = state ?? {};

      setState(() => <Page {...props} />);
    });
  }, []);

  return state;
};

History.push = (pathname: string, state?: unknown) => {
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
        history.push(pathname);
      })
      .catch((error: any) => {
        loading = false;
        console.error(error);
      });
    return;
  }

  if (page.onInit && !state) {
    page
      .onInit()
      .then((props: any) => {
        loading = false;
        history.push(pathname, props);
      })
      .catch((error: any) => {
        loading = false;
        console.error(error);
      });

    return;
  }

  history.push(pathname, state ?? {});
};

export default History;

/**
 * Types
 */

export interface IHistory {
  (): JSX.Element;
  push: (path: string) => void;
}
