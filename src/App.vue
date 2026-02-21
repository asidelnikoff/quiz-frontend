<script setup>
import { RouterView } from 'vue-router'
import DarkModeToggler from './components/DarkModeToggler.vue';
import { Toast, ConfirmDialog, DynamicDialog } from 'primevue';
import Sidepanel from './components/Sidepanel/Sidepanel.vue';
import { sidebarWidth, isVisible } from './components/Sidepanel/state';
</script>

<template>
    <Sidepanel v-if="isVisible" />
    <div :style="{ 'margin-left': sidebarWidth }">
      <RouterView />
    </div>
    <div style="position: fixed; bottom: 2%; right: 1%;">
      <DarkModeToggler/>
    </div>
    <Toast />
    <ConfirmDialog/>
    <DynamicDialog />
</template>
