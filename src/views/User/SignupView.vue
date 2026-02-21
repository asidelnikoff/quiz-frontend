<script setup>
import { ref } from 'vue';
import { Message, Password, Button, InputText } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { Form } from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import authService from '@/api/services/authService';
import { hideSidebar } from '@/components/Sidepanel/state';
import { hashSHA256 } from '@/components/utils/hash';

hideSidebar();

const toast = useToast();
const router = useRouter();

const initialValues = ref({
    login: '',
    password: '',
    firstname: '',
    lastname: '',
    patronymic: null
});
const resolver = ref(zodResolver(
    z.object({
        password: z.string()
            .min(4, 'Пароль должен содержать не менее 4-х символов'),
        login: z.string()
            .min(1, 'Логин не может быть пустым'),
        firstname: z.string()
            .min(1, 'Имя не может быть пустым'),
        lastname: z.string()
            .min(1, 'Фамилия не может быть пустой'),
        patronymic: z.string().nullable(),
    })
));

const isLoading = ref(false);

const onFormSubmit = async ({ values, valid }) => {
    if (!valid) {
        return;
    }
    try {
        isLoading.value = true;
        let hashPassword = hashSHA256(values.password);
        await authService.signup({
            login: values.login,
            password: hashPassword,
            firstname: values.firstname,
            lastname: values.lastname,
            patronymic: values.patronymic
        });
        router.back();
        toast.add({ severity: 'success', summary: 'Регистрация прошла успешно', life: 3000 });
    }
    catch (error) {
        let message = '';
        console.log(error);
        if (error.status < 500) {
            message = error.response.data.error_description
        }
        else {
            message = 'Непредвиденная ошибка регистрации. Попробуйте снова'
        }
        toast.add({ severity: 'error', summary: 'Ошибка регистрации', detail: message, life: 3000 });
    }
    finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <main>
        <div class="center">
            <div class="flex flex-col items-left gap-10">
                <h1 class="font-bold text-3xl">Заполните данные о себе</h1>
                <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
                    class="flex flex-col gap-5 w-full">
                    <div class="flex flex-row gap-10">
                        <div class="flex flex-col w-full gap-1">
                            <InputText name="login" placeholder="Логин *" fluid />
                            <Message v-if="$form.login?.invalid" severity="error" size="small" variant="simple">{{
                                $form.login.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <Password name="password" placeholder="Пароль *" :feedback="false" fluid toggleMask />
                            <template v-if="$form.password?.invalid">
                                <Message v-for="(error, index) of $form.password.errors" :key="index" severity="error"
                                    size="small" variant="simple">{{ error.message }}</Message>
                            </template>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <span></span>
                        </div>
                    </div>
                    <div class="flex flex-row gap-10">
                        <div class="flex flex-col w-full gap-1">
                            <InputText name="firstname" placeholder="Имя *" fluid />
                            <Message v-if="$form.firstname?.invalid" severity="error" size="small" variant="simple">{{
                                $form.firstname.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <InputText name="lastname" placeholder="Фамилия *" fluid />
                            <Message v-if="$form.lastname?.invalid" severity="error" size="small" variant="simple">{{
                                $form.lastname.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <InputText name="patronymic" placeholder="Отчество" fluid />
                            <Message v-if="$form.patronymic?.invalid" severity="error" size="small" variant="simple">{{
                                $form.patronymic.error?.message }}</Message>
                        </div>
                    </div>
                    <div class="text-end pt-5">
                        <Button type="submit" label="Создать" :disabled="isLoading"></Button>
                    </div>
                </Form>
            </div>
        </div>
    </main>
</template>