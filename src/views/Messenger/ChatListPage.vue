<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useDialog } from 'primevue'
import { useRouter } from 'vue-router'
import Skeleton from 'primevue/skeleton'
import ProgressSpinner from 'primevue/progressspinner'
import Button from 'primevue/button'
import { useChats } from '@/composables/useChats'
import { useChatHubEvents } from '@/composables/useChatHubEvents'
import { debounce } from '@/composables/debounce.js'
import ChatListItem from '@/components/ChatListItem.vue'
import CreateChatDialog from '@/components/CreateChatDialog.vue'
import { getChatHubConnection } from '@/composables/chatHubClient'
import { showSidebar } from '@/components/Sidepanel/state'

showSidebar()

const dialog = useDialog()
const router = useRouter()

const { items, isLoading, isLoadingMore, error, search, setSearch, load, loadMore, hasMore, refresh } = useChats()

const searchInput = ref('')
const sentinel = ref(null)
let observer = null

function onSearchInput(value) {
  searchInput.value = value
  setSearch(value)
}

function openChat(chat) {
  router.push({
    name: 'chat',
    params: { chatId: chat.chat_id },
    query: chat.name ? { name: chat.name } : {}
  })
}
function openProfile() {
  router.push({
    name: 'profile'
  })
}
function logout() {
  router.replace({
    name: 'login'
  })
}

function openCreateChatDialog() {
  dialog.open(CreateChatDialog, {
    props: {
      header: 'Новый чат',
      modal: true,
      style: { width: '420px' },
      breakpoints: { '575px': '95vw' }
    },
    onClose: (options) => {
      console.log('closing', options)
      const result = options?.data?.data
      console.log('result closing', result)
      if (!result) return // отмена или ошибка при создании — ничего не делаем
 
      // Контракт ответа POST /chats/new не описывает тело (в примере только код
      // 201/201 без образца JSON) — обрабатываем оба варианта: если бэкенд всё же
      // вернул chat_id, сразу переходим в новый чат; если нет — просто обновляем
      // список, новый чат должен появиться сам (WS-событие/следующий refresh).
      if (result.id) {
        router.push({
          name: 'chat',
          params: { chatId: result.id },
          query: result.name ? { name: result.name } : {}
        })
      } else {
        refresh()
      }
    }
  })
}


// Простейший вариант синхронизации: любое релевантное WS-событие — заново
// запрашиваем список с бэкенда (первую страницу, как при обычном refresh).
// debounce нужен, чтобы пачка сообщений, пришедших почти одновременно
// (например, активная переписка в нескольких чатах), не вызывала
// отдельный REST-запрос на каждое событие.
//
// Компромисс этого подхода: если пользователь уже подгрузил скроллом
// несколько страниц истории чатов, refresh() схлопнет список обратно
// к первой странице — это осознанное упрощение, а не побочный баг.
const debouncedRefresh = debounce(() => {
  refresh()
}, 400)

useChatHubEvents({
  NotifyNewChat: (event) => {
    console.log('invoking join chat', event.id)
    const connection = getChatHubConnection()
    connection.invoke("JoinChat", String(event.id));
    debouncedRefresh()
  },
  NotifyNewMessage: debouncedRefresh
})

onMounted(() => {
  load()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        loadMore()
      }
    },
    { rootMargin: '200px' }
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  debouncedRefresh.cancel()
})
</script>

