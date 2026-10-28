<!--
  BAD-EXAMPLE (C5, decorative-treatment axis) — a REAL in-product case from the
  True/False presenter canvas.

  The divider between the two answer boxes renders the word "OR" as two letters
  stacked vertically ("O" over "R") inside a tiny boxed pill — a decorative
  treatment of a real, legible word. Colour and font both come from xprops (C1
  clean) and contrast is fine, but the letter-stacking itself destroys
  legibility at distance: it reads as a little logo on a laptop and is
  unreadable from across a room. This isolates C5: the only expected FAIL is
  C5. Fix: render "OR" as normal horizontal running text at a fixed-px
  type-scale role (e.g. `text-base`), not stacked/rotated letters.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <div class="answer-row">
      <div class="answer-box">True</div>
      <!-- ❌ "OR" rendered as two stacked letters instead of horizontal text -->
      <div class="or-divider">
        <span class="or-letter">O</span>
        <span class="or-letter">R</span>
      </div>
      <div class="answer-box">False</div>
    </div>
  </div>
</template>

<style scoped>
.stage { height: 100%; }
.answer-row { display: flex; align-items: center; gap: 16px; }
.answer-box { flex: 1; }
.or-divider {
  display: flex;
  flex-direction: column;   /* stacks the letters into a mini glyph, not a word */
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, currentColor 10%, transparent);
}
.or-letter {
  font-size: 12px;          /* also below the 16px legibility floor */
  line-height: 1;
  font-weight: 600;
}
</style>
