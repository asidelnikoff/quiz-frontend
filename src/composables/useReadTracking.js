import { ref, onBeforeUnmount } from 'vue'
import { debounce } from './debounce'
import chatService from '@/api/services/chatService'

const READ_REPORT_DEBOUNCE_MS = 800
const VISIBILITY_THRESHOLD = 0.6 // сообщение считается "увиденным", когда видно на 60%+

/**
 * Отслеживает появление непрочитанных входящих сообщений в области видимости
 * и отправляет PATCH .../messages/reads с максимальным увиденным seq —
 * не на каждое сообщение отдельно, а батчем (debounce), как обсуждали
 * при проектировании last_read_seq.
 *
 * Отслеживаются только чужие сообщения (is_sender === false): свои сообщения
 * не требуют отдельного подтверждения прочтения — предполагается, что бэкенд
 * сам продвигает last_read_seq отправителя при записи его же сообщения.
 */
export function useReadTracking(chatId) {
  const pendingMaxSeq = ref(null)
  let reportedSeq = 0
  const observedSeqByElement = new WeakMap()

  const reportDebounced = debounce(() => {
    flush()
  }, READ_REPORT_DEBOUNCE_MS)

  function flush() {
    if (pendingMaxSeq.value == null) return
    if (pendingMaxSeq.value <= reportedSeq) return

    const seqToSend = pendingMaxSeq.value
    reportedSeq = seqToSend

    chatService.patchMessagesReads(chatId, { seq: seqToSend }).catch((e) => {
      console.error('Не удалось отправить last_read', e)
      // Намеренно не откатываем reportedSeq: при появлении следующего, более
      // нового прочитанного сообщения отправится актуальный seq и перекроет пропуск.
    })
  }

  const observer = new IntersectionObserver(
    (entries) => {
      let advanced = false

      for (const entry of entries) {
        if (!entry.isIntersecting) continue

        const seq = observedSeqByElement.get(entry.target)
        if (seq == null) continue

        if (pendingMaxSeq.value == null || seq > pendingMaxSeq.value) {
          pendingMaxSeq.value = seq
          advanced = true
        }

        // Сообщение зафиксировано как увиденное — дальше не наблюдаем
        observer.unobserve(entry.target)
        observedSeqByElement.delete(entry.target)
      }

      if (advanced) reportDebounced()
    },
    { threshold: VISIBILITY_THRESHOLD }
  )

  /**
   * Вызывается из ref-колбэка на элементе сообщения в шаблоне.
   * Наблюдение имеет смысл только для непрочитанных чужих сообщений.
   */
  function observeMessageElement(element, message) {
    if (!element || !message) return
    if (message.is_sender) return
    if (message.is_read) return

    observedSeqByElement.set(element, message.seq)
    observer.observe(element)
  }

  onBeforeUnmount(() => {
    observer.disconnect()
    reportDebounced.cancel()
    // Дожимаем финальное значение синхронно при закрытии — иначе последняя
    // порция "увиденного" перед уходом с экрана не долетит из-за debounce.
    flush()
  })

  return { observeMessageElement }
}