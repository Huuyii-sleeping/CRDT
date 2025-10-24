import { XmlElement } from "../XmlElement";
import { simpleYArray } from "../YArray/YArray-双向链表实现";
import { YMap } from "../YMap/YMap";

export class YDoc {
  clientId: string;
  private _shared: Map<string, any>;
  private _transactionDepth = 0;
  private _updateCallbacks: Array<(update: any) => void> = [];
  private _scopeTypes = new Map<string, "array" | "map" | "xml">();

  constructor(clientId: string) {
    this.clientId = clientId;
    this._shared = new Map();
  }

  getMap(name: string): YMap {
    if (!this._shared.has(name)) {
      this._shared.set(name, new YMap(this.clientId));
      console.log(this._shared);
    }
    return this._shared.get(name);
  }

  getArray(name: string): simpleYArray {
    if (!this._shared.has(name)) {
      this._shared.set(name, new simpleYArray(this.clientId));
      this._scopeTypes.set(name, "array");
    }
    return this._shared.get(name);
  }

  getXmlFragment(name: string): XmlElement {
    if (!this._shared.has(name)) {
      const fragment = new XmlElement(this.clientId, "fragment");
      this._scopeTypes.set(name, "xml");
      this._shared.set(name, fragment);
    }
    return this._shared.get(name);
  }

  getStateVector(): Map<string, number> {
    const docSV = new Map<string, number>();
    for (const shared of this._shared.values()) {
      if (typeof shared.getStateVector === "function") {
        const sv = shared.getStateVector();
        for (const [clientId, clock] of sv) {
          docSV.set(clientId, clock);
        }
      }
    }
    return docSV;
  }

  getDiff(targetSV: Map<string, number>): any[] {
    let allOps: any[] = [];
    for (const [name, shared] of this._shared) {
      if (typeof shared.getDiff === "function") {
        const ops = shared.getDiff(targetSV);
        ops.forEach((op: any) => {
          op.scope = name;
        });
        allOps = allOps.concat(ops);
      }
    }
    return allOps;
  }

  applyUpdate(ops: any[]): void {
    this.transact(() => {
      for (const op of ops) {
        const scope = op.scope;
        if (!scope) continue;
        let shared = this._shared.get(op.scope);
        if (!shared) {
          shared = this._createSharedFromOp(op);
          if (shared) {
            this._shared.set(scope, shared);
          } else {
            console.log("unknown the type:", op);
            continue;
          }
        }
        if (op.type === "insert" || op.type === "delete") {
          shared.merge(op);
        } else if (op.type === "map-set") {
          shared.merge(op);
        }
      }
    });
  }

  private _createSharedFromOp(op: any): any {
    const scope = op.scope;
    if (!scope) return null;
    const isXmlScope = scope.startsWith("xml:") || scope.endsWith("Xml");
    const registerType = this._scopeTypes.get(scope);
    if (registerType) {
      switch (registerType) {
        case "xml":
          return new XmlElement(this.clientId, "fragment");
        case "map":
          return new YMap(this.clientId);
        case "array":
          return new simpleYArray(this.clientId);
      }
    }
    if (isXmlScope) {
      return new XmlElement(this.clientId, "fragment");
    }

    if (op.type === "map-set" || op.type === "map-delete") {
      return new YMap(this.clientId);
    }
    return new simpleYArray(this.clientId);
  }

  transact(fn: () => void): void {
    this._transactionDepth++;
    try {
      fn();
    } finally {
      this._transactionDepth--;
      if (this._transactionDepth === 0) {
        this._emitUpdate();
      }
    }
  }

  onUpdate(callback: (update: any) => void): void {
    this._updateCallbacks.push(callback);
  }

  private _emitUpdate(): void {
    const update = this.toJSON();
    for (const cb of this._updateCallbacks) {
      cb(update);
    }
  }

  toJSON(): any {
    const result: Record<string, any> = {};
    for (const [key, value] of this._shared) {
      if (typeof value.toJSON === "function") {
        result[key] = value.toJSON();
      }
    }
    return result;
  }
}
