<script setup>
import QuestionsTable from '@/components/QuestionsTable.vue';

</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-10">
        <h1 class="font-bold text-3xl">Мои вопросы</h1>
        <QuestionsTable mode="view" />
    </div>
  </main>
</template>
