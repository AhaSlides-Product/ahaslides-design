import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { withPage, resolveChrome } from '../cdp.mjs';

const fixture = pathToFileURL(fileURLToPath(new URL('./aha-audio-player.html', import.meta.url))).href;
const skip = existsSync(resolveChrome()) ? false : 'needs headless Chrome (set CHROME_BIN)';

test('aha-audio-player seeks and mutes from the keyboard with only its own events, and aha-audio-track previews apart from selecting', { skip }, async () => {
  const r = await withPage(fixture, async (command) => {
    const evaluate = async (expression) => (await command('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;
    const KEYS = { ArrowRight: 39, ArrowLeft: 37, Enter: 13, ' ': 32 };
    const press = async (key) => {
      const fields = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: KEYS[key], nativeVirtualKeyCode: KEYS[key], ...(key === 'Enter' ? { text: '\r' } : key === ' ' ? { text: ' ' } : {}) };
      await command('Input.dispatchKeyEvent', { type: key.length === 1 || key === 'Enter' ? 'keyDown' : 'rawKeyDown', ...fields });
      await command('Input.dispatchKeyEvent', { type: 'keyUp', ...fields });
    };
    const log = () => evaluate('window.log.splice(0)');
    const shadow = (sel) => `document.getElementById('player').shadowRoot.querySelector('${sel}')`;
    const settle = () => evaluate('new Promise((r) => setTimeout(r, 150))');
    const out = {};
    out.format = await evaluate(`import('../lib/aha-audio-player.js').then((m) => [0, 5.9, 185, 3725, NaN, -3, Infinity].map(m.formatAudioTime))`);

    await evaluate(`new Promise((r) => { const a = ${shadow('audio')}; if (a.readyState >= 1) r(); else a.addEventListener('loadedmetadata', r, { once: true }); })`);
    await settle();
    out.loaded = await evaluate(`[${shadow('.total')}.textContent, ${shadow('.play')}.hasAttribute('disabled'), ${shadow('.seek')}.hasAttribute('disabled'), ${shadow('.seek')}.getAttribute('max')]`);

    await evaluate(`${shadow('.seek')}.focus()`);
    await press('ArrowRight');
    await settle();
    out.seek = await evaluate(`[document.getElementById('player').currentTime, ${shadow('.current')}.textContent, ${shadow('.seek')}.shadowRoot.querySelector('.handle').getAttribute('aria-valuetext')]`);
    out.seekEvents = await log();

    await evaluate(`${shadow('.mute')}.focus()`);
    await press('Enter');
    await settle();
    out.muted = await evaluate(`[document.getElementById('player').muted, ${shadow('.mute')}.getAttribute('aria-label'), ${shadow('.volume')}.value]`);
    await press('Enter');
    await settle();
    out.unmuted = await evaluate(`[document.getElementById('player').muted, ${shadow('.volume')}.value]`);
    out.muteEvents = await log();

    await evaluate(`document.getElementById('player').volume = 0`);
    await settle();
    await log();
    await press('Enter');
    await settle();
    out.unmuteFromZero = await evaluate(`[document.getElementById('player').volume, document.getElementById('player').muted]`);
    await log();

    await evaluate(`${shadow('.volume')}.focus()`);
    await press('ArrowLeft');
    await settle();
    out.volumeKey = await log();

    const track = `document.getElementById('track').shadowRoot`;
    await evaluate(`${track}.querySelector('.preview').click()`);
    out.preview = await evaluate(`[document.getElementById('track').hasAttribute('playing'), document.getElementById('track').hasAttribute('selected'), ${track}.querySelector('.preview').getAttribute('aria-label')]`);
    await evaluate(`${track}.querySelector('.select').focus()`);
    await press(' ');
    await settle();
    out.selected = await evaluate(`[document.getElementById('track').hasAttribute('selected'), ${track}.querySelector('.select').getAttribute('aria-pressed'), ${track}.querySelector('.duration').textContent]`);
    out.trackEvents = await log();

    out.preConnect = await evaluate(`(() => { const p = document.createElement('aha-audio-player'); p.volume = 0.4; p.currentTime = 2; document.body.append(p); const v = [p.volume, p.shadowRoot.querySelector('.volume').value]; p.remove(); return v; })()`);

    await evaluate(`${shadow('.play')}.focus()`);
    await press('Enter');
    await settle();
    out.playing = await evaluate(`document.getElementById('player').paused`);
    out.removed = await evaluate(`(() => { const p = document.getElementById('player'); const a = p.shadowRoot.querySelector('audio'); p.remove(); return a.paused; })()`);
    return out;
  }, { readyExpr: '!!window.fixtureReady' });

  assert.deepEqual(r.format, ['0:00', '0:05', '3:05', '1:02:05', '0:00', '0:00', '0:00']);
  assert.deepEqual(r.loaded, ['0:08', false, false, '8']);
  assert.deepEqual(r.seek, [1, '0:01', '0:01']);
  assert.deepEqual(r.seekEvents, []);
  assert.deepEqual(r.muted, [true, 'Unmute', 0]);
  assert.deepEqual(r.unmuted, [false, 100]);
  assert.deepEqual(r.muteEvents, ['volumechange:1:true', 'volumechange:1:false']);
  assert.deepEqual(r.unmuteFromZero, [1, false]);
  assert.deepEqual(r.volumeKey, ['volumechange:0.99:false']);
  assert.deepEqual(r.preview, [true, false, 'Pause preview: applause.wav']);
  assert.deepEqual(r.selected, [true, 'true', '3:05']);
  assert.deepEqual(r.trackEvents, ['track:play:applause.wav', 'track:select:applause.wav']);
  assert.deepEqual(r.preConnect, [0.4, 40]);
  assert.equal(r.playing, false);
  assert.equal(r.removed, true);
});
