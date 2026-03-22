import { z } from "zod";

const isDev = import.meta.filename.endsWith(".ts");

const envSchema = z.object({
  NODE_ENV: z.string().default(isDev ? "development" : "test"),
  PORT: z.coerce.number().default(3000),

  AGAPE_HOOK: z.string().default("admin"),
  AGAPE_SECRET: z.string().default(import.meta.filename),
  AGAPE_ADMIN: z.string().default("admin"),
  AGAPE_PASSWORD: z.string().default("admin"),
  AGAPE_TENANT: z
    .string()
    .default(isDev ? "agape_app_development_demo" : "agape_app_test_demo"),
  AGAPE_CDN_HOST: z.string().default("http://127.0.0.1:10000"),

  DATABASE_URI: z
    .string()
    .default("postgresql://postgres:mypassword@localhost"),
  AZURE_CONNECTION_STRING: z
    .string()
    .default(
      "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"
    ),
  CACHE_URL: z.string().default("redis://localhost:6379"),
  RESEND_API_KEY: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment variables:");
  for (const issue of result.error.issues) {
    console.error(`  ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

const env = result.data;

export const {
  NODE_ENV,
  PORT,
  AGAPE_HOOK,
  AGAPE_SECRET,
  AGAPE_ADMIN,
  AGAPE_PASSWORD,
  AGAPE_TENANT,
  AGAPE_CDN_HOST,
  DATABASE_URI,
  AZURE_CONNECTION_STRING,
  CACHE_URL,
  RESEND_API_KEY,
} = env;

export const IsDevelopment = NODE_ENV === "development";
export const IsProduction = NODE_ENV === "production";
export const IsTest = NODE_ENV === "test";
