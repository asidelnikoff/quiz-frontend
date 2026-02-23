<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Button, DataTable, Column, InputText, useConfirm, Paginator } from 'primevue';
import quizService from '@/api/services/quizService';

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
    <div class="flex flex-col items-left gap-10">
      <h1 class="font-bold text-3xl">Мои вопросы</h1>
      <div class="flex flex-col gap-5">
        <InputText v-model="searchQuery" fluid placeholder="Введите текст вопроса" />
        <DataTable ref="table" :value="questions" :loading="isLoading" scrollable scrollHeight="58vh" style="max-height: 58vh;" :virtualScrollerOptions="{ itemSize: 67 }">
          <template #paginatorstart>
            <span></span>
          </template>
          <template #paginatorend>
          </template>
          <template #empty> Нет вопросов для отображения </template>
          <Column header="#">
            <template #body="slotProps">
              {{ slotProps.index + 1 + first }}
            </template>
          </Column>
          <Column field="question" header="Вопрос"></Column>
          <Column>
            <template #body="slotProps">
              <div class="flex justify-end">
                <Button @click="editQuestion(slotProps.data.id)" variant="text" icon="pi pi-pencil"></Button>
                <Button @click="openDeleteDialog(slotProps.data.id, slotProps.data.question)" variant="text"
                  icon="pi pi-trash"></Button>
              </div>
            </template>
          </Column>
        </DataTable>
        <div class="flex justify-between items-center">
          <span></span>
          <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
            :rowsPerPageOptions="[20, 40, 60, 100]" />
          <div>
            <Button @click="goToCreate" variant="outlined" label="Создать вопрос" icon="pi pi-plus-circle"
              iconPos="right"></Button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
