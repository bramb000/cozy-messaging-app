// A client-side cache for pixelated emojis
const cache = new Map<string, string>();

/**
 * Renders a standard Unicode emoji onto a small canvas and returns a base64 PNG data URL.
 * When this low-resolution PNG is scaled up using CSS 'image-rendering: pixelated',
 * it results in a fast, dynamic 64-bit retro aesthetic for ANY OS emoji!
 */
export function getPixelatedEmoji(unicode: string): string {
  // Prevent execution during SSR
  if (typeof document === 'undefined') return '';

  if (cache.has(unicode)) {
    return cache.get(unicode)!;
  }

  const canvas = document.createElement('canvas');
  
  // Render at 64x64 for a cleaner, higher-fidelity '64-bit' retro look
  canvas.width = 64;
  canvas.height = 64;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.clearRect(0, 0, 64, 64);
  
  // Use optimal native emoji fonts depending on the OS
  ctx.font = '54px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw emoji in the center. A slight vertical offset usually aligns emojis better cross-platform.
  ctx.fillText(unicode, 32, 36);

  // Generate a PNG data URL
  const dataUrl = canvas.toDataURL('image/png');
  
  // Cache it so we only ever render each emoji once per session
  cache.set(unicode, dataUrl);
  return dataUrl;
}
