<!--
  ВАЖНО про жизненный цикл компонента: useChatMessages/useReadTracking захватывают
  chatId один раз при создании composable (в setup) и не отслеживают его изменение
  реактивно. Поэтому компонент должен пересоздаваться при переходе на другой чат,
  а не переиспользоваться с новыми props. В router/index.js это обеспечено через
  route.meta.forceRemount + :key="route.fullPath" на router-view в App.vue.
  Если подключаете компонент вне этого роутера — воспроизведите тот же принцип
  (например, :key="chatId" в месте использования).
-->
<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import { useChatMessages } from '@/composables/useChatMessages'
import { useReadTracking } from '@/composables/useReadTracking'
import { useChatHubEvents } from '@/composables/useChatHubEvents'
import ChatMessageBubble from '@/components/ChatMessageBubble.vue'

const props = defineProps({
  chatId: { type: [Number, String], required: true },
  chatName: { type: String, default: '' }
})

const router = useRouter()

function goBack() {
  router.back()
}

const {
  messages,
  pendingMessages,
  chatName: loadedChatName,
  isLoading,
  error,
  isLoadingOlder,
  hasGap,
  unseenNewCount,
  loadInitial,
  loadOlder,
  jumpToLatest,
  appendIncoming,
  sendMessage,
  retrySend,
  setIsRead
} = useChatMessages(props.chatId)
const { observeMessageElement } = useReadTracking(props.chatId)

// Имя чата из ответа истории — источник истины. props.chatName (из query,
// проставленный при переходе со списка) используется только как мгновенный
// фолбэк для отрисовки заголовка до того, как этот запрос отработает —
// и подстраховка на случай прямого захода по ссылке, если истории ещё нет.
const displayName = computed(() => loadedChatName.value || props.chatName || 'Чат')

const draft = ref('')
const composerTextarea = ref(null)
const MAX_COMPOSER_HEIGHT = 120 // px — дальше внутри поля появляется своя прокрутка, см. CSS

