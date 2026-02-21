<script setup>
import { Listbox, Button } from 'primevue';

const props = defineProps(['currentQuestionIndex', 'questions'])
const selectedQuestion = defineModel('selectedQuestion')

const prevQuestion = () => {
  if (props.currentQuestionIndex > 0) {
    selectedQuestion.value = props.questions[props.currentQuestionIndex - 1];
  }
};

const nextQuestion = () => {
  if (props.currentQuestionIndex < props.questions.length - 1) {
    selectedQuestion.value = props.questions[props.currentQuestionIndex + 1];
  }
};
</script>

<template>
  <div class="flex flex-col items-center w-full overflow-y-auto">
    <Listbox v-model="selectedQuestion" :options="props.questions" optionLabel="index" class="w-full">
      <template #option="slotProps">
        <div class="flex flex-wrap items-center gap-4 w-full justify-between">
          <p>Вопрос {{ slotProps.index + 1 }}</p>
          <span v-if="slotProps.option.questionData.is_answered">
            <i v-if="slotProps.option.questionData.is_correct === true" class="pi pi-check-circle" alt="Correct" />
            <i v-else-if="slotProps.option.questionData.is_correct === false" class="pi pi-times-circle"
              alt="Incorrect" />
            <i v-else class="pi pi-question-circle" alt="Answered" />
          </span>
        </div>
      </template>
    </Listbox>
    <div class="flex flex-col w-full gap-4 py-5">
      <Button @click="prevQuestion" :disabled="props.currentQuestionIndex === 0" variant="outlined"
        label="Предыдущий вопрос" icon="pi pi-chevron-left"></Button>
      <Button @click="nextQuestion" :disabled="props.currentQuestionIndex === props.questions.length - 1"
        variant="outlined" label="Следующий вопрос" icon="pi pi-chevron-right" iconPos="right"></Button>
    </div>
  </div>
</template>