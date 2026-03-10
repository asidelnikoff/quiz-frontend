<template>
    <div class="flex justify-between center gap-10">
        <div class="flex flex-col items-left gap-10 center-vert">
            <h1 class="font-bold text-3xl">Используйте свой аккаунт</h1>
            <LoginForm v-on:forward="forwardToTest" />
        </div>
        <Divider layout="vertical">или</Divider>
        <div class="flex flex-col items-left gap-10">
            <h1 class="font-bold text-3xl">Просто введите имя</h1>
            <TempLoginForm v-on:forward="forwardToTest" />
        </div>
    </div>
</template>

<script setup>
import { Divider } from 'primevue';
import { useSessionStore } from '@/stores/session';
import { useAuthStore } from '@/stores/auth';
import { useRouter, useRoute } from 'vue-router';
import LoginForm from '@/components/LoginForm.vue';
import TempLoginForm from '@/components/TempLoginForm.vue';
import { hideSidebar } from '@/components/Sidepanel/state';
import { ref } from 'vue';
import authService from '@/api/services/authService';

hideSidebar();

const router = useRouter();
const route = useRoute();
const store = useSessionStore();
const authStore = useAuthStore();

const redirectTo = ref('');

const setredirectToRoute = () => {
    let testId = route.params.id;
    let invite = route.query.invite;
    if (!invite || !testId) {
        router.back();
        return;
    }

    store.setInviteHash(invite);
    redirectTo.value = `/test/${testId}?invite=${invite}`;
    return;
}
const redirectIfLoggedIn = async () => {
    try {
        if (authStore.getToken()) {
            await authService.refresh()
            await authService.getUser()
            forwardToTest();
        }
    }
    catch (error) {
        // ignore by design
        console.log(error);
    }
}

setredirectToRoute();
redirectIfLoggedIn();

const forwardToTest = () => {
    router.replace(redirectTo.value);
}

</script>