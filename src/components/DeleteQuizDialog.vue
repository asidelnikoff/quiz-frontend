<script setup>
import { inject, ref } from 'vue';
import { Button, Checkbox } from 'primevue';
import { useToast } from 'primevue';
import quizService from '@/api/services/quizService';

const dialogRef = inject('dialogRef');
const quizName = ref('');
const quizId = ref(null);
const deleteQuestions = ref(false);
const toast = useToast();

const emit = defineEmits(['update']);

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
    quizService.deleteQuiz(quizId.value, deleteQuestions.value)
        .then(response => {
            if (response.status === 200) {
                toast.add({ severity: 'success', summary: 'Тест удален', life: 3000 });
                emit('update');
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
    closeDialog();
}

const closeDialog = () => {
    emit('update');
    dialogRef.value.close();
}
</script>

<template>
    <div class="flex flex-col gap-5 w-full">
        <p>Уверены, что хотите удалить тест: <b>{{ quizName }}</b>?</p>
        <div class="flex justify-between items-center">
            <p>Удалить привязанные вопросы</p>
            <Checkbox binary v-model="deleteQuestions" />
        </div>
        <div class="flex flex-row gap-5 justify-end w-full">
            <Button label="Отмена" variant="outlined" severity="secondary" @click="closeDialog"></Button>
            <Button label="Удалить" icon="pi pi-trash" icon-pos="right" @click="deleteQuiz"></Button>
        </div>
    </div>
</template>