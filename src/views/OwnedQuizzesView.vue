<script setup>
import TestList from '../components/TestList.vue';
</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-10">
      <h1 class="font-bold text-3xl">Мои тесты</h1>
      <TestList type="owned" />
    </div>
  </main>
</template>
