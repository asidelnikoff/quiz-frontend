<script setup>
import { Button, Dialog, FileUpload } from 'primevue';
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import quizService from '@/api/services/quizService';

const toast = useToast();

const fileupload = ref();
const isVisible = ref(false);
const emit = defineEmits(['testUpload', 'testUploadFailed']);

const openDialog = () => {
    isVisible.value = true;
}

const closeDialog = () => {
    isVisible.value = false;
}

const uploadFile = () => {
    fileupload.value.upload();
}

function onUploadFile(event) {
    let file = event.files[0];
    quizService.uploadQuiz(file)
        .then(function () {
            fileupload.value.clear();
            fileupload.value.uploadedFileCount = 0;

            toast.add({ severity: 'success', summary: 'Успех!', detail: 'Новые тесты добавлены', life: 3000 });
            emit('testUpload');
        })
        .catch(function () {
            toast.add({ severity: 'error', summary: 'Ошибка', detail: 'При загрузке что-то пошло не так. Попробуйте снова', group: 'br', life: 3000 });
        });
}
</script>

<template>
    <Dialog v-model:visible="isVisible" modal header="Загрузка теста">
        <FileUpload class="flex flex-col items-center" :fileLimit=1 :multiple="false" customUpload
            @uploader="onUploadFile" ref="fileupload">
            <template #header="{ chooseCallback }">
                <div class="flex flex-col items-center gap-2">
                    <i class="pi pi-upload" style="font-size: 2.5rem" />
                    <Button @click="chooseCallback" variant="text"><b><u>Нажмите, чтобы выбрать файл</u></b></Button>
                </div>
            </template>
            <template #empty>
                <div class="flex flex-col items-center">
                    <p>или</p>
                    <p>перетащите его <i>сюда</i></p>
                </div>
            </template>
            <template #content="{ files, removeFileCallback }">
                <div v-if="files.length > 0">
                    <div class="flex flex-wrap gap-4">
                        <div v-for="(file, index) of files" :key="file.name + file.type + file.size"
                            class="p-3 rounded-border flex flex-row items-center w-full justify-between">
                            <span class="font-semibold text-ellipsis max-w-60 whitespace-nowrap overflow-hidden">{{
                                file.name }}</span>
                            <div>{{ file.size }} B</div>
                            <Button @click="removeFileCallback" variant="text" icon="pi pi-trash"></Button>
                        </div>
                    </div>
                </div>
            </template>
        </FileUpload>
        <div class="flex justify-end gap-4 pt-5">
            <Button @click="closeDialog" variant="outlined">Отмена</Button>
            <Button @click="uploadFile" label="Загрузить" icon="pi pi-check" iconPos="right"></Button>
        </div>
    </Dialog>
    <Button variant="outlined" @click="openDialog" label="Загрузить из файла" icon="pi pi-upload"
        iconPos="right"></Button>
</template>
