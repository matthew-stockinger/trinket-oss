# Game Lab on Trinket742: runtime + animations

## Context
Matt teaches with code.org Game Lab and wants a Game Lab–compatible environment on trinket742.org. That gives him control over summative assessments: his own courses, assignments and grading, without relying on code.org's classroom tools.

Research shows this is very feasible:
- Game Lab = **p5.js + `@code-dot-org/p5.play`** (npm, LGPL-2.1) **+ a small `gamelab-api.js`**, built from `apps/src/p5lab/gamelab/api-entry.js` (Apache-2.0).
- Code.org's own Export feature (`Exporter.js`) bundles exactly those files into a standalone project, so this combination already runs outside code.org.
- Code.org's artwork and sound libraries are license-excluded and can't be reused.

**Decided scope:**
- Build the **runtime first**, with **animations needed early**.
- Defer the command toolbox, `dropletConfig.js` → palette or Droplet blocks, to a later plan.

## Approach
Add a client-side `gamelab` trinket type modeled on the **glowscript** type: a client-side language with its own embed template, runner JS and sandboxed iframe. Student code runs as native JS in that iframe, on top of p5 + p5.play + a Game Lab shim. Animations are stored as trinket assets and preloaded into p5.play's own hook.

### Step 0: compatibility spike (before writing code)
- Export 3–5 real student projects from code.org.
- Paste each into an HTML trinket that loads p5 and `@code-dot-org/p5.play@1.3.21-cdo` from jsdelivr, plus the exported `gamelab-api.js`.
- Note any API gaps, such as `World.*`, `randomNumber`, `createEdgeSprites`, or `playSound` against our asset URLs.

### Step 1: register the type (follow every glowscript touchpoint)
- `config/constants.js`: add `'gamelab'` to the language list.
- `config/default.yaml`: `features.trinkets.gamelab: true`. `lib/util/features.js` already defaults unknown languages to disabled.
- `lib/models/roles.js`: add `create-gamelab-trinket` wherever glowscript's permission appears.
- `lib/util/material-parser.js`: add `'gamelab'`.
- `lib/workers/exports.js`: map `'gamelab': '.js'`.
- `config/routes.js`: mirror the glowscript routes (`/gamelab`, `/gamelab/{shortCode}`, the embed route, and an iframe route like `GET /embed/glowscript-blocks-iframe` at line 431).
- `public/js/library/trinkets/create/` and `list/*.html`: make the type appear in the create UI and in lists with an icon.

### Step 2: embed UI and runner
- `lib/views/embed/gamelab.html`: extends `embed/base.html` with an Ace JS editor, Run/Stop, a 400×400 canvas pane, a console pane and a Help overlay. Copy its structure from `lib/views/embed/glowscript.html`.
- `lib/views/embed/gamelab-iframe.html`: loads p5, p5.play and the Game Lab shim, then receives student code via `postMessage` and runs it on `config.sandboxUrl`, the same isolation the HTML trinket uses.
- `public/js/embed/gamelab.js`: modeled on `public/js/embed/glowscript.js`. It handles:
  - **Run:** rebuild the iframe, send the code and the animation manifest.
  - **Stop:** tear down the iframe.
  - **Errors:** forward runtime errors and `console.log` to the console pane.
  - **Keyboard:** focus the iframe and `preventDefault` arrow keys and space so the page doesn't scroll.
  - **Infinite loops:** a simple guard that instruments `while`/`for` loops with a time check, or at minimum a watchdog that kills an unresponsive iframe.
- `lib/views/trinket/gamelab/`: the full-page trinket view, mirroring `lib/views/trinket/glowscript/`.
- Runtime files: vendor `p5.js`, `p5.play.js` and our own `gamelab-shim.js` under `public/js/embed/gamelab/`. Keep them versioned in git rather than in the gitignored `public/components`.
  - The shim ports the needed parts of `api-entry.js` and `dropletUtilsGlobalFunctions` (`randomNumber`, `playSound`, etc.) and sets up instance/global mode like Game Lab does: auto-calling `draw`, plus `World.frameRate`, `World.mouseX` and similar.

### Step 3: animations (needed early)
- **Hook:** the code.org fork's `Sprite.setAnimation(name)` reads `pInst._predefinedSpriteAnimations[name]` (p5.play.js ~line 2977). Code.org fills it in `P5Wrapper.preloadAnimations` (`apps/src/p5lab/P5Wrapper.js` ~691) using `loadSpriteSheet(url, frameW, frameH, frameCount)` → `loadAnimation`, then sets `looping` and `frameDelay`. Our shim does the same in p5's `preload`, using a manifest passed from the parent.
- **Data model:** store animations as trinket assets, e.g. a manifest `[{name, assetUrl, frameSize:{x,y}, frameCount, looping, frameDelay}]` saved alongside the trinket code. Check how the trinket model persists assets for HTML trinkets and reuse that field. The upload path exists through `public/js/plugins/asset-browser.js` + `config/aws.js` (GCS via the S3 API).
  - Requires turning on **`features.assets: true`** in production config. Bucket and HMAC keys are already set up per the recent storage commits.
- **UI:** an "Animations" tab in `gamelab.html`. It lists the animations and lets students upload a PNG, either a single frame or a spritesheet with a frame count. It shows a thumbnail preview, and lets students rename an animation, since `setAnimation` uses the name.
- **Starter art:** seed a small CC0 sprite pack (e.g. Kenney.nl) that teachers and students can add with one click. Don't use code.org's library, which is license-excluded.
- Sounds: `playSound(url)` works with uploaded audio assets. A sound library is out of scope.

### Out of scope (later plans)
- Command toolbox palette from `dropletConfig.js`, Droplet block mode, a step debugger, and importing code.org export zips.

## Verification
- **Spike:** the student projects run the same as on code.org.
- **Local:** `docker-compose up`, then create a gamelab trinket and check:
  - (a) a keyboard-controlled sprite using `keyDown("left")` moves, and arrows don't scroll the page;
  - (b) upload a 4-frame spritesheet, `setAnimation` it, and confirm it animates;
  - (c) `while(true){}` doesn't freeze the tab;
  - (d) save, reload, share and embed it in a course assignment, and confirm animations persist;
  - (e) the type is hidden when `features.trinkets.gamelab` is false.
- `./test/smoke-test.sh http://localhost:3000` still passes. The mocha suite is known broken (see CLAUDE.md).
- Deploy to Cloud Run with `features.assets` enabled, and repeat (b) and (d) against GCS.
