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
  
  // Render at 16x16 for a 'true 16x16' retro pixel art aesthetic.
  canvas.width = 16;
  canvas.height = 16;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  ctx.clearRect(0, 0, 16, 16);
  
  // Use optimal native emoji fonts depending on the OS
  // A 13px font on 16x16 canvas gives us a nice border-less fill
  ctx.font = '13px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Draw emoji in the center of the 16x16 canvas
  ctx.fillText(unicode, 8, 9);

  // Threshold the alpha channel to remove anti-aliasing blur and get clean pixel edges
  const imgData = ctx.getImageData(0, 0, 16, 16);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) {
      data[i + 3] = 0;
    } else {
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const dataUrl = canvas.toDataURL('image/png');
  
  cache.set(unicode, dataUrl);
  return dataUrl;
}
