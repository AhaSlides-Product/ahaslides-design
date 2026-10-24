<!--
  BAD-EXAMPLE (C24, drag-only axis) — a "put these in order" presenter canvas where
  the presenter reorders the reveal cards by dragging them. The only way to change
  the order is a pointer drag (draggable + dragstart/drop handlers); there is no
  move-up / move-down control and no key handler.

  A presenter with a keyboard alone cannot reorder anything. Colour/font come from
  xprops (C1 clean) and nothing else is wrong, so this isolates C24 -> the only
  expected FAIL is C24.

  Fix: give every card a keyboard alternative to the drag (focusable card, Space to
  pick up, ArrowUp/ArrowDown to move, Space/Enter to drop, Esc to cancel, with the
  new position announced in a live region), or Move up / Move down buttons.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')

const cards = ref(['Plan', 'Build', 'Review', 'Ship'])
let from = -1

function onDragStart(i: number) { from = i }
function onDrop(to: number) {
  const [moved] = cards.value.splice(from, 1)
  cards.value.splice(to, 0, moved)
}
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <ol class="cards">
      <!-- ❌ pointer-only reorder: no focus, no key handler, no move buttons -->
      <li
        v-for="(card, i) in cards"
        :key="card"
        class="card"
        draggable="true"
        @dragstart="onDragStart(i)"
        @dragover.prevent
        @drop="onDrop(i)"
      >
        {{ card }}
      </li>
    </ol>
  </div>
</template>

<style scoped>
.stage { height: 100%; padding: 32px; }
.cards { display: grid; gap: 16px; margin: 0; padding: 0; list-style: none; }
.card { padding: 16px 24px; font-size: 24px; border: 1px solid var(--aha-deck-container-stroke); border-radius: 8px; cursor: grab; }
</style>
