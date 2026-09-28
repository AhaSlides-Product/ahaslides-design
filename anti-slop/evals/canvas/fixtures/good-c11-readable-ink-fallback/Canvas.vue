<!--
  GOOD-CONTROL (C11) — every deck-ink FALLBACK is derived from the surface it
  lands on, so the common default-deck case (slide.textColour unset) still
  reads whichever way the box is painted.

  The winner box carries a palette-accent fill and the loser box an opaque
  light-grey fill. Each label's ink falls back to readableInkOn(thatFill) — a
  luminance flip that returns dark ink on a light fill and light ink on a dark
  fill — instead of a fixed white/near-black constant. On a default black-text
  deck (textColour unset) the loser label resolves to dark ink on the
  light-grey box and reads; on a dark deck it resolves to light ink. This is
  the fix for the bad-c11-fixed-ink-fallback case. Expected: C11 PASS.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { ahaBrand, readableInkOn } from '@/iframe/brandTokens'

const { slideProps, presentationColorPaletteProps } = usePresenterPlugin()
const correctSide = 'true'

const WINNER_FILL = computed(() => presentationColorPaletteProps.value?.[0] ?? ahaBrand.space)
const LOSER_FILL = '#E8E8EC' // opaque disabled-grey box

function isWinner(side: string) {
  return side === correctSide
}

function labelColor(side: string) {
  // A coloured winner fill takes ink from its own fill directly. The loser box
  // prefers a SET slide.textColour but — when unset (the default deck) — falls
  // back to the ink that READS on the loser box's own fill, not a fixed white.
  if (isWinner(side)) return readableInkOn(WINNER_FILL.value)
  return slideProps.value?.textColour ?? readableInkOn(LOSER_FILL)
}
</script>

<template>
  <div class="stage">
    <div
      v-for="side in ['true', 'false']"
      :key="side"
      class="answer-box"
      :style="{
        background: isWinner(side) ? WINNER_FILL : LOSER_FILL,
        color: labelColor(side),
      }"
    >
      <span class="icon" aria-hidden="true">{{ isWinner(side) ? '✓' : '✗' }}</span>
      <span class="label">{{ side === 'true' ? 'True' : 'False' }}</span>
    </div>
  </div>
</template>

<style scoped>
.stage {
  height: 100%;
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: center;
}
.answer-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 40px;
  border-radius: 8px;
}
.label {
  font-size: 48px;
}
.icon {
  font-size: 36px;
}
</style>
