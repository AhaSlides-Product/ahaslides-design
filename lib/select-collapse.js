/**
 * select-collapse.js — `max-tag-count="responsive"` for the list-backed chip body of <aha-select>
 * (antd maxTagCount="responsive"). The control stays one row: chips that do not fit are hidden and a
 * "+N" <aha-tag> stands in for them. At least one chip stays, shrinking to an ellipsis when it must.
 *
 * Measured, not counted: the fit reruns on a width change, a web font landing, and any chip added,
 * removed or relabelled. `more-label` names the "+N" tag for assistive tech (`{count}` marks the number).
 * A select without the attribute builds none of this.
 */
const DEFAULT_MORE_LABEL = '{count} more selected';

export const COLLAPSE_STYLE = `
  :host([max-tag-count="responsive"]) .tags{ flex-wrap:nowrap; overflow:hidden }
  :host([max-tag-count="responsive"]) .chips aha-tag{ flex:0 0 auto }
  :host([max-tag-count="responsive"]) .chips aha-tag[data-squeeze]{ flex:0 1 auto; min-width:0 }
  :host([max-tag-count="responsive"]:not([_typing])) .input{ flex-basis:0; min-width:0 }
  :host([max-tag-count="responsive"][_typing]) .input{ min-width:var(--aha-space-80,80px) }
  .rest{ flex:0 0 auto }
  .chips aha-tag[hidden], .rest[hidden]{ display:none }
`;

const width = (el) => el.getBoundingClientRect().width;

export class SelectCollapse {
  constructor(body) {
    this.body = body;
    this.rest = null;
  }

  responsive() { return this.body.host.getAttribute('max-tag-count') === 'responsive'; }

  arm() {
    const { box, chips } = this.body;
    this.rest = document.createElement('aha-tag');
    this.rest.className = 'rest';
    this.rest.setAttribute('part', 'tag-rest');
    this.rest.setAttribute('role', 'img');
    this.rest.hidden = true;
    chips.after(this.rest);
    const refit = () => this.fit();
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(refit).observe(box);
    // A closing chip leaves the row on its own after its animation, with no render to follow it.
    if (typeof MutationObserver !== 'undefined') new MutationObserver(refit).observe(chips, { childList: true });
    if (typeof document !== 'undefined') document.fonts?.ready?.then(refit);
  }

  reset(shown) {
    for (const chip of shown) { chip.hidden = false; chip.removeAttribute('data-squeeze'); }
    this.rest.hidden = true;
  }

  fit() {
    const on = this.responsive();
    if (!on && !this.rest) return;
    if (!this.rest) this.arm();
    const { box, chips, input, host } = this.body;
    const shown = [...chips.querySelectorAll('aha-tag:not([closing])')];
    this.reset(shown);
    if (!on || !shown.length) return;
    const style = getComputedStyle(box);
    const room = box.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    if (!(room > 0)) return;
    const gap = parseFloat(style.columnGap) || 0;
    const field = parseFloat(getComputedStyle(input).minWidth) || 0;
    const widths = shown.map(width);
    const row = (count) => widths.slice(0, count).reduce((sum, w) => sum + w + gap, 0);
    if (row(shown.length) + field <= room) return;
    if (shown.length === 1) { shown[0].setAttribute('data-squeeze', ''); return; }

    // The widest "+N" this row can need, so the count settling lower never overflows.
    this.rest.textContent = `+${shown.length}`;
    this.rest.hidden = false;
    const budget = room - field - width(this.rest) - gap;
    let keep = shown.length - 1;
    while (keep > 1 && row(keep) > budget) keep--;
    if (row(keep) > budget) shown[0].setAttribute('data-squeeze', '');
    shown.slice(keep).forEach((chip) => { chip.hidden = true; });
    const count = shown.length - keep;
    this.rest.textContent = `+${count}`;
    this.rest.setAttribute('aria-label', (host.getAttribute('more-label') || DEFAULT_MORE_LABEL).replace('{count}', count));
  }
}
