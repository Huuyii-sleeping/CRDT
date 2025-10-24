// test-full-xml.ts
import { simpleYArray } from "../YArray/YArray-双向链表实现";
import { XmlElement } from "./index";
import { XmlText } from "../XmlText/index";

console.log("=== 创建嵌套 XML 结构 ===");

// 创建根文档
const doc = new simpleYArray("client1");

// 创建 <article>
const article = new XmlElement("client1", "article");
article.setAttribute("id", "main");
article.setAttribute("lang", "zh");
console.log("article:", article);

// 创建 <h1>Hello</h1>
const h1 = new XmlElement("client1", "h1");
h1.insertChild("Hello Collaborative XML!");
console.log("h1", h1);

// 创建 <p>段落
const p = new XmlElement("client1", "p");
p.insertChild("This is a");

// 创建 <b>bold</b>
const bold = new XmlElement("client1", "b");
bold.insertChild("bold");
p.insertChild(bold);
p.insertChild(" text.");


// 组装
article.insertChild(h1);
article.insertChild(p);

// 插入到文档
doc.insertEmbed(doc.start, article);

// 打印结果
console.log("\nXML Output:");
console.log(article.toString());

console.log("\nJSON Representation:");
console.log(JSON.stringify(article.toJSON(), null, 2));

// 验证嵌入
const rootChildren = doc.toArray();
console.log("\nRoot has", rootChildren.length, "child(ren)");
console.log("First child tag:", rootChildren[0].tagName);
