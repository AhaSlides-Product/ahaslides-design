/**
 * @ahaslides-product/design/marketing-motion — the one motion script of the Marketing sections.
 *
 *   <script type="module" src=".../lib/marketing-motion.js"></script>   // on by default for every DS Marketing page
 *   <section class="aha-features" data-aha-motion="off">                // opt one section out
 *   <html data-aha-motion="off">                                        // opt the page out
 *
 * What it does, on Features, Numbers, Testimonials, FAQ, Pricing and Cards sections:
 *   reveal    each item (heading block, row, card, stat, question, call to action) fades in and slides
 *             up 24 px as it scrolls into view; items that enter together are staggered 80 ms apart
 *   parallax  Features and Testimonials photos and the Numbers image card drift up to 16 px against the scroll
 *   count-up  a Numbers value runs from 0 to its written value once, when it is half in view
 * Timing uses --aha-motion-viz-enter and --aha-ease-out. Under prefers-reduced-motion, without
 * IntersectionObserver, or with data-aha-motion="off", nothing is armed and every final value is
 * shown at once. No scroll-jacking, no autoplay.
 */
const STAGGER_MILLISECONDS = 80;
const PARALLAX_RANGE_PIXELS = 16;
const COUNT_UP_FACTOR = 3;
const SECTION_SELECTOR = '.aha-features, .aha-numbers, .aha-testimonials, .aha-faq, .aha-pricing, .aha-marketing-cards';
const REVEAL_SELECTOR = [
  '.aha-features__header', '.aha-features__row', '.aha-features__cards > li', '.aha-features__grid > *', '.aha-features__cta',
  '.aha-numbers__header', '.aha-numbers__stat', '.aha-numbers__cta',
  '.aha-testimonials__header', '.aha-testimonials__split-row', '.aha-testimonials__grid > li', '.aha-testimonials__cta',
  '.aha-faq__title', '.aha-faq__item', '.aha-faq__cta',
  '.aha-pricing__header', '.aha-pricing__grid > *',
  '.aha-marketing-cards__grid > li',
].join(', ');
const PARALLAX_SELECTOR = '.aha-features__photo, .aha-testimonials__photo, .aha-numbers__card';
const COUNT_SELECTOR = '.aha-numbers__value';

const STYLE = `
.aha-motion-item{opacity:0;transform:translate3d(0,var(--aha-space-24),0);transition:opacity var(--aha-motion-viz-enter) var(--aha-ease-out) var(--aha-motion-delay,0ms),transform var(--aha-motion-viz-enter) var(--aha-ease-out) var(--aha-motion-delay,0ms)}
.aha-motion-item.is-in{opacity:1;transform:none}
[data-aha-parallax]{transform:translate3d(0,var(--aha-parallax-y,0px),0);will-change:transform}
@media (prefers-reduced-motion:reduce){.aha-motion-item{opacity:1;transform:none;transition:none}[data-aha-parallax]{transform:none}}
@media print{.aha-motion-item{opacity:1;transform:none}[data-aha-parallax]{transform:none}.aha-motion-count{display:none}.aha-motion-final{position:static;width:auto;height:auto;margin:0;overflow:visible;clip-path:none;white-space:normal}}
.aha-motion-final{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
`;

function tokenMilliseconds(name, fallback) {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const value = parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  return raw.endsWith('ms') ? value : value * 1000;
}

function isOff(element) {
  return element.closest('[data-aha-motion="off"]') !== null;
}

function outermost(elements) {
  return elements.filter((element) => !elements.some((other) => other !== element && other.contains(element)));
}

function armReveal(sections) {
  const duration = tokenMilliseconds('--aha-motion-viz-enter', 600);
  const items = outermost(sections.flatMap((section) => [...section.querySelectorAll(REVEAL_SELECTOR)])).filter((item) => !isOff(item));
  const observer = new IntersectionObserver((entries) => {
    const entering = entries.filter((entry) => entry.isIntersecting)
      .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top || first.boundingClientRect.left - second.boundingClientRect.left);
    entering.forEach((entry, rank) => {
      const item = entry.target;
      const delay = rank * STAGGER_MILLISECONDS;
      observer.unobserve(item);
      item.style.setProperty('--aha-motion-delay', `${delay}ms`);
      item.classList.add('is-in');
      setTimeout(() => {
        item.classList.remove('aha-motion-item', 'is-in');
        item.style.removeProperty('--aha-motion-delay');
      }, duration + delay + 50);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  items.forEach((item) => {
    item.classList.add('aha-motion-item');
    observer.observe(item);
  });
}

function armParallax(sections) {
  const targets = sections.flatMap((section) => [...section.querySelectorAll(PARALLAX_SELECTOR)]).filter((target) => !isOff(target));
  if (!targets.length) return;
  const visible = new Set();
  let frame = 0;
  const update = () => {
    frame = 0;
    const viewport = window.innerHeight;
    visible.forEach((target) => {
      const rect = target.getBoundingClientRect();
      const progress = (rect.top + rect.height / 2 - viewport / 2) / (viewport / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      target.style.setProperty('--aha-parallax-y', `${(-clamped * PARALLAX_RANGE_PIXELS).toFixed(1)}px`);
    });
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)));
    schedule();
  });
  targets.forEach((target) => {
    target.setAttribute('data-aha-parallax', '');
    observer.observe(target);
  });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
}

function parseCount(text) {
  const match = /^([^\d]*)(\d[\d.,]*)(.*)$/s.exec(text.trim());
  if (!match) return null;
  const digits = match[2].replace(/,/g, '');
  const value = parseFloat(digits);
  if (Number.isNaN(value)) return null;
  return { prefix: match[1], suffix: match[3], value, decimals: (digits.split('.')[1] || '').length, grouped: match[2].includes(',') };
}

function armCountUp(sections) {
  const duration = tokenMilliseconds('--aha-motion-viz-enter', 600) * COUNT_UP_FACTOR;
  const targets = sections.flatMap((section) => [...section.querySelectorAll(COUNT_SELECTOR)]).filter((target) => !isOff(target));
  const counts = new Map();
  const format = (count, amount) => count.prefix + amount.toLocaleString('en-US', {
    minimumFractionDigits: count.decimals, maximumFractionDigits: count.decimals, useGrouping: count.grouped,
  }) + count.suffix;
  targets.forEach((target) => {
    const count = parseCount(target.textContent);
    if (!count) return;
    const finalText = target.textContent.trim();
    const spoken = document.createElement('span');
    spoken.className = 'aha-motion-final';
    spoken.textContent = finalText;
    const shown = document.createElement('span');
    shown.className = 'aha-motion-count';
    shown.setAttribute('aria-hidden', 'true');
    shown.textContent = format(count, 0);
    target.replaceChildren(spoken, shown);
    counts.set(target, { ...count, shown });
  });
  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry) => {
      const target = entry.target;
      const count = counts.get(target);
      observer.unobserve(target);
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        count.shown.textContent = format(count, count.value * eased);
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  counts.forEach((count, target) => observer.observe(target));
}

function start() {
  if (document.documentElement.matches('[data-aha-motion="off"]')) return;
  if (typeof IntersectionObserver === 'undefined' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sections = [...document.querySelectorAll(SECTION_SELECTOR)].filter((section) => !isOff(section));
  if (!sections.length) return;
  const style = document.createElement('style');
  style.setAttribute('data-aha-marketing-motion', '');
  style.textContent = STYLE;
  document.head.append(style);
  armReveal(sections);
  armParallax(sections);
  armCountUp(sections);
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
}
