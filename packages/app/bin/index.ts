import http from "node:http";
import express from "express";
import { createRpc } from "@mapineda48/agape-core/server";

const IsDevelopment = process.env.NODE_ENV !== "production";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());

const rpc = await createRpc({
  createContext: (auth) => auth ?? {},
  runContext: (_ctx, callback) => callback(),
});

app.use(rpc.middleware);

if (IsDevelopment) {
  const { createDevMiddleware } = await import("@mapineda48/agape-web/server");
  app.use(await createDevMiddleware(server));
} else {
  const { distDir, indexHtml } = await import("@mapineda48/agape-web/paths");

  app.use(express.static(distDir));

  app.get("*", (_req, res) => {
    res.sendFile(indexHtml);
  });
}

server.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
