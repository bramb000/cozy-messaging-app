// A client-side cache for pixelated emojis
const cache = new Map<string, string>();

/**
 * Renders a standard Unicode emoji onto a small canvas and returns a base64 PNG data URL.
 * When this low-resolution PNG is scaled up using CSS 'image-rendering: pixelated',
 * it results in a fast, dynamic 32-bit pixel art aesthetic for ANY OS emoji!
 */
export function getPixelatedEmoji(unicode: string): string {
  // Prevent execution during SSR
  if (typeof document === 'undefined') return '';

  if (cache.has(unicode)) {
    return cache.get(unicode)!;
  }

  const canvas = document.createElement('canvas');
  
  // Render at 32x32 for a 'true 32x32' pixel art aesthetic. Blockier and more retro.
  canvas.width = 32;
  canvas.height = 32;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.clearRect(0, 0, 32, 32);
  
  // Use optimal native emoji fonts depending on the OS
  // A 27px font on 32px canvas gives us a nice border-less fill
  ctx.font = '27px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw emoji in the center of the 32x32 canvas
  ctx.fillText(unicode, 16, 18);

  const dataUrl = canvas.toDataURL('image/png');
  
  cache.set(unicode, dataUrl);
  return dataUrl;
}
