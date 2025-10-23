/**
 * 测试场景:
 * 1.客户端A插入'a', 再插入'b'(a的后面)
 * 2.客户端插入'c', 再插入'c'(开头)
 * 3.合并双方的操作.验证最后的结果是否正确
 */

import { CRDTText } from "./YText";

const clientA = new CRDTText("userA");
const clientB = new CRDTText("userB");

// 测试按照顺序进行插入
const opA1 = clientA.insert("a");
const opA2 = clientA.insert("b", opA1.id);
console.log("A文本操作之后", clientA.toString());

const opB1 = clientB.insert("c");
console.log("B文本操作之后", clientB.toString());
console.log(opB1);
// 测试合并的操作
clientA.merge(opB1);
clientB.merge(opA1);
clientB.merge(opA2);
console.log("A合并之后的结果", clientA.toString());
console.log("B合并之后的结果", clientB.toString());

const aResult = clientA.toString();
const bResult = clientB.toString();
console.log(`A和B的结果是否一致, ${aResult === bResult}`);
console.log(`最终结果:${aResult}`);
