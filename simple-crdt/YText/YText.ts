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
  originClock: number;
  constructor(
    id: any,
    value: any,
    left: Id | null,
    right: Id | null,
    originBlock: number
  ) {
    this.id = id;
    this.value = value;
    this.left = left;
    this.right = right;
    this.deleted = false;
    this.originClock = originBlock;
  }
}

export class CRDTText {
  chars: Map<string, Char>;
  clientId: any;
  clock: number;
  start: Char;
  end: Char;
  processedOps: Set<string>;
  constructor(clientId: string) {
    this.clientId = clientId;
    this.clock = 0;
    this.chars = new Map();
    this.start = new Char(["start", 0], "", null, ["end", 0], 0);
    this.end = new Char(["end", 0], "", ["start", 0], null, 0);
    this.start.right = this.end.id;
    this.end.left = this.start.id;
    this.chars.set(getIdStr(this.start.id), this.start);
    this.chars.set(getIdStr(this.end.id), this.end);
    this.processedOps = new Set();
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
    leftId: Id = this.start.id
  ): {
    type: "insert";
    id: Id;
    value: string;
    left: Id;
    right: Id;
    clock: number;
  } {
    const leftIdStr = getIdStr(leftId);
    const leftChar = this.chars.get(leftIdStr);
    if (!leftChar) {
      throw new Error("左侧邻居已经不存在");
    }

    const newId = this.generateId();
    const newClock = this.clock - 1;

    const rightId = leftChar.right;
    if (!rightId) {
      throw new Error("左侧邻居没有右侧节点");
    }

    const rightIdStr = getIdStr(rightId);
    const rightChar = this.chars.get(rightIdStr);
    if (!rightChar) {
      throw new Error("右侧邻居不存在");
    }

    const newChar = new Char(newId, value, leftId, rightId, newClock);
    this.chars.set(getIdStr(newId), newChar);
    leftChar.right = newId;
    rightChar.left = newId;
    return {
      type: "insert",
      id: newId,
      value,
      left: leftId,
      right: rightId,
      clock: newClock,
    };
  }

  /**
   * 实现删除的逻辑
   * @param id
   */
  delete(id: Id): { type: "delete"; id: Id; clock: number } | null {
    const idStr = getIdStr(id);
    const char = this.chars.get(idStr);
    if (!char || char.deleted) return null;
    char.deleted = true;
    return {
      type: "delete",
      id: id,
      clock: this.clock - 1,
    };
  }

  /**
   * 实现远程合并操作
   * @param op
   */
  merge(op: any) {
    const opId =
      op.type === "insert"
        ? `${op.id[0]}@${op.id[1]}`
        : `${op.id[0]}@${op.id[1]}-delete`;
    if (this.processedOps.has(opId)) return;
    this.processedOps.add(opId);
    if (op.type === "insert") {
      this.mergeInsert(op);
    } else if (op.type === "delete") {
      this.mergeDelete(op);
    }
  }

  mergeInsert(op: {
    id: Id;
    value: string;
    left: Id;
    right: Id;
    clock: number;
  }) {
    const idStr = getIdStr(op.id);
    if (this.chars.get(idStr)) return;

    const leftIdStr = getIdStr(op.left);
    const rightIdStr = getIdStr(op.right);
    const leftChar = this.chars.get(leftIdStr);
    const rightChar = this.chars.get(rightIdStr);
    if (!leftChar || !rightChar) {
      console.warn("依赖的邻居节点没有同步，暂存操作");
      return;
    }

    // 处理冲突的问题 Yjs核心逻辑
    if (leftChar.right !== op.right) {
      // 当插入的位置存在冲突的时候
      // 我们找到当时left的实际的右邻居
      // 拿到两个数据的id作比较，[client, clock] 先根据clock比较
      let currentRight = leftChar.right;
      // 顺位替代
      while (currentRight && compareIds(currentRight, op.right) < 0) {
        const currentRightChar = this.chars.get(getIdStr(currentRight));
        if (!currentRightChar || currentRightChar.deleted) break;
        currentRight = currentRightChar.right;
      }
      // 顶上位置
      op.right = currentRight as Id;
    }

    // 没有冲突直接添加就行
    const newChar = new Char(op.id, op.value, op.left, op.right, op.clock);
    this.chars.set(idStr, newChar);

    leftChar.right = op.id;
    const actualRightChar = this.chars.get(getIdStr(op.right));
    if (actualRightChar) actualRightChar.left = op.id;
  }

  mergeDelete(op: { id: Id; clock: number }): void {
    const idStr = getIdStr(op.id);
    const char = this.chars.get(idStr);
    if (!char) {
      console.warn("待删除的节点未同步，标记为待处理消息");
      return;
    }
    char.deleted = true;
  }

  toString() {
    const result: string[] = [];
    let current: Char | null = this.start;
    while (current && current.id[0] !== "end") {
      const nextIdStr = getIdStr(current.right as Id);
      const nextChar = this.chars.get(nextIdStr);
      if (!nextChar) break;
      if (!nextChar.deleted) {
        result.push(nextChar.value);
      }
      current = nextChar;
    }
    return result.join("");
  }
}
