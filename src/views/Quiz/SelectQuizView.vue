<script setup>
import { Paginator, Button } from 'primevue';
import { useToast } from 'primevue';
import groupService from '@/api/services/groupService';
import { ref, watch, computed } from 'vue';
import TestsTable from '@/components/TestsTable.vue';
import quizService from '@/api/services/quizService';
import toastService from '@/components/utils/toastService';
import { useGroupStore } from '@/stores/group';
import { useRouter } from 'vue-router';

const toast = useToast();
const store = useGroupStore()
const router = useRouter()

const quizzes = ref([])
const selectedQuizzes = ref([])
const initalTests = store.getInitialTests
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
    quizzes.value = response.data.items.map(a => {
      return {
        id: a.id,
        questions_number: a.questions_number,
        name: a.name,
        created_at: a.created_at
      }
    }) || [];
    totalItems.value = response.data.count || 0;
    await loadSelectedTests()
    console.log('quizzes', quizzes)
  } catch (error) {
    console.error('Error fetching tests:', error);
    quizzes.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
}

const loadSelectedTests = async () => {
  if (store.getIsEditing) {
    store.setSelectedTests(selectedQuizzes.value);
  }

  selectedQuizzes.value = store.getSelectedTests;
};

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

watch(selectedQuizzes, () => {
  store.setIsEditing(true);
});

const updateSelectedTests = () => {
  store.setIsEditing(false);
  store.setSelectedTests(selectedQuizzes.value);
}

const goBack = () => {
  router.back()
}

const addSelectedTests = async () => {
  isLoading.value = true;
  updateSelectedTests()
  await groupService.addQuizToGroup(selectedQuizzes.value.map(a => {
    return {
      quiz_id: a.id
    }
  }))
    .then(() => {
      toastService.showSuccessMessage(toast, 'Тесты добавлен')
      router.back()
    })
    .catch(error => toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка добавления теста. Попробуйте снова'))
    .finally(() => isLoading.value = false)

};
</script>

<template>
  <div class="flex flex-col items-left gap-10">
    <h1 class="font-bold text-3xl">Выбор тестов</h1>
    <div class="flex flex-col gap-5">
      <TestsTable :tests="quizzes" v-model:selectedTests="selectedQuizzes" v-model:initialTests="initalTests"
        :isLoading="isLoading" :first="first" :isReadOnly="true" @fetchTests="fetchTests" mode="select" />
      <div class="flex justify-between items-center">
        <span></span>
        <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
          :rowsPerPageOptions="[20, 40, 60, 100]" />
        <div class="flex justify-end gap-4 items-center">
          <p>Выбрано: {{ selectedQuizzes.length }}</p>
          <Button label="Отмена" variant="outlined" severity="secondary" @click="goBack"></Button>
          <Button :disabled="selectedQuizzes.length === 0" label="Добавить" @click="addSelectedTests" icon="pi pi-check"
            iconPos="right">
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>