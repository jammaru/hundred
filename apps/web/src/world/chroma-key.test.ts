import { describe, expect, it } from 'vitest';

import { removeMagenta } from './chroma-key';

describe('sprite matte removal', () => {
  it('removes vivid and compressed magenta, including isolated interior gaps', () => {
    const pixels = new Uint8ClampedArray([255, 0, 255, 255, 230, 15, 210, 255]);
    removeMagenta(pixels);
    expect(pixels[3]).toBe(0);
    expect(pixels[7]).toBe(0);
  });

  it('preserves foliage, roof tiles, skin, gray shadows, and existing transparency', () => {
    const pixels = new Uint8ClampedArray([
      90, 150, 50, 255, 180, 80, 40, 255, 220, 170, 140, 255, 60, 60, 60, 80, 0, 0, 0, 0,
    ]);
    const original = pixels.slice();
    removeMagenta(pixels);
    expect(pixels).toEqual(original);
  });

  it('despills blended edge pixels without making existing alpha more opaque', () => {
    const pixels = new Uint8ClampedArray([65, 40, 65, 120]);
    removeMagenta(pixels);
    expect(pixels[0]).toBe(40);
    expect(pixels[2]).toBe(40);
    expect(pixels[3]).toBeGreaterThan(0);
    expect(pixels[3]).toBeLessThan(120);
  });

  it('removes the dark purple matte left by legacy despilling', () => {
    const pixels = new Uint8ClampedArray([66, 7, 66, 255, 74, 10, 74, 255]);
    removeMagenta(pixels, true);
    expect(pixels[3]).toBe(0);
    expect(pixels[7]).toBe(0);
  });

  it('recovers erased roof pixels without restoring keyed background pixels', () => {
    const pixels = new Uint8ClampedArray([90, 95, 100, 0, 188, 55, 144, 0, 0, 0, 0, 0]);
    removeMagenta(pixels, true);
    expect(pixels[3]).toBe(255);
    expect(pixels[7]).toBe(0);
    expect(pixels[11]).toBe(0);
  });
});
