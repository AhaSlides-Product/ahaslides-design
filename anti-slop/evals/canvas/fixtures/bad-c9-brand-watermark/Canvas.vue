<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps } = usePresenterPlugin()

// Ink and font track the deck (C1 clean). Marks would come from the palette.
const deckInk = computed(() => slideProps.value?.textColour ?? '#1A1A2E')
const deckFont = computed(() => presentationProps.value?.fontFamily ?? undefined)
</script>

<template>
  <div class="stage" :style="{ color: deckInk, fontFamily: deckFont }">
    <div class="prompt">
      <span class="text-3xl">{{ slideProps?.title }}</span>
    </div>

    <div class="tally text-2xl" style="font-weight: 600">
      {{ /* a real datum — fine */ '128 votes' }}
    </div>

    <!-- Decorative brand watermark: paints the product URL in a greyed corner
         pill purely so the layout feels "finished". It carries no information the
         room needs, and the host already frames the deck with AhaSlides branding. -->
    <span
      class="watermark"
      :style="{ background: 'color-mix(in srgb, currentColor 10%, transparent)' }"
    >
      ahaslides.com
    </span>
  </div>
</template>

<style scoped>
.stage {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
}
.watermark {
  position: absolute;
  left: 1.5rem;
  bottom: 1.5rem;
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.5;
}
</style>
