<!--
  Version-специфичные места (отмечены комментариями ниже) написаны под PrimeVue v4:
  Button :severity="'danger'", useConfirm().require({ acceptProps: { severity: 'danger' } }).
  Для PrimeVue v3 замените на acceptClass: 'p-button-danger' и class="p-button-danger"
  соответственно — по духу то же самое, отличается только форма пропа.
-->
<script setup>
import { onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import ProgressSpinner from 'primevue/progressspinner'
import { useProfile } from '@/composables/useProfile'
import { avatarColorFor } from '@/components/utils/avatar'
import DarkModeToggler from '@/components/DarkModeToggler.vue'
import Avatar from '@/components/Avatar.vue'

const router = useRouter()
const confirm = useConfirm()
// const { isDark, toggleDark } = useTheme()

const {
  user,
  isLoading,
  loadError,
  load,
  loginInput,
  firstnameInput,
  lastnameInput,
  patronymicInput,
  passwordInput,
  hasChanges,
  isSaving,
  saveError,
  saveSuccess,
  save,
  isDeleting,
  deleteError,
  remove
} = useProfile()

const initials = computed(() => {
  const first = firstnameInput.value.trim()[0] ?? ''
  const last = lastnameInput.value.trim()[0] ?? ''
  return (first + last).toUpperCase()
})

function goBack() {
  router.back()
}

function confirmDelete() {
  confirm.require({
    header: 'Удалить аккаунт',
    message: 'Это действие необратимо: все ваши данные будут удалены безвозвратно.',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Удалить',
    rejectLabel: 'Отмена',
    acceptProps: { severity: 'danger' }, // PrimeVue v4 — см. заметку в шапке файла
    accept: async () => {
      const success = await remove()
      if (!success) return

      router.replace('/login');
    }
  })
}

function confirmLogout() {
    confirm.require({
    header: 'Выйти',
    message: 'Уверены, что хотите выйти из аккаунта?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Выйти',
    rejectLabel: 'Отмена',
    acceptProps: { severity: 'warn' }, // PrimeVue v4 — см. заметку в шапке файла
    accept: async () => {
      router.replace('/login');
    }
  })
}

onMounted(load)
</script>

<template>
  <div class="profile-page">
    <header class="profile-page__header">
      <Button icon="pi pi-arrow-left" text rounded aria-label="Назад" @click="goBack" />
      <span class="profile-page__title">Профиль</span>
      <span class="profile-page__header-spacer" />
    </header>

    <div class="profile-page__content">
      <div v-if="isLoading" class="profile-page__state">
        <ProgressSpinner style="width: 28px; height: 28px" stroke-width="5" />
      </div>

      <div v-else-if="loadError" class="profile-page__state">
        <i class="pi pi-exclamation-triangle profile-page__state-icon" />
        <p class="profile-page__state-title">Не удалось загрузить профиль</p>
        <Button label="Повторить" size="small" @click="load" />
      </div>

      <template v-else-if="user">
        <Avatar :user="{ id: user.id, name: `${user.firstname} ${user.lastname}` }"/>

        <div class="profile-page__field">
          <label class="profile-page__label" for="profile-login">Логин</label>
          <InputText id="profile-login" v-model="loginInput" class="profile-page__input" />
        </div>

        <div class="profile-page__row">
          <div class="profile-page__field">
            <label class="profile-page__label" for="profile-firstname">Имя</label>
            <InputText id="profile-firstname" v-model="firstnameInput" class="profile-page__input" />
          </div>
          <div class="profile-page__field">
            <label class="profile-page__label" for="profile-lastname">Фамилия</label>
            <InputText id="profile-lastname" v-model="lastnameInput" class="profile-page__input" />
          </div>
        </div>

        <div class="profile-page__field">
          <label class="profile-page__label" for="profile-patronymic">Отчество</label>
          <InputText
            id="profile-patronymic"
            v-model="patronymicInput"
            placeholder="Необязательно"
            class="profile-page__input"
          />
        </div>

        <div class="profile-page__field">
          <label class="profile-page__label" for="profile-password">Новый пароль</label>
          <Password
            id="profile-password"
            v-model="passwordInput"
            placeholder="Оставьте пустым, чтобы не менять"
            :feedback="false" 
            fluid 
            toggleMask
          />
        </div>

        <p v-if="saveError" class="profile-page__error">{{ saveError }}</p>
        <p v-if="saveSuccess" class="profile-page__success">Изменения сохранены</p>

        <Button
          label="Сохранить"
          :loading="isSaving"
          :disabled="!hasChanges"
          class="profile-page__save"
          @click="save"
        />

        <div class="profile-page__settings-row">
          <span class="profile-page__settings-label">Тема интерфейса</span>
          <DarkModeToggler />
        </div>

        <div class="profile-page__settings-row">
            <span class="profile-page__settings-label">Выйти из аккаунта</span>
            <Button
                icon="pi pi-sign-out"
                @click="confirmLogout"
                severity="warn"
                outlined
            />
        </div>

        <div class="profile-page__danger-zone">
          <p class="profile-page__danger-title">Удаление аккаунта</p>
          <p class="profile-page__danger-text">
            Все данные будут удалены без возможности восстановления.
          </p>
          <p v-if="deleteError" class="profile-page__error">{{ deleteError }}</p>
          <Button
            label="Удалить аккаунт"
            severity="danger"
            outlined
            :loading="isDeleting"
            @click="confirmDelete"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  min-height: 90vh;
  margin: 0 auto;
  background: var(--fold-paper);
}

.profile-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 8px;
  flex-shrink: 0;
}

.profile-page__title {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: 26px;
  color: var(--fold-ink);
  padding-left: 10px;
}

.profile-page__header-spacer {
  flex: 1;
}

.profile-page__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 16px 40px;
}

.profile-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--fold-muted);
  text-align: center;
}

.profile-page__state-icon {
  font-size: 24px;
}

.profile-page__state-title {
  margin: 0;
  font-size: 13px;
}

.profile-page__avatar {
  align-self: center;
  width: 72px;
  height: 72px;
  border-radius: var(--fold-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: 0.02em;
  margin-bottom: 4px;
}

.profile-page__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.profile-page__row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Medium screens (768px and up): elements switch to a horizontal row */
@media (min-width: 768px) {
  .profile-page__row {
    flex-direction: row;
  }
}

.profile-page__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--fold-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.profile-page__input {
  width: 100%;
}

.profile-page__password {
  width: 100%;
}

.profile-page__error {
  margin: -6px 0 0;
  font-size: 13px;
  color: var(--fold-coral);
}

.profile-page__success {
  margin: -6px 0 0;
  font-size: 13px;
  color: var(--fold-teal);
}

.profile-page__save {
  align-self: flex-start;
}

.profile-page__settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: var(--fold-radius-md);
  border: 1px solid var(--fold-border);
  background: var(--fold-surface);
  margin-top: 8px;
}

.profile-page__settings-label {
  font-size: 14px;
  color: var(--fold-ink);
}

.profile-page__danger-zone {
  margin-top: 16px;
  padding: 14px;
  border-radius: var(--fold-radius-md);
  border: 1px solid var(--fold-coral-tint);
  background: var(--fold-coral-tint);
}

.profile-page__danger-title {
  margin: 0 0 4px;
  font-weight: 600;
  font-size: 14px;
  color: var(--fold-ink);
}

.profile-page__danger-text {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--fold-muted);
}
</style>