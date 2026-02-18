/**
 * Parse a color string (hex or rgb) and return a valid hex value.
 * Returns null if the input is invalid.
 */
export function parseColorToHex(input: string): string | null {
  const trimmed = input.trim();

  // Hex: #RGB, #RRGGBB
  const hexMatch = trimmed.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (hexMatch) {
    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    return `#${hex.toLowerCase()}`;
  }

  // RGB: rgb(r, g, b)
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch.map(Number);
    if (r <= 255 && g <= 255 && b <= 255) {
      return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
    }
  }

  return null;
}

/**
 * Check if a color string is valid (hex or rgb).
 */
export function isValidColor(input: string): boolean {
  return parseColorToHex(input) !== null;
}

/**
 * Derive secondary/tertiary text colors and border from base colors.
 */
export function buildTokens(layout: {
  accent_color?: string;
  bg_color?: string;
  card_color?: string;
  text_color?: string;
  button_color?: string;
  button_text_color?: string;
}) {
  const text1 = layout?.text_color || "#1a1a1a";
  const bg = layout?.bg_color || "#f5f4f0";

  // Derive text2 (lighter) and text3 (even lighter) by mixing with white
  const hex2rgb = (hex: string) => {
    const h = hex.replace("#", "");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  };

  const rgb2hex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

  const mix = (color: string, white: number) => {
    const [r, g, b] = hex2rgb(parseColorToHex(color) || "#1a1a1a");
    return rgb2hex(
      r + (255 - r) * white,
      g + (255 - g) * white,
      b + (255 - b) * white
    );
  };

  const darken = (color: string, amount: number) => {
    const [r, g, b] = hex2rgb(parseColorToHex(color) || "#f5f4f0");
    return rgb2hex(
      Math.max(0, r - amount),
      Math.max(0, g - amount),
      Math.max(0, b - amount)
    );
  };

  const buttonColor = layout?.button_color || layout?.accent_color || "#D4E84B";
  const buttonTextColor = layout?.button_text_color || "#1a1a1a";

  const card = layout?.card_color || "#ffffff";

  return {
    bg: parseColorToHex(bg) || "#f5f4f0",
    card: parseColorToHex(card) || "#ffffff",
    accent: parseColorToHex(layout?.accent_color || "#D4E84B") || "#D4E84B",
    accentHover: darken(layout?.accent_color || "#D4E84B", 15),
    button: parseColorToHex(buttonColor) || "#D4E84B",
    buttonHover: darken(buttonColor, 15),
    buttonText: parseColorToHex(buttonTextColor) || "#1a1a1a",
    text1: parseColorToHex(text1) || "#1a1a1a",
    text2: mix(text1, 0.55),
    text3: mix(text1, 0.7),
    border: darken(bg, 10),
    cardBorder: darken(card, 18),
  };
}
