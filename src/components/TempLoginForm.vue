<script setup>
import { Form } from '@primevue/forms';
import { Button, InputText, Message } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { ref } from 'vue';
import { useToast } from 'primevue';
import { useAuthStore } from '@/stores/auth';

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
        toast.add({ severity: 'success', summary: 'Авторизация прошла успешно', life: 3000 });
    }
    catch (error) {
        let message = '';
        if (error.status < 500) {
            message = error.response.data.error_description
        }
        else {
            message = 'Непредвиденная ошибка авторизации. Попробуйте снова'
            console.log(error)
        }
        toast.add({ severity: 'error', summary: 'Ошибка авторизации', detail: message, life: 3000 });
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