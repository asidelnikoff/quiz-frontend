import { ref } from 'vue'
import chatService from '@/api/services/chatService'
import { generateClientMessageId } from '@/composables/id'

// Ленивая подгрузка — вынесено в константы для гибкой регулировки.
export const INITIAL_BEFORE_COUNT = 30 // контекст при первом открытии чата (до анкера)
export const LOAD_MORE_BEFORE_COUNT = 30 // сколько подгружать за один раз при скролле вверх

function sortBySeq(list) {
  return [...list].sort((a, b) => a.seq - b.seq)
}

function mergeUnique(existing, incoming) {
  const existingIds = new Set(existing.map((m) => m.id))
  const deduped = incoming.filter((m) => !existingIds.has(m.id))
  return sortBySeq([...existing, ...deduped])
}

export function useChatMessages(chatId) {
  const messages = ref([]) // подтверждённые сообщения, окно загруженной истории, упорядочены по seq
  const pendingMessages = ref([]) // свои сообщения, отправленные, но ещё не подтверждённые WS
  const chatName = ref(null)

  const isLoading = ref(false) // первичная загрузка / полная замена окна (jumpToLatest)
  const error = ref(null)

  const isLoadingOlder = ref(false) // подгрузка истории вверх
  // Оптимистично true после любой полной перезагрузки окна — точный ответ даёт
  // только первый вызов loadOlder() по факту (см. его тело): бэкенд не возвращает
  // явный флаг "есть ли ещё история", поэтому мы не пытаемся угадать это заранее.
  const hasMoreOlder = ref(true)

  // Гэп между тем, что загружено, и текущим "хвостом" чата — см. appendIncoming.
  const hasGap = ref(false)
  const unseenNewCount = ref(0)

  async function loadInitial() {
    isLoading.value = true
    error.value = null
    try {
      const response = (await chatService.getMessages(chatId, {
        from_seq: null,
        before_seq_count: INITIAL_BEFORE_COUNT,
        after_seq_count: null
      }))?.data
      chatName.value = response.chat?.name ?? null
      messages.value = sortBySeq(response.messages ?? [])
      hasMoreOlder.value = true
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Подгрузка более старой истории при скролле вверх — расширяет окно назад
   * от самого раннего из уже загруженных сообщений. Не трогает scroll —
   * компенсация позиции скролла при prepend делается в ChatWindow.vue,
   * потому что только там есть доступ к DOM-контейнеру.
   */
  async function loadOlder() {
    if (isLoadingOlder.value || !hasMoreOlder.value || messages.value.length === 0) return

    isLoadingOlder.value = true
    try {
      const oldestSeq = messages.value[0].seq
      const response = (await chatService.getMessages(chatId, {
        from_seq: oldestSeq,
        before_seq_count: LOAD_MORE_BEFORE_COUNT,
        after_seq_count: 0
      }))?.data
      const older = response.messages ?? []
      // Пришло меньше, чем запрашивали, — значит упёрлись в начало чата.
      if (older.length < LOAD_MORE_BEFORE_COUNT) hasMoreOlder.value = false
      messages.value = mergeUnique(messages.value, older)
    } catch (e) {
      console.error('Не удалось подгрузить более старую историю', e)
    } finally {
      isLoadingOlder.value = false
    }
  }

  /**
   * Возврат "к настоящему" — используется при разрешении гэпа (кнопка
   * "к новым сообщениям") и при отправке своего сообщения, если гэп уже был.
   * Полностью ЗАМЕНЯЕТ загруженное окно свежим хвостом чата, а не пытается
   * склеить два несмежных диапазона (история "до гэпа" отбрасывается —
   * её при необходимости можно снова подгрузить через loadOlder() вверх).
   */
  async function jumpToLatest() {
    isLoading.value = true
    error.value = null
    try {
      const response = (await chatService.getMessages(chatId, {
        from_seq: null,
        before_seq_count: INITIAL_BEFORE_COUNT,
        after_seq_count: null
      }))?.data
      chatName.value = response.chat?.name ?? chatName.value
      messages.value = sortBySeq(response.messages ?? [])
      hasMoreOlder.value = true
      hasGap.value = false
      unseenNewCount.value = 0
    } catch (e) {
      error.value = e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Добавляет сообщение, пришедшее через WS.
   *
   * Если это подтверждение одного из наших pending-сообщений (совпадение по
   * client_message_id) — убираем optimistic-версию (независимо от гэпа: это
   * своё сообщение, идентифицированное отдельным механизмом реконсиляции).
   *
   * Дальше — проверка на гэп: если "предпоследнее" относительно нового
   * сообщение (seq - 1) не совпадает с последним загруженным — значит окно
   * не доходит до хвоста чата (пользователь прокручен в историю). В этом
   * случае сообщение НЕ добавляется в список (это создало бы логический
   * разрыв в отображаемой последовательности), вместо этого выставляется
   * hasGap и счётчик — см. кнопку "к новым сообщениям" в ChatWindow.vue.
   */
  function appendIncoming(message) {
    if (message.client_message_id) {
      const pendingIndex = pendingMessages.value.findIndex(
        (m) => m.client_message_id === message.client_message_id
      )
      if (pendingIndex !== -1) {
        message.is_sender = true
        pendingMessages.value.splice(pendingIndex, 1)
      }
    }

    if (messages.value.some((m) => m.id === message.id)) return

    const maxLoadedSeq = messages.value.length > 0 ? messages.value[messages.value.length - 1].seq : null
    const isContiguous = maxLoadedSeq !== null && message.seq === maxLoadedSeq + 1

    if (!isContiguous) {
      hasGap.value = true
      unseenNewCount.value += 1
      return
    }

    messages.value = sortBySeq([...messages.value, message])
  }

  function setPendingStatus(clientMessageId, status) {
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
      setPendingStatus(clientMessageId, 'sent')
    } catch (e) {
      setPendingStatus(clientMessageId, 'failed')
    }
  }

  function retrySend(clientMessageId) {
    const pending = pendingMessages.value.find((m) => m.client_message_id === clientMessageId)
    if (!pending) return

    setPendingStatus(clientMessageId, 'sending')
    chatService.postMessage(chatId, { client_message_id: clientMessageId, content: pending.content })
      .then(() => setPendingStatus(clientMessageId, 'sent'))
      .catch(() => setPendingStatus(clientMessageId, 'failed'))
  }

  function setIsRead(request) {
    messages.value.filter(m => m.seq <= request.seq).forEach(m => m.is_read = true)
  }

  return {
    messages,
    pendingMessages,
    chatName,
    isLoading,
    error,
    isLoadingOlder,
    hasMoreOlder,
    hasGap,
    unseenNewCount,
    loadInitial,
    loadOlder,
    jumpToLatest,
    appendIncoming,
    sendMessage,
    retrySend,
    setIsRead
  }
}