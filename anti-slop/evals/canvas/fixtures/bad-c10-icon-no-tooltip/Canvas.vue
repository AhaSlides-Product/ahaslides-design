<!--
  BAD-EXAMPLE (C10, icon-tooltip axis) — an icon-only in-canvas control (mute
  music) with no discoverable name or shortcut. An icon button has no room for an
  inline chip, so its tooltip shows the button's NAME followed by the shortcut
  chip ("Mute music" + M) and its aria-label is the name plus the shortcut in
  parentheses, "Mute music (M)". Here the aria-label is a bare "Mute" and there
  is no tooltip carrying the name and shortcut, so a viewer can't tell what it
  does or which key toggles it.

  Colour/font come from xprops (C1 clean) and the button is the library
  <a-button> (C4 clean), so this isolates C10 → the only expected FAIL is C10.
  Fix: wrap it in a tooltip showing "Mute music" and an M chip, and set
  aria-label to "Mute music (M)".
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { Button as AButton } from 'ant-design-vue'
import IconMute from './IconMute.vue'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')
function toggleMute() {}
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <!-- ...animated race track omitted... -->
    <div class="controls">
      <!-- ❌ icon-only, bare "Mute" aria-label, no name+shortcut tooltip -->
      <a-button shape="circle" aria-label="Mute" @click="toggleMute">
        <IconMute />
      </a-button>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; }
.controls { position: absolute; top: 16px; right: 16px; }
</style>
