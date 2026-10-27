<!--
  BAD (C13) — a framed result slide whose meaningful on-canvas text is illegibly
  tiny. The host draws the title (framed, enableFullScreen: false), so this canvas
  renders only the answer area. Bindings, non-colour cues and the manifest are all
  clean; the ONLY defect is that the answer labels and vote counts are rendered well
  below the 16px floor — 11px, and a vh-based size that resolves to ~11px against the
  ~498px framed iframe viewport. It looks fine in the small editor preview and is a
  few pixels tall on the projector. Isolates C13.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
// C2 — semantic tokens bundled in the plugin build.
import { colorSuccess, colorError } from '@/iframe/brandTokens'
import { useLabels } from './labels'

const { slideProps, presentationProps, presentationColorPaletteProps } = usePresenterPlugin()

const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
const palette = computed(() => presentationColorPaletteProps.value ?? [])

const language = computed(() => presentationProps.value?.language ?? 'en')
const labels = useLabels(language)
const pct = (n: number) =>
  new Intl.NumberFormat(language.value, { style: 'percent', maximumFractionDigits: 0 }).format(n / 100)

const rows = computed(() => slideProps.value?.rows ?? [])
</script>

<template>
  <!-- framed: the host draws the title; this canvas renders only the answer area -->
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <ul class="rows">
      <li v-for="(row, i) in rows" :key="row.id" class="row">
        <span
          class="mark"
          :style="{ color: row.isCorrect ? colorSuccess : colorError }"
          role="img"
          :aria-label="row.isCorrect ? labels.correct : labels.incorrect"
        >{{ row.isCorrect ? '✓' : '✗' }}</span>

        <!-- ❌ C13 — the answer label is 11px: illegible from across the room -->
        <span class="answer">{{ row.answer }}</span>

        <span class="bar-track" aria-hidden="true">
          <span class="bar-fill" :style="{ width: pct(row.share), background: palette[i % palette.length] }" />
        </span>
        <!-- ❌ C13 — a vh font-size resolves to ~11px against the framed viewport -->
        <span class="share">{{ pct(row.share) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; padding: 4vh 5vw; }
.row { display: flex; align-items: center; gap: 1.5vh; }
.mark { font-size: 24px; }
/* ❌ C13 — meaningful text well below the 16px legible floor */
.answer { font-size: 11px; font-weight: 400; }   /* 11px — illegible on a projector */
.share  { font-size: 2.3vh; font-weight: 600; }  /* ~11px against the framed iframe viewport */
.bar-track { flex: 1; height: 1.6vh; background: color-mix(in srgb, currentColor 10%, transparent); border-radius: 999px; }
.bar-fill { display: block; height: 100%; border-radius: 999px; }
</style>
