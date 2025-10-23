import { compareIds, getIdStr, Id } from "../types";

/**
 * 字符串的节点结构
 * id:[clientId, clock] 全局唯一标识
 * value: 数据
 * left: 左邻居的id null表示头部
 * right: 右邻居的id null表示尾部
 * deleted: 是否被删除（软删除 避免影响其他节点的关系）
 */
class Char {
  id: Id;
  value: string;
  left: Id | null;
  right: Id | null;
  deleted: boolean;
  originLeft: Id | null;
  originRight: Id | null;
  constructor(id: any, value: any, left: Id | null, right: Id | null) {
    this.id = id;
    this.value = value;
    this.left = null;
    this.right = null;
    this.deleted = false;
    this.originLeft = left;
    this.originRight = right;
  }
}

// 记录变更事件类型
export type TextChangeEvent = {
  inserted: Array<{ id: Id; value: string }>;
  deleted: Id[];
};

export type TextObserver = (event: TextChangeEvent) => void;

export class CRDTText {
  chars: Map<string, Char>;
  clientId: any;
  clock: number;
  start: Char;
  end: Char;
  pendingOps: any[];
  processedOps: Set<string>;
  observers: any[];
  constructor(clientId: string) {
    this.clientId = clientId;
    this.clock = 0;
    this.chars = new Map();
    this.start = new Char(["start", 0], "", null, null);
    this.end = new Char(["end", 0], "", null, null);
    this.start.right = this.end.id;
    this.end.left = this.start.id;
    this.chars.set(getIdStr(this.start.id), this.start);
    this.chars.set(getIdStr(this.end.id), this.end);
    this.processedOps = new Set();
    this.pendingOps = [];
    this.observers = [];
  }

  generateId(): Id {
    const newId: Id = [this.clientId, this.clock];
    this.clock++;
    return newId;
  }

  /**
   * 插入字符
   * @param value 值
   * @param leftId 左侧的定位值 默认是开头
   */
  insert(
    value: string,
    originLeft: Id = this.start.id
  ): {
    type: string;
    id: Id;
    value: string;
    originLeft: Id;
    originRight: Id;
  } {
    const leftChar = this.chars.get(getIdStr(originLeft));
    if (!leftChar || leftChar.deleted) {
      throw new Error("没有找到合适的位置");
    }
    const originRight = leftChar.right as Id;
    const id = this.generateId();
    const op = { type: "insert", id, value, originLeft, originRight };
    this._applyInsert(op);
    this._emitChange({ inserted: [{ id, value }], deleted: [] });
    return op;
  }

  /**
   * 实现删除的逻辑
   * @param id
   */
  delete(id: Id): { type: "delete"; id: Id } | null {
    const char = this.chars.get(getIdStr(id));
    if (!char || char.deleted || id === this.start.id || id === this.end.id) {
      return null;
    }
    char.deleted = true;
    this._emitChange({ inserted: [], deleted: [id] });
    const op = { type: "delete" as const, id };
    return op;
  }

  applyUpdate(ops: any[]): void {
    const inserted: Array<{ id: Id; value: string }> = [];
    const deleted: Id[] = [];
    for (const op of ops) {
      const opKey =
        op.type === "insert"
          ? `insert:${getIdStr(op.id)}`
          : `delete:${getIdStr(op.id)}`;
      if (this.processedOps.has(opKey)) {
        continue;
      }
      this.processedOps.add(opKey);

      try {
        if (op.type === "insert") {
          this._applyInsert(op);
          inserted.push({ id: op.id, value: op.value });
        } else if (op.type === "delete") {
          this._applyDelete(op);
          deleted.push(op.id);
        }
      } catch (error) {
        this.pendingOps.push(op);
      }
    }
    if (inserted.length > 0 || deleted.length > 0) {
      this._emitChange({ inserted, deleted });
    }
    this._processPendingOps();
  }

  _applyInsert(op: {
    id: Id;
    value: string;
    originLeft: Id;
    originRight: Id;
  }): void {
    const idStr = getIdStr(op.id);
    if (this.chars.has(idStr)) return;

    let current = this.chars.get(getIdStr(op.originLeft)) || this.start;
    if (current.id[0] === "end" || current.deleted) current = this.start;

    while (current.right && current.right[0] !== "end") {
      const next = this.chars.get(getIdStr(current.right));
      if (!next || next.deleted) break;
      if (compareIds(op.id, next.id) <= 0) break;
      current = next;
    }

    const newRightId = current.right;
    const newChar = new Char(op.id, op.value, op.originLeft, op.originRight);
    newChar.left = current.id;
    newChar.right = newRightId;
    this.chars.set(idStr, newChar);
    current.right = op.id;

    const newRightChar = this.chars.get(getIdStr(newRightId as Id));
    if (newRightChar) newRightChar.left = op.id;
  }

  _applyDelete(op: { id: Id }): void {
    const char = this.chars.get(getIdStr(op.id));
    if (
      char &&
      !char.deleted &&
      op.id !== this.start.id &&
      op.id !== this.end.id
    ) {
      char.deleted = true;
    }
  }

  _processPendingOps(): void {
    let process = true;
    while (process && this.pendingOps.length > 0) {
      process = false;
      const remaining = [];
      const inserted: Array<{ id: Id; value: string }> = [];
      const deleted: Id[] = [];
      for (const op of this.pendingOps) {
        try {
          if (op.type === "insert") {
            this._applyInsert(op);
            inserted.push({ id: op.id, value: op.value });
          } else if (op.type === "delete") {
            this._applyDelete(op);
            deleted.push(op.id);
          }
        } catch (error) {
          remaining.push(op);
        }
      }
      if (inserted.length > 0 || deleted.length > 0) {
        this._emitChange({ inserted, deleted });
      }
      this.pendingOps = remaining;
    }
  }

  observe(fn: TextObserver): () => void {
    this.observers.push(fn);
    return () => {
      const idx = this.observers.indexOf(fn);
      if (idx !== -1) this.observers.splice(idx, 1);
    };
  }

  _emitChange(event: TextChangeEvent): void {
    if (this.observers.length === 0) return;
    for (const fn of this.observers) {
      fn(event);
    }
  }

  toString(): string {
    const result: string[] = [];
    let currentId = this.start.id;
    while (currentId[0] !== "end") {
      const current = this.chars.get(getIdStr(currentId));
      if (!current || !current.right) break;
      const next = this.chars.get(getIdStr(current.right));
      if (!next) break;
      if (!next.deleted) {
        result.push(next.value);
      }
      currentId = current.right;
    }
    return result.join("");
  }
}
