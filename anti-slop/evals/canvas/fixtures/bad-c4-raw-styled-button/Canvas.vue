<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps } = usePresenterPlugin()

// Ink and font track the deck (C1 clean), and the label below is a legible size
// (C5 clean). The problem is purely HOW the control is built.
const deckInk = computed(() => slideProps.value?.textColour ?? '#1A1A2E')
const deckFont = computed(() => presentationProps.value?.fontFamily ?? undefined)

function extend() {
  /* add 5 seconds to the round */
}
</script>

<template>
  <div class="stage" :style="{ color: deckInk, fontFamily: deckFont }">
    <div class="timer text-2xl" style="font-weight: 600">13</div>

    <!-- A "+5s" extend control hand-built as a styled <button>. It is NOT a ghost
         button — it has a visible border and reads perfectly fine — but it is still
         a hand-rolled control where an Ant <a-button> exists, so it can't inherit
         the storybook fill/radius/weight or the shared hover/focus/disabled + a11y
         states. This is the exact case the reporter flagged ("this isn't an
         a-button; if you use a button, use a proper a-button"). -->
    <button
      type="button"
      class="extend-btn"
      :style="{ color: deckInk, border: '1px solid color-mix(in srgb, currentColor 35%, transparent)' }"
      @click="extend"
    >
      +5s
    </button>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  height: 100%;
  padding: 2rem;
}
.extend-btn {
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 700;
  line-height: 1;
  background: transparent;
}
</style>
