/**
 * @ahaslides-product/design/aha-status-badge — the shared Status badge.
 *
 *   import '@ahaslides-product/design/aha-status-badge';   // registers <aha-status-badge> and <aha-icon>
 *   <aha-status-badge status="published">Published</aha-status-badge>
 *   <aha-status-badge status="completed">Completed</aha-status-badge>
 *   <aha-status-badge look="closed">Joined</aha-status-badge>
 *   <aha-status-badge look="default" icon="slidetype-match-pair">Match pairs</aha-status-badge>
 *
 * One box for every badge: 22px tall, 8px side padding, 6px radius, 12px semibold label, 6px gap.
 *
 * `status` is a built-in state and picks its own look and marker:
 *   draft · published · closed · archived · active · inactive   → a 6px dot
 *   completed (check icon) · in-progress (hourglass icon) · not-started (no marker)
 * `look` (published · draft · closed · archived · default) dresses a state that has no built-in
 * `status`. `marker` (dot · icon · none) picks what sits before the label; `icon` names a glyph from
 * the DS icon registry and implies `marker="icon"`. The `default` look is for information that is
 * not a status (a counter, a slide type) and never shows a dot.
 *
 * Inside one status dimension (a column, a list, a card slot) use dots only, or icons and no
 * marker only. Never both.
 *
 * `--aha-status-badge-bg` and `--aha-status-badge-fg` let an app keep its own colours inside the
 * shared box. The DS itself ships no hue for status.
 *
 * The text label is always present; the marker is decorative. `role="status"` plus an `aria-label`
 * mirrored from the slotted text announce the state.
 */
import './icons.js';

const LOOKS = ['published', 'draft', 'closed', 'archived', 'default'];
const MARKERS = ['dot', 'icon', 'none'];
const BUILT_IN = {
  draft: { look: 'draft' },
  published: { look: 'published' },
  closed: { look: 'closed' },
  archived: { look: 'archived' },
  active: { look: 'published' },
  inactive: { look: 'archived' },
  'not-started': { look: 'draft', marker: 'none' },
  'in-progress': { look: 'closed', icon: 'system-hourglass-high' },
  completed: { look: 'published', icon: 'system-check' },
};

/** The look, marker and icon a set of attribute values resolves to. */
export function resolveStatusBadge({ status, look, marker, icon } = {}) {
  const builtIn = BUILT_IN[status] || BUILT_IN.draft;
  const resolvedLook = LOOKS.includes(look) ? look : builtIn.look;
  const resolvedIcon = icon || builtIn.icon || '';
  let resolvedMarker = MARKERS.includes(marker) ? marker : builtIn.marker || (resolvedIcon ? 'icon' : 'dot');
  if (resolvedMarker === 'icon' && !resolvedIcon) resolvedMarker = 'none';
  if (resolvedMarker === 'dot' && resolvedLook === 'default') resolvedMarker = 'none';
  return { look: resolvedLook, marker: resolvedMarker, icon: resolvedMarker === 'icon' ? resolvedIcon : '' };
}

const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; max-width:100%; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .pill{ box-sizing:border-box; display:inline-flex; align-items:center; gap:var(--aha-space-6,6px); height:22px; padding:0 var(--aha-space-8,8px); max-width:100%;
    font-family:inherit; font-size:12px; line-height:18px; font-weight:600; white-space:nowrap;
    border-radius:var(--aha-radius-sm,6px);
    --_bg:var(--aha-gray-35,#EBEBEB); --_fg:var(--aha-text-tertiary,#8A8A8A); --_dot:var(--aha-icon-disabled,#B5B5B5);
    background:var(--aha-status-badge-bg,var(--_bg)); color:var(--aha-status-badge-fg,var(--_fg)) }
  .pill[data-look="published"]{ --_bg:var(--aha-bg-accent,#FEF3F7); --_fg:var(--aha-text-link,#E70E68); --_dot:var(--aha-vivid-pink-100,#E70E68) }
  .pill[data-look="closed"]{ --_fg:var(--aha-text-default,#1A1A1A); --_dot:var(--aha-icon-default,#4A4A4A) }
  .pill[data-look="archived"]{ --_bg:var(--aha-gray-25,#F3F3F3); --_fg:var(--aha-text-disabled,#B5B5B5) }
  .pill[data-look="default"]{ --_fg:var(--aha-text-default,#1A1A1A) }
  .dot{ flex:0 0 auto; width:6px; height:6px; border-radius:var(--aha-radius-pill,999px); background:var(--_dot) }
  aha-icon{ flex:0 0 auto; color:currentColor }
  .pill:not([data-marker="dot"]) .dot, .pill:not([data-marker="icon"]) aha-icon{ display:none }
  .label{ overflow:hidden; text-overflow:ellipsis }
`;

export class AhaStatusBadge extends HTMLElement {
  static get observedAttributes() { return ['status', 'look', 'marker', 'icon']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><span class="pill" part="pill" role="status"><span class="dot" part="dot" aria-hidden="true"></span><aha-icon part="icon" size="12" decorative aria-hidden="true"></aha-icon><span class="label"><slot></slot></span></span>`;
      const syncLabel = () => {
        const label = (this.textContent || '').trim();
        if (label) this.shadowRoot.querySelector('.pill').setAttribute('aria-label', label);
      };
      this.shadowRoot.querySelector('slot').addEventListener('slotchange', syncLabel);
      syncLabel();
    }
    this._syncLook();
  }

  attributeChangedCallback() { if (this.shadowRoot) this._syncLook(); }

  _syncLook() {
    const { look, marker, icon } = resolveStatusBadge({
      status: this.getAttribute('status'),
      look: this.getAttribute('look'),
      marker: this.getAttribute('marker'),
      icon: this.getAttribute('icon'),
    });
    const pill = this.shadowRoot.querySelector('.pill');
    pill.dataset.look = look;
    pill.dataset.marker = marker;
    const glyph = this.shadowRoot.querySelector('aha-icon');
    if (icon) glyph.setAttribute('name', icon); else glyph.removeAttribute('name');
  }
}

export function defineAhaStatusBadge(tag = 'aha-status-badge') {
  if (typeof customElements === 'undefined') return false;
  if (!customElements.get(tag)) customElements.define(tag, AhaStatusBadge);
  return true;
}
if (typeof window !== 'undefined') defineAhaStatusBadge();

export default { AhaStatusBadge, defineAhaStatusBadge, resolveStatusBadge };
