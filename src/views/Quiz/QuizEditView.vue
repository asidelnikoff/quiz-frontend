<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useTestStore } from '@/stores/test';
import { Button, DataTable, Column, InputText, useToast } from 'primevue';
import quizService from '@/api/services/quizService';
import PermissionsDialog from '@/components/PermissionsDialog.vue';
import TakeQuizSettingsDialog from '@/components/TakeQuizSettingsDialog.vue';
import { useDialog } from 'primevue/usedialog';
import toastService from '@/components/utils/toastService';
import { onBeforeRouteLeave } from 'vue-router';

const toast = useToast();
const store = useTestStore();
const router = useRouter();
const dialog = useDialog();
const route = useRoute();
const quizId = route.params.id;

const testName = ref('');
const questions = ref([]);
const isLoading = ref(false);
const showError = ref(false); // Состояние для отображения ошибки
const isNameEditing = ref(false)
const initTestName = ref('')
const isQuestionsListEditing = ref(false)

onMounted(async () => {
  if (!quizId) {
    return;
  }

  const loadedTest = (await quizService.getQuizForEdit(quizId).catch(() => null))?.data;
  if (loadedTest) {
    questions.value = loadedTest.questions.map((q) => ({ ...q }));
    store.setSelectedQuestions(questions.value);
    console.log(loadedTest.name)
    testName.value = loadedTest.name;
    initTestName.value = loadedTest.name;
    store.setTakeSettings(loadedTest.settings)
  } else {
    router.back();
  }
});

onBeforeRouteLeave((to, _) => {
    if (to.name !== 'select-questions') {
        store.clear()
    }
})

const onFocus = () => {
  showError.value = false; // Сброс ошибки при получении фокуса
};

const onBlur = () => {
  showError.value = !groupName.value?.trim(); // Показать ошибку, если поле пустое после потери фокуса
};

const goToSelectQuestions = () => {
  store.setSelectedQuestions(questions.value);
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
  }
};

const editName = () => {
  if (isNameEditing.value && quizId && testName.value) {
    if (initTestName.value !== testName.value) {
      quizService.updateQuiz(quizId, { name: testName.value })
      initTestName.value = testName.value
    }
    isNameEditing.value = false
  }
  else if (!isNameEditing.value) {
    isNameEditing.value = true
  }
}

const editQuestionsList = () => {
  if (!isQuestionsListEditing.value) {
    isQuestionsListEditing.value = true
  }
  else {
    cancelQuestionsListEditing()
  }
}

const saveQuestionsList = async () => {
  if (!quizId) {
    return
  }
  isLoading.value = true
  store.setSelectedQuestions(questions.value)
  quizService.updateQuiz(quizId, {
    questions: store.getSelectedQuestions.map(item => item.id)
  })
    .finally(() => isLoading.value = false)
  isQuestionsListEditing.value = false
};

const cancelQuestionsListEditing = () => {
  questions.value = [...store.getSelectedQuestions]
  isQuestionsListEditing.value = false
};

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
    emits: {
      onSaveSettings: saveSettings
    },
    data: {
      initialSettings: store.getTakeSettings
    }
  });
}

const saveSettings = async (settings) => {
  isLoading.value = true
  await quizService.updateQuiz(quizId, {
    settings: settings
  })
    .then(() => {
      toastService.showSuccessMessage(toast, 'Настройки прохождения сохранены')
    })
    .finally(() => isLoading.value = false)
}
</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-5 pt-10">
      <div class="flex flex-col md:flex-row gap-5">
        <h1 v-if="!isNameEditing" class="font-bold text-3xl">{{ testName }}</h1>
        <div v-else class="flex flex-col gap-2 w-full">
          <label for="group-name"><b>Название теста *</b></label>
          <InputText id="group-name" v-model="testName" :invalid="showError" @focus="onFocus" @blur="onBlur"
            placeholder="Введите название теста" fluid />
        </div>
        <Button variant="text" :icon="!isNameEditing ? 'pi pi-pencil' : 'pi pi-check'" @click="editName"></Button>
        <div class="md:!text-end" style="flex-grow: 1;">
          <Button class="h-full" :label="isNameEditing ? '' : 'Настроить доступ'" icon="pi pi-lock" iconPos="right"
            variant="outlined" @click="openPermissionsDialog"></Button>
        </div>
      </div>
      <div class="flex flex-col gap-5">
        <Button label="Настроить прохождение" icon="pi pi-objects-column" variant="outlined" iconPos="right"
          @click="openTakeSettingsDialog"></Button>
        <DataTable :value="questions" :loading="isLoading" scrollable scrollHeight="60vh">
          <template #empty> Нет прикрепленных вопросов </template>
          <Column header="#">
            <template #body="slotProps">
              {{ slotProps.index + 1 }}
            </template>
          </Column>
          <Column field="question" header="Вопрос"></Column>
          <Column class="w-10%">
            <template #header>
              <div class="flex flex-col gap-2 justify-end w-full">
                <Button @click="goToSelectQuestions" variant="outlined" label="Прикрепить"
                  icon="pi pi-paperclip" iconPos="right"></Button>
                <Button @click="editQuestionsList" variant="outlined" label="Открепить" icon="pi pi-trash"
                  iconPos="right"></Button>
              </div>
            </template>
            <template #body="slotProps">
              <div class="flex justify-end">
                <Button @click="editQuestion(slotProps.data.id)" variant="text" icon="pi pi-pencil"></Button>
              </div>
            </template>
          </Column>
          <Column v-if="isQuestionsListEditing">
            <template #body="{ data }">
              <Button @click="deleteQuestion(data.id)" variant="text" icon="pi pi-trash"></Button>
            </template>
          </Column>
        </DataTable>
        <div v-if="isQuestionsListEditing" class="flex justify-end gap-2">
          <Button @click="cancelQuestionsListEditing" variant="outlined" label="Отмена"></Button>
          <Button @click="saveQuestionsList" label="Сохранить" icon="pi pi-check" iconPos="right"></Button>
        </div>
      </div>
    </div>
  </main>
</template>