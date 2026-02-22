<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTestStore } from '@/stores/test';
import { Button, DataTable, Column, InputText, Paginator } from 'primevue';
import quizService from '@/api/services/quizService';
import PermissionsDialog from '@/components/PermissionsDialog.vue';
import TakeQuizSettingsDialog from '@/components/TakeQuizSettingsDialog.vue';
import { useDialog } from 'primevue/usedialog';

const store = useTestStore();
const router = useRouter();
const dialog = useDialog();
const route = useRoute();
const quizId = route.params.id;

const testName = ref('');
const questions = ref([]);
const perPage = ref(20);
const first = ref(0);
const isLoading = ref(false);
const showError = ref(false); // Состояние для отображения ошибки

const isEditing = computed(() => !!quizId);
const isValidName = computed(() => !!testName.value.trim());

onMounted(async () => {
  if (!quizId) {
    return;
  }

  const loadedTest = (await quizService.getQuizForEdit(quizId)
    .catch(() => null))?.data;
  if (loadedTest) {
    questions.value = loadedTest.questions.map((q) => ({ ...q }));
    if (store.getSelectedQuestions.length != 0) {
      questions.value = [...store.getSelectedQuestions];
    }
    store.setSelectedQuestions(questions.value);
    console.log(loadedTest.name)
    store.setTestName(loadedTest.name);
    store.setTakeSettings(loadedTest.settings)
  } else {
    router.back();
  }
});

watch(() => store.getCurentTestName, (newTestName) => {
  if (testName.value != newTestName) {
    testName.value = newTestName;
  }
}, { immediate: true })

watch(() => store.getSelectedQuestions, () => {
  if (store.getSelectedQuestions.length > 0) {
    questions.value = [...questions.value, ...store.getSelectedQuestions.filter(q => !questions.value.some(qq => qq.id === q.id))];
  }
}, { immediate: true });

const onFocus = () => {
  showError.value = false; // Сброс ошибки при получении фокуса
};

const onBlur = () => {
  showError.value = !testName.value.trim(); // Показать ошибку, если поле пустое после потери фокуса
  if (!showError.value) {
    store.setTestName(testName.value);
  }
};

const goToTests = () => {
  store.clear();
  router.replace({ name: 'quizzes' });
};

const goToSelectQuestions = () => {
  var toGo = `/select-questions/`;
  if (quizId) {
    toGo += `${quizId}`;
  }

  router.push(toGo);
};

const editQuestion = (id) => {
  router.push(`/edit-question/${id}`);
};

const deleteQuestion = (index) => {
  if (questions.value.length > 0) {
    questions.value.splice(index, 1);
    store.setSelectedQuestions(questions.value);
  }
};

const saveTest = async () => {
  const params = {
    name: testName.value,
    questions: store.getSelectedQuestions.map(item => item.id)
  };

  if (!isValidName.value) {
    return;
  }

  let toGrantPermissions = store.getToGrantPermissions;
  let toRevokePermissions = store.getToRevokePermissions;
  let access = store.getAccess !== store.getInitialAccess ? store.getAccess : null;
  if (quizId) {
    quizService.updateQuiz(quizId, params);
  }
  else {
    quizService.createQuiz(params).then(response => {
      savePermissions(response, toGrantPermissions, toRevokePermissions);
      setAccess(response, access);
    });
  }

  goToTests();
};

const savePermissions = async (response, toGrantPermissions, toRevokePermissions) => {
  if (response.status !== 200) {
    return;
  }

  let quizId = response.data.id;
  let list = [];
  if (toGrantPermissions.length > 0) {
    list.push(quizService.grantPermissions(quizId, toGrantPermissions));
  }
  if (toRevokePermissions.length > 0) {
    list.push(quizService.revokePermissions(quizId, toRevokePermissions));
  }

  await Promise.all(list).then(responses => {
    if (responses.every(r => r.status === 200)) {
      toast.add({ severity: 'success', summary: 'Доступы предоставлены', life: 3000 });
    }
  })
}

const setAccess = async (response, access) => {
  if (response.status !== 200) {
    return;
  }

  let quizId = response.data.id;
  if (access) {
    await quizService.setVisibilityLevel(quizId, {
      access_level: access
    }).then(response => {
      if (response.status === 200) {
        toast.add({ severity: 'success', summary: 'Уровень доступа изменен', life: 3000 });
      }
    });
  }
}

const openPermissionsDialog = () => {
  dialog.open(PermissionsDialog, {
    props: {
      header: 'Настройка доступа',
      style: {
        width: '50vw',
      },
      modal: true
    },
    data: {
      quizId: quizId
    }
  });
}

const openTakeSettingsDialog = () => {
  dialog.open(TakeQuizSettingsDialog, {
    props: {
      header: 'Настройка прохождения',
      style: {
        width: '50vw',
      },
      modal: true
    },
    data: {
      quizId: quizId
    }
  });
}
</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-10">
      <h1 class="font-bold text-3xl">Редактирование теста</h1>
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2 w-full">
          <label for="test-name">Название теста *</label>
          <div class="flex flex-row gap-2 w-full">
            <InputText id="test-name" v-model="testName" :invalid="showError" @focus="onFocus" @blur="onBlur"
              placeholder="Введите название теста" fluid />
            <Button label="Настроить доступ" icon="pi pi-lock" iconPos="right" variant="outlined"
              @click="openPermissionsDialog"></Button>
          </div>
          <Button label="Настроить прохождение" icon="pi pi-objects-column" variant="outlined" iconPos="right"
            @click="openTakeSettingsDialog"></Button>
        </div>

        <DataTable :value="questions" :loading="isLoading" scrollable scrollHeight="flex" style="max-height: 52vh;">
          <template #empty> Нет прикрепленных вопросов </template>
          <Column header="#">
            <template #body="slotProps">
              {{ slotProps.index + 1 + first }}
            </template>
          </Column>
          <Column field="question" header="Вопрос"></Column>
          <Column headerClass="flex justify-end" class="w-10% !text-end">
            <template #header>
              <Button @click="goToSelectQuestions" variant="outlined" label="Прикрепить вопросы" icon="pi pi-paperclip"
                iconPos="right"></Button>
            </template>
            <template #body="slotProps">
              <div class="flex justify-end">
                <Button @click="editQuestion(slotProps.data.id)" variant="text" icon="pi pi-pencil"></Button>
                <Button @click="deleteQuestion(slotProps.index)" variant="text" icon="pi pi-trash"></Button>
              </div>
            </template>
          </Column>
        </DataTable>
        <div class="flex justify-between items-center">
          <span></span>
          <Paginator :totalRecords="questions.length" v-model:rows="perPage" v-model:first="first"
            :rowsPerPageOptions="[20, 40, 60, 100]" />
          <div class="flex justify-end gap-2">
            <Button @click="goToTests" variant="outlined" label="Отмена"></Button>
            <Button @click="saveTest" :disabled="!isValidName" :label="isEditing ? 'Сохранить' : 'Создать'"
              icon="pi pi-check" iconPos="right">
            </Button>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>