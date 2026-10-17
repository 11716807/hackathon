# Google Cloud setup — one service at a time

Order: **Cloud Run → Firestore → Cloud Storage → Document AI**.

## 0. One-time machine setup

```bash
brew install --cask google-cloud-sdk
# Restart terminal, then:
gcloud init
# Sign in, pick or create a project, set default region asia-south1
```

Billing must be enabled on the project (Cloud Run + Document AI need it).

## 1. Cloud Run (now)

```bash
# From repo root, with GEMINI_API_KEY in .env.local:
chmod +x scripts/deploy-cloudrun.sh
./scripts/deploy-cloudrun.sh
```

Or manually:

```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
export GEMINI_API_KEY=...   # from .env.local
gcloud run deploy golden-frame \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY,GEMINI_MODEL=gemini-3.8-flash,NEXT_PUBLIC_DEFAULT_ENGINE=live
```

Open the printed **Service URL** on your phone. Health check: `GET /api/health`.

## 2. Firestore (done when ` /api/health` shows `"firestore":"ok"`)

```bash
gcloud services enable firestore.googleapis.com --project=YOUR_PROJECT_ID
gcloud firestore databases create --location=asia-south1 --type=firestore-native
# Cloud Run SA needs:
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/datastore.user"
```

App collections: `lines/{id}`, `audit/{id}`.  
APIs: `GET/PUT /api/lines`, `GET/POST /api/audit`.  
Taught golden **photos** stay local until Cloud Storage (step 3).

## 3. Cloud Storage

```bash
BUCKET=gf-PROJECT_NUMBER
gcloud storage buckets create gs://$BUCKET --location=asia-south1 --uniform-bucket-level-access
# Keep private. App serves via /api/media (no public allUsers).
# Captures auto-delete after 30 days (lifecycle on captures/ prefix).
```

Env: `GCS_BUCKET=gf-…`  
Paths: `goldens/{albumId}/{slot}.jpg`, `captures/{albumId}/{batch}/{slot}.jpg`  
APIs: `PUT/GET/DELETE /api/goldens`, `POST /api/captures`, `GET /api/media`

## 4. Document AI

```bash
gcloud services enable documentai.googleapis.com --project=YOUR_PROJECT_ID

# Create OCR processor (us multi-region — widest availability)
TOKEN=$(gcloud auth print-access-token)
curl -sS -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  "https://us-documentai.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us/processors" \
  -d '{"displayName":"golden-frame-label-ocr","type":"OCR_PROCESSOR"}'

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/documentai.apiUser"
```

Env: `DOCUMENT_AI_PROCESSOR=<id>` and `DOCUMENT_AI_LOCATION=us`  

On inspect: Gemini does look-alike/flags; Document AI OCR overrides label `extractedText` when it returns text; otherwise Gemini OCR is kept. SKU rules unchanged.  
Health: `"documentai":"ok"`.

## Cost note

Stay on free / low tier for the Cup: Cloud Run scale-to-zero, small Storage, few Document AI pages.
