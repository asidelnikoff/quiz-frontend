<script setup>
import { ProgressSpinner } from 'primevue';

const isLoading = defineModel('isLoading')
</script>

<template>
    <div v-if="isLoading" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
    </div>
    <div v-if="isLoading" class="center">
        <ProgressSpinner style="height: 10rem;" />
    </div>
</template>