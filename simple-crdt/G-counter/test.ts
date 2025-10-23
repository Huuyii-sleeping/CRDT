import { GCounter } from ".";

// 客户端 A
const counterA = new GCounter("A");
counterA.increment(2); // A:2
counterA.increment(1); // A:3

// 客户端 B
const counterB = new GCounter("B");
counterB.increment(5); // B:5

// 同步：A 收到 B 的状态
counterA.merge(counterB.getState());
console.log(counterA.value()); // 3 + 5 = 8

// 同步：B 收到 A 的状态
counterB.merge(counterA.getState());
console.log(counterB.value()); // 8

// 并发递增
counterA.increment(1); // A:4
counterB.increment(2); // B:7

// 再次同步
counterA.merge(counterB.getState());
counterB.merge(counterA.getState());
console.log(counterA.value()); // 4 + 7 = 11
console.log(counterB.value()); // 11