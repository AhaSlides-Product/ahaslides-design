import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');

const run = ({ reduce }) => {
  const video = {
    controls: false, plays: 0, pauses: 0,
    closest: () => null, removeAttribute() {},
    play() { this.plays += 1; return Promise.resolve(); },
    pause() { this.pauses += 1; },
  };
  const query = { matches: reduce, handlers: [], addEventListener(type, handler) { this.handlers.push(handler); } };
  let notify;
  class FakeObserver { constructor(callback) { notify = callback; } observe() {} }
  const context = {
    document: { readyState: 'complete', documentElement: { matches: () => false }, querySelectorAll: (selector) => (selector === 'video[autoplay]' ? [video] : []) },
    window: {}, matchMedia: () => query, IntersectionObserver: FakeObserver, requestAnimationFrame: (callback) => callback(),
  };
  runInNewContext(script, context);
  const enter = (isIntersecting) => notify([{ target: video, isIntersecting }]);
  const setReduce = (value) => { query.matches = value; query.handlers.forEach((handler) => handler()); };
  return { video, enter, setReduce };
};

test('video: reduce turning on mid-session pauses a playing video and shows its controls', () => {
  const { video, enter, setReduce } = run({ reduce: false });
  enter(true);
  assert.equal(video.plays, 1);
  setReduce(true);
  assert.equal(video.pauses, 1);
  assert.equal(video.controls, true);
});

test('video: an observer entry under reduce never calls play()', () => {
  const { video, enter, setReduce } = run({ reduce: false });
  setReduce(true);
  enter(true);
  assert.equal(video.plays, 0);
  assert.equal(video.controls, true);
});

test('video: reduce turning off resumes only a video in view and restores its controls', () => {
  const { video, enter, setReduce } = run({ reduce: true });
  enter(true);
  setReduce(false);
  assert.equal(video.plays, 1);
  assert.equal(video.controls, false);
  enter(false);
  setReduce(true);
  setReduce(false);
  assert.equal(video.plays, 1);
});
