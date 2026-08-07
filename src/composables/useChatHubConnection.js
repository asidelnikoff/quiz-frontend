import { ref, onBeforeUnmount } from 'vue'
import { createChatHubConnection } from './chatHubConnection'

/**
 * Управляет жизненным циклом соединения с ChatHub: старт, авто-реконнект (сам SignalR),
 * остановка при размонтировании компонента.
 */
export function useChatHubConnection({ baseUrl, getAccessToken }) {
  const connection = createChatHubConnection({ baseUrl, getAccessToken })
  const isConnected = ref(false)

  connection.onreconnected(() => {
    isConnected.value = true
  })
  connection.onreconnecting(() => {
    isConnected.value = false
  })
  connection.onclose(() => {
    isConnected.value = false
  })

  async function start() {
    try {
      await connection.start()
      isConnected.value = true
    } catch (e) {
      isConnected.value = false
      // Намеренно не пробрасываем ошибку дальше: список чатов должен работать
      // и без realtime-канала (просто не будет live-обновлений до следующей попытки).
      console.error('Не удалось подключиться к ChatHub', e)
    }
  }

  async function stop() {
    try {
      await connection.stop()
    } finally {
      isConnected.value = false
    }
  }

  onBeforeUnmount(() => {
    stop()
  })

  return { connection, isConnected, start, stop }
}