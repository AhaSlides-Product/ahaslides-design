<!--
  BAD-EXAMPLE (C5, size axis) — the "hero passes, chrome fails" miss (This or That,
  AHAM-642). This is the case the judge most often waves through: the big central
  text is large and legible, so a reviewer eyeballs it, says "sizes fine", and never
  enumerates the small peripheral chrome.

  The hero (the prompt + the two option cards) is text-4xl/text-5xl — fine. But every
  bit of surrounding chrome the presenter actually reads from across the room is below
  the 16px floor:
    · the progress pill `Q1 of 5`        → text-xs (12px)
    · the responded / voted counter      → text-sm (14px)
    · the live vote-count labels         → text-sm (14px)
    · the corner watermark               → text-xs (12px)  (this one is decorative)
  Meaningful chrome below 16px is a C5 FAIL. Colour/font come from xprops (C1 clean),
  so this isolates C5. The correct verdict ENUMERATES each small label with its px and
  fails C5 — it does not stop at "the hero text is large". Fix: raise the meaningful
  chrome to a scale role (caption `text-base` 16px minimum); only a genuinely
  decorative watermark may stay smaller, and only if named as the exception.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps, presentationColorPaletteProps } = usePresenterPlugin()
const deckInk = computed(() => slideProps.value?.textColour ?? '#1A1A2E')
const deckFont = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
const left = computed(() => presentationColorPaletteProps.value?.[1] ?? '#6A1EBB')
const right = computed(() => presentationColorPaletteProps.value?.[0] ?? '#FF4081')
</script>

<template>
  <div class="flex h-full flex-col px-10 py-8" :style="{ color: deckInk, fontFamily: deckFont }">
    <!-- chrome row: progress (left) + voted counter (right) — BOTH sub-16 -->
    <div class="flex items-center justify-between">
      <span class="text-xs font-bold uppercase tracking-widest">Q1 of 5</span>   <!-- ❌ 12px -->
      <span class="text-sm tabular-nums opacity-60">0 / 12 voted</span>          <!-- ❌ 14px -->
    </div>

    <!-- hero: large + legible (this is what a lazy reviewer checks) -->
    <div class="mt-6 text-center">
      <span class="text-4xl font-extrabold">Pick your morning</span>            <!-- ✅ 36px -->
    </div>
    <div class="mt-6 flex flex-1 items-stretch gap-4">
      <div class="flex flex-1 items-center justify-center rounded-2xl p-6" :style="{ color: left }">
        <span class="text-5xl font-extrabold">Coffee</span>                     <!-- ✅ 48px -->
      </div>
      <div class="flex flex-1 items-center justify-center rounded-2xl p-6" :style="{ color: right }">
        <span class="text-5xl font-extrabold">Tea</span>
      </div>
    </div>

    <!-- vote-count labels — sub-16 -->
    <div class="mt-2 flex justify-between text-sm font-bold tabular-nums">        <!-- ❌ 14px -->
      <span :style="{ color: left }">0 votes</span>
      <span :style="{ color: right }">0 votes</span>
    </div>

    <!-- corner watermark — sub-16, but decorative/non-informational -->
    <div class="mt-6">
      <span class="text-xs uppercase tracking-wide opacity-40">ahaslides.com</span> <!-- 12px, decorative -->
    </div>
  </div>
</template>
