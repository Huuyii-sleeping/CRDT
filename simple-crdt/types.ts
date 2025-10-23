export type Id = [string, number];

// 这个op不包括text的实现，text不需要使用嵌套的结构 不需要这么麻烦
export type Op =
  | { type: "insert"; id: Id; parent: Id; index: number; value: any }
  | { type: "delete"; id: Id }
  | { type: "set"; id: Id; key: string; value: any };

export const getIdStr = (id: Id): string => `${id[0]}@${id[1]}`;

export const compareIds = (a: Id, b: Id): number => {
  if (a[1] !== b[1]) return a[1] - b[1];
  return a[0].localeCompare(b[0]);
};
