const isTS = process.argv.some(a => a.endsWith(".ts") || a.endsWith(".cjs"));

const { AGAPE_TENANT = "demo", NODE_ENV = isTS ? "development" : "test" } = process.env;

export default {
    schema: `agape_app_${NODE_ENV}_${AGAPE_TENANT}`
};