import cluster from 'cluster';
import os from 'os';
import logger from '#logger';

const MAX_RESTARTS = 5;
const restartAttempts = new Map<number, number>();

if (cluster.isPrimary) {
    // Master process: launch one worker per CPU
    const cpuCount = os.cpus().length;
    
    logger.log(`[cluster] Master ${process.pid} lanzando ${cpuCount} workers…`);

    // Function to fork a new worker and initialize its attempt count
    function forkWorker() {
        const worker = cluster.fork();
        restartAttempts.set(worker.id, 0);
    }

    // Initial launch
    for (let i = 0; i < cpuCount; i++) {
        forkWorker();
    }

    // Handle worker exit and retry logic
    cluster.on('exit', (worker, code, signal) => {
        const prevAttempts = restartAttempts.get(worker.id) ?? 0;
        if (prevAttempts >= MAX_RESTARTS) {
            logger.error(
                `[cluster] Worker ${worker.process.pid} ha fallado ${prevAttempts} veces, no se reiniciará más.`
            );
            return;
        }

        const nextAttempt = prevAttempts + 1;
        restartAttempts.set(worker.id, nextAttempt);
        logger.warning(
            `[cluster] Worker ${worker.process.pid} finalizó (${signal ?? code}). Intento de reinicio ${nextAttempt}/${MAX_RESTARTS}…`
        );

        forkWorker();
    });

} else {
    // Worker process: start the server
    import('./index')
        .then(() => {
            logger.log(`[cluster] Worker ${process.pid} inició correctamente`);
        })
        .catch((error) => {
            logger.error(
                `[cluster] Error arrancando el servidor en worker ${process.pid}:`,
                error
            );
            process.exit(1);
        });
}
