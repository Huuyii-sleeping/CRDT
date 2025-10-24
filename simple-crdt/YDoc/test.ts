// test-ydoc.ts
import { XmlElement } from "../XmlElement";
import { YDoc } from ".";

const doc = new YDoc("client1");

// 获取共享数据
const users = doc.getMap("users");
const list = doc.getArray("list");
const content = doc.getXmlFragment("content");

// 事务操作
doc.transact(() => {
  users.set("name", "Alice");
  list.insertString(list.start, "Item 1");
  
  const p = new XmlElement("client1", "p");
  p.insertChild("Hello");
  content.insertChild(p);
});

console.log("Document state:", doc.toJSON());

console.log('-------------------------------------')

// Client A
const clientA = new YDoc("A");
const usersA = clientA.getMap("users");
usersA.set("name", "Alice");

// Client B（初始为空）
const clientB = new YDoc("B");

// 同步流程
const stateB = clientB.getStateVector(); // Map {}
const diff = clientA.getDiff(stateB);    // 获取 A 相对于 B 的差异

console.log("Diff to send:", diff);
// [{ scope: "users", type: "map-set", key: "name", value: "Alice", id: ["A", 0] }]

// B 应用差异
clientB.applyUpdate(diff);

console.log("B's users:", clientB.getMap("users").toJSON());
// { name: "Alice" } ✅