import { ref } from 'vue'
import chatService from '../api/services/chatService'
import { generateClientMessageId } from './id'

// Сколько сообщений подгружать перед последним прочитанным при первом открытии чата —
// небольшой контекст, чтобы не терять нить разговора (обсуждали при проектировании: не 50/50,
// а разумный фиксированный "контекст назад" + все непрочитанные без потолка на этом этапе).
const INITIAL_CONTEXT_BEFORE = 30

function sortBySeq(messages) {
  return [...messages].sort((a, b) => a.seq - b.seq)
}

export function useChatMessages(chatId) {
  const messages = ref([]) // по возрастанию seq: старые сверху, новые снизу
  const pendingMessages = ref([]) // свои сообщения, отправленные, но ещё не подтверждённые WS
  const isLoading = ref(false)
  const error = ref(null)
  const chatInfo = ref(null)

  async function loadInitial() {
    isLoading.value = true
    error.value = null
    try {
      const response = (await chatService.getMessages(chatId, {
        beforeLastRead: INITIAL_CONTEXT_BEFORE,
        afterLastRead: null
      })).data
      messages.value = sortBySeq(response.messages)
      chatInfo.value = response.chat
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Добавляет сообщение, пришедшее через WS. Идемпотентно по id —
   * защита от дублей при реконнекте/повторной доставке события.
   */
  function appendIncoming(message) {
    if (messages.value.some((m) => m.id === message.id)) return
    messages.value = sortBySeq([...messages.value, message])
  }

  function appendIncoming(message) {
    if (message.is_sender && message.client_message_id) {
      const pendingIndex = pendingMessages.value.findIndex(
        (m) => m.client_message_id === message.client_message_id
      )
      if (pendingIndex !== -1) {
        pendingMessages.value.splice(pendingIndex, 1)
      }
    }
 
    if (messages.value.some((m) => m.id === message.id)) return
    messages.value = sortBySeq([...messages.value, message])
  }
 
  function setPendingStatus(clientMessageId, status) {
    // Ищем через реактивный массив (а не через захваченную в замыкании ссылку),
    // иначе мутация может не пройти через реактивный прокси и не обновить UI.
    const item = pendingMessages.value.find((m) => m.client_message_id === clientMessageId)
    if (item) item.status = status
  }
 
  async function sendMessage(content) {
    const trimmed = content.trim()
    if (!trimmed) return
 
    const clientMessageId = generateClientMessageId()
    pendingMessages.value = [
      ...pendingMessages.value,
      {
        id: `pending:${clientMessageId}`,
        client_message_id: clientMessageId,
        content: trimmed,
        sender: null,
        is_sender: true,
        is_read: false,
        seq: null,
        status: 'sending'
      }
    ]
 
    try {
      await chatService.postMessage(chatId, { client_message_id: clientMessageId, content: trimmed })
      // 201 подтверждает, что сервер принял и сохранил сообщение — можно сразу
      // показать "отправлено" (одна галочка), не дожидаясь WS. Финальный переход
      // в основной список с реальными id/seq — по событию NewMessage, см. appendIncoming.
      setPendingStatus(clientMessageId, 'sent')
    } catch (e) {
      setPendingStatus(clientMessageId, 'failed')
    }
  }
 
  /**
   * Повторная отправка с тем же client_message_id — обязательно тем же,
   * иначе бэкенд создаст второе сообщение вместо дедупликации ретрая.
   */
  function retrySend(clientMessageId) {
    const pending = pendingMessages.value.find((m) => m.client_message_id === clientMessageId)
    if (!pending) return
 
    setPendingStatus(clientMessageId, 'sending')
    chatService.postMessage(chatId, { client_message_id: clientMessageId, content: pending.content })
      .then(() => setPendingStatus(clientMessageId, 'sent'))
      .catch(() => setPendingStatus(clientMessageId, 'failed'))
  }
 
  return {
    messages,
    pendingMessages,
    isLoading,
    error,
    loadInitial,
    appendIncoming,
    sendMessage,
    retrySend
  }
}