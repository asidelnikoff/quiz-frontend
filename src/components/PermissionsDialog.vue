<script setup>
import { InputText, DataTable, Column, Button, Select, RadioButton, Divider, ProgressSpinner } from 'primevue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';
import { Form } from '@primevue/forms';
import { ref, inject, computed } from 'vue';
import quizService from '@/api/services/quizService';
import userService from '@/api/services/userService';
import { useTestStore } from '@/stores/test';
import { copyToClipboard } from './utils/clipboard';
import { useAuthStore } from '@/stores/auth';

const dialogRef = inject('dialogRef');

const toast = useToast();

const authStore = useAuthStore();

const initialValues = ref({
    login: ''
});
const resolver = ref(zodResolver(
    z.object({
        login: z.string(),
    })
));

const store = useTestStore();
const permissions = ref([]);
const toGrantPermissions = ref([]);
const toRevokePermissions = ref([]);
const levels = ref([
    { level: 'viewer', description: 'Просмотр' },
    { level: 'editor', description: 'Редактирование' }]);
const visibilities = ref([
    { level: 'personal', description: 'Персональный' },
    { level: 'public', description: 'Открытый' }
]);
const selectedVisibility = ref(visibilities.value[0].level);

const isLoading = ref(false);
const canUseLink = computed(() => !!dialogRef.value.data.quizId)

const fetchPermissions = async () => {
    try {
        isLoading.value = true;
        if (store.getCurrentPermissions.length > 0) {
            permissions.value = store.getCurrentPermissions;
        }
        else {
            let perms = dialogRef.value.data.quizId
                ? (await quizService.getPermissionsList(dialogRef.value.data.quizId)).data
                : [{ login: authStore.getLogin, permission_level: 'owner' }];

            store.setInitialPermissions(perms);
            permissions.value = perms;
        }

        if (store.getVisibility) {
            selectedVisibility.value = store.getVisibility;
        }
        else if (dialogRef.value.data.quizId) {
            let acc = await quizService.getVisibilityLevel(dialogRef.value.data.quizId);
            store.setInitialVisibility(acc.data.visibility_level);
            selectedVisibility.value = acc.data.visibility_level;
        }
    }
    catch (error) {
        console.log('error while fetching', error);
    }
    finally {
        isLoading.value = false;
    }
}

fetchPermissions();
if (canUseLink.value) {
    visibilities.value.push({ level: 'link', description: 'По ссылке' })
}

const closePermissionDialog = () => {
    dialogRef.value.close();
}

const savePermissions = async () => {
    addToUpdatePermissions();

    store.setCurrentPermissions(permissions.value);
    store.setToGrantPermissions(toGrantPermissions.value);
    store.setToRevokePermissions(toRevokePermissions.value);
    store.setVisibility(selectedVisibility.value);

    if (dialogRef.value.data.quizId) {
        let quizId = dialogRef.value.data.quizId;
        let list = [];
        let toGrantPermissions = store.getToGrantPermissions;
        if (toGrantPermissions.length > 0) {
            list.push(quizService.grantPermissions(quizId, toGrantPermissions));
        }

        let toRevokePermissions = store.getToRevokePermissions;
        if (toRevokePermissions.length > 0) {
            list.push(quizService.revokePermissions(quizId, toRevokePermissions));
        }

        let visibility = store.getVisibility !== store.getInitialVisibility ? store.getVisibility : null;
        if (visibility) {
            list.push(quizService.setVisibilityLevel(quizId, { visibility_level: visibility }));
        }

        await Promise.all(list).then(responses => {
            if (responses.every(r => r.status === 200)) {
                toast.add({ severity: 'success', summary: 'Доступы предоставлены', life: 3000 });
                toast.add({ severity: 'success', summary: 'Уровень доступа изменен', life: 3000 });
            }
        });

        store.clearPermissions();
    }

    closePermissionDialog();
}

const addToUpdatePermissions = () => {
    let initialPermissions = store.getInitialPermissions;
    initialPermissions.forEach((value, index) => {
        let currentValue = permissions.value.find(p => p.login === value.login);
        if (currentValue && value.permission_level !== currentValue.permission_level) {
            let toGrant = toGrantPermissions.value.find(p => p.login === currentValue.login);
            if (!toGrant) {
                toGrantPermissions.value.push(currentValue);
            }
            else {
                toGrant.permission_level = currentValue.permission_level;
            }
        }
    })
}

