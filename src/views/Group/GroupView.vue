<script setup>
import { ref, computed, watch } from 'vue';
import { Paginator, Button, DataTable, Column, InputText, Select, useConfirm, useToast } from 'primevue';
import groupService from '@/api/services/groupService';
import { useRouter, onBeforeRouteLeave, useRoute } from 'vue-router';
import { useDialog } from 'primevue/usedialog';
import { useAuthStore } from '@/stores/auth';
import TestsTable from '@/components/TestsTable.vue';
import TakeQuizSettingsDialog from '@/components/TakeQuizSettingsDialog.vue';
import AddMemberDialog from '@/components/AddMemberDialog.vue';
import AddQuizzesDialog from '@/components/AddQuizzesDialog.vue';
import toastService from '@/components/utils/toastService';
import { useGroupStore } from '@/stores/group';

const dialog = useDialog();
const router = useRouter()
const authStore = useAuthStore()
const confirm = useConfirm()
const route = useRoute()
const toast = useToast()
const groupStore = useGroupStore()
const groupId = route.params.id

const isNameEditing = ref(false)
const showError = ref(false)

const tests = ref([])
const isTestsLoading = ref(false)
const first = ref(0)
const totalItems = ref(0);
const currentPage = computed(() => first.value / perPage.value);
const perPage = ref(20);
const searchQuery = ref(null)

const members = ref([])
const isMembersLoading = ref(false)
const firstMember = ref(0)
const totalMembersItems = ref(0);
const currentMembersPage = computed(() => first.value / perPage.value);
const perPageMembers = ref(20);
const membersSearchQuery = ref(null)

const isDefaultSettingsButtonDisabled = ref(false)

const groupName = ref(null)

let roles = {};
roles['member'] = 'Участник'
roles['methodist'] = 'Методист'
roles['moderator'] = 'Модератор'
roles['admin'] = 'Администратор'
roles['creator'] = 'Владелец'
const rolesOptions = ref([
    { value: 'member', description: 'Участник' },
    { value: 'methodist', description: 'Методист' },
    { value: 'moderator', description: 'Модератор' },
    { value: 'admin', description: 'Администратор' }
]);

const userRole = ref(null)
const isQuizListEditingEnabled = ref(false)
const isMembersListEditingEnabled = ref(false)
const isNameEditingEnabled = ref(false)
const isDeletingEnabled = ref(false)

const isLoading = ref(false)

const authToGroup = async () => {
    await authStore.groupLogin(groupId)
}

onBeforeRouteLeave((to, _) => {
    if (to.name !== 'group-test' && to.name !== 'group-select-quizzes') {
        authStore.groupLogout()
    }
})

const fetchTests = async (query) => {
    isTestsLoading.value = true;
    try {
        if (!query?.not_changed) {
            searchQuery.value = query?.value;
        }
        let quizzes = (await groupService.getGroupQuizzes({
            search: searchQuery.value,
            limit: perPage.value,
            page: currentPage.value + 1
        }).catch(_ => null))?.data

        if (quizzes) {
            totalItems.value = quizzes.count || 0
            tests.value = quizzes.items || []
        }
    }
    finally {
        isTestsLoading.value = false;
    }
}

watch([first, perPage], () => {
    fetchTests({ not_changed: true });
});

watch([tests, totalItems], ([newTests, newTotalItems]) => {
    if (newTests.length === 0 && currentPage.value > 1 && newTotalItems > 0) {
        currentPage.value = Math.max(1, currentPage.value - 1);
        fetchTests({ not_changed: true });
    }
});

const fetchMembers = async () => {
    isMembersLoading.value = true;
    try {
        let group = (await groupService.getGroupDetailed({
            limit: perPageMembers.value,
            page: currentMembersPage.value + 1,
            search: membersSearchQuery.value
        }).catch(_ => null))?.data
        if (group) {
            userRole.value = group.user_role
            isQuizListEditingEnabled.value = group.can_edit_quiz_list
            isMembersListEditingEnabled.value = group.can_edit_members_list
            isNameEditingEnabled.value = group.can_edit_group_name
            isDeletingEnabled.value = group.can_delete
            totalMembersItems.value = group.members.count
            members.value = group.members.items
            groupName.value = group.name
        }
    }
    finally {
        isMembersLoading.value = false;
    }
}

watch([firstMember, perPageMembers], () => {
    fetchMembers();
});

watch(membersSearchQuery, () => {
    fetchMembers()
})

authToGroup().then(_ => {
    fetchMembers()
    fetchTests({ not_changed: true })
})

const goToTest = (id) => {
    router.push(`/group/${groupId}/test/${id.value}`)
}

const editName = () => {
    if (isNameEditing.value && groupId && groupName.value) {
        groupService.updateGroup({ name: groupName.value })
        isNameEditing.value = false
    }
    else if (!isNameEditing.value) {
        isNameEditing.value = true
    }
}

