<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Button, ProgressBar, ProgressSpinner, useConfirm } from 'primevue';
import quizService from '@/api/services/quizService';
import { useSessionStore } from '@/stores/session';
import { hideSidebar } from '@/components/Sidepanel/state';
import Question from '@/components/Question.vue';
import SideQuestionsListbox from '@/components/SideQuestionsListbox.vue';
import { useToast } from 'primevue';

// State
var testName = ref('');
const questions = ref([]);
const selectedQuestion = ref(null);
const currentQuestionIndex = computed(() => selectedQuestion.value ? selectedQuestion.value.index : 0);
const selectedAnswers = ref([]);
const isLoading = ref(false);
const router = useRouter();
const store = useSessionStore();
const confirm = useConfirm();
const toast = useToast()

hideSidebar();

onMounted(async () => {
  isLoading.value = true;
  try {
    const session = ref(null);
    console.log('Stored session', store.getSessionId());
    console.log(store.getTest);
    let test = store.getTest;
    test = store.getTest;
    if (store.getSessionId()) {
      session.value = (await quizService.getSession(store.getSessionId()).catch(error => {
        if (error?.response?.data?.error_code === 'session_not_exists') {
          toast.add({ severity: 'error', summary: 'Ошибка', detail: 'Сессия завершена', life: 3000 })
          router.back();
        }
      })).data;
    }
    else {
      const testId = test.id;
      let settings = store.getSettings;
      let invite = store.getInviteHash();
      session.value = (await quizService.startQuizSession({
        quiz_id: testId,
        settings: settings,
        link_hash: invite
      })).data;
      console.log(session.value);
      store.startSession(session.value.session_id);
      console.log('Got session id', store.getSessionId());
    }

    if (session.value) {
      testName = test.name;
      for (let i = 0; i < test.questions_number; i++) {
        var isAnswered = i in session.value.answered_questions;
        var isCorrect = false;
        if (isAnswered) {
          isCorrect = session.value.answered_questions[i];
        }
        questions.value.push({ questionData: { is_answered: isAnswered, is_correct: isCorrect }, index: i });
      }
      var index = session.value.current_question_index > 0 ? session.value.current_question_index : 0;
      selectedQuestion.value = questions.value[index];
    }
  }
  catch (error) {
    console.log(error);
  }
  finally {
    isLoading.value = false;
  }
});

const currentQuestion = ref(null);
const progress = computed(() => (!isLoading.value ? ((currentQuestionIndex.value + 1) / questions.value.length) * 100 : 0));
const unansweredCount = computed(() => questions.value.filter(q => !q.questionData.is_answered).length);

watch(selectedQuestion, async () => {
  await setCurrentQuestion(selectedQuestion.value.index);
})

// Methods
const setCurrentQuestion = async (index) => {
  selectedAnswers.value = []; // Сброс выбора при смене вопроса
  currentQuestion.value = (await quizService.goToQuestion(store.getSessionId(), index)).data.data;
};

const nextQuestion = () => {
  if (!isLoading.value && currentQuestionIndex.value < questions.value.length - 1) {
    selectedQuestion.value = questions.value[currentQuestionIndex.value + 1];
  }
};

const submitAnswer = async () => {
  if (!isLoading.value && currentQuestion && selectedAnswers.value.length > 0) {
    const question = questions.value[currentQuestionIndex.value];
    quizService.answerQuestion(store.getSessionId(), {
      question_id: currentQuestion.value.id,
      answers: selectedAnswers.value
    })
      .then(function (response) {
        question.questionData.is_correct = response.data.data.is_correct;
        nextQuestion();
      });
    question.questionData.is_answered = true;
    selectedAnswers.value = []; // Очистка после отправки
  }

  if (unansweredCount.value === 0) {
    completeTest();
  }
};

const completeTest = () => {
  confirm.require({
    message: `Вы уверены, что хотите завершить тест?
        ${unansweredCount.value === 0
        ? ' Вы ответили на все вопросы!'
        : ' Вам осталось ответить на ' + unansweredCount.value + ' из ' + questions.value.length + '.'}`,
    header: 'Завершить выполнение теста?',
    rejectProps: {
      label: 'Продолжить',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Завершить',
      icon: 'pi pi-check',
      iconPos: 'right'
    },
    accept: confirmCompleteTest
  });
};

const confirmCompleteTest = () => {
  router.replace('/test-results');
};
</script>

<template>
  <main>
    <div v-if="isLoading" class="center">
        <ProgressSpinner style="height: 10rem;" />
    </div>
    <div v-else class="flex flex-col gap-5">
      <div class="flex justify-between items-center">
        <h1 class="font-bold text-3xl py-2">{{ testName }}</h1>
        <Button @click="completeTest" variant="outlined" label="Завершить" icon="pi pi-times" iconPos="right"></Button>
      </div>

      <div>
        <ProgressBar :value="progress" style="height: 0.5rem;">{{}}</ProgressBar>
        <p class="text-right">
          {{ currentQuestionIndex + 1 }}/{{ questions.length }}
        </p>
      </div>

      <div class="flex flex-col justify-between md:flex-row gap-6">
        <div class="w-full">
          <Question v-model:selectedAnswers="selectedAnswers" v-model:currentQuestion="currentQuestion"
            :canAnswer="true" />
          <div class="flex justify-end items-center">
            <Button @click="submitAnswer" :disabled="!currentQuestion || selectedAnswers.length === 0" label="Ответить"
              icon="pi pi-check" iconPos="right"></Button>
          </div>
        </div>
        <SideQuestionsListbox class="w-full md:w-1/3" v-model:selectedQuestion="selectedQuestion" :currentQuestionIndex="currentQuestionIndex"
          :questions="questions" />
      </div>
    </div>
  </main>
</template>