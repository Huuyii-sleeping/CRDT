import { YArray } from "./YArray-map实现";

const clientA = new YArray("userA");
const clientB = new YArray("userB");

const opA = clientA.insert(0, "a");
const opB = clientB.insert(0, "b");

clientA.merge(opB);
clientB.merge(opA);
console.log("A数组", clientA.toArray());
console.log("B数组", clientB.toArray());
