#!/usr/bin/env bash
# Deploy Golden Frame to Cloud Run (build happens in Google Cloud Build).
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE="${CLOUD_RUN_SERVICE:-golden-frame}"

if [[ -z "${PROJECT_ID}" || "${PROJECT_ID}" == "(unset)" ]]; then
  echo "Set a project first:"
  echo "  gcloud config set project YOUR_PROJECT_ID"
  echo "Or: GCP_PROJECT_ID=your-id ./scripts/deploy-cloudrun.sh"
  exit 1
fi

# Always load .env.local so Storage / Document AI vars are present even when
# GEMINI_API_KEY is already exported in the shell.
if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env.local
  set +a
fi

if [[ -z "${GEMINI_API_KEY:-}" ]]; then
  echo "GEMINI_API_KEY is required (export it or put it in .env.local)."
  exit 1
fi

GEMINI_MODEL="${GEMINI_MODEL:-gemini-3.8-flash}"
NEXT_PUBLIC_DEFAULT_ENGINE="${NEXT_PUBLIC_DEFAULT_ENGINE:-live}"
GCS_BUCKET="${GCS_BUCKET:-gf-216812516383}"
DOCUMENT_AI_PROCESSOR="${DOCUMENT_AI_PROCESSOR:-}"
DOCUMENT_AI_LOCATION="${DOCUMENT_AI_LOCATION:-us}"

if [[ -z "${DOCUMENT_AI_PROCESSOR}" ]]; then
  echo "DOCUMENT_AI_PROCESSOR is required in .env.local (step 4 OCR processor id)."
  exit 1
fi

echo "Project:  ${PROJECT_ID}"
echo "Region:   ${REGION}"
echo "Service:  ${SERVICE}"
echo "Model:    ${GEMINI_MODEL}"
echo "Bucket:   ${GCS_BUCKET}"
echo "DocAI:    ${DOCUMENT_AI_PROCESSOR:-"(unset)"} @ ${DOCUMENT_AI_LOCATION}"
echo "Gemini key: from .env.local only (${#GEMINI_API_KEY} chars) — no Vertex"
echo "APIs: run + cloudbuild + artifactregistry (+ firestore/storage/documentai if already enabled)"

# Cloud Run source deploy APIs. Firestore is enabled separately in step 2.
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project="${PROJECT_ID}"

# Scale-to-zero (min=0). Cap instances to limit surprise cost.
gcloud run deploy "${SERVICE}" \
  --source . \
  --project="${PROJECT_ID}" \
  --region="${REGION}" \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --timeout=60 \
  --min-instances=0 \
  --max-instances=3 \
  --quiet \
  --set-env-vars="GEMINI_API_KEY=${GEMINI_API_KEY},GEMINI_MODEL=${GEMINI_MODEL},NEXT_PUBLIC_DEFAULT_ENGINE=${NEXT_PUBLIC_DEFAULT_ENGINE},GCP_PROJECT_ID=${PROJECT_ID},GCS_BUCKET=${GCS_BUCKET},DOCUMENT_AI_PROCESSOR=${DOCUMENT_AI_PROCESSOR},DOCUMENT_AI_LOCATION=${DOCUMENT_AI_LOCATION}"

echo
echo "Deployed. Open the Service URL from the output above on your phone."
