import emojiRegex from 'emoji-regex';
import { getPixelatedEmoji } from './pixelEmojiRenderer';

// Finds all standard Unicode emojis in a text string and replaces them
// with our dynamic HTML Canvas-generated pixelated sprites.
export function parseEmojisToHtml(text: string): string {
  if (!text) return '';

  const regex = emojiRegex();
  
  return text.replace(regex, (match) => {
    const src = getPixelatedEmoji(match);
    // If we're on the server during SSR, or canvas fails, fallback gracefully to the native character
    if (!src) return match;
    
    return `<span class="pixel-emoji-wrapper" title="${match}"><img src="${src}" alt="${match}" class="pixel-emoji" /></span>`;
  });
}
