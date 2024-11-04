process.env.NODE_ENV = "production";

const path = require("path");
const configCRA = require("react-scripts/config/webpack.config")(
  process.env.NODE_ENV
);

module.exports = initConfigServer(configCRA);

function initConfigServer(configCRA) {
  const { resolve, module } = configCRA;

  const [, , svg, babel] = module.rules.find((r) => r.oneOf).oneOf;

  return {
    target: "node",
    entry: "./src/router/server/index.tsx",
    externals: [nodeExternals],
    resolve,
    output: {
      path: path.resolve(__dirname, "dist"),
      filename: "index.js",
      libraryTarget: "commonjs2",
    },
    node: {
      __dirname: false,
      __filename: false,
    },
    module: {
      rules: [{ oneOf: [svg, babel] }],
    },
  };
}

// Función para mantener las dependencias de node_modules como externas
function nodeExternals({ request }, callback) {
  if (isBackend(request)) {
    return callback(null, "commonjs " + request);
  }

  if (isOnlyFrontEnd(request)) {
    // Retorna un módulo vacío
    return callback(null, "var {}");
  }

  callback();
}

function isBackend(request) {
  return (
    request.startsWith("backend") ||
    request.startsWith("react-dom") ||
    ["express", "path", "react", "os"].includes(request)
  );
}

function isOnlyFrontEnd(request) {
  return request.startsWith("bootstrap") || /\.(css|scss|sass)$/.test(request);
}
