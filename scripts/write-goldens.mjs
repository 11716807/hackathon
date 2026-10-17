import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const albums = [
  {
    dir: "public/goldens/line3-a17",
    sku: "A-17 BLUE",
    accent: "#8b5cf6",
    labels: {
      jig: ["JIG", "NEST SEATED"],
      label: ["LABEL ROLL", "A-17 BLUE"],
      guard: ["GUARD", "CLOSED"],
      hopper: ["HOPPER", "A-17 RESIN"],
      first_piece: ["FIRST PIECE", "A-17 PASS"],
    },
  },
  {
    dir: "public/goldens/cell2-brd440",
    sku: "BRD-440",
    accent: "#c084fc",
    labels: {
      jig: ["FIXTURE", "SEATED"],
      label: ["TRAVELER", "BRD-440"],
      guard: ["ESD COVER", "SAFE"],
      hopper: ["KIT BIN", "BRD-440"],
      first_piece: ["FIRST BOARD", "VISUAL OK"],
    },
  },
];

function svg(title, code, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#12151c"/>
      <stop offset="1" stop-color="#0b0d12"/>
    </linearGradient>
  </defs>
  <rect width="640" height="480" fill="url(#g)"/>
  <rect x="28" y="28" width="584" height="424" rx="18" fill="none" stroke="#b794f6" stroke-width="4"/>
  <rect x="72" y="96" width="496" height="220" rx="14" fill="#2a2040"/>
  <rect x="92" y="116" width="200" height="180" rx="10" fill="${accent}" opacity="0.85"/>
  <rect x="312" y="128" width="232" height="28" fill="#b794f6" opacity="0.25"/>
  <rect x="312" y="172" width="180" height="14" fill="#b7a8d4" opacity="0.35"/>
  <rect x="312" y="198" width="210" height="14" fill="#b7a8d4" opacity="0.2"/>
  <text x="320" y="360" fill="#b794f6" font-family="ui-monospace, monospace" font-size="22" letter-spacing="6">${title}</text>
  <text x="320" y="400" fill="#f4f4f5" font-family="ui-monospace, monospace" font-size="36">${code}</text>
</svg>
`;
}

for (const album of albums) {
  for (const [slot, [title, code]] of Object.entries(album.labels)) {
    const file = join(album.dir, `${slot}.svg`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, svg(title, code, album.accent));
  }
}

console.log("Wrote golden frames");
