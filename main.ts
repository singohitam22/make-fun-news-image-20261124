// The World in One Day — 24 November 2026
// A one-page newspaper front page summing up 24 November 2026 world news.
// Drawn entirely in code: own PNG encoder (zlib deflate), own 5x8 bitmap
// font, flat pictograms. Node 22+ standard library only, no network.
// Deterministic: two runs produce byte-identical output.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join } from 'node:path';

const W = 1024;
const H = 1024;

// Palette — high contrast newspaper: black ink on warm cream paper.
const CREAM: [number, number, number] = [247, 241, 227];
const INK: [number, number, number] = [20, 20, 20];
const RED: [number, number, number] = [166, 30, 30];
const BLUE: [number, number, number] = [29, 78, 137];
const ORANGE: [number, number, number] = [217, 79, 4];
const YELLOW: [number, number, number] = [242, 183, 5];
const GREEN: [number, number, number] = [46, 125, 50];
const GRAY: [number, number, number] = [107, 107, 107];
const WHITE: [number, number, number] = [255, 255, 255];
const DARKBLUE: [number, number, number] = [18, 52, 96];

// ---- CRC32 (PNG chunk checksums) ----
const CRC_TABLE: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, 'ascii'), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

// Encode an RGB framebuffer as a PNG (colour type 2, filter 0 per row).
function encodePNG(rgb: Uint8Array, width: number, height: number): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    raw[y * (1 + width * 3)] = 0; // filter: none
    raw.set(rgb.subarray(y * width * 3, (y + 1) * width * 3), y * (1 + width * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---- 5x8 bitmap font ('#' = ink, '.' = empty). Uppercase, digits, punctuation. ----
type Glyph = string[];
const FONT: Record<string, Glyph> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#', '.....'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.', '.....'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####', '.....'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.', '.....'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####', '.....'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....', '.....'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.', '.....'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#', '.....'],
  I: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '#####', '.....'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..', '.....'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#', '.....'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####', '.....'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#', '.....'],
};

// ---- Font, continued: N-Z, digits, punctuation ----
Object.assign(FONT, {
  N: ['#...#', '##..#', '##..#', '#.#.#', '#..##', '#..##', '#...#', '.....'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.', '.....'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....', '.....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#', '.....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#', '.....'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.', '.....'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '.....'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.', '.....'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..', '.....'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#', '.....'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#', '.....'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..', '.....'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####', '.....'],
  '0': ['.###.', '#..##', '#.#.#', '##..#', '#...#', '#...#', '.###.', '.....'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.', '.....'],
  '2': ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####', '.....'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.', '.....'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.', '.....'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.', '.....'],
  '6': ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.', '.....'],
  '7': ['#####', '....#', '...#.', '...#.', '..#..', '..#..', '..#..', '.....'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.', '.....'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.', '.....'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..', '.#...'],
  '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....', '.....'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....', '.....'],
  ';': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.#...', '.....'],
  '/': ['....#', '...#.', '...#.', '..#..', '..#..', '.#...', '.#...', '#....'],
  $: ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..', '.....'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '#.#.#', '#..##', '.....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '...#.', '..#..', '.#...'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....', '.....'],
  '&': ['.###.', '#...#', '#...#', '.##..', '#.#.#', '#..#.', '.##.#', '.....'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..', '.....'],
  '|': ['..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....', '.....'],
  '•': ['.....', '.....', '.###.', '.###.', '.###.', '.....', '.....', '.....'],
});

// ---- Framebuffer ----
const fb = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  fb[i * 3] = CREAM[0];
  fb[i * 3 + 1] = CREAM[1];
  fb[i * 3 + 2] = CREAM[2];
}

function px(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  fb[i] = c[0];
  fb[i + 1] = c[1];
  fb[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) px(xx, yy, c);
}

function fillCircle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let yy = cy - r; yy <= cy + r; yy++) {
    const dy = yy - cy;
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    for (let xx = cx - dx; xx <= cx + dx; xx++) px(xx, yy, c);
  }
}

function fillEllipse(cx: number, cy: number, rx: number, ry: number, c: [number, number, number]): void {
  for (let yy = cy - ry; yy <= cy + ry; yy++) {
    const dy = yy - cy;
    const dx = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))));
    for (let xx = cx - dx; xx <= cx + dx; xx++) px(xx, yy, c);
  }
}

