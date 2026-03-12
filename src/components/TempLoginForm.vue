<script setup>
import { Form } from '@primevue/forms';
import { Button, InputText, Message } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { ref } from 'vue';
import { useToast } from 'primevue';
import { useAuthStore } from '@/stores/auth';
import toastService from './utils/toastService';

const emit = defineEmits(['forward'])
const toast = useToast();
const store = useAuthStore();

const initialValues = ref({
    login: '',
});
const resolver = ref(zodResolver(
    z.object({
        login: z.string().nonempty(),
    })
));

const isLoading = ref(false);

const onFormSubmit = async ({ values }) => {
    try {
        isLoading.value = true;
        await store.tempLogin({
            login: values.login,
        });
        emit('forward');
        toastService.showSuccessMessage(toast, 'Авторизация прошла успешно')
    }
    catch (error) {
        toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка авторизации. Попробуйте снова')
    }
    finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
        class="flex flex-col gap-5">
        <div class="flex flex-col gap-1">
            <InputText name="login" placeholder="Имя" fluid />
            <Message v-if="$form.login?.invalid" severity="error" size="small" variant="simple">{{
                $form.login.error?.message }}</Message>
        </div>
        <div class="flex flex-col pt-5">
            <Button type="submit" label="Вход" :disabled="isLoading"></Button>
        </div>
    </Form>
</template>