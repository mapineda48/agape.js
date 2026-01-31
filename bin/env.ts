// Load environment variables with default fallbacks (should be overridden in production via env or secrets manager)
export const {
  NODE_ENV = import.meta.filename.endsWith(".ts") ? "development" : "test",
  PORT = "3000",

  AGAPE_HOOK = "admin",
  AGAPE_SECRET = import.meta.filename,
  AGAPE_ADMIN = "admin",
  AGAPE_PASSWORD = "admin",
  AGAPE_TENANT = import.meta.filename.endsWith(".ts")
    ? "agape_app_development_demo"
    : "agape_app_test_demo",
  AGAPE_CDN_HOST = "http://127.0.0.1:10000",

  DATABASE_URI = "postgresql://postgres:mypassword@localhost",
  AZURE_CONNECTION_STRING = "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;",
  CACHE_URL = "redis://localhost:6379",
  RESEND_API_KEY,

  IsDevelopment = NODE_ENV === "development",
  IsProduction = NODE_ENV === "production",
  IsTest = NODE_ENV === "test",
} = process.env;
