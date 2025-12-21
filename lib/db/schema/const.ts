const {
    NODE_ENV = import.meta.filename.endsWith(".ts") ? "development" : "test"
} = process.env;

export const schemaName = `agape_app_${NODE_ENV}_demo`;
