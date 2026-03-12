<script setup>
import { Paginator } from 'primevue';
import { useToast } from 'primevue';
import groupService from '@/api/services/groupService';
import { ref, watch, computed } from 'vue';
import TestsTable from './TestsTable.vue';
import quizService from '@/api/services/quizService';
import toastService from './utils/toastService';

const toast = useToast();

const quizzes = ref([])
const isLoading = ref(false)
const first = ref(0)
const totalItems = ref(0);
const currentPage = computed(() => first.value / perPage.value);
const perPage = ref(20);
const searchQuery = ref(null)

const emit = defineEmits(['testAdd'])

const fetchTests = async (query) => {
  isLoading.value = true;
  try {
    if (!query?.not_changed) {
      searchQuery.value = query?.value;
    }
    let request = {
      search: searchQuery.value,
      limit: perPage.value,
      page: currentPage.value + 1
    };
    const response = await quizService.getOwnedQuizzesList(request)
    quizzes.value = response.data.items || [];
    totalItems.value = response.data.count || 0;
  } catch (error) {
    console.error('Error fetching tests:', error);
    quizzes.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
}

fetchTests({ not_changed: true })

watch([first, perPage], () => {
  fetchTests({ not_changed: true });
});

watch([quizzes, totalItems], ([newTests, newTotalItems]) => {
  if (newTests.length === 0 && currentPage.value > 1 && newTotalItems > 0) {
    currentPage.value = Math.max(1, currentPage.value - 1);
    fetchTests({ not_changed: true });
  }
});

const selectTest = (id) => {
  if (!id) {
    return
  }
  
  groupService.addQuizToGroup({ quiz_id: id })
    .then(_ => {
      emit('testAdd')
      toastService.showSuccessMessage(toast, 'Тест добавлен')
    })
    .catch(error => toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка добавления теста. Попробуйте снова'))
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <TestsTable :tests="quizzes" :isLoading="isLoading" :first="first" :isReadOnly="true" @fetchTests="fetchTests"
      @selectQuiz="selectTest" mode="select" />
    <div class="flex justify-between items-center">
      <span></span>
      <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
        :rowsPerPageOptions="[20, 40, 60, 100]" />
      <span></span>
    </div>
  </div>
</template>