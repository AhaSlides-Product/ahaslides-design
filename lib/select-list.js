/**
 * select-list.js — the option rows of <aha-select>'s listbox, shared by the single-value list and the
 * multiple / tags list (select-multiple.js).
 *
 * An options entry `{ label, options: [...] }` is a group: a non-selectable header row, then its options,
 * inside a `role="group"` labelled by the header (the ARIA listbox group pattern). Keyboard moves only
 * between `.option` rows, so headers are skipped; `syncGroups` hides a group whose options are all
 * filtered out.
 */
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const isGroup = (o) => !!o && typeof o === 'object' && Array.isArray(o.options);
export const flatOptions = (opts) => (opts.some(isGroup) ? opts.flatMap((o) => (isGroup(o) ? o.options : [o])) : opts);
export const optionValue = (o) => (o && typeof o === 'object' ? o.value : o);

export const GROUP_STYLE = `
  .group-item{ display:block; margin:0; padding:0 }
  .group-item[hidden]{ display:none }
  .group{ margin:0; padding:0; list-style:none }
  .group-label{ padding:var(--aha-space-8,8px) var(--aha-space-12,12px) var(--aha-space-4,4px); font-size:var(--aha-size-sm,12px); line-height:18px;
    font-weight:600; color:var(--aha-text-tertiary,#616161); cursor:default; user-select:none;
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
`;

export function optionRow(o, i, id, sel) {
  const ov = optionValue(o);
  const ol = o && typeof o === 'object' ? (o.label ?? o.value) : o;
  const dis = o && typeof o === 'object' && o.disabled ? ' aria-disabled="true"' : '';
  const description = o && typeof o === 'object' && o.description != null && o.description !== '' ? o.description : null;
  const title = o && typeof o === 'object' && o.title != null && o.title !== '' ? ` title="${esc(o.title)}"` : '';
  const prefix = o && typeof o === 'object' && o.prefix != null && o.prefix !== '' ? o.prefix : null;
  const suffix = o && typeof o === 'object' && o.suffix != null && o.suffix !== '' ? o.suffix : null;
  const text = description == null ? `<span class="label">${esc(ol)}</span>`
    : `<span class="text"><span class="label">${esc(ol)}</span><span class="description" part="description">${esc(description)}</span></span>`;
  return `<li class="option" part="option" id="${id}-o${i}" role="option" data-value="${esc(ov)}" aria-selected="${sel}"${dis}${title}>` +
    (prefix == null ? '' : `<span class="prefix" part="option-prefix" aria-hidden="true">${esc(prefix)}</span>`) +
    text + (suffix == null ? '' : `<span class="suffix" part="option-suffix">${esc(suffix)}</span>`) + `</li>`;
}

// Row ids count across groups, so the nth `.option` in the list is the nth entry of flatOptions(opts).
export function listRows(opts, id, isSelected) {
  let i = 0;
  const row = (o) => { const html = optionRow(o, i, id, isSelected(optionValue(o))); i++; return html; };
  return opts.map((o, g) => (isGroup(o)
    ? `<li class="group-item" role="none"><ul class="group" part="group" role="group" aria-labelledby="${id}-g${g}">` +
      `<li class="group-label" part="group-label" id="${id}-g${g}" role="presentation">${esc(o.label ?? '')}</li>` +
      o.options.map(row).join('') + `</ul></li>`
    : row(o))).join('');
}

// filter-prop names the option field type-to-filter matches (antd optionFilterProp); unset matches the label and the suffix.
export function matchText(row, option, prop) {
  const label = row.querySelector('.label')?.textContent || '';
  if (prop === 'label') return label;
  if (prop) return option && typeof option === 'object' && option[prop] != null ? String(option[prop]) : '';
  return label + ' ' + (row.querySelector('.suffix')?.textContent || '');
}

export function syncGroups(list) {
  for (const group of list.querySelectorAll('.group-item')) group.hidden = !group.querySelector('.option:not([hidden])');
}
