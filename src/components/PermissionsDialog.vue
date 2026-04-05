<script setup>
import { InputText, DataTable, Column, Button, Select, RadioButton, Divider } from 'primevue';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner.vue';
import { zodResolver } from '@primevue/forms/resolvers/zod';
import { z } from 'zod';
import { useToast } from 'primevue/usetoast';
import { Form } from '@primevue/forms';
import { ref, inject, computed } from 'vue';
import quizService from '@/api/services/quizService';
import userService from '@/api/services/userService';
import { useTestStore } from '@/stores/test';
import { useAuthStore } from '@/stores/auth';
import toastService from './utils/toastService';

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
                : [{ id: authStore.getId, permission_level: 'owner' }];
            let usersInfos = (await userService.getUsersInfos(perms.map(c => c.id))).data
            perms = perms.map(c => {
                var curr = usersInfos.filter(a => a.id === c.id)[0]
                curr.permission_level = c.permission_level
                return curr
            })
            console.log(perms)
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
            list.push(quizService.grantPermissions(quizId, toGrantPermissions.map(a => {
                return {
                    id: a.id,
                    permission_level: a.permission_level
                }
            })));
        }

        let toRevokePermissions = store.getToRevokePermissions;
        if (toRevokePermissions.length > 0) {
            list.push(quizService.revokePermissions(quizId, toRevokePermissions.map(a => {
                return {
                    id: a.id,
                    permission_level: a.permission_level
                }
            }))
                .then(_ => toastService.showSuccessMessage(toast, 'Доступы предоставлены'))
                .catch(error => toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка предоставления прав. Попробуйте снова')));
        }

        let visibility = store.getVisibility !== store.getInitialVisibility ? store.getVisibility : null;
        if (visibility) {
            list.push(quizService.setVisibilityLevel(quizId, { visibility_level: visibility })
                .then(_ => toastService.showSuccessMessage(toast, 'Уровень доступа изменен'))
                .catch(error => toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка изменения уровня доступа. Попробуйте снова.')));
        }

        await Promise.all(list);

        store.clearPermissions();
    }

    closePermissionDialog();
}

const addToUpdatePermissions = () => {
    let initialPermissions = store.getInitialPermissions;
    initialPermissions.forEach((value, index) => {
        let currentValue = permissions.value.find(p => p.id === value.id);
        if (currentValue && value.permission_level !== currentValue.permission_level) {
            let toGrant = toGrantPermissions.value.find(p => p.id === currentValue.id);
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
        isLoading.value = true
        var info = (await userService.getUserInfo(e.values.login)).data;
        info.permission_level = 'viewer'

        if (permissions.value.filter(p => p.id === info.id).length > 0) {
            throw new Error("Пользователь уже добавлен в список");
        }

        toGrantPermissions.value.push(info);
        permissions.value.push(info);
        toastService.showSuccessMessage(toast, 'Пользователь добавлен')
        e.reset();
    }
    catch (error) {
        toastService.showBackendErrorMessage(toast, error, 'Непредвиденная ошибка добавления пользователя. Попробуйте снова')
    }
    finally {
        isLoading.value = false
    }
}

const copyLink = () => {
    const baseUrl = window.location.origin + '/invite-link/';
    selectedVisibility.value = 'link';
    store.setVisibility(selectedVisibility.value);
    quizService.setVisibilityLevel(dialogRef.value.data.quizId, { visibility_level: selectedVisibility.value })
    .then(response => {
        if (response.status === 200) {
            toastService.showSuccessMessage(toast, 'Уровень доступа изменен')
        }

        quizService.getLinkHash(dialogRef.value.data.quizId).then(response => {
            let fullUrl = baseUrl + dialogRef.value.data.quizId + `?invite=${response.data.link}`;
            handleCopy(fullUrl);
            toastService.showSuccessMessage(toast, 'Ссылка скопирована в буфер обмен')
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
    <div class="flex flex-col gap-5 w-full">
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
                <Column>
                    <template #body="{ data }">
                        <p>{{ data.firstname }} {{ data.lastname }}</p>
                    </template>
                </Column>
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
    <LoadingSpinner :is-loading="isLoading"/>
</template>