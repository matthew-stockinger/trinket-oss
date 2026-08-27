# Trinket742 Project Guidelines & Context

## Project Overview
- **Name:** Trinket742
- **Origin:** Fork of `trinket-oss` (open-sourced following Trinket's sunset).
- **Purpose:** Educational coding platform for ISD742 computer science courses.
- **Key Features:** LMS-like course management, in-browser Python execution (Skulpt), HTML previews, assignment distribution, teacher course building.

---

## Infrastructure & DevOps
- **Hosting:** Google Cloud Run (Project ID: `trinket742`, Region: `us-central1`).
- **Database:** MongoDB Atlas (Connection string stored in Secret Manager as `MONGO_URI`).
- **Storage:** Google Cloud Storage (S3-compatible via HMAC keys; buckets: `trinket742-user-uploads`, `trinket742-materials`, `trinket742-avatars`, `trinket742-snapshots`).
- **Domain:** `trinket742.org` & `www.trinket742.org` mapped via Cloud Run domain mappings.
- **Secrets Management:** Google Cloud Secret Manager (`MONGO_URI`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).

### Deployment Workflow
1. Build container locally for `linux/amd64`:
   ```bash
   docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/trinket742/trinket/app:latest .
   ```
2. Push image to Google Artifact Registry:
   ```bash
   docker push us-central1-docker.pkg.dev/trinket742/trinket/app:latest
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy trinket \
     --image us-central1-docker.pkg.dev/trinket742/trinket/app:latest \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars "NODE_ENV=production" \
     --set-secrets "MONGO_URI=MONGO_URI:latest,SESSION_SECRET=SESSION_SECRET:latest" \
     --min-instances 0 \
     --max-instances 4 \
     --concurrency 20
   ```

### Local Development
1. Start Docker daemon.
2. Run `docker-compose up`.
3. Access at `http://localhost:3000`.

---

## Authentication & Enrollment Rules
- **Google OAuth Only:** ISD742 school Google accounts.
- **No Public Signups:** `/signup` endpoints and signup buttons are disabled; students join courses exclusively via course join links.
- **Admin Access:** Managed via `scripts/make-admin.js` for teacher accounts (e.g. `matthew.stockinger@isd742.org`).

---

## Key Active Roadmap / Focus Areas
1. **File Uploads / Cloud Storage:** Debug and resolve the "unsupported file type" error on student asset uploads.
2. **Auth Cleanup:** Fully remove legacy email/password auth paths in favor of Google OAuth while safeguarding admin roles.
3. **Student Permissions:** Verify student view constraints vs. teacher course creation capabilities.
4. **Maintenance:** Plan migration from deprecated `aws-sdk` v2 to `@aws-sdk/client-s3` (v3).
