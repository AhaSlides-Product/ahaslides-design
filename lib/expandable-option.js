import './aha-button.js';
import './icons.js';

/** The shared look of a long-text option row: a 4-line label, a More link, a picture after the text with an expand overlay. Rows opt in with `data-expandable` and use the classes .body, .label, .more, .picture and .shade. */
export const EXPANDABLE_STYLE = `
  .more{ display:none }
  .row[data-expandable] .body{ display:flex; flex-direction:column; align-items:flex-start; gap:var(--aha-space-4, 4px); flex:1 1 auto; min-width:0 }
  .row[data-expandable] .label{ display:-webkit-box; -webkit-line-clamp:4; -webkit-box-orient:vertical; overflow:hidden; width:100%; flex:0 0 auto }
  .row[data-expandable][data-clamped] .more{ display:inline-flex; position:relative; margin-inline-start:calc(-1 * var(--aha-space-4, 4px)); margin-block:calc(-1 * var(--aha-space-4, 4px)); --aha-text-link:var(--_ink); --aha-text-link-hover:var(--_ink) }
  .more:focus-visible, .picture:focus-visible{ outline:2px solid var(--_ink); outline-offset:2px }
  .row[data-expandable] .picture{ position:relative; cursor:zoom-in }
  .shade{ position:absolute; inset:0; display:none; align-items:center; justify-content:center; background:rgba(0, 0, 0, .5); color:var(--aha-white, #FFFFFF); opacity:0;
    transition:opacity var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-expandable][data-image] .shade{ display:flex }
  .row[data-expandable] .picture:hover .shade, .row[data-expandable] .picture:focus-visible .shade{ opacity:1 }
`;

export const SHADE_HTML = '<span class="shade"><aha-icon name="system-arrows-out-simple" size="24" decorative></aha-icon></span>';
export const MORE_HTML = '<aha-button class="more" variant="link" size="sm" part="more">More</aha-button>';

/** Toggles `data-clamped` on the row while its label is cut off. */
export function measureClamp(row, label, expandable) {
  row.toggleAttribute('data-clamped', expandable && label.scrollHeight > label.clientHeight + 1);
}

/** Makes the picture a button that opens the full option, or a plain picture when not expandable. */
export function syncExpandPicture(picture, expandable, expandLabel) {
  if (expandable) {
    picture.setAttribute('role', 'button');
    picture.tabIndex = 0;
    picture.setAttribute('aria-label', expandLabel || 'View full option');
  } else {
    picture.removeAttribute('role');
    picture.removeAttribute('tabindex');
    picture.removeAttribute('aria-label');
  }
}
