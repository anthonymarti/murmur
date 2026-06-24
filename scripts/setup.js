#!/usr/bin/env node
// One-time setup: build whisper.cpp locally and download the base.en model.
// The whisper binary is native + platform-specific, so it can't be committed or
// cross-compiled — it must be built on the target machine. Hence this script.

'use strict';

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const VENDOR = path.join(ROOT, 'vendor');
const WHISPER_DIR = path.join(VENDOR, 'whisper.cpp');
const MODELS_DIR = path.join(WHISPER_DIR, 'models');
const MODEL_FILE = path.join(MODELS_DIR, 'ggml-base.en.bin');

const WHISPER_REPO = 'https://github.com/ggerganov/whisper.cpp.git';
// HuggingFace mirror of the official ggml models (~142MB for base.en).
const MODEL_URL =
  'https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin';

function log(msg) {
  process.stdout.write(`\n▸ ${msg}\n`);
}

function run(cmd, args, opts = {}) {
  execFileSync(cmd, args, { stdio: 'inherit', ...opts });
}

function ensureTool(cmd) {
  try {
    execFileSync(cmd, ['--version'], { stdio: 'ignore' });
  } catch {
    throw new Error(
      `Required tool "${cmd}" not found on PATH. Install Xcode CLT and cmake first.`
    );
  }
}

function cloneOrUpdate() {
  if (fs.existsSync(path.join(WHISPER_DIR, '.git'))) {
    log('whisper.cpp already cloned — pulling latest');
    run('git', ['-C', WHISPER_DIR, 'pull', '--ff-only']);
    return;
  }
  fs.mkdirSync(VENDOR, { recursive: true });
  log('Cloning whisper.cpp');
  run('git', ['clone', '--depth', '1', WHISPER_REPO, WHISPER_DIR]);
}

function build() {
  // Metal acceleration is on by default on Apple Silicon — no extra flags needed.
  log('Configuring build (cmake)');
  run('cmake', ['-B', 'build', '-DCMAKE_BUILD_TYPE=Release'], { cwd: WHISPER_DIR });
  log('Building whisper.cpp (Release)');
  run('cmake', ['--build', 'build', '--config', 'Release', '-j'], { cwd: WHISPER_DIR });

  const cli = path.join(WHISPER_DIR, 'build', 'bin', 'whisper-cli');
  if (!fs.existsSync(cli)) {
    throw new Error(
      `Build finished but ${cli} is missing. whisper.cpp may have renamed the ` +
        `binary — update WHISPER_CLI in src/main/main.js to match.`
    );
  }
  log(`Built binary: ${path.relative(ROOT, cli)}`);
}

function downloadModel() {
  if (fs.existsSync(MODEL_FILE) && fs.statSync(MODEL_FILE).size > 1_000_000) {
    log('Model ggml-base.en.bin already present — skipping download');
    return Promise.resolve();
  }
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  log('Downloading ggml-base.en.bin (~142MB)');

  return new Promise((resolve, reject) => {
    const tmp = `${MODEL_FILE}.part`;
    const out = fs.createWriteStream(tmp);

    const get = (url) => {
      https
        .get(url, (res) => {
          // HuggingFace serves the file from a CDN via 302 redirects.
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return get(res.headers.location);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`Model download failed: HTTP ${res.statusCode}`));
          }

          const total = Number(res.headers['content-length']) || 0;
          let received = 0;
          res.on('data', (chunk) => {
            received += chunk.length;
            if (total) {
              const pct = ((received / total) * 100).toFixed(0);
              process.stdout.write(`\r  ${pct}%  `);
            }
          });
          res.pipe(out);
          out.on('finish', () => {
            out.close(() => {
              fs.renameSync(tmp, MODEL_FILE);
              process.stdout.write('\n');
              resolve();
            });
          });
        })
        .on('error', (err) => {
          fs.rm(tmp, { force: true }, () => reject(err));
        });
    };

    get(MODEL_URL);
  });
}

async function main() {
  ensureTool('git');
  ensureTool('cmake');
  cloneOrUpdate();
  build();
  await downloadModel();
  log('Setup complete. Run `npm start` to launch Murmur.');
}

main().catch((err) => {
  process.stderr.write(`\n✗ Setup failed: ${err.message}\n`);
  process.exit(1);
});
