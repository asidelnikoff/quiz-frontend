<script setup>
import { inject, ref } from 'vue';
import { Form } from '@primevue/forms';
import { InputText, Button, useToast } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import z from 'zod';
import groupService from '@/api/services/groupService';

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

const closeDialog = () => {
    dialogRef.value.close();
}

const onFormSubmit = async (e) => {
    if (!e.values.login) {
        return
    }
    const groupId = dialogRef.value.data.groupId;
    groupService.addMembersToGroup(groupId, [{ login: e.values.login, role: 'member' }])
        .then(_ => {
            emit('memberAdd')
            toast.add({ severity: 'success', summary: 'Пользователь добавлен', life: 3000 });
            e.reset();
        })
        .catch(error => {
            let message = '';
            if (error.status < 500) {
                message = error.response.data.error_description
                if (error.response?.data?.error_code === 'users_not_exist') {
                    message = 'Пользователи '
                    message += '\r\n' + error.response.data.details + '\r\n'
                    message += 'не найдены в базе данных'
                }
                if (error.response?.data.error_code === 'all_in_group') {
                    message = 'Выбранные пользователи уже добавлены в группу'
                }
            }
            else if (error.status) {
                message = 'Непредвиденная ошибка добавления пользователя. Попробуйте снова'
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
            <InputText placeholder="Введите логин пользователя" name="login" fluid />
            <div class="flex flex-row gap-2 w-full justify-end">
                <Button label="Отмена" variant="outlined" @click="closeDialog"></Button>
                <Button label="Добавить" icon="pi pi-plus" icon-pos="right" type="submit"></Button>
            </div>
        </div>
    </Form>
</template>