function autoGrowComposer() {
  const el = composerTextarea.value
  if (!el) return
  el.style.height = 'auto' // сброс перед пересчётом — иначе scrollHeight не уменьшится при удалении текста
  el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`
}

const scrollContainer = ref(null)
const dividerEl = ref(null)
const topSentinel = ref(null)
let topObserver = null

// Разделитель "Новые сообщения" привязан к seq, а не к индексу в массиве —
// индекс съехал бы при подгрузке более старой истории вверх (loadOlder()
// вставляет сообщения В НАЧАЛО массива, сдвигая индексы всех остальных).
// seq конкретного сообщения не меняется независимо от того, что подгружено вокруг.
const firstUnreadSeq = ref(null)

function computeFirstUnreadSeq() {
  const found = messages.value.find((m) => !m.is_sender && !m.is_read)
  firstUnreadSeq.value = found ? found.seq : null
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
}

/**
 * Подгрузка истории при достижении верхнего края списка. Классическая проблема
 * "скролл прыгает" при вставке контента сверху — компенсируем вручную:
 * запоминаем scrollHeight ДО подгрузки, после того как DOM обновится (nextTick),
 * добавляем разницу к scrollTop, чтобы визуально сообщение, на которое смотрел
 * пользователь, осталось на том же месте.
 */
async function handleReachTop() {
  const el = scrollContainer.value
  if (!el) return

  const previousScrollHeight = el.scrollHeight
  await loadOlder()
  await nextTick()

  const newScrollHeight = el.scrollHeight
  el.scrollTop += newScrollHeight - previousScrollHeight
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

    // Если появился гэп, скролл трогать не нужно — сообщение не попало
    // в список, вместо этого показывается кнопка "к новым сообщениям".
    if (wasNearBottom && !hasGap.value) {
      nextTick(scrollToBottom)
    }
  },
  NotifyMessagesRead: (event) => {
    if (String(event.chat_id) !== String(props.chatId)) return

    setIsRead(event)
  }
})

async function open() {
  await loadInitial()
  if (error.value) return
  computeFirstUnreadSeq()
  await nextTick()
  scrollToInitialPosition()

  topObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) handleReachTop()
    },
    { root: scrollContainer.value, rootMargin: '150px' }
  )
  if (topSentinel.value) topObserver.observe(topSentinel.value)
}

async function onJumpToLatest() {
  await jumpToLatest()
  computeFirstUnreadSeq() // после полной замены окна прежний якорь разделителя не актуален
  await nextTick()
  scrollToBottom()
}

function submitDraft() {
  const content = draft.value
  if (!content.trim()) return

  const wasGapped = hasGap.value
  const wasNearBottom = isNearBottom()
  draft.value = '' // очищаем сразу — ощущение мгновенного отклика, не ждём ответа сервера
  sendMessage(content)

  nextTick(async () => {
    autoGrowComposer() // draft.value = '' не бьёт нативный input-event — растим/сжимаем поле вручную

    if (wasGapped) {
      // Отправка сообщения — тоже способ "вернуться в настоящее": не оставляем
      // пользователя с гэпом и optimistic-пузырём, зависшим где-то в истории.
      await onJumpToLatest()
    } else if (wasNearBottom) {
      scrollToBottom()
    }
  })
}

function onRetry(clientMessageId) {
  retrySend(clientMessageId)
}

onMounted(open)

onBeforeUnmount(() => {
  topObserver?.disconnect()
})
</script>

<template>
  <div class="chat-window">
    <header class="chat-window__header">
      <Button icon="pi pi-arrow-left" text rounded aria-label="Назад" @click="goBack" />
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
        <div ref="topSentinel" class="chat-window__top-sentinel">
          <ProgressSpinner v-if="isLoadingOlder" style="width: 20px; height: 20px" stroke-width="6" />
        </div>

        <template v-for="message in messages" :key="message.id">
          <div v-if="message.seq === firstUnreadSeq" ref="dividerEl" class="chat-window__divider">
            <span>Новые сообщения</span>
          </div>

          <div :ref="(el) => onMessageRowRef(el, message)">
            <ChatMessageBubble :message="message" @retry="onRetry" />
          </div>
        </template>

        <!-- Свои сообщения, отправленные, но ещё не подтверждённые WS-событием
             (см. useChatMessages.js: sendMessage/appendIncoming) -->
        <ChatMessageBubble
          v-for="pendingMessage in pendingMessages"
          :key="pendingMessage.id"
          :message="pendingMessage"
          @retry="onRetry"
        />
      </template>
    </div>

    <!-- Гэп: пришли новые сообщения, но окно не доходит до хвоста чата
         (см. useChatMessages.js: appendIncoming). Явное действие пользователя,
         а не тихая автоподгрузка — чтобы не дёргать скролл, пока он читает историю. -->
    <button
      v-if="hasGap"
      type="button"
      class="chat-window__jump-button"
      @click="onJumpToLatest"
    >
      <span>Новые сообщения</span>
      <span class="chat-window__jump-badge">{{ unseenNewCount > 99 ? '99+' : unseenNewCount }}</span>
      <i class="pi pi-arrow-down" />
    </button>

    <footer class="chat-window__composer">
      <textarea
        ref="composerTextarea"
        v-model="draft"
        rows="1"
        class="chat-window__composer-input"
        placeholder="Сообщение"
        @keydown.enter.exact.prevent="submitDraft"
        @input="autoGrowComposer"
      ></textarea>
      <Button
        icon="pi pi-send"
        rounded
        :disabled="!draft.trim()"
        aria-label="Отправить"
        class="chat-window__composer-send"
        @click="submitDraft"
      />
    </footer>
  </div>
</template>

<style scoped>
.chat-window {
  position: relative; /* якорь для плавающей кнопки "к новым сообщениям" */
  display: flex;
  flex-direction: column;
  height: 90vh;
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
  align-items: flex-end; /* кнопка отправки остаётся у нижнего края поля, растущего вверх */
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid var(--fold-border);
  background: var(--fold-surface);
  flex-shrink: 0;
}

.chat-window__composer-input {
  flex: 1;
  min-height: 38px;
  max-height: 120px; /* держать синхронно с MAX_COMPOSER_HEIGHT в скрипте */
  padding: 8px 12px;
  border-radius: var(--fold-radius-md);
  border: 1px solid var(--fold-border);
  background: var(--fold-paper);
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.4;
  color: var(--fold-ink);
  outline: none;
  resize: none;
  overflow-y: auto;
  word-break: break-word;
}

.chat-window__composer-input:disabled {
  color: var(--fold-muted);
}

.chat-window__composer-send {
  flex-shrink: 0;
}

.chat-window__top-sentinel {
  min-height: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 0;
}

/* Позиционируется абсолютно с фиксированным отступом от низа, а не измеряется
   динамически от реальной высоты композера — тот может расти до 120px+паддинги
   при многострочном вводе, из-за чего кнопка иногда окажется чуть ближе к
   выросшему полю, чем идеально. Не стали городить JS-измерение ради пиксель-
   перфекта в этой второстепенной детали. */
.chat-window__jump-button {
  position: absolute;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: var(--fold-ink);
  color: #fff;
  font-family: var(--font-body);
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(27, 33, 48, 0.2);
}

.chat-window__jump-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--fold-coral);
  font-family: var(--font-mono);
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>