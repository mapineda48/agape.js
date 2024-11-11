const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = __filename.endsWith("server.js");
const web = next({ dev });

const { default: backend } = require("agape-backend");

(async () => {
  const server = await backend();
  await web.prepare();

  const handle = web.getRequestHandler();

  server.use((req, res) => handle(req, res));

  server.listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`
    );
  });
})().catch((err) => {
  throw err;
});
