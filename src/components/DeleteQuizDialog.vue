<script setup>
import { inject, ref } from 'vue';
import { Button, Checkbox } from 'primevue';
import LoadingSpinner from './LoadingSpinner.vue';
import { useToast } from 'primevue';
import quizService from '@/api/services/quizService';
import toastService from './utils/toastService';

const dialogRef = inject('dialogRef');
const quizName = ref('');
const quizId = ref(null);
const deleteQuestions = ref(false);
const toast = useToast();
const isLoading = ref(false)

const emit = defineEmits(['delete']);

const setInitialValues = () => {
    let name = dialogRef.value.data.quizName;
    let id = dialogRef.value.data.quizId;

    if (!name || !id) {
        closeDialog();
        return;
    }

    quizName.value = name;
    quizId.value = id;
}

setInitialValues();

const deleteQuiz = () => {
    isLoading.value = true
    quizService.deleteQuiz(quizId.value, deleteQuestions.value)
        .then(response => {
            if (response.status === 200) {
                toastService.showSuccessMessage(toast, 'Тест удален')
                emit('delete');
            }
        })
        .catch(error => toastService.showBackendErrorMessage(toast, error))
        .finally(() => {
            isLoading.value = false
            closeDialog()
        })
}

const closeDialog = () => {
    dialogRef.value.close();
}
</script>

<template>
    <div class="flex flex-col gap-5 w-full">
        <p>Уверены, что хотите удалить тест: <b>{{ quizName }}</b>?</p>
        <div class="flex justify-between items-center">
            <p>Удалить привязанные вопросы</p>
            <Checkbox :disabled="isLoading" binary v-model="deleteQuestions" />
        </div>
        <div class="flex flex-row gap-5 justify-end w-full">
            <Button :disabled="isLoading" label="Отмена" variant="outlined" severity="secondary" @click="closeDialog"></Button>
            <Button :disabled="isLoading" label="Удалить" icon="pi pi-trash" icon-pos="right" @click="deleteQuiz"></Button>
        </div>
    </div>
    <LoadingSpinner :is-loading="isLoading"/>
</template>