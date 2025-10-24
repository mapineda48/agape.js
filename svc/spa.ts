//import logger from "#lib/log/logger";
import parseStackWeb from "#lib/log/source-map";


export async function notifyError(stack: string) {
    //logger.error('[web] Ups...');

    try {
        await parseStackWeb(stack);
    }
    catch (error) {
        console.log(error);
    }
}