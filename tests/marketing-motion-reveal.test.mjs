import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const script = readFileSync(new URL('../lib/marketing-motion.js', import.meta.url), 'utf8');
const readSection = (slug) => JSON.parse(readFileSync(new URL(`../marketing/${slug}.json`, import.meta.url), 'utf8'));

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

class Element {
  constructor(tag, attributes, parent) {
    this.tag = tag;
    this.attributes = attributes;
    this.parent = parent;
    this.children = [];
    this.style = { setProperty() {}, removeProperty() {} };
    const element = this;
    this.classList = {
      get values() { return (element.attributes.class || '').split(/\s+/).filter(Boolean); },
      contains: (name) => element.classList.values.includes(name),
      add: (...names) => { element.attributes.class = [...new Set([...element.classList.values, ...names])].join(' '); },
      remove: (...names) => { element.attributes.class = element.classList.values.filter((value) => !names.includes(value)).join(' '); },
    };
  }

  hasAttribute(name) { return name in this.attributes; }

  getAttribute(name) { return this.attributes[name] ?? null; }

  setAttribute(name, value) { this.attributes[name] = String(value); }

  toggleAttribute(name, force) { if (force) this.attributes[name] = ''; else delete this.attributes[name]; }

  addEventListener() {}

  contains(other) {
    for (let node = other; node; node = node.parent) if (node === this) return true;
    return false;
  }

  descendants() {
    return this.children.flatMap((child) => [child, ...child.descendants()]);
  }

  matchesCompound(compound) {
    const tag = /^[a-z][\w-]*/i.exec(compound)?.[0];
    if (tag && tag !== '*' && tag !== this.tag) return false;
    const negated = [...compound.matchAll(/:not\(([^)]*)\)/g)].map((match) => match[1]);
    const positive = compound.replace(/:not\([^)]*\)/g, '');
    const classes = [...positive.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
    const attributes = [...positive.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)];
    return classes.every((name) => this.classList.contains(name))
      && attributes.every(([, name, value]) => (value === undefined ? name in this.attributes : this.attributes[name] === value))
      && negated.every((inner) => !this.matchesCompound(inner));
  }

  matchesComplex(parts) {
    if (!this.matchesCompound(parts[parts.length - 1])) return false;
    if (parts.length === 1) return true;
    const combinator = parts[parts.length - 2];
    const rest = parts.slice(0, -2);
    if (combinator === '>') return Boolean(this.parent?.matchesComplex(rest));
    for (let node = this.parent; node; node = node.parent) if (node.matchesComplex(rest)) return true;
    return false;
  }

  matches(selector) {
    return selector.split(/\s*,\s*/).some((complex) => this.matchesComplex(complex.trim().split(/\s*(>)\s*|\s+/).map((part) => part ?? ' ').filter((part) => part !== '')));
  }

  closest(selector) {
    for (let node = this; node; node = node.parent) if (node.tag && node.matches(selector)) return node;
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector) {
    return this.descendants().filter((node) => node.matches(selector));
  }
}

const parse = (html) => {
  const root = new Element('', {}, null);
  let current = root;
  const markup = html.replace(/<script\b[\s\S]*?<\/script>/g, '');
  for (const [, closing, tag, rest] of markup.matchAll(/<(\/?)([a-z][\w-]*)([^>]*)>/gi)) {
    if (closing) {
      while (current !== root && current.tag !== tag.toLowerCase()) current = current.parent;
      if (current !== root) current = current.parent;
      continue;
    }
    const attributes = Object.fromEntries([...rest.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(([, name, value]) => [name, value ?? '']));
    const element = new Element(tag.toLowerCase(), attributes, current);
    current.children.push(element);
    if (!VOID.has(element.tag) && !rest.endsWith('/')) current = element;
  }
  return root;
};

const run = (html) => {
  const root = parse(html);
  const observed = new Set();
  class FakeObserver { constructor() {} observe(target) { observed.add(target); } unobserve() {} }
  const head = { append() {} };
  const context = {
    document: {
      readyState: 'complete', head,
      documentElement: { matches: () => false },
      createElement: () => ({ setAttribute() {} }),
      querySelectorAll: (selector) => root.querySelectorAll(selector),
    },
    window: {}, IntersectionObserver: FakeObserver,
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    getComputedStyle: () => ({ getPropertyValue: () => '' }),
    requestAnimationFrame: () => {}, setTimeout: () => {}, setInterval: () => {},
  };
  runInNewContext(script, context);
  const revealed = root.querySelectorAll('.aha-motion-item');
  return { root, revealed, observed };
};

const classesOf = (elements) => elements.map((element) => element.classList.values.find((name) => name !== 'aha-motion-item'));

test('reveal: a Comparison layout reveals its header, table and call to action as three blocks', () => {
  const layout = readSection('comparison').layouts[0];
  assert.deepEqual(classesOf(run(layout.html).revealed), ['aha-comparison__header', 'aha-comparison__table-wrap', 'aha-comparison__cta']);
});

test('reveal: the Logos label and strip each reveal as one block, the looping sets are never touched, and a strip inside a Vivid Pink hero stays still', () => {
  const logos = readSection('logos');
  const { root, revealed } = run(logos.html.replaceAll('{{items}}', logos.itemHtml ?? '<li></li>'));
  assert.deepEqual(classesOf(revealed), ['aha-logos__label', 'aha-logos__track']);
  for (const set of root.querySelectorAll('.aha-logos__set')) assert.equal(set.classList.contains('aha-motion-item'), false);
  const inHero = run(logos.html.replace('class="aha-logos"', 'class="aha-logos aha-logos--brand"').replaceAll('{{items}}', '<li></li>'));
  assert.deepEqual(inHero.revealed, []);
});

test('reveal: a Footer banner card reveals as one block, but a --reveal banner is left to its own script', () => {
  const html = readSection('footer-banner').html;
  assert.deepEqual(classesOf(run(html).revealed), ['aha-footer-banner__card']);
  const modifier = run(html.replace('class="aha-footer-banner"', 'class="aha-footer-banner aha-footer-banner--reveal"'));
  assert.deepEqual(modifier.revealed, []);
});

test('reveal: the Hero stays still', () => {
  const hero = readSection('hero');
  for (const layout of hero.layouts) {
    const { revealed } = run(layout.html);
    assert.deepEqual(revealed, [], layout.slug);
  }
});

test('reveal: data-aha-motion="off" on a newly covered section arms nothing in it', () => {
  const html = readSection('comparison').layouts[0].html.replace('<section class="aha-comparison', '<section data-aha-motion="off" class="aha-comparison');
  assert.deepEqual(run(html).revealed, []);
});
