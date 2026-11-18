<template>
  <div class="virtual-host-editor-entry">
    <DesignSystemTooltip :text="$i18nPresenter.t('Virtual host')" placement="bottom">
      <DesignSystemButton
        v-aha-emit-action
        name="virtual_host_open_button"
        data-testid="virtual-host-open-button"
        variant="secondary"
        size="md"
        icon-only
        :aria-label="$i18nPresenter.t('Virtual host')"
        @click="onOpen"
      >
        <DesignSystemIcon
          slot="icon"
          name="system-microphone"
          size="16"
          decorative
        />
      </DesignSystemButton>
    </DesignSystemTooltip>
    <VirtualHostDrawer v-if="hasOpened" :open="open" @close="open = false" />
    <HostSimPage v-if="simAsked" :open="simOpen" @close="simOpen = false" />
  </div>
</template>
