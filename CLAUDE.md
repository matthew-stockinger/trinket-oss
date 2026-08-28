# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project context

Fork of `trinket-oss` (Node/Hapi + MongoDB + AngularJS coding-education platform) deployed as **Trinket742** for ISD742 schools. Deployment/ops facts (GCP project `trinket742`, Cloud Run, Atlas, Secret Manager, buckets, roadmap) live in `AGENTS.md`; the step-by-step runbook is `DEVOPS_OVERVIEW.md` with local setup in `GETTING_STARTED.md`. Read those rather than re-deriving infra details here.

## Commands

```bash
docker-compose up                      # app on :3000, plus mongo (:17017) and redis (:16379)
node app.js                            # without Docker; needs a local mongo + config/local.yaml
npm run build:css                      # vite compiles static/scss -> public/css (also run by npm run build)
npm run watch:css
npm run make-admin user@example.com    # promote an existing user; cloud variant in GETTING_STARTED.md
node lib/util/routeParser.js -R        # print the full route table (method/path/controller/view)
./test/smoke-test.sh http://localhost:3000   # curl-based endpoint checks (script defaults to :3001)
```

**Tests are currently broken.** `npm test` (mocha) dies at load: `test/helpers/catbox-redis.js` requires the unscoped `catbox-redis` package and uses the sinon 1.x `stub(obj, 'method', fn)` signature — the suite predates the Hapi 20 / `@hapi/*` migration. Individual files can't be run standalone either, because specs use the model globals that only exist after `app.js` boots (`test/setup.js` is what loads it, and mocha picks it up only via `--recursive`). Treat repairing the suite as its own task; don't assume `npm test` is a working gate before changes.

## Architecture

### Declarative routes → `routeParser` → Hapi

`config/routes.js` (HTML pages) and `config/api_routes.js` (JSON API) are arrays of route descriptors, not Hapi routes:

```js
{ route  : 'GET /api/courses/{courseId} course.getCourse',
  config : { pre: ['course(params.courseId)'], validate: { query: {...} } } }
```

`lib/util/routeParser.js` turns those into Hapi 20 routes and holds essentially all the framework glue. Adding an endpoint means adding an entry there plus a handler in `lib/controllers/`. Things it does that aren't obvious from a controller alone:

- **Pre-handlers are strings**: `'course(params.courseId)'` resolves `course` against `server.methods` (registered by `lib/util/helpers.js` `register()`), pulls args off the request by dot path, and assigns the result to `request.pre.course`.
- **Controllers don't return responses.** `routeParser` injects `request.success(json)` / `request.fail(json, err)`; `success` decides HTML view vs JSON from the `Accept` header, renders the route's `html:` template, applies the route's `reply:` field whitelist, and merges flash + user context.
- `enable: false` on a route hides it in production only.
- Every `.html` file in `lib/views/static/` is auto-routed at `/<name>`.
- **Legacy shims**: the app was Hapi 4 with callbacks. `routeParser` wraps old `(request, reply)` controllers and callback-style pre-handlers into async handlers, including a fake chainable `reply()`. Expect compatibility code there, not idiomatic Hapi.

### Model globals

`app.js` assigns models to real globals — `User`, `Course`, `Lesson`, `Material`, `File`, `Trinket`, `Interaction`, `Folder`, `CourseInvitation`, plus `log`. Controllers, helpers and scripts use them without requiring. Anything running outside a booted server must `require('./app.js')` first (this is why single test files fail with `ReferenceError: User is not defined`).

### Models

`lib/models/model.js` is a factory; each file in `lib/models/` calls it with `{ schema, hooks, objectMethods, classMethods, publicSpec, plugins, index, alternateIds, fields }`. `publicSpec` defines `serialize()` — it is the whitelist of what the API may emit, so new API-visible fields must be added there. Shared behavior is in `lib/models/plugins/` (roles, ownable, slug, timestamps, paginate, orderedList). `Model.extend` uses the deprecated `mongoose-schema-extend`, which conflicts with Joi 17 — that's why `config/app.config.js` requires the route files *before* `db`; don't reorder those requires.

### Configuration

`node-config` YAML layering: `config/default.yaml` → `local.yaml` (dev, gitignored) → `production.yaml`, with `custom-environment-variables.yaml` for env mapping. `config/app.config.js` derives `isDev/isProd/isTest`, `config.url`, `config.sandboxUrl`, and `config.routes`. Env vars that matter in Cloud Run: `MONGO_URI`, `SESSION_SECRET`, `PORT`, `NODE_ENV`.

The `features:` block in `default.yaml` gates courses, asset uploads, and each trinket language; `lib/util/features.js` reads it, and unknown languages default to disabled. Server-side languages (python3, java, R, pygame) are off because their runner services aren't deployed.

### Sessions and auth

`@hapi/yar` stores only a session id in the cookie; server-side session state goes to **MongoDB** via `lib/util/catbox-mongoose.js`, not Redis. `app.js` defines a custom `session` auth scheme that loads the user from `yar`'s `userId`, registered with `mode: 'try'` — guests pass through, and routes opt in with `config: { auth: 'session' }`. Admins can impersonate via the `loginAs` session key.

`lib/auth/passport.js` configures Local + Google OAuth strategies; the Google strategy is only registered when `config.app.auth.google.clientID` is set. This deployment is Google-OAuth-only — public signup routes are commented out in `config/routes.js`, and legacy password paths still exist but are being removed.

### Storage and cache

`config/aws.js` shadows `AWS.S3` so that setting `aws.endpoint` makes every `new aws.S3()` use path-style URLs + sigv4 — that's what makes Google Cloud Storage HMAC keys work through the S3 API. Still `aws-sdk` v2. `lib/util/store.js` provides Redis-backed caches with a complete in-memory fallback when `db.redis.enabled` is false, so local dev needs no Redis.

### Frontend

Server-rendered nunjucks templates in `lib/views/` (`app.templates`), with an AngularJS 1.3 app in `public/js/` and templates in `public/partials/`. CDN `<script>`/`<link>` lists are configured in `default.yaml` under `app.assets`. Third-party libs live in `public/components/`, which is **gitignored** and fetched as `public-components.tgz` from a GitHub release during the Docker build (inventory in `COMPONENTS.md`). Editing `public/` JS/HTML needs no build step; SCSS does.

`serverside/` holds the Dockerized manager/worker code runners for python3, java, R and pygame. They are not built or deployed in this fork.

## Conventions

2-space indent, single quotes, semicolons. `lib/` uses ES5 `var` with aligned comma-chained require blocks — match the surrounding file instead of modernizing it. The Docker image pins Node 16 (`node:16-bullseye`); a newer local Node may run scripts fine but isn't what production executes.
