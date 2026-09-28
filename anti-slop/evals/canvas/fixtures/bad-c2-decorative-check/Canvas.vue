<script setup lang="ts">
import { computed } from 'vue'
import { usePresenterPlugin } from '@aha/ui'

// An opinion poll ("This or That"): two options, NO correct answer. Ink/font track
// the deck (C1 clean); the option labels are legible (C5 clean).
const { slideProps, presentationProps } = usePresenterPlugin()
const deckInk = computed(() => slideProps.value?.textColour ?? '#1A1A2E')
const deckFont = computed(() => presentationProps.value?.fontFamily ?? undefined)

const phase = 'reveal' // voting has ended; showing the result
const secondsLeft = 0
</script>

<template>
  <div class="stage" :style="{ color: deckInk, fontFamily: deckFont }">
    <!-- The countdown chip flips to a ✓ once voting ends. But this is an opinion
         poll — there is NO correct answer — so the ✓ is a false correct/incorrect
         cue: it tells the room "this is right" when nothing is. -->
    <div class="timer-chip" :style="{ background: deckInk, color: '#fff' }">
      {{ phase === 'voting' ? secondsLeft : '✓' }}
    </div>

    <div class="options">
      <div class="card">Early bird <span class="pct">100%</span></div>
      <div class="card">Night owl <span class="pct">0%</span></div>
    </div>
  </div>
</template>

<style scoped>
.stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  height: 100%;
  padding: 2rem;
}
.timer-chip {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 999px;
  font-weight: 600;
}
.options {
  display: flex;
  gap: 1rem;
  width: 100%;
}
.card {
  flex: 1;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
}
.pct {
  display: block;
  font-size: 2rem;
  font-weight: 600;
}
</style>
