/**
 * @ahaslides-product/design/aha-status-badge — the shared Status badge.
 *
 *   import '@ahaslides-product/design/aha-status-badge';   // registers <aha-status-badge> and <aha-icon>
 *   <aha-status-badge status="published">Published</aha-status-badge>
 *   <aha-status-badge status="completed">Completed</aha-status-badge>
 *   <aha-status-badge look="alert">5 days overdue</aha-status-badge>
 *   <aha-status-badge look="emphasis" icon="system-clock">Due today</aha-status-badge>
 *   <aha-status-badge look="plain">Due in 9 days</aha-status-badge>
 *
 * One box for every boxed badge: 28px tall, 8px side padding, 6px radius, 14px semibold label,
 * 6px gap, a 16px icon or a 6px dot before the label.
 *
 * `look` is one of four styles:
 *   quiet     grey background, no border
 *   emphasis  white background, 1px grey inset border
 *   alert     white background, 1px black inset border, a pink warning icon (the only pink on a badge)
 *   plain     no box: secondary-grey regular text with an optional icon
 * `default` is a deprecated alias of `quiet`.
 *
 * `status` is a built-in state that picks its own look and marker:
 *   draft (pencil) · scheduled (calendar) · published, live, active (emphasis + dark dot) ·
 *   closed, inactive (quiet + light dot) · archived (archive box) · not-started (dashed circle) ·
 *   in-progress (half-dashed circle) · completed (check circle)
 * `marker` (dot · icon · none) and `icon` (a DS icon registry name; it implies marker="icon")
 * override what sits before the label.
 *
 * `--aha-status-badge-bg` and `--aha-status-badge-fg` let an app keep a colour set it already owns
 * inside the shared box. The DS itself ships no hue for status.
 *
 * The text label is always present; the marker is decorative. `role="status"` plus an `aria-label`
 * mirrored from the slotted text announce the state.
 */
import './icons.js';

const LOOKS = ['quiet', 'emphasis', 'alert', 'plain'];
const DEPRECATED_LOOKS = { default: 'quiet' };
const MARKERS = ['dot', 'icon', 'none'];
const ALERT_ICON = 'system-warning-circle';
const BUILT_IN = {
  draft: { look: 'quiet', icon: 'system-pencil-simple' },
  scheduled: { look: 'quiet', icon: 'system-calendar-dot' },
  published: { look: 'emphasis', marker: 'dot' },
  live: { look: 'emphasis', marker: 'dot' },
  active: { look: 'emphasis', marker: 'dot' },
  closed: { look: 'quiet', marker: 'dot' },
  inactive: { look: 'quiet', marker: 'dot' },
  archived: { look: 'quiet', icon: 'system-archive-box' },
  'not-started': { look: 'quiet', icon: 'system-circle-dashed' },
  'in-progress': { look: 'quiet', icon: 'system-circle-half-dashed' },
  completed: { look: 'quiet', icon: 'system-check-circle' },
};

/** The look, marker and icon a set of attribute values resolves to. */
export function resolveStatusBadge({ status, look, marker, icon } = {}) {
  const requestedLook = DEPRECATED_LOOKS[look] || look;
  const hasLook = LOOKS.includes(requestedLook);
  const builtIn = BUILT_IN[status] || (hasLook ? {} : BUILT_IN.draft);
  const resolvedLook = hasLook ? requestedLook : builtIn.look;
  const isAlert = resolvedLook === 'alert';
  const resolvedIcon = icon || (isAlert ? ALERT_ICON : builtIn.icon) || '';
  let resolvedMarker = MARKERS.includes(marker) ? marker : (icon || isAlert) ? 'icon' : builtIn.marker || (resolvedIcon ? 'icon' : 'none');
  if (resolvedMarker === 'icon' && !resolvedIcon) resolvedMarker = 'none';
  return { look: resolvedLook, marker: resolvedMarker, icon: resolvedMarker === 'icon' ? resolvedIcon : '' };
}

const STYLE = `
  :host{ display:inline-flex; vertical-align:middle; max-width:100%; font-family:var(--aha-font-product,"Plus Jakarta Sans",sans-serif) }
  .pill{ box-sizing:border-box; display:inline-flex; align-items:center; gap:var(--aha-space-6,6px); height:28px; padding:0 var(--aha-space-8,8px); max-width:100%;
    font-family:inherit; font-size:var(--aha-size-default,14px); line-height:28px; font-weight:var(--aha-weight-semibold,600); white-space:nowrap;
    border-radius:var(--aha-radius-sm,6px);
    --_bg:var(--aha-gray-25,#F3F3F3); --_fg:var(--aha-text-default,#1A1A1A); --_ring:transparent;
    --_icon:var(--aha-icon-default,#4A4A4A); --_dot:var(--aha-icon-disabled,#B5B5B5);
    background:var(--aha-status-badge-bg,var(--_bg)); color:var(--aha-status-badge-fg,var(--_fg));
    box-shadow:inset 0 0 0 1px var(--_ring) }
  .pill[data-look="emphasis"]{ --_bg:var(--aha-bg-container,#FFFFFF); --_ring:var(--aha-border-strong,#D4D4D4); --_dot:var(--aha-icon-strong,#1A1A1A) }
  .pill[data-look="alert"]{ --_bg:var(--aha-bg-container,#FFFFFF); --_ring:var(--aha-border-warning,#1A1A1A); --_icon:var(--aha-icon-active,#E70E68); --_dot:var(--aha-icon-strong,#1A1A1A) }
  .pill[data-look="plain"]{ --_bg:transparent; --_fg:var(--aha-gray-80,#616161); --_dot:var(--aha-icon-disabled,#B5B5B5); padding:0; font-weight:var(--aha-weight-regular,400) }
  .dot{ flex:0 0 auto; width:6px; height:6px; margin:0 var(--aha-space-2,2px); border-radius:var(--aha-radius-pill,999px); background:var(--_dot) }
  aha-icon{ flex:0 0 auto; color:var(--aha-status-badge-fg,var(--_icon)) }
  .pill:not([data-marker="dot"]) .dot, .pill:not([data-marker="icon"]) aha-icon{ display:none }
  .label{ overflow:hidden; text-overflow:ellipsis }
`;

export class AhaStatusBadge extends HTMLElement {
  static get observedAttributes() { return ['status', 'look', 'marker', 'icon']; }

  connectedCallback() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
      this.shadowRoot.innerHTML =
        `<style>${STYLE}</style><span class="pill" part="pill" role="status"><span class="dot" part="dot" aria-hidden="true"></span><aha-icon part="icon" size="16" decorative aria-hidden="true"></aha-icon><span class="label"><slot></slot></span></span>`;
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
