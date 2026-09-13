import type { Album, SlotId, SlotSpec } from "./types";

const PACKAGING_SLOTS: SlotSpec[] = [
  {
    id: "jig",
    titleEn: "Jig",
    titleHi: "जिग",
    hintEn: "Bottle seated straight in the nest. Same angle as the golden.",
    hintHi: "बोतल नेस्ट में सीधी हो। गोल्डन जैसा कोण।",
    sopLine: "Confirm container is fully seated in the approved nest before start.",
  },
  {
    id: "label",
    titleEn: "Label roll",
    titleHi: "लेबल रोल",
    hintEn: "Fill the frame with the printed SKU. Letters must be readable.",
    hintHi: "छपा SKU फ्रेम में साफ़ दिखे।",
    sopLine: "Verify label SKU and artwork match the active work order before start.",
  },
  {
    id: "guard",
    titleEn: "Guard",
    titleHi: "गार्ड",
    hintEn: "Safety flap closed and latch visible.",
    hintHi: "सेफ्टी फ्लैप बंद, लैच दिखे।",
    sopLine: "Interlocked guard must be closed. Do not start with an open guard.",
  },
  {
    id: "hopper",
    titleEn: "Hopper",
    titleHi: "हॉपर",
    hintEn: "Correct material only. No leftover from the last SKU.",
    hintHi: "सही सामग्री। पिछली SKU की सामग्री न हो।",
    sopLine: "Hopper contains only the material specified on the work order.",
  },
  {
    id: "first_piece",
    titleEn: "First piece",
    titleHi: "पहला पीस",
    hintEn: "Finished sample, label facing camera, no scratch or smear.",
    hintHi: "तैयार सैंपल, लेबल कैमरे की ओर, खरोंच नहीं।",
    sopLine: "First-piece must be free of visible defect before the line is released.",
  },
];

const ELECTRONICS_SLOTS: SlotSpec[] = [
  {
    id: "jig",
    titleEn: "Fixture",
    titleHi: "फिक्स्चर",
    hintEn: "Board seated, locators engaged, no lift at the corners.",
    hintHi: "बोर्ड बैठा हो, कॉर्नर उठे न हों।",
    sopLine: "Board must be fully seated on the approved fixture before cycle start.",
  },
  {
    id: "label",
    titleEn: "Traveler / SKU",
    titleHi: "ट्रैवलर / SKU",
    hintEn: "Traveler card or bag label filling the frame. SKU readable.",
    hintHi: "ट्रैवलर कार्ड का SKU साफ़ दिखे।",
    sopLine: "Verify traveler SKU matches the released work order.",
  },
  {
    id: "guard",
    titleEn: "ESD / cover",
    titleHi: "ESD / कवर",
    hintEn: "Wrist strap docked or cover closed — same as golden.",
    hintHi: "स्ट्रैप लगा या कवर बंद — गोल्डन जैसा।",
    sopLine: "ESD cover or strap interlock must be in the safe position.",
  },
  {
    id: "hopper",
    titleEn: "Parts bin",
    titleHi: "पार्ट्स बिन",
    hintEn: "Correct reel / bin ID for this board. No mixed lots.",
    hintHi: "इसी बोर्ड का बिन। मिला-जुला लॉट नहीं।",
    sopLine: "Only the kit listed on the work order may be staged at the cell.",
  },
  {
    id: "first_piece",
    titleEn: "First board",
    titleHi: "पहला बोर्ड",
    hintEn: "First completed board, silkscreen readable, no tombstone or scratch.",
    hintHi: "पहला बोर्ड, स्क्रैच या टेढ़ा पार्ट नहीं।",
    sopLine: "First-article board must pass visual inspection before release.",
  },
];

