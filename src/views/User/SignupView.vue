<script setup>
import { ref } from 'vue';
import { Message, Password, Button, InputText, Divider, ProgressSpinner, FloatLabel } from 'primevue';
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
            .trim()
            .regex(/^[a-zA-z0-9!@#$%^&*()_+-="]{4,20}$/, {
                error: () => {
                    return 'Пароль не соответствует требованиям. Длина: 4-20 символов. Символы: A-z,0-9,(!@#$%^&*()_+-=")'
                }
            }),
        login: z.string()
            .trim()
            .regex(/^[a-zA-z0-9_-]+$/, {
                error: () => {
                    return 'Логин может состоять из латинских букв, цифр и символов \'-\',\'_\''
                }
            }),
        firstname: z.string()
            .trim()
            .min(1, 'Имя не может быть пустым'),
        lastname: z.string()
            .trim()
            .min(1, 'Фамилия не может быть пустой'),
        patronymic: z.string()
            .trim()
            .nullable(),
    })));

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
        <div class="flex flex-col gap-10 items-left">
            <span></span>
            <h1 class="font-bold text-3xl">Заполните данные о себе</h1>
            <span></span>
            <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" @submit="onFormSubmit"
                class="flex flex-col gap-5 w-full">
                <h2><b>Данные для входа</b></h2>
                <div class="flex flex-col md:flex-row gap-10 pt-5">
                    <div class="flex flex-col w-full gap-1">
                        <FloatLabel>
                            <InputText id="login" name="login" fluid />
                            <label for="login">Логин *</label>
                        </FloatLabel>
                        <Message v-if="$form.login?.invalid" severity="error" size="small" variant="simple">{{
                            $form.login.error?.message }}</Message>
                    </div>
                    <div class="flex flex-col w-full gap-1">
                        <FloatLabel>
                            <Password name="password" :feedback="false" fluid toggleMask />
                            <label for="password">Пароль *</label>
                        </FloatLabel>
                        <template v-if="$form.newPassword?.invalid">
                            <Message v-for="(error, index) of $form.newPassword?.errors" :key="index" severity="error"
                                size="small" variant="simple">{{ error.message }}</Message>
                        </template>
                    </div>
                    <div class="flex flex-col w-full gap-1">
                        <span></span>
                    </div>
                </div>
                <Divider />
                <h2><b>Персональные данные</b></h2>
                <div class="flex flex-col md:flex-row gap-10 pt-5">
                    <div class="flex flex-col w-full gap-1">
                        <FloatLabel>
                            <InputText id="firstname" name="firstname" fluid />
                            <label for="firstname">Имя *</label>
                        </FloatLabel>
                        <Message v-if="$form.firstname?.invalid" severity="error" size="small" variant="simple">{{
                            $form.firstname.error?.message }}</Message>
                    </div>
                    <div class="flex flex-col w-full gap-1">
                        <FloatLabel>
                            <InputText id="lastname" name="lastname" fluid />
                            <label for="firstname">Фамилия *</label>
                        </FloatLabel>
                        <Message v-if="$form.lastname?.invalid" severity="error" size="small" variant="simple">{{
                            $form.lastname.error?.message }}</Message>
                    </div>
                    <div class="flex flex-col w-full gap-1">
                        <FloatLabel>
                            <InputText id="patronymic" name="patronymic" fluid />
                            <label for="patronymic">Отчество</label>
                        </FloatLabel>
                        <Message v-if="$form.patronymic?.invalid" severity="error" size="small" variant="simple">{{
                            $form.patronymic.error?.message }}</Message>
                    </div>
                </div>
                <div class="text-end pt-10">
                    <Button type="submit" label="Зарегистрироваться" icon="pi pi-user-plus" iconPos="right"
                        :disabled="isLoading"></Button>
                </div>
            </Form>
        </div>
        <div v-if="isLoading" style="position: absolute; top: 0; bottom: 0; left: 0; right: 0;">
        </div>
        <div v-if="isLoading" class="center">
            <ProgressSpinner style="height: 10rem;" />
        </div>
    </main>
</template>