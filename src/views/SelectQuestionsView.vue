<script setup>
import { onUnmounted } from 'vue';
import { useTestStore } from '@/stores/test';

import QuestionsTable from '@/components/QuestionsTable.vue';

const store = useTestStore()

onUnmounted(() => {
  store.clear()
})

</script>

<template>
  <main>
    <QuestionsTable mode="select"/>
  </main>
</template>