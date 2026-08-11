# Devops Troubleshooting

## Cloud Run deploy: "The user-provided container failed to start and listen on the port defined provided by the PORT=8080 environment variable"

Hit while running the deploy command in `DEV_OVERVIEW.md` step 4 (line 82). Diagnosis
below, most likely cause first.

### First, get the real error

The Cloud Run message is generic — the actual stack trace is in the logs:

```
gcloud run services logs read trinket --region us-central1 --limit 100
```

or open that Logs URL. Everything below is a prediction of what you'll see there; the logs
will tell you which one it is in about ten seconds.

### Cause A — your repeated flags are cancelling each other out (most likely)

Line 82 has `--set-secrets` four separate times and `--set-env-vars` twice. gcloud's
map-style flags are **not** cumulative — repeating the same flag doesn't append, the last
occurrence replaces the earlier ones. Look up the flag semantics in
`gcloud run deploy --help` and note how the example passes multiple values.

So what the revision most likely got was only `GOOGLE_CLIENT_SECRET` — and **`MONGO_URI`
and `SESSION_SECRET` were never injected**. Now trace what that does in your code:

- `app.js:50-66` — no `SESSION_SECRET`, so it falls back to
  `config.app.plugins.session.cookieOptions.password`. Fails the 32-char check →
  `process.exit(1)`. Container dies before it ever binds. If this is it, the logs will have
  a very loud `====` banner saying "Session cookie password not configured!"
- `config/db.js:14` — no `MONGO_URI`, so it builds `mongodb://localhost:27017/trinket`.
  Nothing is listening there in a Cloud Run container. Then
  `lib/util/catbox-mongoose.js:44` awaits `mongoose.connection.once('open')` — which never
  fires — so `server.start()` hangs forever and you hit the health-check timeout instead of
  a crash.

Hint: the fix is one `--set-secrets` and one `--set-env-vars`, each with a comma-separated
list. Then verify it actually landed before you even hit the URL:

```
gcloud run services describe trinket --region us-central1 --format="yaml(spec.template.spec.containers[0].env)"
```

### Cause B — why this works locally but not in Cloud Run

Your `.dockerignore` excludes `config/local.yaml`. That file is where the cookie password,
Google client ID/secret, and Mongo host actually live locally — and it is deliberately
*not* in the image. Inside the container, `default.yaml` supplies `password: ''`, empty
Google creds, and `mongo.host: localhost`. That's correct for security, but it means
**every one of those values must arrive as an env var or the container cannot boot.**
Cause A is fatal precisely because of this.

### Cause C — Secret Manager permissions

Even with the flags fixed, the runtime service account
(`PROJECT_NUMBER-compute@developer.gserviceaccount.com`) needs
`roles/secretmanager.secretAccessor` on each secret. Check with
`gcloud secrets get-iam-policy MONGO_URI`. Also confirm all four secret names exist and are
spelled exactly right — `gcloud secrets list`.

### Cause D — Atlas reachability

If the logs show a Mongo timeout rather than the session banner, check that Atlas Network
Access still has `0.0.0.0/0`, and that the stored `MONGO_URI` has the password substituted
and `/trinket` as the database. Verify what's actually stored:
`gcloud secrets versions access latest --secret=MONGO_URI`.

### Things you can rule out

- **Port/host binding.** This is the usual suspect for this error, but you're clean:
  `app.js:70` reads `process.env.PORT`, and `default.yaml:27` already sets
  `hostname: 0.0.0.0`. Don't go chasing this one.
- **`EXPOSE 8080`** in the Dockerfile is documentation only; Cloud Run ignores it.

### One more, not the crash

`GOOGLE_CALLBACK_URL` on line 82 is still the literal placeholder
`trinket-xxxxxxxxxxxx-uc.a.run.app`. Won't stop startup, but Google sign-in will break
until you replace it with the real service URL and add that exact URI in the OAuth
credentials console (`DEV_OVERVIEW.md` step 5).

Start with the logs — if you see the `=====` session banner, it's Cause A and you're one
flag edit away.
