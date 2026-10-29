import './icons.js';
import './aha-bottom-sheet.js';

export const PICTURE_EXPAND_STYLE = `
  .expand{ display:none }
  .row[data-image]:not([data-expandable]) .picture{ position:relative }
  .row[data-image]:not([data-expandable]) .expand{ position:absolute; inset:0; box-sizing:border-box; display:flex; align-items:center; justify-content:center; width:100%; height:100%; padding:0;
    border:0; border-radius:inherit; background:rgba(0, 0, 0, .5); color:var(--aha-white, #FFFFFF); cursor:zoom-in; opacity:0;
    transition:opacity var(--aha-motion-fast, .1s) var(--aha-ease-out, cubic-bezier(0.215,0.61,0.355,1)) }
  .row[data-image]:not([data-expandable]) .expand:focus-visible{ opacity:1; outline:2px solid var(--aha-white, #FFFFFF); outline-offset:-4px; box-shadow:inset 0 0 0 4px var(--aha-gray-900, #1A1A1A) }
  .row[data-image]:not([data-expandable]) .picture:hover .expand{ opacity:1 }
  @media (hover: none){
    .row[data-image]:not([data-expandable]) .picture:hover .expand{ opacity:0 }
  }
`;

export function pictureExpandHtml(label) {
  return `<button class="expand" type="button" data-nodrag aria-label="${label || 'View larger picture'}"><aha-icon name="system-arrows-out-simple" size="24" decorative></aha-icon></button><!-- ds-lint-allow: raw-button (full-picture overlay button; no aha-button size fits) -->`;
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
