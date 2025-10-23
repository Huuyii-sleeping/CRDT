import { compareIds, getIdStr, Id } from "../types";

interface MapEntry {
  value: any;
  id: Id;
}

export type MapChangeEvent = {
  updated: Array<{ key: string; value: any }>;
  deleted: string[];
};

export type MapObserver = (event: MapChangeEvent) => void;

export class YMap {
  clientId: string;
  clock: number;
  entries: Map<string, MapEntry>;
  processedOps: Set<string>;
  observers: MapObserver[];

  constructor(clientId: string) {
    this.clientId = clientId;
    this.clock = 0;
    this.entries = new Map();
    this.processedOps = new Set();
    this.observers = [];
  }

  set(
    key: string,
    value: any
  ): { type: string; key: string; value: any; id: Id } {
    const id = [this.clientId, this.clock++] as Id;
    const op = { type: "set" as const, key, value, id };
    this._applySet(op);
    this._emitChange({ updated: [{ key, value }], deleted: [] });
    return op;
  }

  delete(key: string): { type: "delete"; key: string; id: Id } | null {
    if (!this.entries.has(key)) return null;
    const id: Id = [this.clientId, this.clock++];
    const op = { type: "delete" as const, key, id };
    this._applyDelete(op);
    this._emitChange({ updated: [], deleted: [key] });
    return op;
  }

  applyUpdate(ops: any[]): void {
    const updated: Array<{ key: string; value: any }> = [];
    const deleted: string[] = [];

    for (const op of ops) {
      const opKey = `${op.type}:${op.key}:${getIdStr(op.id)}`;
      if (this.processedOps.has(opKey)) continue;
      this.processedOps.add(opKey);

      if (op.type === "set") {
        this._applySet(op);
        updated.push({ key: op.key, value: op.value });
      } else if (op.type === "delete") {
        this._applyDelete(op);
        deleted.push(op.id);
      }
    }

    if (updated.length > 0 || deleted.length > 0) {
      this._emitChange({ updated, deleted });
    }
  }

  _applySet(op: { key: string; value: any; id: Id }): void {
    const current = this.entries.get(op.key);
    if (!current || compareIds(op.id, current.id) > 0) {
      this.entries.set(op.key, { value: op.value, id: op.id });
    }
  }

  _applyDelete(op: { key: string; id: Id }): void {
    const current = this.entries.get(op.key);
    if (!current || compareIds(op.id, current.id) > 0) {
      this.entries.delete(op.key);
    }
  }

  observer(fn: MapObserver): () => void {
    this.observers.push(fn);
    return () => {
      const idx = this.observers.indexOf(fn);
      if (idx !== -1) this.observers.splice(idx, 1);
    };
  }

  _emitChange(event: MapChangeEvent): void {
    if (this.observers.length === 0) return;
    for (const fn of this.observers) {
      fn(event);
    }
  }

  get(key: string): any {
    return this.entries.get(key)?.value;
  }

  has(key: string): boolean {
    return this.entries.has(key);
  }

  toJSON(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, entry] of this.entries) {
      result[key] = entry.value;
    }
    return result;
  }

  keys(): string[] {
    return Array.from(this.entries.keys());
  }
}
