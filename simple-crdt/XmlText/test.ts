import { XmlElement } from "../XmlElement/index";
import { XmlText } from "./index";

// 创建段落
const p = new XmlElement("client1", "p");

// 创建文本节点
const text = new XmlText("client1");

// 插入文本
text.insert(0, "Hello world"); // 实际是追加

// 给 "Hello" 加粗（索引 0，长度 5）
text.format(0, 5, { bold: true });

// 将文本插入到 <p>
p.insertChild(text);

// 打印纯文本（format 不显示）
console.log(p.toString());
// 输出: <p>Hello world</p>

// 但内部已记录格式！
console.log(text.content.toArray()); 
// 包含: [format{bold:true}, "Hello world", format{bold:null}]