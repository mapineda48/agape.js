const { NODE_ENV = "development" , AGAPE_SCHEMA = "public" } = process.env;

export default { name: `${AGAPE_SCHEMA}_${NODE_ENV}` };