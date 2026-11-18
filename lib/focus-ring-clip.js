/*
 * focus-ring-clip.js — the rendered half of guideline rule OVERLAY-10 (overlays C9): a focus ring is never
 * clipped by an overflow container. `focusRingClipProbe` is a browser expression (evaluate it in the page,
 * it resolves to a report); screen-lint.mjs --measure runs it.
 *
 * The probe focuses every visible, keyboard-reachable control on the page one at a time (shadow roots
 * included) without scrolling, and finds the ring as whatever the focus painted: the control and each
 * flat-tree ancestor below the first clipping container, and each light-DOM or shadow-DOM descendant (the DS
 * checkbox paints its ring on an inner .box), whose outline or outer box-shadow grew on focus.
 * Each grown paint box is measured against that node's own clipping box (every ancestor that clips it, honouring
 * the containing block of an absolute or fixed node). The viewport is not a clipper here, and a control already cut
 * off at rest (scrolled partly out of view) is skipped, so only a ring cut at a container's edge is a finding.
 * Every resting paint box is measured once up front; a page with more than MAX_CONTROLS controls is checked
 * in document order up to that cap and the report says `truncated`.
 */

import { clipHelpers } from './clip-geometry.js';

const MAX_CONTROLS = 200;


const probeBody = (clipHelpers, maxControls) => {
  const { frame, parentInFlatTree, everyElement, clippingBox, cutOff, TOLERANCE } = clipHelpers();
  const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]';
  const NO_LIMIT = { top: -Infinity, left: -Infinity, right: Infinity, bottom: Infinity };

  const descendants = (element) => [...(element.shadowRoot ? everyElement(element.shadowRoot) : []), ...everyElement(element)];
  const describe = (element) => {
    const host = element.getRootNode().host;
    const own = `${element.localName}${element.id ? `#${element.id}` : ''}${typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/)[0]}` : ''}`;
    return host ? `<${host.localName}${host.id ? `#${host.id}` : ''}> ${own}` : own;
  };
  const ringBox = (element) => clippingBox(element, NO_LIMIT);
  const splitShadows = (value) => {
    const parts = []; let depth = 0, start = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] === '(') depth++;
      else if (value[i] === ')') depth--;
      else if (value[i] === ',' && depth === 0) { parts.push(value.slice(start, i)); start = i + 1; }
    }
    parts.push(value.slice(start));
    return parts;
  };
  const paintBox = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    const reach = { top: 0, right: 0, bottom: 0, left: 0 };
    const width = parseFloat(style.outlineWidth) || 0;
    if (style.outlineStyle !== 'none' && width > 0) {
      const out = width + (parseFloat(style.outlineOffset) || 0);
      for (const side in reach) reach[side] = Math.max(reach[side], out);
    }
    if (style.boxShadow && style.boxShadow !== 'none') {
      for (const shadow of splitShadows(style.boxShadow)) {
        if (/\binset\b/.test(shadow)) continue;
        const [x = 0, y = 0, blur = 0, spread = 0] = (shadow.replace(/\([^)]*\)/g, '').match(/-?[\d.]+px/g) || []).map(parseFloat);
        reach.top = Math.max(reach.top, spread + blur - y);
        reach.bottom = Math.max(reach.bottom, spread + blur + y);
        reach.left = Math.max(reach.left, spread + blur - x);
        reach.right = Math.max(reach.right, spread + blur + x);
      }
    }
    return { top: rect.top - reach.top, left: rect.left - reach.left, right: rect.right + reach.right, bottom: rect.bottom + reach.bottom };
  };
  const grew = (before, after) => after.top < before.top - TOLERANCE || after.left < before.left - TOLERANCE || after.right > before.right + TOLERANCE || after.bottom > before.bottom + TOLERANCE;
  const reachable = (element) => {
    if (!element.matches(FOCUSABLE)) return false;
    if (element.hasAttribute('tabindex') && element.tabIndex < 0) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== 'none' && style.visibility === 'visible' && rect.width > 0 && rect.height > 0;
  };
  const settle = async (nodes) => {
    await frame();
    // Reading the styles starts the focus transitions, so finish() can jump each ring to its end state.
    for (const node of nodes) { getComputedStyle(node).boxShadow; for (const animation of node.getAnimations()) { try { animation.finish(); } catch {} } }
    await frame();
  };
  const ringChain = (control) => {
    const chain = [control];
    for (let node = parentInFlatTree(control); node && node !== document.body && node !== document.documentElement; node = parentInFlatTree(node)) {
      if (node.localName === 'slot') continue;
      const style = getComputedStyle(node);
      if (style.display === 'contents') continue;
      if (style.overflowX !== 'visible' || style.overflowY !== 'visible' || /paint|strict|content/.test(style.contain || '')) break;
      chain.push(node);
    }
    chain.push(...descendants(control));
    return chain;
  };

  return (async () => {
    const findings = [];
    let checked = 0;
    const tags = [...new Set(everyElement(document).map((element) => element.localName).filter((tag) => tag.includes('-')))];
    await Promise.all(tags.map((tag) => Promise.race([customElements.whenDefined(tag), new Promise((done) => setTimeout(done, 3000))])));
    await frame();

    const all = everyElement(document).filter(reachable);
    const truncated = all.length > maxControls;
    const targets = [];
    for (const control of truncated ? all.slice(0, maxControls) : all) {
      if (cutOff(control.getBoundingClientRect(), ringBox(control).box).length) continue;
      const chain = ringChain(control);
      targets.push({ control, chain, before: chain.map(paintBox) });
    }

    for (const { control, chain, before } of targets) {
      control.focus({ preventScroll: true, focusVisible: true });
      await settle(chain);
      if (control.getRootNode().activeElement === control) {
        checked++;
        const cut = new Set();
        let clippedBy = null;
        chain.forEach((node, i) => {
          const after = paintBox(node);
          if (!grew(before[i], after)) return;
          const { box, clipper } = ringBox(node);
          const entries = cutOff(after, box);
          if (entries.length && !clippedBy) clippedBy = clipper;
          for (const entry of entries) cut.add(entry);
        });
        if (cut.size) findings.push({ control: describe(control), clippedBy: clippedBy ? describe(clippedBy) : 'its container', cut: [...cut].join(', ') });
      }
      control.blur();
    }
    return truncated ? { checked, findings, truncated: true, total: all.length, limit: maxControls } : { checked, findings };
  })();
};

/** Browser expression that resolves to `{ checked, findings: [{ control, clippedBy, cut }], truncated?, total?, limit? }` for the page it runs in. */
export const focusRingClipProbe = `(${probeBody})(${clipHelpers}, ${MAX_CONTROLS})`;

/** One line per clipped focus ring, for a gate report. */
export const formatFocusRingClip = (finding) => `focus ring of ${finding.control} cut off by ${finding.clippedBy} (${finding.cut})`;
