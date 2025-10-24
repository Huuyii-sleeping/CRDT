import { getIdStr, Id } from "../types";
import { XmlText } from "../XmlText";
import { simpleYArray } from "../YArray/YArray-双向链表实现";
import { YMap } from "../YMap/YMap";

/**
 * Xmlelement表示的是一个xml/html节点，例如：<p class="note">Hello</p>
 * -tagName 元素标签名（div，p）
 * -attribute 使用map存储属性 class id之类的。协同
 * -children 使用simpleYArray存储子节点，（可以嵌套xmlElement或者文本）
 */
export class XmlElement {
  id: Id;
  tagName: string;
  attribute: YMap;
  children: simpleYArray;
  readonly type = "xml-element";
  constructor(clientId: string, tagName: string, scope?: string) {
    const array = new simpleYArray(clientId); // 临时生成Id
    this.id = array.generateId();
    this.tagName = tagName;
    this.attribute = new YMap(clientId);
    this.children = new simpleYArray(clientId);
  }

  setAttribute(key: string, value: string): any {
    return this.attribute.set(key, value);
  }

  getAttribute(key: string): any {
    return this.attribute.get(key);
  }

  insertChild(content: string | XmlElement | XmlText): void {
    let pos = this.children.start as Id;
    while (true) {
      const current = this.children["Chars"].get(getIdStr(pos));
      if (!current || current.right === this.children["end"]) {
        break;
      }
      pos = current.right as Id;
    }
    if (typeof content === "string") {
      this.children.insertString(pos, content);
    } else if (content.type === "xml-element") {
      this.children.insertEmbed(pos, content);
    } else if (content.type === "xml-text") {
      this.children.insertEmbed(pos, content);
    }
  }

  toJSON(): any {
    return {
      id: this.id,
      type: "xml-element",
      tagName: this.tagName,
      attribute: this.attribute.toJSON(),
      children: this.children.toArray().map((child) => {
        if (child && typeof child === "object") {
          if (child.type === "xml-element") {
            return child.toJSON();
          } else if (child.type === "xml-text") {
            return child.toJSON();
          }
          return child;
        }
      }),
    };
  }

  toString(indent: number = 0): string {
    const spaces = " ".repeat(indent);
    const attrs = Object.entries(this.attribute.toJSON())
      .map(([k, v]) => `${k}="${String(v)}"`)
      .join(" ");
    const attrStr = attrs ? ` ${attrs}` : "";
    const childrenStr = this.children
      .toArray()
      .map((child) => {
        if (child && typeof child === "object") {
          if (child.type === "xml-element") {
            return (child as XmlElement).toString(indent + 1);
          } else if (child.type === "xml-text") {
            return (child as XmlText).toString();
          }
        } else if (typeof child === "string") {
          return child;
        } else {
          return `[Embeded: ${child?.type || "unknown"}]`;
        }
      })
      .join("");
    return `${spaces}<${this.tagName}${attrStr}>${childrenStr}</${this.tagName}>`;
  }
}
