import { PixelData, type RGB } from "./pixelData";

export class PixelEditor {
  /** The underlying <canvas> element */
  #el: HTMLCanvasElement;

  /** The 2D canvas rendering context */
  #ctx: CanvasRenderingContext2D;

  /** The artboard size, in drawable pxiels */
  #artboard: { w: number; h: number };

  /** The underlying pixel data */
  #data = new PixelData();

  /** The selected color */
  #color: RGB = [0, 0, 0];

  /** Listeners for change events */
  #listeners: Array<(state: PixelData["state"]) => void> = [];

  #prev: [x: number, y: number] | undefined;

  #painted = new Set<string>();

  constructor(el: HTMLCanvasElement, artboard: { w: number; h: number }) {
    this.#el = el;
    const ctx = el.getContext("2d");
    if (!ctx) throw new Error("could not get rendering context");
    this.#ctx = ctx;
    this.#artboard = artboard;
    this.#el.addEventListener("pointerdown", this);
    this.#el.addEventListener("pointermove", this);
    this.#el.addEventListener("pointerup", this);

    this.#el.width = this.#el.clientWidth * devicePixelRatio;
    this.#el.height = this.#el.clientHeight * devicePixelRatio;
    this.#ctx.scale(devicePixelRatio, devicePixelRatio);
    this.#ctx.imageSmoothingEnabled = true;
  }

  /**
   * Appends a listener to be called when the state changes.
   * @param listener */
  set onchange(listener: (state: PixelData["state"]) => void) {
    this.#listeners.push(listener);
  }

  /** Sets the drawing color. */
  set color(color: RGB) {
    this.#color = color;
  }

  /**
   * Handles events on the canvas.
   * @param e Pointer event from the canvas element.
   */
  handleEvent(e: PointerEvent) {
    switch (e.type) {
      case "pointerdown": {
        this.#el.setPointerCapture(e.pointerId);
        break;
      }
      case "pointermove": {
        if (!this.#el.hasPointerCapture(e.pointerId)) {
          return;
        }
        const x =
          Math.floor(this.#artboard.w * e.offsetX) / this.#el.clientWidth;
        const y =
          Math.floor(this.#artboard.h * e.offsetY) / this.#el.clientHeight;
        this.#paint(x, y);
        this.#prev = [x, y];
        break;
      }
      case "pointerup": {
        this.#el.releasePointerCapture(e.pointerId);
        this.#prev = undefined;
        this.#painted.clear();
        break;
      }
    }
  }

  /**
   * Sets pixel under the mouse cursor with the current color.
   * @param x X coordinate of the destination pixel.
   * @param y Y coordinate of the destination pixel.
   */
  #paint(x: number, y: number) {
    if (x < 0 || this.#artboard.w <= x) return;
    if (y < 0 || this.#artboard.h <= y) return;

    if (!this.#checkPainted(x, y)) this.#data.set(x, y, this.#color);
    let [x0, y0] = this.#prev || [x, y];
    const dx = x - x0;
    const dy = y - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xinc = dx / steps,
      yinc = dy / steps;
    for (let i = 0; i < steps; i++) {
      y0 += yinc;
      x0 += xinc;
      const x1 = Math.round(x0);
      const y1 = Math.round(y0);
      if (!this.#checkPainted(x1, y1)) this.#data.set(x1, y1, this.#color);
    }
    this.#draw();
    this.#notify();
  }

  /** Draws each pixel on the canvas. */
  async #draw() {
    const chans = 4;
    const buffer = new Uint8ClampedArray(
      this.#artboard.w * this.#artboard.h * chans
    );
    const rowsize = this.#artboard.w * chans;
    for (let row = 0; row < this.#artboard.h; row++) {
      const offsetY = row * rowsize;
      for (let col = 0; col < this.#artboard.w; col++) {
        const offsetX = col * chans;
        const offset = offsetX + offsetY;
        const [r, g, b] = this.#data.get(col, row);
        buffer[offset] = r;
        buffer[offset + 1] = g;
        buffer[offset + 2] = b;
        buffer[offset + 3] = 255;
      }
    }
    const data = new ImageData(buffer, this.#artboard.w, this.#artboard.h);
    const bitmap = await createImageBitmap(data);
    this.#ctx.drawImage(
      bitmap,
      0,
      0,
      this.#el.clientWidth,
      this.#el.clientHeight
    );
  }

  /** Notify all listeners that the state has changed. */
  #notify() {
    const state = this.#data.state;
    for (const listener of this.#listeners) {
      listener(state);
    }
  }

  #checkPainted(x: number, y: number) {
    const key = PixelData.key(x, y);
    const painted = this.#painted.has(key);
    this.#painted.add(key);
    return painted;
  }

  /**
   * Merge remote state with the current state and redraw the canvas.
   * @param state State to merge into the current state. */
  receive(state: PixelData["state"]) {
    this.#data.merge(state);
    this.#draw();
  }
}
