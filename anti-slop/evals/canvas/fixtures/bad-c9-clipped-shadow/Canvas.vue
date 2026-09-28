<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

// Reveal screen: a single winner card, filled with a palette accent, that scales up
// and carries a big soft drop shadow. Ink/font/marks come from xprops (C1 clean),
// the label + % are legible (C5 clean). The defect is the shadow being clipped.
const { slideProps, presentationProps, presentationColorPaletteProps } = usePresenterPlugin()
const deckFont = computed(() => presentationProps.value?.fontFamily ?? undefined)
const accent = computed(() => presentationColorPaletteProps.value?.[0] ?? '#6A1EBB')

// A long, one-directional drop shadow (~98px of downward reach) on a card that also
// scales to 1.18 — both push the shadow past the bottom of the 16:9 stage, where the
// iframe clips it into a hard horizontal line. The `overflow: hidden` root compounds it.
const cardStyle = computed(() => ({
  background: accent.value,
  transform: 'scale(1.18)',
  boxShadow: `0 34px 90px -26px ${accent.value}`,
}))
</script>

<template>
  <div class="stage" :style="{ fontFamily: deckFont }">
    <div class="winner" :style="cardStyle">
      <div class="label">Early bird</div>
      <div class="pct">100%</div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  align-items: flex-end; /* the card sits low, flush against the bottom edge */
  justify-content: center;
  height: 100%;
  padding: 1.5rem;
  overflow: hidden; /* compounds the clip: the root cuts the shadow too */
}
.winner {
  width: 60%;
  height: 80%;
  border-radius: 8px;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.label {
  font-size: 2rem;
  font-weight: 600;
}
.pct {
  font-size: 3rem;
  font-weight: 600;
}
</style>