const toRevokePermissionsList = (id) => {
    if (!toGrantPermissions.value.find(p => p.id === id)) {
        toRevokePermissions.value.push({ id: id });
    }
    else {
        toGrantPermissions.value = toGrantPermissions.value.filter(p => p.id !== id);
    }

    permissions.value = permissions.value.filter(p => p.id !== id);
}

const onFormSubmit = async (e) => {
    try {
        await userService.getUserInfo(e.values.login);
        let newPermission = {
            id: e.values.id,
            permission_level: 'viewer'
        }

        if (permissions.value.filter(p => p.id === newPermission.id).length > 0) {
            throw new Error("Пользователь уже добавлен в список");
        }

        toGrantPermissions.value.push(newPermission);
        permissions.value.push(newPermission);
        toast.add({ severity: 'success', summary: 'Пользователь добавлен', life: 3000 });
        e.reset();
    }
    catch (error) {
        let message = '';
        if (error.status < 500) {
            message = error.response.data.error_description
        }
        else if (error.status) {
            message = 'Непредвиденная ошибка добавления пользователя. Попробуйте снова'
        }
        else {
            message = error.message;
        }
        toast.add({ severity: 'error', summary: 'Ошибка', detail: message, life: 3000 });
    }
}

const copyLink = () => {
    const baseUrl = window.location.origin + '/invite-link/';
    selectedVisibility.value = 'link';
    store.setVisibility(selectedVisibility.value);
    quizService.setVisibilityLevel(dialogRef.value.data.quizId, { visibility_level: selectedVisibility.value }).then(response => {
        if (response.status === 200) {
            toast.add({ severity: 'success', summary: 'Уровень доступа изменен', life: 3000 });
        }

        quizService.getLinkHash(dialogRef.value.data.quizId).then(response => {
            let fullUrl = baseUrl + dialogRef.value.data.quizId + `?invite=${response.data.link}`;
            handleCopy(fullUrl);
            toast.add({ severity: 'success', summary: 'Ссылка скопирована в буфер обмен', life: 3000 });
            // copyToClipboard(fullUrl).then(() => {
            //         toast.add({ severity: 'success', summary: 'Ссылка скопирована в буфер обмен', life: 3000 });
            //     });
        });
    });
}



const handleCopy = (content) => {
    const textarea = document.createElement("textarea");
    textarea.textContent = content;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
};

</script>

<template>
    <div v-if="isLoading" class="text-center">
        <ProgressSpinner style="height: 10rem;" />
    </div>
    <div v-else class="flex flex-col gap-5 w-full">
        <Form v-slot="$form" :resolver="resolver" :initial-values="initialValues" @submit="onFormSubmit">
            <div class="flex flex-row gap-2 w-full">
                <InputText placeholder="Введите логин пользователя" name="login" fluid />
                <Button variant="outlined" icon="pi pi-plus" type="submit"></Button>
            </div>
        </Form>
        <div class="flex flex-col gap-2">
            <h3 class="font-bold pb-2">Пользователи, имеющие доступ</h3>
            <DataTable :value="permissions" scrollable scrollHeight="flex" style="max-height: 25vh;"
                :show-headers="false">
                <template #empty> Нет пользователей </template>
                <Column field="id"></Column>
                <Column field="permission_level">
                    <template #body="slotProps">
                        <label v-if="slotProps.data.permission_level === 'owner'">Владелец</label>
                        <div v-else class="flex flex-row gap-2">
                            <Select :options="levels" option-value="level" option-label="description" fluid
                                v-model="slotProps.data.permission_level"></Select>
                            <Button variant="text" icon="pi pi-times"
                                @click="toRevokePermissionsList(slotProps.data.id)"></Button>
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
        <Divider />
        <div class="flex flex-col gap-2">
            <h3 class="font-bold pb-2">Общий доступ</h3>
            <div v-for="visibility in visibilities" :key="visibility.key" class="flex items-center gap-2">
                <RadioButton v-model="selectedVisibility" :inputId="visibility.level" name="dynamic"
                    :value="visibility.level" />
                <label :for="visibility.level">{{ visibility.description }}</label>
            </div>
        </div>
        <div class="flex flex-row gap-2 w-full">
            <div v-if="canUseLink" class="w-7/10">
                <Button label="Копировать ссылку" variant="outlined" icon="pi pi-clipboard" @click="copyLink"></Button>
            </div>
            <div class="flex flex-row gap-2 w-full justify-end">
                <Button label="Отмена" variant="outlined" @click="closePermissionDialog"></Button>
                <Button label="Сохранить" icon="pi pi-check" icon-pos="right" @click="savePermissions"></Button>
            </div>
        </div>
    </div>
</template>