import { Id } from "../types";
import { simpleYArray } from "../YArray/YArray-双向链表实现";
import { YMap } from "../YMap/YMap";

export class XmlElement {
  id: Id;
  tagName: string;
  attribute: YMap;
  children: simpleYArray;
  constructor(clientId: string, tagName: string) {
    const array = new simpleYArray(clientId) // 临时生成Id
    this.id = array.generateId()
    this.tagName = tagName
    this.attribute = new YMap(clientId)
    this.children = new simpleYArray(clientId)
  }
}
