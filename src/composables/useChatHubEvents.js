import { onMounted, onBeforeUnmount } from 'vue'
import { getChatHubConnection, ensureChatHubStarted } from './chatHubClient'

/**
 * Подписывает компонент на набор событий хаба через общее соединение
 * и аккуратно отписывается при размонтировании. Само соединение не закрывает —
 * оно живёт на всё приложение, компонент лишь регистрирует/снимает свои хендлеры.
 *
 * @param {Record<string, (payload: any) => void>} handlers - имя события -> обработчик
 */
export function useChatHubEvents(handlers) {
  const connection = getChatHubConnection()

  onMounted(() => {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      connection.on(eventName, handler)
    })
    ensureChatHubStarted()
  })

  onBeforeUnmount(() => {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      connection.off(eventName, handler)
    })
  })

  return { connection }
}