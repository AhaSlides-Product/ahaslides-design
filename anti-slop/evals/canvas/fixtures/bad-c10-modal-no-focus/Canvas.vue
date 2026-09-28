<!--
  BAD-EXAMPLE (C10, focus-trap axis) — a bespoke in-canvas control the NCB does
  not paint: an animated race slide with its own "Race settings" popover.

  The trigger toggles `open`, but keyboard focus never moves INTO the dialog, Tab
  is not contained (it walks out to the page behind the overlay), and closing the
  dialog does not restore focus to the trigger. Colour/font come from xprops
  (C1 clean) and the controls use the library <a-button> (C4 clean), so this
  isolates C10 → the only expected FAIL is C10.

  Fix: on open, move focus to an element inside the dialog and trap Tab /
  Shift+Tab within it; on close, return focus to the trigger.
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { Button as AButton } from 'ant-design-vue'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')

// ❌ bespoke overlay with no focus management at all.
const open = ref(false)
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <!-- ...animated race track omitted... -->

    <!-- bespoke in-canvas control cluster (not an NCB slide action) -->
    <div class="controls">
      <a-button @click="open = true">Race settings</a-button>
    </div>

    <!-- ❌ opens, but focus never enters it, Tab escapes behind it, and closing
         leaves focus nowhere. -->
    <div v-if="open" class="dialog" role="dialog">
      <p>Laps</p>
      <a-button @click="open = false">Done</a-button>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; }
.controls { position: absolute; top: 16px; right: 16px; }
.dialog {
  position: absolute; inset: auto 16px 16px auto;
  background: color-mix(in srgb, currentColor 6%, transparent);
  border-radius: 8px; padding: 16px;
}
</style>
