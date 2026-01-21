export class Printer {
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;
    console.log("Connecting to printer...");
    await new Promise((res) => setTimeout(res, 500));
    this.isConnected = true;
    console.log("Printer connected");
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    console.log("Disconnecting printer...");
    await new Promise((res) => setTimeout(res, 300));
    this.isConnected = false;
    console.log("Printer disconnected");
  }

  async print(text: string): Promise<string> {
    if (!this.isConnected) throw new Error("Printer not connected");
    console.log("Printing:", text);
    await new Promise((res) => setTimeout(res, 500));
    return `Printed: ${text}`;
  }

  get status(): boolean {
    return this.isConnected;
  }
}
