<script setup>
import { inject, ref } from 'vue';
import { Form } from '@primevue/forms';
import { InputText, Button, useToast } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import z from 'zod';
import groupService from '@/api/services/groupService';
import toastService from './utils/toastService';

const dialogRef = inject('dialogRef')
const toast = useToast();

const emit = defineEmits(['memberAdd'])

const initialValues = ref({
    login: ''
})
const resolver = ref(zodResolver(
    z.object({
        login: z.string(),
    })
))

const onFormSubmit = async (e) => {
    if (!e.values.login) {
        return
    }

    groupService.addMembersToGroup([{ login: e.values.login, role: 'member' }])
        .then(_ => {
            emit('memberAdd')
            toastService.showSuccessMessage(toast, 'Пользователь добавлен')
            e.reset();
        })
        .catch(error => toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка добавления пользователя. Попробуйте снова'))
}

const closeDialog = () => {
    dialogRef.value.close();
}
</script>

<template>
    <Form v-slot="$form" :resolver="resolver" :initial-values="initialValues" @submit="onFormSubmit">
        <div class="flex flex-col gap-5">
            <InputText placeholder="Введите логин пользователя" name="login" fluid />
            <div class="flex flex-row gap-2 w-full justify-end">
                <Button label="Отмена" variant="outlined" @click="closeDialog"></Button>
                <Button label="Добавить" icon="pi pi-plus" icon-pos="right" type="submit"></Button>
            </div>
        </div>
    </Form>
</template>