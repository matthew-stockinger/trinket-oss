# Granting Admin Rights on Cloud Run

How to promote a user to site admin on the deployed trinket742.org instance.
For local development, use the `docker-compose exec` command in GETTING_STARTED.md instead.

## Why the local method doesn't work in production

Two separate things:

1. **Different databases.** A localhost account (e.g. `matthew-stockinger-0755`, email/password)
   lives in the local Docker mongo. The prod account (e.g. `matthew-stockinger-isd742-org`,
   Google OAuth) lives in Atlas. Making one admin does nothing for the other — the promotion has
   to run against Atlas.
2. **Cloud Run has no `docker exec`.** The `docker-compose exec app npm run make-admin ...`
   pattern from GETTING_STARTED.md has no equivalent — Cloud Run request containers aren't
   shell-accessible.

The good news: `scripts/make-admin.js` needs *nothing* but a Mongo connection. `config/db.js`
prefers `process.env.MONGO_URI` over the yaml, and the `admin` permission list is hardcoded in
`lib/models/roles.js`, not stored in the DB. So the script can run from anywhere that can reach
Atlas. Access is gated on `hasRole("admin")` (`lib/util/helpers.js`), which is exactly what the
script sets.

## Option A — Cloud Run Job (recommended)

Runs the same image, in GCP, with the same secret. Repeatable for additional admins later.

```powershell
gcloud run jobs create make-admin `
  --image us-central1-docker.pkg.dev/trinket742/trinket/app:latest `
  --region us-central1 `
  --set-env-vars "NODE_ENV=production" `
  --set-secrets "MONGO_URI=MONGO_URI:latest" `
  --command node `
  --args "scripts/make-admin.js,matthew.stockinger@isd742.org" `
  --max-retries 0

gcloud run jobs execute make-admin --region us-central1 --wait
```

Read the script's output:

```powershell
gcloud logging read 'resource.type="cloud_run_job" AND resource.labels.job_name="make-admin"' --limit 20 --format="value(textPayload)"
```

To promote someone else later, update the args and re-execute:

```powershell
gcloud run jobs update make-admin --region us-central1 --args "scripts/make-admin.js,joe@isd742.org"
gcloud run jobs execute make-admin --region us-central1 --wait
```

The job uses the same default compute service account as the service, so it already has access to
the `MONGO_URI` secret.

## Option B — one-off, from your laptop

Same image, run locally against Atlas. Faster for a single promotion.

```powershell
$uri = gcloud secrets versions access latest --secret=MONGO_URI
docker run --rm -e NODE_ENV=production -e MONGO_URI="$uri" `
  us-central1-docker.pkg.dev/trinket742/trinket/app:latest `
  node scripts/make-admin.js matthew.stockinger@isd742.org
```

Works because Atlas Network Access is `0.0.0.0/0` per DEVOPS_OVERVIEW.md. Use the container rather
than bare `node` on Windows — the host `node_modules` has native builds (`bcrypt`) that were built
inside the Linux container.

## Two gotchas

- **The account must already exist in Atlas.** Sign into trinket742.org with Google at least once
  first, so the user document is there. If it isn't, the script exits with "User not found" —
  that's the expected failure, not a config problem.
- **Sign out and back in afterward.** `lib/util/store.js` keeps an in-memory user cache (Redis is
  disabled in `config/production.yaml`). It's per-instance and dies with the container, so with
  `--min-instances 0` it clears on its own quickly; a fresh login is the reliable nudge.

Verify by hitting `/admin` — the admin item should also appear in the user menu
(`lib/views/base.html`).
