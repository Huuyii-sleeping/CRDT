import { compareIds, getIdStr, Id } from "../types";

interface Char {
  id: Id;
  value: any;
  left: Id | null;
  right: Id | null;
  deleted: boolean;
}

export class simpleYArray {
  clientId: string;
  clock: number;
  Chars: Map<any, Char>;
  start: Id;
  end: Id;
  pendingOps: any[] = [];
  constructor(clientId: string) {
    this.clientId = clientId;
    this.clock = 0;
    this.Chars = new Map();

    this.start = ["start", 0];
    this.end = ["end", 0];

    this.Chars.set(getIdStr(this.start), {
      id: this.start,
      value: null,
      left: null,
      right: this.end,
      deleted: false,
    });
    this.Chars.set(getIdStr(this.end), {
      id: this.end,
      value: null,
      left: this.start,
      right: null,
      deleted: false,
    });
  }

  generateId(): Id {
    const id: Id = [this.clientId, this.clock];
    this.clock++;
    return id;
  }

  insert(
    leftId: Id = this.start,
    value: any
  ): { type: "insert"; id: Id; left: Id; right: Id; value: any } {
    const leftStr = getIdStr(leftId);
    const leftChar = this.Chars.get(leftStr);
    if (!leftChar || leftChar.deleted) {
      throw new Error("左邻居不存在");
    }

    const newId = this.generateId();
    const newIdStr = getIdStr(newId);

    const rightId = leftChar.right as Id;
    const rightChar = this.Chars.get(getIdStr(rightId));
    if (!rightChar) {
      throw new Error("右邻居不存在");
    }

    const newChar: Char = {
      id: newId,
      value,
      left: leftId,
      right: rightId,
      deleted: false,
    };

    this.Chars.set(newIdStr, newChar);
    leftChar.right = newId;
    rightChar.left = newId;

    return {
      type: "insert",
      id: newId,
      left: leftId,
      right: rightId,
      value,
    };
  }

  merge(op: any): void {
    try {
      if (op.type === "insert") {
        this.mergeInsert(op);
        this.processPendingOps();
      } else if (op.type === "delete") {
        this.mergeDelete(op);
        this.processPendingOps();
      }
    } catch (error) {
      this.pendingOps.push(op);
    }
  }

  mergeInsert(op: { id: Id; left: Id; right: Id; value: any }): void {
    const opIdStr = getIdStr(op.id);
    if (this.Chars.has(opIdStr)) return;

    let currentId = this.start;
    let currentChar = this.Chars.get(getIdStr(currentId));

    while (currentChar?.right !== null && currentChar?.right !== this.end) {
      const nextId = currentChar?.right;
      const next = this.Chars.get(getIdStr(nextId as Id))!;
      if (!next) {
        throw new Error("没有找到合适的位置");
      }
      if (compareIds(op.id, next.id) < 0) break;
      currentChar = next;
    }

    const newRightId = currentChar?.right;
    const newChar: Char = {
      id: op.id,
      value: op.value,
      left: currentChar?.id as Id,
      right: newRightId as Id,
      deleted: false,
    };

    this.Chars.set(opIdStr, newChar);
    currentChar!.right = op.id;
    if (newRightId !== this.end) {
      const newRightChar = this.Chars.get(getIdStr(newRightId as Id));
      if (!newRightId) {
        throw new Error("没有找到合适的位置");
      }
      newRightChar!.left = op.id;
    }
  }

  mergeDelete(op: { id: Id }): void {
    const char = this.Chars.get(getIdStr(op.id));
    if (char) char.deleted = true;
  }

  // 新增判定机制，将暂时找不到位置的暂存起来
  // 在每一次执行成功之后再次重新执行
  processPendingOps() {
    let progress = true;
    while (progress && this.pendingOps.length > 0) {
      progress = false;
      const remaining = [];
      for (const op of this.pendingOps) {
        try {
          if (op.type === this.insert) {
            this.mergeInsert(op);
          } else if (op.type === "delete") {
            this.mergeDelete(op);
          }
          progress = true;
        } catch (error) {
          remaining.push(op);
        }
      }
      this.pendingOps = remaining;
    }
  }

  toArray(): any[] {
    const result: any[] = [];
    let currentId = this.start;

    while (currentId !== this.end) {
      const currentChar = this.Chars.get(getIdStr(currentId));
      const nextId = currentChar!.right!;
      const nextChar = this.Chars.get(getIdStr(nextId));
      if (nextId !== this.end && !nextChar?.deleted) {
        result.push(nextChar?.value);
      }
      currentId = nextId;
    }
    return result;
  }
}
