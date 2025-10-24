import { getIdStr, Id } from "../types";
import { simpleYArray } from "../YArray/YArray-双向链表实现";

/**
 * xmlText表示xml中的文本节点，支持协同文本，协同格式
 * 例如：hello with {bold： true}
 */
export class XmlText {
  id: Id;
  type = "xml-text";
  content: simpleYArray;
  constructor(clientId: string) {
    const temp = new simpleYArray(clientId);
    this.id = temp.generateId();
    this.content = new simpleYArray(clientId);
  }

  // 这里只写了向后追加，真实情况下应该支持随意添加
  insert(index: number, text: string): void {
    let pos = this.content.start;
    while (true) {
      const current = this.content["Chars"].get(getIdStr(pos));
      if (!current || current.right === this.content["end"]) break;
      pos = current.right as Id;
    }
    this.content.insertString(pos, text);
  }

  format(index: number, length: number, attributes: Record<string, any>): void {
    let pos = this.content.start;
    for (let i = 0; i < index; i++) {
      const current = this.content.Chars.get(getIdStr(pos));
      if (!current || current.right === this.content.end) break;
      pos = current.right!;
    }
    this.content.insert(pos, {
      type: "format",
      value: attributes,
    });

    let endPos = pos;
    for (let i = 0; i < length; i++) {
      const current = this.content.Chars.get(getIdStr(endPos));
      if (!current || current.right === this.content.end) break;
      endPos = current.right!;
    }

    const removeAttrs = Object.fromEntries(
      Object.keys(attributes).map((k) => [k, null])
    );
    this.content.insert(endPos, {
      type: "format",
      value: removeAttrs,
    });
  }

  toString(): string {
    return this.content.toArray().join("");
  }

  toJSON(): any {
    return {
      id: this.id,
      type: "xml-text",
      content: this.content.toArray().join(""),
    };
  }
}
