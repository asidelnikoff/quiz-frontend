<script setup>
import { ref, onMounted } from 'vue';
import { Message, Password, Button, InputText, useConfirm, Divider, FloatLabel } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { Form } from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/auth';
import authService from '@/api/services/authService';
import userService from '@/api/services/userService';
import ResetOnChange from '@/components/ResetOnChange.vue';
import { useRouter } from 'vue-router';
import toastService from '@/components/utils/toastService';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner.vue';

const authStore = useAuthStore()
const toast = useToast();
const confirm = useConfirm();
const router = useRouter();
const isLoading = ref(false);
const userId = ref(null)
const initialValues = ref({
    login: '',
    firstname: '',
    lastname: '',
    patronymic: null
});

const resolver = ref(zodResolver(
    z.object({
        newPassword: z.string()
            .trim()
            .regex(/^[a-zA-z0-9!@#$%^&*()_+-="]{4,20}$/, {
                error: () => {
                    return 'Пароль не соответствует требованиям. Длина: 4-20 символов. Символы: A-z,0-9,(!@#$%^&*()_+-=")'
                }
            })
            .optional()
            .or(z.literal('')),
        repeatPassword: z.string()
            .trim()
            .optional()
            .or(z.literal('')),
        login: z.string()
            .trim()
            .regex(/^[a-zA-z0-9_-]+$/, {
                error: () => {
                    return 'Логин может состоять из латинских букв, цифр и символов \'-\',\'_\''
                }
            }),
        firstname: z.string().trim()
            .min(1, 'Имя не может быть пустым'),
        lastname: z.string().trim()
            .min(1, 'Фамилия не может быть пустой'),
        patronymic: z.string().trim().nullable(),
    })
        .refine((data) => {
            if (!data.newPassword || data.newPassword.length <= 0) {
                return true;
            }

            return data.newPassword === data.repeatPassword;
        },
            {
                message: 'Пароли не совпадают',
                path: ['repeatPassword']
            })
));

onMounted(() => {
    isLoading.value = true
    authService.getUser()
        .then(response => {
            var user = response.data;
            if (user) {
                userId.value = user.id
                initialValues.value = {
                    login: user.login,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    patronymic: user.patronymic ?? null
                }
            }
        })
        .finally(() => {
            isLoading.value = false
        })
})

const onFormSubmit = async ({ values, valid }) => {
    if (!valid) {
        return;
    }
    try {
        isLoading.value = true;
        let newPatronymic = values.patronymic?.trim().length > 0 ? values.patronymic : null
        let updated = {
            login: values.login === initialValues.value.login ? null : values.login,
            firstname: values.firstname === initialValues.value.firstname ? null : values.firstname,
            lastname: values.lastname === initialValues.value.lastname ? null : values.lastname,
            patronymic: newPatronymic === initialValues.value.patronymic ? null : newPatronymic,
            password: values.newPassword ?? null
        };
        if (updated.login === null
            && updated.firstname === null
            && updated.lastname === null
            && newPatronymic === initialValues.value.patronymic
            && updated.password === null) {
            toastService.showInfoMessage(toast, 'Данные идентичны')
            return;
        }

        await userService.updateUser(updated)
        if (updated.login !== null) {
            await authStore.refresh()
        }

        toastService.showSuccessMessage(toast, 'Данные успешно обновлены')
    }
    catch (error) {
        toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка обновления. Попробуйте снова')
    }
    finally {
        isLoading.value = false;
    }
}

const openDeleteDialog = (id, text) => {
    confirm.require({
        message: `Уверены, что хотите удалить свой аккаунт?`,
        header: 'Удалить аккаунт?',
        rejectProps: {
            label: 'Отмена',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Удалить',
            icon: 'pi pi-trash',
            iconPos: 'right'
        },
        accept: () => {
            deleteAccount();
        }
    });
};

const deleteAccount = async () => {
    await authService.deleteUser();
    router.replace('/login');
};
</script>

<template>
    <main>
        <div class="flex flex-col items-left gap-10">
            <h1 class="font-bold text-3xl">Мой профиль</h1>
            <div>
                <h2><b>Идентификатор</b></h2>
                <h3>#{{ userId }}</h3>
            </div>
            <ResetOnChange :value="initialValues">
                <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" :validateOnValueUpdate="false"
                    @submit="onFormSubmit" class="flex flex-col gap-5 w-full">
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
                    <Divider />
                    <h2><b>Данные для входа</b></h2>
                    <div class="flex flex-col md:flex-row gap-10 pt-5">
                        <div class="flex flex-col w-full gap-1">
                            <FloatLabel>
                                <InputText id="login" name="login" fluid />
                                <label for="login">Логин</label>
                            </FloatLabel>
                            <Message v-if="$form.login?.invalid" severity="error" size="small" variant="simple">{{
                                $form.login.error?.message }}</Message>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <span></span>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <span></span>
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row gap-10">
                        <div class="flex flex-col w-full gap-1">
                            <Password name="newPassword" placeholder="Пароль" :feedback="false" fluid toggleMask />
                            <template v-if="$form.newPassword?.invalid">
                                <Message v-for="(error, index) of $form.newPassword?.errors" :key="index"
                                    severity="error" size="small" variant="simple">{{ error.message }}</Message>
                            </template>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <Password name="repeatPassword" placeholder="Повтор пароля" :feedback="false" fluid
                                :disabled="$form.newPassword?.value?.length <= 0" />
                            <template v-if="$form.repeatPassword?.invalid">
                                <Message v-for="(error, index) of $form.repeatPassword?.errors" :key="index"
                                    severity="error" size="small" variant="simple">{{ error.message }}</Message>
                            </template>
                        </div>
                        <div class="flex flex-col w-full gap-1">
                            <span></span>
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row gap-5 justify-end pt-5">
                        <Button variant="outlined" icon="pi pi-trash" iconPos="right" label="Удалить"
                            :disabled="isLoading" @click="openDeleteDialog"></Button>
                        <Button type="submit" icon="pi pi-check" iconPos="right" label="Сохранить"
                            :disabled="isLoading"></Button>
                    </div>
                </Form>
            </ResetOnChange>
        </div>
        <LoadingSpinner :isLoading="isLoading"/>
    </main>
</template>