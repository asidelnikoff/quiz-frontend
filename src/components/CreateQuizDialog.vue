<script setup>
import { Form } from '@primevue/forms';
import { InputText, Button } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import z from 'zod';
import { useToast } from 'primevue';
import quizService from '@/api/services/quizService';
import { inject, ref } from 'vue';

const dialogRef = inject('dialogRef')
const toast = useToast();

const emit = defineEmits(['quizCreate'])

const initialValues = ref({
    name: ''
})
const resolver = ref(zodResolver(
    z.object({
        name: z.string().min(1, 'Название не должно быть пустым'),
    })
))

const closeDialog = () => {
    dialogRef.value.close();
}

const onFormSubmit = async (e) => {
    if (!e.values.name) {
        return
    }
    quizService.createQuiz({
        name: e.values.name
    })
        .then(response => {
            emit('quizCreate', response.data.id)
            toast.add({ severity: 'success', summary: 'Тест создан', life: 3000 });
            e.reset();
            closeDialog()
        })
        .catch(error => {
            let message = '';
            if (error.status < 500) {
                message = error.response.data.error_description
            }
            else if (error.status) {
                message = 'Непредвиденная ошибка создания теста. Попробуйте снова'
            }
            else {
                message = error.message;
            }
            toast.add({ severity: 'error', summary: 'Ошибка', detail: message, life: 3000 });
        })
}
</script>

<template>
    <Form v-slot="$form" :resolver="resolver" :initial-values="initialValues" @submit="onFormSubmit">
        <div class="flex flex-col gap-5">
            <InputText placeholder="Введите название теста" name="name" fluid />
            <div class="flex flex-row gap-2 w-full justify-end">
                <Button label="Отмена" variant="outlined" @click="closeDialog"></Button>
                <Button label="Создать" icon="pi pi-check" icon-pos="right" type="submit"></Button>
            </div>
        </div>
    </Form>
</template>