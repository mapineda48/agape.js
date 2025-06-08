import chalk from 'chalk';
import cluster from 'cluster';
import { threadId } from 'worker_threads';

function getTime(): string {
    // Ej: "14:23:45"
    return new Date().toLocaleTimeString();
}

function getThreadInfo(): string {
    if (cluster.isWorker && cluster.worker) {
        return `worker-${cluster.worker.id}`;
    }

    if (!threadId) {
        return "";
    }

    // threadId es 0 en el hilo principal si no usas worker_threads
    return `thread-${threadId}`;
}

function format(level: 'log' | 'warning' | 'error'): string {
    const time = getTime();
    const thread = getThreadInfo();

    const chunks = [time, level.toUpperCase(), thread].filter(r => r);

    return `[${chunks.join(" ")}]`;
}

function log(...args: unknown[]) {
    console.log(chalk.blue(`${format('log')}:`), ...args);
}

function warning(...args: unknown[]) {
    console.warn(chalk.yellow(`${format('warning')}:`), ...args);
}

function error(...args: unknown[]) {
    console.error(chalk.red(`${format('error')}:`), ...args);
}

export default {
    log, warning, error
}