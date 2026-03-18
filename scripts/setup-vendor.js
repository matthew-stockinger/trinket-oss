#!/usr/bin/env node
/**
 * Setup vendor dependencies for Trinket
 *
 * This script downloads/installs vendor dependencies that aren't available via npm.
 * Run automatically via `npm install` (postinstall) or manually via `npm run setup-vendor`
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const ROOT_DIR = path.join(__dirname, '..');
const VENDOR_DIR = path.join(ROOT_DIR, 'public', 'vendor');
const COMPONENTS_DIR = path.join(ROOT_DIR, 'public', 'components');

// Components to clone from GitHub (for Python embed)
// Format: { repo: 'org/repo', dir: 'local-dir-name', tag: 'version', checkFile: 'file-to-verify' }
const GITHUB_COMPONENTS = [
  { repo: 'trinketapp/skulpt-dist', dir: 'skulpt', tag: '0.11.1.34', checkFile: 'skulpt.min.js' },
  { repo: 'trinketapp/marked', dir: 'marked', checkFile: 'lib/marked.js' },
  { repo: 'trinketapp/jq-console', dir: 'jq-console', tag: 'v2.13.2.1', checkFile: 'jqconsole.min.js' },
  { repo: 'trinketapp/traqball.js', dir: 'traqball.js', tag: '1.0.3', checkFile: 'src/traqball.js' },
  { repo: 'trinketapp/Detectizr', dir: 'detectizr', tag: '2.3.0', checkFile: 'dist/detectizr.min.js' },
];

// Vendor files to download from CDNs
const VENDOR_FILES = [
  // Ace Editor
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/ace.min.js', dest: 'src-min-noconflict/ace.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/ext-modelist.min.js', dest: 'src-min-noconflict/ext-modelist.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/ext-language_tools.min.js', dest: 'src-min-noconflict/ext-language_tools.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-python.min.js', dest: 'src-min-noconflict/mode-python.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-java.min.js', dest: 'src-min-noconflict/mode-java.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-javascript.min.js', dest: 'src-min-noconflict/mode-javascript.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-html.min.js', dest: 'src-min-noconflict/mode-html.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-css.min.js', dest: 'src-min-noconflict/mode-css.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-ruby.min.js', dest: 'src-min-noconflict/mode-ruby.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/mode-r.min.js', dest: 'src-min-noconflict/mode-r.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/theme-chrome.min.js', dest: 'src-min-noconflict/theme-chrome.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/theme-xcode.min.js', dest: 'src-min-noconflict/theme-xcode.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.14/worker-base.min.js', dest: 'src-min-noconflict/worker-base.js' },

  // Other vendor libs
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.1.0/diff.min.js', dest: 'diff.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', dest: 'dist/jszip.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js', dest: 'jszip-utils.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js', dest: 'FileSaver.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js', dest: 'dist/lodash.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.7.2/bluebird.min.js', dest: 'js/browser/bluebird.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-mfizz/2.4.1/font-mfizz.min.css', dest: 'css/font-mfizz.css' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-mfizz/2.4.1/font-mfizz.woff', dest: 'css/font-mfizz.woff' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-mfizz/2.4.1/font-mfizz.ttf', dest: 'css/font-mfizz.ttf' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-mfizz/2.4.1/font-mfizz.eot', dest: 'css/font-mfizz.eot' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-mfizz/2.4.1/font-mfizz.svg', dest: 'css/font-mfizz.svg' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/anchor-js/4.3.1/anchor.min.js', dest: 'anchor.min.js' },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js', dest: 'lazysizes.min.js' },

  // Angular plugins for course editor
  { url: 'https://cdn.jsdelivr.net/npm/angular-notify@2.5.1/dist/angular-notify.min.js', dest: 'angular-notifyjs.js' },
  // Note: angular-scrollfix.js and angular-slugify.js are custom local implementations
];

function mkdirp(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(VENDOR_DIR, dest);
    mkdirp(path.dirname(fullPath));

    if (fs.existsSync(fullPath)) {
      console.log(`  ✓ ${dest} (exists)`);
      return resolve();
    }

    const file = fs.createWriteStream(fullPath);
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Follow redirect
        download(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`  ✓ ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(fullPath, () => {});
      reject(err);
    });
  });
}

async function setupVendor() {
  console.log('\n📦 Setting up vendor dependencies...\n');

  // Create directories
  mkdirp(VENDOR_DIR);
  mkdirp(path.join(VENDOR_DIR, 'src-min-noconflict'));
  mkdirp(path.join(VENDOR_DIR, 'dist'));
  mkdirp(path.join(VENDOR_DIR, 'js', 'browser'));
  mkdirp(path.join(VENDOR_DIR, 'css'));

  // Download vendor files
  console.log('Downloading vendor files from CDN:');
  for (const file of VENDOR_FILES) {
    try {
      await download(file.url, file.dest);
    } catch (err) {
      console.error(`  ✗ ${file.dest}: ${err.message}`);
    }
  }

  console.log('');
}

async function cloneComponent(component) {
  const { repo, dir, tag, checkFile } = component;
  const targetDir = path.join(COMPONENTS_DIR, dir);
  const checkPath = path.join(targetDir, checkFile);

  // Check if already installed
  if (fs.existsSync(checkPath)) {
    console.log(`  ✓ ${dir} (exists)`);
    return true;
  }

  // Clone the repo
  const cloneUrl = `https://github.com/${repo}.git`;
  const cloneCmd = tag
    ? `git clone --branch ${tag} --depth 1 ${cloneUrl} ${dir}`
    : `git clone --depth 1 ${cloneUrl} ${dir}`;

  try {
    console.log(`  Cloning ${repo}...`);
    execSync(cloneCmd, { cwd: COMPONENTS_DIR, stdio: 'pipe' });

    // Remove .git directory to save space (we don't need history)
    const gitDir = path.join(targetDir, '.git');
    if (fs.existsSync(gitDir)) {
      fs.rmSync(gitDir, { recursive: true, force: true });
    }

    console.log(`  ✓ ${dir}`);
    return true;
  } catch (err) {
    console.error(`  ✗ ${dir}: Failed to clone ${repo}`);
    console.error(`    Run manually: git clone ${cloneUrl} public/components/${dir}`);
    return false;
  }
}

async function setupComponents() {
  console.log('📦 Setting up components (Python embed)...\n');

  mkdirp(COMPONENTS_DIR);

  for (const component of GITHUB_COMPONENTS) {
    await cloneComponent(component);
  }

  console.log('');
}

async function main() {
  try {
    await setupVendor();
    await setupComponents();
    console.log('✅ Vendor setup complete!\n');
    console.log('For other embed types (blocks, glowscript, etc.), see COMPONENTS.md\n');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
