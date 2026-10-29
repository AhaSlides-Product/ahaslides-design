import './icons.js';
import './aha-bottom-sheet.js';

export const PICTURE_EXPAND_STYLE = `
  .expand{ display:none }
  .row[data-image]:not([data-expandable]) .picture{ position:relative }
  .row[data-image]:not([data-expandable]) .expand{ position:absolute; inset-block-start:var(--aha-space-4, 4px); inset-inline-end:var(--aha-space-4, 4px);
    box-sizing:border-box; display:inline-flex; align-items:center; justify-content:center; width:var(--aha-space-24, 24px); height:var(--aha-space-24, 24px); padding:0;
    border:0; border-radius:var(--aha-radius-xs, 4px); background:var(--aha-ink-a70, rgba(0, 0, 0, .7)); color:var(--aha-white, #FFFFFF); cursor:zoom-in;
    transition:opacity var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-image-only]:not([data-expandable]) .expand{ width:var(--aha-space-32, 32px); height:var(--aha-space-32, 32px) }
  .expand:focus-visible{ outline:2px solid var(--aha-white, #FFFFFF); outline-offset:-4px; box-shadow:0 0 0 2px var(--aha-gray-900, #1A1A1A) }
  @media (hover: hover){
    .row[data-image]:not([data-expandable]) .expand{ opacity:0 }
    .row[data-image]:not([data-expandable]) .picture:hover .expand, .row[data-image]:not([data-expandable]) .expand:focus-visible{ opacity:1 }
  }
`;

export function pictureExpandHtml(label) {
  return `<button class="expand" type="button" data-nodrag aria-label="${label || 'View larger picture'}"><aha-icon name="system-arrows-out-simple" size="16" decorative></aha-icon></button><!-- ds-lint-allow: raw-button (24px overlay icon button inside the picture; no aha-button size fits) -->`;
}

/** Opens the picture large in <aha-bottom-sheet>, titled with the option text when there is one; the sheet gives focus back to the opener on close. */
export function openPictureSheet({ image, title }) {
  const sheet = document.createElement('aha-bottom-sheet');
  sheet.setAttribute('image', image);
  sheet.setAttribute('fit-image', '');
  if (title) sheet.setAttribute('heading', title); else sheet.setAttribute('label', 'Picture');
  sheet.addEventListener('close', () => sheet.remove());
  document.body.append(sheet);
  sheet.show();
  return sheet;
}
