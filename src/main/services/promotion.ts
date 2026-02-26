import { app, net } from "electron";
import { createHash } from "node:crypto";
import { EventEmitter } from "node:events";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { PromotionEvent, PromotionPlaylist, PromotionVideo } from "../../shared/types";
import { API } from "../core/constants";
import { api } from "./api";
import { logger } from "./logger";

type PromotionApiResponse =
  | PromotionVideo[]
  | { videos?: PromotionVideo[]; version?: string };

const PROMOTION_ENDPOINT = "/api/kiosk/promotion/videos";
const CACHE_DIRNAME = "promotion-videos";
const MANIFEST_FILENAME = "playlist.json";
const MEDIA_SCHEME = "kiosk-media";
const SYNC_INTERVAL_MS = Number(process.env.PROMOTION_SYNC_INTERVAL_MS || 5 * 60 * 1000);

class PromotionService extends EventEmitter {
  private static inst: PromotionService;
  private log = logger.child("Promotion");
  private cache: PromotionPlaylist = { videos: [], fetchedAt: 0 };
  private hydrated = false;
  private syncing = false;
  private syncTimer: NodeJS.Timeout | null = null;
  private started = false;

  private get cacheDir(): string {
    return path.join(app.getPath("userData"), CACHE_DIRNAME);
  }

  private get manifestPath(): string {
    return path.join(this.cacheDir, MANIFEST_FILENAME);
  }

  static get(): PromotionService {
    return this.inst || (this.inst = new PromotionService());
  }

  private constructor() {
    super();
  }

  private emitState(error?: string): void {
    const payload: PromotionEvent = {
      playlist: { ...this.cache, videos: [...this.cache.videos] },
      syncing: this.syncing,
      ...(error ? { error } : {}),
    };
    this.emit("state", payload);
  }

