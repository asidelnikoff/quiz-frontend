<script setup>
import { RouterView } from 'vue-router'
import { Toast, ConfirmDialog, DynamicDialog } from 'primevue';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner.vue';
import { isLoading } from './components/LoadingSpinner/state.js';
</script>

<template>
  <div>
    <RouterView />
  </div>
  <Toast />
  <ConfirmDialog />
  <DynamicDialog />
  <LoadingSpinner :isLoading="isLoading" />
</template>
