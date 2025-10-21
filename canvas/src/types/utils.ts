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
