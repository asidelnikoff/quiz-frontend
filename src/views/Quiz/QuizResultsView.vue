<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Button, Card, Divider } from 'primevue';
import quizService from '@/api/services/quizService';
import { useSessionStore } from '@/stores/session';
import { showSidebar } from '@/components/Sidepanel/state';
import { formatFromMillisecondsTime } from '@/components/utils/dateFormat';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const results = ref(null);
const testName = ref('');
const testQuestiosNumber = ref('');
const allAnswers = ref('');
const correctAnswers = ref('');
const testResult = ref('');
const timeSpent = ref('');
const isLoading = ref(false);
const store = useSessionStore();
const authStore = useAuthStore();

const isAttemptViewButtonEnabled = ref(true);

const groupId = ref(store.getGroupId())

const restartButtonVariant = ref('primary');
if (!authStore.isLimited) {
  showSidebar();
  restartButtonVariant.value = 'outlined'
}

onMounted(async () => {
  await fetchResults();
});

const fetchResults = async () => {
  isLoading.value = true;
  try {
    const test = store.getTest;
    results.value = (await quizService.moveQuizSessionToResults(store.getSessionId())
      .catch(error => { null }))?.data?.data;
    console.log(results.value);
    testName.value = test.name;
    testQuestiosNumber.value = test.questions_number;
    allAnswers.value = results.value.all_answers;
    correctAnswers.value = results.value.correct_answers;
    testResult.value = results.value.result.toFixed(2);
    timeSpent.value = formatFromMillisecondsTime(results.value.time_spent);
    if (store.getSettings) {
      isAttemptViewButtonEnabled.value = store.getSettings.is_attempt_view_enabled
    }
  } catch (error) {
    console.error('Error fetching test:', error);
    results.value = null;
  } finally {
    isLoading.value = false;
  }
};

const restartTest = () => {
  const id = store.getTest.id;
  quizService.endQuizSession(store.getSessionId());
  store.removeSession();
  let route = `/test/${id}`;
  if (groupId.value) {
    router.replace(`/group/${groupId.value}` + route);
    return
  }
  console.log('invite', store.getInviteHash())
  if (store.getInviteHash()) {
    route += `?invite=${store.getInviteHash()}`
  }
  router.replace(route);
}

const goToTests = () => {
  quizService.endQuizSession(store.getSessionId());
  store.clear();
  if (groupId.value) {
    router.replace(`/group/${groupId.value}`)
  }
  else {
    router.replace('/');
  }
}

const goToDetailedResults = async () => {
  router.push({ name: 'detailed-results' });
}

const toLogin = () => {
  router.replace('/login')
}
</script>

<template>
  <main>
    <div class="flex flex-col gap-5">
      <div class="flex flex-row justify-between">
        <h1 class="font-bold text-3xl">{{ testName }}</h1>
        <Button v-if="isAttemptViewButtonEnabled" label="Подробнее" class="text-end" variant="outlined"
          icon="pi pi-arrow-right" icon-pos="right" @click="goToDetailedResults"
          :disabled="!isAttemptViewButtonEnabled" />
      </div>
      <Card>
        <template #content>
          <div class="flex justify-center items-center">
            <h2 class="font-bold text-2xl">Ваш результат: {{ testResult }}%</h2>
          </div>
          <div class="flex flex-col gap-4 py-4">
            <Divider />
            <div class="flex justify-between items-center">
              <h3>Количество вопросов</h3>
              <p>{{ testQuestiosNumber }}</p>
            </div>
            <Divider />
            <div class="flex justify-between items-center">
              <h3>Всего ответов</h3>
              <p>{{ allAnswers }}</p>
            </div>
            <Divider />
            <div class="flex justify-between items-center">
              <h3>Верных ответов</h3>
              <p>{{ correctAnswers }}</p>
            </div>
            <Divider />
            <div class="flex justify-between items-center">
              <h3>Затрачено времени</h3>
              <p>{{ timeSpent }}</p>
            </div>
            <Divider />
          </div>
        </template>
      </Card>
      <div class="flex justify-end items-center gap-4 pt-5">
        <Button v-if="authStore.isLimited" @click="toLogin" variant="outlined" label="Завершить" icon="pi pi-sign-out"
          icon-pos="right">Завершить</Button>
        <Button @click="restartTest" :variant="restartButtonVariant" label="Повторить" icon="pi pi-undo"
          icon-pos="right"></Button>
        <Button v-if="!authStore.isLimited" @click="goToTests" :label="groupId ? 'К группе' : 'К списку тестов'"
          icon="pi pi-home" icon-pos="right"></Button>
      </div>
    </div>
  </main>
</template>