  private async ensureCacheDir(): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  private sanitizeFilePart(input: string): string {
    return input.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  private inferExtension(url: string, mimeType?: string): string {
    const lowerMime = String(mimeType || "").toLowerCase();
    if (lowerMime.includes("webm")) return ".webm";
    if (lowerMime.includes("ogg")) return ".ogv";
    if (lowerMime.includes("mp4")) return ".mp4";

    try {
      const pathname = new URL(url).pathname.toLowerCase();
      const ext = path.extname(pathname);
      if (ext) return ext;
    } catch {
      // fall through
    }
    return ".mp4";
  }

  private resolveRemoteUrl(src: string): string {
    if (/^https?:\/\//i.test(src)) return src;
    const base = API.BASE_URL.endsWith("/") ? API.BASE_URL.slice(0, -1) : API.BASE_URL;
    const normalized = src.startsWith("/") ? src : `/${src}`;
    return `${base}${normalized}`;
  }

  private async downloadBuffer(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const request = net.request({ method: "GET", url });
      const chunks: Buffer[] = [];

      request.on("response", (response) => {
        const statusCode = Number(response.statusCode || 0);
        if (statusCode < 200 || statusCode >= 300) {
          reject(new Error(`HTTP ${statusCode} while downloading ${url}`));
          return;
        }

        response.on("data", (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        response.on("end", () => {
          resolve(Buffer.concat(chunks));
        });

        response.on("error", (error) => {
          reject(error);
        });
      });

      request.on("error", (error) => {
        reject(error);
      });

      request.end();
    });
  }

  private async fileExists(targetPath: string): Promise<boolean> {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }

  private sha256(input: Buffer | string): string {
    return createHash("sha256").update(input).digest("hex");
  }

  private async persistManifest(playlist: PromotionPlaylist): Promise<void> {
    await this.ensureCacheDir();
    await fs.writeFile(this.manifestPath, JSON.stringify(playlist, null, 2), "utf8");
  }

  private async hydrateFromDisk(): Promise<void> {
    if (this.hydrated) return;
    this.hydrated = true;

    try {
      const raw = await fs.readFile(this.manifestPath, "utf8");
      const parsed = JSON.parse(raw) as PromotionPlaylist;
      if (!Array.isArray(parsed?.videos)) return;

      const validVideos: PromotionVideo[] = [];
      let manifestChanged = false;
      for (const video of parsed.videos) {
        const src = String(video?.src || "").trim();
        if (!src) continue;

        const localPath = this.parseLocalCachedPath(src);
        if (localPath && !(await this.fileExists(localPath))) continue;

        const fileName = localPath ? path.basename(localPath) : "";
        if (fileName && src.startsWith("file://")) {
          validVideos.push({
            ...video,
            src: this.buildMediaUrl(fileName),
          });
          manifestChanged = true;
          continue;
        }

        validVideos.push(video);
      }

      this.cache = {
        videos: validVideos,
        version: parsed.version,
        fetchedAt: Number(parsed.fetchedAt || 0) || Date.now(),
      };

      if (manifestChanged) {
        await this.persistManifest(this.cache);
      }
      this.emitState();
    } catch {
      // no local manifest yet
    }
  }

  private normalizeManifest(payload: PromotionApiResponse): { videos: PromotionVideo[]; version?: string } {
    const version = Array.isArray(payload)
      ? undefined
      : String(payload.version || "").trim() || undefined;

    const rawVideos = Array.isArray(payload) ? payload : (payload.videos ?? []);
    const videos: PromotionVideo[] = [];

    rawVideos.forEach((video, index) => {
      const id = String(video?.id || "").trim() || `promo-${index + 1}`;
      const src = String(video?.src || "").trim();
      if (!src) return;

      const item: PromotionVideo = {
        id,
        src,
        mimeType: String(video?.mimeType || "").trim() || "video/mp4",
        active: video?.active !== false,
        order: typeof video?.order === "number" ? video.order : index,
      };

      const title = String(video?.title || "").trim();
      if (title) item.title = title;

      const updatedAt = String(video?.updatedAt || "").trim();
      if (updatedAt) item.updatedAt = updatedAt;

      if (item.active !== false) {
        videos.push(item);
      }
    });

    videos.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    return { videos, version };
  }

  private async materializeVideo(video: PromotionVideo): Promise<PromotionVideo | null> {
    const remoteUrl = this.resolveRemoteUrl(video.src);
    const extension = this.inferExtension(remoteUrl, video.mimeType);
    const signature = this.sha256(`${remoteUrl}|${video.updatedAt || ""}|${video.mimeType || ""}`).slice(0, 16);
    const fileName = `${this.sanitizeFilePart(video.id)}-${signature}${extension}`;
    const targetPath = path.join(this.cacheDir, fileName);

    try {
      await this.ensureCacheDir();
      if (!(await this.fileExists(targetPath))) {
        const fileBuffer = await this.downloadBuffer(remoteUrl);
        const tempPath = `${targetPath}.tmp`;
        await fs.writeFile(tempPath, fileBuffer);
        await fs.rename(tempPath, targetPath);
      }

      return {
        ...video,
        src: this.buildMediaUrl(fileName),
      };
    } catch (error) {
      this.log.warn("Failed to download promotion video", {
        id: video.id,
        src: remoteUrl,
        error: (error as Error).message,
      });
      return null;
    }
  }

  private async cleanupUnusedFiles(activeFileUrls: string[]): Promise<void> {
    try {
      await this.ensureCacheDir();
      const files = await fs.readdir(this.cacheDir);
      const keep = new Set(
        activeFileUrls
          .map((url) => this.parseLocalCachedPath(url))
          .filter((localPath): localPath is string => Boolean(localPath))
          .map((localPath) => path.basename(localPath)),
      );

      await Promise.all(
        files
          .filter((name) => name !== MANIFEST_FILENAME)
          .filter((name) => !keep.has(name))
          .map((name) => fs.unlink(path.join(this.cacheDir, name)).catch(() => undefined)),
      );
    } catch {
      // best effort cleanup
    }
  }

  private buildMediaUrl(fileName: string): string {
    return `${MEDIA_SCHEME}://local/${encodeURIComponent(fileName)}`;
  }

  private parseLocalCachedPath(src: string): string {
    if (src.startsWith("file://")) {
      return fileURLToPath(src);
    }
    if (src.startsWith(`${MEDIA_SCHEME}://`)) {
      try {
        const parsed = new URL(src);
        const fileName = decodeURIComponent(path.basename(parsed.pathname || ""));
        if (!fileName) return "";
        return path.join(this.cacheDir, fileName);
      } catch {
        return "";
      }
    }
    return "";
  }

  async refresh(): Promise<PromotionPlaylist> {
    if (this.syncing) {
      return this.cache;
    }

    this.syncing = true;
    this.emitState();
    try {
      // const payload = await api.post<PromotionApiResponse>(PROMOTION_ENDPOINT);
      const payload: PromotionApiResponse = { videos: [
        {
          id: "example-video",
          title: "Example Promotion",
          src: "https://www.pexels.com/download/video/8879540/",
          mimeType: "video/mp4",
          active: true,
          order: 1,
          updatedAt: new Date().toISOString(),
        }
      ] };
      const manifest = this.normalizeManifest(payload);
      const downloaded = (
        await Promise.all(manifest.videos.map((video) => this.materializeVideo(video)))
      ).filter((video): video is PromotionVideo => Boolean(video));

      if (!downloaded.length) {
        this.log.warn("Promotion refresh returned no playable local videos, keeping previous cache");
        return this.cache;
      }

      const playlist: PromotionPlaylist = {
        videos: downloaded,
        version: manifest.version,
        fetchedAt: Date.now(),
      };

      this.cache = playlist;
      await this.persistManifest(playlist);
      await this.cleanupUnusedFiles(downloaded.map((video) => video.src));
      this.emitState();
      return this.cache;
    } catch (error) {
      const message = (error as Error).message;
      this.log.error("Failed to refresh promotion videos", error as Error);
      this.emitState(message);
      return this.cache;
    } finally {
      this.syncing = false;
      this.emitState();
    }
  }

  async list(): Promise<PromotionPlaylist> {
    if (!this.cache.videos.length) {
      await this.hydrateFromDisk();
    }

    if (this.cache.videos.length) {
      return this.cache;
    }

    return this.refresh();
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    await this.list();
    this.syncTimer = setInterval(() => {
      void this.refresh();
    }, SYNC_INTERVAL_MS);
  }

  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.started = false;
    this.removeAllListeners("state");
  }
}

export const promotion = PromotionService.get();
