import chalk from "chalk";
import cluster from "cluster";
import { threadId } from "worker_threads";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private scopeName: string;

  constructor(scopeName: string = "App") {
    this.scopeName = scopeName;
  }

  public scope(name: string): Logger {
    return new Logger(name);
  }

  public debug(message: string, ...args: unknown[]) {
    this.print("debug", message, args);
  }

  public log(message: string, ...args: unknown[]) {
    this.info(message, ...args);
  }

  public info(message: string, ...args: unknown[]) {
    this.print("info", message, args);
  }

  public warn(message: string, ...args: unknown[]) {
    this.print("warn", message, args);
  }

  public error(message: string, ...args: unknown[]) {
    this.print("error", message, args);
  }

  private print(level: LogLevel, message: string, args: unknown[]) {
    // Si está corriendo Vitest, NO imprimir nada
    if (process.env.VITEST_WORKER_ID !== undefined) return;

    const timestamp = new Date().toISOString();
    const thread = this.getThreadInfo();
    const levelColor = this.getLevelColor(level);
    const scope = chalk.gray(`[${this.scopeName}]`);

    const prefix = `${chalk.gray(timestamp)} ${levelColor(
      level.toUpperCase().padEnd(5),
    )} ${scope} ${thread}`;

    const consoleMethod =
      level === "error"
        ? console.error
        : level === "warn"
          ? console.warn
          : console.log;

    consoleMethod(`${prefix} ${message}`, ...args);
  }

  private getLevelColor(level: LogLevel) {
    switch (level) {
      case "debug":
        return chalk.magenta;
      case "info":
        return chalk.blue;
      case "warn":
        return chalk.yellow;
      case "error":
        return chalk.red;
    }
  }

  private getThreadInfo(): string {
    if (cluster.isWorker && cluster.worker) {
      return chalk.gray(`(worker-${cluster.worker.id})`);
    }
    if (threadId) {
      return chalk.gray(`(thread-${threadId})`);
    }
    return "";
  }
}

const logger = new Logger();

export default logger;
