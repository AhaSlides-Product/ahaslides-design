/**
 * The controlled-value sync shared by the DS text fields (Input, CountedInput, CountedTextarea, and so
 * OptionRow). `syncTypedValue(host, field)` writes the host's `value` attribute into the inner field,
 * except in two cases where the write would eat what the user is typing:
 *
 * - While the field has focus, a value this field itself emitted earlier in the same focus session is a
 *   stale echo (a host's debounced save, or its trimmed copy: "Hello" was emitted before "Hello "). The
 *   typed text stays and the attribute is put back in step with it.
 * - While an IME composition is open (Vietnamese Telex, Chinese, Japanese), nothing is written and the
 *   attribute follows the typed text: writing the field mid-composition breaks the IME, and the input
 *   event that ends every composition would replace the value anyway.
 *
 * Any other value applies at once: an empty value (a clear after submit), a value set while the field's
 * own input event is still being handled (a host filter or clamp rejecting the keystroke), another
 * collaborator's edit, any value while the field is not focused.
 */
const sessions = new WeakMap();

function session(field) {
  let state = sessions.get(field);
  if (state) return state;
  state = { emitted: new Set(), composing: false, inInput: false };
  sessions.set(field, state);
  // capture runs before the component's own input listener, the bubble listener (added later) after it
  field.addEventListener('input', () => { state.inInput = true; }, true);
  field.addEventListener('input', () => { state.inInput = false; state.emitted.add(field.value); });
  field.addEventListener('focus', () => state.emitted.clear());
  field.addEventListener('blur', () => state.emitted.clear());
  field.addEventListener('compositionstart', () => { state.composing = true; });
  field.addEventListener('compositionend', () => { state.composing = false; });
  return state;
}

export function syncTypedValue(host, field) {
  const state = session(field);
  const next = host.getAttribute('value') ?? '';
  if (field.value === next) return;
  const focused = host.shadowRoot && host.shadowRoot.activeElement === field;
  if (state.composing || (focused && !state.inInput && next !== '' && state.emitted.has(next))) { host.setAttribute('value', field.value); return; }
  field.value = next;
}
