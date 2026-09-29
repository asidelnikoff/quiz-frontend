<!--
  Открывается через useDialog().open(CreateChatDialog, {...}) — см. ChatListPage.vue.
  dialogRef инжектится автоматически PrimeVue при рендере внутри <DynamicDialog />
  (должен быть подключён один раз в App.vue, DialogService — в main.js).
-->
<script setup>
import { ref, watch, inject } from 'vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Chip from 'primevue/chip'
import userService from '@/api/services/userService'
import chatService from '@/api/services/chatService'
import { debounce } from '@/composables/debounce'
import { useAuthStore } from '@/stores/auth'

const SUGGESTION_LIMIT = 8
const SUGGESTION_DEBOUNCE_MS = 250

const dialogRef = inject('dialogRef')
const authStore = useAuthStore()

const chatNameInput = ref('')

const login = ref('')
const isSearching = ref(false)
const searchError = ref(null)

const suggestions = ref([]) // { id, first_name, last_name, login }
const isSuggesting = ref(false)

const members = ref([]) // { id, first_name, last_name }

const isCreating = ref(false)
const createError = ref(null)

// Отдельный индикатор именно для кнопки "Перейти в ЛС" на конкретной подсказке —
// показываем загрузку только на нажатой кнопке, не блокируя весь диалог.
const directChatLoadingId = ref(null)

const debouncedSearchSuggestions = debounce(async (query) => {
  isSuggesting.value = true
  try {
    suggestions.value = (await userService.getUsersList({ search: query, limit: SUGGESTION_LIMIT }))?.data
  } catch (e) {
    // Подсказки — вспомогательная функция при наборе текста; не блокируем ввод
    // и не показываем интрузивную ошибку на каждое неудачное обращение при наборе.
    console.error('Не удалось получить подсказки пользователей', e)
    suggestions.value = []
  } finally {
    isSuggesting.value = false
  }
}, SUGGESTION_DEBOUNCE_MS)

watch(login, (value) => {
  const trimmed = value.trim()
  if (!trimmed) {
    debouncedSearchSuggestions.cancel()
    suggestions.value = []
    return
  }
  debouncedSearchSuggestions(trimmed)
})

function selectSuggestion(user) {
  if (user.id === authStore.getId) {
    return
  }
  if (!members.value.some((m) => m.id === user.id)) {
    members.value = [...members.value, user]
  }
  login.value = ''
  suggestions.value = []
  searchError.value = null
}

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
    if (members.value.some((m) => m.id === user.id) || user.id === authStore.getId) {
      searchError.value = 'Этот пользователь уже добавлен'
      return
    }

    members.value = [...members.value, user]
    login.value = ''
    suggestions.value = []
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
  if (isCreating.value || directChatLoadingId.value) return

  if (members.value.length === 0) {
    createError.value = 'Добавьте хотя бы одного участника'
    return
  }

  isCreating.value = true
  createError.value = null

  try {
    const trimmedName = chatNameInput.value.trim()
    const result = (await chatService.postChat({
      members: members.value.map((m) => m.id),
      name: trimmedName === '' ? null : trimmedName
    }))?.data
    dialogRef.value.close(result)
  } catch (e) {
    createError.value = 'Не удалось создать чат. Попробуйте ещё раз'
  } finally {
    isCreating.value = false
  }
}

/**
 * Кнопка "Перейти в ЛС" на подсказке — отдельный путь создания чата в обход
 * основного списка участников и названия: всегда один собеседник, name: null.
 * (В задании параметр указан как members: suggestion.id — приведено к массиву
 * members: [suggestion.id], чтобы соответствовать контракту POST /chats/new.)
 */
async function goToDirectChat(user) {
  if (directChatLoadingId.value) return

  if (user.id === authStore.getId) {
    return
  }
  
  directChatLoadingId.value = user.id
  createError.value = null

  try {
    const result = (await chatService.postChat({ members: [user.id], name: null, is_direct: true }))
    dialogRef.value.close(result)
  } catch (e) {
    createError.value = 'Не удалось создать чат. Попробуйте ещё раз'
  } finally {
    directChatLoadingId.value = null
  }
}

function cancel() {
  dialogRef.value.close(null)
}
</script>

