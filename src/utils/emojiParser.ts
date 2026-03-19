import emojiMap from './emojiMap.json';

// Simple regex to match the emojis we generated.
// We can use a more comprehensive unicode regex, but since we only have a limited set of SVGs in this demo,
// we will match anything in our map.
export function parseEmojisToHtml(text: string): string {
  if (!text) return '';

  return text.split(/(?:)/u).reduce((acc, char) => {
    // Check if the character is in our map
    if (emojiMap[char as keyof typeof emojiMap]) {
      const src = emojiMap[char as keyof typeof emojiMap];
      // Note: Wrapping in an inline-block span keeps it inline with text but handles styling well.
      // We set the real character as a visually hidden sr-only text or alt attribute,
      // but keeping it as the image's `alt` is best for copy-paste on modern browsers.
      return acc + `<span class="pixel-emoji-wrapper" title="${char}"><img src="${src}" alt="${char}" class="pixel-emoji" /></span>`;
    }
    return acc + char;
  }, '');
}
