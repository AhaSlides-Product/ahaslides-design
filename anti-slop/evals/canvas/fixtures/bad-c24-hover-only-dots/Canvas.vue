<!--
  BAD-EXAMPLE (C24, hover-only axis) — a 2x2 matrix results view. Each response is
  a dot placed on the grid; the response text shows only on :hover of the dot.

  The dots are plain <div>s: not focusable, not in the Tab order, and the label has
  no :focus-visible twin. A presenter with a keyboard alone cannot reach a dot or
  read what it says. Colour/font come from xprops (C1 clean) and the dots carry a
  non-colour cue (C6 clean), so this isolates C24 -> the only expected FAIL is C24.

  Fix: render each dot as a focusable control (tabindex="0" or a <button>) in
  reading order with a visible focus ring, and show the label on :focus-visible
  as well as :hover.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')

const responses = [
  { id: 1, x: 22, y: 30, text: 'Ship the pricing page' },
  { id: 2, x: 68, y: 24, text: 'Rewrite onboarding' },
  { id: 3, x: 40, y: 72, text: 'Retire the legacy API' },
]
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <div class="grid">
      <!-- ❌ hover-only reveal on a non-focusable element -->
      <div
        v-for="r in responses"
        :key="r.id"
        class="dot"
        :style="{ left: r.x + '%', top: r.y + '%' }"
      >
        <span class="mark" aria-hidden="true">{{ r.id }}</span>
        <span class="label">{{ r.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; padding: 32px; }
.grid { position: relative; height: 100%; border: 1px solid var(--aha-border-default); }
.dot { position: absolute; }
.mark { display: inline-grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid currentColor; font-size: 18px; }
.label { display: none; position: absolute; top: 40px; left: 0; padding: 8px 12px; font-size: 18px; white-space: nowrap; background: var(--aha-bg-default); }
.dot:hover .label { display: block; }
</style>
