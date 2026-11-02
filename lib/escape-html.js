/**
 * Escape text for an HTML string built by a lib/ web component (internal helper, not an export).
 *
 *   import { escapeHtml } from './escape-html.js';
 *   root.innerHTML = `<span title="${escapeHtml(label)}">${escapeHtml(label)}</span>`;
 *
 * Safe in element text and in quoted attribute values (single or double quotes).
 * null and undefined become the empty string.
 */
const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ENTITIES[character]);

export default escapeHtml;
