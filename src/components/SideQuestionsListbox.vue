<script setup>
import { Listbox, Button, DataTable, Column, Panel, Card } from 'primevue';
import { ref, watch } from 'vue';

const props = defineProps(['currentQuestionIndex', 'questions'])
const selectedQuestion = defineModel('selectedQuestion')

const list = ref(null)

watch(selectedQuestion, () => {
  var range = list.value.getVirtualScrollerRef().getRenderedRange()
  console.log(list.value.getVirtualScrollerRef().getRenderedRange())
  if (range.viewport.last <= (props.currentQuestionIndex + 1) || range.viewport.first >= props.currentQuestionIndex) {
    list.value.getVirtualScrollerRef().scrollToIndex(props.currentQuestionIndex);
  }
  console.log(list.value.getVirtualScrollerRef().getRenderedRange())
})

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

const onRowUnselect = (event) => {
  selectedQuestion.value = event.data
}
</script>

<template>
  <div class="flex flex-col items-center w-full overflow-y-auto">
      <DataTable ref="list" 
      v-model:selection="selectedQuestion" 
      style="max-height: 30vh;" 
      :value="props.questions" selectionMode="single" 
      class="w-full"
      :showHeaders="false" 
      :showGridlines="true"
      scrollable scrollHeight="30vh" :virtualScrollerOptions="{ itemSize: 49 }"
      @rowUnselect="onRowUnselect">
        <Column>
          <template #body="slotProps">
            <div class="flex flex-wrap items-center gap-4 w-full justify-between">
              <p>Вопрос {{ slotProps.index + 1 }}</p>
              <span v-if="slotProps.data.questionData.is_answered">
                <i v-if="slotProps.data.questionData.is_correct === true" class="pi pi-check-circle" alt="Correct" />
                <i v-else-if="slotProps.data.questionData.is_correct === false" class="pi pi-times-circle"
                  alt="Incorrect" />
                <i v-else class="pi pi-question-circle" alt="Answered" />
              </span>
            </div>
          </template>
        </Column>
      </DataTable>
    <div class="flex flex-col w-full gap-4 py-5">
      <Button @click="prevQuestion" :disabled="props.currentQuestionIndex === 0" variant="outlined"
        label="Предыдущий вопрос" icon="pi pi-chevron-left"></Button>
      <Button @click="nextQuestion" :disabled="props.currentQuestionIndex === props.questions.length - 1"
        variant="outlined" label="Следующий вопрос" icon="pi pi-chevron-right" iconPos="right"></Button>
    </div>
  </div>
</template>