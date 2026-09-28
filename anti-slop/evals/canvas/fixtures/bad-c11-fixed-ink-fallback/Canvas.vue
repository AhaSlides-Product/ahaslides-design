<!--
  BAD-EXAMPLE (C11) — the deck-ink FALLBACK is a fixed colour, so it goes
  invisible on a bounded filled surface when the deck leaves slide.textColour
  unset. That "unset" case is the COMMON one: default themes let the host paint
  body text itself and forward no slide.textColour, so `?? fallback` is the
  real paint path on the most common deck, not an edge case.

  This True/False result paints the "incorrect" (loser) answer box with an
  OPAQUE light-grey disabled fill, and falls its label back to ahaBrand.white.
  On a DEFAULT (black-text) deck slide.textColour is unset -> the label paints
  white on the light-grey box = invisible. Note the winner box, right beside
  it, derives its ink from its OWN fill via readableInkOn() — the correct
  pattern — so the file already has the helper; the loser just doesn't use it.

  What is NOT the defect: C1 passes (the `??` is a legitimate fallback, not a
  hard-coded paint path); the box is OPAQUE, so this is not a translucent-tint
  (C5) case; a ✗ icon supplies the non-colour cue; every size is a fixed-px
  role. The ONLY defect is the fixed fallback. Expected: C11 FAIL.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { ahaBrand, readableInkOn } from '@/iframe/brandTokens'

const { slideProps, presentationColorPaletteProps } = usePresenterPlugin()
const correctSide = 'true'

const WINNER_FILL = computed(() => presentationColorPaletteProps.value?.[0] ?? ahaBrand.space)
const LOSER_FILL = '#E8E8EC' // opaque disabled-grey box

// BUG: a FIXED white fallback. On a default-theme deck slide.textColour is
// UNSET, so this white ink is the real paint path — and white on the
// light-grey loser box is invisible.
const deckInk = computed(() => slideProps.value?.textColour ?? ahaBrand.white)

function isWinner(side: string) {
  return side === correctSide
}

function labelColor(side: string) {
  // Winner ink is derived from its OWN fill (correct). Loser ink uses the
  // fixed deck fallback (the defect) instead of readableInkOn(LOSER_FILL).
  return isWinner(side) ? readableInkOn(WINNER_FILL.value) : deckInk.value
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
