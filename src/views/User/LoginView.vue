<script setup>
import LoginForm from '@/components/LoginForm.vue';
import { useAuthStore } from '@/stores/auth';
import { hideSidebar } from '@/components/Sidepanel/state';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useAuthStore();
if (store.getToken()) {
    store.logout();
}
hideSidebar();
</script>

<template>
    <main>
        <div class="center" style="width: 40vw;">
            <div class="flex flex-col items-left gap-10">
                <h1 class="font-bold text-3xl">Добро пожаловать!</h1>
                <LoginForm v-on:forward="router.push({ name: 'home' })" />
            </div>
        </div>
    </main>
</template>