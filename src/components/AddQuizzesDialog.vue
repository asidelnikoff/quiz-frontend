<script setup>
import { Paginator } from 'primevue';
import { useToast } from 'primevue';
import groupService from '@/api/services/groupService';
import { inject, ref, watch, computed } from 'vue';
import TestsTable from './TestsTable.vue';
import quizService from '@/api/services/quizService';

const dialogRef = inject('dialogRef')
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
  console.log('selected', id)
  if (!id) {
    return
  }
  const groupId = dialogRef.value.data.groupId;
  groupService.addQuizToGroup(groupId, { quiz_id: id })
    .then(_ => {
      emit('testAdd')
      toast.add({ severity: 'success', summary: 'Тест добавлен', life: 3000 });
    })
    .catch(error => {
      let message = '';
      if (error.status < 500) {
        message = error.response.data.error_description
        if (error.response?.data?.error_code === 'quiz_not_exists') {
          message = 'Тест не найден'
        }
        if (error.response?.data.error_code === 'quiz_in_group') {
          message = 'Выбранный тест уже добавлен в группу'
        }
      }
      else if (error.status) {
        message = 'Непредвиденная ошибка добавления теста. Попробуйте снова'
      }
      else {
        message = error.message;
      }
      toast.add({ severity: 'error', summary: 'Ошибка', detail: message, life: 3000 });
    })
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