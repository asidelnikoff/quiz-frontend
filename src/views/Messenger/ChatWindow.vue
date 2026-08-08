<!--
  ВАЖНО про жизненный цикл компонента: useChatMessages/useReadTracking захватывают
  chatId один раз при создании composable (в setup). Если этот компонент переиспользуется
  для разных чатов без пересоздания (например, роутер без :key), состояние не сбросится
  само. Рекомендуемый паттерн — форсировать remount при смене чата:
    <ChatWindow :key="chatId" :chat-id="chatId" :chat-name="chatName" @close="..." />
  либо аналогично через :key на <router-view>.
-->
<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useChatMessages } from '@/composables/useChatMessages'
import { useReadTracking } from '@/composables/useReadTracking'
import { useChatHubEvents } from '@/composables/useChatHubEvents'
import ChatMessageBubble from '@/components/ChatMessageBubble.vue'
import router from '@/router'

const props = defineProps({
  chatId: { type: [Number, String], required: true },
  chatName: { type: String, default: '' }
})

const { chatInfo, messages, isLoading, error, loadInitial, appendIncoming, sendMessage, retrySend, setIsRead } = useChatMessages(props.chatId)
const { observeMessageElement } = useReadTracking(props.chatId)

const displayName = computed(() => chatInfo?.value?.name || props.chatName || 'Чат')

const draft = ref('')

const scrollContainer = ref(null)
const dividerEl = ref(null)

// Индекс первого непрочитанного входящего сообщения на момент открытия чата —
// граница для разделителя "Новые сообщения". Фиксируется один раз при начальной
// загрузке; сообщения, прилетающие дальше через WS, всегда добавляются в конец
// (у них больший seq), поэтому индекс не съезжает.
const firstUnreadIndex = ref(null)

function computeFirstUnreadIndex() {
  if (firstUnreadIndex.value === -1) {
    return
  }
  const idx = messages.value.findIndex((m) => !m.is_sender && !m.is_read)
  firstUnreadIndex.value = idx
}

function isNearBottom() {
  const el = scrollContainer.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 120
}

function scrollToBottom() {
  const el = scrollContainer.value
  if (el) el.scrollTop = el.scrollHeight
}

function scrollToInitialPosition() {
  if (dividerEl.value) {
    dividerEl.value.scrollIntoView({ block: 'center' })
  } else {
    scrollToBottom()
  }
}

// Ref-колбэк для строки сообщения — здесь, а не внутри ChatMessageBubble,
// потому что нам нужен именно DOM-узел для IntersectionObserver, а ref
// на компоненте отдаёт инстанс компонента, а не элемент.
function onMessageRowRef(el, message) {
  observeMessageElement(el, message)
  computeFirstUnreadIndex()
}

// Предполагаемая форма payload события: тот же набор полей, что и элемент
// ответа REST-ручки истории (id, content, sender, is_sender, is_read, seq),
// плюс chat_id для маршрутизации — соединение общее на все чаты пользователя,
// поэтому фильтруем на клиенте. Если реальный контракт события отличается —
// поправить маппинг здесь.
useChatHubEvents({
  NotifyNewMessage: (event) => {
    if (String(event.chat_id) !== String(props.chatId)) return

    const wasNearBottom = isNearBottom()
    appendIncoming(event)

    if (wasNearBottom) {
      nextTick(scrollToBottom)
    }
  },
  NotifyMessagesRead: (event) => {
    console.log('NotifyMessagesRead', event)
    if (String(event.chat_id) !== String(props.chatId)) return

    setIsRead(event)
  }
})

async function open() {
  await loadInitial()
  if (error.value) return
  computeFirstUnreadIndex()
  await nextTick()
  scrollToInitialPosition()
}

function submitDraft() {
  const content = draft.value
  if (!content.trim()) return
 
  draft.value = '' // очищаем сразу — ощущение мгновенного отклика, не ждём ответа сервера
  const wasNearBottom = isNearBottom()
  sendMessage(content)
 
  if (wasNearBottom) {
    nextTick(scrollToBottom)
  }
}
 
function onRetry(clientMessageId) {
  retrySend(clientMessageId)
}

onMounted(open)
</script>

<template>
  <div class="chat-window">
    <header class="chat-window__header">
      <Button icon="pi pi-arrow-left" text rounded aria-label="Назад" @click="router.back()" />
      <span class="chat-window__title">{{ displayName }}</span>
      <span class="chat-window__header-spacer" />
    </header>

    <div ref="scrollContainer" class="chat-window__messages">
      <div v-if="isLoading" class="chat-window__state">
        <ProgressSpinner style="width: 28px; height: 28px" strokeWidth="5" />
      </div>

      <div v-else-if="error" class="chat-window__state">
        <i class="pi pi-exclamation-triangle chat-window__state-icon" />
        <p class="chat-window__state-title">Не удалось загрузить сообщения</p>
        <Button label="Повторить" size="small" @click="open" />
      </div>

      <template v-else>
        <template v-for="(message, index) in messages" :key="message.id">
          <div v-if="index === firstUnreadIndex" ref="dividerEl" class="chat-window__divider">
            <span>Новые сообщения</span>
          </div>

          <div :ref="(el) => onMessageRowRef(el, message)">
            <ChatMessageBubble :message="message" />
          </div>
        </template>
      </template>
    </div>

    <footer class="chat-window__composer">
            <input
        v-model="draft"
        type="text"
        class="chat-window__composer-input"
        placeholder="Сообщение"
        @keyup.enter="submitDraft"
      />
      <Button
        icon="pi pi-send"
        rounded
        :disabled="!draft.trim()"
        aria-label="Отправить"
        @click="submitDraft"
      />
    </footer>
  </div>
</template>

<style scoped>
.chat-window {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 480px;
  margin: 0 auto;
  background: var(--fold-paper);
}

.chat-window__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--fold-border);
  background: var(--fold-surface);
  flex-shrink: 0;
}

.chat-window__title {
  font-weight: 600;
  font-size: 15px;
  color: var(--fold-ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-window__header-spacer {
  flex: 1;
}

.chat-window__messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-window__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 24px;
  color: var(--fold-muted);
  text-align: center;
}

.chat-window__state-icon {
  font-size: 24px;
}

.chat-window__state-title {
  margin: 0;
  font-size: 13px;
}

.chat-window__divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 16px;
  color: var(--fold-coral);
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chat-window__divider::before,
.chat-window__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--fold-coral-tint);
}

.chat-window__composer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--fold-border);
  background: var(--fold-surface);
  flex-shrink: 0;
}

.chat-window__composer-input {
  flex: 1;
  height: 38px;
  padding: 0 12px;
  border-radius: var(--fold-radius-md);
  border: 1px solid var(--fold-border);
  background: var(--fold-paper);
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--fold-ink);
  outline: none;
}

.chat-window__composer-input:disabled {
  color: var(--fold-muted);
}
</style>