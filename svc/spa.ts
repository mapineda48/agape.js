import logger from "#lib/log/logger";
import parseStackWeb from "#lib/log/source-map";

export async function notifyError(stack: string) {
  //logger.scope('SPA').error('Ups...');

  try {
    await parseStackWeb(stack);
  } catch (error) {
    logger.scope("SPA").error("Error parsing stack trace", error);
  }
}
