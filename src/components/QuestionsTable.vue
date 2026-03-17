<script setup>
import { ref, watch, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button, DataTable, Column, InputText, useConfirm, Paginator, useToast } from 'primevue';
import quizService from '@/api/services/quizService';
import { useTestStore } from '@/stores/test';
import toastService from './utils/toastService';

const mode = defineModel('mode')

const isSelectingMode = computed(() => mode.value === 'select')
const isViewMode = computed(() => mode.value === 'view')

const selectedQuestions = ref([]);
const router = useRouter();
const route = useRoute();
const questions = ref([]);
const totalItems = ref(0);
const currentPage = computed(() => (first.value / perPage.value) + 1);
const perPage = ref(20);
const first = ref(0);
const searchQuery = ref(null);
const isLoading = ref(false);
const confirm = useConfirm();
const store = useTestStore();
const toast = useToast()

const table = ref(null)

const fetchQuestions = async () => {
    isLoading.value = true;
    try {
        console.log('got in fetch', store.getSelectedQuestions);
        if (isSelectingMode) {
            await loadSelectedQuestions()
        }
        const response = await quizService.getQuestionsList({
            search: searchQuery.value,
            limit: perPage.value,
            page: currentPage.value,
        });
        questions.value = response.data.items?.map((q) => ({ id: q.id, question: q.question })) || [];
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

const loadSelectedQuestions = async () => {
    if (store.getIsEditing) {
        console.log('im editing')
        store.setSelectedQuestions(selectedQuestions.value);
    }
    selectedQuestions.value = store.getSelectedQuestions;
    console.log(selectedQuestions.value)
    console.log(questions.value)
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

watch(selectedQuestions, () => {
    if (!isSelectingMode) {
        return;
    }
    store.setIsEditing(true);
});

// Navigation methods
const goToCreate = () => {
    updateSelectedQuestions()
    router.push('/create-question');
};

const editQuestion = (id) => {
    updateSelectedQuestions()
    router.push(`/edit-question/${id}`);
};

const addSelectedQuestions = async () => {
    if (!isSelectingMode) {
        return;
    }
    isLoading.value = true;
    updateSelectedQuestions()
    await quizService.updateQuiz(route.params.id, {
        questions: store.getSelectedQuestions.map(item => item.id)
    })
    .then(() => {
        toastService.showSuccessMessage(toast, 'Вопросы теста обновлены')
        router.back()
    })
    .catch(error => toastService.showBackendErrorMessage(toast, error))
    .finally(() => isLoading.value = false)
    
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

const goBack = () => {
    if (isSelectingMode) {
        store.setIsEditing(false)
    }

    router.back()
}

const updateSelectedQuestions = () => {
    if (!isSelectingMode) {
        return
    }
    console.log('updating selected questions')
    store.setIsEditing(false);
    store.setSelectedQuestions(selectedQuestions.value);
}
</script>

<template>
    <div class="flex flex-col items-left gap-10">
        <h1 class="font-bold text-3xl">{{ isViewMode ? 'Мои вопросы' : 'Выбор вопросов' }}</h1>
        <div class="flex flex-col gap-5">
            <InputText v-model="searchQuery" fluid placeholder="Введите текст вопроса" />
            <DataTable ref="table" v-model:selection="selectedQuestions" :value="questions" :loading="isLoading"
                scrollable scrollHeight="58vh" style="max-height: 58vh;" :virtualScrollerOptions="{ itemSize: 67 }">
                <template #paginatorstart>
                    <span></span>
                </template>
                <template #paginatorend>
                </template>
                <template #empty> Нет вопросов для отображения </template>
                <Column v-if="isSelectingMode" selectionMode="multiple" headerStyle="width: 3rem"></Column>
                <Column v-else header="#">
                    <template #body="slotProps">
                        {{ slotProps.index + 1 + first }}
                    </template>
                </Column>
                <Column field="question" header="Вопрос"></Column>
                <Column>
                    <template #header>
                        <Button v-if="isSelectingMode" @click="goToCreate" variant="outlined"
                            label="Создать вопрос" icon="pi pi-plus-circle" iconPos="right"></Button>
                    </template>
                    <template #body="slotProps">
                        <div class="flex justify-end">
                            <Button @click="editQuestion(slotProps.data.id)" variant="text"
                                icon="pi pi-pencil"></Button>
                            <Button v-if="isViewMode"
                                @click="openDeleteDialog(slotProps.data.id, slotProps.data.question)" variant="text"
                                icon="pi pi-trash"></Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
            <div class="flex justify-between items-center">
                <span></span>
                <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
                    :rowsPerPageOptions="[20, 40, 60, 100]" />
                <div v-if="isSelectingMode" class="flex justify-end gap-4 items-center">
                    <p>Выбрано: {{ selectedQuestions.length }}</p>
                    <Button label="Отмена" variant="outlined" severity="secondary" @click="goBack"></Button>
                    <Button @click="addSelectedQuestions" :disabled="selectedQuestions.length === 0" label="Добавить"
                        icon="pi pi-check" iconPos="right">
                    </Button>
                </div>
                <div v-else>
                    <Button @click="goToCreate" variant="outlined" label="Создать вопрос" icon="pi pi-plus-circle"
                        iconPos="right"></Button>
                </div>
            </div>
        </div>
    </div>
</template>
