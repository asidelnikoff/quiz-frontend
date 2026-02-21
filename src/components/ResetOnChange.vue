<template>
    <slot :key="key" />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const key = ref(0)

const props = defineProps<{
    value: any
}>()

watch(
    () => props.value,
    () => {
        key.value += 1; // Whenever watched value changes increment the key
    },
    { deep: true, immediate: true }
)
</script>