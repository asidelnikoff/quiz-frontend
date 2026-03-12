<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Button, ProgressBar } from 'primevue';
import quizService from '@/api/services/quizService';
import Question from '@/components/Question.vue';
import SideQuestionsListbox from '@/components/SideQuestionsListbox.vue';
import { hideSidebar } from '@/components/Sidepanel/state';
import { useSessionStore } from '@/stores/session';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const router = useRouter();
const route = useRoute()
const store = useSessionStore();

var testName = ref('');
const questions = ref([]);
const selectedQuestion = ref(null);
const currentQuestionIndex = computed(() => selectedQuestion.value ? selectedQuestion.value.index : 0);
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
    testName = result.data.quiz_name
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

const currentQuestion = ref(null);
const progress = computed(() => (!isLoading.value ? ((currentQuestionIndex.value + 1) / questions.value.length) * 100 : 0));

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
    <div class="flex flex-col gap-5">
      <div class="flex justify-between items-center">
        <h1 class="font-bold text-3xl">{{ testName }}</h1>
        <Button @click="completeTest" variant="outlined" label="Вернуться" icon="pi pi-arrow-left"></Button>
      </div>

      <div>
        <ProgressBar :value="progress" style="height: 0.5rem;">{{}}</ProgressBar>
        <p class="text-right">
          {{ currentQuestionIndex + 1 }}/{{ questions.length }}
        </p>
      </div>

      <div class="flex flex-col justify-between md:flex-row gap-6">
        <Question class="w-full" v-model:currentQuestion="currentQuestion" v-model:selectedAnswers="selectedAnswers" />
        <SideQuestionsListbox class="w-full md:w-1/3" v-model:selectedQuestion="selectedQuestion" :currentQuestionIndex="currentQuestionIndex"
          :questions="questions" />
      </div>
    </div>
    <LoadingSpinner :isLoading="isLoading" />
  </main>
</template>