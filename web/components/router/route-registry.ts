import { type JSX, createElement } from "react";
import NoFoundPage from "../../app/NotFound";

export type ModuleType = Record<string, () => Promise<unknown>>;

export interface IPage {
  (): Promise<void>;
  Component?: () => JSX.Element;
  onInit?: () => Promise<Record<string, unknown>>;
}

export interface ILayout {
  (): Promise<void>;
  Component?: (props: { children?: JSX.Element }) => JSX.Element;
  onInit?: () => Promise<Record<string, unknown>>;
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
    // filtra sólo los que están registrados como layout
    return acc.filter((p) => this.layouts[p]);
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
}
