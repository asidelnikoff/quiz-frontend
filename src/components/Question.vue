<script setup>
import { Card, Checkbox, Divider, RadioButton, InputText } from 'primevue';
import { computed, ref, warn, watch } from 'vue';

const props = defineProps(['canAnswer'])

const userAnswer = ref(null)
const answerText = ref(null)
const correctAnswerText = ref(null)

const currentQuestion = defineModel('currentQuestion')
const selectedAnswers = defineModel('selectedAnswers')

const isSinglechoice = computed(() => currentQuestion?.value?.answer_request.type === 'singlechoice')
const isMultichoice = computed(() => currentQuestion?.value?.answer_request.type === 'multichoice')
const isWordOrPhrase = computed(() => currentQuestion?.value?.answer_request.type === 'word_or_phrase')

if (!isMultichoice.value) {
  userAnswer.value = selectedAnswers.value[0] || ''
  answerText.value = selectedAnswers.value[0] || ''
}

watch(currentQuestion, () => {
  if (isWordOrPhrase.value) {
    let rightAnswer = currentQuestion.value.answer_request.answers?.filter(a => a.is_correct) || [];
    console.log(rightAnswer)
    if (rightAnswer.length > 0) {
      correctAnswerText.value = rightAnswer[0].answer
    }
  }
})

watch(answerText, () => {
  if (isMultichoice.value) {
    return;
  }

  selectedAnswers.value = [answerText.value]
})

watch(userAnswer, () => {
  if (isMultichoice.value) {
    return;
  }

  selectedAnswers.value = [userAnswer.value]
})

watch(selectedAnswers, () => {
  if (isMultichoice.value) {
    return;
  }

  userAnswer.value = selectedAnswers.value[0]
  if (userAnswer?.value?.answer) {
    answerText.value = userAnswer.value.answer
  }
})
</script>

<template>
  <div class="flex flex-col">
    <Card>
      <template #content>
        <div class="flex justify-between">
          <div class="flex flex-wrap items-center p-3 gap-5">
            <i class="pi pi-question-circle" />
            <p class="text-lg">{{ currentQuestion?.question }}</p>
          </div>
          <span v-if="currentQuestion?.is_answered === true">
            <i v-if="currentQuestion?.is_correct === true" class="pi pi-check-circle" alt="Correct" />
            <i v-else-if="currentQuestion?.is_correct === false" class="pi pi-times-circle" alt="Incorrect" />
            <i v-else class="pi pi-question-circle" alt="Answered" />
          </span>
        </div>
      </template>
    </Card>
    <div v-if="isWordOrPhrase" class="flex flex-col gap-5 w-full py-10 items-center">
      <div class="flex flex-col gap-5 w-full">
        <label v-if="!props.canAnswer" for="question-answer"><b>Мой ответ</b></label>
        <InputText id="question-answer" fluid v-model="answerText" placeholder="Мой ответ" :readonly="!props.canAnswer"
          :disabled="!props.canAnswer" />
      </div>
      <div v-if="!props.canAnswer" class="flex flex-col gap-5 w-full">
        <label for="question-answer-right"><b>Верный ответ</b></label>
        <InputText id="question-answer-right" fluid v-model="correctAnswerText" placeholder="Верный ответ"
          :readonly="true" />
      </div>
    </div>
    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4 py-5">
      <label v-for="(answer, index) in currentQuestion?.answer_request.answers || []" :key="index">
        <div class="flex flex-col p-5">
          <div class="flex flex-row items-center justify-between px-3">
            <div class="flex gap-5 items-center">
              <i v-if="answer.is_correct === true" class="pi pi-check-circle" alt="Correct" />
              <i v-else-if="answer.is_correct === false && answer.is_selected === true" class="pi pi-times-circle"
                alt="Incorrect" />
              <p>{{ answer.answer || answer }}</p>
            </div>
            <Checkbox v-if="isMultichoice" v-model="selectedAnswers" :value="answer" :disabled="!props.canAnswer" />
            <RadioButton v-if="isSinglechoice" v-model="userAnswer" :value="answer" :inputId="answer.answer || answer"
              :disabled="!props.canAnswer" />
          </div>
          <Divider />
        </div>
      </label>
    </div>
  </div>
</template>