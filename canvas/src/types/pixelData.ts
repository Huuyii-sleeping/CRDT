import { LWWMap } from ".";

export type RGB = [red: number, green: number, blue: number];

export namespace ColorUtils {
  export const rgbToHex = (rgb: RGB): number =>
    (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
  export const hexToRgb = (hex: number): RGB => [
    (hex >> 16) & 0xff,
    (hex >> 8) & 0xff,
    hex & 0xff,
  ];
  export const hexStrToHex = (hexStr: string): number =>
    parseInt(hexStr.replace("#", ""), 16);
}

export class PixelData {
  readonly id: string;
  #data: LWWMap<number>;

  constructor(id?: string) {
    this.id = id || "default_id";
    this.#data = new LWWMap(this.id, {});
  }

  /**
   * Returns a stringified version of the given coordinates.
   * @param x X coordinate.
   * @param y Y coordinate.
   * @returns Stringified version of the coordinates.
   */
  static key(x: number, y: number) {
    return `${x},${y}`;
  }

  get value() {
    return this.#data.value;
  }

  get state() {
    return this.#data.state;
  }

  set(x: number, y: number, value: RGB) {
    const key = PixelData.key(x, y);
    const hex = ColorUtils.rgbToHex(value);
    this.#data.set(key, hex);
  }

  get(x: number, y: number): RGB {
    const key = PixelData.key(x, y);
    const hex = this.#data.get(key);
    return hex !== undefined ? ColorUtils.hexToRgb(hex) : [255, 255, 255];
  }

  delete(x: number, y: number) {
    const key = PixelData.key(x, y);
    this.#data.delete(key);
  }

  merge(state: PixelData["state"]) {
    this.#data.merge(state);
  }
}
