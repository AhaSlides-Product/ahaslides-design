/*
 * focus-ring-clip.js — the rendered half of guideline rule OVERLAY-10 (overlays C9): a focus ring is never
 * clipped by an overflow container. `focusRingClipProbe` is a browser expression (evaluate it in the page,
 * it resolves to a report); screen-lint.mjs --measure runs it.
 *
 * The probe focuses every visible, keyboard-reachable control on the page one at a time (shadow roots
 * included) without scrolling, and finds the ring as whatever the focus painted: the control and each
 * flat-tree ancestor below the first clipping container, and each light-DOM or shadow-DOM descendant (the DS
 * checkbox paints its ring on an inner .box), whose outline or outer box-shadow grew on focus.
 * Each grown paint box is measured against that node's clipping box (every ancestor with overflow other
 * than visible, or paint containment). The viewport is not a clipper here, and a control already cut off
 * at rest (scrolled partly out of view) is skipped, so only a ring cut at a container's edge is a finding.
 */

const probeBody = () => {
  const TOLERANCE = 0.5;
  const FOCUSABLE = 'a[href], button, input:not([type="hidden"]), select, textarea, summary, [tabindex]';
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
  const descendants = (element) => [...(element.shadowRoot ? everyElement(element.shadowRoot) : []), ...everyElement(element)];
  const describe = (element) => {
    const host = element.getRootNode().host;
    const own = `${element.localName}${element.id ? `#${element.id}` : ''}${typeof element.className === 'string' && element.className.trim() ? `.${element.className.trim().split(/\s+/)[0]}` : ''}`;
    return host ? `<${host.localName}${host.id ? `#${host.id}` : ''}> ${own}` : own;
  };
  const clips = (style) => style.overflowX !== 'visible' || style.overflowY !== 'visible' || /paint|strict|content/.test(style.contain || '');
  const paddingBox = (element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + element.clientTop, left: rect.left + element.clientLeft, right: rect.left + element.clientLeft + element.clientWidth, bottom: rect.top + element.clientTop + element.clientHeight };
  };
  const ancestors = (element) => {
    const out = [];
    for (let node = parentInFlatTree(element); node && node !== document.body && node !== document.documentElement; node = parentInFlatTree(node)) {
      if (node.localName === 'slot' || getComputedStyle(node).display === 'contents') continue;
      out.push(node);
    }
    return out;
  };
  const clippingBox = (element) => {
    let box = { top: -Infinity, left: -Infinity, right: Infinity, bottom: Infinity };
    let clipper = null;
    for (const ancestor of ancestors(element)) {
      const style = getComputedStyle(ancestor);
      if (!clips(style)) continue;
      const inner = paddingBox(ancestor);
      const next = { ...box };
      if (style.overflowX !== 'visible' || /paint|strict|content/.test(style.contain || '')) { next.left = Math.max(next.left, inner.left); next.right = Math.min(next.right, inner.right); }
      if (style.overflowY !== 'visible' || /paint|strict|content/.test(style.contain || '')) { next.top = Math.max(next.top, inner.top); next.bottom = Math.min(next.bottom, inner.bottom); }
      if (!clipper) clipper = ancestor;
      box = next;
    }
    return { box, clipper };
  };
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
  const cutOff = (rect, box) => Object.entries({
    top: box.top - rect.top, right: rect.right - box.right,
    bottom: rect.bottom - box.bottom, left: box.left - rect.left,
  }).filter(([, amount]) => amount > TOLERANCE).map(([side, amount]) => `${side} ${Math.round(amount)}px`);
  const grew = (before, after) => after.top < before.top - TOLERANCE || after.left < before.left - TOLERANCE || after.right > before.right + TOLERANCE || after.bottom > before.bottom + TOLERANCE;
  const reachable = (element) => {
    if (!element.matches(FOCUSABLE) || element.matches(':disabled, [inert] *, [tabindex="-1"]')) return false;
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

  return (async () => {
    const findings = [];
    let checked = 0;
    const tags = [...new Set(everyElement(document).map((element) => element.localName).filter((tag) => tag.includes('-')))];
    await Promise.all(tags.map((tag) => Promise.race([customElements.whenDefined(tag), new Promise((done) => setTimeout(done, 3000))])));
    await frame();

    for (const control of everyElement(document)) {
      if (!reachable(control)) continue;
      const { box: restBox, clipper } = clippingBox(control);
      if (!clipper || cutOff(control.getBoundingClientRect(), restBox).length) continue;
      const chain = [control];
      for (const ancestor of ancestors(control)) { if (ancestor === clipper) break; chain.push(ancestor); }
      chain.push(...descendants(control));
      const before = chain.map(paintBox);
      control.focus({ preventScroll: true, focusVisible: true });
      await settle(chain);
      const active = control.getRootNode().activeElement;
      if (active === control) {
        checked++;
        const cut = new Set();
        chain.forEach((node, i) => {
          const after = paintBox(node);
          if (grew(before[i], after)) for (const entry of cutOff(after, clippingBox(node).box)) cut.add(entry);
        });
        if (cut.size) findings.push({ control: describe(control), clippedBy: describe(clipper), cut: [...cut].join(', ') });
      }
      control.blur();
      await settle(chain);
    }
    return { checked, findings };
  })();
};

/** Browser expression that resolves to `{ checked, findings: [{ control, clippedBy, cut }] }` for the page it runs in. */
export const focusRingClipProbe = `(${probeBody.toString()})()`;

/** One line per clipped focus ring, for a gate report. */
export const formatFocusRingClip = (finding) => `focus ring of ${finding.control} cut off by ${finding.clippedBy} (${finding.cut})`;