// Scanline polygon fill (flat shapes: flames, ship hull, sails).
function fillPoly(points: Array<[number, number]>, c: [number, number, number]): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of points) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % points.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) {
        xs.push(x1 + ((y - y1) * (x2 - x1)) / (y2 - y1));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) px(x, y, c);
    }
  }
}

function drawLine(x0: number, y0: number, x1: number, y1: number, c: [number, number, number]): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    px(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

// ---- Text ----
const CHAR_W = 6; // 5 glyph columns + 1 spacing column
const CHAR_H = 8;

function drawChar(x: number, y: number, ch: string, sx: number, sy: number, c: [number, number, number]): void {
  const g = FONT[ch] ?? FONT['?'];
  for (let r = 0; r < CHAR_H; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === '#') fillRect(x + col * sx, y + r * sy, sx, sy, c);
    }
  }
}

function textWidth(text: string, sx: number): number {
  return text.length * CHAR_W * sx - sx; // no trailing spacing after last char
}

function drawText(x: number, y: number, text: string, sx: number, sy: number, c: [number, number, number]): void {
  for (let i = 0; i < text.length; i++) {
    drawChar(x + i * CHAR_W * sx, y, text[i], sx, sy, c);
  }
}

function drawTextCentered(cx: number, y: number, text: string, sx: number, sy: number, c: [number, number, number]): void {
  drawText(cx - Math.floor(textWidth(text, sx) / 2), y, text, sx, sy, c);
}

