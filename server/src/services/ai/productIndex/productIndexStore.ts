import type { AiProductIndexEntry, ProductIndexStats } from "./types";

class InMemoryProductIndexStore {
  private entries = new Map<string, AiProductIndexEntry>();
  private ready = false;
  private lastSyncedAt: Date | null = null;

  clear(): void {
    this.entries.clear();
    this.ready = false;
    this.lastSyncedAt = null;
  }

  upsert(entry: AiProductIndexEntry): void {
    this.entries.set(entry.id, entry);
    this.lastSyncedAt = new Date();
  }

  remove(productId: string): void {
    this.entries.delete(productId);
    this.lastSyncedAt = new Date();
  }

  replaceAll(entries: AiProductIndexEntry[]): void {
    this.entries.clear();
    for (const entry of entries) {
      this.entries.set(entry.id, entry);
    }
    this.ready = true;
    this.lastSyncedAt = new Date();
  }

  get(productId: string): AiProductIndexEntry | undefined {
    return this.entries.get(productId);
  }

  list(): AiProductIndexEntry[] {
    return Array.from(this.entries.values());
  }

  markReady(): void {
    this.ready = true;
    this.lastSyncedAt = new Date();
  }

  isReady(): boolean {
    return this.ready && this.entries.size > 0;
  }

  stats(): ProductIndexStats {
    return {
      ready: this.isReady(),
      count: this.entries.size,
      lastSyncedAt: this.lastSyncedAt?.toISOString() ?? null,
    };
  }
}

export const productIndexStore = new InMemoryProductIndexStore();
