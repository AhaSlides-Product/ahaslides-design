<!--
  BAD-EXAMPLE (C5, contrast axis) — a slide-painted answer chip whose fixed-colour
  marks are not contrast-verified against the chip fill on both polarities.

  The chip fill is a TRANSLUCENT tint (currentColor 26%), which is not a contrast
  guarantee. On it sit two fixed-colour marks: a bundled teal success ✓ and a
  presentationColorPalette accent border. Neither is verified for 4.5:1 (text) /
  3:1 (shape) against the fill on a LIGHT deck (teal ✓ on a light tint) AND a DARK
  deck (palette border blending into the dark). The chip label itself derives from
  currentColor over a currentColor tint, so that part is self-consistent — the
  violation is the fixed-colour ✓ and border. Expected: C5 FAIL (contrast).
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { colorSuccess } from '@/iframe/brandTokens'

const { slideProps, presentationColorPaletteProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const accent = computed(() => presentationColorPaletteProps.value?.[0] ?? '#6A1EBB')
</script>

<template>
  <div class="stage" :style="{ color: textColour }">
    <span
      class="answer-chip"
      :style="{ boxShadow: `inset 0 0 0 2px ${accent}` }"
    >
      <!-- fixed teal ✓ on a translucent tint — not contrast-verified either polarity -->
      <span class="tick" :style="{ color: colorSuccess }">✓</span>
      <span class="label">Lan</span>
    </span>
  </div>
</template>

<style scoped>
.stage { height: 100%; display: flex; align-items: center; justify-content: center; }
.answer-chip {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 16px; border-radius: 10px;
  /* translucent tint — lets the deck through, NOT a contrast guarantee */
  background: color-mix(in srgb, currentColor 26%, transparent);
}
.label { font-size: 48px; font-weight: 800; }
.tick { font-size: 36px; }
</style>
