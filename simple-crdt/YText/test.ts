import { CRDTText } from "./YText";

// 创建实例
const text = new CRDTText("client-1");

// 监听变更
const unwatch = text.observe((event) => {
  console.log("变更:", event);
  console.log("当前文本:", text.toString());
});

// 本地编辑
const op1 = text.insert("H");
const op2 = text.insert("i", op1.id);

// 模拟接收远程操作
text.applyUpdate([op1, op2]);

// 取消监听
unwatch();