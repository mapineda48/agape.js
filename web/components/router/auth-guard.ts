import { isAuthenticated } from "@agape/access";

export interface INavigateTo {
  replace?: boolean;
  state?: Record<string, unknown>;
}

export class AuthGuard {
  public async check(pathname: string, ctx: INavigateTo): Promise<string> {
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
}
