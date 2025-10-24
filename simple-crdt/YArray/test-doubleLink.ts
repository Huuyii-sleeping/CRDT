import { simpleYArray } from "./YArray-双向链表实现";

// Client A
const client1 = new simpleYArray("A");
let pos = client1.start;
const opsA = [];
opsA.push(client1.insertString(pos, "Hello ")); pos = opsA[0].id;
opsA.push(client1.insertEmbed(pos, { type: "xml-element", tagName: "p" })); pos = opsA[1].id;
opsA.push(client1.insertString(pos, "!"));

// Client B
const client2 = new simpleYArray("B");
pos = client2.start;
const opsB = [];
opsB.push(client2.insertString(pos, "World")); pos = opsB[0].id;
opsB.push(client2.insertEmbed(pos, { type: "xml-element", tagName: "b" }));

// 交换操作
for (const op of opsA) client2.merge(op);
for (const op of opsB) client1.merge(op);

console.log("Final A:", client1.toArray());
console.log("Final B:", client2.toArray());
// 现在应该一致！