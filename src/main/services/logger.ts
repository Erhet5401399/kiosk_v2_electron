import fs from "fs";
import path from "path";
import { app } from "electron";
import { LogLevel } from "../../shared/types";
import { STORAGE } from "../core/constants";

const LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
};
const COLORS: Record<LogLevel, string> = {
  debug: "\x1b[36m",
  info: "\x1b[32m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  fatal: "\x1b[35m",
};

class Logger {
  private static inst: Logger;
  private level: LogLevel;
  private stream: fs.WriteStream | null = null;
  private buffer: string[] = [];

  private constructor() {
    this.level = (process.env.LOG_LEVEL as LogLevel) || "info";
    this.initStream();
  }

  static get(): Logger {
    return this.inst || (this.inst = new Logger());
  }

  private initStream() {
    try {
      const logPath = path.join(app.getPath("userData"), STORAGE.LOG_FILE);
      this.rotateIfNeeded(logPath);
      this.stream = fs.createWriteStream(logPath, { flags: "a" });
    } catch {}
  }

  private rotateIfNeeded(logPath: string) {
    try {
      if (
        fs.existsSync(logPath) &&
        fs.statSync(logPath).size > STORAGE.MAX_LOG_SIZE
      ) {
        fs.renameSync(logPath, `${logPath}.${Date.now()}`);
      }
    } catch {}
  }

  private shouldLog(level: LogLevel): boolean {
    return LEVELS[level] >= LEVELS[this.level];
  }

  private format(
    level: LogLevel,
    ctx: string,
    msg: string,
    data?: unknown,
  ): string {
    const ts = new Date().toISOString();
    const lvl = level.toUpperCase().padEnd(5);
    const extra = data ? ` ${JSON.stringify(data)}` : "";
    return `${ts} ${lvl} [${ctx}] ${msg}${extra}`;
  }

  private write(level: LogLevel, ctx: string, msg: string, data?: unknown) {
    if (!this.shouldLog(level)) return;

    const line = this.format(level, ctx, msg, data);

    if (process.env.NODE_ENV !== "production") {
      console.log(`${COLORS[level]}${line}\x1b[0m`);
    }

    if (this.stream) {
      this.buffer.push(line + "\n");
      this.flush();
    }
  }

  private flush() {
    if (this.buffer.length && this.stream) {
      this.stream.write(this.buffer.join(""));
      this.buffer = [];
    }
  }

  child(ctx: string) {
    const self = this;
    return {
      debug: (msg: string, data?: unknown) =>
        self.write("debug", ctx, msg, data),
      info: (msg: string, data?: unknown) => self.write("info", ctx, msg, data),
      warn: (msg: string, data?: unknown) => self.write("warn", ctx, msg, data),
      error: (msg: string, err?: Error, data?: unknown) => {
        const errData = err
          ? { error: err.message, stack: err.stack, ...(data || {}) }
          : data;
        self.write("error", ctx, msg, errData);
      },
      fatal: (msg: string, err?: Error, data?: unknown) => {
        const errData = err
          ? { error: err.message, stack: err.stack, ...(data || {}) }
          : data;
        self.write("fatal", ctx, msg, errData);
        self.flush();
      },
    };
  }

  async close() {
    this.flush();
    return new Promise<void>((resolve) => {
      this.stream ? this.stream.end(resolve) : resolve();
    });
  }
}

export const logger = Logger.get();
