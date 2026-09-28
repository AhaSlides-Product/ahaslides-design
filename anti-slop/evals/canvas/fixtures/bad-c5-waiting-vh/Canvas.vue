<!--
  BAD-EXAMPLE (C5, size axis) — a REAL in-product case from the 2x2 grid canvas.

  The empty-state "waiting" message the room reads is sized `text-[2.3vh]`. vh
  resolves against the framed iframe viewport (~498px), not the 1280×720 stage,
  so it renders ~11px — too small — and its basis wobbles by framing. The stage
  is transform-scaled as a unit, so a fixed-px type-scale role scales fine on its
  own; vh is redundant and wrong.

  Everything else here reads from xprops (C1 clean), so this isolates C5: the
  only expected FAIL is C5. Fix: use a fixed-px role — `text-lg` (body, 18px).
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { useLabels } from './labels'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
const labels = useLabels(computed(() => presentationProps.value?.language ?? 'en'))

const hasResponses = computed(() => false)
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <div class="grid">
      <!-- ...2x2 quadrants and plotted dots omitted... -->
      <div v-if="!hasResponses" class="absolute inset-0 flex items-center justify-center px-[8%]">
        <!-- ❌ raw vh, no floor: shrinks with the scaled iframe -->
        <span class="pill t-70 max-w-full rounded-full px-[2.2vh] py-[1vh] text-center text-[2.3vh] font-medium leading-snug">
          {{ labels.waitingParticipants }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stage { height: 100%; }
.grid { position: relative; aspect-ratio: 1; height: 100%; }
/* .t-70 is a 70% opacity tint of the deck ink. */
.pill { background: color-mix(in srgb, currentColor 8%, transparent); }
</style>
