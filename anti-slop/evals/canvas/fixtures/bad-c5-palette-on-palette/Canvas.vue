<!--
  BAD-EXAMPLE (C5, contrast axis) — the palette-on-palette trap (This or That,
  AHAM-642, "the colours really lack contrast").

  Each option card is filled with the deck's LIGHTER-palette shade
  (`presentationLighterColorPalette[0]`, aka "soft") and its label is painted with a
  deck ACCENT (`presentationColorPalette[1]`). Both come from the deck palette, which
  is a set of brand accents — NOT a background/foreground pair — so nothing guarantees
  they contrast. On a same-hue-family deck (an all-blue palette) the soft fill AND the
  accent label are both blue, so "Coffee"/"Tea" render blue-on-blue (~1.3:1) and all
  but vanish. The timer chip repeats it (soft fill + accent text).

  Colour/font come from xprops so C1 is clean; the violation is C5 contrast. The
  correct verdict flags the two-palette-entries pairing FROM THE CODE (it can't be seen
  on the workbench's default palette). Fix: derive the ink from the fill
  (`isLightColour(fill) ? space : white`) or fill each card with its OWN side accent and
  contrast against that — never a second unrelated palette pick for the text.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps, presentationColorPaletteProps, presentationLighterColorPaletteProps } =
  usePresenterPlugin()
const deckFont = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
// left = palette[1], right = palette[0]; soft = lighterPalette[0].
const left = computed(() => presentationColorPaletteProps.value?.[1] ?? '#6A1EBB')
const right = computed(() => presentationColorPaletteProps.value?.[0] ?? '#FF4081')
const soft = computed(() => presentationLighterColorPaletteProps.value?.[0] ?? '#FDF6FA')
const deckInk = computed(() => slideProps.value?.textColour ?? '#1A1A2E')
</script>

<template>
  <div class="flex h-full flex-col px-10 py-8" :style="{ color: deckInk, fontFamily: deckFont }">
    <!-- timer chip: soft fill + accent text (palette-on-palette) -->
    <div class="flex justify-center">
      <div class="flex h-11 w-11 items-center justify-center rounded-full text-lg font-extrabold"
        :style="{ background: soft, color: left }">14</div>
    </div>
    <div class="mt-6 flex flex-1 items-stretch gap-4">
      <!-- ❌ card fill = soft (palette-lighter), label = accent (palette) -->
      <div class="flex flex-1 items-center justify-center rounded-2xl p-6" :style="{ background: soft }">
        <span class="text-5xl font-extrabold" :style="{ color: left }">Coffee</span>
      </div>
      <div class="flex flex-1 items-center justify-center rounded-2xl p-6" :style="{ background: soft }">
        <span class="text-5xl font-extrabold" :style="{ color: right }">Tea</span>
      </div>
    </div>
  </div>
</template>
