#!/usr/bin/env node
/**
 * Minimal, dependency-free Chrome DevTools Protocol client.
 *
 * Renders a file:// page in headless Chrome and evaluates an expression in it,
 * returning the JSON-serialisable result. Used by qa.mjs to MEASURE the real
 * rendered UI (getComputedStyle) and assert it against the component contract —
 * a true gatekeeper, not just "a PNG exists".
 *
 * Hang-proof: everything is bounded by a hard timeout; Chrome is always killed.
 * No npm deps — the WebSocket client is hand-rolled over a raw TCP socket.
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';
import http from 'node:http';
import crypto from 'node:crypto';

/* Resolve the Chrome/Chromium binary: honour an env override (CHROME_BIN /
   PUPPETEER_EXECUTABLE_PATH / CHROME_PATH) first — that's how CI points at its
   installed browser — then fall back to the common macOS and Linux locations. */
export function resolveChrome() {
  const fromEnv = process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH;
  const candidates = [
    fromEnv,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find(c => existsSync(c)) || fromEnv || candidates[1];
}

const CHROME = resolveChrome();
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function httpGet(port, path) {
  return new Promise((res, rej) => {
    const req = http.get({ host: '127.0.0.1', port, path }, r => {
      let d = ''; r.on('data', c => d += c); r.on('end', () => res(d));
    });
    req.on('error', rej);
  });
}

/* ---- minimal WebSocket client (client frames must be masked) ---- */
function encodeFrame(payload) {
  const len = payload.length, mask = crypto.randomBytes(4);
  let header;
  if (len < 126) header = Buffer.from([0x81, 0x80 | len]);
  else if (len < 65536) { header = Buffer.alloc(4); header[0] = 0x81; header[1] = 0x80 | 126; header.writeUInt16BE(len, 2); }
  else { header = Buffer.alloc(10); header[0] = 0x81; header[1] = 0x80 | 127; header.writeBigUInt64BE(BigInt(len), 2); }
  const out = Buffer.alloc(len);
  for (let i = 0; i < len; i++) out[i] = payload[i] ^ mask[i % 4];
  return Buffer.concat([header, mask, out]);
}
function decodeFrames(buf, acc) {
  const msgs = []; let off = 0;
  while (off + 2 <= buf.length) {
    const b0 = buf[off], b1 = buf[off + 1];
    const fin = (b0 & 0x80) !== 0, opcode = b0 & 0x0f, masked = (b1 & 0x80) !== 0;
    let len = b1 & 0x7f, p = off + 2;
    if (len === 126) { if (p + 2 > buf.length) break; len = buf.readUInt16BE(p); p += 2; }
    else if (len === 127) { if (p + 8 > buf.length) break; len = Number(buf.readBigUInt64BE(p)); p += 8; }
    let key; if (masked) { if (p + 4 > buf.length) break; key = buf.slice(p, p + 4); p += 4; }
    if (p + len > buf.length) break;
    let payload = buf.slice(p, p + len);
    if (masked) { const o = Buffer.alloc(len); for (let i = 0; i < len; i++) o[i] = payload[i] ^ key[i % 4]; payload = o; }
    off = p + len;
    if (opcode === 0x8) { acc.closed = true; continue; }
    if (opcode === 0x9 || opcode === 0xA) continue; // ping/pong
    acc.parts.push(payload);
    if (fin) { msgs.push(Buffer.concat(acc.parts).toString()); acc.parts = []; }
  }
  return { msgs, rest: buf.slice(off) };
}
function wsConnect(wsUrl, timeout) {
  const u = new URL(wsUrl);
  return new Promise((resolve, reject) => {
    const key = crypto.randomBytes(16).toString('base64');
    const sock = net.connect(Number(u.port), u.hostname, () => {
      sock.write(`GET ${u.pathname}${u.search} HTTP/1.1\r\nHost: ${u.host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: ${key}\r\nSec-WebSocket-Version: 13\r\n\r\n`);
    });
    const to = setTimeout(() => { try { sock.destroy(); } catch {} reject(new Error('ws connect timeout')); }, timeout);
    let buf = Buffer.alloc(0), handshaked = false;
    const listeners = [], acc = { parts: [], closed: false };
    const api = {
      send: (obj) => sock.write(encodeFrame(Buffer.from(JSON.stringify(obj)))),
      onMessage: (cb) => listeners.push(cb),
      close: () => { try { sock.destroy(); } catch {} },
    };
    sock.on('data', chunk => {
      buf = Buffer.concat([buf, chunk]);
      if (!handshaked) {
        const idx = buf.indexOf('\r\n\r\n'); if (idx < 0) return;
        const head = buf.slice(0, idx).toString();
        if (!/ 101 /.test(head)) { clearTimeout(to); reject(new Error('ws handshake: ' + head.split('\r\n')[0])); return; }
        handshaked = true; buf = buf.slice(idx + 4); clearTimeout(to); resolve(api);
      }
      const { msgs, rest } = decodeFrames(buf, acc); buf = rest;
      for (const m of msgs) for (const cb of listeners) cb(m);
    });
    sock.on('error', e => { clearTimeout(to); reject(e); });
  });
}

/**
 * evaluateInPage(fileUrl, expression, opts) → the evaluated value.
 * opts.readyExpr — a boolean expression polled until true before measuring.
 */
export async function evaluateInPage(fileUrl, expression, { timeout = 30000, readyExpr = null } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'aha-cdp-'));
  const proc = spawn(CHROME, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    // allow a preview to ESM-import the REAL shipped lib over file:// (single source, no mirror to drift)
    '--allow-file-access-from-files',
    '--remote-debugging-port=0', `--user-data-dir=${dir}`, '--window-size=1200,1400', fileUrl,
  ], { stdio: 'ignore' });
  const t0 = Date.now();
  const cleanup = () => { try { proc.kill('SIGKILL'); } catch {} try { rmSync(dir, { recursive: true, force: true }); } catch {} };
  try {
    const portFile = join(dir, 'DevToolsActivePort');
    let port;
    while (Date.now() - t0 < timeout) { if (existsSync(portFile)) { const p = Number(readFileSync(portFile, 'utf8').split('\n')[0]); if (p) { port = p; break; } } await sleep(80); }
    if (!port) throw new Error('no DevTools port');
    let wsUrl;
    while (Date.now() - t0 < timeout) {
      try { const list = JSON.parse(await httpGet(port, '/json')); const pg = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl); if (pg) { wsUrl = pg.webSocketDebuggerUrl; break; } } catch {}
      await sleep(120);
    }
    if (!wsUrl) throw new Error('no page target');
    const conn = await wsConnect(wsUrl, timeout);
    let id = 0; const pending = new Map();
    conn.onMessage(txt => { let m; try { m = JSON.parse(txt); } catch { return; } if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
    const cmd = (method, params = {}) => new Promise((res, rej) => {
      const mid = ++id; pending.set(mid, res); conn.send({ id: mid, method, params });
      setTimeout(() => { if (pending.has(mid)) { pending.delete(mid); rej(new Error('cmd timeout: ' + method)); } }, timeout);
    });
    await cmd('Runtime.enable');
    if (readyExpr) {
      let ready = false;
      while (Date.now() - t0 < timeout) {
        const r = await cmd('Runtime.evaluate', { expression: readyExpr, returnByValue: true });
        if (r.result && r.result.result && r.result.result.value) { ready = true; break; }
        await sleep(200);
      }
      if (!ready) throw new Error('readyExpr never became true within timeout');
    }
    const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    conn.close();
    if (r.result && r.result.exceptionDetails) throw new Error('eval exception: ' + JSON.stringify(r.result.exceptionDetails));
    return r.result && r.result.result ? r.result.result.value : undefined;
  } finally {
    cleanup();
  }
}

/* CLI: node cdp.mjs <file> "<expression>" [readyExpr] — prints JSON (diagnostic use) */
if (import.meta.url === `file://${process.argv[1]}`) {
  const [file, expr, readyExpr] = process.argv.slice(2);
  evaluateInPage(file.startsWith('file://') ? file : 'file://' + file, expr, { readyExpr: readyExpr || null })
    .then(v => { console.log(JSON.stringify(v, null, 2)); process.exit(0); })
    .catch(e => { console.error('ERROR:', e.message); process.exit(1); });
}
