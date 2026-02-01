import logger from "#lib/log/logger";
import parseStackWeb from "#lib/log/source-map";

export async function notifyError(stack: string) {
  try {
    await parseStackWeb(stack);
  } catch (error) {
    logger.scope("Web App").error("Error parsing stack trace", error);
  }
}
