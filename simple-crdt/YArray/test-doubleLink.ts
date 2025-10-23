import { simpleYArray } from "./YArray-双向链表实现";

const clientA = new simpleYArray("userA");
const clientB = new simpleYArray("userB");

const opA1 = clientA.insert(clientA.start, "a");
const opB1 = clientB.insert(clientB.start, "b");

const opA2 = clientA.insert(opA1.id, "c");
const opB2 = clientB.insert(opB1.id, "d");
clientA.merge(opB1);
clientA.merge(opB2);
clientB.merge(opA1);
clientB.merge(opA2);

console.log("A排序之后的结果", clientA.toArray());
console.log("B排序之后的结果", clientB.toArray());

const clientC = new simpleYArray("userC");
const clientD = new simpleYArray("userD");

const opC1 = clientC.insert(clientC.start, "x");
const opD1 = clientD.insert(clientD.start, "y");
const opD2 = clientD.insert(opD1.id, "z");

clientC.merge(opD1);
clientC.merge(opD2);
clientD.merge(opC1);

console.log("C排序之后的结果", clientC.toArray());
console.log("D排序之后的结果", clientD.toArray());
