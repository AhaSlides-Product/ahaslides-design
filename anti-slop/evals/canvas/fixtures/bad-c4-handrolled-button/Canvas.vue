<!--
  BAD-EXAMPLE (C4, reuse-the-library axis) — canUsePluginActionButtons is OFF, so
  an in-canvas action fallback is legitimate (C3 is not the issue here). The button
  is even styled to look like the correct solid white secondary. It is STILL a FAIL:
  it is a hand-rolled <button> with bespoke fill/border/radius CSS instead of the
  project's Ant Design Vue <Button> under ConfigProvider. Judge on HOW it is built,
  not how it looks. Expected: C4 FAIL.
-->
<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

const { slideProps } = usePresenterPlugin()
const textColour = computed(() => slideProps.value?.textColour ?? '#313131')
function showCorrect() {}
</script>

<template>
  <div class="stage" :style="{ color: textColour }">
    <!-- ... results ... -->
    <div class="actions">
      <!-- ❌ hand-rolled: looks like the white secondary, but it is a raw <button>
           with bespoke CSS, not the Ant <Button> the design system ships. -->
      <button class="poll-action" @click="showCorrect">Show correct answer</button>
    </div>
  </div>
</template>

<style scoped>
.stage { height: 100%; display: flex; flex-direction: column; }
.actions { margin-top: auto; display: flex; justify-content: center; padding: 16px; }
.poll-action {
  background: #ffffff;               /* pixel-correct white secondary… but hand-rolled */
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  color: #1a1a2e;
  font-weight: 700;
  font-size: 16px;
  padding: 10px 22px;
}
</style>
