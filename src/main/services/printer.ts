import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { app, BrowserWindow } from "electron";
import { PrintJob, PrintJobStatus, PrinterDevice } from "../../shared/types";
import { PRINTER, ERROR } from "../core/constants";
import { PrinterError } from "../core/errors";
import { generateId } from "../core/utils";
import { logger } from "./logger";

class PrinterService extends EventEmitter {
  private static inst: PrinterService;
  private queue: PrintJob[] = [];
  private jobStatuses = new Map<string, PrintJobStatus>();
  private processing = false;
  private stats = { completed: 0, failed: 0 };
  private log = logger.child("Printer");

  private escapePowerShellSingleQuote(value: string): string {
    return String(value || "").replace(/'/g, "''");
  }

  private runPowerShell(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      execFile(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", command],
        { windowsHide: true, timeout: 15000 },
        (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(String(stdout || ""));
        },
      );
    });
  }

  private async getPrinterJobIds(printerName: string): Promise<Set<number>> {
    if (process.platform !== "win32") return new Set<number>();

    const escapedName = this.escapePowerShellSingleQuote(printerName);
    const script = `Get-PrintJob -PrinterName '${escapedName}' | Select-Object -ExpandProperty ID`;
    const output = await this.runPowerShell(script);
    const ids = output
      .split(/\r?\n/)
      .map((line) => Number(line.trim()))
      .filter((value) => Number.isFinite(value));

    return new Set(ids);
  }

  private async waitForQueueCompletion(printerName: string, beforeIds: Set<number>): Promise<void> {
    if (process.platform !== "win32") return;

    const timeoutAt = Date.now() + PRINTER.TIMEOUT;
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let trackedIds: Set<number> = new Set<number>();
    while (Date.now() < timeoutAt && trackedIds.size === 0) {
      const current = await this.getPrinterJobIds(printerName);
      const created = [...current].filter((id) => !beforeIds.has(id));
      if (created.length > 0) {
        trackedIds = new Set(created);
        break;
      }
      await sleep(400);
    }

    if (trackedIds.size === 0) {
      return;
    }

    while (Date.now() < timeoutAt) {
      const current = await this.getPrinterJobIds(printerName);
      const pendingTracked = [...trackedIds].some((id) => current.has(id));
      if (!pendingTracked) {
        return;
      }
      await sleep(600);
    }

    throw new PrinterError(ERROR.PRINT_FAILED, "Printer queue confirmation timed out");
  }

  static get(): PrinterService {
    return this.inst || (this.inst = new PrinterService());
  }

  async list(): Promise<PrinterDevice[]> {
    try {
      const { getPrinters } = await import("pdf-to-printer");
      const printers = await getPrinters();
      return printers.map((p: any, i: number) => ({
        name: typeof p === "string" ? p : p.name,
        isDefault: i === 0,
        status: "unknown" as const,
      }));
    } catch {
      return [];
    }
  }

  async findConfigured(): Promise<PrinterDevice | null> {
    const printers = await this.list();
    return (
      printers.find((p) => PRINTER.PATTERN.test(p.name)) ||
      printers.find((p) => p.isDefault) ||
      printers[0] ||
      null
    );
  }

  async print(
    content: string,
    type: "html" | "text" | "pdf" | "pdf_base64" = "html",
    opts: Partial<PrintJob> = {},
  ): Promise<string> {
    if (this.queue.length >= PRINTER.MAX_QUEUE) {
      throw new PrinterError(ERROR.PRINT_FAILED, "Queue full");
    }

    const job: PrintJob = {
      id: generateId(),
      content,
      type,
      copies: opts.copies || 1,
      priority: opts.priority || "normal",
      status: "queued",
      createdAt: Date.now(),
      attempts: 0,
    };

    const idx = this.queue.findIndex(
      (j) =>
        this.priorityWeight(j.priority) < this.priorityWeight(job.priority),
    );
    idx === -1 ? this.queue.push(job) : this.queue.splice(idx, 0, job);
    this.updateJobStatus(job);

    this.log.info("Job queued", { id: job.id, type, priority: job.priority });
    this.emit("queued", job);
    this.processQueue();
    return job.id;
  }

  private priorityWeight(p: string) {
    return { low: 1, normal: 2, high: 3 }[p] || 2;
  }

  private async processQueue() {
    if (this.processing || !this.queue.length) return;
    this.processing = true;

    while (this.queue.length) {
      const job = this.queue.find((j) => j.status === "queued");
      if (!job) break;
      await this.processJob(job);
    }

    this.processing = false;
  }

  private async processJob(job: PrintJob) {
    job.status = "printing";
    job.attempts++;
    this.updateJobStatus(job);

    try {
      const printer = await this.findConfigured();
      if (!printer)
        throw new PrinterError(ERROR.PRINTER_NOT_FOUND, "No printer");

      await this.executePrint(job, printer.name);

      job.status = "completed";
      this.stats.completed++;
      this.updateJobStatus(job);
      this.removeJob(job.id);
      this.emit("completed", job);
      this.log.info("Job completed", { id: job.id });
    } catch (e) {
      job.error = (e as Error).message;

      if (job.attempts < PRINTER.RETRY_ATTEMPTS) {
        job.status = "queued";
        this.updateJobStatus(job);
        this.log.warn("Job will retry", { id: job.id, attempt: job.attempts });
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        job.status = "failed";
        this.stats.failed++;
        this.updateJobStatus(job);
        this.removeJob(job.id);
        this.emit("failed", job);
        this.log.error("Job failed", e as Error, { id: job.id });
      }
    }
  }

  private async executePrint(job: PrintJob, printerName: string) {
    const { print } = await import("pdf-to-printer");
    let pdfPath: string | null = null;

    try {
      if (job.type === "pdf") {
        pdfPath = job.content;
      } else if (job.type === "pdf_base64") {
        const normalized = String(job.content || "").trim();
        const base64 = normalized.replace(/^data:application\/pdf;base64,/i, "");
        const pdfBuffer = Buffer.from(base64, "base64");
        pdfPath = path.join(app.getPath("temp"), `print_${Date.now()}.pdf`);
        fs.writeFileSync(pdfPath, pdfBuffer);
      } else {
        pdfPath = await this.htmlToPdf(job.content, job.type === "text");
      }

      for (let i = 0; i < job.copies; i++) {
        const beforeIds = await this.getPrinterJobIds(printerName);
        await print(pdfPath, { printer: printerName });
        await this.waitForQueueCompletion(printerName, beforeIds);
      }
    } finally {
      if (pdfPath && pdfPath !== job.content && fs.existsSync(pdfPath)) {
        try {
          fs.unlinkSync(pdfPath);
        } catch {}
      }
    }
  }

  private async htmlToPdf(content: string, isText: boolean): Promise<string> {
    const html = isText
      ? `<html><body><pre style="font-family:monospace;white-space:pre-wrap">${this.escape(content)}</pre></body></html>`
      : content;

    const win = new BrowserWindow({
      show: false,
      webPreferences: { offscreen: true },
    });
    try {
      await win.loadURL(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      );
      const pdf = await win.webContents.printToPDF({ printBackground: true });
      const pdfPath = path.join(app.getPath("temp"), `print_${Date.now()}.pdf`);
      fs.writeFileSync(pdfPath, pdf);
      return pdfPath;
    } finally {
      win.destroy();
    }
  }

  private escape(s: string) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  private removeJob(id: string) {
    const idx = this.queue.findIndex((j) => j.id === id);
    if (idx > -1) this.queue.splice(idx, 1);
  }

  private updateJobStatus(job: PrintJob) {
    const now = Date.now();
    const previous = this.jobStatuses.get(job.id);
    const payload: PrintJobStatus = {
      id: job.id,
      status: job.status,
      ...(job.error ? { error: job.error } : {}),
      createdAt: job.createdAt,
      updatedAt: now,
      attempts: job.attempts,
    };

    this.jobStatuses.set(job.id, payload);
    this.emit("job-status", payload);

    if (this.jobStatuses.size > 400) {
      const oldestId = this.jobStatuses.keys().next().value as string | undefined;
      if (oldestId) this.jobStatuses.delete(oldestId);
    }

    if (
      previous &&
      (previous.status === "completed" || previous.status === "failed" || previous.status === "cancelled")
    ) {
      this.jobStatuses.delete(job.id);
      this.jobStatuses.set(job.id, payload);
    }
  }

  cancel(id: string) {
    const job = this.queue.find((j) => j.id === id);
    if (job && job.status !== "printing") {
      job.status = "cancelled";
      this.updateJobStatus(job);
      this.removeJob(id);
      this.emit("cancelled", job);
      return true;
    }
    return false;
  }

  getJobStatus(id: string): PrintJobStatus | null {
    const normalized = String(id || "").trim();
    if (!normalized) return null;
    return this.jobStatuses.get(normalized) || null;
  }

  getStats() {
    return { ...this.stats };
  }
  getQueue() {
    return [...this.queue];
  }
  isReady() {
    return !this.processing || this.queue.length < PRINTER.MAX_QUEUE;
  }
}

export const printer = PrinterService.get();
