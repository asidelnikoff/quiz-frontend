<script setup>
import { inject, ref } from 'vue';
import { Button, Checkbox, ProgressSpinner } from 'primevue';
import { useToast } from 'primevue';
import quizService from '@/api/services/quizService';

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
                toast.add({ severity: 'success', summary: 'Тест удален', life: 3000 });
                console.log('emitting')
                emit('delete');
            }
        })
        .catch(error => {
            let message = '';
            if (error.response.data.error_description) {
                message = error.response.data.error_description
            }
            else {
                message = 'Непредвиденная ошибка. Попробуйте снова'
            }
            toast.add({ severity: 'error', summary: 'Ошибка удаления', detail: message, life: 3000 });
        })
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
    <div v-if="isLoading" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
    </div>
    <div v-if="isLoading" class="center">
        <ProgressSpinner style="height: 10rem;" />
    </div>
</template>