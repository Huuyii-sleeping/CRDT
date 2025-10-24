import { compareIds, getIdStr, Id } from "../types";
import { Content } from "./types";

interface Char {
  id: Id;
  content: Content | null;
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
  stateVector: Map<string, number>;
  constructor(clientId: string) {
    this.clientId = clientId;
    this.clock = 0;
    this.Chars = new Map();

    this.start = ["start", 0];
    this.end = ["end", 0];

    this.Chars.set(getIdStr(this.start), {
      id: this.start,
      content: null,
      left: null,
      right: this.end,
      deleted: false,
    });
    this.Chars.set(getIdStr(this.end), {
      id: this.end,
      content: null,
      left: this.start,
      right: null,
      deleted: false,
    });
    this.stateVector = new Map();
    this.stateVector.set(clientId, 0);
  }

  generateId(): Id {
    const id: Id = [this.clientId, this.clock];
    this.clock++;
    this.stateVector.set(this.clientId, this.clock + 1);
    return id;
  }

  insertString(leftId: Id, str: string) {
    return this.insert(leftId, { type: "string", value: str });
  }

  insertEmbed(leftId: Id, instance: any) {
    const embedId = instance.id || this.generateId();
    return this.insert(leftId, {
      type: "embed",
      value: { id: embedId, instance: { ...instance, id: embedId } },
    });
  }

  insert(
    leftId: Id = this.start,
    content: Content
  ): { type: "insert"; id: Id; left: Id; right: Id; content: Content } {
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
      content,
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
      content,
    };
  }

  // 本地的delete方法
  delete(id: Id): { type: "delete"; id: Id } | null {
    const char = this.Chars.get(getIdStr(id));
    if (!char || char.deleted) return null;
    char.deleted = true;
    return { type: "delete", id };
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

  mergeInsert(op: { id: Id; left: Id; right: Id; content: Content }): void {
    const opIdStr = getIdStr(op.id);
    if (this.Chars.has(opIdStr)) return;

    const leftChar = this.Chars.get(getIdStr(op.left));
    const rightChar = this.Chars.get(getIdStr(op.right));

    // 模仿yjs的风格先根据left rigjt进行大致的判断
    if (leftChar && rightChar && !leftChar.deleted && !rightChar.deleted) {
      if (compareIds(leftChar?.right as Id, op.right) === 0) {
        const newChar: Char = {
          id: op.id,
          content: op.content,
          left: op.left,
          right: op.right,
          deleted: false,
        };
        this.Chars.set(opIdStr, newChar);
        leftChar.right = op.id;
        rightChar.left = op.id;
        return;
      }
    }

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
      content: op.content,
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
    if (char && !char.deleted) {
      char.deleted = true;
      this.processPendingOps();
    }
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
          if (op.type === "insert") {
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

  // GC垃圾回收机制
  // 这里只是简单的实现，真实的GC需要使用引用计数或者时钟向量复杂的判断
  garbageCollect() {
    for (const [key, char] of this.Chars.entries()) {
      if (char.id === this.start || char.id === this.end) continue;
      if (char.deleted) {
        const leftChar = this.Chars.get(getIdStr(char.left!));
        const rightChar = this.Chars.get(getIdStr(char.right!));
        if (leftChar && rightChar) {
          leftChar.right = char.right;
          rightChar.left = char.left;
        }
        this.Chars.delete(key);
      }
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
        if (nextChar?.content!.type === "string") {
          result.push(nextChar.content.value);
        } else if (nextChar?.content?.type === "embed") {
          result.push(nextChar.content.value.instance);
        }
      }
      currentId = nextId;
    }
    return result;
  }
}
