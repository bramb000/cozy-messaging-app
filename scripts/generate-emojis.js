const fs = require('fs');
const path = require('path');

const EMOJI_DIR = path.join(__dirname, '../public/emojis');

if (!fs.existsSync(EMOJI_DIR)) {
  fs.mkdirSync(EMOJI_DIR, { recursive: true });
}

// A highly simplified pixel-art definition for a few common emojis.
// Each string array represents a 16x16 grid.
const pixelData = {
  // 😀 Grinning Face
  '1f600': {
    unicode: '😀',
    grid: [
      "      YYYY      ",
      "    YYYYYYYY    ",
      "   YYYYYYYYYY   ",
      "  YYYYYYYYYYYY  ",
      "  YY KK Y KK YY ",
      " YYY KK Y KK YYY",
      " YYYYYYYYYYYYYYY",
      " YYY       YYYYY",
      " YYY KKKKKK YYYY",
      " YYYY KKKK YYYYY",
      "  YYYYYYYYYYYY  ",
      "  YYYYYYYYYYYY  ",
      "   YYYYYYYYYY   ",
      "    YYYYYYYY    ",
      "      YYYY      ",
      "                "
    ],
    colors: { Y: '#FFCC4D', K: '#664500' }
  },
  // ❤️ Red Heart
  '2764': {
    unicode: '❤️',
    grid: [
      "                ",
      "  RRRR    RRRR  ",
      " RRRRRR  RRRRRR ",
      "RRRRRRRRRRRRRRRR",
      "RRRRRRRRRRRRRRRR",
      "RRRRRRRRRRRRRRRR",
      " RRRRRRRRRRRRRR ",
      "  RRRRRRRRRRRR  ",
      "   RRRRRRRRRR   ",
      "    RRRRRRRR    ",
      "     RRRRRR     ",
      "      RRRR      ",
      "       RR       ",
      "                ",
      "                ",
      "                "
    ],
    colors: { R: '#DD2E44' }
  },
  // 🚀 Rocket
  '1f680': {
    unicode: '🚀',
    grid: [
      "             RR ",
      "            RRR ",
      "           RRR  ",
      "          RRR   ",
      "         RRRR   ",
      "       WWWWWW   ",
      "      WWWWWWWW  ",
      "     WWWWWWWWW  ",
      "    WWWWWWWWWW  ",
      "   WWWWWWWWWWW  ",
      " RRWWWWWWWWW    ",
      "RRRRWWWWWW      ",
      "RRRRR           ",
      " OOO            ",
      " Y              ",
      "                "
    ],
    colors: { R: '#DD2E44', W: '#E6E7E8', O: '#FFAC33', Y: '#FFCC4D' }
  },
  // 👍 Thumbs Up
  '1f44d': {
    unicode: '👍',
    grid: [
      "                ",
      "       YYY      ",
      "      YYYY      ",
      "      YYYY      ",
      "      YYYY      ",
      "     YYYYYYY    ",
      "  YYYYYYYYYYYYY ",
      "  YYYYYYYYYYYYY ",
      "  YYYYYYYYYYYYY ",
      "  YYYYYYYYYYYYY ",
      "  YYYYYYYYYYYYY ",
      "   YYYYYYYYYYYY ",
      "    YYYYYYYYY   ",
      "                ",
      "                ",
      "                "
    ],
    colors: { Y: '#FFCC4D' }
  },
  // 💀 Skull
  '1f480': {
    unicode: '💀',
    grid: [
      "                ",
      "     WWWWWW     ",
      "   WWWWWWWWWW   ",
      "  WWWWWWWWWWWW  ",
      "  W KK WW KK W  ",
      "  W KK WW KK W  ",
      "  WWWWWWWWWWWW  ",
      "   WW KKKK WW   ",
      "    WWWWWWWW    ",
      "    W W W W     ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                ",
      "                "
    ],
    colors: { W: '#E6E7E8', K: '#292F33' }
  },
  // 🌱 Seedling
  '1f331': {
    unicode: '🌱',
    grid: [
      "                ",
      "          GG    ",
      "         GGGG   ",
      "        GGGGG   ",
      "       GGGGGG   ",
      "      GGGGG     ",
      "   GG GGG       ",
      "  GGGGGG        ",
      "  GGGGG         ",
      "  GGGG          ",
      "   GG D         ",
      "      D         ",
      "    DDDDD       ",
      "  DDDDDDDDD     ",
      "                ",
      "                "
    ],
    colors: { G: '#77B255', D: '#C1694F' }
  },
  // ✨ Sparkles
  '2728': {
    unicode: '✨',
    grid: [
      "    Y           ",
      "   YYY      Y   ",
      "  YYYYY    YYY  ",
      " YYYYYYY  YYYYY ",
      "  YYYYY    YYY  ",
      "   YYY      Y   ",
      "    Y           ",
      "                ",
      "          Y     ",
      "         YYY    ",
      "        YYYYY   ",
      "       YYYYYYY  ",
      "        YYYYY   ",
      "         YYY    ",
      "          Y     ",
      "                "
    ],
    colors: { Y: '#FFCC4D' }
  },
  // 💬 Speech Balloon
  '1f4ac': {
    unicode: '💬',
    grid: [
      "                ",
      "  WWWWWWWWWWWW  ",
      " WWWWWWWWWWWWWW ",
      " WWWWWWWWWWWWWW ",
      " WWWWWWWWWWWWWW ",
      " WWWWWWWWWWWWWW ",
      " WWWWWWWWWWWWWW ",
      " WWWWWWWWWWWWWW ",
      " WWWWWWWWWWWWWW ",
      "  WWWWWWWWWWWW  ",
      "   WWW          ",
      "  WW            ",
      " W              ",
      "                ",
      "                ",
      "                "
    ],
    colors: { W: '#FFFFFF' }
  }
};

const mapJson = {};

Object.entries(pixelData).forEach(([hex, data]) => {
  const { unicode, grid, colors } = data;
  mapJson[unicode] = `/emojis/${hex}.svg`;

  let rects = '';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const char = grid[y][x];
      if (char !== ' ') {
        const color = colors[char] || '#000000';
        rects += `  <rect x="${x}" y="${y}" width="1" height="1" fill="${color}" />\n`;
      }
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">\n${rects}</svg>`;
  fs.writeFileSync(path.join(EMOJI_DIR, `${hex}.svg`), svg);
});

fs.writeFileSync(
  path.join(__dirname, '../src/utils/emojiMap.json'),
  JSON.stringify(mapJson, null, 2)
);

console.log('✅ Generated pixel SVG emojis and mapping.');
