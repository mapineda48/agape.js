import logger from "#lib/log/logger";
import parseStackWeb from "#lib/log/source-map";


export default async function notifyStackWeb(stack: string) {
    logger.error('[web] Ups...');

    try {
        await parseStackWeb(stack);
    }
    catch (error) {
        console.log(error);
    }
}