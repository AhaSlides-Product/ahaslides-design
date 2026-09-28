<!--
  BAD-EXAMPLE (C10, inline-chip axis) — a labelled in-canvas control whose
  keyboard shortcut is hidden in a hover-only "Press S" tooltip instead of being
  shown inline next to the label. A labelled button must carry its shortcut as an
  always-visible inline chip; a tooltip makes the presenter hunt for it and hides
  it from touch entirely.

  Colour/font come from xprops (C1 clean) and the button is the library
  <a-button> (C4 clean), so this isolates C10 → the only expected FAIL is C10.
  Fix: put the shortcut in an inline <kbd> chip next to the label, not a title
  tooltip.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { Button as AButton } from 'ant-design-vue'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
function start() {}
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <!-- ...animated race track omitted... -->
    <div class="controls">
      <!-- ❌ labelled button, but the shortcut is buried in a hover tooltip -->
      <a-button title="Press S to start" @click="start">Start race</a-button>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; }
.controls { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); }
</style>
