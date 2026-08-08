<!--
  Открывается через useDialog().open(CreateChatDialog, {...}) — см. ChatListPage.vue.
  dialogRef инжектится автоматически PrimeVue при рендере внутри <DynamicDialog />
  (должен быть подключён один раз в App.vue, DialogService — в main.js).
-->
<script setup>
import { ref, inject } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import userService from '@/api/services/userService'
import chatService from '@/api/services/chatService'

const dialogRef = inject('dialogRef')

const login = ref('')
const isSearching = ref(false)
const searchError = ref(null)

const members = ref([]) // { id, first_name, last_name }

const isCreating = ref(false)
const createError = ref(null)

async function addMember() {
  const trimmed = login.value.trim()
  if (!trimmed || isSearching.value) return

  isSearching.value = true
  searchError.value = null

  try {
    const user = (await userService.getUserInfo(trimmed))?.data

    if (!user) {
      searchError.value = 'Пользователь не найден'
      return
    }
    if (members.value.some((m) => m.id === user.id)) {
      searchError.value = 'Этот пользователь уже добавлен'
      return
    }

    members.value = [...members.value, user]
    login.value = ''
  } catch (e) {
    searchError.value = e?.status === 404 ? 'Пользователь не найден' : 'Не удалось найти пользователя'
  } finally {
    isSearching.value = false
  }
}

function removeMember(id) {
  members.value = members.value.filter((m) => m.id !== id)
}

async function submit() {
  if (members.value.length === 0) {
    createError.value = 'Добавьте хотя бы одного участника'
    return
  }

  isCreating.value = true
  createError.value = null

  try {
    const result = await chatService.postChat({
      members: members.value.map((m) => m.id),
      name: null
    })
    dialogRef.value.close(result)
  } catch (e) {
    createError.value = 'Не удалось создать чат. Попробуйте ещё раз'
  } finally {
    isCreating.value = false
  }
}

function cancel() {
  dialogRef.value.close(null)
}
</script>

<template>
  <div class="create-chat">
    <div class="create-chat__search">
      <InputText
        v-model="login"
        placeholder="Логин пользователя"
        class="create-chat__search-input"
        :disabled="isSearching"
        autofocus
        @keyup.enter="addMember"
      />
      <Button
        icon="pi pi-plus"
        rounded
        :loading="isSearching"
        aria-label="Добавить участника"
        @click="addMember"
      />
    </div>
    <p v-if="searchError" class="create-chat__error">{{ searchError }}</p>

    <div class="create-chat__members">
      <Chip
        v-for="member in members"
        :key="member.id"
        :label="`${member.firstname} ${member.lastname}`"
        removable
        @remove="removeMember(member.id)"
      />
      <p v-if="members.length === 0" class="create-chat__empty">Пока никого не добавили</p>
    </div>

    <p v-if="createError" class="create-chat__error">{{ createError }}</p>

    <div class="create-chat__actions">
      <Button label="Отмена" text :disabled="isCreating" @click="cancel" />
      <Button label="Создать" :loading="isCreating" :disabled="members.length === 0" @click="submit" />
    </div>
  </div>
</template>

<style scoped>
.create-chat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.create-chat__search {
  display: flex;
  gap: 8px;
}

.create-chat__search-input {
  flex: 1;
}

.create-chat__members {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.create-chat__empty {
  margin: 0;
  font-size: 13px;
  color: var(--fold-muted);
}

.create-chat__error {
  margin: -4px 0 0;
  font-size: 13px;
  color: var(--fold-coral);
}

.create-chat__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}
</style>