<script setup>
import { ref, inject } from 'vue';
import { ProgressSpinner, Button } from 'primevue';
import TakeQuizSettings from './TakeQuizSettings.vue';
import { useTestStore } from '@/stores/test';
import quizService from '@/api/services/quizService';
import groupService from '@/api/services/groupService';
import { formatFromStringTime } from './utils/dateFormat';

const dialogRef = inject('dialogRef');
const testStore = useTestStore();

const isLoading = ref(false)

const shuffleQuestions = ref(false)
const shuffleAnswers = ref(false)
const isAttemptViewEnabled = ref(true)
const isExamMode = ref(false)
const takeTime = ref('')

const fetchSettings = () => {
    try {
        isLoading.value = true
        let settings = testStore.getTakeSettings;

        if (settings) {
            shuffleQuestions.value = settings.shuffle_questions
            shuffleAnswers.value = settings.shuffle_answers
            isExamMode.value = settings.is_exam_mode
            takeTime.value = settings.take_time
            isAttemptViewEnabled.value = settings.is_attempt_view_enabled
        }
    }
    finally {
        isLoading.value = false
    }
}

fetchSettings()

const close = () => {
    dialogRef.value.close();
}

const save = () => {
    testStore.setTakeSettings({
        shuffle_questions: shuffleQuestions.value,
        shuffle_answers: shuffleAnswers.value,
        is_exam_mode: isExamMode.value,
        take_time: formatFromStringTime(takeTime.value),
        is_attempt_view_enabled: isAttemptViewEnabled.value
    })

    if (dialogRef.value.data.quizId) {
        if (dialogRef.value.data.groupId) {
            groupService.updateGroupQuizz(dialogRef.value.data.groupId, {
                quiz_id: dialogRef.value.data.quizId,
                settings: testStore.getTakeSettings
            })
        }
        else {
            quizService.updateQuiz(dialogRef.value.data.quizId, {
                settings: testStore.getTakeSettings
            })
        }
    }
    close()
}
</script>

<template>
    <div v-if="isLoading" class="text-center">
        <ProgressSpinner style="height: 10rem;" />
    </div>
    <div v-else class="flex flex-col gap-5 w-full">
        <TakeQuizSettings v-model:shuffle-questions="shuffleQuestions" v-model:shuffle-answers="shuffleAnswers"
            v-model:is-exam-mode="isExamMode" v-model:is-attempt-view-enabled="isAttemptViewEnabled"
            v-model:take-time="takeTime" />
        <div class="flex flex-row gap-2 w-full justify-end">
            <Button label="Отмена" variant="outlined" @click="close"></Button>
            <Button label="Сохранить" icon="pi pi-check" icon-pos="right" @click="save"></Button>
        </div>
    </div>
</template>