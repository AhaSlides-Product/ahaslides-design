# Using the design system in Vue 2

The legacy Vue 2 apps (presenter, audience, admin) were built on the old
`stpancras-storybook-app` kit. **New UI in those apps uses the DS `<aha-*>` web components**,
which Vue 2 renders like any other HTML element — no Vue 3, no React, no adapter package.

## The rule

1. **New design uses `<aha-*>`** from this design system — never a `stpancras-storybook-app`
   component for a new screen, panel, dialog or control.
2. **Don't migrate existing screens unless asked.** A screen that already ships on the kit stays
   as it is; a change to it keeps its current components. Move it to `<aha-*>` only when the task
   says so.
3. **One load, pinned.** `lib/all.js` and `tokens.css` are loaded once for the whole app, pinned to
   a release tag — never `@master`, never per component.

## 1. Load the elements and tokens once

In the app's HTML shell (`index.html` / the Nuxt 2 `head`), pinned to the release you tested:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.78.0/lib/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/gh/ahaslides-product/ahaslides-design@v0.78.0/lib/all.js"></script>
```

An app that already installs `@ahaslides-product/design` from GitHub Packages can import the same
two files from its entry point instead (`import '@ahaslides-product/design/all'` and
`import '@ahaslides-product/design/tokens.css'`). Either way, load them once. Bump the tag in one
place when you take a new DS release.

## 2. Tell Vue the `aha-` tags are custom elements

```js
// main.js — before new Vue(...)
Vue.config.ignoredElements = [/^aha-/];
```

Without it Vue 2 warns `Unknown custom element: <aha-button>` on every render.

## 3. Bind props and listen to events

- **Strings, numbers and booleans → attributes.** `size="lg"`, `:current="stage"`,
  `:disabled="busy"` — Vue 2 removes the attribute when the value is `false`, which is what the
  elements expect.
- **Arrays and objects → DOM properties** with the `.prop` modifier (Vue 2.6+):
  `:steps.prop="stages"`, `:options.prop="people"`. Passing a JSON string attribute also works.
- **Events are DOM `CustomEvent`s.** Listen with `@change` / `@input` and read `$event.detail`
  (each component's page lists its events and detail shape). Inputs also let the native `input`
  event bubble out of the shadow root, so handle only the `CustomEvent`.
- **Style through attributes and tokens only.** Scoped styles cannot reach inside the shadow DOM;
  never restyle an `<aha-*>` through `::part` to resize it — use its `size` / `variant` attributes.

## Worked example — a three-stage panel

```vue
<template>
  <div class="panel">
    <aha-stepper :steps.prop="stages" :current="stage" aria-label="Setup progress"></aha-stepper>

    <aha-input
      :value="name"
      placeholder="Session name"
      :status="nameError ? 'error' : null"
      @input="onNameInput"
    ></aha-input>

    <aha-button variant="secondary" :disabled="stage === 0" @click="stage -= 1">Back</aha-button>
    <aha-button variant="primary" :disabled="!name" @click="next">Next</aha-button>
  </div>
</template>

<script>
export default {
  data() {
    return { stages: ['Details', 'Questions', 'Review'], stage: 0, name: '', nameError: false };
  },
  methods: {
    onNameInput(event) {
      if (!(event instanceof CustomEvent)) return;
      this.name = event.detail.value;
      this.nameError = false;
    },
    next() {
      this.stage = Math.min(this.stage + 1, this.stages.length - 1);
    },
  },
};
</script>
```

## Checklist

- [ ] New UI uses `<aha-*>`; no new `stpancras-storybook-app` import.
- [ ] Existing kit screens left as they are unless the task asks for a migration.
- [ ] `all.js` + `tokens.css` loaded once, pinned to a release tag.
- [ ] `Vue.config.ignoredElements = [/^aha-/]` set.
- [ ] Arrays / objects bound with `.prop`; events read from `$event.detail`.
- [ ] No `::part` sizing or recolouring; size and variant through attributes.
