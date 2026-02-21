<script setup>
import { ref, onBeforeMount } from 'vue';
import { Message, Password, Button, InputText, useConfirm } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { Form } from '@primevue/forms';
import { useToast } from 'primevue/usetoast';
import authService from '@/api/services/authService';
import ResetOnChange from '@/components/ResetOnChange.vue';
import { useRouter } from 'vue-router';

const toast = useToast();
const confirm = useConfirm();
const router = useRouter();
const isLoading = ref(false);
const initialValues = ref({
    login: '',
    firstname: '',
    lastname: '',
    patronymic: null
});

const resolver = ref(zodResolver(
    z.object({
        newPassword: z.string()
            .min(4, 'Пароль должен содержать не менее 4-х символов')
            .optional()
            .or(z.literal('')),
        repeatPassword: z.string()
            .optional()
            .or(z.literal('')),
        login: z.string(),
        firstname: z.string()
            .min(1, 'Имя не может быть пустым'),
        lastname: z.string()
            .min(1, 'Фамилия не может быть пустой'),
        patronymic: z.string().nullable(),
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

onBeforeMount(async () => {
    let user = (await authService.getUser()).data;
    console.log(user)
    if (user) {
        initialValues.value = {
            login: user.login,
            firstname: user.firstname,
            lastname: user.lastname,
            patronymic: user.patronymic ?? null
        }

        console.log(initialValues.value);
    }
})

const onFormSubmit = async ({ values, valid }) => {
    if (!valid) {
        return;
    }
    try {
        isLoading.value = true;
        await authService.updateUser({
            login: values.login,
            firstname: values.firstname,
            lastname: values.lastname,
            patronymic: values.patronymic.length > 0 ? values.patronymic : null,
            password: values.newPassword
        })
        toast.add({ severity: 'success', summary: 'Данные успешно обновлены', life: 3000 });
    }
    catch (error) {
        let message = '';
        console.log(error);
        if (error.status < 500) {
            message = error.response.data.error_description
        }
        else {
            message = 'Непредвиденная ошибка обновления. Попробуйте снова'
        }
        toast.add({ severity: 'error', summary: 'Ошибка обновления', detail: message, life: 3000 });
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
            <ResetOnChange :value="initialValues">
                <Form v-slot="$form" :resolver="resolver" :initialValues="initialValues" :validateOnValueUpdate="false"
                    @submit="onFormSubmit" class="flex flex-col gap-5 w-full">
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
                    <div class="flex flex-row gap-10">
                        <div class="flex flex-col w-full gap-1">
                            <InputText name="login" placeholder="Логин" fluid readonly="true" />
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
                    <div class="flex flex-row gap-10">
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
                    <div class="flex flex-row gap-5 justify-end pt-5">
                        <Button variant="outlined" icon="pi pi-trash" iconPos="right" label="Удалить"
                            :disabled="isLoading" @click="openDeleteDialog"></Button>
                        <Button type="submit" icon="pi pi-check" iconPos="right" label="Сохранить"
                            :disabled="isLoading"></Button>
                    </div>
                </Form>
            </ResetOnChange>
        </div>
    </main>
</template>