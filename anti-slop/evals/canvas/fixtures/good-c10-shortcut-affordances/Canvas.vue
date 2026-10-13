<!--
  GOOD-CONTROL (C10) — a bespoke in-canvas control cluster for an animated race
  slide that gets every keyboard-shortcut affordance right:

  a. The "Race settings" overlay moves focus INTO the dialog on open, traps
     Tab / Shift+Tab within it, and returns focus to the trigger on close.
  b. Every actionable button shows its shortcut, and the single-character chip is
     a 24 x 24 SQUARE with radius 4 and a 14px / 400 key.
  c. The labelled "Start race" button shows its shortcut inline next to the label
     (not a "Press X" tooltip).
  d. The icon-only mute button's tooltip shows its name followed by the shortcut
     chip ("Mute music" + M), and its aria-label is "Mute music (M)".

  Colour/font come from xprops (C1 clean) and controls use the library <a-button>.
  Expected: C10 PASS.
-->
<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'
import { Button as AButton, Tooltip as ATooltip } from 'ant-design-vue'
import IconMute from './IconMute.vue'

const { slideProps, presentationProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
const fontFamily = computed(() => presentationProps.value?.fontFamily ?? 'Plus Jakarta Sans')

function start() {}
function toggleMute() {}

// a. focus-trapping overlay
const open = ref(false)
const dialog = ref<HTMLElement | null>(null)
let trigger: HTMLElement | null = null

async function openSettings(e: MouseEvent) {
  trigger = e.currentTarget as HTMLElement       // remember what to restore focus to
  open.value = true
  await nextTick()
  dialog.value?.querySelector<HTMLElement>('button, [href], input, [tabindex]')?.focus()
}
function closeSettings() {
  open.value = false
  trigger?.focus()                               // return focus to the trigger
}
function trapTab(e: KeyboardEvent) {
  if (e.key !== 'Tab' || !dialog.value) return
  const f = dialog.value.querySelectorAll<HTMLElement>(
    'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')
  const first = f[0], last = f[f.length - 1]
  if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault() }
  else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault() }
}
</script>

<template>
  <div class="stage" :style="{ color: textColour, fontFamily }">
    <!-- ...animated race track omitted... -->

    <!-- top-right: icon-only mute — tooltip is the name + the shortcut chip; aria-label carries the key -->
    <div class="controls-tr">
      <a-tooltip>
        <template #title>Mute music <kbd class="key" aria-hidden="true">M</kbd></template>
        <a-button
          shape="circle"
          aria-label="Mute music (M)"
          @click="toggleMute"
        >
          <IconMute />
        </a-button>
      </a-tooltip>
      <a-button title="Race settings (R)" aria-label="Race settings (R)" @click="openSettings">
        Settings <kbd class="key">R</kbd>
      </a-button>
    </div>

    <!-- bottom-centre: labelled start — inline SQUARE chip next to the label -->
    <div class="controls-bc">
      <a-button type="primary" @click="start">
        Start race <kbd class="key">S</kbd>
      </a-button>
    </div>

    <!-- focus-trapping settings overlay -->
    <div
      v-if="open"
      ref="dialog"
      class="dialog"
      role="dialog"
      aria-modal="true"
      aria-label="Race settings"
      @keydown="trapTab"
    >
      <label>Laps <input type="number" min="1" /></label>
      <a-button @click="closeSettings">Done <kbd class="key">↵</kbd></a-button>
    </div>
  </div>
</template>

<style scoped>
.stage { position: relative; height: 100%; }
.controls-tr { position: absolute; top: 16px; right: 16px; display: flex; gap: 8px; }
.controls-bc { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); }
.dialog {
  position: absolute; inset: auto 16px 16px auto;
  background: color-mix(in srgb, currentColor 6%, transparent);
  border-radius: 8px; padding: 16px;
}
/* a single-character key is a 24 x 24 SQUARE with radius 4, never a 9999px pill */
.key {
  display: inline-grid; place-items: center;
  min-width: 24px; height: 24px;
  padding: 0 6px;                /* only multi-character keys grow past the square */
  border-radius: 4px;
  margin-left: 8px;
  font-size: 14px; font-weight: 400;
  font-variant-numeric: tabular-nums;
}
</style>
