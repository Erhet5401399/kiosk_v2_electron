import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';
import { STORAGE } from '../core/constants';
import { StorageError } from '../core/errors';

class SecureStorage {
  private static inst: SecureStorage;
  private basePath: string;
  private key: Buffer | null = null;
  private cache = new Map<string, { data: unknown; ts: number }>();

  private constructor() {
    this.basePath = app.getPath('userData');
    this.initKey();
  }

  static get(): SecureStorage {
    return this.inst || (this.inst = new SecureStorage());
  }

  private initKey() {
    const keyFile = path.join(this.basePath, '.key');
    try {
      this.key = fs.existsSync(keyFile)
        ? fs.readFileSync(keyFile)
        : (() => {
            const k = crypto.randomBytes(32);
            fs.writeFileSync(keyFile, k, { mode: 0o600 });
            return k;
          })();
    } catch (e) {
      throw new StorageError('Failed to initialize encryption');
    }
  }

  private encrypt(data: string): string {
    if (!this.key) throw new StorageError('No encryption key');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(STORAGE.ALGORITHM, this.key, iv);
    let enc = cipher.update(data, 'utf8', 'base64');
    enc += cipher.final('base64');
    const tag = (cipher as crypto.CipherGCM).getAuthTag();
    return JSON.stringify({ iv: iv.toString('base64'), tag: tag.toString('base64'), data: enc });
  }

  private decrypt(payload: string): string {
    if (!this.key) throw new StorageError('No encryption key');
    const { iv, tag, data } = JSON.parse(payload);
    const decipher = crypto.createDecipheriv(STORAGE.ALGORITHM, this.key, Buffer.from(iv, 'base64'));
    (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(tag, 'base64'));
    let dec = decipher.update(data, 'base64', 'utf8');
    dec += decipher.final('utf8');
    return dec;
  }

  read<T>(file: string, fallback: T, encrypted = true): T {
    const cached = this.cache.get(file);
    if (cached && Date.now() - cached.ts < 5000) return cached.data as T;

    const filePath = path.join(this.basePath, file);
    try {
      if (!fs.existsSync(filePath)) return fallback;
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = encrypted ? JSON.parse(this.decrypt(content)) : JSON.parse(content);
      this.cache.set(file, { data, ts: Date.now() });
      return data;
    } catch {
      return fallback;
    }
  }

  write<T>(file: string, data: T, encrypted = true) {
    const filePath = path.join(this.basePath, file);
    const tempPath = `${filePath}.tmp`;
    try {
      const content = encrypted
        ? this.encrypt(JSON.stringify(data))
        : JSON.stringify(data);
      fs.writeFileSync(tempPath, content, { mode: 0o600 });
      fs.renameSync(tempPath, filePath);
      this.cache.set(file, { data, ts: Date.now() });
    } catch (e) {
      try { fs.unlinkSync(tempPath); } catch {}
      throw new StorageError(`Write failed: ${file}`);
    }
  }

  delete(file: string) {
    try {
      fs.unlinkSync(path.join(this.basePath, file));
      this.cache.delete(file);
    } catch {}
  }
}

export const storage = SecureStorage.get();
