<!--
  BAD (C12) — a full-canvas This-or-That that DROPS the presenter's title.

  plugin-manifest.json declares setting.enableFullScreen: true, so the host hides
  ALL its chrome — including the title bar it draws in framed mode. The presenter
  fills in the host "Your question" field, which reaches the plugin as
  slideProps.title. This canvas renders each option's prompt and its vote tally but
  NEVER reads slideProps.title, so the question the presenter typed is collected in
  the editor and silently vanishes on the presenting screen.

  Everything else is intentionally clean — colours/font from xprops, legible sizes,
  palette bars — so this fixture isolates C12 (a reviewer scanning C7 alone lets it
  through; C12 is the criterion that catches it).
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps, presentationProps, presentationColorPaletteProps } = usePresenterPlugin()

// C1 — colour/font from xprops; only a host-side fallback constant, as a fallback.
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
const palette = computed(() => presentationColorPaletteProps.value ?? [])

// C8 — locale-aware percentage formatting.
const language = computed(() => presentationProps.value?.language ?? 'en')
const pct = (n: number) =>
  new Intl.NumberFormat(language.value, { style: 'percent', maximumFractionDigits: 0 }).format(n / 100)

// The two "This / That" options, each with its own prompt and vote share.
const options = computed(() => slideProps.value?.options ?? [])
// ❌ C12 — slideProps.title (the presenter's "Your question") is never read anywhere.
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <!-- ❌ C12 — full-canvas, but no host title is rendered. Only the per-option
         prompts appear; the presenter's slideProps.title is dropped. -->
    <div class="options">
      <section v-for="(opt, i) in options" :key="opt.id" class="option">
        <h2 class="prompt">{{ opt.label }}</h2>
        <span class="bar-track" aria-hidden="true">
          <span class="bar-fill" :style="{ width: pct(opt.share), background: palette[i % palette.length] }" />
        </span>
        <span class="share">{{ pct(opt.share) }}</span>
      </section>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; padding: 4vh 5vw; }
.options { display: flex; gap: 4vw; height: 100%; align-items: center; }
.option { flex: 1; text-align: center; }
/* legible fixed-px roles — this fixture isolates C12, not C13 */
.prompt { font-size: 32px; font-weight: 600; }
.share { font-size: 24px; font-weight: 600; font-variant-numeric: tabular-nums; }
.bar-track { display: block; height: 1.6vh; background: color-mix(in srgb, currentColor 10%, transparent); border-radius: 999px; }
.bar-fill { display: block; height: 100%; border-radius: 999px; }
</style>