<template>
  <div class="chat-list-page">
    <header class="chat-list-page__header">
      <div>
        <Button
          icon="pi pi-user"
          rounded
          outlined 
          aria-label="Профиль"
          class="chat-list-page__compose"
          @click="openProfile"
        />
        <span class="chat-list-page__wordmark">Мои чаты</span>
      </div>
      <Button
        icon="pi pi-plus"
        rounded
        text
        aria-label="Новый чат"
        class="chat-list-page__compose"
        @click="openCreateChatDialog"
      />

    </header>

    <div class="chat-list-page__search">
      <span class="p-input-icon-left chat-list-page__search-field">
        <i class="pi pi-search" />
        <input
          type="text"
          class="chat-list-page__search-input"
          placeholder="Поиск чатов"
          :value="searchInput"
          @input="onSearchInput($event.target.value)"
        />
      </span>
    </div>

    <div class="chat-list-page__list" role="list">
      <!-- Первичная загрузка -->
      <template v-if="isLoading && items.length === 0">
        <div v-for="n in 6" :key="n" class="chat-list-page__skeleton-row">
          <Skeleton shape="rectangle" size="46px" borderRadius="10px" />
          <div class="chat-list-page__skeleton-lines">
            <Skeleton width="45%" height="14px" />
            <Skeleton width="70%" height="12px" />
          </div>
        </div>
      </template>

      <!-- Ошибка загрузки -->
      <div v-else-if="error && items.length === 0" class="chat-list-page__state">
        <i class="pi pi-exclamation-triangle chat-list-page__state-icon" />
        <p class="chat-list-page__state-title">Не удалось загрузить чаты</p>
        <p class="chat-list-page__state-text">Проверьте соединение и попробуйте ещё раз.</p>
        <Button label="Повторить" size="small" @click="refresh" />
      </div>

      <!-- Пусто -->
      <div v-else-if="!isLoading && items.length === 0" class="chat-list-page__state">
        <i class="pi pi-comments chat-list-page__state-icon" />
        <p class="chat-list-page__state-title">
          {{ searchInput ? 'Ничего не найдено' : 'Пока нет чатов' }}
        </p>
        <p class="chat-list-page__state-text">
          {{ searchInput ? 'Попробуйте изменить запрос.' : 'Начните переписку — она появится здесь.' }}
        </p>
      </div>

      <!-- Список -->
      <template v-else>
        <ChatListItem
          v-for="chat in items"
          :key="chat.chat_id"
          :chat="chat"
          @open="openChat"
        />

        <div ref="sentinel" class="chat-list-page__sentinel">
          <ProgressSpinner
            v-if="isLoadingMore"
            style="width: 22px; height: 22px"
            strokeWidth="5"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.chat-list-page {
  display: flex;
  flex-direction: column;
  height: 90vh;
  margin: 0 auto;
  background: var(--fold-paper);
}

.chat-list-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 16px 8px;
  flex-shrink: 0;
}

.chat-list-page__wordmark {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: 26px;
  padding-left: 10px;
  color: var(--fold-ink);
}

.chat-list-page__search {
  padding: 8px 16px 12px;
  flex-shrink: 0;
}

.chat-list-page__search-field {
  position: relative;
  display: block;
  width: 100%;
}

.chat-list-page__search-field .pi-search {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--fold-muted);
  font-size: 14px;
}

.chat-list-page__search-input {
  width: 100%;
  height: 38px;
  padding: 0 12px 0 34px;
  border-radius: var(--fold-radius-md);
  border: 1px solid var(--fold-border);
  background: var(--fold-surface);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--fold-ink);
  outline: none;
  transition: border-color 0.12s ease;
}

.chat-list-page__search-input::placeholder {
  color: var(--fold-muted);
}

.chat-list-page__search-input:focus {
  border-color: var(--fold-teal);
}

.chat-list-page__list {
  flex: 1;
  overflow-y: auto;
  background: var(--fold-surface);
  border-top: 1px solid var(--fold-border);
}

.chat-list-page__skeleton-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--fold-border);
}

.chat-list-page__skeleton-lines {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.chat-list-page__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 64px 24px;
  color: var(--fold-muted);
}

.chat-list-page__state-icon {
  font-size: 28px;
  color: var(--fold-muted);
  margin-bottom: 12px;
}

.chat-list-page__state-title {
  font-weight: 600;
  color: var(--fold-ink);
  margin: 0 0 4px;
  font-size: 15px;
}

.chat-list-page__state-text {
  margin: 0 0 16px;
  font-size: 13px;
}

.chat-list-page__sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  min-height: 16px;
}
</style>