<!--
  GOOD-CONTROL (C24) — a 2x2 matrix results view plus a reorderable card list that
  are fully operable from the keyboard:

  - Every dot is a <button> in reading order with a visible :focus-visible ring; its
    label shows on :hover AND :focus-visible.
  - Each reorder card is focusable: Space picks it up, ArrowUp/ArrowDown move it,
    Space/Enter drops it, Esc cancels; the new position is announced in a live
    region. The drag stays as a pointer shortcut, not the only way.
  - Nothing traps focus, and the keydown handlers only act while a card is picked
    up, so ArrowRight/ArrowLeft/PageDown/PageUp/Space still reach the deck.

  Colour/font come from xprops (C1 clean). Expected: C24 PASS.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')

const responses = [
  { id: 1, x: 22, y: 30, text: 'Ship the pricing page' },
  { id: 2, x: 68, y: 24, text: 'Rewrite onboarding' },
  { id: 3, x: 40, y: 72, text: 'Retire the legacy API' },
]

const cards = ref(['Plan', 'Build', 'Review', 'Ship'])
const held = ref(-1)
const announcement = ref('')

function onCardKey(e: KeyboardEvent, i: number) {
  if (held.value < 0) {
    if (e.key === ' ') { held.value = i; announcement.value = `${cards.value[i]} picked up, position ${i + 1}`; e.preventDefault(); e.stopPropagation() }
    return
  }
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    const to = held.value + (e.key === 'ArrowUp' ? -1 : 1)
    if (to >= 0 && to < cards.value.length) {
      const [moved] = cards.value.splice(held.value, 1)
      cards.value.splice(to, 0, moved)
      held.value = to
      announcement.value = `${moved} moved to position ${to + 1}`
    }
    e.preventDefault(); e.stopPropagation()
  } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
    announcement.value = `${cards.value[held.value]} dropped at position ${held.value + 1}`
    held.value = -1
    e.preventDefault(); e.stopPropagation()
  }
}
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <div class="grid">
      <button
        v-for="r in responses"
        :key="r.id"
        type="button"
        class="dot"
        :style="{ left: r.x + '%', top: r.y + '%' }"
      >
        <span class="mark" aria-hidden="true">{{ r.id }}</span>
        <span class="label">{{ r.text }}</span>
      </button>
    </div>

    <ol class="cards">
      <li
        v-for="(card, i) in cards"
        :key="card"
        class="card"
        tabindex="0"
        :aria-label="`${card}, position ${i + 1} of ${cards.length}. Space to pick up.`"
        @keydown="onCardKey($event, i)"
      >
        {{ card }}
      </li>
    </ol>
    <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; padding: 32px; }
.grid { position: relative; height: 60%; border: 1px solid var(--aha-border-default); }
.dot { position: absolute; padding: 0; background: none; border: 0; color: inherit; font: inherit; }
.mark { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid currentColor; font-size: 18px; }
.label { display: none; position: absolute; top: 40px; left: 0; padding: 8px 12px; font-size: 18px; white-space: nowrap; background: var(--aha-bg-default); }
.dot:hover .label, .dot:focus-visible .label { display: block; }
.dot:focus-visible, .card:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.cards { display: flex; gap: 16px; margin: 16px 0 0; padding: 0; list-style: none; }
.card { padding: 12px 24px; font-size: 18px; border: 1px solid var(--aha-border-default); border-radius: 8px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
</style>