const onFocus = () => {
    showError.value = false; // Сброс ошибки при получении фокуса
};

const onBlur = () => {
    showError.value = !groupName.value?.trim(); // Показать ошибку, если поле пустое после потери фокуса
};

const openDefaultTakeQuizSettingsDialog = () => {
    isDefaultSettingsButtonDisabled.value = true
    groupService.getGroupDefaultSettings().then(response => {
        openTakeSettingsDialog(response.data, null)
        isDefaultSettingsButtonDisabled.value = false
    })
}

const openTakeQuizSettingsDialog = (id) => {
    isTestsLoading.value = true
    groupService.getGroupQuizTakeSettings(id.value).then(response => {
        openTakeSettingsDialog(response.data, id.value)
        isTestsLoading.value = false
    })
}

const openTakeSettingsDialog = (settings, quizId) => {
    console.log(settings)
    dialog.open(TakeQuizSettingsDialog, {
        props: {
            header: 'Настройка прохождения',
            style: {
                width: '50vw',
            },
            modal: true,
        },
        emits: {
            onSaveSettings: (settings) => saveSettings(settings, quizId)
        },
        data: {
            initialSettings: settings
        }
    });
}

const saveSettings = async (settings, quizId) => {
    let task = null;
    if (quizId) {
        isTestsLoading.value = true
        task = groupService.updateGroupQuizz({
            quiz_id: quizId,
            settings: settings
        })
    }
    else {
        isDefaultSettingsButtonDisabled.value = true
        task = groupService.updateGroupDefaultSettings(settings)
    }
    await task
        .then(() => {
            toastService.showSuccessMessage(toast, 'Настройки прохождения сохранены')
        })
        .finally(() => {
            isDefaultSettingsButtonDisabled.value = false
            isTestsLoading.value = false
        })
}

const onRoleChange = (id, newRole) => {
    if (!groupId) {
        return;
    }
    isMembersLoading.value = true;
    groupService.editMembersRoles([{ user_id: id, role: newRole }]).finally(_ => isMembersLoading.value = false)
}

const removeMember = (firstname, lastname, id) => {
    if (!groupId) {
        return;
    }

    if (authStore.getId === id) {
        confirm.require({
            message: `Вы собираетесь выйти из группы. Уверены, что хотите покинуть группу?`,
            header: 'Выйти из группы?',
            rejectProps: {
                label: 'Остаться',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Выйти',
                icon: 'pi pi-sign-out',
                iconPos: 'right'
            },
            accept: () => {
                deleteMember(id);
            }
        });
    }
    else {
        confirm.require({
            message: `Вы собираетесь удалить ${firstname} ${lastname} из группы. Хотите продолжить?`,
            header: 'Удалить пользователя из группы?',
            rejectProps: {
                label: 'Отмена',
                severity: 'secondary',
                outlined: true
            },
            acceptProps: {
                label: 'Удалить',
                icon: 'pi pi-times',
                iconPos: 'right'
            },
            accept: () => {
                deleteMember(id);
            }
        });
    }
}
const deleteMember = (id) => {
    isMembersLoading.value = true;
    groupService.deleteMembersFromGroup([id])
        .then(_ => members.value = members.value.filter(a => a.id != id))
        .finally(_ => isMembersLoading.value = false)
}

const addTest = () => {
    console.log(tests.value)
    groupStore.setIsEditing(false)
    groupStore.setInitialTests(tests.value.map(a => {
        return { 
            id: a.id, 
            questions_number: a.questions_number, 
            name: a.name, 
            created_at: a.created_at }
    }))
    groupStore.setSelectedTests(tests.value.map(a => {
        return { 
            id: a.id, 
            questions_number: a.questions_number, 
            name: a.name, 
            created_at: a.created_at }
    }))
    console.log(groupStore.getSelectedTests)
    router.push({ name: 'group-select-quizzes' })
}
const deleteQuizDialog = (params) => {
    console.log('deleting quiz from group', params.name)
    confirm.require({
        message: `Вы собираетесь удалить тест ${params.name} из группы. Хотите продолжить?`,
        header: 'Удалить тест?',
        rejectProps: {
            label: 'Отмена',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Удалить',
            icon: 'pi pi-times',
            iconPos: 'right'
        },
        accept: () => {
            deleteQuiz(params.id)
        }
    });
}
const deleteQuiz = (id) => {
    groupService.deleteQuizFromGroup({ quiz_id: id })
        .then(_ => {
            fetchTests({ not_changed: true })
        })
}

const addMember = () => {
    dialog.open(AddMemberDialog, {
        props: {
            header: 'Добавление пользователя',
            style: {
                width: '50vw',
            },
            modal: true
        },
        emits: {
            onMemberAdd: fetchMembers
        },
        data: {
            groupId: groupId
        }
    });
}

