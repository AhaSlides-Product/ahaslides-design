<!--
  BAD-EXAMPLE (C10, square-chip axis) — a labelled in-canvas control that DOES
  show its keyboard shortcut inline, but the single-character chip is drawn as a
  wide PILL (border-radius 9999px, padded wider than tall) instead of a square.
  A pill reads as a tag/label; a one-character key must read as a key — a square
  (equal width & height, small rounded corners).

  Colour/font come from xprops (C1 clean) and the button is the library
  <a-button> (C4 clean), so this isolates C10 → the only expected FAIL is C10.
  Fix: render the one-character chip as a square (equal min-width/height, small
  radius), never a 9999px pill.
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
      <!-- inline chip is present, but ❌ shaped as a wide pill, not a square -->
      <a-button @click="start">
        Start race <kbd class="key">S</kbd>
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; }
.controls { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); }
.key {
  /* ❌ wide pill: 9999px radius and horizontal padding wider than tall */
  display: inline-block;
  border-radius: 9999px;
  padding: 2px 12px;
  margin-left: 6px;
}
</style>
