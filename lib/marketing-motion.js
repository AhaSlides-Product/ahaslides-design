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
 *   parallax  Features and Testimonials photos and the Numbers image card drift up to 48 px against the scroll
 *   count-up  a Numbers value runs from 0 to its written value once, when it is half in view
 * Timing uses --aha-motion-viz-enter and --aha-ease-out. Under prefers-reduced-motion, without
 * IntersectionObserver, or with data-aha-motion="off", nothing is armed and every final value is
 * shown at once. No scroll-jacking, no autoplay.
 */
const STAGGER_MILLISECONDS = 80;
const PARALLAX_RANGE_PIXELS = 48;
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
.aha-motion-final{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media print{.aha-motion-item{opacity:1;transform:none}[data-aha-parallax]{transform:none}.aha-motion-count{display:none}.aha-motion-final{position:static;width:auto;height:auto;margin:0;overflow:visible;clip-path:none;white-space:normal}}
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

/*
 * Galleries — the controls of the multi-image Header and Gallery layouts, on any element with
 * data-aha-gallery. They are navigation, not motion, so they are armed even under reduced motion or
 * data-aha-motion="off"; only the smooth scroll and autoplay are held back there.
 *   data-aha-gallery="slideshow"  [data-aha-gallery-item] pictures in one frame; [data-aha-gallery-dot]
 *                                 buttons pick one, and the current picture carries data-current
 *   data-aha-gallery="carousel"   a [data-aha-gallery-track] that scroll-snaps; [data-aha-gallery-prev],
 *                                 [data-aha-gallery-next] and the dots scroll it, wrapping at the ends
 *   data-aha-gallery="tabs"       role="tab" buttons pick the [data-aha-gallery-item] panel; arrow keys,
 *                                 Home and End move between tabs
 *   data-aha-gallery="marquee"    a CSS loop; [data-aha-gallery-pause] toggles data-paused on it
 *   data-aha-autoplay             on a slideshow: advance every 5 s, paused while hovered, focused or
 *                                 the tab is hidden, and never under reduced motion or data-aha-motion="off"
 */
const GALLERY_SELECTOR = '[data-aha-gallery]';
const SLIDESHOW_INTERVAL_MILLISECONDS = 5000;

function motionAllowed(element) {
  return !isOff(element) && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function markCurrent(elements, index, attribute) {
  elements.forEach((element, position) => {
    if (attribute === 'data-current') element.toggleAttribute('data-current', position === index);
    else element.setAttribute(attribute, String(position === index));
  });
}

function armSlideshow(gallery) {
  const items = [...gallery.querySelectorAll('[data-aha-gallery-item]')];
  const dots = [...gallery.querySelectorAll('[data-aha-gallery-dot]')];
  if (items.length < 2) return;
  let current = Math.max(0, items.findIndex((item) => item.hasAttribute('data-current')));
  const show = (index) => {
    current = (index + items.length) % items.length;
    markCurrent(items, current, 'data-current');
    markCurrent(dots, current, 'aria-current');
  };
  dots.forEach((dot, position) => dot.addEventListener('click', () => show(position)));
  if (!gallery.hasAttribute('data-aha-autoplay') || !motionAllowed(gallery)) return;
  let held = false;
  gallery.addEventListener('pointerenter', () => { held = true; });
  gallery.addEventListener('pointerleave', () => { held = gallery.matches(':focus-within'); });
  gallery.addEventListener('focusin', () => { held = true; });
  gallery.addEventListener('focusout', (event) => { held = gallery.contains(event.relatedTarget) || gallery.matches(':hover'); });
  setInterval(() => {
    if (!held && !document.hidden) show(current + 1);
  }, SLIDESHOW_INTERVAL_MILLISECONDS);
}

function armCarousel(gallery) {
  const track = gallery.querySelector('[data-aha-gallery-track]');
  const items = [...gallery.querySelectorAll('[data-aha-gallery-item]')];
  const dots = [...gallery.querySelectorAll('[data-aha-gallery-dot]')];
  if (!track || !items.length) return;
  const offsetOf = (item) => item.offsetLeft - items[0].offsetLeft;
  const currentIndex = () => {
    if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 1) return items.length - 1;
    let nearest = 0;
    items.forEach((item, position) => {
      if (Math.abs(offsetOf(item) - track.scrollLeft) < Math.abs(offsetOf(items[nearest]) - track.scrollLeft)) nearest = position;
    });
    return nearest;
  };
  const go = (index) => {
    const target = items[(index + items.length) % items.length];
    track.scrollTo({ left: offsetOf(target), behavior: motionAllowed(gallery) ? 'smooth' : 'auto' });
  };
  let pending = false;
  track.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      markCurrent(dots, currentIndex(), 'aria-current');
    });
  }, { passive: true });
  dots.forEach((dot, position) => dot.addEventListener('click', () => go(position)));
  gallery.querySelector('[data-aha-gallery-prev]')?.addEventListener('click', () => go(currentIndex() === 0 ? items.length - 1 : currentIndex() - 1));
  gallery.querySelector('[data-aha-gallery-next]')?.addEventListener('click', () => go(currentIndex() === items.length - 1 ? 0 : currentIndex() + 1));
}

function armTabs(gallery) {
  const tabs = [...gallery.querySelectorAll('[role="tab"]')];
  const panels = [...gallery.querySelectorAll('[data-aha-gallery-item]')];
  if (!tabs.length) return;
  const select = (index, moveFocus) => {
    markCurrent(tabs, index, 'aria-selected');
    tabs.forEach((tab, position) => tab.setAttribute('tabindex', position === index ? '0' : '-1'));
    markCurrent(panels, index, 'data-current');
    if (moveFocus) tabs[index].focus();
  };
  tabs.forEach((tab, position) => {
    tab.addEventListener('click', () => select(position, false));
    tab.addEventListener('keydown', (event) => {
      const last = tabs.length - 1;
      const next = { ArrowRight: position === last ? 0 : position + 1, ArrowLeft: position === 0 ? last : position - 1, Home: 0, End: last }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next, true);
    });
  });
}

function armMarquee(gallery) {
  const pause = gallery.querySelector('[data-aha-gallery-pause]');
  if (!pause) return;
  const icon = pause.querySelector('aha-icon');
  const pauseLabel = pause.getAttribute('aria-label');
  const playLabel = pauseLabel.replace(/^Pause/, 'Play');
  pause.addEventListener('click', () => {
    const paused = !gallery.hasAttribute('data-paused');
    gallery.toggleAttribute('data-paused', paused);
    pause.setAttribute('aria-label', paused ? playLabel : pauseLabel);
    icon?.setAttribute('name', paused ? 'system-play' : 'system-pause');
  });
}

const GALLERY_ARMS = { slideshow: armSlideshow, carousel: armCarousel, tabs: armTabs, marquee: armMarquee };

function startGalleries() {
  document.querySelectorAll(GALLERY_SELECTOR).forEach((gallery) => {
    if (gallery.hasAttribute('data-aha-gallery-armed')) return;
    const arm = GALLERY_ARMS[gallery.getAttribute('data-aha-gallery')];
    if (!arm) return;
    gallery.setAttribute('data-aha-gallery-armed', '');
    arm(gallery);
  });
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startGalleries, { once: true });
  else startGalleries();
}
