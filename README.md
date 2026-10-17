# Golden Frame

Phone-first changeover gate for the Google Cloud AI Builder Cup (Manufacturing).

**Do not start the line until today’s setup looks like the last good run.**

The operator shoots five frames on a phone. Gemini reads the photos (including printed SKU text). A rule table decides **HOLD** or **CLEAR**. A human still taps the gate. The model never starts a machine.

---

## Why this is not a chatbot

| Piece | Who decides |
|---|---|
| Vision + OCR | Gemini |
| Wrong SKU / open guard | Risk table (rules beat model prose) |
| Start / no-start | Supervisor or operator on the phone |

Same engine, two plants: **Line 3 Packaging (A-17)** and **Cell 2 Electronics (BRD-440)**.

---

## Setup

Needs **Node 20+**.

```bash
cd google-hackathon
npm install
cp .env.example .env.local
```

`.env.local`:

```
GEMINI_API_KEY=your_key          # only for Live engine
GEMINI_MODEL=gemini-3.8-flash
NEXT_PUBLIC_DEFAULT_ENGINE=practice
```

```bash
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your **phone** (same Wi‑Fi):

```text
http://YOUR_LAPTOP_IP:3000
```

Chrome / Safari → **Allow camera**. Or **Upload instead**.

Add to Home Screen for a full-screen demo.

### Engines

- **Practice** — no API key. First check HOLDs (wrong label + open guard). After **Recheck**, it CLEARs. Use this to rehearse the video.
- **Live Gemini** — reads the real photos. Print `A-17 BLUE` and `A-22 GREEN` large. Live needs `GEMINI_API_KEY`.

---

## Demo on a phone (3 minutes)

1. Table kit: bottle nest, two paper labels (`A-17 BLUE` / `A-22 GREEN`), cardboard guard.
2. Home → Operator → Line 3 → **Start changeover check**.
3. Snap all five slots (wrong label + guard open).
4. **Check setup** → HOLD. Show must-fix + rupee hold vs escape.
5. Fix the label and close the guard. **Recheck** those slots → CLEAR.
6. Optional: switch to Cell 2 to show the same gate on electronics.

Screen-record the phone. Film the table for cutaways.

---

## Tests

```bash
npm test
```

Covered:

- SKU / OCR matching (`A-17` vs `A-22`, `BRD-440`)
- Risk table: mismatch, open guard, messy hopper, blur retake, missing slots
- Gate: HOLD / CLEAR / retake
- Practice inspection path + impact math
- Gemini JSON normalization
- Decision card copy
- Catalog (two industries, five slots)
- EN / HI strings

Live Gemini is not called in CI.

---

## Deploy (Cup: Cloud Run)

Step-by-step Google Cloud setup: [`docs/GCP_SETUP.md`](docs/GCP_SETUP.md).

```bash
# Needs: brew install --cask google-cloud-sdk && gcloud init
# GEMINI_API_KEY in .env.local
npm run deploy:cloudrun
```

Or manually with the `Dockerfile` (port **8080**). Build runs in Cloud Build — local Docker not required.

---

## Product map

```
src/lib/rules.ts        Risk table (must-fix / warn / retake)
src/lib/gate.ts         HOLD vs CLEAR
src/lib/inspection.ts   Practice or Gemini, then rules
src/app/api/inspect     Cloud-ready inspect API
src/app/*               Phone screens
```

Theme: **Manufacturing — Intelligent Operations & Industrial Efficiency**.
