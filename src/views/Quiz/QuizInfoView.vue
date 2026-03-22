<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button, Card, Divider } from 'primevue';
import TakeQuizSettings from '@/components/TakeQuizSettings.vue';
import quizService from '@/api/services/quizService';
import { useSessionStore } from '@/stores/session';
import { useAuthStore } from '@/stores/auth';
import { hideSidebar } from '@/components/Sidepanel/state';
import { formatDate, formatFromStringTime } from '@/components/utils/dateFormat';

const router = useRouter();
const route = useRoute();
const testInfo = ref(null);
const testName = ref('');
const testCreatedAt = ref('');
const testQuestiosNumber = ref('');
const shuffleAnswers = ref(false);
const shuffleQuestions = ref(false);
const isExamMode = ref(false);
const isAttemptViewEnabled = ref(false);
const takeTime = ref('');
const isLoading = ref(false);
const store = useSessionStore();

const isSettingsEditable = ref(true)

const authStore = useAuthStore();
if (authStore.isLimited) {
  hideSidebar();
}

const fillSettings = (settings) => {
  isExamMode.value = settings.is_exam_mode;
  shuffleAnswers.value = settings.shuffle_answers;
  shuffleQuestions.value = settings.shuffle_questions;
  isAttemptViewEnabled.value = settings.is_attempt_view_enabled;
  takeTime.value = settings.take_time;
}

onMounted(async () => {
  console.log('stored settings', store.getSettings())
  let storedSettings = store.getSettings();
  if (storedSettings) {
    fillSettings(storedSettings)
  }
  store.clear();
  await fetchTest();
});

const fetchTest = async () => {
  isLoading.value = true;
  try {
    const groupId = route.params.group_id;
    const testId = route.params.id;
    const invite = route.query.invite;
    if (!store.getInviteHash() && invite) {
      store.setInviteHash(invite);
    }

    if (groupId) {
      isSettingsEditable.value = false
      testInfo.value = (await quizService.getGroupQuizInfo(testId)
        .catch(() => { data: null })).data;
    }
    else {
      testInfo.value = (await quizService.getQuizInfo(testId, invite)
        .catch(() => { data: null })).data;
    }
    console.log(testInfo.value);
    testName.value = testInfo.value.name;
    testQuestiosNumber.value = testInfo.value.questions_number;
    testCreatedAt.value = testInfo.value.created_at;
    if (takeTime.value === '') {
      fillSettings(testInfo.value.settings)
    }
  }
  catch (error) {
    console.error('Error fetching test:', error);
    testInfo.value = null;
  }
  finally {
    isLoading.value = false;
  }
};

const startTest = async () => {
  console.log(testInfo.value);
  console.log('Saving test from test info');
  if (route.params.group_id) {
    store.saveGroupId(route.params.group_id)
  }
  store.saveTest(testInfo.value);
  store.setSettings({
    shuffle_questions: shuffleQuestions.value,
    shuffle_answers: shuffleAnswers.value,
    is_exam_mode: isExamMode.value,
    take_time: formatFromStringTime(takeTime.value),
    is_attempt_view_enabled: isAttemptViewEnabled.value
  })
  console.log('Pushing take-test');
  router.push('/take-test');
}
</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-5">
      <h1 class="text-surface-900 dark:text-surface-0 font-bold text-3xl">{{ testName }}</h1>
      <Card>
        <template #content>
          <div class="flex flex-col gap-4">
            <Divider />
            <div class="flex justify-between items-center">
              <h3>Дата создания</h3>
              <p>{{ formatDate(testCreatedAt) }}</p>
            </div>
            <Divider />
            <div class="flex justify-between items-center">
              <h3>Количество вопросов</h3>
              <p>{{ testQuestiosNumber }}</p>
            </div>
            <TakeQuizSettings v-model:shuffle-questions="shuffleQuestions" v-model:shuffle-answers="shuffleAnswers"
              v-model:is-exam-mode="isExamMode" v-model:is-attempt-view-enabled="isAttemptViewEnabled"
              v-model:take-time="takeTime" :is-editable="isSettingsEditable" />
          </div>
        </template>
      </Card>
      <div class="flex justify-end">
        <Button @click="startTest" label="Выполнить" icon="pi pi-play-circle" icon-pos="right"></Button>
      </div>
    </div>
  </main>
</template>