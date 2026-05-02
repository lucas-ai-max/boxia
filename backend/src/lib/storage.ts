import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';

export interface StoredFile {
  ref: string;
  absolutePath: string;
  mimeType: string;
  sizeBytes: number;
}

export interface StorageDriver {
  save(buffer: Buffer, mimeType: string, originalName?: string): Promise<StoredFile>;
  read(ref: string): Promise<Buffer>;
  delete(ref: string): Promise<void>;
  resolvePath(ref: string): string;
}

class LocalStorage implements StorageDriver {
  private root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private async ensureRoot() {
    await fs.mkdir(this.root, { recursive: true });
  }

  async save(buffer: Buffer, mimeType: string, originalName = 'file') {
    await this.ensureRoot();
    const ext = path.extname(originalName) || mimeToExt(mimeType);
    const id = `${Date.now()}-${randomUUID()}${ext}`;
    const absolutePath = path.join(this.root, id);
    await fs.writeFile(absolutePath, buffer);
    return { ref: id, absolutePath, mimeType, sizeBytes: buffer.length };
  }

  async read(ref: string) {
    return fs.readFile(this.resolvePath(ref));
  }

  async delete(ref: string) {
    await fs.unlink(this.resolvePath(ref)).catch(() => {});
  }

  resolvePath(ref: string) {
    const safe = path.basename(ref);
    return path.join(this.root, safe);
  }
}

function mimeToExt(mime: string) {
  if (mime.includes('mp4')) return '.mp4';
  if (mime.includes('quicktime')) return '.mov';
  if (mime.includes('webm')) return '.webm';
  if (mime.includes('jpeg')) return '.jpg';
  if (mime.includes('png')) return '.png';
  if (mime.includes('heic')) return '.heic';
  return '';
}

export const storage: StorageDriver = new LocalStorage(env.STORAGE_LOCAL_DIR);
