<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Paginator } from 'primevue';
import quizService from '@/api/services/quizService';
import UploadTestsDialog from './UploadTestsDialog.vue';
import { showSidebar } from './Sidepanel/state';
import TestsTable from './TestsTable.vue';
import CreateQuizDialog from './CreateQuizDialog.vue';
import { useDialog } from 'primevue';

const router = useRouter();
const dialog = useDialog();
const tests = ref([]);
const totalItems = ref(0);
const currentPage = computed(() => first.value / perPage.value);
const perPage = ref(20);
const first = ref(0);
const isLoading = ref(false);
const searchQuery = ref(null)
const table = ref(null)

const props = defineProps(['type'])

showSidebar();

const isOwned = () => {
  return props.type === 'owned';
}

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
    const response = isOwned()
      ? await quizService.getOwnedQuizzesList(request)
      : await quizService.getAvailableQuizzesList(request);
    tests.value = response.data.items || [];
    totalItems.value = response.data.count || 0;
  } catch (error) {
    console.error('Error fetching tests:', error);
    tests.value = [];
    totalItems.value = 0;
  } finally {
    isLoading.value = false;
    table.value.getTableRef().getVirtualScrollerRef().scrollToIndex(0);
  }
};

// Initial fetch
fetchTests({ not_changed: true });

watch([first, perPage], () => {
  fetchTests({ not_changed: true });
});

// Watch for empty page and switch to previous page
watch([tests, totalItems], ([newTests, newTotalItems]) => {
  if (newTests.length === 0 && currentPage.value > 1 && newTotalItems > 0) {
    currentPage.value = Math.max(1, currentPage.value - 1);
    fetchTests({ not_changed: true });
  }
});

const toCreateQuiz = () => {
  console.log('creating quiz')
  dialog.open(CreateQuizDialog, {
    props: {
      header: 'Создание теста',
      style: {
        width: '50vw',
      },
      modal: true
    },
    emits: {
      onQuizCreate: toEditQuiz
    }
  });
}

const toEditQuiz = (id) => {
  router.push(`edit-test/${id}`)
}

const goToTest = (id) => {
  router.push(`/test/${id.value}`);
}
</script>

<template>
  <div class="flex flex-col gap-5">
    <TestsTable ref="table" :tests="tests" :isLoading="isLoading" :first="first" :isReadOnly="false" @fetchTests="fetchTests"
      @goToTest="goToTest" />
    <div class="flex justify-between items-center">
      <span></span>
      <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
        :rowsPerPageOptions="[20, 40, 60, 100]" />
      <div v-if="isOwned()" class="flex flex-row gap-4">
        <UploadTestsDialog @testUpload="fetchTests({ not_changed: true })" />
        <Button @click="toCreateQuiz" variant="outlined" label="Создать тест" icon="pi pi-plus-circle"
          iconPos="right"></Button>
      </div>
      <span v-else></span>
    </div>
  </div>
</template>