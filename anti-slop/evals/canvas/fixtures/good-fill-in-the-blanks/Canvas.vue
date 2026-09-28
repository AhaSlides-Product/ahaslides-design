<!--
  SHARED GOOD-CONTROL — the canonical "correct canvas" pattern.

  This fixture is referenced BOTH by aha-design-canvas-judge's dataset (as a
  good-control that must score OK TO SHIP) AND by the aha-design-canvas build
  skill (as the recommended reference). If a change to either skill ever makes
  the judge FAIL this file, exactly one of the two skills is wrong — that
  contradiction is the whole point of sharing one fixture.

  A simplified but faithful Fill-in-the-Blanks reveal. Every criterion C1–C9 is
  satisfied positively (not vacuously): ≤8px / pill radius, weight 400/600, no
  pastel-monotone surface. C10 (keyboard-shortcut affordances) passes vacuously —
  this canvas renders no bespoke in-canvas controls of its own; Previous/Next are
  host-painted NCB actions.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
// C2 — semantic state tokens BUNDLED in the plugin build (not from the deck palette).
import { colorSuccess, colorError } from '@/iframe/brandTokens'
// C14 — the deck font is LOADED into the iframe (not merely named on a style).
import { useDeckFont } from '@/iframe/deckFont'
import { useLabels } from './labels'

const { slideProps, presentationProps, presentationColorPaletteProps } = usePresenterPlugin()

// C1 — every colour/font from xprops; only a host-side fallback constant, and only as a fallback.
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
// C14 — inject the deck's @font-face so the named family actually renders.
useDeckFont(fontFamily)
const palette = computed(() => presentationColorPaletteProps.value ?? [])

// C8 — locale initialised from the presentation xprop; number formatting is locale-aware.
const language = computed(() => presentationProps.value?.language ?? 'en')
const labels = useLabels(language)
const pct = (n: number) =>
  new Intl.NumberFormat(language.value, { style: 'percent', maximumFractionDigits: 0 }).format(n / 100)

const blanks = computed(() => slideProps.value?.blanks ?? [])

// C12 — full-canvas, so THIS canvas renders the presenter-entered host title
// (slideProps.title); it would otherwise be dropped once the host hides its chrome.
const hostTitle = computed(() => slideProps.value?.title ?? labels.title)
</script>

<template>
  <!-- C1/C5 — transparent stage: the host owns the background, so ink tracks the
       deck's textColour and contrast is the host theme's guarantee. A scrim keeps
       text legible when the deck carries a background image. -->
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <div v-if="slideProps?.backgroundImage" class="scrim" aria-hidden="true" />

    <!-- C7/C12 — full-canvas (manifest setting.enableFullScreen: true): the host
         hides its chrome, so THIS canvas renders the presenter's host title itself
         (slideProps.title), never silently dropping it. -->
    <h1 class="title">{{ hostTitle }}</h1>

    <ul class="rows">
      <li v-for="(blank, i) in blanks" :key="blank.id" class="row">
        <!-- C2/C6 — the semantic colour sits on the ✓/✗ INDICATOR (bundled token),
             paired with an icon shape + aria-label so colour is never the only cue. -->
        <span
          class="mark"
          :style="{ color: blank.isCorrect ? colorSuccess : colorError }"
          role="img"
          :aria-label="blank.isCorrect ? labels.correct : labels.incorrect"
        >{{ blank.isCorrect ? '✓' : '✗' }}</span>

        <span class="answer">{{ blank.answer }}</span>

        <!-- C2 — the magnitude BAR pulls from the deck palette, never a state colour. -->
        <span class="bar-track" aria-hidden="true">
          <span class="bar-fill" :style="{ width: pct(blank.share), background: palette[i % palette.length] }" />
        </span>
        <span class="share">{{ pct(blank.share) }}</span>
      </li>
    </ul>
    <!-- C3/C4 — Previous / Next are DECLARED in the plugin manifest and painted by
         the host control bar (NCB). This canvas renders no action buttons. -->
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; padding: 4vh 5vw; }
/* C1 — the scrim is a tint of the deck's own surface, not a fixed colour. */
.scrim { position: absolute; inset: 0; background: currentColor; opacity: 0.08; }
/* C5 — sizes scale with the 16:9 stage but never drop below a legible floor. */
/* Fixed logical px (type-scale roles) — the 1280x720 stage transform scales them
   proportionally; no vh, no clamp floor (that would break proportion / is an
   audience concern). title 48 / body 18 / subhead 24. */
.title { font-size: 48px; font-weight: 600; text-align: center; }
.row { display: flex; align-items: center; gap: 1.5vh; }
.answer { font-size: 18px; font-weight: 400; }
.share { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
.mark { font-size: 24px; }
.bar-track { flex: 1; height: 1.6vh; background: color-mix(in srgb, currentColor 10%, transparent); border-radius: 999px; }
.bar-fill { display: block; height: 100%; border-radius: 999px; }
</style>