// Greedy word wrap; returns the lines (never splits a word).
function wrapText(text: string, maxWidth: number, sx: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const trial = cur === '' ? w : cur + ' ' + w;
    if (textWidth(trial, sx) <= maxWidth || cur === '') {
      cur = trial;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

function drawWrapped(x: number, y: number, text: string, maxWidth: number, sx: number, sy: number, lineH: number, c: [number, number, number]): number {
  const lines = wrapText(text, maxWidth, sx);
  lines.forEach((line, i) => drawText(x, y + i * lineH, line, sx, sy, c));
  return lines.length;
}

// ---- Flat pictograms (64x64 boxes) ----
// Flame: orange outer flame, yellow core, dark base line.
function drawFlame(x: number, y: number, s: number): void {
  const u = s / 64;
  fillPoly(
    [
      [x + 32 * u, y + 4 * u],
      [x + 46 * u, y + 22 * u],
      [x + 52 * u, y + 38 * u],
      [x + 44 * u, y + 56 * u],
      [x + 20 * u, y + 56 * u],
      [x + 12 * u, y + 38 * u],
      [x + 18 * u, y + 22 * u],
    ],
    ORANGE,
  );
  fillPoly(
    [
      [x + 32 * u, y + 24 * u],
      [x + 40 * u, y + 34 * u],
      [x + 42 * u, y + 46 * u],
      [x + 32 * u, y + 54 * u],
      [x + 22 * u, y + 46 * u],
      [x + 24 * u, y + 34 * u],
    ],
    YELLOW,
  );
  fillRect(Math.round(x + 10 * u), Math.round(y + 58 * u), Math.round(44 * u), Math.round(4 * u), INK);
}

// Warship: dark hull, mast, sail, blue waves.
function drawShip(x: number, y: number, s: number): void {
  const u = s / 64;
  fillRect(Math.round(x + 30 * u), Math.round(y + 8 * u), Math.round(3 * u), Math.round(26 * u), INK);
  fillPoly(
    [
      [x + 33 * u, y + 10 * u],
      [x + 50 * u, y + 30 * u],
      [x + 33 * u, y + 30 * u],
    ],
    RED,
  );
  fillPoly(
    [
      [x + 6 * u, y + 34 * u],
      [x + 58 * u, y + 34 * u],
      [x + 52 * u, y + 48 * u],
      [x + 12 * u, y + 48 * u],
    ],
    DARKBLUE,
  );
  fillRect(Math.round(x + 20 * u), Math.round(y + 26 * u), Math.round(24 * u), Math.round(8 * u), INK);
  for (let i = 0; i < 3; i++) {
    fillEllipse(
      Math.round(x + (14 + i * 18) * u),
      Math.round(y + 54 * u),
      Math.round(9 * u),
      Math.round(3 * u),
      BLUE,
    );
  }
}

// Globe: blue disc, green land blobs, white meridian lines.
function drawGlobe(x: number, y: number, s: number): void {
  const u = s / 64;
  fillCircle(Math.round(x + 32 * u), Math.round(y + 32 * u), Math.round(28 * u), BLUE);
  fillEllipse(Math.round(x + 24 * u), Math.round(y + 22 * u), Math.round(10 * u), Math.round(7 * u), GREEN);
  fillEllipse(Math.round(x + 42 * u), Math.round(y + 40 * u), Math.round(9 * u), Math.round(8 * u), GREEN);
  fillEllipse(Math.round(x + 20 * u), Math.round(y + 44 * u), Math.round(6 * u), Math.round(5 * u), GREEN);
  drawLine(Math.round(x + 32 * u), Math.round(y + 5 * u), Math.round(x + 32 * u), Math.round(y + 59 * u), WHITE);
  drawLine(Math.round(x + 5 * u), Math.round(y + 32 * u), Math.round(x + 59 * u), Math.round(y + 32 * u), WHITE);
}

// Train: red body, white windows, dark wheels, track lines.
function drawTrain(x: number, y: number, s: number): void {
  const u = s / 64;
  fillRect(Math.round(x + 6 * u), Math.round(y + 12 * u), Math.round(52 * u), Math.round(32 * u), RED);
  fillPoly(
    [
      [x + 58 * u, y + 12 * u],
      [x + 58 * u, y + 44 * u],
      [x + 50 * u, y + 44 * u],
      [x + 50 * u, y + 20 * u],
    ],
    RED,
  );
  for (let i = 0; i < 3; i++) {
    fillRect(Math.round(x + (12 + i * 14) * u), Math.round(y + 18 * u), Math.round(9 * u), Math.round(9 * u), WHITE);
  }
  fillRect(Math.round(x + 4 * u), Math.round(y + 52 * u), Math.round(56 * u), Math.round(3 * u), INK);
  fillRect(Math.round(x + 4 * u), Math.round(y + 58 * u), Math.round(56 * u), Math.round(3 * u), INK);
  fillCircle(Math.round(x + 18 * u), Math.round(y + 46 * u), Math.round(5 * u), INK);
  fillCircle(Math.round(x + 46 * u), Math.round(y + 46 * u), Math.round(5 * u), INK);
}

// ---- Page layout: one-page newspaper ----
// Vertical rhythm (all sizes in px; glyph height = 8 * sy):
//   masthead sy=9 (72px) | date sy=5 (40px) | lead sy=8 (64px, 2 lines)
//   subhead sy=3 (24px, 2 lines) | panels 2x2, title sy=5 (40px),
//   body sy=3 (24px) | ALSO strip sy=3 (24px).
function drawPage(): void {
  const MX = 28; // side margin
  const CW = W - MX * 2; // content width = 968
  let y = 10;

  // Masthead — 17 chars at sx=10: 17*60-10 = 1010px wide, centred.
  drawTextCentered(W / 2, y, 'THE GLOBAL HERALD', 10, 9, INK);
  y += 72;
  fillRect(MX, y + 4, CW, 4, RED);
  y += 12;

  // Dateline — big and clear.
  drawTextCentered(W / 2, y, 'TUESDAY 24 NOVEMBER 2026', 5, 5, INK);
  y += 40;
  fillRect(MX, y + 4, CW, 3, INK);
  y += 11;

  // Lead headline — two lines at 64px tall, centred.
  drawTextCentered(W / 2, y, 'CANDY FACTORY FIRE', 9, 8, INK);
  y += 64;
  drawTextCentered(W / 2, y, 'KILLS AT LEAST 24', 9, 8, INK);
  y += 64;

  // Lead subhead — wraps to two lines at 24px.
  y += 5;
  const subLines = drawWrapped(MX, y, 'RESCUERS SEARCH FOR AROUND 30 MISSING AFTER BLAZE AT PLANT IN BANTEN PROVINCE, INDONESIA.', CW, 3, 3, 25, INK);
  y += subLines * 25;
  fillRect(MX, y + 4, CW, 3, INK);
  y += 11;

  // Four panels, 2x2.
  const panels: Array<{ title: string; body: string; icon: (x: number, y: number, s: number) => void }> = [
    {
      title: 'KYIV-REGION STRIKE KILLS 11',
      body: 'RUSSIAN DRONE AND MISSILE STRIKES HIT AN APARTMENT BLOCK IN DYMER.',
      icon: drawFlame,
    },
    {
      title: 'UKRAINE SINKS RUSSIAN WARSHIP OFF LIBYA',
      body: 'KYIV SAYS IT STRUCK TWO RUSSIAN VESSELS OFF BENGHAZI.',
      icon: drawShip,
    },
    {
      title: 'COP31 TALKS COLLAPSE WITHOUT DEAL',
      body: 'ANTALYA CLIMATE SUMMIT ENDS WITH NO AGREEMENT ON FOSSIL FUELS.',
      icon: drawGlobe,
    },
    {
      title: 'MODI AND SHAH FLAG OFF TRAIN',
      body: 'AYODHYA-JANAKPUR SARYU-KAMALA EXPRESS; EIGHT MOUS SIGNED.',
      icon: drawTrain,
    },
  ];
  const PW = Math.floor((CW - 12) / 2); // panel width = 478
  const PH = 253; // panel height (fixed grid)
  const PX = [MX, MX + PW + 12];
  const PY = [y, y + PH + 12];
  for (let i = 0; i < 4; i++) {
    const px0 = PX[i % 2];
    const py0 = PY[Math.floor(i / 2)];
    const p = panels[i];
    fillRect(px0, py0, PW, 2, INK); // panel top rule
    const inner = px0 + 12;
    const innerW = PW - 24;
    // Title at 40px tall (sx=4, sy=5), up to 3 lines.
    const titleLines = wrapText(p.title, innerW, 4);
    titleLines.forEach((line, li) => drawText(inner, py0 + 12 + li * 41, line, 4, 5, INK));
    const bodyY = py0 + 12 + titleLines.length * 41 + 8;
    // Pictogram 64x64 at left, body text to its right at 24px.
    p.icon(inner, bodyY, 64);
    drawWrapped(inner + 74, bodyY + 4, p.body, innerW - 74, 3, 3, 25, INK);
  }
  y = PY[1] + PH;

  // ALSO strip — label + six short items as one flowing paragraph.
  y += 8;
  fillRect(MX, y, CW, 3, RED);
  y += 8;
  drawText(MX, y, 'ALSO IN THE NEWS', 4, 4, RED);
  y += 32;
  const also =
    'WALL STREET SELLS OFF $1 TRILLION • TRUMP BLAMES DEMOCRATS FOR SLIDE • ' +
    'VERSTAPPEN WINS LAS VEGAS GRAND PRIX • ALCARAZ TAKES ATP FINALS TITLE • ' +
    'INDIA-NZ TEST DRAWN, PANT 128 • CHESS TITLE FIGHT BEGINS IN GENEVA';
  const alsoLines = drawWrapped(MX, y, also, CW, 3, 3, 25, INK);
  y += alsoLines * 25;
  if (y > H - 8) throw new Error(`page overflow: content ends at y=${y}`);
}

function main(): void {
  drawPage();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
  mkdirSync(outDir, { recursive: true });
  const png = encodePNG(fb, W, H);
  writeFileSync(join(outDir, 'entry.png'), png);
}

main();
