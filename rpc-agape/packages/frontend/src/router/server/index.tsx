import path from "path";
import fs from "fs";
import os from "os";
import express from "express";
import { renderToString } from "react-dom/server";
import { Server, routes } from "..";
import { Fragment } from "react/jsx-runtime";
import { user } from "backend/service/auth";

const tmpdir = path.join(os.tmpdir(), "static-page-agape-app");

const build = path.join(__dirname, "www");
const index = path.join(__dirname, "index.html");

const html = fs.readFileSync(index, "utf8");

export const pages = ["/login", "/cms/*"];

export default async function prepareMiddlewareSPA(isDev = false) {
  const router = express.Router();

  router.use(express.static(build, { maxAge: isDev ? 0 : 1000000 }));

  router.get("/login", (req, res, next) => {
    if (user.id) {
      return res.redirect("/cms/");
    }

    next();
  });

  router.get("/cms/*", (req, res, next) => {
    if (!user.id) {
      return res.redirect("/login");
    }

    next();
  });

  /**
   * Single Page Handlers
   */
  let existsTmpDir = fs.existsSync(tmpdir);

  if (isDev && existsTmpDir) {
    await fs.promises.rm(tmpdir, { recursive: true });
    existsTmpDir = false;
  }

  await Promise.all(
    routes.map(async ([pattern, getModule]) => {
      const { OnInit, default: Page } = await getModule();

      // Dynamic Page
      if (OnInit) {
        router.get(pattern, async (req, res) => {
          const props = await OnInit();

          const html = renderHtml(
            <Fragment>
              <div id="root">
                <Server pathname={req.url}>
                  <Page {...props} />
                </Server>
              </div>
              <script
                id="props"
                type="application/json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(props) }}
              />
            </Fragment>
          );

          res.send(html);
        });

        return;
      }

      // Static Page
      const filename = getStaticPageFileName(pattern);
      router.get(pattern, (req, res) => res.sendFile(filename));

      if (existsTmpDir) {
        return;
      }

      const dir = path.dirname(filename);

      await fs.promises.mkdir(dir, { recursive: true });

      const html = renderHtml(
        <div id="root">
          <Server pathname={pattern}>
            <Page />
          </Server>
        </div>
      );

      await fs.promises.writeFile(filename, html);
    })
  );

  // return router
  return router;
}

function getStaticPageFileName(pattern: string) {
  return path.join(
    tmpdir,
    "static-page",
    (pattern.endsWith("/") ? pattern + "index" : pattern) + ".html"
  );
}

function renderHtml(Page: JSX.Element) {
  return html.replace('<div id="root"></div>', renderToString(Page));
}
