<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Button, DataTable, Column, InputText, useConfirm, Paginator } from 'primevue';
import quizService from '@/api/services/quizService';
import QuestionsTable from '@/components/QuestionsTable.vue';

const router = useRouter();
const questions = ref([]);
const totalItems = ref(0);
const currentPage = computed(() => (first.value / perPage.value) + 1);
const perPage = ref(20);
const first = ref(0);
const searchQuery = ref(null);
const isLoading = ref(false);
const confirm = useConfirm();

const table = ref(null)

const fetchQuestions = async () => {
  isLoading.value = true;
  try {
    const response = await quizService.getQuestionsList({
      search: searchQuery.value,
      limit: perPage.value,
      page: currentPage.value,
    });
    questions.value = response.data.items || [];
    totalItems.value = response.data.count || 0;
  } catch (error) {
    console.error('Error fetching questions:', error);
    questions.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
    table.value.getVirtualScrollerRef().scrollToIndex(0);
  }
};

// Initial fetch
fetchQuestions();

// Watch for page changes and refetch
watch([first, perPage], () => {
  fetchQuestions();
});

watch(searchQuery, () => {
  fetchQuestions();
})

// Watch for empty page and switch to previous page
watch([questions, totalItems], ([newQuestions, newTotalItems]) => {
  if (newQuestions.length === 0 && currentPage.value > 1 && newTotalItems > 0) {
    currentPage.value = Math.max(1, currentPage.value - 1);
    fetchQuestions();
  }
});

// Navigation methods
const goToCreate = () => {
  router.push('/create-question');
};

const editQuestion = (id) => {
  router.push(`/edit-question/${id}`);
};

const openDeleteDialog = (id, text) => {
  confirm.require({
    message: `Уверены, что хотите удалить вопрос: ${text}`,
    header: 'Удалить вопрос?',
    rejectProps: {
      label: 'Отмена',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Удалить',
      icon: 'pi pi-trash',
      iconPos: 'right'
    },
    accept: () => {
      deleteQuestion(id);
    }
  });
};

const deleteQuestion = async (id) => {
  await quizService.deleteQuestion(id);
  fetchQuestions();
};
</script>

<template>
  <main>
    <QuestionsTable mode="view" />
  </main>
</template>
