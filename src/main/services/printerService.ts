export class PrinterService {
  private static instance: PrinterService;
  private connected = false;

  private constructor() {}

  static getInstance() {
    if (!PrinterService.instance) PrinterService.instance = new PrinterService();
    return PrinterService.instance;
  }

  async connect() {
    console.log("Connecting to printer...");
    await new Promise(res => setTimeout(res, 300));
    this.connected = true;
  }

  async disconnect() {
    console.log("Disconnecting printer...");
    await new Promise(res => setTimeout(res, 200));
    this.connected = false;
  }

  async printDocument(text: string): Promise<string> {
    if (!this.connected) await this.connect();
    console.log("Printing:", text);
    await new Promise(res => setTimeout(res, 500));
    return `Printed: ${text}`;
  }

  get status() {
    return this.connected;
  }
}