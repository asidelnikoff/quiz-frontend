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
    <div class="flex flex-col items-left gap-10">
        <h1 class="font-bold text-3xl">Выбор вопросов</h1>
        <QuestionsTable mode="select"/>
    </div>
  </main>
</template>