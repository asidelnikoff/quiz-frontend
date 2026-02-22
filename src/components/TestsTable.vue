<script setup>
import { DataTable, InputText, Button, Column } from 'primevue';
import { useRouter } from 'vue-router';
import { useDialog } from 'primevue';
import DeleteQuizDialog from './DeleteQuizDialog.vue';
import { formatDate } from './utils/dateFormat';
import { watch, ref, computed } from 'vue';

const tests = defineModel('tests')
const searchQuery = ref(null)
const isLoading = defineModel('isLoading')
const isReadOnly = defineModel('isReadOnly')
const mode = defineModel('mode')
const first = defineModel('first')

const router = useRouter()
const dialog = useDialog()
const emit = defineEmits(['fetchTests', 'goToTest', 'editTakeTestSettings', 'selectQuiz', 'deleteTestFromGroup'])

const isGroupMode = computed(() => mode.value === 'group')
const isSelectingMode = computed(() => mode.value === 'select')

const goToTest = (id) => {
  emit('goToTest', { value: id })
};

const editTest = (id) => {
  router.push(`/edit-test/${id}`);
};

const editTakeTestSettings = (id) => {
  emit('editTakeTestSettings', { value: id })
}
const deleteTestFromGroup = (id, name) => {
  emit('deleteTestFromGroup', { id: id, name: name })
}

const selectTest = (id) => {
  emit('selectQuiz', id)
}

const fetchTests = () => {
  emit('fetchTests', { value: searchQuery.value })
}

watch(searchQuery, () => {
  fetchTests()
})

const openDeleteDialog = (id, name) => {
  dialog.open(DeleteQuizDialog, {
    props: {
      header: 'Удалить тест?',
      style: {
        width: '50vw',
      },
      modal: true
    },
    emits: {
      onUpdate: fetchTests
    },
    data: {
      quizId: id,
      quizName: name
    }
  });
};
</script>

<template>
  <div class="flex flex-col gap-5">
    <InputText v-model="searchQuery" fluid placeholder="Введите название теста" />
    <DataTable :value="tests" :loading="isLoading" scrollable scrollHeight="flex" style="max-height: 58vh;">
      <template #empty> Нет тестов для отображения </template>
      <Column header="#">
        <template #body="slotProps">
          {{ slotProps.index + 1 + first }}
        </template>
      </Column>
      <Column field="name" header="Название"></Column>
      <Column field="questions_number" header="Вопросы"></Column>
      <Column field="created_at" header="Дата создания">
        <template #body="slotProps">
          {{ formatDate(slotProps.data.created_at) }}
        </template>
      </Column>
      <Column class="!text-end">
        <template #body="slotProps">
          <div v-if="!isReadOnly" class="items-center">
            <Button v-if="slotProps.data.can_edit" @click="editTest(slotProps.data.id)" variant="text"
              icon="pi pi-pencil"></Button>
            <Button v-if="slotProps.data.can_delete" @click="openDeleteDialog(slotProps.data.id, slotProps.data.name)"
              variant="text" icon="pi pi-trash"></Button>
          </div>
          <div v-if="isGroupMode" class="items-center">
            <Button v-if="slotProps.data.can_edit" @click="editTakeTestSettings(slotProps.data.id)" variant="text"
              icon="pi pi-objects-column"></Button>
            <Button v-if="slotProps.data.can_edit" @click="deleteTestFromGroup(slotProps.data.id, slotProps.data.name)"
              variant="text" icon="pi pi-times"></Button>
          </div>
        </template>
      </Column>
      <Column field="id" class="!text-end">
        <template #body="slotProps">
          <Button v-if="isSelectingMode" label="Добавить" icon="pi pi-plus"
            @click="selectTest(slotProps.data.id)"></Button>
          <Button v-else @click="goToTest(slotProps.data.id)" label="Выполнить" icon="pi pi-play-circle"
            iconPos="right"></Button>
        </template>
      </Column>
    </DataTable>
  </div>
</template>