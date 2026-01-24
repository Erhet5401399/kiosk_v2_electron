import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import { app, BrowserWindow } from "electron";
import { PrintJob, PrinterDevice } from "../../shared/types";
import { PRINTER, ERROR } from "../core/constants";
import { PrinterError } from "../core/errors";
import { generateId } from "../core/utils";
import { logger } from "./logger";

class PrinterService extends EventEmitter {
  private static inst: PrinterService;
  private queue: PrintJob[] = [];
  private processing = false;
  private stats = { completed: 0, failed: 0 };
  private log = logger.child("Printer");

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
    type: "html" | "text" | "pdf" = "html",
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

    try {
      const printer = await this.findConfigured();
      if (!printer)
        throw new PrinterError(ERROR.PRINTER_NOT_FOUND, "No printer");

      await this.executePrint(job, printer.name);

      job.status = "completed";
      this.stats.completed++;
      this.removeJob(job.id);
      this.emit("completed", job);
      this.log.info("Job completed", { id: job.id });
    } catch (e) {
      job.error = (e as Error).message;

      if (job.attempts < PRINTER.RETRY_ATTEMPTS) {
        job.status = "queued";
        this.log.warn("Job will retry", { id: job.id, attempt: job.attempts });
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        job.status = "failed";
        this.stats.failed++;
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
      pdfPath =
        job.type === "pdf"
          ? job.content
          : await this.htmlToPdf(job.content, job.type === "text");

      for (let i = 0; i < job.copies; i++) {
        await print(pdfPath, { printer: printerName });
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

  cancel(id: string) {
    const job = this.queue.find((j) => j.id === id);
    if (job && job.status !== "printing") {
      job.status = "cancelled";
      this.removeJob(id);
      this.emit("cancelled", job);
      return true;
    }
    return false;
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
