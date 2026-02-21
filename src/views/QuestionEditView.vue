<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Button, DataTable, Column, InputText, Textarea, Checkbox, Select, RadioButton } from 'primevue';
import quizService from '@/api/services/quizService';

const route = useRoute();
const questionId = route.params.id;

const questionText = ref('');
const answers = ref([
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
]);
const selectedAnswerIndex = ref(0);
const rightAnswer = ref('ответ');

const questionTypes = ref([
  { type: 'multichoice', description: 'Мноежственный выбор' },
  { type: 'singlechoice', description: 'Единственный выбор' },
  { type: 'word_or_phrase', description: 'Слово или фраза' }
])
const selectedType = ref(null)
const isMultichoice = computed(() => selectedType.value === questionTypes.value[0])
const isSinglechoice = computed(() => selectedType.value === questionTypes.value[1])
const isWordOrPhrase = computed(() => selectedType.value === questionTypes.value[2])

const router = useRouter();
const isEditing = computed(() => questionId);

const isSinglechoiceAnswerFulfilled = computed(() => isSinglechoice.value && answers.value.length >= 2 && answers.value.filter(item => item.isCorrect).length === 1)
const isMultichoiceAnswerFulfilled = computed(() => isMultichoice.value && answers.value.length >= 2 && answers.value.filter(item => item.isCorrect).length > 0)
const isWordOrPhraseAnswerFulfilled = computed(() => isWordOrPhrase.value && rightAnswer && rightAnswer.value.length > 0)
const isAnswersFulfilled = computed(() => isMultichoiceAnswerFulfilled.value || isSinglechoiceAnswerFulfilled.value || isWordOrPhraseAnswerFulfilled.value)
const isFulfilled = computed(() => questionText && isAnswersFulfilled.value);

watch(selectedType, (_, oldValue) => {
  if (oldValue === questionTypes.value[2] && rightAnswer.value) {
    answers.value = [{ text: rightAnswer.value, isCorrect: true }]
    selectedAnswerIndex.value = 0
  }

  if (oldValue === questionTypes.value[1]) {
    rightAnswer.value = answers.value[selectedAnswerIndex.value].text
  }

  if (oldValue === questionTypes.value[0]) {
    if (answers.value.length > 0) {
      selectedAnswerIndex.value = answers.value.findIndex(a => a.isCorrect);
      if (selectedAnswerIndex.value < 0) {
        selectedAnswerIndex.value = 0;
      }

      answers.value.forEach(a => a.isCorrect = false)
      answers.value[selectedAnswerIndex.value].isCorrect = true

      rightAnswer.value = answers.value[selectedAnswerIndex.value].text
    }
  }
})

// Load data for editing
onMounted(async () => {
  if (questionId) {
    const loadedQuestion = await quizService.getQuestionForEdit(questionId)
      .catch(function (error) { router.back(); }); // todo maybe to show 404 page
    if (loadedQuestion) {
      questionText.value = loadedQuestion.data.question;
      selectedType.value = questionTypes.value.find(a => a.type === loadedQuestion.data.answer_request.type)
      if (isWordOrPhrase.value) {
        rightAnswer.value = loadedQuestion.data.answer_request.right_answer
      }
      else {
        let rightAnswers = loadedQuestion.data.answer_request.right_answers || [loadedQuestion.data.answer_request.right_answer]
        answers.value = loadedQuestion.data.answer_request.answers.map((ans) => ({ text: ans, isCorrect: rightAnswers.includes(ans) }));
        selectedAnswerIndex.value = answers.value.indexOf(answers.value.find((a) => rightAnswers.includes(a.text)))
      }

    }
    else {
      console.error('Question not found');
    }
  }
  else {
    selectedType.value = questionTypes.value[0]
    answers.value = [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ];
  }
});

// Methods
const addAnswer = () => {
  answers.value.push({ text: '', isCorrect: false });
};

const deleteAnswer = (index) => {
  if (answers.value.length > 2) {
    answers.value.splice(index, 1);
  }

  if (index === selectedAnswerIndex.value) {
    selectedAnswerIndex.value = 0;
  }
};

const goToQuestions = () => {
  router.back();
};

const saveQuestion = async () => {
  if (!isFulfilled) {
    return;
  }

  if (isSinglechoice.value) {
    answers.value.forEach(a => a.isCorrect = false);
    answers.value[selectedAnswerIndex.value].isCorrect = true;
  }

  const params = {
    question: questionText.value,
    answers_request: createAnswerRequest()
  };

  if (questionId) {
    quizService.updateQuestion(questionId, params);
  }
  else {
    quizService.createQuestion(params);
  }

  goToQuestions();
};

const createAnswerRequest = () => {
  if (isSinglechoice.value) {
    return {
      $type: selectedType.value.type,
      answers: answers.value.map(item => item.text),
      right_answer: answers.value.find(item => item.isCorrect)?.text
    }
  }

  if (isMultichoice.value) {
    return {
      $type: selectedType.value.type,
      answers: answers.value.map(item => item.text),
      right_answers: answers.value.filter(item => item.isCorrect).map(item => item.text)
    }
  }

  if (isWordOrPhrase.value) {
    return {
      $type: selectedType.value.type,
      right_answer: rightAnswer.value
    }
  }
}
</script>

<template>
  <main>
    <div class="flex flex-col items-left gap-10">
      <h1 class="font-bold text-3xl">Создание вопроса</h1>
      <div class="flex flex-col gap-5">
        <div class="flex flex-col gap-2 w-full">
          <label for="question-text" class="block"><b>Текст вопроса *</b></label>
          <Textarea id="question-text" autoResize v-model="questionText" placeholder="Введите текст вопроса...">
          </Textarea>
        </div>
        <div class="flex flex-col gap-2 w-full">
          <label for="answer-type" class="block"><b>Тип ответа</b></label>
          <Select id="answer-type" :options="questionTypes" optionLabel="description" v-model="selectedType"></Select>
        </div>
        <div v-if="isWordOrPhrase" class="flex flex-col gap-2 w-full">
          <label for="question-answer" class="block"><b>Ответ</b></label>
          <InputText id="question-answer" fluid v-model="rightAnswer" placeholder="Введите ответ..." />
        </div>
        <DataTable v-else :value="answers" scrollable scrollHeight="flex" style="max-height: 50vh;">
          <Column #body="slotProps" style="width: 3rem;">
            <Checkbox v-model="slotProps.data.isCorrect" binary v-if="isMultichoice" />
            <RadioButton v-if="isSinglechoice" v-model="selectedAnswerIndex" :value="slotProps.index"
              :inputId="slotProps.index.toString()" />
          </Column>
          <Column header="Ответ">
            <template #body="slotProps">
              <InputText fluid v-model="slotProps.data.text" />
            </template>
          </Column>
          <Column headerClass="!text-end" class="!text-end" style="width: 20%;">
            <template #header>
              <Button @click="addAnswer" variant="outlined" label="Добавить ответ" icon="pi pi-plus-circle"
                iconPos="right"></Button>
            </template>
            <template #body="slotProps">
              <Button @click="deleteAnswer(slotProps.index)" variant="text" icon="pi pi-trash"></Button>
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-end gap-5">
          <Button @click="goToQuestions" variant="outlined" label="Отмена"></Button>
          <Button @click="saveQuestion" :disabled="!isFulfilled" :label="isEditing ? 'Сохранить' : 'Создать'"
            icon="pi pi-check" iconPos="right">
          </Button>
        </div>
      </div>
    </div>
  </main>
</template>