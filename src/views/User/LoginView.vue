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
        <div class="center">
            <div class="flex flex-col items-left gap-10" style="min-width: 30vw;">
                <h1 class="font-bold text-3xl">Добро пожаловать!</h1>
                <LoginForm v-on:forward="router.push({ name: 'home' })" />
            </div>
        </div>
    </main>
</template>