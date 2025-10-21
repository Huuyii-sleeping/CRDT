<template>
  <div class="wrapper">
    <div class="canvases">
      <canvas class="canvas" id="alice"></canvas>
      <canvas class="canvas" id="bob"></canvas>
    </div>
    <input class="color" type="color" value="#000000" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import type { RGB } from "./types/pixelData";
import { PixelEditor } from "./types/pixelEditor";
import { globalUuidTable } from "./types/utils";
import { serializeState } from "./middleware/collabMiddleware";

onMounted(() => {
  // get alice's canvas
  const acanvas = document.querySelector("#alice");
  if (!(acanvas instanceof HTMLCanvasElement))
    throw new Error(`<canvas id="alice"> not found!`);

  // get bob's canvas
  const bcanvas = document.querySelector("#bob");
  if (!(bcanvas instanceof HTMLCanvasElement))
    throw new Error(`<canvas id="bob"> not found!`);

  // get the color input
  const palette = document.querySelector(`input[type="color"]`);
  if (!(palette instanceof HTMLInputElement))
    throw new Error(`<input type="color"> not found!`);

  // set the artboard size
  const artboardSize = { w: 100, h: 100 };

  // instantiate the two `PixelEditor` classes
  const alicePixelEditor = new PixelEditor(acanvas, artboardSize);
  const bobPixelEditor = new PixelEditor(bcanvas, artboardSize);

  const alicePixelData = alicePixelEditor.pixelData;
  const bobPixelData = bobPixelEditor.pixelData;

  globalUuidTable.add(alicePixelData.id);
  globalUuidTable.add(bobPixelData.id);

  // merge the states whenever either editor makes a change
  alicePixelEditor.onchange = (originState) => {
    const { optimilizedState, uuidTable } = serializeState(
      originState,
      alicePixelData.id
    );
    bobPixelEditor.receiveOptimized({ optimilizedState, uuidTable });
  };
  bobPixelEditor.onchange = (originState) => {
    const { optimilizedState, uuidTable } = serializeState(
      originState,
      alicePixelData.id
    );
    alicePixelEditor.receiveOptimized({ optimilizedState, uuidTable });
  };

  // set the color whenever the palette input changes
  palette.oninput = () => {
    const hex = palette.value.substring(1).match(/[\da-f]{2}/g) || [];
    const rgb = hex.map((byte) => parseInt(byte, 16));
    if (rgb.length === 3) alicePixelEditor.color = bobPixelEditor.color = rgb as RGB;
  };
});
</script>

<style scoped>
.wrapper {
  display: inline-flex;
  flex-direction: column;
  gap: 1rem;
}

.canvases {
  display: flex;
  gap: 1rem;
}

.canvas {
  width: 25rem;
  height: 25rem;
  border: 0.25rem solid #eeeeee;
  border-radius: 0.25rem;
  cursor: crosshair;
  touch-action: none;
}

.color {
  border: 0;
}
</style>
