<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import quizService from '@/api/services/quizService';
import { hideSidebar } from '@/components/Sidepanel/state';
import { useSessionStore } from '@/stores/session';
import Quiz from '@/components/Quiz.vue';

const router = useRouter();
const route = useRoute()
const store = useSessionStore();

var quizName = ref('');
const questions = ref([]);
const selectedQuestion = ref(null);
const currentQuestion = ref(null);
const selectedAnswers = ref([]);
const isLoading = ref(false);

if (!route.query.id) {
  hideSidebar();
}

onMounted(async () => {
  isLoading.value = true;
  try {
    let sessionId = route.query.id;
    if (!sessionId) {
      sessionId = store.getSessionId()
    }
    var result = await quizService.getDetailedQuizSessionResults(sessionId)
    quizName = result.data.quiz_name
    for (let i = 0; i < result.data.questions.length; i++) {
      questions.value.push({ index: i, questionData: result.data.questions[i] })
    }

    selectedQuestion.value = questions.value[0];
    console.log(result.data);
  }
  catch (error) {
    console.log(error);
  }
  finally {
    isLoading.value = false;
  }
});

watch(selectedQuestion, async () => {
  selectedAnswers.value = selectedQuestion.value.questionData.answer_request.answers?.filter(a => a.is_selected) || [];
  currentQuestion.value = selectedQuestion.value.questionData;
})

const completeTest = () => {
  router.back();
};
</script>

<template>
  <main>
    <Quiz mode="view" :quizName="quizName" :questions="questions" v-model:selectedQuestion="selectedQuestion"
      v-model:selectedAnswers="selectedAnswers" v-model:currentQuestion="currentQuestion" v-model:isLoading="isLoading" @complete="completeTest"/>
  </main>
</template>