<template>
  <div class="create-chat">
    <div class="create-chat__field">
      <label class="create-chat__label" for="create-chat-login">Участники</label>
      <div class="create-chat__search">
        <div class="create-chat__combo" :class="{ 'create-chat__combo--disabled': isSearching }">
          <Chip
            v-for="member in members"
            :key="member.id"
            :label="`${member.firstname} ${member.lastname}`"
            removable
            @remove="removeMember(member.id)"
          />
          <input
            id="create-chat-login"
            v-model="login"
            type="text"
            class="create-chat__combo-input"
            :placeholder="members.length === 0 ? 'Логин пользователя' : ''"
            :disabled="isSearching"
            @keyup.enter="addMember"
          />
        </div>

        <Button
          icon="pi pi-plus"
          rounded
          :loading="isSearching"
          aria-label="Добавить участника"
          @click="addMember"
        />
      </div>
      <p v-if="searchError" class="create-chat__error">{{ searchError }}</p>
    </div>

    <!-- Подсказки — в том же месте, где раньше показывался список добавленных
         участников (теперь он переехал внутрь строки поиска, см. выше) -->
    <div v-if="login.trim()" class="create-chat__suggestions">
      <p v-if="isSuggesting && suggestions.length === 0" class="create-chat__suggestions-hint">Ищем…</p>
      <p v-else-if="suggestions.length === 0" class="create-chat__suggestions-hint">Никого не нашли</p>

      <div
        v-for="user in suggestions"
        :key="user.id"
        class="create-chat__suggestion"
        @click="selectSuggestion(user)"
      >
        <div class="create-chat__suggestion-info">
          <span class="create-chat__suggestion-name">{{ user.firstname }} {{ user.lastname }}</span>
          <span class="create-chat__suggestion-login">{{ user.login }}</span>
        </div>
        <Button
          icon="pi pi-comment"
          rounded
          text
          size="small"
          class="create-chat__suggestion-action"
          :loading="directChatLoadingId === user.id"
          :disabled="directChatLoadingId !== null && directChatLoadingId !== user.id"
          aria-label="Перейти в личные сообщения"
          title="Перейти в ЛС"
          @click.stop="goToDirectChat(user)"
        />
      </div>
    </div>

    <p v-if="createError" class="create-chat__error">{{ createError }}</p>

    <div class="create-chat__actions">
      <Button
        label="Отмена"
        text
        :disabled="isCreating || directChatLoadingId !== null"
        @click="cancel"
      />
      <Button
        label="Создать"
        :loading="isCreating"
        :disabled="members.length === 0 || directChatLoadingId !== null"
        @click="submit"
      />
    </div>
  </div>
</template>

<style scoped>
.create-chat {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.create-chat__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.create-chat__label {
  font-size: 12px;
  font-weight: 600;
  color: var(--fold-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.create-chat__name-input {
  width: 100%;
}

.create-chat__search {
  display: flex;
  gap: 8px;
}

/* Комбинированное поле: чипы уже добавленных участников + текстовый ввод —
   визуально одна строка, оформленная как единый инпут. */
.create-chat__combo {
  flex: 1;
  min-height: 38px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: var(--fold-radius-md);
  border: 1px solid var(--fold-border);
  background: var(--fold-surface);
}

.create-chat__combo--disabled {
  opacity: 0.7;
}

.create-chat__combo-input {
  flex: 1;
  min-width: 100px;
  height: 28px;
  border: none;
  outline: none;
  background: transparent;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--fold-ink);
}

.create-chat__combo-input::placeholder {
  color: var(--fold-muted);
}

.create-chat__suggestions {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 240px;
  overflow-y: auto;
  border-radius: var(--fold-radius-md);
  border: 1px solid var(--fold-border);
  background: var(--fold-surface);
}

.create-chat__suggestions-hint {
  margin: 0;
  padding: 10px 12px;
  font-size: 13px;
  color: var(--fold-muted);
}

.create-chat__suggestion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
}

.create-chat__suggestion:hover {
  background: var(--fold-surface-hover);
}

.create-chat__suggestion-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.create-chat__suggestion-name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--fold-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.create-chat__suggestion-login {
  font-size: 12px;
  color: var(--fold-muted);
  font-family: var(--font-mono);
}

.create-chat__error {
  margin: 0;
  font-size: 13px;
  color: var(--fold-coral);
}

.create-chat__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.create-chat__suggestion-action {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  background: var(--fold-surface) !important;
  border: 1px solid var(--fold-border) !important;
  color: var(--fold-muted) !important;
}
 
.create-chat__suggestion-action:hover {
  background: var(--fold-teal-tint) !important;
  border-color: var(--fold-teal) !important;
  color: var(--fold-teal) !important;
}
</style>