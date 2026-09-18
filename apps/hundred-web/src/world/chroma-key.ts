/** Remove the magenta matte at texture upload, including disconnected gaps.
 * Existing alpha is preserved. Only magenta-dominant pixels are affected.
 */
export const removeMagenta = (
  pixels: Uint8ClampedArray | Uint8Array,
  recoverAlpha = false,
): void => {
  for (let offset = 0; offset < pixels.length; offset += 4) {
    const r = pixels[offset]!;
    const g = pixels[offset + 1]!;
    const b = pixels[offset + 2]!;
    const spill = Math.min(r, b) - g;
    if (spill <= 10 || Math.min(r, b) < g * 1.3 + 10) {
      // The legacy --shadow flood fill erased connected gray roofs and walls.
      // Their RGB data is intact, so it can be recovered for these source assets.
      if (recoverAlpha && pixels[offset + 3] === 0 && r + g + b > 0) {
        pixels[offset + 3] = 255;
      }
      continue;
    }
    const matte = Math.min(1, Math.max(0, (spill - 10) / 25));
    pixels[offset + 3] = Math.round(pixels[offset + 3]! * (1 - matte));
    // Neutralize the residual matte before GPU filtering to avoid pink halos.
    pixels[offset] = Math.max(g, r - spill);
    pixels[offset + 2] = Math.max(g, b - spill);
  }
};
