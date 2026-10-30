/*
 * overlay-clip.js — the rendered half of guideline rule OVERLAY-09: an overlay is never clipped by its
 * panel or the viewport. `overlayClipProbe` is a browser expression (evaluate it in the page, it resolves
 * to a report); screen-lint.mjs --measure and qa.mjs both run it, so the rule has one implementation.
 *
 * The probe opens every <aha-tooltip> and <aha-popover> on the page one at a time (the `open` attribute),
 * and also checks every [role="tooltip"] the page already shows, then measures the bubble against its
 * clipping box: the intersection of every ancestor in the flat tree (slots and shadow hosts included)
 * that clips it (overflow other than visible, or paint containment), honouring the containing block of an
 * absolute or fixed bubble and the browser top layer, and the viewport. Any part of the bubble outside
 * that box is a finding.
 */

const probeBody = () => {
  const TOLERANCE = 0.5;
  const OPENABLE = ['aha-tooltip', 'aha-popover'];
  const BUBBLE_OF = { 'aha-tooltip': '.bubble', 'aha-popover': '.pop' };
  const frame = () => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));

  const parentInFlatTree = (node) => {
    if (node.assignedSlot) return node.assignedSlot;
    if (node.parentElement) return node.parentElement;
    const parent = node.parentNode;
    return parent && parent.host ? parent.host : null;
  };
  const everyElement = (root, out = []) => {
    for (const element of root.querySelectorAll('*')) {
      out.push(element);
      if (element.shadowRoot) everyElement(element.shadowRoot, out);
    }
    return out;
  };
  const describe = (element) => {
    const tag = element.localName;
    const id = element.id ? `#${element.id}` : '';
    const className = typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/)[0]}` : '';
    return `${tag}${id}${className}`;
  };
  const describeOverlay = (host) => {
    const words = (host.getAttribute('text') || host.getAttribute('title') || host.textContent || '').replace(/\s+/g, ' ').trim();
    return `<${host.localName}>${words ? ` "${words.length > 40 ? words.slice(0, 40) + '…' : words}"` : ''}`;
  };
  const paddingBox = (element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + element.clientTop, left: rect.left + element.clientLeft, right: rect.left + element.clientLeft + element.clientWidth, bottom: rect.top + element.clientTop + element.clientHeight };
  };
  const viewport = () => ({ top: 0, left: 0, right: document.documentElement.clientWidth, bottom: innerHeight });
  const inTopLayer = (element) => { try { return element.matches(':popover-open, :modal'); } catch { return false; } };
  const containsPaint = (style) => /paint|strict|content/.test(style.contain || '');
  const transformed = (style) => style.transform !== 'none' || style.perspective !== 'none' || style.filter !== 'none' || (style.backdropFilter && style.backdropFilter !== 'none') || /transform|perspective|filter/.test(style.willChange || '') || /layout|paint|strict|content/.test(style.contain || '') || (style.containerType && style.containerType !== 'normal');
  const holdsAbsolute = (style) => style.position !== 'static' || transformed(style);

  const clippingBox = (element) => {
    const view = viewport();
    let box = { ...view };
    let clipper = null;
    const narrow = (ancestor, style) => {
      const inner = paddingBox(ancestor);
      const next = { ...box };
      if (style.overflowX !== 'visible' || containsPaint(style)) { next.left = Math.max(next.left, inner.left); next.right = Math.min(next.right, inner.right); }
      if (style.overflowY !== 'visible' || containsPaint(style)) { next.top = Math.max(next.top, inner.top); next.bottom = Math.min(next.bottom, inner.bottom); }
      if (!clipper && (next.left !== box.left || next.right !== box.right || next.top !== box.top || next.bottom !== box.bottom)) clipper = ancestor;
      box = next;
    };
    if (inTopLayer(element)) return { box, clipper };
    let position = getComputedStyle(element).position;
    for (let ancestor = parentInFlatTree(element); ancestor && ancestor !== document.body && ancestor !== document.documentElement; ancestor = parentInFlatTree(ancestor)) {
      if (ancestor.localName === 'slot') continue;
      const style = getComputedStyle(ancestor);
      if (style.display === 'contents') continue;
      const isContainingBlock = position === 'absolute' ? holdsAbsolute(style) : position === 'fixed' ? transformed(style) : true;
      if (!isContainingBlock) continue;
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible' || containsPaint(style)) narrow(ancestor, style);
      if (inTopLayer(ancestor)) break;
      position = style.position;
    }
    return { box, clipper };
  };
  const cutOff = (rect, box) => {
    const sides = {
      top: box.top - rect.top, right: rect.right - box.right,
      bottom: rect.bottom - box.bottom, left: box.left - rect.left,
    };
    return Object.entries(sides).filter(([, amount]) => amount > TOLERANCE).map(([side, amount]) => `${side} ${Math.round(amount)}px`);
  };
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) > 0 && rect.width > 0 && rect.height > 0;
  };
  const settle = async () => {
    await frame();
    for (const animation of document.getAnimations()) { try { animation.finish(); } catch {} }
    await frame();
  };
  const judge = (overlay, bubble, findings) => {
    const { box, clipper } = clippingBox(bubble);
    const cut = cutOff(bubble.getBoundingClientRect(), box);
    if (!cut.length) return;
    const view = viewport();
    const byViewport = !clipper || cut.every((entry) => {
      const side = entry.split(' ')[0];
      return box[side] === view[side];
    });
    findings.push({ overlay, clippedBy: byViewport ? 'the viewport' : describe(clipper), cut: cut.join(', ') });
  };

  return (async () => {
    const findings = [];
    let checked = 0;
    const present = OPENABLE.filter((tag) => everyElement(document).some((element) => element.localName === tag));
    await Promise.all(present.map((tag) => Promise.race([customElements.whenDefined(tag), new Promise((done) => setTimeout(done, 3000))])));

    for (const element of everyElement(document)) {
      if (element.getAttribute('role') !== 'tooltip' || !visible(element)) continue;
      const root = element.getRootNode();
      if (root.host && OPENABLE.includes(root.host.localName)) continue;
      checked++;
      judge(describeOverlay(element), element, findings);
    }

    const startX = scrollX, startY = scrollY;
    for (const host of everyElement(document)) {
      if (!OPENABLE.includes(host.localName) || !host.shadowRoot) continue;
      const bubble = host.shadowRoot.querySelector(BUBBLE_OF[host.localName]);
      if (!bubble) continue;
      let trigger = host.getBoundingClientRect();
      if (trigger.width === 0 || trigger.height === 0) continue;
      if (trigger.bottom < 0 || trigger.top > innerHeight) {
        scrollTo(scrollX, scrollY + trigger.top - innerHeight / 2 + trigger.height / 2);
        await frame();
        trigger = host.getBoundingClientRect();
      }
      const triggerBox = clippingBox(host).box;
      if (trigger.right <= triggerBox.left || trigger.left >= triggerBox.right || trigger.bottom <= triggerBox.top || trigger.top >= triggerBox.bottom) continue;
      const wasOpen = host.hasAttribute('open');
      if (!wasOpen) host.setAttribute('open', '');
      await settle();
      if (visible(bubble)) { checked++; judge(describeOverlay(host), bubble, findings); }
      if (!wasOpen) { host.removeAttribute('open'); await settle(); }
    }
    scrollTo(startX, startY);
    return { checked, findings };
  })();
};

/** Browser expression that resolves to `{ checked, findings: [{ overlay, clippedBy, cut }] }` for the page it runs in. */
export const overlayClipProbe = `(${probeBody.toString()})()`;

/** One line per clipped overlay, for a gate report. */
export const formatOverlayClip = (finding) => `${finding.overlay} cut off by ${finding.clippedBy} (${finding.cut})`;
