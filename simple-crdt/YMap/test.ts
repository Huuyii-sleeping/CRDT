import { YMap } from "./YMap";

const mapA = new YMap("A");
const mapB = new YMap("B");

// 监听变更
mapA.observer((e) => console.log("A:", e));
mapB.observer((e) => console.log("B:", e));

// A 设置
const op1 = mapA.set("name", "Alice"); // id: ["A",0]
const op2 = mapA.set("age", 30); // id: ["A",1]

// B 设置（并发）
const op3 = mapB.set("name", "Bob"); // id: ["B",0]

// 同步
mapB.applyUpdate([op1, op2]); // B 得到 Alice, 30
mapA.applyUpdate([op3]); // A 收到 Bob

// 最终结果取决于 ID 全序！
// 假设 "A" < "B"（字典序），则 op3.id > op1.id → name = "Bob"
console.log(mapA.get("name")); // "Bob"
console.log(mapB.get("name")); // "Bob"
