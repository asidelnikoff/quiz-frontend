<script setup>
import { Button, ProgressBar } from 'primevue';
import Question from './Question.vue';
import SideQuestionsListbox from './SideQuestionsListbox.vue';
import LoadingSpinner from './LoadingSpinner/LoadingSpinner.vue';
import { computed } from 'vue';

const emit = defineEmits('complete', 'submit')

const mode = defineModel('mode')

const quizName = defineModel('quizName')
const selectedQuestion = defineModel('selectedQuestion');
const selectedAnswers = defineModel('selectedAnswers');
const currentQuestion = defineModel('currentQuestion');
const isLoading = defineModel('isLoading');
const props = defineProps(['questions'])

const currentQuestionIndex = computed(() => selectedQuestion.value ? selectedQuestion.value.index : 0);
const progress = computed(() => (((currentQuestionIndex.value + 1) / props.questions.length) * 100));

const isViewMode = computed(() => mode.value === 'view')
const isAnswerMode = computed(() => mode.value === 'answer')
</script>

<template>
    <div v-if="!isLoading" class="flex flex-col gap-5">
        <div class="flex justify-between items-center">
            <h1 class="font-bold text-3xl py-2">{{ quizName }}</h1>
            <Button @click="emit('complete')" variant="outlined" :label="isAnswerMode ? 'Завершить' : 'Вернуться'"
                :icon="isAnswerMode ? 'pi pi-times' : 'pi pi-arrow-left'" :iconPos="isAnswerMode ? 'right' : 'left'">
            </Button>
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
                    :canAnswer="isAnswerMode" />
                <div v-if="isAnswerMode" class="flex justify-end items-center">
                    <Button @click="emit('submit')" :disabled="!currentQuestion || selectedAnswers.length === 0"
                        label="Ответить" icon="pi pi-check" iconPos="right"></Button>
                </div>
            </div>
            <SideQuestionsListbox class="w-full md:w-1/3" v-model:selectedQuestion="selectedQuestion"
                :currentQuestionIndex="currentQuestionIndex" :questions="props.questions" />
        </div>
    </div>
    <LoadingSpinner :isLoading="isLoading" />
</template>