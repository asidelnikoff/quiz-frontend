<script setup>
import { computed } from 'vue'
import { Checkbox, InputMask, Divider } from 'primevue'

const props = defineProps(['isEditable'])

const isEditable = computed(() => props.isEditable === undefined ? true : props.isEditable)

const shuffleQuestions = defineModel('shuffleQuestions')
const shuffleAnswers = defineModel('shuffleAnswers')
const isAttemptViewEnabled = defineModel('isAttemptViewEnabled')
const isExamMode = defineModel('isExamMode')
const takeTime = defineModel('takeTime')

</script>

<template>
    <Divider />
    <div class="flex justify-between items-center">
        <label for="shuffleQuestions">Перемешать вопросы</label>
        <Checkbox v-if="isEditable" binary v-model="shuffleQuestions" inputId="shuffleQuestions"
            :disabled="!isEditable" />
        <label v-else>{{ shuffleQuestions ? 'Да' : 'Нет' }}</label>
    </div>
    <Divider />
    <div class="flex justify-between items-center">
        <label for="shuffleAnswers">Перемешать ответы</label>
        <Checkbox v-if="isEditable" binary v-model="shuffleAnswers" inputId="shuffleAnswers" :disabled="!isEditable" />
        <label v-else>{{ shuffleAnswers ? 'Да' : 'Нет' }}</label>
    </div>
    <Divider />
    <div class="flex justify-between items-center">
        <div class="flex flex-row gap-5 items-center">
            <label for="examMode">Режим экзамена</label>
            <i class="pi pi-info-circle" v-tooltip="'В режиме экзамена не показывается коррекнтность ответов'" />
        </div>
        <Checkbox v-if="isEditable" binary v-model="isExamMode" inputId="examMode" :disabled="!isEditable" />
        <label v-else>{{ isExamMode ? 'Да' : 'Нет' }}</label>
    </div>
    <Divider />
    <div class="flex justify-between items-center">
        <label for="isAttemptViewEnabled">Просмотр при завершении</label>
        <Checkbox v-if="isEditable" binary v-model="isAttemptViewEnabled" inputId="isAttemptViewEnabled"
            :disabled="!isEditable" />
        <label v-else>{{ isAttemptViewEnabled ? 'Да' : 'Нет' }}</label>
    </div>
    <Divider />
    <div class="flex justify-between items-center">
        <label for="takeTime">Время на прохождение</label>
        <InputMask v-if="isEditable" id="takeTime" mask="99:99" placeholder="чч:мм" v-model="takeTime"
            :disabled="!isEditable" />
        <label v-else>{{ takeTime }}</label>
    </div>
    <Divider />
</template>