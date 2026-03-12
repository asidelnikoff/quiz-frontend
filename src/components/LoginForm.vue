<script setup>
import { ref } from 'vue';
import { Message, Password, Button, InputText, Checkbox } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { Form } from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import { hashSHA256 } from './utils/hash';
import { useAuthStore } from '@/stores/auth';
import toastService from './utils/toastService';

const emit = defineEmits(['forward'])

const toast = useToast();
const router = useRouter();
const store = useAuthStore();
store.logout()

const initialValues = ref({
    login: '',
    password: '',
    rememberMe: false
});
const resolver = ref(zodResolver(
    z.object({
        password: z.string(),
        login: z.string(),
        rememberMe: z.boolean()
    })
));

const isLoading = ref(false);

const onFormSubmit = async ({ values }) => {
    try {
        isLoading.value = true;
        let passwordHash = hashSHA256(values.password);
        await store.login({
            login: values.login,
            password: passwordHash,
            remember_me: values.rememberMe
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

const goToSignup = () => {
    router.push({ name: 'signup' });
}
</script>

<template>
    <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
        class="flex flex-col gap-5">
        <div class="flex flex-col gap-1">
            <InputText name="login" placeholder="Логин" fluid />
            <Message v-if="$form.login?.invalid" severity="error" size="small" variant="simple">{{
                $form.login.error?.message }}</Message>
        </div>
        <div>
            <Password name="password" placeholder="Пароль" :feedback="false" fluid toggleMask />
            <template v-if="$form.password?.invalid">
                <Message v-for="(error, index) of $form.password.errors" :key="index" severity="error" size="small"
                    variant="simple">{{ error.message }}</Message>
            </template>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-center">
            <p>Запомнить меня</p>
            <Checkbox binary name="rememberMe" />
        </div>
        <div class="flex flex-col pt-5">
            <Button type="submit" label="Вход" :disabled="isLoading"></Button>
            <Button variant="link" disabled>
                <template #default>
                    <p><u><b>Забыл пароль</b></u></p>
                </template>
            </Button>
        </div>
        <div class="flex flex-row items-center justify-center">
            <p>Нет аккаунта?</p>
            <Button variant="link" @click="goToSignup">
                <template #default>
                    <p><u><b>Зарегестрироваться</b></u></p>
                </template>
            </Button>
        </div>
    </Form>
</template>