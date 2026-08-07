import { createChatHubConnection } from './chatHubConnection'
import { useAuthStore } from '@/stores/auth'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5126'

let connection = null
let startPromise = null

const getAccessToken = () => {
    return useAuthStore().getToken()
}

/**
 * Единое на всё приложение соединение с ChatHub — и список чатов, и открытое
 * окно переписки слушают события через один и тот же WebSocket, а не поднимают
 * каждый своё (см. обсуждение архитектуры: клиент держит одно WS-соединение).
 */
export function getChatHubConnection() {
  if (!connection) {
    connection = createChatHubConnection({ baseUrl: API_BASE, getAccessToken })
  }
  return connection
}

/**
 * Идемпотентный старт: если соединение уже установлено или устанавливается —
 * переиспользуем тот же промис, повторный вызов ничего не запускает заново.
 */
export function ensureChatHubStarted() {
  const conn = getChatHubConnection()

  if (conn.state === 'Connected') {
    return Promise.resolve()
  }

  if (!startPromise) {
    startPromise = conn.start().catch((e) => {
      startPromise = null
      console.error('Не удалось подключиться к ChatHub', e)
      throw e
    })
  }

  return startPromise
}