const DESK_SLOTS: SlotSpec[] = [
  {
    id: "jig",
    titleEn: "Laptop on desk",
    titleHi: "लैपटॉप डेस्क पर",
    hintEn: "Laptop sitting flat on the desk, same place as the golden.",
    hintHi: "लैपटॉप डेस्क पर सीधा हो, गोल्डन जैसी जगह।",
    sopLine: "Laptop must be seated on the desk before charging starts.",
  },
  {
    id: "label",
    titleEn: "Charger sticker",
    titleHi: "चार्जर स्टिकर",
    hintEn: "Paper on the charger brick. Letters A-17 must be readable.",
    hintHi: "चार्जर पर A-17 साफ़ दिखे।",
    sopLine: "Charger sticker must match the work order SKU.",
  },
  {
    id: "guard",
    titleEn: "Lid closed",
    titleHi: "ढक्कन बंद",
    hintEn: "Laptop lid shut (like a machine cover / guard).",
    hintHi: "लैपटॉप का ढक्कन बंद हो।",
    sopLine: "Lid must be closed. Do not leave it open.",
  },
  {
    id: "hopper",
    titleEn: "Cable plugged in",
    titleHi: "केबल लगी हो",
    hintEn: "USB-C / MagSafe in the laptop. Cable not hanging loose.",
    hintHi: "केबल लैपटॉप में लगी हो।",
    sopLine: "Charge cable must be plugged into the laptop.",
  },
  {
    id: "first_piece",
    titleEn: "Charging light",
    titleHi: "चार्जिंग लाइट",
    hintEn: "LED or battery icon showing it is charging.",
    hintHi: "चार्ज हो रहा हो, लाइट या आइकन दिखे।",
    sopLine: "Charging indicator must be on before you walk away.",
  },
];

export const ALBUMS: Album[] = [
  {
    id: "desk-charge",
    industry: "desk",
    plantName: "Home desk",
    lineName: "Desk · Laptop charging",
    sku: "A-17",
    skuName: "My charger",
    workOrder: "WO-CHARGE",
    goldenDir: "/goldens/desk-charge",
    hourlyOverheadInr: 800,
    unitMarginInr: 0,
    scrapUnitsIfEscape: 0,
    recallReserveInr: 2500,
    holdMinutes: 15,
    slots: DESK_SLOTS,
  },
  {
    id: "line3-a17",
    industry: "packaging",
    plantName: "Harborworks",
    lineName: "Line 3 · Packaging",
    sku: "A-17",
    skuName: "Blue 500ml",
    workOrder: "WO-8841",
    goldenDir: "/goldens/line3-a17",
    hourlyOverheadInr: 25000,
    unitMarginInr: 18,
    scrapUnitsIfEscape: 200,
    recallReserveInr: 180000,
    holdMinutes: 8,
    slots: PACKAGING_SLOTS,
  },
  {
    id: "cell2-brd440",
    industry: "electronics",
    plantName: "Harborworks",
    lineName: "Cell 2 · Electronics",
    sku: "BRD-440",
    skuName: "Power board",
    workOrder: "WO-2207",
    goldenDir: "/goldens/cell2-brd440",
    hourlyOverheadInr: 32000,
    unitMarginInr: 140,
    scrapUnitsIfEscape: 40,
    recallReserveInr: 95000,
    holdMinutes: 12,
    slots: ELECTRONICS_SLOTS,
  },
];

export const SLOT_ORDER: SlotId[] = [
  "jig",
  "label",
  "guard",
  "hopper",
  "first_piece",
];

export function getAlbum(id: string): Album | undefined {
  return ALBUMS.find((album) => album.id === id);
}

export function requireAlbum(id: string): Album {
  const album = getAlbum(id);
  if (!album) {
    throw new Error(`Unknown album: ${id}`);
  }
  return album;
}

export function getSlot(album: Album, slotId: SlotId): SlotSpec {
  const slot = album.slots.find((item) => item.id === slotId);
  if (!slot) {
    throw new Error(`Unknown slot ${slotId} on ${album.id}`);
  }
  return slot;
}

export function goldenPath(album: Album, slotId: SlotId): string {
  return `${album.goldenDir}/${slotId}.svg`;
}
