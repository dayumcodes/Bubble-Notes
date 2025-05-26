
// src/lib/color-utils.ts

export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100 (percentage)
  l: number; // 0-100 (percentage)
}

/**
 * Converts a HEX color string to an HSL object.
 * @param hex HEX color string (e.g., "#FF5733")
 * @returns HSLColor object or null if invalid hex.
 */
export function hexToHsl(hex: string): HSLColor | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return null;
  }

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Converts an HSLColor object to a HEX string.
 * @param hsl HSLColor object
 * @returns HEX string (e.g., "#FF5733")
 */
export function hslToHex({ h, s, l }: HSLColor): string {
  s /= 100;
  l /= 100;

  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

  const toHex = (val: number) => Math.round(val * 255).toString(16).padStart(2, '0');

  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * Determines if black or white text has better contrast against a given HEX background.
 * @param hexcolor Background HEX color string (e.g., "#FF5733")
 * @returns "#000000" (black) or "#FFFFFF" (white)
 */
export function getContrastingTextColor(hexcolor: string): string {
  if (hexcolor.startsWith("#")) {
    hexcolor = hexcolor.slice(1);
  }
  if (hexcolor.length === 3) {
    hexcolor = hexcolor.split('').map(char => char + char).join('');
  }
  if (hexcolor.length !== 6) {
    return "#000000"; // Default to black for invalid input
  }
  const r = parseInt(hexcolor.substring(0, 2), 16);
  const g = parseInt(hexcolor.substring(2, 4), 16);
  const b = parseInt(hexcolor.substring(4, 6), 16);
  // Using YIQ formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 128 ? "#000000" : "#FFFFFF";
}

/**
 * Parses an HSL string "H S% L%" into an HSLColor object.
 * @param hslStr HSL string (e.g., "210 60% 50%")
 * @returns HSLColor object or null if invalid format.
 */
export function parseHslString(hslStr: string): HSLColor | null {
  const match = hslStr.match(/^(\d{1,3})\s+(\d{1,3})%\s+(\d{1,3})%$/);
  if (!match) return null;
  return {
    h: parseInt(match[1], 10),
    s: parseInt(match[2], 10),
    l: parseInt(match[3], 10),
  };
}

/**
 * Formats an HSLColor object into an HSL string "H S% L%".
 * @param hsl HSLColor object
 * @returns HSL string (e.g., "210 60% 50%")
 */
export function formatHslString({ h, s, l }: HSLColor): string {
  return `${h} ${s}% ${l}%`;
}

/**
 * Derives glow HSL strings from a base HSL color.
 * @param baseHsl The base HSL color for the bubble background.
 * @returns Object with glow1 and glow2 HSL strings.
 */
export function deriveGlowColors(baseHsl: HSLColor): { glow1: string; glow2: string } {
  // Glow 1: A bit more saturated, slightly lighter/darker depending on base lightness
  const glow1L = baseHsl.l > 50 ? Math.max(0, baseHsl.l - 10) : Math.min(100, baseHsl.l + 10);
  const glow1S = Math.min(100, baseHsl.s + 5);
  const glow1 = formatHslString({ h: baseHsl.h, s: glow1S, l: glow1L });

  // Glow 2: Less saturated, significantly lighter (more of an aura)
  const glow2L = Math.min(100, baseHsl.l + 20);
  const glow2S = Math.max(0, baseHsl.s - 10);
  const glow2 = formatHslString({ h: (baseHsl.h + 20) % 360, s: glow2S, l: glow2L }); // Shift hue slightly for variation

  return { glow1, glow2 };
}
