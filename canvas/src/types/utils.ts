import type { RGB } from "./pixelData";

export namespace CollabUtils {
  export const rgbToHex = (rgb: RGB): number => {
    const [r, g, b] = rgb;
    return (r << 16) | (g << 8) | b;
  };

  export const hexToRgb = (hex: number): RGB => {
    return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  };

  export const hexStrToHex = (hexStr: string): number => {
    return parseInt(hexStr.replace("#", ""), 16);
  };
}

class UuidTable {
  private map = new Map<number, string>();
  private reverseMap = new Map<string, number>();
  private nextKey = 0;

  add(uuid: string): number {
    if (this.reverseMap.has(uuid)) {
      return this.reverseMap.get(uuid)!;
    }
    const key = this.nextKey++;
    this.map.set(key, uuid);
    this.reverseMap.set(uuid, key);
    return key;
  }

  getUuidByKey(key: number): string | undefined {
    return this.map.get(key);
  }

  getKeyByUuid(uuid: string): number | undefined {
    return this.reverseMap.get(uuid);
  }

  serialize(): Record<number, string> {
    const result: Record<number, string> = {};
    this.map.forEach((uuid, key) => {
      result[key] = uuid;
    });
    return result;
  }

  deserialize(data: Record<number, string>): void {
    this.map.clear();
    this.reverseMap.clear();
    let maxKey = 0;
    Object.entries(data).forEach(([keyStr, uuid]) => {
      const key = Number(keyStr);
      this.map.set(key, uuid);
      this.reverseMap.set(uuid, key);
      if (key > maxKey) maxKey = key;
    });
    this.nextKey = maxKey + 1;
  }
}

export const globalUuidTable = new UuidTable()
