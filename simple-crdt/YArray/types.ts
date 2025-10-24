import { Id } from "../types";

export type Content =
  | { type: "string"; value: string }
  | { type: "embed"; value: { id: Id; instance: any } }
  | { type: "format"; value: Record<string, any> };
