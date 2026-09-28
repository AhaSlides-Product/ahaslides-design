<!--
  BAD-EXAMPLE (C7, framed-vs-full-canvas axis) — a REAL in-product case
  (This or That, AHAM-642).

  The manifest turns on BOTH `enableQuestionTitle: true` (the native "Your
  question" title input the presenter types into) AND `enableFullScreen: true`.
  But full-canvas makes the host HIDE its title bar (`isSlideTitleComponentVisible`
  = false for a plugin; the audience only paints `slide.title` when `!isFullCanvas`).
  So the presenter's typed question renders NOWHERE — the host hid its title bar,
  and this Canvas never paints `slideProps.title` itself either. The title silently
  vanishes: "uses the host question field but nothing shows on the canvas."

  Everything else reads from xprops (C1 clean) and the sizes are in-scale (C5 clean),
  so this isolates C7: the only expected FAIL is C7. Fix: go framed — drop
  `enableFullScreen` and keep `enableQuestionTitle`, so the host paints the native
  title bar above the iframe (the Canvas must then NOT paint its own title). Or stay
  full-canvas and render `slideProps.title` here, dropping `enableQuestionTitle`.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps, presentationColorPaletteProps } = usePresenterPlugin()
const deckInk = computed(() => slideProps.value?.textColour ?? '#1A1A2E')
const deckFont = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
const left = computed(() => presentationColorPaletteProps.value?.[1] ?? '#6A1EBB')
const right = computed(() => presentationColorPaletteProps.value?.[0] ?? '#FF4081')

// NOTE: slideProps.value?.title is never read or rendered anywhere below — the
// canvas assumes the host paints it, but full-canvas suppresses the host title bar.
</script>

<template>
  <div class="flex h-full flex-col px-10 py-8" :style="{ color: deckInk, fontFamily: deckFont }">
    <div class="flex flex-1 items-stretch gap-4">
      <div class="flex flex-1 items-center justify-center rounded-2xl p-6" :style="{ color: left }">
        <span class="text-5xl font-extrabold">Coffee</span>
      </div>
      <div class="flex flex-1 items-center justify-center rounded-2xl p-6" :style="{ color: right }">
        <span class="text-5xl font-extrabold">Tea</span>
      </div>
    </div>
  </div>
</template>