const deleteGroupDialog = () => {
    confirm.require({
        message: `Вы собираетесь удалить группу. Хотите продолжить?`,
        header: 'Удалить группу?',
        rejectProps: {
            label: 'Отмена',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Удалить',
            icon: 'pi pi-times',
            iconPos: 'right'
        },
        accept: () => {
            deleteGroup()
        }
    });
}

const deleteGroup = () => {
    groupService.deleteGroup().then(_ => {
        router.back()
    })
}
</script>

<template>
    <main>
        <div class="flex flex-col gap-5">
            <div class="flex flex-row gap-5 pb-5">
                <h1 v-if="!isNameEditing" class="font-bold text-3xl">{{ groupName }}</h1>
                <div v-else class="flex flex-col gap-2 w-full">
                    <label for="group-name">Название группы *</label>
                    <InputText id="group-name" v-model="groupName" :invalid="showError" @focus="onFocus" @blur="onBlur"
                        placeholder="Введите название группы" fluid />
                </div>
                <Button v-if="isNameEditingEnabled" variant="text"
                    :icon="!isNameEditing ? 'pi pi-pencil' : 'pi pi-check'" @click="editName"></Button>
            </div>
            <div class="flex flex-col gap-5">
                <div class="flex flex-row justify-between w-full">
                    <h3><b>Тесты группы</b></h3>
                    <div v-if="isQuizListEditingEnabled" class="flex flex-row gap-5">
                        <Button :disabled="isDefaultSettingsButtonDisabled" label="Настроить прохождение" icon="pi pi-objects-column" variant="outlined"
                            iconPos="right" @click="openDefaultTakeQuizSettingsDialog"></Button>
                        <Button label="Добавить тесты" variant="outlined" icon="pi pi-plus-circle" iconPos="right"
                            @click="addTest"></Button>
                    </div>
                </div>
                <TestsTable :tests="tests" :isLoading="isTestsLoading" :first="first" :isReadOnly="true"
                    @fetchTests="fetchTests" @goToTest="goToTest" @editTakeTestSettings="openTakeQuizSettingsDialog"
                    @deleteTestFromGroup="deleteQuizDialog" mode="group" />
                <div class="flex justify-between items-center">
                    <span></span>
                    <Paginator :totalRecords="totalItems" v-model:rows="perPage" v-model:first="first"
                        :rowsPerPageOptions="[20, 40, 60, 100]" />
                    <span></span>
                </div>
            </div>
            <div class="flex flex-col gap-5">
                <div class="flex flex-row justify-between w-full">
                    <h3><b>Состав группы</b></h3>
                    <Button v-if="isMembersListEditingEnabled" label="Добавить пользователей" variant="outlined"
                        icon="pi pi-plus-circle" iconPos="right" @click="addMember"></Button>
                </div>
                <InputText :disabled="true" v-model="membersSearchQuery" fluid placeholder="Введите имя пользователя" />
                <DataTable :value="members" :loading="isMembersLoading" scrollable scrollHeight="flex"
                    style="max-height: 58vh;">
                    <template #empty> Нет участников для отображения </template>
                    <Column header="#">
                        <template #body="{ index }">
                            {{ index + 1 + first }}
                        </template>
                    </Column>
                    <Column header="Имя">
                        <template #body="{ data }">
                            {{ data.lastname }} {{ data.firstname }} {{ data.patronymic }}
                        </template>
                    </Column>
                    <Column header="Роль">
                        <template #body="{ data }">
                            <div>
                                <label v-if="data.role === 'creator' || !isMembersListEditingEnabled">{{
                                    roles[data.role] }}</label>
                                <Select v-else :options="rolesOptions" option-value="value" option-label="description"
                                    fluid v-model="data.role" @change="onRoleChange(data.id, data.role)"></Select>
                            </div>
                        </template>
                    </Column>
                    <Column v-if="isMembersListEditingEnabled">
                        <template #body="{ data }">
                            <Button v-if="data.role !== 'creator'" variant="text" icon="pi pi-times"
                                @click="removeMember(data.firstname, data.lastname, data.id)"></Button>
                        </template>
                    </Column>
                </DataTable>
                <div class="flex justify-between items-center">
                    <span></span>
                    <Paginator :totalRecords="totalMembersItems" v-model:rows="perPageMembers"
                        v-model:first="firstMember" :rowsPerPageOptions="[20, 40, 60, 100]" />
                    <span></span>
                </div>
            </div>
            <div v-if="isDeletingEnabled">
                <Button label="Удалить" icon="pi pi-trash" iconPos="right" variant="outlined"
                    @click="deleteGroupDialog">
                </Button>
            </div>
        </div>
    </main>
</template>
