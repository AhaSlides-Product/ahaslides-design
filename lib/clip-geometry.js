/*
 * clip-geometry.js — the clipping-box geometry shared by the rendered probes (overlay-clip.js, focus-ring-clip.js).
 * A probe is evaluated in the page as `(probeBody)(clipHelpers)`, so `clipHelpers` must stay self-contained:
 * it is stringified with toString() and cannot close over anything in this module.
 */

export const clipHelpers = () => {
  const TOLERANCE = 0.5;
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
  const paddingBox = (element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top + element.clientTop, left: rect.left + element.clientLeft, right: rect.left + element.clientLeft + element.clientWidth, bottom: rect.top + element.clientTop + element.clientHeight };
  };
  const viewport = () => ({ top: 0, left: 0, right: document.documentElement.clientWidth, bottom: innerHeight });
  const inTopLayer = (element) => { try { return element.matches(':popover-open, :modal'); } catch { return false; } };
  const containsPaint = (style) => /paint|strict|content/.test(style.contain || '');
  const transformed = (style) => style.transform !== 'none' || style.perspective !== 'none' || style.filter !== 'none' || (style.backdropFilter && style.backdropFilter !== 'none') || /transform|perspective|filter/.test(style.willChange || '') || /layout|paint|strict|content/.test(style.contain || '') || (style.containerType && style.containerType !== 'normal');
  const holdsAbsolute = (style) => style.position !== 'static' || transformed(style);

  const clippingBox = (element, start = viewport()) => {
    let box = { ...start };
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

  return { TOLERANCE, frame, parentInFlatTree, everyElement, paddingBox, viewport, inTopLayer, clippingBox, cutOff };
};
