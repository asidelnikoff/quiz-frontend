<script setup>
import { watch, ref, computed } from 'vue';
import { InputText, DataTable, Paginator, Column, Button } from 'primevue';
import quizService from '@/api/services/quizService';
import { formatDate, formatFromMillisecondsTime } from '@/components/utils/dateFormat';

const questions = ref([]);
const totalItems = ref(0);
const currentPage = computed(() => (first.value / perPage.value) + 1);
const perPage = ref(20);
const first = ref(0);
const searchQuery = ref(null);
const isLoading = ref(false);
const isDescSort = ref(true);

const fetchResults = async () => {
    isLoading.value = true;
    try {
        const response = await quizService.getResults({
            search: searchQuery.value,
            limit: perPage.value,
            page: currentPage.value,
            sort_direction: isDescSort.value ? 'desc' : 'asc'
        });
        questions.value = response.data.items || [];
        console.log(questions);
        totalItems.value = response.data.count || 0;
    } catch (error) {
        console.error('Error fetching results:', error);
        questions.value = [];
        totalItems.value = 0;
    } finally {
        isLoading.value = false;
    }
};

// Initial fetch
fetchResults();

// Watch for page changes and refetch
watch([first, perPage], () => {
    fetchResults();
});

watch(searchQuery, () => {
    fetchResults();
})

// Watch for empty page and switch to previous page
watch([questions, totalItems], ([newQuestions, newTotalItems]) => {
    if (newQuestions.length === 0 && currentPage.value > 1 && newTotalItems > 0) {
        currentPage.value = Math.max(1, currentPage.value - 1);
        fetchResults();
    }
});

const toggleSortDirection = () => {
    isDescSort.value = !isDescSort.value;
    fetchResults();
}
</script>

<template>
    <main>
        <div class="flex flex-col items-left gap-10">
            <h1 class="font-bold text-3xl">Мои результаты</h1>
            <div class="flex flex-col w-ull gap-5">
                <InputText v-model="searchQuery" fluid placeholder="Введите название теста" />
                <DataTable :value="questions" :loading="isLoading" scrollable scrollHeight="flex"
                    style="max-height: 58vh;">
                    <template #empty> Нет результатов для отображения </template>
                    <Column header="#">
                        <template #body="slotProps">
                            {{ slotProps.index + 1 + first }}
                        </template>
                    </Column>
                    <Column field="quiz_name" header="Название теста"></Column>
                    <Column field="date">
                        <template #header>
                            <div class="flex flex-row items-center gap-2">
                                <p class="p-datatable-column-title">Дата выполнения</p>
                                <Button variant="link" @click="toggleSortDirection">
                                    <i v-if="isDescSort" class="pi pi-sort-amount-down"></i>
                                    <i v-else class="pi pi-sort-amount-up"></i>
                                </Button>
                            </div>
                        </template>
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.date) }}
                        </template>
                    </Column>
                    <Column field="time_spent" header="Время">
                        <template #body="slotProps">
                            {{ formatFromMillisecondsTime(slotProps.data.time_spent) }}
                        </template>
                    </Column>
                    <Column header="Результат">
                        <template #body="slotProps">
                            <b>{{ slotProps.data.correct_answers }} / {{ slotProps.data.total_questions }}</b> ({{
                                (slotProps.data.result).toFixed(2) }}%)
                        </template>
                    </Column>
                </DataTable>
                <div class="flex flex-row justify-between items-center">
                    <span></span>
                    <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
                        :rowsPerPageOptions="[20, 40, 60, 100]" />
                    <span></span>
                </div>
            </div>
        </div>
    </main>
</template>