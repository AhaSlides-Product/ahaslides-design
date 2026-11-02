<!--
  BAD-EXAMPLE — a slide action shipped as a transparent GHOST button, hand-rendered
  inside the canvas. The project runs with canUsePluginActionButtons ON.

  Expected: C3 FAIL (rendered in-canvas instead of declared in the manifest) AND
  C4 FAIL (reads as a ghost/outline button, not the design-system solid
  white-background secondary). This exercises the C4 "ghost ≠ white secondary"
  rule that the build skill (aha-design-canvas §5) also teaches.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { useLabels } from './labels'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
const labels = useLabels(computed(() => presentationProps.value?.language ?? 'en'))

function showCorrect() {
  /* reveal the answer key */
}
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <h1 class="title">{{ labels.title }}</h1>

    <!-- ❌ A slide action rendered inside the canvas AND styled as a see-through
         ghost/outline button instead of the design-system solid white secondary. -->
    <button class="poll-action" @click="showCorrect">
      {{ labels.showCorrectAnswer }}
    </button>
  </div>
</template>

<style scoped>
.stage { height: 100%; padding: 4vh 5vw; }
.title { font-size: 48px; font-weight: 800; text-align: center; }
.poll-action {
  background: transparent;          /* ghost fill — the deck background shows through */
  border: 1px solid currentColor;   /* hand-rolled outline, not the DS secondary */
  color: inherit;
  padding: 1vh 2.2vh;
  border-radius: 999px;
  font-weight: 700;
}
</style>
