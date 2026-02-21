<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTestStore } from '@/stores/test';
import { Button, DataTable, Column, InputText, Paginator } from 'primevue';
import quizService from '@/api/services/quizService';

// State
const searchQuery = ref(null);
const selectedQuestions = ref([]);
const router = useRouter();
const route = useRoute();
const store = useTestStore();
const questions = ref([]);
const totalItems = ref(0);
const currentPage = computed(() => (first.value / perPage.value) + 1);
const perPage = ref(20);
const first = ref(0);
const isLoading = ref(false);

const fetchQuestions = async () => {
  isLoading.value = true;
  if (store.getIsEditing) {
    store.setSelectedQuestions(selectedQuestions.value);
  }
  try {
    const response = await quizService.getQuestionsList({
      search: searchQuery.value,
      limit: perPage.value,
      page: currentPage.value,
    });
    questions.value = response.data.items || [];
    totalItems.value = response.data.count || 0;
    await loadSelectedQuestions();
  } catch (error) {
    console.error('Error fetching questions:', error);
    questions.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
  }
};

const loadSelectedQuestions = async () => {
  const testId = route.params.id;
  if (testId) {
    const loadedTest = (await quizService.getQuizQuestions(testId, false)
      .catch(() => { data: null })).data;
    if (loadedTest && store.getSelectedQuestions.length === 0) {
      console.log('setting selected questions');
      store.setSelectedQuestions(loadedTest.questions.map((q) => ({ ...q })));
    }
  }
  selectedQuestions.value = store.getSelectedQuestions;
  console.log(selectedQuestions.value)
};

// Initial fetch
fetchQuestions();

// Watch for page changes and refetch
watch([first, perPage], () => {
  fetchQuestions();
});

watch([questions, totalItems], ([newQuestions, newTotalItems]) => {
  if (newQuestions.length === 0 && currentPage.value > 1 && newTotalItems > 0) {
    currentPage.value = Math.max(1, currentPage.value - 1);
    fetchQuestions();
  }
});

watch(searchQuery, () => {
  fetchQuestions();
})

watch(selectedQuestions, () => {
  store.setIsEditing(true);
});

// Methods
const goToCreateQuestion = () => {
  store.setIsEditing(false);
  store.setSelectedQuestions(selectedQuestions.value);
  router.push('/create-question');
};

const editQuestion = (id) => {
  store.setIsEditing(false);
  store.setSelectedQuestions(selectedQuestions.value);
  router.push(`/edit-question/${id}`);
};

const addSelectedQuestions = () => {
  store.setSelectedQuestions(selectedQuestions.value);
  store.setIsEditing(false);
  router.back();
};
</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-10">
      <h1 class="font-bold text-3xl">Выбор вопросов</h1>
      <div class="flex flex-col w-full gap-5">
        <InputText v-model="searchQuery" placeholder="Введите текст вопроса" />
        <DataTable v-model:selection="selectedQuestions" :value="questions" :loading="isLoading" scrollable
          scrollHeight="flex" style="max-height: 58vh;">
          <template #empty> Нет вопросов для отображения </template>
          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
          <Column field="question" header="Вопрос"></Column>
          <Column headerClass="flex justify-end" class="!text-end">
            <template #header>
              <Button @click="goToCreateQuestion" variant="outlined" label="Создать вопрос" icon="pi pi-plus-circle"
                iconPos="right"></Button>
            </template>
            <template #body="slotProps">
              <Button @click="editQuestion(slotProps.data.id)" variant="text" icon="pi pi-pencil"></Button>
            </template>
          </Column>
        </DataTable>
        <div class="flex justify-between items-center">
          <span></span>
          <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
            :rowsPerPageOptions="[20, 40, 60, 100]" />
          <div class="flex justify-end gap-4 items-center">
            <p>Выбрано: {{ selectedQuestions.length }}</p>
            <Button label="Отмена" variant="outlined" severity="secondary" @click="router.back()"></Button>
            <Button @click="addSelectedQuestions" :disabled="selectedQuestions.length === 0" label="Добавить"
              icon="pi pi-check" iconPos="right">
            </Button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>