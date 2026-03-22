<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, onBeforeRouteLeave } from 'vue-router';
import { useConfirm } from 'primevue';
import quizService from '@/api/services/quizService';
import { useSessionStore } from '@/stores/session';
import { hideSidebar } from '@/components/Sidepanel/state';
import { useToast } from 'primevue';
import toastService from '@/components/utils/toastService';
import Quiz from '@/components/Quiz.vue';

// State
var quizName = ref('');
const questions = ref([]);
const selectedQuestion = ref(null);
const selectedAnswers = ref([]);
const currentQuestion = ref(null);
const currentQuestionIndex = computed(() => selectedQuestion.value ? selectedQuestion.value.index : 0);
const unansweredCount = computed(() => questions.value.filter(q => !q.questionData.is_answered).length);
const isLoading = ref(false);

const router = useRouter();
const confirm = useConfirm();
const toast = useToast()
const store = useSessionStore();

hideSidebar()

onMounted(async () => {
  isLoading.value = true;
  try {
    const session = ref(null);
    console.log('Stored session', store.getSessionId());
    console.log(store.getTest());
    let test = store.getTest();
    if (store.getSessionId()) {
      session.value = (await quizService.getSession(store.getSessionId()).catch(error => {
        toastService.showBackendErrorMessage(toast, error)
        if (error?.response?.data?.error_code === 'session_not_exists') {
          router.back();
        }
      })).data;
    }
    else {
      const testId = test.id;
      let settings = store.getSettings();
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
      quizName = test.name;
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

onBeforeRouteLeave((to, _) => {
    if (to.name !== 'test-results' && to.name !== 'test' && to.name !== 'group-test') {
        store.clear()
    }
})

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
    <Quiz mode="answer" :quizName="quizName" :questions="questions" v-model:selectedQuestion="selectedQuestion"
      v-model:selectedAnswers="selectedAnswers" v-model:currentQuestion="currentQuestion" v-model:isLoading="isLoading" 
      @complete="completeTest"
      @submit="submitAnswer"/>
  </main>
</template>