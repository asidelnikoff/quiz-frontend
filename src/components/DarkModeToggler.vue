<script setup>
import { ToggleButton } from 'primevue';
import { useDark, useToggle } from '@vueuse/core'

const isDark = useDark();
const toggleDark = useToggle(isDark);
var isChecked = !(isDark.value);
</script>

<template>
    <ToggleButton @click="toggleDark()" v-model="isChecked">
        <i class="pi pi-sun" alt="light" />
    </ToggleButton>
</template>