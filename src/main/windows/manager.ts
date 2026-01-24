import { BrowserWindow, shell, screen } from "electron";
import path from "path";
import serve from "electron-serve";
import { RuntimeSnapshot } from "../../shared/types";
import { logger } from "../services";

type WindowType = "main" | "register" | "error";

interface ManagedWindow {
  type: WindowType;
  window: BrowserWindow;
}

const loadURL = serve({ directory: path.join(__dirname, "../../../dist") });

class WindowManager {
  private static inst: WindowManager;
  private windows = new Map<number, ManagedWindow>();
  private isDev = process.env.NODE_ENV === "development";
  private preload = path.join(__dirname, "../preload.js");
  // private dist = path.join(__dirname, "../dist");

  private log = logger.child("Windows");

  static get(): WindowManager {
    return this.inst || (this.inst = new WindowManager());
  }

  private create(
    type: WindowType,
    opts: Partial<Electron.BrowserWindowConstructorOptions> = {},
  ): BrowserWindow {
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      show: false,
      frame: this.isDev,
      kiosk: !this.isDev && type === "main",
      backgroundColor: "#ffffff",
      webPreferences: {
        preload: this.preload,
        contextIsolation: true,
      },
      ...opts,
    });

    win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    win.webContents.on("will-navigate", (e, url) => {
      if (!url.startsWith("file://") && !url.startsWith("http://localhost")) {
        e.preventDefault();
        shell.openExternal(url);
      }
    });

    win.once("ready-to-show", () => {
      win.show();
      if (this.isDev) win.webContents.openDevTools({ mode: "detach" });
    });

    win.on("closed", () => {
      this.windows.delete(win.id);
      this.log.debug(`${type} window closed`);
    });

    this.windows.set(win.id, { type, window: win });
    this.log.debug(`${type} window created`);
    return win;
  }

  // private url(route: string, query?: Record<string, string>): string {
  //   const qs = query
  //     ? "?" +
  //       Object.entries(query)
  //         .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  //         .join("&")
  //     : "";
  //   return this.isDev
  //     ? `http://localhost:5173/#${route}${qs}`
  //     : `file://${path.join(this.dist, "index.html")}#${route}${qs}`;
  // }
  private async load(
    win: BrowserWindow,
    route: string,
    query?: Record<string, string>,
  ) {
    const qs = query
      ? "?" +
        Object.entries(query)
          .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
          .join("&")
      : "";

    if (this.isDev) {
      await win.loadURL(`http://localhost:5173/#${route}${qs}`);
    } else {
      await loadURL(win, { hash: `#${route}${qs}` });
    }
  }

  private getByType(type: WindowType): BrowserWindow | null {
    for (const m of this.windows.values()) {
      if (m.type === type && !m.window.isDestroyed()) return m.window;
    }
    return null;
  }

  async openMain(): Promise<BrowserWindow> {
    let win = this.getByType("main");
    if (win) {
      win.focus();
      return win;
    }
    win = this.create("main");
    // await win.loadURL(this.url("/"));
    await this.load(win, "/");
    return win;
  }

  async openRegister(deviceId: string): Promise<BrowserWindow> {
    let win = this.getByType("register");
    if (win) {
      win.focus();
      return win;
    }
    win = this.create("register", {
      width: 600,
      height: 500,
      kiosk: false,
      resizable: false,
    });
    // await win.loadURL(this.url("/register", { deviceId }));
    await this.load(win, "/register", { deviceId });
    return win;
  }

  async openError(message: string, code?: string): Promise<BrowserWindow> {
    let win = this.getByType("error");
    if (win) {
      win.focus();
      return win;
    }
    win = this.create("error", {
      width: 500,
      height: 400,
      kiosk: false,
      resizable: false,
    });
    // await win.loadURL(this.url("/error", { message, code: code || "UNKNOWN" }));
    await this.load(win, "/error", { message, code: code || "UNKNOWN" });
    return win;
  }

  closeByType(type: WindowType) {
    for (const m of this.windows.values()) {
      if (m.type === type && !m.window.isDestroyed()) m.window.close();
    }
  }

  closeAll() {
    for (const m of this.windows.values()) {
      if (!m.window.isDestroyed()) m.window.close();
    }
    this.windows.clear();
  }

  sync(snapshot: RuntimeSnapshot) {
    const { state, deviceId, error, errorMessage } = snapshot;

    switch (state) {
      case "unregistered":
      case "registering":
        if (deviceId) {
          this.closeByType("main");
          this.closeByType("error");
          this.openRegister(deviceId).catch((e) =>
            this.log.error("Failed to open register", e),
          );
        }
        break;
      case "ready":
        this.closeByType("register");
        this.closeByType("error");
        this.openMain().catch((e) => this.log.error("Failed to open main", e));
        break;
      case "error":
        this.closeByType("main");
        this.closeByType("register");
        this.openError(errorMessage || "An error occurred", error).catch((e) =>
          this.log.error("Failed to open error", e),
        );
        break;
      case "shutting_down":
        this.closeAll();
        break;
    }
  }

  broadcast(channel: string, data: unknown) {
    for (const m of this.windows.values()) {
      if (!m.window.isDestroyed()) m.window.webContents.send(channel, data);
    }
  }

  getAll(): BrowserWindow[] {
    return [...this.windows.values()]
      .filter((m) => !m.window.isDestroyed())
      .map((m) => m.window);
  }
}

export const windows = WindowManager.get();
