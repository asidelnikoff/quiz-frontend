
<template>
<div class="sidebar-menu flex flex-row gap-2" :style="{ width: sidebarWidth }">
    <div class="flex flex-col gap-2">
        <Button
        :class="{ 'rotate-180': collapsed }"
        @click="toggleSidebarCollpsed"
        variant="text"
        style="align-self: flex-start;">
        <i class="pi pi-angle-double-left" />
        </Button>
        <div class="grow flex flex-col w-full gap-2">
            <Sidebarlink to="/" icon="pi pi-home">Домашняя</Sidebarlink>
            <Sidebarlink to="/quizzes" icon="pi pi-clipboard">Мои тесты</Sidebarlink>
            <Sidebarlink to="/questions" icon="pi pi-question-circle">Мои вопросы</Sidebarlink>
            <Sidebarlink to="/results" icon="pi pi-wave-pulse">Мои результаты</Sidebarlink>
            <Sidebarlink to="/groups" icon="pi pi-users">Мои группы</Sidebarlink>
            <div class="flex flex-col w-full gap-2" style="margin-top: auto;">
                <Divider />
                <Sidebarlink to="/profile" icon="pi pi-user">Профиль</Sidebarlink>
                <Sidebarlink to="/login" icon="pi pi-sign-out">Выйти</Sidebarlink>
            </div>
        </div>
    </div>
    <Divider layout="vertical" style="margin: 0; padding: 0;"/>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { toggleSidebarCollpsed, collapsed, sidebarWidth } from "./state";
import { useRouter } from 'vue-router';
import Sidebarlink from "./Sidebarlink.vue";
import { Button, Divider } from "primevue";

const router = useRouter();
</script>

<style scoped>
.sidebar-menu {
  float: left;
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  bottom: 0;
  padding: 0.5em;
}

</style>
