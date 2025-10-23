import { compareIds, getIdStr, Id, Op } from "../types";

export class YArray {
  clientId: string;
  clock: number;
  items: Map<any, any>;
  parentId: Id;
  constructor(clientId: string, parentId: Id = ["root", 0]) {
    this.clientId = clientId;
    this.clock = 0;
    this.items = new Map();
    this.parentId = parentId;
  }

  private generateId(): Id {
    const id: Id = [this.clientId, this.clock];
    this.clock++;
    return id;
  }

  insert(index: number, value: any): Op {
    const id = this.generateId();
    this.items.set(getIdStr(id), { id, value, deleted: false });
    return {
      type: "insert",
      id,
      parent: this.parentId,
      index,
      value,
    };
  }

  delete(id: Id): Op | null {
    const item = this.items.get(getIdStr(id));
    if (!item || item.deleted) return null;
    item.deleted = true;
    return { type: "delete", id };
  }

  merge(op: Op): void {
    if (op.type === "insert") {
      const key = getIdStr(op.id);
      if (this.items.has(key)) return;
      this.items.set(key, { id: op.id, value: op.value, deleted: false });
    } else if (op.type === "delete") {
      const item = this.items.get(getIdStr(op.id));
      if (item) item.deleted = true;
    }
  }

  toArray(): any[] {
    return Array.from(this.items.values())
      .filter((item) => !item.deleted)
      .sort((a, b) => compareIds(a.id, b.id))
      .map((item) => item.value);
  }
}
